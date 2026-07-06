# Golden Replay Corpus

Phase 5.9 — Golden Replay Corpus

## Purpose

Store hundreds of transcripts for conformance testing. Every commit must replay all transcripts and verify all hashes are identical before merge is allowed.

Like compiler conformance suites.

## Structure

```
golden/
├── README.md
├── corpus/
│   ├── basic_prompt/
│   │   ├── transcript.json
│   │   ├── certificate.json
│   │   └── metadata.json
│   ├── tool_execution/
│   │   ├── transcript.json
│   │   ├── certificate.json
│   │   └── metadata.json
│   ├── streaming/
│   │   ├── transcript.json
│   │   ├── certificate.json
│   │   └── metadata.json
│   └── ...
└── corpus_index.json
```

## Transcript Format

Each transcript in the corpus includes:

- `transcript.json`: The complete replay transcript
- `certificate.json`: The replay certificate
- `metadata.json`: Metadata about the test case

## Metadata Format

```json
{
  "test_id": "basic_prompt_001",
  "name": "Basic Prompt Test",
  "description": "Simple prompt without tools or streaming",
  "constitutional_version": "5.0.0",
  "created_at": "2026-06-29T14:44:00Z",
  "tags": ["basic", "prompt", "no-tools"],
  "platforms": ["windows", "linux", "mac", "docker", "wsl"]
}
```

## Corpus Index

`corpus_index.json` contains the complete index of all test cases:

```json
{
  "version": "1.0.0",
  "total_tests": 0,
  "test_categories": {
    "basic_prompt": 0,
    "tool_execution": 0,
    "streaming": 0,
    "multi_tool": 0,
    "checkpoint_recovery": 0
  },
  "tests": []
}
```

## Conformance Testing

Before any merge:

1. Load all transcripts from corpus
2. Replay each transcript
3. Verify all hashes match
4. Generate certificates
5. Compare with golden certificates
6. All must pass → merge allowed

## Adding New Tests

1. Run execution with desired configuration
2. Generate transcript
3. Verify replay determinism
4. Create certificate
5. Add to corpus with metadata
6. Update corpus index
7. Commit

## Cross-Platform Verification

Each test case should be verified across:

- Windows
- Linux
- Mac
- Docker
- WSL

All platforms must produce identical hashes.

## CI Integration

The corpus is integrated with constitutional CI (Phase 5.10) to automatically verify all transcripts on every commit.

## Maintenance

- Regularly add new test cases
- Update constitutional version when needed
- Remove deprecated tests
- Ensure metadata is accurate
- Verify cross-platform compatibility
