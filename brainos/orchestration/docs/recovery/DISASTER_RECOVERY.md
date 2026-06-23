# Disaster Recovery Documentation

**Purpose:** Procedures for recovering from various disaster scenarios

---

## Overview

This document provides step-by-step procedures for recovering from disaster scenarios including hardware failure, data corruption, ransomware attacks, and complete site loss.

---

## Pre-Requisites

### Required Tools
- Docker and Docker Compose
- Backup encryption keys
- Access to backup storage
- Recovery scripts
- Documentation access

### Required Access
- Administrative access to systems
- Access to backup storage
- Access to encryption keys
- Network access for restore

---

## Scenario 1: Primary Database Failure

### Severity: HIGH
### RPO: < 1 minute
### RTO: < 5 minutes

### Detection
```bash
# Check database health
docker-compose ps postgres
docker-compose logs postgres | tail -50
```

### Recovery Procedure

#### Step 1: Promote Replica
```bash
# Connect to replica
docker-compose exec postgres-replica bash

# Promote to primary
pg_ctl promote -D /var/lib/postgresql/data
```

#### Step 2: Update Configuration
```bash
# Update .env file
sed -i 's/POSTGRES_HOST=postgres-primary/POSTGRES_HOST=postgres-replica/' .env

# Restart services
docker-compose restart
```

#### Step 3: Verify
```bash
# Verify database is accessible
docker-compose exec postgres-replica psql -U brain_user -d brain_db -c "SELECT 1"

# Verify data integrity
docker-compose exec postgres-replica psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
docker-compose exec postgres-replica psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"
```

#### Step 4: Rebuild Replica
```bash
# Once primary is stable, rebuild replica
docker-compose down postgres-replica
docker-compose up -d postgres-replica
```

---

## Scenario 2: Complete Data Loss

### Severity: CRITICAL
### RPO: < 24 hours
### RTO: < 4 hours

### Detection
```bash
# Check data integrity
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"

# Check object store
ls -la /storage/objects/
```

### Recovery Procedure

#### Step 1: Stop All Services
```bash
docker-compose down
```

#### Step 2: Download Latest Backup
```bash
# List available backups
aws s3 ls s3://brain-backups/

# Download latest backup
aws s3 cp s3://brain-backups/latest.tar.gz.enc /tmp/
```

#### Step 3: Decrypt Backup
```bash
# Decrypt using master key
python3 scripts/decrypt_backup.py /tmp/latest.tar.gz.enc
```

#### Step 4: Extract Backup
```bash
# Extract to temporary location
tar -xzf /tmp/latest.tar.gz -C /tmp/restore/
```

#### Step 5: Restore Database
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for database to be ready
docker-compose exec postgres pg_isready -U brain_user

# Restore database
gunzip -c /tmp/restore/postgres.sql.gz | docker-compose exec -T postgres psql -U brain_user brain_db
```

#### Step 6: Restore Object Store
```bash
# Restore object store
rsync -av /tmp/restore/objects/ /storage/objects/
```

#### Step 7: Restore Event Log
```bash
# Restore event log
rsync -av /tmp/restore/events/ /storage/events/
```

#### Step 8: Verify
```bash
# Verify database
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"

# Verify object store
ls -la /storage/objects/

# Verify event log
ls -la /storage/events/
```

#### Step 9: Start All Services
```bash
docker-compose up -d
```

---

## Scenario 3: Ransomware Attack

### Severity: CRITICAL
### RPO: Depends on last clean backup
### RTO: < 8 hours

### Detection
```bash
# Check for encrypted files
find /storage/ -name "*.encrypted"

# Check for ransom notes
find /storage/ -name "*ransom*"
find /storage/ -name "*README*"
```

### Recovery Procedure

#### Step 1: Isolate Systems
```bash
# Stop all services immediately
docker-compose down

# Disconnect from network
# (Physical isolation recommended)
```

#### Step 2: Assess Damage
```bash
# Check which systems are affected
find /storage/ -name "*.encrypted"
find /storage/ -name "*.locked"

# Check for ransom notes
find /storage/ -type f -name "*ransom*" -o -name "*README*"
```

#### Step 3: Identify Last Clean Backup
```bash
# Check backup integrity
./scripts/verify_checksums.sh /storage/warm/snapshots/2026-06-13

# If corrupted, check previous backup
./scripts/verify_checksums.sh /storage/warm/snapshots/2026-06-12
```

#### Step 4: Wipe Compromised Systems
```bash
# Format affected storage
# (Consult security team before proceeding)

# Rebuild from scratch
docker-compose down -v
docker-compose up -d
```

#### Step 5: Restore from Clean Backup
```bash
# Follow complete data loss recovery procedure
# Using last clean backup identified in Step 3
```

#### Step 6: Scan for Malware
```bash
# Scan restored data
clamscan -r /storage/

# Scan for persistence mechanisms
# (Consult security team)
```

#### Step 7: Update Security Measures
```bash
# Rotate all credentials
./scripts/generate_secrets.py

# Rotate all encryption keys
./scripts/generate_keys.py

# Update firewall rules
# (Consult security team)
```

#### Step 8: Monitor for Recurrence
```bash
# Monitor for suspicious activity
tail -f /logs/security/audit.log

# Monitor for new encrypted files
find /storage/ -name "*.encrypted"
```

---

## Scenario 4: Object Store Corruption

### Severity: MEDIUM
### RPO: < 1 hour
### RTO: < 2 hours

### Detection
```bash
# Verify object integrity
find /storage/objects/ -type f -exec sha256sum {} \; > /tmp/current_checksums.txt
diff /tmp/current_checksums.txt /storage/objects/checksums.txt
```

### Recovery Procedure

#### Step 1: Identify Corrupted Objects
```bash
# Generate current checksums
find /storage/objects/ -type f -exec sha256sum {} \; > /tmp/current_checksums.txt

# Compare with known good checksums
diff /tmp/current_checksums.txt /storage/objects/checksums.txt
```

#### Step 2: Restore Corrupted Objects
```bash
# For each corrupted object, restore from backup
# (Assuming per-object backups exist)
```

#### Step 3: Rebuild Projections
```bash
# Rebuild vector projection
docker-compose exec qdrant curl -X POST http://localhost:6333/collections/rebuild

# Rebuild graph projection
docker-compose exec neo4j cypher-shell -u neo4j -p password "MATCH (n) DETACH DELETE n"
# Re-populate from canonical state
```

---

## Scenario 5: Event Log Corruption

### Severity: HIGH
### RPO: < 1 hour
### RTO: < 4 hours

### Detection
```bash
# Verify event log integrity
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"

# Check for gaps in event sequence
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT timestamp, COUNT(*) FROM events GROUP BY timestamp ORDER BY timestamp"
```

### Recovery Procedure

#### Step 1: Identify Corrupted Events
```bash
# Check for gaps in event sequence
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT event_id, timestamp FROM events ORDER BY timestamp"
```

#### Step 2: Restore from Event Log Backup
```bash
# Restore event log from backup
rsync -av /storage/warm/snapshots/2026-06-14/events/ /storage/events/
```

#### Step 3: Replay Events
```bash
# Replay events to rebuild state
python3 scripts/replay_events.py --from-event <last_good_event_id>
```

#### Step 4: Verify State
```bash
# Verify canonical state
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"
```

---

## Scenario 6: Complete Site Loss

### Severity: CRITICAL
### RPO: < 24 hours
### RTO: < 24 hours

### Detection
```bash
# Site unreachable
ping brain.example.com

# All services down
docker-compose ps
```

### Recovery Procedure

#### Step 1: Declare Disaster
```bash
# Notify stakeholders
# Activate disaster recovery team
# Initiate disaster recovery plan
```

#### Step 2: Provision New Infrastructure
```bash
# Deploy to new location
# (Could be cloud provider, DR site, etc.)
```

#### Step 3: Restore from Cold Backup
```bash
# Download latest cold backup
aws s3 cp s3://brain-backups/latest.tar.gz.enc /tmp/

# Decrypt and extract
python3 scripts/decrypt_backup.py /tmp/latest.tar.gz.enc
tar -xzf /tmp/latest.tar.gz -C /tmp/restore/
```

#### Step 4: Deploy Services
```bash
# Deploy to new infrastructure
docker-compose up -d
```

#### Step 5: Restore Data
```bash
# Follow complete data loss recovery procedure
```

#### Step 6: Update DNS
```bash
# Update DNS to point to new location
# (Consult network team)
```

#### Step 7: Verify
```bash
# Verify all services are running
docker-compose ps

# Verify data integrity
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"
```

#### Step 8: Notify Users
```bash
# Notify users of recovery
# Provide estimated time of full recovery
# Communicate any data loss
```

---

## Post-Recovery Verification

### Database Verification
```bash
# Verify object count
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects"

# Verify event count
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"

# Verify data integrity
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM objects WHERE content_hash IS NULL"
```

### Object Store Verification
```bash
# Verify object count
find /storage/objects/ -type f | wc -l

# Verify checksums
find /storage/objects/ -type f -exec sha256sum {} \; > /tmp/current_checksums.txt
diff /tmp/current_checksums.txt /storage/objects/checksums.txt
```

### Event Log Verification
```bash
# Verify event sequence
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT event_id, timestamp FROM events ORDER BY timestamp LIMIT 10"

# Verify no gaps
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT COUNT(*) FROM events"
```

### Service Verification
```bash
# Verify all services are running
docker-compose ps

# Verify service health
docker-compose exec postgres pg_isready -U brain_user
docker-compose exec qdrant curl -f http://localhost:6333/health
docker-compose exec neo4j curl -f http://localhost:7474
```

---

## Recovery Testing

### Monthly Testing
```bash
# Schedule monthly recovery test
# Test restore from latest backup
# Document test results
# Update procedures if needed
```

### Quarterly Testing
```bash
# Schedule quarterly full disaster recovery test
# Test complete site recovery
# Document test results
# Update procedures if needed
```

### Annual Testing
```bash
# Schedule annual full disaster recovery drill
# Test all recovery procedures
# Document test results
# Update procedures if needed
```

---

## Communication Plan

### Internal Communication
- Notify stakeholders immediately
- Provide regular updates
- Communicate estimated recovery time
- Document lessons learned

### External Communication
- Notify users if service is affected
- Provide estimated recovery time
- Communicate any data loss
- Provide post-incident report

---

## Post-Incident Review

### Review Items
- Root cause analysis
- Timeline of events
- Effectiveness of response
- Areas for improvement
- Updated procedures

### Documentation Updates
- Update recovery procedures
- Update contact information
- Update infrastructure diagrams
- Update runbooks

---

## Contact Information

### Primary Contacts
- System Administrator: admin@example.com
- Database Administrator: dba@example.com
- Security Team: security@example.com
- Management: management@example.com

### Emergency Contacts
- On-Call Engineer: oncall@example.com
- Disaster Recovery Team: dr@example.com
- Executive Team: executive@example.com
