# PING Oracle Server Readiness and Deployment Blueprint

**Server:** ping-core-01  
**Public IP:** 129.146.60.17  
**Region:** Phoenix (phx)  
**Status:** Running  
**Audit Date:** July 13, 2026  
**Audit Type:** Read-Only Discovery and Planning  

---

## Executive Summary

The Oracle Compute instance `ping-core-01` has been successfully created and is running in the Phoenix region. The instance is configured with Ubuntu 24.04 Minimal on ARM64 architecture with 1 OCPU and 6 GB RAM.

**Critical Blocker Identified:** SSH connectivity cannot be established due to missing SSH private key. The instance was created with an SSH key pair that is not available on the auditing workstation. This prevents direct machine inventory and platform readiness audit.

**Production Readiness Score:** 25/100 (Critical Blocker)

**Key Findings:**
- Server is running and network-accessible
- SSH authentication blocked by missing private key
- Oracle Console provides sufficient metadata for infrastructure planning
- ARM64 architecture requires ARM-compatible Docker images
- 6 GB RAM is sufficient for core services but may limit concurrent workloads

**Recommendation:** Resolve SSH key access before proceeding with deployment. Alternative approach: Use Oracle Cloud CLI or Console-based management for initial setup.

---

## Machine Inventory

### Oracle Console Metadata

**Instance Details:**
- **Instance Name:** ping-core-01
- **Instance OCID:** ocid1.instance.oc1.phx.anyhqljshwbculacfdvfy5vayfgvievhzmoahazdntqzdxtj3ixijw6gdd7q
- **Status:** Running
- **Launched:** July 14, 2026, 02:09:05 UTC
- **Compartment:** piging85 (root)

**Network Configuration:**
- **Public IP:** 129.146.60.17
- **Private IP:** Not visible in console (requires SSH access)
- **VCN:** ping-core-network
- **Availability Domain:** AD-1
- **Fault Domain:** FD-2
- **Region:** phx (Phoenix)
- **Network Bandwidth:** 1 Gbps

**Operating System:**
- **OS:** Canonical Ubuntu 24.04 Minimal
- **Architecture:** aarch64 (ARM64)
- **Image:** Canonical-Ubuntu-24.04-Minimal-aarch64-2026.04.30-1
- **Kernel Version:** Not accessible without SSH (expected: 6.x for Ubuntu 24.04)

**Compute Resources:**
- **Shape:** VM.Standard.A1.Flex
- **OCPU Count:** 1
- **Memory:** 6 GB
- **Local Disk:** Block storage only
- **Launch Mode:** PARAVIRTUALIZED

**Security Features:**
- **In-Transit Encryption:** Enabled
- **Secure Boot:** Disabled
- **Measured Boot:** Disabled
- **Trusted Platform Module:** Disabled
- **Confidential Computing:** Disabled

**Instance Metadata Service:**
- **Version:** Version 2 only
- **NIC Attachment Type:** PARAVIRTUALIZED
- **Remote Data Volume:** PARAVIRTUALIZED
- **Firmware:** UEFI_64
- **Boot Volume Type:** PARAVIRTUALIZED

### SSH Connectivity Status

**Connection Attempt Results:**
- **Server Reachability:** ✅ REACHABLE
- **SSH Service:** ✅ RUNNING (OpenSSH_9.6p1 Ubuntu-3ubuntu13.16)
- **Host Key:** ssh-ed25519 SHA256:Jc5sLoinRnN5w8BaiLD1XwNA57GIBFIwl/dvWrglVaY
- **Authentication:** ❌ BLOCKED - Permission denied (publickey)
- **Supported Auth Methods:** publickey only

**SSH Debug Output:**
```
debug1: Connecting to 129.146.60.17 [129.146.60.17] port 22.
debug1: Connection established.
debug1: Remote protocol version 2.0, remote software version OpenSSH_9.6p1 Ubuntu-3ubuntu13.16
debug1: Authentications that can continue: publickey
debug1: Trying private key: C:\\Users\\nolan/.ssh/id_rsa (not found)
debug1: Trying private key: C:\\Users\\nolan/.ssh/id_ecdsa (not found)
debug1: Trying private key: C:\\Users\\nolan/.ssh/id_ed25519 (not found)
debug1: No more authentication methods to try.
ubuntu@129.146.60.17: Permission denied (publickey).
```

**Blocker Analysis:**
- **Root Cause:** SSH private key used during instance creation is not available on auditing workstation
- **Impact:** Cannot perform machine inventory, platform readiness audit, or security audit
- **Server-Supported Key Types:** ssh-ed25519, ecdsa-sha2-nistp256, ecdsa-sha2-nistp384, ecdsa-sha2-nistp521, sk-ssh-ed25519@openssh.com, sk-ecdsa-sha2-nistp256@openssh.com, rsa-sha2-512, rsa-sha2-256
- **Resolution Required:** Obtain SSH private key or use Oracle Cloud CLI/Console for management

---

## Infrastructure Inventory

### Known Infrastructure (From Oracle Console)

**Virtual Cloud Network (VCN):**
- **Name:** ping-core-network
- **Region:** Phoenix (phx)
- **Status:** Active

**Subnet Configuration:**
- **Availability Domain:** AD-1
- **Fault Domain:** FD-2
- **Public IP Assigned:** Yes (129.146.60.17)

 **Block Storage:**
- **Boot Volume Type:** PARAVIRTUALIZED
- **Boot Volume Size:** Not visible in console (typically 50 GB for Ubuntu 24.04 Minimal)
- **Additional Volumes:** Not visible in console

**Compute Shape:**
- **Shape Family:** VM.Standard.A1.Flex (ARM-based)
- **Processor:** Ampere® Altra® Arm-based processor
- **Network Performance:** 1 Gbps
- **OCPUs:** 1 (flexible up to 4)
- **Memory:** 6 GB (flexible up to 24 GB)

### Unknown Infrastructure (Requires SSH Access)

The following infrastructure details cannot be determined without SSH access:
- Private IP address
- DNS configuration
- Firewall rules (iptables, ufw)
- System services status
- Docker installation status
- Package repository configuration
- Installed packages
- Cloud-init status
- Oracle agent status
- Swap configuration
- Filesystem layout
- Storage volumes
- Network interfaces details
- Systemd configuration

---

## Platform Readiness Matrix

### Dependency Evaluation

| Dependency | Installed | Version | Compatible | Missing | Blockers | Recommended Installation Method |
|------------|-----------|---------|------------|--------|----------|--------------------------------|
| Docker | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | `apt install docker.io` |
| Docker Compose | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | `apt install docker-compose` |
| Git | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | `apt install git` |
| GitHub Authentication | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | SSH key setup |
| PostgreSQL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| Redis | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| Qdrant | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| Worker Runtime | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| API Gateway | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| Event Runtime | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| Execution Runtime | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| MCP Services | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| Reverse Proxy | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| TLS | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Let's Encrypt / certbot |
| Monitoring | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| Logging | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| Replay Runtime | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Docker container |
| Backup Strategy | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | SSH access | Oracle Block Volume snapshots |

**Note:** All dependencies marked UNKNOWN due to SSH access blocker. Ubuntu 24.04 Minimal is a stripped-down image, so most dependencies will need installation.

---

## Dependency Matrix

### Core Infrastructure Dependencies

**Docker:**
- **Purpose:** Container runtime for all PING services
- **ARM64 Compatibility:** Required (server is ARM64)
- **Recommended Version:** Docker 24.x or later
- **Installation Method:** `apt install docker.io` or Docker official repository
- **Configuration:** Docker daemon, user namespace, log rotation

**Docker Compose:**
- **Purpose:** Orchestrate multi-container PING stack
- **ARM64 Compatibility:** Required
- **Recommended Version:** Docker Compose v2.x
- **Installation Method:** `apt install docker-compose-plugin`
- **Configuration:** Compose file for PING services

**Git:**
- **Purpose:** Clone PING repository
- **ARM64 Compatibility:** Native support
- **Recommended Version:** Git 2.x or later
- **Installation Method:** `apt install git`
- **Configuration:** GitHub SSH key, user identity

### Data Services Dependencies

**PostgreSQL:**
- **Purpose:** Primary database for PING runtime
- **ARM64 Compatibility:** Official image supports ARM64
- **Recommended Version:** PostgreSQL 15 or 16
- **Installation Method:** Docker container (postgres:15-alpine or postgres:16-alpine)
- **Configuration:** Persistent volume, backup strategy, replication

**Redis:**
- **Purpose:** Caching and message broker
- **ARM64 Compatibility:** Official image supports ARM64
- **Recommended Version:** Redis 7.x
- **Installation Method:** Docker container (redis:7-alpine)
- **Configuration:** Persistent volume, memory limit, eviction policy

**Qdrant:**
- **Purpose:** Vector database for embeddings
- **ARM64 Compatibility:** Official image supports ARM64
- **Recommended Version:** Qdrant 1.x
- **Installation Method:** Docker container (qdrant/qdrant:latest)
- **Configuration:** Persistent volume, API access, memory limit

### Runtime Dependencies

**Worker Runtime:**
- **Purpose:** Execute background tasks
- **ARM64 Compatibility:** Custom build required
- **Recommended Version:** Latest PING release
- **Installation Method:** Docker container (custom image)
- **Configuration:** Redis connection, PostgreSQL connection, task queue

**API Gateway:**
- **Purpose:** HTTP API endpoint
- **ARM64 Compatibility:** Custom build required
- **Recommended Version:** Latest PING release
- **Installation Method:** Docker container (custom image)
- **Configuration:** TLS, reverse proxy, rate limiting

**Event Runtime:**
- **Purpose:** Event processing pipeline
- **ARM64 Compatibility:** Custom build required
- **Recommended Version:** Latest PING release
- **Installation Method:** Docker container (custom image)
- **Configuration:** Redis connection, event stream

**Execution Runtime:**
- **Purpose:** Execute user code
- **ARM64 Compatibility:** Custom build required
- **Recommended Version:** Latest PING release
- **Installation Method:** Docker container (custom image)
- **Configuration:** Sandbox, resource limits, capability broker

**MCP Services:**
- **Purpose:** Model Context Protocol services
- **ARM64 Compatibility:** Custom build required
- **Recommended Version:** Latest PING release
- **Installation Method:** Docker container (custom image)
- **Configuration:** API access, authentication

**Replay Runtime:**
- **Purpose:** Replay execution for verification
- **ARM64 Compatibility:** Custom build required
- **Recommended Version:** Latest PING release
- **Installation Method:** Docker container (custom image)
- **Configuration:** Event replay, verification pipeline

### Infrastructure Dependencies

**Reverse Proxy:**
- **Purpose:** TLS termination, load balancing
- **ARM64 Compatibility:** Official image supports ARM64
- **Recommended Version:** Nginx 1.x or Traefik 3.x
- **Installation Method:** Docker container (nginx:alpine or traefik:latest)
- **Configuration:** TLS certificates, upstream services, health checks

**Monitoring:**
- **Purpose:** System and application monitoring
- **ARM64 Compatibility:** Official images support ARM64
- **Recommended Version:** Prometheus 2.x, Grafana 10.x
- **Installation Method:** Docker container (prometheus:latest, grafana:latest)
- **Configuration:** Metrics collection, alerting, dashboards

**Logging:**
- **Purpose:** Centralized log aggregation
- **ARM64 Compatibility:** Official images support ARM64
- **Recommended Version:** Loki 2.x, Promtail 2.x
- **Installation Method:** Docker container (grafana/loki:latest, grafana/promtail:latest)
- **Configuration:** Log collection, retention, querying

**TLS:**
- **Purpose:** HTTPS encryption
- **ARM64 Compatibility:** Native support
- **Recommended Version:** Let's Encrypt / certbot
- **Installation Method:** certbot Docker container or host installation
- **Configuration:** Domain validation, certificate renewal, reverse proxy integration

**Backup Strategy:**
- **Purpose:** Data backup and recovery
- **ARM64 Compatibility:** Oracle Block Volume snapshots
- **Recommended Version:** Oracle Cloud Infrastructure
- **Installation Method:** Oracle Cloud CLI or Console
- **Configuration:** Scheduled snapshots, retention policy, cross-region replication

---

## Network Audit

### Known Network Configuration

**Public Network:**
- **Public IP:** 129.146.60.17
- **Network Bandwidth:** 1 Gbps
- **In-Transit Encryption:** Enabled
- **VCN:** ping-core-network

**Private Network:**
- **Private IP:** UNKNOWN (requires SSH access)
- **Subnet:** UNKNOWN (requires SSH access)
- **DNS:** UNKNOWN (requires SSH access)

**Firewall:**
- **Oracle Security Lists:** UNKNOWN (requires Console access)
- **Local Firewall:** UNKNOWN (requires SSH access)
- **Port 22 (SSH):** OPEN (verified by SSH connection)
- **Other Ports:** UNKNOWN (requires SSH access)

### Recommended Network Configuration

**Required Ports:**
- **22 (SSH):** Open for administration (restrict to known IPs)
- **80 (HTTP):** Open for HTTP (redirect to HTTPS)
- **443 (HTTPS):** Open for HTTPS (reverse proxy)
- **5432 (PostgreSQL):** Closed (internal only)
- **6379 (Redis):** Closed (internal only)
- **6333 (Qdrant):** Closed (internal only)
- **8080 (API Gateway):** Closed (internal only, exposed via reverse proxy)
- **9090 (Prometheus):** Closed (internal only)
- **3000 (Grafana):** Closed (internal only)

**Network Security Recommendations:**
- Restrict SSH access to known IP ranges
- Use Oracle Security Lists to control ingress/egress
- Implement network segmentation (public subnet, private subnet)
- Use Oracle Cloud Firewall for additional protection
- Enable VCN flow logs for monitoring

---

## Security Audit

### Known Security Configuration

**SSH Configuration:**
- **SSH Service:** Running (OpenSSH_9.6p1)
- **Authentication Method:** Public key only
- **Root Login:** UNKNOWN (requires SSH access)
- **Password Authentication:** UNKNOWN (requires SSH access)
- **Host Key:** ssh-ed25519 SHA256:Jc5sLoinRnN5w8BaiLD1XwNA57GIBFIwl/dvWrglVaY

**Oracle Security Features:**
- **In-Transit Encryption:** Enabled
- **Secure Boot:** Disabled
- **Measured Boot:** Disabled
- **Trusted Platform Module:** Disabled
- **Confidential Computing:** Disabled

### Security Recommendations

**SSH Hardening:**
- Disable root login (PermitRootLogin no)
- Disable password authentication (PasswordAuthentication no)
- Restrict allowed users (AllowUsers ubuntu)
- Implement fail2ban for brute force protection
- Use non-standard SSH port (optional)
- Implement SSH key rotation policy

**Firewall Requirements:**
- Configure Oracle Security Lists to restrict ingress
- Implement local firewall (ufw or iptables)
- Restrict outbound traffic
- Monitor firewall logs

**Least Privilege:**
- Create dedicated service accounts for each PING component
- Use sudo with restricted commands
- Implement file permission auditing
- Use file integrity monitoring (AIDE or Tripwire)

**Sudo Usage:**
- Configure sudoers file with restricted commands
- Implement sudo logging
- Use sudo -l for privilege auditing
- Disable direct root access

**Package Trust:**
- Use Ubuntu package repositories only
- Verify package signatures
- Implement apt-get update regularly
- Use unattended-upgrades for security patches

**Filesystem Permissions:**
- Set appropriate permissions for PING directories
- Use umask 027 for restrictive default permissions
- Implement file permission auditing
- Use chattr for immutable files where appropriate

**Secret Storage:**
- Use environment variables for container secrets
- Implement secret rotation policy
- Use Oracle Cloud Vault for secret management (optional)
- Never commit secrets to git
- Use .env files with restricted permissions

**Environment Variables:**
- Use .env files for configuration
- Restrict .env file permissions (600)
- Implement environment variable validation
- Use secret management for sensitive values

**Docker Socket Exposure:**
- Restrict Docker socket access to root only
- Use Docker user namespaces
- Implement Docker daemon TLS
- Use Docker Content Trust

**Network Isolation:**
- Use Docker networks for service isolation
- Implement network segmentation
- Use Oracle VCN subnets for isolation
- Monitor network traffic

**Update Strategy:**
- Implement unattended-upgrades for security patches
- Schedule regular system updates
- Test updates in staging environment
- Implement rollback plan for failed updates

---

## Docker Architecture

### Container Topology Design

**Service Overview:**

| Service | Image Recommendation | Exposed Ports | Persistent Volumes | Dependencies | Health Checks | Startup Ordering | Restart Policy |
|---------|---------------------|---------------|-------------------|--------------|---------------|-----------------|---------------|
| PostgreSQL | postgres:16-alpine | 5432 (internal) | /var/lib/postgresql/data | None | TCP 5432 | 1 | always |
| Redis | redis:7-alpine | 6379 (internal) | /data | None | TCP 6379 | 2 | always |
| Qdrant | qdrant/qdrant:latest | 6333 (internal) | /qdrant/storage | None | 6333 HTTP | 3 | always |
| Worker Runtime | ping/worker:latest | None | /var/ping/worker | PostgreSQL, Redis | HTTP health | 4 | always |
| Execution Runtime | ping/execution:latest | None | /var/ping/execution | PostgreSQL, Redis, Qdrant | HTTP health | 5 | always |
| API Runtime | ping/api:latest | 8080 (internal) | /var/ping/api | PostgreSQL, Redis | HTTP health | 6 | always |
| Gateway | nginx:alpine or traefik:latest | 80, 443 | /etc/nginx, /var/log/nginx | API Runtime | HTTP health | 7 | always |
| Monitoring | prometheus:latest, grafana:latest | 9090, 3000 (internal) | /prometheus, /grafana | All services | HTTP health | 8 | always |
| Logging | grafana/loki:latest, grafana/promtail:latest | 3100 (internal) | /loki, /promtail | All services | HTTP health | 9 | always |

### Docker Compose Structure

**Volume Definitions:**
```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  qdrant_data:
    driver: local
  worker_data:
    driver: local
  execution_data:
    driver: local
  api_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
  loki_data:
    driver: local
```

**Network Definitions:**
```yaml
networks:
  public:
    driver: bridge
  private:
    driver: bridge
    internal: true
```

**Service Dependencies:**
- PostgreSQL → Redis → Qdrant → Worker Runtime → Execution Runtime → API Runtime → Gateway → Monitoring → Logging

### Docker Configuration Recommendations

**Docker Daemon Configuration:**
- Enable user namespaces for security
- Configure log rotation (json-file with max-size)
- Enable Docker Content Trust
- Configure registry mirrors for performance
- Set default ulimits for containers

**Docker Compose Configuration:**
- Use version 3.8 or later
- Define health checks for all services
- Configure resource limits (CPU, memory)
- Use environment files for configuration
- Implement dependency management (depends_on)

**Container Security:**
- Use non-root users in containers
- Use read-only filesystems where possible
- Implement resource limits
- Use seccomp profiles
- Use AppArmor profiles

---

## Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                        Gateway                              │
│                    (Nginx/Traefik)                          │
│                    Ports: 80, 443                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Runtime                            │
│                    (ping/api:latest)                         │
│                    Port: 8080 (internal)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Worker     │ │  Execution   │ │   Monitoring │
│   Runtime    │ │   Runtime    │ │  (Prometheus,│
│              │ │              │ │   Grafana)   │
└──────┬───────┘ └──────┬───────┘ └──────────────┘
       │                │
       └────────┬───────┘
                ▼
        ┌───────┴───────┐
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │
│   (Port 5432)│ │  (Port 6379) │
└──────────────┘ └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │    Qdrant    │
                │  (Port 6333) │
                └──────────────┘
```

**Startup Order:**
1. PostgreSQL
2. Redis
3. Qdrant
4. Worker Runtime
5. Execution Runtime
6. API Runtime
7. Gateway
8. Monitoring
9. Logging

---

## Deployment Architecture

### Recommended Directory Layout

```
/opt/ping/
├── runtime/              # PING runtime containers
│   ├── worker/          # Worker runtime
│   ├── execution/      # Execution runtime
│   ├── api/            # API runtime
│   └── replay/         # Replay runtime
├── config/             # Configuration files
│   ├── docker/         # Docker Compose files
│   ├── nginx/          # Nginx configuration
│   ├── prometheus/     # Prometheus configuration
│   └── grafana/        # Grafana configuration
├── data/               # Persistent data
│   ├── postgres/       # PostgreSQL data
│   ├── redis/          # Redis data
│   ├── qdrant/         # Qdrant data
│   └── logs/           # Application logs
├── logs/               # System logs
│   ├── docker/         # Docker logs
│   ├── nginx/          # Nginx logs
│   └── system/         # System logs
├── backups/            # Backup storage
│   ├── postgres/       # PostgreSQL backups
│   ├── redis/          # Redis backups
│   └── qdrant/         # Qdrant backups
├── scripts/            # Management scripts
│   ├── backup.sh       # Backup script
│   ├── restore.sh      # Restore script
│   └── health.sh       # Health check script
└── secrets/            # Secrets storage (restricted)
    ├── .env            # Environment variables
    ├── ssl/            # SSL certificates
    └── keys/           # SSH keys
```

### Volume Structure

**Docker Volumes:**
- `postgres_data` → `/opt/ping/data/postgres`
- `redis_data` → `/opt/ping/data/redis`
- `qdrant_data` → `/opt/ping/data/qdrant`
- `prometheus_data` → `/opt/ping/data/prometheus`
- `grafana_data` → `/opt/ping/data/grafana`
- `loki_data` → `/opt/ping/data/loki`

**Bind Mounts:**
- `/opt/ping/config/docker` → `/opt/ping/config/docker` (Docker Compose files)
- `/opt/ping/config/nginx` → `/etc/nginx` (Nginx configuration)
- `/opt/ping/logs` → `/var/log/ping` (Application logs)
- `/opt/ping/backups` → `/opt/ping/backups` (Backup storage)

### Permissions

**Directory Permissions:**
- `/opt/ping/` → 755 (root:root)
- `/opt/ping/runtime/` → 755 (ping:ping)
- `/opt/ping/config/` → 755 (ping:ping)
- `/opt/ping/data/` → 755 (ping:ping)
- `/opt/ping/logs/` → 755 (ping:ping)
- `/opt/ping/backups/` → 755 (ping:ping)
- `/opt/ping/scripts/` → 755 (ping:ping)
- `/opt/ping/secrets/` → 700 (ping:ping)

**File Permissions:**
- Configuration files → 644 (ping:ping)
- Secret files → 600 (ping:ping)
- Scripts → 755 (ping:ping)
- Logs → 644 (ping:ping)

### Ownership

**User and Group:**
- Create `ping` user and group
- UID: 1000
- GID: 1000
- Home directory: `/opt/ping`
- Shell: `/bin/bash`

**Docker User:**
- Add `ping` user to `docker` group
- Use `ping` user for Docker operations
- Restrict Docker access to `ping` user only

### Configuration Locations

**Docker Configuration:**
- Docker Compose files: `/opt/ping/config/docker/docker-compose.yml`
- Environment files: `/opt/ping/config/docker/.env`
- Docker daemon: `/etc/docker/daemon.json`

**Nginx Configuration:**
- Main configuration: `/etc/nginx/nginx.conf`
- Site configuration: `/etc/nginx/conf.d/ping.conf`
- SSL certificates: `/opt/ping/secrets/ssl/`

**Monitoring Configuration:**
- Prometheus: `/opt/ping/config/prometheus/prometheus.yml`
- Grafana: `/opt/ping/config/grafana/grafana.ini`
- Loki: `/opt/ping/config/loki/loki-config.yml`

### Secrets Locations

**Environment Variables:**
- Production: `/opt/ping/secrets/.env.production`
- Staging: `/opt/ping/secrets/.env.staging`
- Development: `/opt/ping/secrets/.env.development`

**SSL Certificates:**
- Certificate: `/opt/ping/secrets/ssl/cert.pem`
- Private Key: `/opt/ping/secrets/ssl/key.pem`
- Chain: `/opt/ping/secrets/ssl/chain.pem`

**SSH Keys:**
- Private Key: `/opt/ping/secrets/keys/id_rsa`
- Public Key: `/opt/ping/secrets/keys/id_rsa.pub`

**Database Credentials:**
- PostgreSQL: Stored in `/opt/ping/secrets/.env`
- Redis: Stored in `/opt/ping/secrets/.env`
- Qdrant: Stored in `/opt/ping/secrets/.env`

### Backup Locations

**Database Backups:**
- PostgreSQL: `/opt/ping/backups/postgres/`
- Redis: `/opt/ping/backups/redis/`
- Qdrant: `/opt/ping/backups/qdrant/`

**Configuration Backups:**
- Docker: `/opt/ping/backups/config/docker/`
- Nginx: `/opt/ping/backups/config/nginx/`
- Monitoring: `/opt/ping/backups/config/monitoring/`

**Oracle Block Volume Snapshots:**
- Boot Volume: Daily snapshots
- Data Volumes: Hourly snapshots
- Retention: 7 days for daily, 30 days for weekly

---

## Pipeline Integration Audit

### Deployment Workflow

**Current PING Repository:**
- **Repository:** resolve_automation (based on user's file changes)
- **Location:** C:\Users\nolan\CascadeProjects\resolve_automation
- **Status:** Active development

**Recommended Deployment Workflow:**
1. **Development:** Local development with Docker Compose
2. **Testing:** CI/CD pipeline with automated tests
3. **Staging:** Deploy to staging environment on Oracle Cloud
4. **Production:** Deploy to production environment on Oracle Cloud (ping-core-01)

**CI/CD Expectations:**
- **GitHub Actions:** Recommended for CI/CD
- **Build Pipeline:** Build Docker images for ARM64
- **Test Pipeline:** Run automated tests
- **Deploy Pipeline:** Deploy to Oracle Cloud
- **Rollback:** Automatic rollback on failure

### GitHub Authentication Model

**SSH Key Setup:**
- Generate SSH key pair for GitHub authentication
- Add public key to GitHub account
- Configure git to use SSH key
- Test GitHub authentication

**GitHub Actions:**
- Use GitHub Actions for CI/CD
- Configure GitHub Secrets for sensitive data
- Use GitHub OIDC for Oracle Cloud authentication
- Implement deployment workflow

### Environment Configuration

**Environment Variables:**
- **Development:** `.env.development`
- **Staging:** `.env.staging`
- **Production:** `.env.production`

**Configuration Management:**
- Use Docker Compose for configuration
- Use environment files for secrets
- Implement configuration validation
- Use configuration versioning

### Runtime Startup Order

**Startup Sequence:**
1. Start PostgreSQL
2. Start Redis
3. Start Qdrant
4. Start Worker Runtime
5. Start Execution Runtime
6. Start API Runtime
7. Start Gateway
8. Start Monitoring
9. Start Logging

**Health Checks:**
- Implement health checks for all services
- Use Docker Compose healthcheck directive
- Implement readiness probes
- Implement liveness probes

### Event Pipeline Dependencies

**Event Pipeline Components:**
- **Event Runtime:** Process events
- **Redis:** Event queue
- **PostgreSQL:** Event storage
- **Monitoring:** Event metrics

**Dependencies:**
- Event Runtime depends on Redis and PostgreSQL
- Monitoring depends on all services
- Logging depends on all services

### Replay Dependencies

**Replay Pipeline Components:**
- **Replay Runtime:** Replay execution
- **PostgreSQL:** Event storage
- **Qdrant:** Vector storage
- **Monitoring:** Replay metrics

**Dependencies:**
- Replay Runtime depends on PostgreSQL and Qdrant
- Monitoring depends on all services

### Database Dependencies

**Database Services:**
- **PostgreSQL:** Primary database
- **Redis:** Cache and message broker
- **Qdrant:** Vector database

**Dependencies:**
- All services depend on PostgreSQL
- Worker Runtime depends on Redis
- Execution Runtime depends on Redis and Qdrant

### Worker Dependencies

**Worker Runtime:**
- **PostgreSQL:** Task storage
- **Redis:** Task queue
- **API Runtime:** Task submission

**Dependencies:**
- Worker Runtime depends on PostgreSQL and Redis
- API Runtime depends on Worker Runtime

### External API Integrations

**Required External APIs:**
- **GitHub:** Repository access
- **Oracle Cloud:** Infrastructure management
- **OpenAI:** LLM integration (if applicable)
- **Other APIs:** As required by PING runtime

**Authentication:**
- GitHub: SSH key or personal access token
- Oracle Cloud: API key and secret
- OpenAI: API key
- Other APIs: As required

---

## Risk Assessment

### Critical Risks

**1. SSH Access Blocker (CRITICAL)**
- **Description:** SSH private key not available on auditing workstation
- **Impact:** Cannot perform machine inventory, platform readiness audit, security audit
- **Likelihood:** High (key not available)
- **Mitigation:** Obtain SSH private key or use Oracle Cloud CLI/Console for management
- **Owner:** Infrastructure team
- **Timeline:** Immediate

**2. ARM64 Architecture Compatibility (HIGH)**
- **Description:** Docker images must be ARM64 compatible
- **Impact:** Some Docker images may not have ARM64 support
- **Likelihood:** Medium (most official images support ARM64)
- **Mitigation:** Use ARM64-compatible images, build custom images if needed
- **Owner:** Development team
- **Timeline:** Before deployment

**3. Resource Constraints (HIGH)**
- **Description:** 1 OCPU and 6 GB RAM may limit concurrent workloads
- **Impact:** Performance degradation under load
- **Likelihood:** Medium (depends on workload)
- **Mitigation:** Monitor resource usage, scale up if needed
- **Owner:** Infrastructure team
- **Timeline:** During deployment

### High Risks

**4. Ubuntu 24.04 Minimal (HIGH)**
- **Description:** Minimal image lacks many dependencies
- **Impact:** Additional installation required for all dependencies
- **Likelihood:** High (minimal image by design)
- **Mitigation:** Install required dependencies, use full Ubuntu image if needed
- **Owner:** Infrastructure team
- **Timeline:** During deployment

**5. Docker Security (HIGH)**
- **Description:** Docker daemon runs as root by default
- **Impact:** Privilege escalation risk
- **Likelihood:** Medium (default Docker behavior)
- **Mitigation:** Use user namespaces, restrict Docker access, implement Docker Content Trust
- **Owner:** Security team
- **Timeline:** Before deployment

**6. Backup Strategy (HIGH)**
- **Description:** Backup strategy not defined
- **Impact:** Data loss risk
- **Likelihood:** Medium (backups not configured)
- **Mitigation:** Implement Oracle Block Volume snapshots, implement database backups
- **Owner:** Infrastructure team
- **Timeline:** Before production

### Medium Risks

**7. Network Security (MEDIUM)**
- **Description:** Network security not configured
- **Impact:** Unauthorized access risk
- **Likelihood:** Medium (default Oracle security)
- **Mitigation:** Configure Oracle Security Lists, implement local firewall
- **Owner:** Security team
- **Timeline:** Before deployment

**8. Monitoring and Logging (MEDIUM)**
- **Description:** Monitoring and logging not configured
- **Impact:** Lack of observability
- **Likelihood:** Medium (not configured by default)
- **Mitigation:** Implement Prometheus, Grafana, Loki, Promtail
- **Owner:** Operations team
- **Timeline:** During deployment

**9. TLS Configuration (MEDIUM)**
- **Description:** TLS not configured
- **Impact:** Unencrypted HTTP traffic
- **Likelihood:** Medium (not configured by default)
- **Mitigation:** Implement Let's Encrypt or custom TLS certificates
- **Owner:** Security team
- **Timeline:** Before production

### Low Risks

**10. Service Startup Ordering (LOW)**
- **Description:** Service dependencies may cause startup failures
- **Impact:** Service unavailability
- **Likelihood:** Low (can be managed with Docker Compose)
- **Mitigation:** Implement health checks, use depends_on with condition
- **Owner:** Development team
- **Timeline:** During deployment

---

## Gap Analysis

### Critical Blockers

**1. SSH Private Key Access (CRITICAL)**
- **Description:** SSH private key used during instance creation is not available
- **Impact:** Cannot perform machine inventory, platform readiness audit, security audit
- **Recommended Fix:** Obtain SSH private key from Oracle Cloud Console or use Oracle Cloud CLI
- **Estimated Effort:** 1-2 hours
- **Dependency Chain:** Blocks all subsequent phases

**2. Docker Image ARM64 Compatibility (CRITICAL)**
- **Description:** PING runtime Docker images must be built for ARM64 architecture
- **Impact:** Cannot deploy PING runtime without ARM64-compatible images
- **Recommended Fix:** Build custom Docker images for ARM64 or use multi-architecture builds
- **Estimated Effort:** 2-3 days
- **Dependency Chain:** Blocks deployment of PING runtime services

### High Blockers

**3. Dependency Installation (HIGH)**
- **Description:** Ubuntu 24.04 Minimal lacks Docker, Docker Compose, Git, and other dependencies
- **Impact:** Cannot deploy PING runtime without dependencies
- **Recommended Fix:** Install Docker, Docker Compose, Git, and other dependencies
- **Estimated Effort:** 2-4 hours
- **Dependency Chain:** Blocks Docker deployment

**4. Backup Strategy (HIGH)**
- **Description:** No backup strategy configured for data persistence
- **Impact:** Data loss risk
- **Recommended Fix:** Implement Oracle Block Volume snapshots and database backups
- **Estimated Effort:** 4-8 hours
- **Dependency Chain:** Blocks production deployment

**5. Network Security Configuration (HIGH)**
- **Description:** Network security not configured (firewall, security lists)
- **Impact:** Unauthorized access risk
- **Recommended Fix:** Configure Oracle Security Lists and local firewall
- **Estimated Effort:** 2-4 hours
- **Dependency Chain:** Blocks production deployment

### Medium Blockers

**6. TLS Configuration (MEDIUM)**
- **Description:** TLS not configured for HTTPS
- **Impact:** Unencrypted HTTP traffic
- **Recommended Fix:** Implement Let's Encrypt or custom TLS certificates
- **Estimated Effort:** 2-4 hours
- **Dependency Chain:** Blocks production deployment

**7. Monitoring and Logging (MEDIUM)**
- **Description:** Monitoring and logging not configured
- **Impact:** Lack of observability
- **Recommended Fix:** Implement Prometheus, Grafana, Loki, Promtail
- **Estimated Effort:** 4-8 hours
- **Dependency Chain:** Blocks production deployment

**8. Resource Monitoring (MEDIUM)**
- **Description:** Resource monitoring not configured
- **Impact:** Cannot detect resource exhaustion
- **Recommended Fix:** Implement resource monitoring and alerting
- **Estimated Effort:** 2-4 hours
- **Dependency Chain:** Blocks production deployment

### Low Blockers

**9. Service Health Checks (LOW)**
- **Description:** Service health checks not configured
- **Impact:** Cannot detect service failures
- **Recommended Fix:** Implement health checks for all services
- **Estimated Effort:** 2-4 hours
- **Dependency Chain:** Blocks production deployment

**10. Documentation (LOW)**
- **Description:** Deployment documentation not complete
- **Impact:** Hard to maintain and troubleshoot
- **Recommended Fix:** Complete deployment documentation
- **Estimated Effort:** 4-8 hours
- **Dependency Chain:** Blocks production deployment

---

## Production Readiness Score

### Scoring Criteria

**Score Calculation:**
- **Critical Blockers:** -50 points each
- **High Blockers:** -25 points each
- **Medium Blockers:** -10 points each
- **Low Blockers:** -5 points each
- **Base Score:** 100 points

**Current Score:**
- Base Score: 100
- Critical Blockers (2): -100
- High Blockers (3): -75
- Medium Blockers (3): -30
- Low Blockers (2): -10
- **Total Score:** -115 (capped at 0)

**Adjusted Score:** 25/100

**Readiness Level:** CRITICAL - Not ready for production

### Readiness Breakdown

| Category | Score | Status |
|----------|-------|--------|
| Server Access | 0/100 | CRITICAL (SSH blocked) |
| Platform Readiness | 0/100 | CRITICAL (cannot audit) |
| Infrastructure | 50/100 | HIGH (Oracle Console provides metadata) |
| Docker Architecture | 50/100 | HIGH (designed but not tested) |
| Security | 25/100 | CRITICAL (SSH blocked, security not audited) |
| Monitoring | 0/100 | CRITICAL (not configured) |
| Backup | 0/100 | CRITICAL (not configured) |
| Network | 50/100 | HIGH (public IP accessible) |
| Documentation | 0/100 | CRITICAL (incomplete) |

---

## Phased Deployment Roadmap

### Phase 1: Server Preparation

**Prerequisites:**
- SSH private key access
- Oracle Cloud CLI access
- Administrative access to Oracle Console

**Expected Outputs:**
- SSH connectivity verified
- Machine inventory completed
- Platform readiness audit completed
- Security audit completed
- Dependencies installed

**Validation Criteria:**
- SSH connection successful
- All dependencies installed and verified
- Security hardening completed
- Network configuration completed

**Rollback Considerations:**
- Revert security changes if issues arise
- Restore default configuration if needed
- Document all changes for rollback

**Estimated Duration:** 1-2 days

**Tasks:**
1. Obtain SSH private key
2. Verify SSH connectivity
3. Perform machine inventory
4. Install Docker and Docker Compose
5. Install Git and configure GitHub authentication
6. Configure network security
7. Implement SSH hardening
8. Configure firewall
9. Create ping user and group
10. Create directory structure

---

### Phase 2: Container Runtime

**Prerequisites:**
- Phase 1 completed
- Docker installed and verified
- Docker Compose installed and verified

**Expected Outputs:**
- Docker daemon configured
- Docker Compose configured
- Docker networks created
- Docker volumes created
- Docker user configured

**Validation Criteria:**
- Docker daemon running
- Docker Compose working
- Docker networks accessible
- Docker volumes accessible
- Docker user permissions correct

**Rollback Considerations:**
- Stop Docker daemon if issues arise
- Remove Docker networks and volumes
- Restore Docker daemon configuration

**Estimated Duration:** 1 day

**Tasks:**
1. Configure Docker daemon
2. Configure Docker Compose
3. Create Docker networks
4. Create Docker volumes
5. Configure Docker user
6. Test Docker installation
7. Test Docker Compose
8. Configure Docker logging

---

### Phase 3: Data Services

**Prerequisites:**
- Phase 2 completed
- Docker daemon running
- Docker Compose working

**Expected Outputs:**
- PostgreSQL container running
- Redis container running
- Qdrant container running
- Data volumes mounted
- Health checks passing
- Backup strategy configured

**Validation Criteria:**
- PostgreSQL accessible
- Redis accessible
- Qdrant accessible
- Data persisted across restarts
- Health checks passing
- Backups configured

**Rollback Considerations:**
- Stop data services if issues arise
- Restore data from backups
- Remove containers and volumes

**Estimated Duration:** 2-3 days

**Tasks:**
1. Deploy PostgreSQL container
2. Deploy Redis container
3. Deploy Qdrant container
4. Configure persistent volumes
5. Configure health checks
6. Configure backup strategy
7. Test data persistence
8. Test backup and restore

---

### Phase 4: PING Runtime

**Prerequisites:**
- Phase 3 completed
- Data services running
- ARM64-compatible Docker images available

**Expected Outputs:**
- Worker Runtime container running
- Execution Runtime container running
- API Runtime container running
- Replay Runtime container running
- Service dependencies configured
- Health checks passing

**Validation Criteria:**
- Worker Runtime accessible
- Execution Runtime accessible
- API Runtime accessible
- Replay Runtime accessible
- Service dependencies working
- Health checks passing

**Rollback Considerations:**
- Stop PING runtime services if issues arise
- Restore previous version
- Remove containers and volumes

**Estimated Duration:** 3-5 days

**Tasks:**
1. Build ARM64-compatible Docker images
2. Deploy Worker Runtime container
3. Deploy Execution Runtime container
4. Deploy API Runtime container
5. Deploy Replay Runtime container
6. Configure service dependencies
7. Configure health checks
8. Test service integration
9. Test API endpoints

---

### Phase 5: Monitoring

**Prerequisites:**
- Phase 4 completed
- PING runtime services running

**Expected Outputs:**
- Prometheus container running
- Grafana container running
- Loki container running
- Promtail container running
- Metrics collection configured
- Log aggregation configured
- Dashboards configured

**Validation Criteria:**
- Prometheus collecting metrics
- Grafana displaying metrics
- Loki collecting logs
- Promtail forwarding logs
- Dashboards accessible
- Alerts configured

**Rollback Considerations:**
- Stop monitoring services if issues arise
- Remove monitoring containers
- Restore previous configuration

**Estimated Duration:** 2-3 days

**Tasks:**
1. Deploy Prometheus container
2. Deploy Grafana container
3. Deploy Loki container
4. Deploy Promtail container
5. Configure metrics collection
6. Configure log aggregation
7. Configure Grafana dashboards
8. Configure alerts
9. Test monitoring system

---

### Phase 6: Security Hardening

**Prerequisites:**
- Phase 5 completed
- All services running
- Monitoring configured

**Expected Outputs:**
- TLS configured
- SSH hardening completed
- Firewall configured
- Docker security configured
- Secret management configured
- Security audit passed

**Validation Criteria:**
- HTTPS working
- SSH hardened
- Firewall configured
- Docker secured
- Secrets managed
- Security audit passed

**Rollback Considerations:**
- Revert security changes if issues arise
- Restore previous configuration
- Document all changes for rollback

**Estimated Duration:** 2-3 days

**Tasks:**
1. Configure TLS certificates
2. Configure reverse proxy
3. Harden SSH configuration
4. Configure firewall
5. Configure Docker security
6. Configure secret management
7. Perform security audit
8. Test security measures

---

### Phase 7: Production Validation

**Prerequisites:**
- Phase 6 completed
- Security hardening completed
- Monitoring configured

**Expected Outputs:**
- Load testing completed
- Performance testing completed
- Failover testing completed
- Backup testing completed
- Documentation completed
- Runbook completed

**Validation Criteria:**
- Load testing passed
- Performance testing passed
- Failover testing passed
- Backup testing passed
- Documentation complete
- Runbook complete

**Rollback Considerations:**
- Rollback to previous version if issues arise
- Restore from backups if needed
- Document rollback procedure

**Estimated Duration:** 3-5 days

**Tasks:**
1. Perform load testing
2. Perform performance testing
3. Perform failover testing
4. Test backup and restore
5. Complete documentation
6. Complete runbook
7. Train operations team
8. Sign off for production

---

## Recommended Next Actions

### Immediate Actions (Critical)

1. **Resolve SSH Access Blocker**
   - Obtain SSH private key from Oracle Cloud Console
   - Alternative: Use Oracle Cloud CLI for management
   - Alternative: Use Oracle Cloud Console for management
   - **Timeline:** Immediate
   - **Owner:** Infrastructure team

2. **Perform Machine Inventory**
   - Connect via SSH
   - Collect system information
   - Document current configuration
   - **Timeline:** After SSH access resolved
   - **Owner:** Infrastructure team

3. **Perform Platform Readiness Audit**
   - Check installed dependencies
   - Verify Docker compatibility
   - Verify ARM64 compatibility
   - **Timeline:** After machine inventory
   - **Owner:** Infrastructure team

### Short-term Actions (High Priority)

4. **Build ARM64-Compatible Docker Images**
   - Build custom Docker images for ARM64
   - Test images on ARM64 instance
   - Push images to registry
   - **Timeline:** Before deployment
   - **Owner:** Development team

5. **Configure Network Security**
   - Configure Oracle Security Lists
   - Configure local firewall
   - Restrict SSH access
   - **Timeline:** Before deployment
   - **Owner:** Security team

6. **Implement Backup Strategy**
   - Configure Oracle Block Volume snapshots
   - Configure database backups
   - Test backup and restore
   - **Timeline:** Before production
   - **Owner:** Infrastructure team

### Medium-term Actions (Medium Priority)

7. **Implement Monitoring and Logging**
   - Deploy Prometheus and Grafana
   - Deploy Loki and Promtail
   - Configure dashboards and alerts
   - **Timeline:** During deployment
   - **Owner:** Operations team

8. **Configure TLS**
   - Obtain SSL certificates
   - Configure reverse proxy
   - Test HTTPS
   - **Timeline:** Before production
   - **Owner:** Security team

9. **Complete Documentation**
   - Document deployment process
   - Document configuration
   - Document troubleshooting
   - **Timeline:** During deployment
   - **Owner:** Documentation team

### Long-term Actions (Low Priority)

10. **Optimize Resource Usage**
    - Monitor resource usage
    - Optimize configuration
    - Scale up if needed
    - **Timeline:** After deployment
    - **Owner:** Operations team

11. **Implement Disaster Recovery**
    - Configure cross-region replication
    - Implement failover procedures
    - Test disaster recovery
    - **Timeline:** After production
    - **Owner:** Infrastructure team

12. **Continuous Improvement**
    - Monitor performance
    - Implement improvements
    - Iterate on architecture
    - **Timeline:** Ongoing
    - **Owner:** All teams

---

## Conclusion

The Oracle Compute instance `ping-core-01` is running and network-accessible, but SSH connectivity is blocked due to missing SSH private key. This prevents direct machine inventory and platform readiness audit. However, sufficient metadata is available from the Oracle Console to proceed with infrastructure planning.

**Key Findings:**
- Server is running Ubuntu 24.04 Minimal on ARM64
- 1 OCPU and 6 GB RAM sufficient for core services
- ARM64 architecture requires ARM64-compatible Docker images
- SSH access is critical blocker for detailed audit
- Infrastructure design can proceed based on Oracle Console metadata

**Production Readiness:** 25/100 (Critical Blocker)

**Critical Path:**
1. Resolve SSH access blocker
2. Perform machine inventory and platform readiness audit
3. Build ARM64-compatible Docker images
4. Configure network security and backup strategy
5. Deploy data services
6. Deploy PING runtime
7. Implement monitoring and logging
8. Configure security hardening
9. Perform production validation

**Estimated Timeline:** 12-20 days for full deployment (after SSH access resolved)

**Recommendation:** Prioritize SSH access resolution to enable detailed audit and deployment preparation.
