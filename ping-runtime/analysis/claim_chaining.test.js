/**
 * Claim-mission chaining test — forensics fix 2026-09-30 (item 5a).
 *
 * Proves the chaining RULE fires:
 *  1. An unverified CLAIM_CREATED proposes an INTELLIGENCE_RESEARCH mission
 *     via MissionRuntime with §6.1 payload fields (questions,
 *     claims_to_verify, evidence_requirements, output_schema, synthesis_rule).
 *  2. Correlation/causation lineage: mission payload carries the claim
 *     event's correlation_id and causation_id = the claim event id.
 *  3. A settled claim (verdict CONFIRMED) does NOT chain.
 *  4. Re-delivery of the same claim event does NOT duplicate the mission.
 *  5. An experiment hypothesis selects the EXPERIMENT_RUN label.
 */

const assert = require('assert');
const path = require('path');

const {
  MISSION_LABELS,
  needsFollowupResearch,
  selectMissionLabel,
  ClaimMissionChainer,
} = require('./claim_chaining.js');

let passed = 0;
let failed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log('  PASS ' + name); })
    .catch((e) => { failed++; console.log('  FAIL ' + name + ': ' + (e && e.message)); });
}

function makeHarness() {
  const handlers = {};
  const missions = [];
  const eventRuntime = {
    on: (type, h) => { handlers[type] = h; },
  };
  const missionRuntime = {
    create: async (missionType, payload, options) => {
      missions.push({ missionType, payload, options });
      return 'mission_' + String(missions.length).padStart(3, '0');
    },
  };
  const chainer = new ClaimMissionChainer({ eventRuntime, missionRuntime });
  chainer.start();
  return { handlers, missions, chainer };
}

function claimEvent(overrides = {}) {
  return {
    event_id: 'evt_claim_001',
    event_type: 'CLAIM_CREATED',
    source: 'claim',
    namespace: 'core::system',
    tenant_id: 'UNKNOWN',
    metadata: { correlation_id: 'corr_root_9', confidence: 0.4 },
    payload: {
      documentId: 'doc_7',
      claim: { text: 'Typesafe offers a public HTTP API for video metrics.' },
      upstreamEventId: 'evt_obs_001',
      ...overrides.payload,
    },
    ...overrides.event,
  };
}

async function main() {
  console.log('=== Claim Chaining Tests ===');

  await test('unverified claim proposes INTELLIGENCE_RESEARCH with §6.1 payload', async () => {
    const { handlers, missions } = makeHarness();
    const missionId = await handlers.CLAIM_CREATED(claimEvent());
    assert.strictEqual(missions.length, 1);
    const m = missions[0];
    assert.strictEqual(m.missionType, MISSION_LABELS.INTELLIGENCE_RESEARCH);
    assert.strictEqual(missionId, 'mission_001');
    const r = m.payload.research;
    assert.ok(Array.isArray(r.questions) && r.questions.length > 0, 'questions[]');
    assert.ok(Array.isArray(r.claims_to_verify) && r.claims_to_verify.length === 1, 'claims_to_verify[]');
    assert.strictEqual(r.claims_to_verify[0].claim_event_id, 'evt_claim_001');
    assert.ok(Array.isArray(r.evidence_requirements) && r.evidence_requirements.length > 0);
    assert.ok(r.output_schema && r.synthesis_rule, 'output_schema + synthesis_rule');
    assert.strictEqual(m.options.createdBy, 'claim-mission-chainer');
  });

  await test('correlation_id / causation_id lineage is threaded', async () => {
    const { handlers, missions } = makeHarness();
    await handlers.CLAIM_CREATED(claimEvent());
    const p = missions[0].payload;
    assert.strictEqual(p.correlation_id, 'corr_root_9', 'root correlation preserved');
    assert.strictEqual(p.causation_id, 'evt_claim_001', 'causation = the claim event');
    assert.strictEqual(p.event_type, MISSION_LABELS.INTELLIGENCE_RESEARCH);
  });

  await test('settled claim (CONFIRMED) does not chain', async () => {
    const { handlers, missions, chainer } = makeHarness();
    await handlers.CLAIM_CREATED(claimEvent({ payload: { claim: { text: 'x', verdict: 'CONFIRMED' } } }));
    assert.strictEqual(missions.length, 0, 'no mission for settled claim');
    assert.strictEqual(chainer.getStats().skippedSettled, 1);
    assert.ok(!needsFollowupResearch({ claim: { verdict: 'SUPPORTED' } }), 'SUPPORTED is settled too');
    assert.ok(needsFollowupResearch({ claim: { verdict: 'UNCLEAR' } }), 'UNCLEAR still needs follow-up');
    assert.ok(needsFollowupResearch({ claim: { text: 'no verdict yet' } }), 'thin payload = unverified');
  });

  await test('same claim event re-delivered does not duplicate the mission', async () => {
    const { handlers, missions, chainer } = makeHarness();
    await handlers.CLAIM_CREATED(claimEvent());
    await handlers.CLAIM_CREATED(claimEvent());
    assert.strictEqual(missions.length, 1, 'one mission per claim event');
    assert.strictEqual(chainer.getStats().skippedDuplicate, 1);
  });

  await test('experiment hypothesis selects EXPERIMENT_RUN', async () => {
    const { handlers, missions } = makeHarness();
    await handlers.CLAIM_CREATED(claimEvent({
      payload: { claim: { text: 'Posting at 7pm lifts reach.', experiment_hypothesis: true } },
    }));
    assert.strictEqual(missions.length, 1);
    assert.strictEqual(missions[0].missionType, MISSION_LABELS.EXPERIMENT_RUN);
    assert.strictEqual(selectMissionLabel({ claim: {} }), MISSION_LABELS.INTELLIGENCE_RESEARCH);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
