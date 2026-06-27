# CORPUS_CERTIFICATION.md

**Repository Root**: C:\Users\nolan\CRX  
**Analysis Date**: 2026-06-11  
**Phase**: PATCH P8 — Replay Corpus Freeze

---

## Corpus Files

### simple.json
**Input**: Simple object with key ordering
**Canonical Output**: PENDING (requires pnpm install and module resolution)
**SHA256**: PENDING (requires pnpm install and module resolution)

### nested.json
**Input**: Nested object with key ordering
**Canonical Output**: PENDING (requires pnpm install and module resolution)
**SHA256**: PENDING (requires pnpm install and module resolution)

### unicode.json
**Input**: Object with Unicode characters
**Canonical Output**: PENDING (requires pnpm install and module resolution)
**SHA256**: PENDING (requires pnpm install and module resolution)

### large.json
**Input**: Larger object with arrays and metadata
**Canonical Output**: PENDING (requires pnpm install and module resolution)
**SHA256**: PENDING (requires pnpm install and module resolution)

### edge_cases.json
**Input**: Object with edge cases (empty, null, boolean, numbers, mixed)
**Canonical Output**: PENDING (requires pnpm install and module resolution)
**SHA256**: PENDING (requires pnpm install and module resolution)

---

## Required Actions

To complete corpus certification:
1. Install pnpm on system
2. Run pnpm install to establish workspace links
3. Create corpus generation script to:
   - Read each corpus file
   - Canonicalize using CanonicalJson.canonicalize()
   - Write canonical_output.json
   - Compute SHA256 hash
   - Write sha256.txt
4. Run corpus generation script
5. Update this document with actual SHA256 values

---

## Generation Script Template

```typescript
import { CanonicalJson } from '../canonical_json';
import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const corpusFiles = ['simple.json', 'nested.json', 'unicode.json', 'large.json', 'edge_cases.json'];

for (const file of corpusFiles) {
  const input = JSON.parse(readFileSync(`./corpus/${file}`, 'utf-8'));
  const canonical = CanonicalJson.canonicalize(input);
  const hash = createHash('sha256').update(canonical).digest('hex');
  
  writeFileSync(`./corpus/${file}.canonical`, canonical);
  writeFileSync(`./corpus/${file}.sha256`, hash);
}
```

---

## Current Status

**Corpus Files**: CREATED (5 files)
**Canonical Outputs**: NOT GENERATED
**SHA256 Values**: NOT COMPUTED

**Status**: BLOCKED (pnpm not installed, module resolution issues)
