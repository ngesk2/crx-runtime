#!/bin/bash

# Civilization Snapshot Script
# PING CONSTITUTIONAL STABILIZATION PHASE A
# Date: 2026-06-14

set -e

echo "=== CIVILIZATION SNAPSHOT STARTED ==="
echo "Date: $(date)"
echo ""

# Configuration
PING_DIR="C:/Users/nolan/PING"
BRAIN_DIR="C:/Users/nolan/CascadeProjects/brain"
DIGESTION_DIR="C:/Users/nolan/CascadeProjects/crx-digestion-worker"
NEWSLETTER_DIR="C:/Users/nolan/CascadeProjects/crx-newsletter-brain"
SNAPSHOT_DATE="2026-06-14"
FREEZE_BRANCH="freeze-${SNAPSHOT_DATE}"

# Create snapshot directory
SNAPSHOT_DIR="C:/Users/nolan/CascadeProjects/brain/snapshots/${SNAPSHOT_DATE}"
mkdir -p "$SNAPSHOT_DIR"

echo "Snapshot directory: $SNAPSHOT_DIR"
echo ""

# Phase 1: Repository Snapshots
echo "=== PHASE 1: REPOSITORY SNAPSHOTS ==="

cd "$PING_DIR"
git checkout -b "$FREEZE_BRANCH" || git checkout "$FREEZE_BRANCH"
git add .
git commit -m "FREEZE: Pre-constitutionalization snapshot" || echo "No changes to commit"
git tag "$FREEZE_BRANCH"
echo "PING repository frozen at branch: $FREEZE_BRANCH"

cd "$BRAIN_DIR"
git checkout -b "$FREEZE_BRANCH" || git checkout "$FREEZE_BRANCH"
git add .
git commit -m "FREEZE: Pre-constitutionalization snapshot" || echo "No changes to commit"
git tag "$FREEZE_BRANCH"
echo "Brain repository frozen at branch: $FREEZE_BRANCH"

cd "$DIGESTION_DIR"
git checkout -b "$FREEZE_BRANCH" || git checkout "$FREEZE_BRANCH"
git add .
git commit -m "FREEZE: Pre-constitutionalization snapshot" || echo "No changes to commit"
git tag "$FREEZE_BRANCH"
echo "CRX-Digestion-Worker repository frozen at branch: $FREEZE_BRANCH"

cd "$NEWSLETTER_DIR"
git checkout -b "$FREEZE_BRANCH" || git checkout "$FREEZE_BRANCH"
git add .
git commit -m "FREEZE: Pre-constitutionalization snapshot" || echo "No changes to commit"
git tag "$FREEZE_BRANCH"
echo "CRX-Newsletter-Brain repository frozen at branch: $FREEZE_BRANCH"

echo ""

# Phase 2: SQLite Backups
echo "=== PHASE 2: SQLITE BACKUPS ==="

cd "$DIGESTION_DIR"
cp knowledge.db knowledge.db.freeze
sqlite3 knowledge.db ".backup knowledge.db.backup"
cp knowledge.db.backup "$SNAPSHOT_DIR/digestion_knowledge.db.backup"
echo "CRX-Digestion-Worker SQLite backed up"

cd "$NEWSLETTER_DIR"
cp newsletters.db newsletters.db.freeze
sqlite3 newsletters.db ".backup newsletters.db.backup"
cp newsletters.db.backup "$SNAPSHOT_DIR/newsletter_newsletters.db.backup"
echo "CRX-Newsletter-Brain SQLite backed up"

echo ""

# Phase 3: PostgreSQL Backup
echo "=== PHASE 3: POSTGRESQL BACKUP ==="

# Note: PostgreSQL backup requires pg_dump
# This is a placeholder for the actual backup command
# pg_dump -h localhost -U postgres -d crx_runtime > "$SNAPSHOT_DIR/postgres_backup_${SNAPSHOT_DATE}.sql"
echo "PostgreSQL backup placeholder (requires pg_dump)"
echo "Location: $SNAPSHOT_DIR/postgres_backup_${SNAPSHOT_DATE}.sql"

echo ""

# Phase 4: Environment Backups
echo "=== PHASE 4: ENVIRONMENT BACKUPS ==="

cd "$PING_DIR"
if [ -f .env ]; then
  cp .env .env.freeze
  cp .env "$SNAPSHOT_DIR/ping.env"
  echo "PING .env backed up"
fi

cd "$DIGESTION_DIR"
if [ -f .env ]; then
  cp .env .env.freeze
  cp .env "$SNAPSHOT_DIR/digestion.env"
  echo "CRX-Digestion-Worker .env backed up"
fi

cd "$NEWSLETTER_DIR"
if [ -f .env ]; then
  cp .env .env.freeze
  cp .env "$SNAPSHOT_DIR/newsletter.env"
  echo "CRX-Newsletter-Brain .env backed up"
fi

echo ""

# Phase 5: Prompt Archives
echo "=== PHASE 5: PROMPT ARCHIVES ==="

cd "$DIGESTION_DIR"
grep -A 10 "def process_article" summarizer.py > "$SNAPSHOT_DIR/digestion_prompts.txt" || echo "No prompts found"
echo "CRX-Digestion-Worker prompts archived"

cd "$NEWSLETTER_DIR"
grep -A 10 "def analyze_newsletter" summarizer.py > "$SNAPSHOT_DIR/newsletter_prompts.txt" || echo "No prompts found"
echo "CRX-Newsletter-Brain prompts archived"

echo ""

# Phase 6: Operational Script Archives
echo "=== PHASE 6: OPERATIONAL SCRIPT ARCHIVES ==="

cd "$PING_DIR"
if [ -f start.ps1 ]; then
  cp start.ps1 start.ps1.freeze
  cp start.ps1 "$SNAPSHOT_DIR/ping_start.ps1"
fi
if [ -f start.sh ]; then
  cp start.sh start.sh.freeze
  cp start.sh "$SNAPSHOT_DIR/ping_start.sh"
fi
echo "PING operational scripts backed up"

cd "$DIGESTION_DIR"
if [ -f start.ps1 ]; then
  cp start.ps1 start.ps1.freeze
  cp start.ps1 "$SNAPSHOT_DIR/digestion_start.ps1"
fi
if [ -f start.sh ]; then
  cp start.sh start.sh.freeze
  cp start.sh "$SNAPSHOT_DIR/digestion_start.sh"
fi
echo "CRX-Digestion-Worker operational scripts backed up"

cd "$NEWSLETTER_DIR"
if [ -f start.ps1 ]; then
  cp start.ps1 start.ps1.freeze
  cp start.ps1 "$SNAPSHOT_DIR/newsletter_start.ps1"
fi
if [ -f start.sh ]; then
  cp start.sh start.sh.freeze
  cp start.sh "$SNAPSHOT_DIR/newsletter_start.sh"
fi
echo "CRX-Newsletter-Brain operational scripts backed up"

echo ""

# Phase 7: Docker Compose Backups
echo "=== PHASE 7: DOCKER COMPOSE BACKUPS ==="

cd "$DIGESTION_DIR"
if [ -f docker-compose.yml ]; then
  cp docker-compose.yml docker-compose.yml.freeze
  cp docker-compose.yml "$SNAPSHOT_DIR/digestion_docker-compose.yml"
  echo "CRX-Digestion-Worker docker-compose.yml backed up"
fi

cd "$NEWSLETTER_DIR"
if [ -f docker-compose.yml ]; then
  cp docker-compose.yml docker-compose.yml.freeze
  cp docker-compose.yml "$SNAPSHOT_DIR/newsletter_docker-compose.yml"
  echo "CRX-Newsletter-Brain docker-compose.yml backed up"
fi

echo ""

# Phase 8: Docker Volume Backups
echo "=== PHASE 8: DOCKER VOLUME BACKUPS ==="

# Note: Docker volume backup requires docker to be running
# This is a placeholder for the actual backup command
# docker run --rm -v crx_digestion_worker_data:/data -v "$SNAPSHOT_DIR":/backup alpine tar czf /backup/digestion_worker_data.tar.gz /data
# docker run --rm -v crx_newsletter_brain_data:/data -v "$SNAPSHOT_DIR":/backup alpine tar czf /backup/newsletter_brain_data.tar.gz /data
echo "Docker volume backup placeholder (requires docker)"
echo "Location: $SNAPSHOT_DIR/"

echo ""

# Phase 9: Verification
echo "=== PHASE 9: VERIFICATION ==="

echo "Snapshot directory contents:"
ls -la "$SNAPSHOT_DIR"

echo ""
echo "=== SNAPSHOT SUMMARY ==="
echo "Snapshot date: $SNAPSHOT_DATE"
echo "Snapshot directory: $SNAPSHOT_DIR"
echo "Freeze branch: $FREEZE_BRANCH"
echo ""
echo "Repositories frozen:"
echo "  - PING: $FREEZE_BRANCH"
echo "  - Brain: $FREEZE_BRANCH"
echo "  - CRX-Digestion-Worker: $FREEZE_BRANCH"
echo "  - CRX-Newsletter-Brain: $FREEZE_BRANCH"
echo ""
echo "Backups created:"
echo "  - SQLite databases"
echo "  - Environment variables"
echo "  - Prompts"
echo "  - Operational scripts"
echo "  - Docker compose configurations"
echo "  - Docker volumes (placeholder)"
echo ""
echo "=== CIVILIZATION SNAPSHOT COMPLETED ==="
