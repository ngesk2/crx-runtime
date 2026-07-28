# Git Forensic Import

**Phase 2:** Import CRX repository with full git history preservation

---

## Overview

Git Forensic Import preserves the complete CRX repository history including all branches, all tags, all commits, all authors, and all timestamps. No squashing, no history rewriting. Required: git clone --mirror to create crx-mirror.git for permanent preservation.

---

## Import Procedure

### Mirror Clone
```bash
# Navigate to quarantine directory
cd brain/external/

# Perform mirror clone
git clone --mirror <crx-repository-url> crx-mirror.git

# Verify mirror clone
cd crx-mirror.git
git branch -a
git tag
git log --all --oneline
```

### History Preservation
```bash
# Verify all branches preserved
git branch -a

# Verify all tags preserved
git tag

# Verify all commits preserved
git log --all --oneline

# Verify all authors preserved
git log --all --format="%an <%ae>"

# Verify all timestamps preserved
git log --all --format="%ai"
```

---

## Mirror Verification

### Verification Procedure
```bash
# Verify mirror integrity
cd brain/external/crx-mirror.git

# Check repository size
du -sh .

# Check commit count
git rev-list --all --count

# Check branch count
git branch -a | wc -l

# Check tag count
git tag | wc -l

# Check for corruption
git fsck --full
```

---

## Mirror Backup

### Backup Procedure
```bash
# Create backup of mirror
cd brain/external/

# Create compressed backup
tar -czf crx-mirror-backup-$(date +%Y%m%d).tar.gz crx-mirror.git

# Verify backup
tar -tzf crx-mirror-backup-*.tar.gz | head -20
```

---

## Mirror Access

### Read-Only Access
```bash
# Mirror is read-only for analysis
cd brain/external/crx-mirror.git

# Clone for analysis (read-write working copy)
git clone crx-mirror.git ../crx-analysis-working

# Work in analysis directory
cd ../crx-analysis-working
```

---

## Git Forensic Best Practices

### 1. History Preservation
- Preserve full git history
- Preserve all branches
- Preserve all tags
- Preserve all commits
- Preserve all authors
- Preserve all timestamps

### 2. No History Modification
- No squashing
- No rewriting history
- No rebasing
- No force pushing
- No history alteration

### 3. Mirror Integrity
- Verify mirror integrity
- Verify repository size
- Verify commit count
- Verify branch count
- Verify tag count

### 4. Backup Strategy
- Create regular backups
- Verify backup integrity
- Store backups securely
- Maintain backup history

### 5. Access Control
- Mirror is read-only
- Working copy for analysis
- No direct modifications to mirror
- No force pushing to mirror
