# Civilization Freeze Plan

**Date:** 2026-06-14
**Phase:** PING CONSTITUTIONAL STABILIZATION PHASE A
**Objective:** Create restoration capability before any modifications

---

## REPOSITORY SNAPSHOT STRATEGY

### PING Repository

**Location:** `C:\Users\nolan\PING`

**Snapshot Method:**
```bash
# Create git branch
cd C:\Users\nolan\PING
git checkout -b freeze-2026-06-14
git add .
git commit -m "FREEZE: Pre-constitutionalization snapshot"
git tag freeze-2026-06-14
```

**Rollback Method:**
```bash
# Restore from freeze
cd C:\Users\nolan\PING
git checkout freeze-2026-06-14
```

---

### Brain Repository

**Location:** `C:\Users\nolan\CascadeProjects\brain`

**Snapshot Method:**
```bash
# Create git branch
cd C:\Users\nolan\CascadeProjects\brain
git checkout -b freeze-2026-06-14
git add .
git commit -m "FREEZE: Pre-constitutionalization snapshot"
git tag freeze-2026-06-14
```

**Rollback Method:**
```bash
# Restore from freeze
cd C:\Users\nolan\CascadeProjects\brain
git checkout freeze-2026-06-14
```

---

### CRX-Digestion-Worker Repository

**Location:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker`

**Snapshot Method:**
```bash
# Create git branch
cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
git checkout -b freeze-2026-06-14
git add .
git commit -m "FREEZE: Pre-constitutionalization snapshot"
git tag freeze-2026-06-14
```

**Rollback Method:**
```bash
# Restore from freeze
cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
git checkout freeze-2026-06-14
```

---

### CRX-Newsletter-Brain Repository

**Location:** `C:\Users\nolan\CascadeProjects\crx-newsletter-brain`

**Snapshot Method:**
```bash
# Create git branch
cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
git checkout -b freeze-2026-06-14
git add .
git commit -m "FREEZE: Pre-constitutionalization snapshot"
git tag freeze-2026-06-14
```

**Rollback Method:**
```bash
# Restore from freeze
cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
git checkout freeze-2026-06-14
```

---

## BRANCH FREEZE STRATEGY

### Freeze Branch Naming Convention

**Format:** `freeze-YYYY-MM-DD`
**Example:** `freeze-2026-06-14`

### Freeze Branch Protection

**Rules:**
- Freeze branch is read-only after creation
- No commits to freeze branch
- No merges to freeze branch
- Freeze branch is for rollback only

### Working Branch Naming Convention

**Format:** `constitutional-stabilization-phase-{A-H}`
**Example:** `constitutional-stabilization-phase-A`

---

## DOCKER SNAPSHOT STRATEGY

### Docker Compose Snapshot

**Location:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker\docker-compose.yml`
**Location:** `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\docker-compose.yml`

**Snapshot Method:**
```bash
# Export docker-compose configuration
cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
cp docker-compose.yml docker-compose.yml.freeze

cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
cp docker-compose.yml docker-compose.yml.freeze
```

**Rollback Method:**
```bash
# Restore docker-compose configuration
cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
cp docker-compose.yml.freeze docker-compose.yml

cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
cp docker-compose.yml.freeze docker-compose.yml
```

---

### Docker Volume Snapshot

**Snapshot Method:**
```bash
# List all volumes
docker volume ls

# Backup each volume
docker run --rm -v crx_digestion_worker_data:/data -v $(pwd):/backup alpine tar czf /backup/digestion_worker_data.tar.gz /data
docker run --rm -v crx_newsletter_brain_data:/data -v $(pwd):/backup alpine tar czf /backup/newsletter_brain_data.tar.gz /data
```

**Rollback Method:**
```bash
# Restore each volume
docker run --rm -v crx_digestion_worker_data:/data -v $(pwd):/backup alpine tar xzf /backup/digestion_worker_data.tar.gz -C /
docker run --rm -v crx_newsletter_brain_data:/data -v $(pwd):/backup alpine tar xzf /backup/newsletter_brain_data.tar.gz -C /
```

---

## POSTGRESQL BACKUP STRATEGY

### PostgreSQL Connection Details

**Location:** PING Commit Service
**Database:** PostgreSQL (external)
**Connection:** Via PING Commit Service

**Snapshot Method:**
```bash
# Backup PostgreSQL database
pg_dump -h localhost -U postgres -d crx_runtime > postgres_backup_2026-06-14.sql

# Compress backup
gzip postgres_backup_2026-06-14.sql
```

**Rollback Method:**
```bash
# Restore PostgreSQL database
gunzip postgres_backup_2026-06-14.sql.gz
psql -h localhost -U postgres -d crx_runtime < postgres_backup_2026-06-14.sql
```

---

## SQLITE BACKUP STRATEGY

### CRX-Digestion-Worker SQLite

**Location:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db`

**Snapshot Method:**
```bash
# Backup SQLite database
cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
cp knowledge.db knowledge.db.freeze
sqlite3 knowledge.db ".backup knowledge.db.backup"
```

**Rollback Method:**
```bash
# Restore SQLite database
cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
cp knowledge.db.freeze knowledge.db
```

---

### CRX-Newsletter-Brain SQLite

**Location:** `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db`

**Snapshot Method:**
```bash
# Backup SQLite database
cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
cp newsletters.db newsletters.db.freeze
sqlite3 newsletters.db ".backup newsletters.db.backup"
```

**Rollback Method:**
```bash
# Restore SQLite database
cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
cp newsletters.db.freeze newsletters.db
```

---

## ENVIRONMENT BACKUP STRATEGY

### Environment Variables

**Location:** `.env` files in each repository

**Snapshot Method:**
```bash
# Backup .env files
cd C:\Users\nolan\PING
cp .env .env.freeze

cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
cp .env .env.freeze

cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
cp .env .env.freeze
```

**Rollback Method:**
```bash
# Restore .env files
cd C:\Users\nolan\PING
cp .env.freeze .env

cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
cp .env.freeze .env

cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
cp .env.freeze .env
```

---

## PROMPT ARCHIVE STRATEGY

### CRX-Digestion-Worker Prompts

**Location:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker\summarizer.py`

**Snapshot Method:**
```bash
# Extract prompts from code
cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
grep -A 10 "def process_article" summarizer.py > prompts.freeze
```

**Rollback Method:**
```bash
# Restore prompts from archive
# Manual review and restoration required
```

---

### CRX-Newsletter-Brain Prompts

**Location:** `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\summarizer.py`

**Snapshot Method:**
```bash
# Extract prompts from code
cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
grep -A 10 "def analyze_newsletter" summarizer.py > prompts.freeze
```

**Rollback Method:**
```bash
# Restore prompts from archive
# Manual review and restoration required
```

---

## OPERATIONAL SCRIPT ARCHIVE STRATEGY

### Operational Scripts

**Locations:**
- `C:\Users\nolan\PING\start.ps1`
- `C:\Users\nolan\PING\start.sh`
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\start.ps1`
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\start.sh`
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\start.ps1`
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\start.sh`

**Snapshot Method:**
```bash
# Backup operational scripts
cd C:\Users\nolan\PING
cp start.ps1 start.ps1.freeze
cp start.sh start.sh.freeze

cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
cp start.ps1 start.ps1.freeze
cp start.sh start.sh.freeze

cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
cp start.ps1 start.ps1.freeze
cp start.sh start.sh.freeze
```

**Rollback Method:**
```bash
# Restore operational scripts
cd C:\Users\nolan\PING
cp start.ps1.freeze start.ps1
cp start.sh.freeze start.sh

cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
cp start.ps1.freeze start.ps1
cp start.sh.freeze start.sh

cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
cp start.ps1.freeze start.ps1
cp start.sh.freeze start.sh
```

---

## RESTORATION VERIFICATION

### Verification Checklist

After restoration, verify:

- [ ] PING Gateway starts successfully
- [ ] PING Commit Service starts successfully
- [ ] PING Replay library loads successfully
- [ ] CRX RSS Worker starts successfully
- [ ] CRX Yahoo Worker starts successfully
- [ ] Dashboards load successfully
- [ ] SQLite databases are accessible
- [ ] PostgreSQL database is accessible
- [ ] Environment variables are correct
- [ ] Docker containers start successfully

---

## FREEZE EXECUTION ORDER

1. Create freeze branches for all repositories
2. Backup SQLite databases
3. Backup PostgreSQL database
4. Backup environment variables
5. Extract prompts
6. Backup operational scripts
7. Backup docker-compose configurations
8. Backup docker volumes
9. Verify all backups
10. Tag freeze branches

---

## ROLLBACK EXECUTION ORDER

1. Stop all running services
2. Restore freeze branches
3. Restore SQLite databases
4. Restore PostgreSQL database
5. Restore environment variables
6. Restore operational scripts
7. Restore docker-compose configurations
8. Restore docker volumes
9. Start all services
10. Verify all services

---

## REQUIREMENT

**Entire civilization must be recoverable.**

All backups must be verified before proceeding to Phase B.
