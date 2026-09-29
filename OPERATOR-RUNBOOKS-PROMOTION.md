# OPERATOR RUNBOOKS: GATEWAY PROMOTION

**Date:** 2026-09-24
**Scope:** ping-gateway releases on ping-core-01 only
**Status:** DRAFT - for Nolan's review. Not an enforced procedure yet.

**Context (as of 2026-09-24):**
- Live: `ping-gateway:candidate-3c5d280dd` @ `sha256:4aa9d7f669bcd46ddfdf81e3baaf519bb3b3338d585e535b975d7f865cd0f8f2`
- Verified rollback: `ping-gateway:candidate-84486f056`
- Image policy (Nolan 2026-09-22, tightened 2026-09-23): keep exactly the live image
  plus ONE verified rollback until `candidate-3c5d280dd` is reproducible from source.
- Compose source of truth: `worktrees/oracle-assembly/infrastructure/oracle/docker-compose.oracle.yml`
  (Pig repo). The compose file must describe reality; see GATEWAY-COMPOSE-CONVERGENCE.md.

---

## RUNBOOK: Promote a new gateway image

**Purpose:** Ship a vetted gateway image to production with a healthcheck-gated
cutover and a retained rollback, without ever deploying unvetted code.

**Preconditions:**
- The candidate image is vetted: built from a known source SHA, health battery green,
  signed-write checks pass (per the 2026-09-21 promotion record pattern).
- The verified rollback image is present on the host
  (`docker images` shows `ping-gateway:candidate-84486f056`).
- The compose file is updated FIRST: digest-pinned `image:` line for the new
  candidate, proven healthcheck params, explicit `name: oracle_ping_internal`.
- `docker compose -p oracle config` renders clean (only expected unset-var warnings).
- Pending candidate `jev/verdict-authority-hardening @ fffe99f7a4174cc694c65c9ac1b0b00b4332bf2f`
  may be promoted ONLY with PRODUCTION GATE CLOSURE as acceptance criteria
  (Nolan 2026-09-23 directive). It is not covered by a standing go-ahead.

**Commands:**
```bash
# 1. Tag the vetted image and record its digest (names only, no secrets leave the box)
docker tag <source-ref> ping-gateway:candidate-<shortsha>
DIGEST=$(docker inspect ping-gateway:candidate-<shortsha> --format '{{.Id}}')
echo "$DIGEST"

# 2. Update the compose file: image: ping-gateway:candidate-<shortsha>@<digest>
#    Keep the build: block as provenance documentation. Never `compose build`
#    or `up --build` as the release path.

# 3. Side-port rehearsal: same digest, same env names, isolated port, distinct name
docker run -d --name ping-gateway-rehearsal \
  --network oracle_ping_internal \
  -p 127.0.0.1:8081:8080 \
  --env-file /opt/ping/releases/<current>/ping-oracle-clean-snapshot/infrastructure/oracle/.env \
  ping-gateway:candidate-<shortsha>@<digest>

# 4. Health battery on the rehearsal port
for i in $(seq 1 12); do
  curl -sf http://127.0.0.1:8081/health && break || sleep 10
done

# 5. Env value equality vs live WITHOUT reading secrets into logs (hash compare)
diff <(docker exec ping-gateway env | sort | sha256sum) \
     <(docker exec ping-gateway-rehearsal env | sort | sha256sum) \
  && echo ENV_HASH_MATCH || echo ENV_HASH_MISMATCH_INVESTIGATE

# 6. Tear down the rehearsal
docker rm -f ping-gateway-rehearsal

# 7. Cutover: rename live aside (rollback retained), then bring up the new one
docker rename ping-gateway ping-gateway-precutover
docker compose -p oracle -f <compose-path> up -d gateway

# 8. Health gate (same battery as the 2026-09-24 OPS-002 proof): healthy within
#    the proven window, /health 200. If unhealthy, roll back immediately:
#    docker rm -f ping-gateway && docker rename ping-gateway-precutover ping-gateway \
#      && docker start ping-gateway

# 9. Soak: keep ping-gateway-precutover until the new container is healthy and
#    stable per the image policy, then remove it. Never remove the verified
#    rollback image ping-gateway:candidate-84486f056.

# 10. Record the promotion: one row in deployment_registry
#     (image tag, digest, source SHA, timestamp, operator, rollback image held),
#     plus a daily-log entry. deployment_registry gets a row per promotion.
```

**Expected Output:**
- Rehearsal container healthy on 127.0.0.1:8081, /health 200
- Env hash match (names AND values identical to live)
- Cutover container: compose labels present (project oracle, service gateway),
  image digest identical to the pinned digest, 1g/1g memory limits, healthcheck healthy
- `docker compose -p oracle ps` lists gateway running
- Rollback container retained until healthy, then removed after soak
- deployment_registry has exactly one new row for this promotion

**Verification Steps:**
```bash
# Digest identity (the single riskiest divergence per the convergence trace)
docker inspect ping-gateway --format '{{.Image}}'
# expect sha256:<pinned digest>

# Compose now manages the fleet
docker compose -p oracle -f <compose-path> ps
# expect gateway running with compose labels

# Health
curl -sf http://127.0.0.1:8080/health && echo GATEWAY_HEALTHY

# Rollback retained until soak passes
docker ps -a --format '{{.Names}} {{.Image}}' | grep precutover
```

---

## RUNBOOK: Roll back the gateway

**Purpose:** Return to the previous known-good container after a failed promotion.

**Commands:**
```bash
# The pre-cutover container was retained by the promotion runbook above.
docker rm -f ping-gateway
docker rename ping-gateway-precutover ping-gateway
docker start ping-gateway
# Health gate again: /health 200 within the proven window.
# Record the rollback in deployment_registry and the daily log, with the
# acceptance item that failed and the diff that caused it. Do not retry blindly.
```

**Expected Output:**
- ping-gateway running the previous image, healthy, /health 200
- Failed promotion recorded with cause; no blind retry

**Rollback policy (Nolan's standing rules):**
- Non-security regression: roll back to the previous held image
  (currently `ping-gateway:candidate-84486f056`).
- Security-relevant failure: roll to "route closed" (stop serving), NEVER back to
  a known-ungated image.
- Never roll back to, or deploy, an unvetted image. Unvetted build output such as
  `oracle-gateway:latest` (built on-box 2026-09-24 11:50 UTC, removed same day)
  must never be deployed as a release.

---

## Standing rules (never do)

- Never `docker compose up`, `up --build`, or `compose build` as a release path.
  The compose file's `build:` block is provenance documentation; releases deploy
  the digest-pinned `image:` only.
- Never deploy an image that is not digest-pinned in the compose file.
- Never promote the pending `jev/verdict-authority-hardening` candidate without
  PRODUCTION GATE CLOSURE acceptance (separate mission, Nolan's directive).
- Never adopt the live container into compose by labeling it in place; labels are
  set at creation. Adoption goes through the cutover runbook above.
- Never delete the live image or the one verified rollback image.
- deployment_registry gets one row per promotion. No promotion without a row.

**Proven primitives (do not reinvent):**
- `docker restart ping-gateway` is the proven restart (gw-restart-proof.sh, 21s recovery).
- `gw-recreate2.sh` is the proven recreate-with-rollback script (rename-aside pattern).
