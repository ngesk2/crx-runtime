#!/bin/bash

# Civilization Restore Script
# PING CONSTITUTIONAL STABILIZATION PHASE A
# Date: 2026-06-14

set -e

echo "=== CIVILIZATION RESTORE STARTED ==="
echo "Date: $(date)"
echo ""

# Configuration
PING_DIR="C:/Users/nolan/PING"
BRAIN_DIR="C:/Users/nolan/CascadeProjects/brain"
DIGESTION_DIR="C:/Users/nolan/CascadeProjects/crx-digestion-worker"
NEWSLETTER_DIR="C:/Users/nolan/CascadeProjects/crx-newsletter-brain"
SNAPSHOT_DATE="2026-06-14"
FREEZE_BRANCH="freeze-${SNAPSHOT_DATE}"

# Snapshot directory
SNAPSHOT_DIR="C:/Users/nolan/CascadeProjects/brain/snapshots/${SNAPSHOT_DATE}"

if [ ! -d "$SNAPSHOT_DIR" ]; then
  echo "ERROR: Snapshot directory not found: $SNAPSHOT_DIR"
  exit 1
fi

echo "Snapshot directory: $SNAPSHOT_DIR"
echo "Freeze branch: $FREEZE_BRANCH"
echo ""

# Phase 1: Stop All Services
echo "=== PHASE 1: STOP ALL SERVICES ==="

# Note: This is a placeholder for stopping services
# Actual implementation depends on how services are started
echo "Stopping all services (placeholder)"
echo ""

# Phase 2: Restore Repository Branches
echo "=== PHASE 2: RESTORE REPOSITORY BRANCHES ==="

cd "$PING_DIR"
git checkout "$FREEZE_BRANCH"
echo "PING repository restored to branch: $FREEZE_BRANCH"

cd "$BRAIN_DIR"
git checkout "$FREEZE_BRANCH"
echo "Brain repository restored to branch: $FREEZE_BRANCH"

cd "$DIGESTION_DIR"
git checkout "$FREEZE_BRANCH"
echo "CRX-Digestion-Worker repository restored to branch: $FREEZE_BRANCH"

cd "$NEWSLETTER_DIR"
git checkout "$FREEZE_BRANCH"
echo "CRX-Newsletter-Brain repository restored to branch: $FREEZE_BRANCH"

echo ""

# Phase 3: Restore SQLite Databases
echo "=== PHASE 3: RESTORE SQLITE DATABASES ==="

cd "$DIGESTION_DIR"
if [ -f knowledge.db.freeze ]; then
  cp knowledge.db.freeze knowledge.db
  echo "CRX-Digestion-Worker SQLite restored"
fi

cd "$NEWSLETTER_DIR"
if [ -f newsletters.db.freeze ]; then
  cp newsletters.db.freeze newsletters.db
  echo "CRX-Newsletter-Brain SQLite restored"
fi

echo ""

# Phase 4: Restore PostgreSQL Database
echo "=== PHASE 4: RESTORE POSTGRESQL DATABASE ==="

# Note: PostgreSQL restore requires psql
# This is a placeholder for the actual restore command
# psql -h localhost -U postgres -d crx_runtime < "$SNAPSHOT_DIR/postgres_backup_${SNAPSHOT_DATE}.sql"
echo "PostgreSQL restore placeholder (requires psql)"
echo "Location: $SNAPSHOT_DIR/postgres_backup_${SNAPSHOT_DATE}.sql"

echo ""

# Phase 5: Restore Environment Variables
echo "=== PHASE 5: RESTORE ENVIRONMENT VARIABLES ==="

cd "$PING_DIR"
if [ -f .env.freeze ]; then
  cp .env.freeze .env
  echo "PING .env restored"
fi

cd "$DIGESTION_DIR"
if [ -f .env.freeze ]; then
  cp .env.freeze .env
  echo "CRX-Digestion-Worker .env restored"
fi

cd "$NEWSLETTER_DIR"
if [ -f .env.freeze ]; then
  cp .env.freeze .env
  echo "CRX-Newsletter-Brain .env restored"
fi

echo ""

# Phase 6: Restore Operational Scripts
echo "=== PHASE 6: RESTORE OPERATIONAL SCRIPTS ==="

cd "$PING_DIR"
if [ -f start.ps1.freeze ]; then
  cp start.ps1.freeze start.ps1
  echo "PING start.ps1 restored"
fi
if [ -f start.sh.freeze ]; then
  cp start.sh.freeze start.sh
  echo "PING start.sh restored"
fi

cd "$DIGESTION_DIR"
if [ -f start.ps1.freeze ]; then
  cp start.ps1.freeze start.ps1
  echo "CRX-Digestion-Worker start.ps1 restored"
fi
if [ -f start.sh.freeze ]; then
  cp start.sh.freeze start.sh
  echo "CRX-Digestion-Worker start.sh restored"
fi

cd "$NEWSLETTER_DIR"
if [ -f start.ps1.freeze ]; then
  cp start.ps1.freeze start.ps1
  echo "CRX-Newsletter-Brain start.ps1 restored"
fi
if [ -f start.sh.freeze ]; then
  cp start.sh.freeze start.sh
  echo "CRX-Newsletter-Brain start.sh restored"
fi

echo ""

# Phase 7: Restore Docker Compose Configurations
echo "=== PHASE 7: RESTORE DOCKER COMPOSE CONFIGURATIONS ==="

cd "$DIGESTION_DIR"
if [ -f docker-compose.yml.freeze ]; then
  cp docker-compose.yml.freeze docker-compose.yml
  echo "CRX-Digestion-Worker docker-compose.yml restored"
fi

cd "$NEWSLETTER_DIR"
if [ -f docker-compose.yml.freeze ]; then
  cp docker-compose.yml.freeze docker-compose.yml
  echo "CRX-Newsletter-Brain docker-compose.yml restored"
fi

echo ""

# Phase 8: Restore Docker Volumes
echo "=== PHASE 8: RESTORE DOCKER VOLUMES ==="

# Note: Docker volume restore requires docker to be running
# This is a placeholder for the actual restore command
# docker run --rm -v crx_digestion_worker_data:/data -v "$SNAPSHOT_DIR":/backup alpine tar xzf /backup/digestion_worker_data.tar.gz -C /
# docker run --rm -v crx_newsletter_brain_data:/data -v "$SNAPSHOT_DIR":/backup alpine tar xzf /backup/newsletter_brain_data.tar.gz -C /
echo "Docker volume restore placeholder (requires docker)"
echo "Location: $SNAPSHOT_DIR/"

echo ""

# Phase 9: Start All Services
echo "=== PHASE 9: START ALL SERVICES ==="

# Note: This is a placeholder for starting services
# Actual implementation depends on how services are started
echo "Starting all services (placeholder)"
echo ""

# Phase 10: Verification
echo "=== PHASE 10: VERIFICATION ==="

echo "Verification checklist:"
echo "  [ ] PING Gateway starts successfully"
echo "  [ ] PING Commit Service starts successfully"
echo "  [ ] PING Replay library loads successfully"
echo "  [ ] CRX RSS Worker starts successfully"
echo "  [ ] CRX Yahoo Worker starts successfully"
echo "  [ ] Dashboards load successfully"
echo "  [ ] SQLite databases are accessible"
echo "  [ ] PostgreSQL database is accessible"
echo "  [ ] Environment variables are correct"
echo "  [ ] Docker containers start successfully"
echo ""
echo "Manual verification required."
echo ""

echo "=== CIVILIZATION RESTORE COMPLETED ==="
echo "Snapshot date: $SNAPSHOT_DATE"
echo "Freeze branch: $FREEZE_BRANCH"
echo ""
echo "Please verify all services are operational."
