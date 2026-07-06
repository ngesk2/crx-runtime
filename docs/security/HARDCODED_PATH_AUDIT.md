# Hardcoded Path Audit Report

**Generated:** The current date is: Sun 06/28/2026 
Enter the new date: (mm-dd-yy) The system cannot accept the date entered.
Enter the new date: (mm-dd-yy) The system cannot accept the date entered.
Enter the new date: (mm-dd-yy)
**Total Findings:** 71769

## Summary

- **CRITICAL:** 32790
- **HIGH:** 32966
- **MEDIUM:** 5894
- **LOW:** 119

## CRITICAL Findings

| File | Line | Pattern | Description | Content |
|------|------|---------|-------------|---------|
| analyze.py | 36 | `C:\\Users\\nolan` | User-specific path | `base_dir = r'C:\Users\nolan\CRX'...` |
| analyze_imports.py | 48 | `C:\\Users\\nolan` | User-specific path | `fails = analyze_imports(r'C:\Users\nolan\CRX')...` |
| analyze_imports.py | 49 | `C:\\Users\\nolan` | User-specific path | `with open(r'C:\Users\nolan\CRX\IMPORT_GRAPH_FAILUR...` |
| ARCHIVE_CANDIDATES_CONSOLIDATION.md | 4 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| ARCHIVE_CANDIDATES_CONSOLIDATION.md | 24 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\PING\vos\`...` |
| ARCHIVE_CANDIDATES_CONSOLIDATION.md | 85 | `C:\\Users\\nolan` | User-specific path | `| vos/ | C:\Users\nolan\PING\vos\ | 4 subfolders +...` |
| AUTHORITY_CODE_ONLY.txt | 1 | `C:\\Users\\nolan` | User-specific path | `﻿C:\Users\nolan\PING\AUTHORITY_TRACE_REPORT.md|###...` |
| AUTHORITY_CODE_ONLY.txt | 2 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\AUTHORITY_TRACE_REPORT.md|**Ac...` |
| AUTHORITY_CODE_ONLY.txt | 3 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\AUTHORITY_TRACE_REPORT.md|**Ac...` |
| AUTHORITY_CODE_ONLY.txt | 4 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\source_of_truth_sweep.md...` |
| AUTHORITY_CODE_ONLY.txt | 5 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\source_of_truth_sweep.md...` |
| AUTHORITY_CODE_ONLY.txt | 6 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\semantic_graph_sweep.md|...` |
| AUTHORITY_CODE_ONLY.txt | 7 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\semantic_graph_sweep.md|...` |
| AUTHORITY_CODE_ONLY.txt | 8 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\semantic_graph_sweep.md|...` |
| AUTHORITY_CODE_ONLY.txt | 9 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\semantic_graph_sweep.md|...` |
| AUTHORITY_CODE_ONLY.txt | 10 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\semantic_graph_sweep.md|...` |
| AUTHORITY_CODE_ONLY.txt | 11 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\semantic_graph_sweep.md|...` |
| AUTHORITY_CODE_ONLY.txt | 12 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\semantic_graph_sweep.md|...` |
| AUTHORITY_CODE_ONLY.txt | 13 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\authority_inventory.md|*...` |
| AUTHORITY_CODE_ONLY.txt | 14 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\SWEEP_A1_A...` |
| AUTHORITY_CODE_ONLY.txt | 15 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\SWEEP_A1_A...` |
| AUTHORITY_CODE_ONLY.txt | 16 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\SWEEP_A1_A...` |
| AUTHORITY_CODE_ONLY.txt | 17 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_boundary_sweep.md...` |
| AUTHORITY_CODE_ONLY.txt | 18 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\SWEEP2_IDE...` |
| AUTHORITY_CODE_ONLY.txt | 19 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\SWEEP2_IDE...` |
| AUTHORITY_CODE_ONLY.txt | 20 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\SWEEP2_IDE...` |
| AUTHORITY_CODE_ONLY.txt | 21 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 22 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 23 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 24 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 25 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 26 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 27 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 28 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 29 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 30 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 31 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 32 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 33 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 34 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 35 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 36 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 37 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 38 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| AUTHORITY_CODE_ONLY.txt | 39 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_ENFORCEMENT_AUD...` |
| AUTHORITY_CODE_ONLY.txt | 40 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_ENFORCEMENT_AUD...` |
| AUTHORITY_CODE_ONLY.txt | 41 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CIVILIZATION_DETECTION_AUDIT_C...` |
| AUTHORITY_CODE_ONLY.txt | 42 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\SWEEP18-25...` |
| AUTHORITY_CODE_ONLY.txt | 43 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_DELEGATION_AUDI...` |
| AUTHORITY_CODE_ONLY.txt | 44 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_DELEGATION_AUDI...` |
| AUTHORITY_CODE_ONLY.txt | 45 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CERTIFICATE_CERTIFICATION.md| ...` |
| AUTHORITY_CODE_ONLY.txt | 46 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_AUTHORITY_CONVE...` |
| AUTHORITY_CODE_ONLY.txt | 47 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_AUTHORITY_CONVE...` |
| AUTHORITY_CODE_ONLY.txt | 48 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_AUTHORITY_CONVE...` |
| AUTHORITY_CODE_ONLY.txt | 49 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_AUTHORITY_CONVE...` |
| AUTHORITY_CODE_ONLY.txt | 50 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_AUTHORITY_CONVE...` |
| AUTHORITY_CODE_ONLY.txt | 51 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_AUTHORITY_CONVE...` |
| AUTHORITY_CODE_ONLY.txt | 52 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_AUTHORITY_CONVE...` |
| AUTHORITY_CODE_ONLY.txt | 53 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\VALIDATION_AUDITS_BEFORE_IMPLE...` |
| AUTHORITY_CODE_ONLY.txt | 54 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\VALIDATION_AUDITS_BEFORE_IMPLE...` |
| AUTHORITY_CODE_ONLY.txt | 55 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\VALIDATION_AUDITS_BEFORE_IMPLE...` |
| AUTHORITY_CODE_ONLY.txt | 56 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\VALIDATION_AUDITS_BEFORE_IMPLE...` |
| AUTHORITY_CODE_ONLY.txt | 57 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\VALIDATION_AUDITS_BEFORE_IMPLE...` |
| AUTHORITY_CODE_ONLY.txt | 58 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\VALIDATION_AUDITS_BEFORE_IMPLE...` |
| AUTHORITY_CODE_ONLY.txt | 59 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\DEAD_CODE_REPORT.md|- runtime/...` |
| AUTHORITY_CODE_ONLY.txt | 60 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\DEAD_CODE_REPORT.md|- runtime/...` |
| AUTHORITY_CODE_ONLY.txt | 61 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\DEAD_CODE_REPORT.md|- runtime/...` |
| AUTHORITY_CODE_ONLY.txt | 62 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\MASTER_PING...` |
| AUTHORITY_CODE_ONLY.txt | 63 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\MASTER_PING...` |
| AUTHORITY_CODE_ONLY.txt | 64 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\MASTER_PING...` |
| AUTHORITY_CODE_ONLY.txt | 65 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\MASTER_PING...` |
| AUTHORITY_CODE_ONLY.txt | 66 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\MASTER_PING...` |
| AUTHORITY_CODE_ONLY.txt | 67 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\MASTER_PING...` |
| AUTHORITY_CODE_ONLY.txt | 68 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSOLIDAT...` |
| AUTHORITY_CODE_ONLY.txt | 69 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSOLIDAT...` |
| AUTHORITY_CODE_ONLY.txt | 70 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSOLIDAT...` |
| AUTHORITY_CODE_ONLY.txt | 71 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSOLIDAT...` |
| AUTHORITY_CODE_ONLY.txt | 72 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSOLIDAT...` |
| AUTHORITY_CODE_ONLY.txt | 73 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSOLIDAT...` |
| AUTHORITY_CODE_ONLY.txt | 74 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\constitutio...` |
| AUTHORITY_CODE_ONLY.txt | 75 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\constitutio...` |
| AUTHORITY_CODE_ONLY.txt | 76 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\constitutio...` |
| AUTHORITY_CODE_ONLY.txt | 77 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\constitutio...` |
| AUTHORITY_CODE_ONLY.txt | 78 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONVERGENCE_REPORT.md|21. comp...` |
| AUTHORITY_CODE_ONLY.txt | 79 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_remediati...` |
| AUTHORITY_CODE_ONLY.txt | 80 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_remediati...` |
| AUTHORITY_CODE_ONLY.txt | 81 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONVERGENCE_READINESS.md|- @cr...` |
| AUTHORITY_CODE_ONLY.txt | 82 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSTITUTI...` |
| AUTHORITY_CODE_ONLY.txt | 83 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_influence...` |
| AUTHORITY_CODE_ONLY.txt | 84 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_influence...` |
| AUTHORITY_CODE_ONLY.txt | 85 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_influence...` |
| AUTHORITY_CODE_ONLY.txt | 86 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_influence...` |
| AUTHORITY_CODE_ONLY.txt | 87 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSTITUTI...` |
| AUTHORITY_CODE_ONLY.txt | 88 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONVERGENCE_FINAL.md|- compare...` |
| AUTHORITY_CODE_ONLY.txt | 89 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_derived_s...` |
| AUTHORITY_CODE_ONLY.txt | 90 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_derived_s...` |
| AUTHORITY_CODE_ONLY.txt | 91 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_derived_s...` |
| AUTHORITY_CODE_ONLY.txt | 92 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_derived_s...` |
| AUTHORITY_CODE_ONLY.txt | 93 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_derived_s...` |
| AUTHORITY_CODE_ONLY.txt | 94 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_derived_s...` |
| AUTHORITY_CODE_ONLY.txt | 95 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_derived_s...` |
| AUTHORITY_CODE_ONLY.txt | 96 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_derived_s...` |
| AUTHORITY_CODE_ONLY.txt | 97 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\constitutional_derived_s...` |
| AUTHORITY_CODE_ONLY.txt | 98 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\adr\ADR-000Y-REPLAY-COMMI...` |
| AUTHORITY_CODE_ONLY.txt | 99 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\adr\ADR-000Y-REPLAY-COMMI...` |
| AUTHORITY_CODE_ONLY.txt | 100 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_TEST_SUITE_GUID...` |
| AUTHORITY_CODE_ONLY.txt | 101 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_TEST_SUITE_GUID...` |
| AUTHORITY_CODE_ONLY.txt | 102 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_TEST_SUITE_GUID...` |
| AUTHORITY_CODE_ONLY.txt | 103 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_TEST_SUITE_GUID...` |
| AUTHORITY_CODE_ONLY.txt | 104 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_TEST_SUITE_GUID...` |
| AUTHORITY_CODE_ONLY.txt | 105 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONSTITUTIONAL_TEST_SUITE_GUID...` |
| AUTHORITY_CODE_ONLY.txt | 106 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\DUPLICATION_AUDIT.md|   - File...` |
| AUTHORITY_CODE_ONLY.txt | 107 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\DUPLICATION_AUDIT.md|2. **Iden...` |
| AUTHORITY_CODE_ONLY.txt | 108 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\EXECUTION_GRAPH.md|**Usage**: ...` |
| AUTHORITY_CODE_ONLY.txt | 109 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\MIGRATION_ROADMAP.md|- runtime...` |
| AUTHORITY_CODE_ONLY.txt | 110 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\authority_i...` |
| AUTHORITY_CODE_ONLY.txt | 111 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\authority_i...` |
| AUTHORITY_CODE_ONLY.txt | 112 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\authority_i...` |
| AUTHORITY_CODE_ONLY.txt | 113 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\authority_i...` |
| AUTHORITY_CODE_ONLY.txt | 114 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\authority_i...` |
| AUTHORITY_CODE_ONLY.txt | 115 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\authority_i...` |
| AUTHORITY_CODE_ONLY.txt | 116 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\ENV_DRIFT_MATRIX.md|// - linea...` |
| AUTHORITY_CODE_ONLY.txt | 117 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\LAYER1_READINESS.md|### Change...` |
| AUTHORITY_CODE_ONLY.txt | 118 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\FAILURE_CERTIFICATION.md|### F...` |
| AUTHORITY_CODE_ONLY.txt | 119 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\FAILURE_CERTIFICATION.md|### F...` |
| AUTHORITY_CODE_ONLY.txt | 120 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\FAILURE_CERTIFICATION.md|### F...` |
| AUTHORITY_CODE_ONLY.txt | 121 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_GRAPH_FAILURES.md|file:...` |
| AUTHORITY_CODE_ONLY.txt | 122 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- s...` |
| AUTHORITY_CODE_ONLY.txt | 123 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- s...` |
| AUTHORITY_CODE_ONLY.txt | 124 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- s...` |
| AUTHORITY_CODE_ONLY.txt | 125 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- s...` |
| AUTHORITY_CODE_ONLY.txt | 126 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- s...` |
| AUTHORITY_CODE_ONLY.txt | 127 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- s...` |
| AUTHORITY_CODE_ONLY.txt | 128 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- c...` |
| AUTHORITY_CODE_ONLY.txt | 129 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- c...` |
| AUTHORITY_CODE_ONLY.txt | 130 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- c...` |
| AUTHORITY_CODE_ONLY.txt | 131 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- c...` |
| AUTHORITY_CODE_ONLY.txt | 132 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- c...` |
| AUTHORITY_CODE_ONLY.txt | 133 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- c...` |
| AUTHORITY_CODE_ONLY.txt | 134 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- c...` |
| AUTHORITY_CODE_ONLY.txt | 135 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- c...` |
| AUTHORITY_CODE_ONLY.txt | 136 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\IMPORT_AUTHORITY_REPORT.md|- w...` |
| AUTHORITY_CODE_ONLY.txt | 137 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PATCHSET_CONVERGENCE.md|**File...` |
| AUTHORITY_CODE_ONLY.txt | 138 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PATCHSET_CONVERGENCE.md|**File...` |
| AUTHORITY_CODE_ONLY.txt | 139 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PATCHSET_CONVERGENCE.md|**File...` |
| AUTHORITY_CODE_ONLY.txt | 140 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PATCHSET_CONVERGENCE.md|**File...` |
| AUTHORITY_CODE_ONLY.txt | 141 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PATCHSET_CONVERGENCE.md|**File...` |
| AUTHORITY_CODE_ONLY.txt | 142 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 143 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 144 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP10_KERNEL_AUTHORITY_AUDIT...` |
| AUTHORITY_CODE_ONLY.txt | 145 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP10_KERNEL_AUTHORITY_AUDIT...` |
| AUTHORITY_CODE_ONLY.txt | 146 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REPLAY_REACHABILITY_REPORT.md|...` |
| AUTHORITY_CODE_ONLY.txt | 147 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REPLAY_REACHABILITY_REPORT.md|...` |
| AUTHORITY_CODE_ONLY.txt | 148 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP_A1_AUTHORITY_PATH_MATRIX...` |
| AUTHORITY_CODE_ONLY.txt | 149 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP_A1_AUTHORITY_PATH_MATRIX...` |
| AUTHORITY_CODE_ONLY.txt | 150 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP_A1_AUTHORITY_PATH_MATRIX...` |
| AUTHORITY_CODE_ONLY.txt | 151 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 152 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 153 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 154 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 155 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 156 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 157 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 158 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 159 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 160 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 161 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 162 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 163 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_MATRIX.md|- runtime/ke...` |
| AUTHORITY_CODE_ONLY.txt | 164 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 165 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 166 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 167 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 168 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 169 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 170 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 171 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 172 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 173 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 174 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SAFE_TO_DELETE.md|### compare_...` |
| AUTHORITY_CODE_ONLY.txt | 175 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SAFE_TO_DELETE.md|**Evidence**...` |
| AUTHORITY_CODE_ONLY.txt | 176 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 177 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 178 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 179 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 180 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 181 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 182 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 183 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 184 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 185 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 186 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 187 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 188 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 189 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 190 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 191 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 192 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 193 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 194 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 195 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 196 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 197 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 198 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 199 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 200 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 201 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 202 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 203 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 204 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 205 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 206 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 207 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 208 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 209 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 210 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 211 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 212 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 213 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 214 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 215 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 216 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 217 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 218 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 219 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 220 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 221 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 222 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 223 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 224 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 225 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 226 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 227 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 228 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 229 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 230 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 231 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 232 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 233 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 234 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 235 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 236 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 237 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_RAW.txt|C:\Users...` |
| AUTHORITY_CODE_ONLY.txt | 238 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 239 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 240 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 241 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 242 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 243 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 244 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 245 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 246 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 247 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 248 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 249 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 250 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 251 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 252 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 253 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 254 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 255 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 256 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 257 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 258 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 259 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 260 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 261 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 262 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 263 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 264 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 265 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 266 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 267 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 268 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 269 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 270 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 271 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 272 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 273 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 274 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 275 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 276 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 277 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 278 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 279 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 280 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 281 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 282 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 283 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 284 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 285 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 286 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 287 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 288 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 289 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 290 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 291 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 292 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 293 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 294 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 295 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 296 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 297 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 298 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 299 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 300 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 301 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 302 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 303 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 304 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_PROCESSED.txt|C:...` |
| AUTHORITY_CODE_ONLY.txt | 305 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 306 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 307 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 308 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 309 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 310 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 311 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 312 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 313 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 314 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 315 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 316 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 317 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 318 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 319 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 320 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 321 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 322 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 323 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 324 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 325 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 326 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 327 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 328 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 329 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 330 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 331 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 332 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 333 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 334 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 335 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 336 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 337 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 338 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 339 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 340 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 341 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 342 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 343 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 344 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 345 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 346 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 347 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 348 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 349 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 350 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 351 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 352 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 353 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 354 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 355 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 356 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 357 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 358 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 359 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 360 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 361 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 362 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 363 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 364 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 365 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 366 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 367 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 368 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 369 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 370 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 371 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 372 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REBRAND_AUDIT_CATEGORIZED.txt|...` |
| AUTHORITY_CODE_ONLY.txt | 373 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP10_TIME_AUTHORITY_AUDIT.m...` |
| AUTHORITY_CODE_ONLY.txt | 374 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PROTECTED_SYSTEMS.md|- VERIFIE...` |
| AUTHORITY_CODE_ONLY.txt | 375 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PRODUCTION_EXECUTION_GRAPH.md|...` |
| AUTHORITY_CODE_ONLY.txt | 376 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PRODUCTION_EXECUTION_GRAPH.md|...` |
| AUTHORITY_CODE_ONLY.txt | 377 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 378 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 379 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 380 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 381 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PRE_PATCH_STATE.md|- compare_s...` |
| AUTHORITY_CODE_ONLY.txt | 382 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 383 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 384 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 385 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 386 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 387 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 388 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 389 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 390 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 391 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 392 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 393 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 394 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 395 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 396 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 397 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 398 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 399 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 400 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 401 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 402 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 403 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 404 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 405 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 406 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 407 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 408 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 409 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 410 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 411 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 412 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 413 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 414 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 415 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 416 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 417 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 418 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 419 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 420 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 421 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 422 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 423 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\CONSTITUTIONAL_...` |
| AUTHORITY_CODE_ONLY.txt | 424 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_REPOSITORY_TRUTH_AUDIT.md...` |
| AUTHORITY_CODE_ONLY.txt | 425 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_REPOSITORY_TRUTH_AUDIT.md...` |
| AUTHORITY_CODE_ONLY.txt | 426 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_REPOSITORY_TRUTH_AUDIT.md...` |
| AUTHORITY_CODE_ONLY.txt | 427 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_LAYER_0_DEFINITION.md|1. ...` |
| AUTHORITY_CODE_ONLY.txt | 428 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_LAYER_0_DEFINITION.md|2. ...` |
| AUTHORITY_CODE_ONLY.txt | 429 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_LAYER_0_DEFINITION.md|3. ...` |
| AUTHORITY_CODE_ONLY.txt | 430 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_LAYER_0_DEFINITION.md|7. ...` |
| AUTHORITY_CODE_ONLY.txt | 431 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 432 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 433 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 434 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 435 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 436 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 437 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 438 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 439 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 440 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 441 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 442 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 443 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 444 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 445 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 446 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 447 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 448 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 449 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 450 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 451 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 452 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 453 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 454 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 455 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 456 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 457 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 458 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 459 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 460 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_AUTHORITY_OWNERSHIP_MAP.m...` |
| AUTHORITY_CODE_ONLY.txt | 461 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_ECOSYSTEM_INVENTORY.md|- ...` |
| AUTHORITY_CODE_ONLY.txt | 462 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_ECOSYSTEM_INVENTORY.md|12...` |
| AUTHORITY_CODE_ONLY.txt | 463 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_ECOSYSTEM_INVENTORY.md|- ...` |
| AUTHORITY_CODE_ONLY.txt | 464 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\POST_CONVERGENCE_STATE.md|- PA...` |
| AUTHORITY_CODE_ONLY.txt | 465 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\canonical_hash_...` |
| AUTHORITY_CODE_ONLY.txt | 466 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\newsletter\docs\consti...` |
| AUTHORITY_CODE_ONLY.txt | 467 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\FORENSIC_PROVEN...` |
| AUTHORITY_CODE_ONLY.txt | 468 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\FORENSIC_PROVEN...` |
| AUTHORITY_CODE_ONLY.txt | 469 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\FINAL_CONSTITUT...` |
| AUTHORITY_CODE_ONLY.txt | 470 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\FINAL_CONSTITUT...` |
| AUTHORITY_CODE_ONLY.txt | 471 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\FINAL_CONSTITUT...` |
| AUTHORITY_CODE_ONLY.txt | 472 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\FORENSIC_PHASE2...` |
| AUTHORITY_CODE_ONLY.txt | 473 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\FORENSIC_PHASE2...` |
| AUTHORITY_CODE_ONLY.txt | 474 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\runtime\replay\FORENSIC_PHASE2...` |
| AUTHORITY_CODE_ONLY.txt | 475 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\POST_PATCH_EXECUTION_GRAPH.md|...` |
| AUTHORITY_CODE_ONLY.txt | 476 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\POST_PATCH_EXECUTION_GRAPH.md|...` |
| AUTHORITY_CODE_ONLY.txt | 477 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\POST_PATCH_EXECUTION_GRAPH.md|...` |
| AUTHORITY_CODE_ONLY.txt | 478 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\POST_PATCH_EXECUTION_GRAPH.md|...` |
| AUTHORITY_CODE_ONLY.txt | 479 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| AUTHORITY_CODE_ONLY.txt | 480 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| AUTHORITY_CODE_ONLY.txt | 481 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| AUTHORITY_CODE_ONLY.txt | 482 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| AUTHORITY_CODE_ONLY.txt | 483 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| AUTHORITY_CODE_ONLY.txt | 484 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| AUTHORITY_CODE_ONLY.txt | 485 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| AUTHORITY_CODE_ONLY.txt | 486 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| AUTHORITY_CODE_ONLY.txt | 487 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| AUTHORITY_CODE_ONLY.txt | 488 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\orchestration\docs\con...` |
| backup_delta_report.md | 29 | `C:\\Users\\nolan` | User-specific path | `list_dir C:\Users\nolan\PING_zip_extracted...` |
| backup_delta_report.md | 52 | `C:\\Users\\nolan` | User-specific path | `### C:\Users\nolan\PING\database\events_backup.sql...` |
| backup_delta_report.md | 72 | `C:\\Users\\nolan` | User-specific path | `### C:\Users\nolan\PING\CascadeProjects\constituti...` |
| backup_delta_report.md | 95 | `C:\\Users\\nolan` | User-specific path | `### C:\Users\nolan\PING\constitutional-integration...` |
| backup_delta_report.md | 192 | `C:\\Users\\nolan` | User-specific path | `find_by_name C:\Users\nolan PING_zip...` |
| backup_delta_report.md | 195 | `C:\\Users\\nolan` | User-specific path | `find_by_name C:\Users\nolan PING_backup...` |
| backup_delta_report.md | 198 | `C:\\Users\\nolan` | User-specific path | `find_by_name C:\Users\nolan PING_extracted...` |
| backup_delta_report.md | 205 | `C:\\Users\\nolan` | User-specific path | `list_dir C:\Users\nolan\PING_zip_extracted...` |
| backup_delta_report.md | 208 | `C:\\Users\\nolan` | User-specific path | `read_file C:\Users\nolan\PING\database\events_back...` |
| backup_delta_report.md | 211 | `C:\\Users\\nolan` | User-specific path | `list_dir C:\Users\nolan\PING\CascadeProjects\const...` |
| backup_delta_report.md | 214 | `C:\\Users\\nolan` | User-specific path | `list_dir C:\Users\nolan\PING\constitutional-integr...` |
| BACKUP_REALITY_AUDIT.md | 14 | `C:\\Users\\nolan` | User-specific path | `| pg_dump / WAL archive | `/tmp/*.sql`? `C:\Users\...` |
| BACKUP_REALITY_AUDIT.md | 17 | `C:\\Users\\nolan` | User-specific path | `| DriveMirror/ files | `C:\Users\nolan\PING\DriveM...` |
| BACKUP_REALITY_AUDIT.md | 34 | `C:\\Users\\nolan` | User-specific path | `| `C:\Users\nolan\PING\archive.zip` | ? | Vault co...` |
| BACKUP_REALITY_AUDIT.md | 35 | `C:\\Users\\nolan` | User-specific path | `| `C:\Users\nolan\PING\vault-backup.zip` | ? | Vau...` |
| BACKUP_REALITY_AUDIT.md | 42 | `C:\\Users\\nolan` | User-specific path | `- **Token exists**: `C:\Users\nolan\PING\auth_toke...` |
| backup_verification_report.md | 14 | `C:\\Users\\nolan` | User-specific path | `**Location:** C:\Users\nolan\PING\PING_backup_2026...` |
| backup_verification_report.md | 27 | `C:\\Users\\nolan` | User-specific path | `**Location:** C:\Users\nolan\PING\PING_constitutio...` |
| backup_verification_report.md | 79 | `C:\\Users\\nolan` | User-specific path | `**Location:** C:\Users\nolan\PING\...` |
| CIVILIZATION_RECONSTRUCTION_SPEC.md | 237 | `C:\\Users\\nolan` | User-specific path | `**C:\Users\nolan\PING\Status:** CONSTITUTIONAL FRE...` |
| COMMUNICATION_INFRASTRUCTURE_AUDIT.md | 79 | `C:\\Users\\nolan` | User-specific path | `PS C:\Users\nolan\PING> Select-String -Pattern "sm...` |
| COMMUNICATION_INFRASTRUCTURE_AUDIT.md | 86 | `C:\\Users\\nolan` | User-specific path | `PS C:\Users\nolan\PING> Select-String -Pattern "we...` |
| COMMUNICATION_INFRASTRUCTURE_AUDIT.md | 93 | `C:\\Users\\nolan` | User-specific path | `PS C:\Users\nolan\PING> Select-String -Pattern "ka...` |
| COMMUNICATION_INFRASTRUCTURE_AUDIT.md | 102 | `C:\\Users\\nolan` | User-specific path | `File: C:\Users\nolan\PING\brainos\newsletter\.env...` |
| compare_stacks.py | 6 | `C:\\Users\\nolan` | User-specific path | `with open(r'C:\Users\nolan\CRX\DUPLICATE_STACK_EVI...` |
| compare_stacks.py | 28 | `C:\\Users\\nolan` | User-specific path | `compare_dirs(r'C:\Users\nolan\CRX\kernel\commit-se...` |
| CONSTITUTIONAL_CERTIFICATION_STATUS.md | 98 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\CascadeProjects\crx-digestion-wo...` |
| CONSTITUTIONAL_CERTIFICATION_STATUS.md | 99 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\CascadeProjects\crx-newsletter-b...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 82 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\runtime\replay\...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 402 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\AppData\Local\hermes...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 415 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\runtime\replay\...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 424 | `C:\\Users\\nolan` | User-specific path | `**Knowledge Runtime:** `C:\Users\nolan\PING\braino...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 425 | `C:\\Users\\nolan` | User-specific path | `**Observability Runtime:** `C:\Users\nolan\PING\vo...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 430 | `C:\\Users\\nolan` | User-specific path | `**SWEEP10:** `C:\Users\nolan\PING\SWEEP10_CAPABILI...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 431 | `C:\\Users\\nolan` | User-specific path | `**SWEEP18:** `C:\Users\nolan\PING\SWEEP18_HERMES_L...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 439 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\brainos\newslet...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 470 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\brainos\rss\` a...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 499 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\brainos\researc...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 528 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\brainos\orchest...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 566 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\brainos\rss\kno...` |
| CONSTITUTIONAL_MIGRATION_READINESS.md | 605 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\brainos\orchest...` |
| constitutional_recovery_forensics.md | 174 | `C:\\Users\\nolan` | User-specific path | `**Evidence**: Directory C:/Users/nolan/PING_zip_ex...` |
| constitutional_recovery_matrix.md | 63 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\PING\runtime...` |
| constitutional_recovery_matrix.md | 138 | `C:\\Users\\nolan` | User-specific path | `**Evidence**: Phase 1 backup forensics confirmed C...` |
| constitutional_recovery_matrix.md | 193 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\PING\runtime...` |
| constitutional_recovery_matrix.md | 323 | `C:\\Users\\nolan` | User-specific path | `**Evidence**: Phase 1 backup forensics confirmed C...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 36 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 37 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 58 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 59 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 80 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 81 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 82 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 101 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 121 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 122 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 144 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\credentials\client_secret.j...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 145 | `C:\\Users\\nolan` | User-specific path | `- Referenced in `C:\Users\nolan\PING\config.yaml`...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 165 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 183 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 201 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 221 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| CREDENTIAL_AUTHORITY_CENSUS.md | 239 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\brainos\orchestration\confi...` |
| DEAD_CODE_VALIDATION.md | 32 | `C:\\Users\\nolan` | User-specific path | `| DEFINED | YES — All 27 files exist on host at `C...` |
| DEAD_CODE_VALIDATION.md | 58 | `C:\\Users\\nolan` | User-specific path | `7 files in `C:\Users\nolan\PING\workers/`:...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 4 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 32 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\PING\infra\`...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 62 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\PING\workspace\`...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 85 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\PING\constitutional-inte...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 111 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\CascadeProjects\constitu...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 137 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\PING\artifacts\`...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 160 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\CascadeProjects\infra\`...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 195 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\CascadeProjects\CRX_REMO...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 215 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\CascadeProjects\PING_OBS...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 235 | `C:\\Users\\nolan` | User-specific path | `**Path:** `C:\Users\nolan\CascadeProjects\research...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 331 | `C:\\Users\\nolan` | User-specific path | `| infra/ | C:\Users\nolan\PING\infra\ | 8 empty su...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 332 | `C:\\Users\\nolan` | User-specific path | `| workspace/ | C:\Users\nolan\PING\workspace\ | 1 ...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 333 | `C:\\Users\\nolan` | User-specific path | `| constitutional-integration-lab/ | C:\Users\nolan...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 334 | `C:\\Users\\nolan` | User-specific path | `| artifacts/ | C:\Users\nolan\PING\artifacts\ | 1 ...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 335 | `C:\\Users\\nolan` | User-specific path | `| CascadeProjects/constitutional-extraction-lab/ |...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 336 | `C:\\Users\\nolan` | User-specific path | `| CascadeProjects/infra/ | C:\Users\nolan\CascadeP...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 337 | `C:\\Users\\nolan` | User-specific path | `| CRX_REMOTE/ | C:\Users\nolan\CascadeProjects\CRX...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 338 | `C:\\Users\\nolan` | User-specific path | `| PING_OBSERVATORY/ | C:\Users\nolan\CascadeProjec...` |
| DELETE_CANDIDATES_CONSOLIDATION.md | 339 | `C:\\Users\\nolan` | User-specific path | `| research-pipeline/ | C:\Users\nolan\CascadeProje...` |
| dependency_graph.md | 4 | `C:\\Users\\nolan` | User-specific path | `This read-only audit verified the dependency graph...` |
| DRIVE_MIRROR_AUDIT.md | 13 | `C:\\Users\\nolan` | User-specific path | `| crx-runtime (main) | `C:\Users\nolan\PING` | `gi...` |
| DRIVE_MIRROR_AUDIT.md | 14 | `C:\\Users\\nolan` | User-specific path | `| runtime (submodule) | `C:\Users\nolan\PING\runti...` |
| DRIVE_MIRROR_AUDIT.md | 15 | `C:\\Users\\nolan` | User-specific path | `| knowledge | `C:\Users\nolan\PING\knowledge` | **...` |
| DRIVE_MIRROR_AUDIT.md | 16 | `C:\\Users\\nolan` | User-specific path | `| vos | `C:\Users\nolan\PING\vos` | **No remote se...` |
| DRIVE_MIRROR_AUDIT.md | 52 | `C:\\Users\\nolan` | User-specific path | `| **Code** | `C:\Users\nolan\PING` (local filesyst...` |
| DRIVE_MIRROR_AUDIT.md | 54 | `C:\\Users\\nolan` | User-specific path | `| **Vault (constitutional docs)** | `C:\Users\nola...` |
| DRIVE_MIRROR_AUDIT.md | 68 | `C:\\Users\\nolan` | User-specific path | `| DriveMirror/ | `C:\Users\nolan\PING\DriveMirror/...` |
| DRIVE_MIRROR_AUDIT.md | 139 | `C:\\Users\\nolan` | User-specific path | `**The `DriveMirror/` directory** at `C:\Users\nola...` |
| DUPLICATE_STACK_EVIDENCE.md | 3 | `C:\\Users\\nolan` | User-specific path | `Comparing `C:\Users\nolan\CRX\kernel\commit-servic...` |
| DUPLICATE_STACK_EVIDENCE.md | 8 | `C:\\Users\\nolan` | User-specific path | `* **Only in C:\Users\nolan\CRX\kernel\commit-servi...` |
| EXECUTION_PROOF_MATRIX.md | 16 | `C:\\Users\\nolan` | User-specific path | `## Root Worker Entry Points (15 Python files, `C:\...` |
| EXECUTION_PROOF_MATRIX.md | 83 | `C:\\Users\\nolan` | User-specific path | `| 15 root workers (`C:\Users\nolan\PING\*.py`) | *...` |
| FINAL_PRE_OLLAMA_CONSTITUTIONAL_AUDIT.md | 75 | `C:\\Users\\nolan` | User-specific path | `**File:** C:\Users\nolan\PING\.constitutional_snap...` |
| FINAL_PRE_OLLAMA_CONSTITUTIONAL_AUDIT.md | 108 | `C:\\Users\\nolan` | User-specific path | `**Storage Location:** C:\Users\nolan\PING\.constit...` |
| FINAL_PRE_OLLAMA_CONSTITUTIONAL_AUDIT.md | 118 | `C:\\Users\\nolan` | User-specific path | `**File:** C:\Users\nolan\PING\runtime\replay\witne...` |
| FINAL_PRE_OLLAMA_CONSTITUTIONAL_AUDIT.md | 163 | `C:\\Users\\nolan` | User-specific path | `**File:** C:\Users\nolan\PING\runtime\replay\deter...` |
| FINAL_PRE_OLLAMA_CONSTITUTIONAL_AUDIT.md | 243 | `C:\\Users\\nolan` | User-specific path | `- **File:** C:\Users\nolan\PING\runtime\replay\mer...` |
| generate_hash_manifest.py | 11 | `C:\\Users\\nolan` | User-specific path | `VAULT_PATH = r"C:\Users\nolan\PING\vault"...` |
| generate_immutable_hash.py | 11 | `C:\\Users\\nolan` | User-specific path | `IMMUTABLE_PATH = r"C:\Users\nolan\PING\vault\const...` |
| generate_projection_manifest.py | 11 | `C:\\Users\\nolan` | User-specific path | `VAULT_PATH = r"C:\Users\nolan\PING\vault"...` |
| generate_projection_manifest.py | 12 | `C:\\Users\\nolan` | User-specific path | `HASH_MANIFEST_PATH = r"C:\Users\nolan\PING\vault\H...` |
| GOOGLE_DRIVE_SURVIVABILITY_CERTIFICATION.md | 27 | `C:\\Users\\nolan` | User-specific path | `**File:** `C:\Users\nolan\PING\brainos\orchestrati...` |
| HASH_AUTHORITY_AUDIT.md | 112 | `C:\\Users\\nolan` | User-specific path | `**File:** `C:\Users\nolan\PING\simple_projection_w...` |
| IMPORT_GRAPH_FAILURES.md | 3 | `C:\\Users\\nolan` | User-specific path | `file: C:\Users\nolan\CRX\kernel\commit-service\src...` |
| IMPORT_GRAPH_FAILURES.md | 6 | `C:\\Users\\nolan` | User-specific path | `failure reason: Path unresolved: ./touch src/engin...` |
| IMPORT_GRAPH_FAILURES.md | 8 | `C:\\Users\\nolan` | User-specific path | `file: C:\Users\nolan\CRX\runtime\kernel\commit-ser...` |
| IMPORT_GRAPH_FAILURES.md | 11 | `C:\\Users\\nolan` | User-specific path | `failure reason: Path unresolved: ../../../replay/d...` |
| IMPORT_GRAPH_FAILURES.md | 13 | `C:\\Users\\nolan` | User-specific path | `file: C:\Users\nolan\CRX\runtime\replay\__tests__\...` |
| IMPORT_GRAPH_FAILURES.md | 16 | `C:\\Users\\nolan` | User-specific path | `failure reason: Path unresolved: ../fingerprint_au...` |
| IMPORT_GRAPH_FAILURES.md | 18 | `C:\\Users\\nolan` | User-specific path | `file: C:\Users\nolan\CRX\runtime\replay\__tests__\...` |
| IMPORT_GRAPH_FAILURES.md | 21 | `C:\\Users\\nolan` | User-specific path | `failure reason: Path unresolved: ../replay_domains...` |
| IMPORT_GRAPH_FAILURES.md | 23 | `C:\\Users\\nolan` | User-specific path | `file: C:\Users\nolan\CRX\runtime\replay\__tests__\...` |
| IMPORT_GRAPH_FAILURES.md | 26 | `C:\\Users\\nolan` | User-specific path | `failure reason: Path unresolved: ../replay_domains...` |
| MCP_CERTIFICATION.md | 83 | `C:\\Users\\nolan` | User-specific path | `**File Created:** `C:\Users\nolan\PING\mcp\ping_mc...` |
| MECHANICAL_VERIFICATION_MATRIX.md | 110 | `C:\\Users\\nolan` | User-specific path | `- Root `C:\Users\nolan\PING\*.py` = priority fail...` |
| MEMORY_SURVIVABILITY_CERTIFICATION.md | 31 | `C:\\Users\\nolan` | User-specific path | `cat > C:\Users\nolan\PING\vault\constitution\TEST_...` |
| MEMORY_SURVIVABILITY_CERTIFICATION.md | 51 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\PING\brainos\orchestration\src\p...` |
| MEMORY_SURVIVABILITY_CERTIFICATION.md | 131 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\PING\brainos\orchestration\src\p...` |
| MEMORY_SURVIVABILITY_CERTIFICATION.md | 193 | `C:\\Users\\nolan` | User-specific path | `python C:\Users\nolan\PING\generate_projection_man...` |
| MEMORY_SURVIVABILITY_CERTIFICATION.md | 196 | `C:\\Users\\nolan` | User-specific path | `cat C:\Users\nolan\PING\vault\projection_manifest....` |
| MEMORY_SURVIVABILITY_CERTIFICATION.md | 246 | `C:\\Users\\nolan` | User-specific path | `rm C:\Users\nolan\PING\vault\constitution\TEST_SUR...` |
| MEMORY_SURVIVABILITY_CERTIFICATION.md | 249 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\PING\brainos\orchestration\src\p...` |
| oauth_output.txt | 3 | `C:\\Users\\nolan` | User-specific path | `+ python C:\Users\nolan\PING\google_drive_oauth.py...` |
| oauth_output.txt | 8 | `C:\\Users\\nolan` | User-specific path | `File "C:\Users\nolan\PING\google_drive_oauth.py", ...` |
| oauth_output.txt | 10 | `C:\\Users\\nolan` | User-specific path | `File "C:\Users\nolan\PING\google_drive_oauth.py", ...` |
| oauth_output.txt | 12 | `C:\\Users\\nolan` | User-specific path | `File "C:\Users\nolan\AppData\Local\hermes\hermes-a...` |
| ollama_integration_surface.md | 46 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\CascadeProjects\infr...` |
| ollama_integration_surface.md | 62 | `C:\\Users\\nolan` | User-specific path | `**Location**: C:\Users\nolan\CRX\CascadeProjects\i...` |
| ollama_integration_surface.md | 82 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\CascadeProjects\infr...` |
| ollama_integration_surface.md | 102 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\audit\ollama_constit...` |
| ollama_integration_surface.md | 122 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\brainos\orchestratio...` |
| ollama_integration_surface.md | 142 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\infra\ollama\...` |
| ollama_integration_surface.md | 162 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\workers\ollama-worke...` |
| ollama_integration_surface.md | 182 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\MODEL_ROUTING_REPORT...` |
| ollama_integration_surface.md | 224 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\brainos\newsletter\P...` |
| ollama_integration_surface.md | 242 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\brainos\newsletter\P...` |
| ollama_integration_surface.md | 262 | `C:\\Users\\nolan` | User-specific path | `**File**: C:\Users\nolan\PING\brainos\newsletter\P...` |
| OPENWEBUI_SURFACE_CERTIFICATION.md | 62 | `C:\\Users\\nolan` | User-specific path | `**Deployment:** Copied from `C:\Users\nolan\PING\m...` |
| OWNER_DECISIONS_REQUIRED_CONSOLIDATION.md | 4 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| PHASE1_REPOSITORY_INVENTORY.md | 5 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| PHASE1_REPOSITORY_INVENTORY.md | 495 | `C:\\Users\\nolan` | User-specific path | `- `list_dir` on C:\Users\nolan\PING...` |
| PHASE1_REPOSITORY_INVENTORY.md | 500 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\README.md`...` |
| PHASE1_REPOSITORY_INVENTORY.md | 501 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\package.json`...` |
| PHASE1_REPOSITORY_INVENTORY.md | 502 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\gateway\package.json`...` |
| PHASE1_REPOSITORY_INVENTORY.md | 503 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\runtime\kernel\commit-servi...` |
| PHASE1_REPOSITORY_INVENTORY.md | 504 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\runtime\replay\package.json...` |
| PHASE1_REPOSITORY_INVENTORY.md | 505 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\knowledge\README.md`...` |
| PHASE1_REPOSITORY_INVENTORY.md | 506 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\vos\README.md`...` |
| PHASE1_REPOSITORY_INVENTORY.md | 507 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\runtime\README.md`...` |
| PHASE1_REPOSITORY_INVENTORY.md | 508 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\gateway\server.js` (first 5...` |
| PHASE1_REPOSITORY_INVENTORY.md | 509 | `C:\\Users\\nolan` | User-specific path | `- `C:\Users\nolan\PING\gateway\event_emitter.js` (...` |
| PHASE2_SYSTEM_DEPENDENCY_GRAPH.md | 5 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| PHASE3_DUPLICATION_MATRIX.md | 5 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| PHASE4_DEAD_CODE_INVENTORY.md | 5 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| PHASE5_ACTIVE_RUNTIME_MAP.md | 5 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| PHASE9_PING_LAYER_0_DEFINITION.md | 5 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| PHASE_S15_PRE_AUDIT_READINESS_REPORT.md | 4 | `C:\\Users\\nolan` | User-specific path | `**Repository:** C:\Users\nolan\PING...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 6 | `C:\\Users\\nolan` | User-specific path | `**Repository Root:** C:\Users\nolan\PING...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 794 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\runtime\...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 814 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\runtime\...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 834 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\runtime\...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 854 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\gateway\...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 874 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\brainos\...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 894 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\brainos\...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 914 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\constitu...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 934 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\knowledg...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 954 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\observat...` |
| PING_AUTHORITY_OWNERSHIP_MAP.md | 974 | `C:\\Users\\nolan` | User-specific path | `**CURRENT LOCATION:** C:\Users\nolan\PING\integrat...` |
| PING_BACKUPS.md | 54 | `C:\\Users\\nolan` | User-specific path | `rclone sync C:\Users\nolan\PING\vault ping-drive:P...` |
| PING_BACKUPS.md | 57 | `C:\\Users\\nolan` | User-specific path | `rclone sync C:\Users\nolan\PING\data ping-drive:PI...` |
| PING_BACKUPS.md | 60 | `C:\\Users\\nolan` | User-specific path | `rclone sync C:\Users\nolan\PING\brainos ping-drive...` |
| PING_BACKUPS.md | 67 | `C:\\Users\\nolan` | User-specific path | `rclone copy C:\Users\nolan\PING\vault ping-drive:P...` |
| PING_BACKUPS.md | 76 | `C:\\Users\\nolan` | User-specific path | `rclone copy ping-drive:PING/vault C:\Users\nolan\P...` |
| PING_ECOSYSTEM_INVENTORY.md | 12 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\constitution\ (constitutiona...` |
| PING_ECOSYSTEM_INVENTORY.md | 13 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\knowledge\authoritative\ (cl...` |
| PING_ECOSYSTEM_INVENTORY.md | 14 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\knowledge\inventory.json (11...` |
| PING_ECOSYSTEM_INVENTORY.md | 17 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\runtime\replay\ (TypeScript ...` |
| PING_ECOSYSTEM_INVENTORY.md | 18 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\runtime\kernel\ (kernel serv...` |
| PING_ECOSYSTEM_INVENTORY.md | 19 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\runtime\adapters\ (event ada...` |
| PING_ECOSYSTEM_INVENTORY.md | 20 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\kernel\ (empty directory)...` |
| PING_ECOSYSTEM_INVENTORY.md | 23 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\gateway\server.js (Express s...` |
| PING_ECOSYSTEM_INVENTORY.md | 24 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\gateway\event_emitter.js (ev...` |
| PING_ECOSYSTEM_INVENTORY.md | 27 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\workers\artifact-worker.yaml...` |
| PING_ECOSYSTEM_INVENTORY.md | 28 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\workers\gateway-worker.yaml...` |
| PING_ECOSYSTEM_INVENTORY.md | 29 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\workers\graph-worker.yaml...` |
| PING_ECOSYSTEM_INVENTORY.md | 30 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\workers\ollama-worker.yaml...` |
| PING_ECOSYSTEM_INVENTORY.md | 31 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\workers\research-worker.yaml...` |
| PING_ECOSYSTEM_INVENTORY.md | 34 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\vos\ (VOS infrastructure: ar...` |
| PING_ECOSYSTEM_INVENTORY.md | 37 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-newsletter-br...` |
| PING_ECOSYSTEM_INVENTORY.md | 38 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-digestion-wor...` |
| PING_ECOSYSTEM_INVENTORY.md | 39 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\PING_OBSERVATORY\...` |
| PING_ECOSYSTEM_INVENTORY.md | 40 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\research-pipeline...` |
| PING_ECOSYSTEM_INVENTORY.md | 43 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-newsletter-br...` |
| PING_ECOSYSTEM_INVENTORY.md | 44 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-digestion-wor...` |
| PING_ECOSYSTEM_INVENTORY.md | 45 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\gateway\server.js (Ollama in...` |
| PING_ECOSYSTEM_INVENTORY.md | 48 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\knowledge\ (110 files: 37 Au...` |
| PING_ECOSYSTEM_INVENTORY.md | 49 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\vos\ (VOS infrastructure: ar...` |
| PING_ECOSYSTEM_INVENTORY.md | 50 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-newsletter-br...` |
| PING_ECOSYSTEM_INVENTORY.md | 51 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-digestion-wor...` |
| PING_ECOSYSTEM_INVENTORY.md | 54 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\.gemini\antigravity\scratch\ping_...` |
| PING_ECOSYSTEM_INVENTORY.md | 55 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\.gemini\antigravity\scratch\ping_...` |
| PING_ECOSYSTEM_INVENTORY.md | 56 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\.gemini\antigravity\scratch\ping_...` |
| PING_ECOSYSTEM_INVENTORY.md | 57 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\.gemini\antigravity\scratch\ping_...` |
| PING_ECOSYSTEM_INVENTORY.md | 58 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\ping_presentation...` |
| PING_ECOSYSTEM_INVENTORY.md | 65 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\runtime\replay\...` |
| PING_ECOSYSTEM_INVENTORY.md | 73 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\gateway\...` |
| PING_ECOSYSTEM_INVENTORY.md | 81 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\brain\src\c...` |
| PING_ECOSYSTEM_INVENTORY.md | 90 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 98 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 106 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\PING_OBSERV...` |
| PING_ECOSYSTEM_INVENTORY.md | 114 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\research-pi...` |
| PING_ECOSYSTEM_INVENTORY.md | 122 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\.gemini\antigravity\scratch...` |
| PING_ECOSYSTEM_INVENTORY.md | 130 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\vos\...` |
| PING_ECOSYSTEM_INVENTORY.md | 149 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 150 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 154 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 155 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 159 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\gateway\server.js...` |
| PING_ECOSYSTEM_INVENTORY.md | 163 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 164 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 165 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\gateway\server.js...` |
| PING_ECOSYSTEM_INVENTORY.md | 178 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 179 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 183 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\brain\src\c...` |
| PING_ECOSYSTEM_INVENTORY.md | 184 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\gateway\event_emitter....` |
| PING_ECOSYSTEM_INVENTORY.md | 188 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\knowledge\authoritativ...` |
| PING_ECOSYSTEM_INVENTORY.md | 189 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\knowledge\authoritativ...` |
| PING_ECOSYSTEM_INVENTORY.md | 193 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\knowledge\authoritativ...` |
| PING_ECOSYSTEM_INVENTORY.md | 197 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\knowledge\inventory.js...` |
| PING_ECOSYSTEM_INVENTORY.md | 204 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\runtime\replay\witness...` |
| PING_ECOSYSTEM_INVENTORY.md | 205 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\runtime\replay\graph_v...` |
| PING_ECOSYSTEM_INVENTORY.md | 209 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\.gemini\antigravity\scratch...` |
| PING_ECOSYSTEM_INVENTORY.md | 311 | `C:\\Users\\nolan` | User-specific path | `- RISK: C:\Users\nolan\PING\kernel\ exists but is ...` |
| PING_ECOSYSTEM_INVENTORY.md | 312 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\kernel\...` |
| PING_ECOSYSTEM_INVENTORY.md | 316 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\brain\src\c...` |
| PING_ECOSYSTEM_INVENTORY.md | 317 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\gateway\event_emitter....` |
| PING_ECOSYSTEM_INVENTORY.md | 321 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 322 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 326 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 327 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 331 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 332 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 336 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 337 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 345 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 346 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 350 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\.gemini\antigravity\scratch...` |
| PING_ECOSYSTEM_INVENTORY.md | 357 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 382 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\.gemini\antigravity\scratch\ping_...` |
| PING_ECOSYSTEM_INVENTORY.md | 385 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\...` |
| PING_ECOSYSTEM_INVENTORY.md | 399 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\ping_presentation...` |
| PING_ECOSYSTEM_INVENTORY.md | 404 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\presentping\...` |
| PING_ECOSYSTEM_INVENTORY.md | 438 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-newsletter-br...` |
| PING_ECOSYSTEM_INVENTORY.md | 439 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-digestion-wor...` |
| PING_ECOSYSTEM_INVENTORY.md | 440 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\research-pipeline...` |
| PING_ECOSYSTEM_INVENTORY.md | 441 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\brain\ (empty ske...` |
| PING_ECOSYSTEM_INVENTORY.md | 444 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\...` |
| PING_ECOSYSTEM_INVENTORY.md | 456 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\brainos\...` |
| PING_ECOSYSTEM_INVENTORY.md | 500 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\...` |
| PING_ECOSYSTEM_INVENTORY.md | 504 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\observation\...` |
| PING_ECOSYSTEM_INVENTORY.md | 526 | `C:\\Users\\nolan` | User-specific path | `- EXISTS: C:\Users\nolan\PING\workers\ (artifact-w...` |
| PING_ECOSYSTEM_INVENTORY.md | 527 | `C:\\Users\\nolan` | User-specific path | `- EXISTS: C:\Users\nolan\PING\gateway\server.js (O...` |
| PING_ECOSYSTEM_INVENTORY.md | 532 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\...` |
| PING_ECOSYSTEM_INVENTORY.md | 536 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\integrations\...` |
| PING_ECOSYSTEM_INVENTORY.md | 554 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\...` |
| PING_ECOSYSTEM_INVENTORY.md | 595 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\.gemini\antigravity\scratch...` |
| PING_ECOSYSTEM_INVENTORY.md | 602 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 603 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 609 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 610 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 616 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 617 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 623 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 624 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 630 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-newslet...` |
| PING_ECOSYSTEM_INVENTORY.md | 631 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\CascadeProjects\crx-digesti...` |
| PING_ECOSYSTEM_INVENTORY.md | 640 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\engine\ (index-v...` |
| PING_ECOSYSTEM_INVENTORY.md | 641 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\config\ (32 conf...` |
| PING_ECOSYSTEM_INVENTORY.md | 642 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\artifacts\ (came...` |
| PING_ECOSYSTEM_INVENTORY.md | 643 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\metadata\ (prese...` |
| PING_ECOSYSTEM_INVENTORY.md | 644 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\exports\ (empty ...` |
| PING_ECOSYSTEM_INVENTORY.md | 645 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\package.json (de...` |
| PING_ECOSYSTEM_INVENTORY.md | 648 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\newsletter\ (144 fil...` |
| PING_ECOSYSTEM_INVENTORY.md | 649 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\rss\ (23 files from ...` |
| PING_ECOSYSTEM_INVENTORY.md | 650 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\research\ (2 files f...` |
| PING_ECOSYSTEM_INVENTORY.md | 651 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\orchestration\ (121 ...` |
| PING_ECOSYSTEM_INVENTORY.md | 652 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\agents\ (empty direc...` |
| PING_ECOSYSTEM_INVENTORY.md | 653 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\knowledge\ (empty di...` |
| PING_ECOSYSTEM_INVENTORY.md | 656 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\email\ (empty di...` |
| PING_ECOSYSTEM_INVENTORY.md | 657 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\rss\ (empty dire...` |
| PING_ECOSYSTEM_INVENTORY.md | 658 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\github\ (empty d...` |
| PING_ECOSYSTEM_INVENTORY.md | 659 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\youtube\ (empty ...` |
| PING_ECOSYSTEM_INVENTORY.md | 660 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\arxiv\ (empty di...` |
| PING_ECOSYSTEM_INVENTORY.md | 661 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\documents\ (empt...` |
| PING_ECOSYSTEM_INVENTORY.md | 662 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\chat\ (empty dir...` |
| PING_ECOSYSTEM_INVENTORY.md | 663 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\meetings\ (empty...` |
| PING_ECOSYSTEM_INVENTORY.md | 666 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\ollama\gateway\...` |
| PING_ECOSYSTEM_INVENTORY.md | 667 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\ollama\workers\...` |
| PING_ECOSYSTEM_INVENTORY.md | 668 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\obsidian\ (empt...` |
| PING_ECOSYSTEM_INVENTORY.md | 669 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\github\ (empty ...` |
| PING_ECOSYSTEM_INVENTORY.md | 670 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\external\ (empt...` |
| PING_ECOSYSTEM_INVENTORY.md | 673 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\ping_presentation...` |
| PING_ECOSYSTEM_INVENTORY.md | 674 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-newsletter-br...` |
| PING_ECOSYSTEM_INVENTORY.md | 675 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\crx-digestion-wor...` |
| PING_ECOSYSTEM_INVENTORY.md | 676 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\research-pipeline...` |
| PING_ECOSYSTEM_INVENTORY.md | 677 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\CascadeProjects\brain\ (original ...` |
| PING_ECOSYSTEM_INVENTORY.md | 684 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\presentping\...` |
| PING_ECOSYSTEM_INVENTORY.md | 685 | `C:\\Users\\nolan` | User-specific path | `- Status: COPIED from C:\Users\nolan\.gemini\antig...` |
| PING_ECOSYSTEM_INVENTORY.md | 690 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\brainos\newsletter\...` |
| PING_ECOSYSTEM_INVENTORY.md | 691 | `C:\\Users\\nolan` | User-specific path | `- Status: COPIED from C:\Users\nolan\CascadeProjec...` |
| PING_ECOSYSTEM_INVENTORY.md | 696 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\brainos\rss\...` |
| PING_ECOSYSTEM_INVENTORY.md | 697 | `C:\\Users\\nolan` | User-specific path | `- Status: COPIED from C:\Users\nolan\CascadeProjec...` |
| PING_ECOSYSTEM_INVENTORY.md | 702 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\brainos\research\...` |
| PING_ECOSYSTEM_INVENTORY.md | 703 | `C:\\Users\\nolan` | User-specific path | `- Status: COPIED from C:\Users\nolan\CascadeProjec...` |
| PING_ECOSYSTEM_INVENTORY.md | 708 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\brainos\orchestration\...` |
| PING_ECOSYSTEM_INVENTORY.md | 709 | `C:\\Users\\nolan` | User-specific path | `- Status: COPIED from C:\Users\nolan\CascadeProjec...` |
| PING_ECOSYSTEM_INVENTORY.md | 714 | `C:\\Users\\nolan` | User-specific path | `- Path: C:\Users\nolan\PING\integrations\ollama\...` |
| PING_ECOSYSTEM_INVENTORY.md | 715 | `C:\\Users\\nolan` | User-specific path | `- Status: COPIED from C:\Users\nolan\PING\gateway\...` |
| PING_ECOSYSTEM_INVENTORY.md | 724 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\metadata\present...` |
| PING_ECOSYSTEM_INVENTORY.md | 725 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\metadata\present...` |
| PING_ECOSYSTEM_INVENTORY.md | 726 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\metadata\present...` |
| PING_ECOSYSTEM_INVENTORY.md | 727 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\engine\presentat...` |
| PING_ECOSYSTEM_INVENTORY.md | 728 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\artifacts\camera...` |
| PING_ECOSYSTEM_INVENTORY.md | 729 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\artifacts\distri...` |
| PING_ECOSYSTEM_INVENTORY.md | 730 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\artifacts\failur...` |
| PING_ECOSYSTEM_INVENTORY.md | 731 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\artifacts\packet...` |
| PING_ECOSYSTEM_INVENTORY.md | 732 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\artifacts\world-...` |
| PING_ECOSYSTEM_INVENTORY.md | 735 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\newsletter\newslette...` |
| PING_ECOSYSTEM_INVENTORY.md | 736 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\newsletter_candidates.json (...` |
| PING_ECOSYSTEM_INVENTORY.md | 737 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\newsletter\knowledge...` |
| PING_ECOSYSTEM_INVENTORY.md | 740 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\rss\knowledge.db (SQ...` |
| PING_ECOSYSTEM_INVENTORY.md | 741 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\rss\sources.yaml (RS...` |
| PING_ECOSYSTEM_INVENTORY.md | 744 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\orchestration\docs\ ...` |
| PING_ECOSYSTEM_INVENTORY.md | 745 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\orchestration\src\co...` |
| PING_ECOSYSTEM_INVENTORY.md | 777 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\presentping\ (V17 engine, co...` |
| PING_ECOSYSTEM_INVENTORY.md | 782 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\newsletter\ (Yahoo M...` |
| PING_ECOSYSTEM_INVENTORY.md | 783 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\rss\ (RSS ingestion)...` |
| PING_ECOSYSTEM_INVENTORY.md | 784 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\research\ (research ...` |
| PING_ECOSYSTEM_INVENTORY.md | 785 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\orchestration\ (cons...` |
| PING_ECOSYSTEM_INVENTORY.md | 786 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\agents\ (future agen...` |
| PING_ECOSYSTEM_INVENTORY.md | 787 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\brainos\knowledge\ (future u...` |
| PING_ECOSYSTEM_INVENTORY.md | 792 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\email\ (placehol...` |
| PING_ECOSYSTEM_INVENTORY.md | 793 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\rss\ (placeholde...` |
| PING_ECOSYSTEM_INVENTORY.md | 794 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\github\ (placeho...` |
| PING_ECOSYSTEM_INVENTORY.md | 795 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\youtube\ (placeh...` |
| PING_ECOSYSTEM_INVENTORY.md | 796 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\arxiv\ (placehol...` |
| PING_ECOSYSTEM_INVENTORY.md | 797 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\documents\ (plac...` |
| PING_ECOSYSTEM_INVENTORY.md | 798 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\chat\ (placehold...` |
| PING_ECOSYSTEM_INVENTORY.md | 799 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\observation\meetings\ (place...` |
| PING_ECOSYSTEM_INVENTORY.md | 804 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\ollama\gateway\...` |
| PING_ECOSYSTEM_INVENTORY.md | 805 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\ollama\workers\...` |
| PING_ECOSYSTEM_INVENTORY.md | 806 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\obsidian\ (plac...` |
| PING_ECOSYSTEM_INVENTORY.md | 807 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\github\ (placeh...` |
| PING_ECOSYSTEM_INVENTORY.md | 808 | `C:\\Users\\nolan` | User-specific path | `- C:\Users\nolan\PING\integrations\external\ (plac...` |
| PING_ECOSYSTEM_INVENTORY.md | 821 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\brainos\newsletter\wor...` |
| PING_ECOSYSTEM_INVENTORY.md | 822 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\brainos\rss\worker.py...` |
| PING_ECOSYSTEM_INVENTORY.md | 828 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\brainos\newsletter\.en...` |
| PING_ECOSYSTEM_INVENTORY.md | 829 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\brainos\rss\.env.examp...` |
| PING_ECOSYSTEM_INVENTORY.md | 835 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\brainos\newsletter\new...` |
| PING_ECOSYSTEM_INVENTORY.md | 836 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\brainos\rss\knowledge....` |
| PING_ECOSYSTEM_INVENTORY.md | 842 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\brainos\newsletter\doc...` |
| PING_ECOSYSTEM_INVENTORY.md | 843 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\brainos\rss\docker-com...` |
| PING_ECOSYSTEM_INVENTORY.md | 849 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\presentping\package.js...` |
| PING_ECOSYSTEM_INVENTORY.md | 855 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\integrations\ollama\ga...` |
| PING_ECOSYSTEM_INVENTORY.md | 856 | `C:\\Users\\nolan` | User-specific path | `- PATH: C:\Users\nolan\PING\integrations\ollama\wo...` |
| PING_ECOSYSTEM_INVENTORY.md | 861 | `C:\\Users\\nolan` | User-specific path | `- SUCCESS: All systems now live under C:\Users\nol...` |
| PING_ECOSYSTEM_INVENTORY.md | 862 | `C:\\Users\\nolan` | User-specific path | `- SUCCESS: PresentPING colocated at C:\Users\nolan...` |
| PING_ECOSYSTEM_INVENTORY.md | 863 | `C:\\Users\\nolan` | User-specific path | `- SUCCESS: BrainOS colocated at C:\Users\nolan\PIN...` |
| PING_ECOSYSTEM_INVENTORY.md | 864 | `C:\\Users\\nolan` | User-specific path | `- SUCCESS: Observation structure created at C:\Use...` |
| PING_ECOSYSTEM_INVENTORY.md | 865 | `C:\\Users\\nolan` | User-specific path | `- SUCCESS: Integrations structure created at C:\Us...` |
| PING_ECOSYSTEM_INVENTORY.md | 898 | `C:\\Users\\nolan` | User-specific path | `**Source:** C:\Users\nolan\PING\docs\constitutiona...` |
| PING_ECOSYSTEM_INVENTORY.md | 905 | `C:\\Users\\nolan` | User-specific path | `1. C:\Users\nolan\PING\CONSOLIDATION_AUDIT_PHASE1_...` |
| PING_ECOSYSTEM_INVENTORY.md | 906 | `C:\\Users\\nolan` | User-specific path | `2. C:\Users\nolan\PING\CONSOLIDATION_AUDIT_PHASE2_...` |
| PING_ECOSYSTEM_INVENTORY.md | 907 | `C:\\Users\\nolan` | User-specific path | `3. C:\Users\nolan\PING\CONSOLIDATION_AUDIT_PHASE3_...` |
| PING_ECOSYSTEM_INVENTORY.md | 908 | `C:\\Users\\nolan` | User-specific path | `4. C:\Users\nolan\PING\CONSOLIDATION_AUDIT_PHASE4_...` |
| PING_ECOSYSTEM_INVENTORY.md | 909 | `C:\\Users\\nolan` | User-specific path | `5. C:\Users\nolan\PING\CONSOLIDATION_AUDIT_PHASE5_...` |
| PING_ECOSYSTEM_INVENTORY.md | 910 | `C:\\Users\\nolan` | User-specific path | `6. C:\Users\nolan\PING\CONSOLIDATION_AUDIT_PHASE6_...` |
| PING_ECOSYSTEM_INVENTORY.md | 911 | `C:\\Users\\nolan` | User-specific path | `7. C:\Users\nolan\PING\CONSOLIDATION_AUDIT_PHASE7_...` |
| PING_ECOSYSTEM_INVENTORY.md | 912 | `C:\\Users\\nolan` | User-specific path | `8. C:\Users\nolan\PING\CONSOLIDATION_AUDIT_PHASE8_...` |
| PING_ECOSYSTEM_INVENTORY.md | 913 | `C:\\Users\\nolan` | User-specific path | `9. C:\Users\nolan\PING\CONSOLIDATION_AUDIT_PHASE9_...` |
| PING_ECOSYSTEM_INVENTORY.md | 914 | `C:\\Users\\nolan` | User-specific path | `10. C:\Users\nolan\PING\CONSTITUTIONAL_KERNEL_PATC...` |
| PING_ECOSYSTEM_INVENTORY.md | 915 | `C:\\Users\\nolan` | User-specific path | `11. C:\Users\nolan\PING\SWEEP_A5_SOVEREIGNTY_MIGRA...` |
| PING_ECOSYSTEM_INVENTORY.md | 918 | `C:\\Users\\nolan` | User-specific path | `12. C:\Users\nolan\PING\runtime\kernel\commit-serv...` |
| PING_ECOSYSTEM_INVENTORY.md | 921 | `C:\\Users\\nolan` | User-specific path | `13. C:\Users\nolan\PING\constitutional-integration...` |
| PING_ECOSYSTEM_INVENTORY.md | 922 | `C:\\Users\\nolan` | User-specific path | `14. C:\Users\nolan\PING\artifacts\...` |
| PING_ECOSYSTEM_INVENTORY.md | 923 | `C:\\Users\\nolan` | User-specific path | `15. C:\Users\nolan\PING\infra\...` |
| PING_V02_IMPLEMENTATION_COMPLETE.md | 233 | `C:\\Users\\nolan` | User-specific path | `VAULT_PATH=C:\Users\nolan\PING\vault...` |
| PIPELINE_READY.md | 28 | `C:\\Users\\nolan` | User-specific path | `- **Master Recording**: `C:\Users\nolan\Videos\rec...` |
| PIPELINE_READY.md | 29 | `C:\\Users\\nolan` | User-specific path | `- **Guest Isolated**: `C:\Users\nolan\Videos\recor...` |
| PIPELINE_READY.md | 35 | `C:\\Users\\nolan` | User-specific path | `- **Processed Output**: `C:\Users\nolan\Videos\pro...` |
| PIPELINE_READY.md | 53 | `C:\\Users\\nolan` | User-specific path | `**BrainOS Newsletter** (`C:\Users\nolan\PING\brain...` |
| PIPELINE_READY.md | 61 | `C:\\Users\\nolan` | User-specific path | `**BrainOS RSS** (`C:\Users\nolan\PING\brainos\rss\...` |
| PIPELINE_READY.md | 69 | `C:\\Users\\nolan` | User-specific path | `**BrainOS Research** (`C:\Users\nolan\PING\brainos...` |
| PIPELINE_READY.md | 79 | `C:\\Users\\nolan` | User-specific path | `**Brain Infrastructure** (`C:\Users\nolan\CascadeP...` |
| PIPELINE_READY.md | 92 | `C:\\Users\\nolan` | User-specific path | `**Research Worker** (`C:\Users\nolan\PING\workers\...` |
| PIPELINE_READY.md | 99 | `C:\\Users\\nolan` | User-specific path | `**Newsletter Worker** (`C:\Users\nolan\PING\braino...` |
| PIPELINE_READY.md | 105 | `C:\\Users\\nolan` | User-specific path | `**RSS Worker** (`C:\Users\nolan\PING\brainos\rss\w...` |
| PIPELINE_READY.md | 157 | `C:\\Users\\nolan` | User-specific path | `- No file watcher on `C:\Users\nolan\Videos\record...` |
| PIPELINE_READY.md | 306 | `C:\\Users\\nolan` | User-specific path | `- **Source**: `C:\Users\nolan\PING\brainos\researc...` |
| PIPELINE_READY.md | 313 | `C:\\Users\\nolan` | User-specific path | `- **Source**: `C:\Users\nolan\PING\brainos\newslet...` |
| PIPELINE_READY.md | 322 | `C:\\Users\\nolan` | User-specific path | `- **Source**: `C:\Users\nolan\Videos\recordings\ma...` |
| PIPELINE_READY.md | 329 | `C:\\Users\\nolan` | User-specific path | `- **Source**: `C:\Users\nolan\Videos\processed\`...` |
| PIPELINE_READY.md | 374 | `C:\\Users\\nolan` | User-specific path | `1. Create Python file watcher for `C:\Users\nolan\...` |
| PIPELINE_READY.md | 376 | `C:\\Users\\nolan` | User-specific path | `3. Output to `C:\Users\nolan\Videos\processed\` wi...` |
| PIPELINE_READY.md | 527 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\pipeline\record...` |
| PIPELINE_READY.md | 574 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\pipeline\conten...` |
| PIPELINE_READY.md | 647 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\pipeline\conten...` |
| PIPELINE_READY.md | 657 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\CascadeProjects\brain\infrastruc...` |
| PIPELINE_READY.md | 683 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\pipeline\...` |
| PIPELINE_READY.md | 698 | `C:\\Users\\nolan` | User-specific path | `**Location:** `C:\Users\nolan\PING\pipeline\`...` |
| POST_PATCH_EXECUTION_GRAPH.md | 3 | `C:\\Users\\nolan` | User-specific path | `**Repository Root**: C:\Users\nolan\CRX...` |
| POST_PATCH_EXECUTION_GRAPH.md | 12 | `C:\\Users\\nolan` | User-specific path | `- **Location**: C:\Users\nolan\CRX\gateway\server....` |
| POST_PATCH_EXECUTION_GRAPH.md | 18 | `C:\\Users\\nolan` | User-specific path | `- **Location**: C:\Users\nolan\CRX\kernel\commit-s...` |
| POST_PATCH_EXECUTION_GRAPH.md | 24 | `C:\\Users\\nolan` | User-specific path | `- **Location**: C:\Users\nolan\CRX\runtime\kernel\...` |
| PRESENTPING_INFRASTRUCTURE_ALIGNMENT.md | 14 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\presentping...` |
| PRESENTPING_INFRASTRUCTURE_ALIGNMENT.md | 262 | `C:\\Users\\nolan` | User-specific path | `PresentPING should live at `C:\Users\nolan\PING\pr...` |
| PRESENTPING_RECOVERY_PLAN.md | 11 | `C:\\Users\\nolan` | User-specific path | `**Canonical Location:** C:\Users\nolan\PING\presen...` |
| PRESENTPING_RECOVERY_PLAN.md | 12 | `C:\\Users\\nolan` | User-specific path | `**Mirror Location:** C:\Users\nolan\.gemini\antigr...` |
| PRESENTPING_RECOVERY_PLAN.md | 13 | `C:\\Users\\nolan` | User-specific path | `**Legacy Location:** C:\Users\nolan\CascadeProject...` |
| PRESENTPING_RECOVERY_PLAN.md | 158 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\PING\presentping...` |
| PRESENTPING_RECOVERY_PLAN.md | 166 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\PING\presentping\engine...` |
| PRESENTPING_RECOVERY_PLAN.md | 174 | `C:\\Users\\nolan` | User-specific path | `ls C:\Users\nolan\PING\presentping\engine\*.pptx...` |
| PRESENTPING_RECOVERY_PLAN.md | 175 | `C:\\Users\\nolan` | User-specific path | `ls C:\Users\nolan\PING\presentping\exports\*.pptx...` |
| PRESENTPING_RECOVERY_PLAN.md | 186 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\CascadeProjects\ping_presentatio...` |
| PRESENTPING_RECOVERY_PLAN.md | 195 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\.gemini\antigravity\scratch\ping...` |
| PRESENTPING_RECOVERY_PLAN.md | 308 | `C:\\Users\\nolan` | User-specific path | `3. Preserve current presentping directory (C:\User...` |
| PRE_PATCH_STATE.md | 3 | `C:\\Users\\nolan` | User-specific path | `**Repository Root**: C:\Users\nolan\CRX...` |
| PRE_PATCH_STATE.md | 78 | `C:\\Users\\nolan` | User-specific path | `- Location: C:\Users\nolan\CRX\kernel\commit-servi...` |
| PRE_PATCH_STATE.md | 85 | `C:\\Users\\nolan` | User-specific path | `- Location: C:\Users\nolan\CRX\runtime\kernel\comm...` |
| PRODUCTION_EXECUTION_GRAPH.md | 3 | `C:\\Users\\nolan` | User-specific path | `**Repository Root**: C:\Users\nolan\CRX...` |
| projection_rebuild_playbook.md | 71 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\PING\brainos\orchestration\src\p...` |
| projection_rebuild_playbook.md | 178 | `C:\\Users\\nolan` | User-specific path | `cd C:\Users\nolan\PING\brainos\orchestration\infra...` |
| PROPOSED_VAULT_TREE.md | 31 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\Documents\Codex\2026-05-31\phase-1a...` |
| PROPOSED_VAULT_TREE.md | 32 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\docs\architec...` |
| PROPOSED_VAULT_TREE.md | 33 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\docs\architec...` |
| PROPOSED_VAULT_TREE.md | 34 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\docs\architec...` |
| PROPOSED_VAULT_TREE.md | 35 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\docs\architec...` |
| PROPOSED_VAULT_TREE.md | 36 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\docs\protocol...` |
| PROPOSED_VAULT_TREE.md | 37 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\docs\runtime\...` |
| PROPOSED_VAULT_TREE.md | 38 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\certific...` |
| PROPOSED_VAULT_TREE.md | 39 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\PING_OBSERVATORY\PI...` |
| PROPOSED_VAULT_TREE.md | 40 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\ping_presentation\p...` |
| PROPOSED_VAULT_TREE.md | 41 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\ping_presentation\p...` |
| PROPOSED_VAULT_TREE.md | 42 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CascadeProjects\infra\ui-next\...` |
| PROPOSED_VAULT_TREE.md | 43 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\knowledge\derived\ai-memory-ar...` |
| PROPOSED_VAULT_TREE.md | 44 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\knowledge\derived\ai-retrieval...` |
| PROPOSED_VAULT_TREE.md | 45 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\knowledge\derived\cvm-referenc...` |
| PROPOSED_VAULT_TREE.md | 46 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\knowledge\derived\signal-inges...` |
| PROPOSED_VAULT_TREE.md | 47 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\vos\cos\ARCHITECTURE.md -> C:\...` |
| PROPOSED_VAULT_TREE.md | 53 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\Documents\Codex\2026-05-31\phase-1a...` |
| PROPOSED_VAULT_TREE.md | 54 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\Documents\Codex\2026-06-04\files-me...` |
| PROPOSED_VAULT_TREE.md | 55 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\Documents\Codex\2026-06-04\files-me...` |
| PROPOSED_VAULT_TREE.md | 56 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\docs\constitu...` |
| PROPOSED_VAULT_TREE.md | 57 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\docs\constitu...` |
| PROPOSED_VAULT_TREE.md | 58 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\docs\runtime\...` |
| PROPOSED_VAULT_TREE.md | 59 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\brain\external\crx-...` |
| PROPOSED_VAULT_TREE.md | 60 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 61 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 62 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 63 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 64 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 65 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 66 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 67 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 68 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 69 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 70 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 71 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 72 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 73 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 74 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 75 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\crx-newsletter-brai...` |
| PROPOSED_VAULT_TREE.md | 76 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\CascadeP...` |
| PROPOSED_VAULT_TREE.md | 77 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\certific...` |
| PROPOSED_VAULT_TREE.md | 78 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\certific...` |
| PROPOSED_VAULT_TREE.md | 79 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\certific...` |
| PROPOSED_VAULT_TREE.md | 80 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\constitu...` |
| PROPOSED_VAULT_TREE.md | 81 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\constitu...` |
| PROPOSED_VAULT_TREE.md | 82 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\reports\...` |
| PROPOSED_VAULT_TREE.md | 83 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\reports\...` |
| PROPOSED_VAULT_TREE.md | 84 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\reports\...` |
| PROPOSED_VAULT_TREE.md | 85 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\reports\...` |
| PROPOSED_VAULT_TREE.md | 86 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\reports\...` |
| PROPOSED_VAULT_TREE.md | 87 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\reports\...` |
| PROPOSED_VAULT_TREE.md | 88 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\reports\...` |
| PROPOSED_VAULT_TREE.md | 89 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\CRX_REMOTE\reports\...` |
| PROPOSED_VAULT_TREE.md | 90 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\ping_presentation\V...` |
| PROPOSED_VAULT_TREE.md | 91 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\CascadeProjects\ping_presentation\W...` |
| PROPOSED_VAULT_TREE.md | 92 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\ACTIVE_FLOW_AUDIT.md -> C:\PIN...` |
| PROPOSED_VAULT_TREE.md | 93 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit_hardening_precommit_repo...` |
| PROPOSED_VAULT_TREE.md | 94 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\AUTHORITY_AUDIT_RAW.txt -> C:\...` |
| PROPOSED_VAULT_TREE.md | 95 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\AUTHORITY_FLOW_RECONCILIATION_...` |
| PROPOSED_VAULT_TREE.md | 96 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\AUTHORITY_MOVEMENT_AUDIT.md ->...` |
| PROPOSED_VAULT_TREE.md | 97 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CANONICALITY_AUDIT.md -> C:\PI...` |
| PROPOSED_VAULT_TREE.md | 98 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CIVILIZATION_DETECTION_AUDIT_C...` |
| PROPOSED_VAULT_TREE.md | 99 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CONTINUITY_DESTRUCTION_AUDIT.m...` |
| PROPOSED_VAULT_TREE.md | 100 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\DEAD_CODE_AUDIT.md -> C:\PING\...` |
| PROPOSED_VAULT_TREE.md | 101 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\DUPLICATION_AUDIT.md -> C:\PIN...` |
| PROPOSED_VAULT_TREE.md | 102 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\LINEAGE_STORE_AUDIT.md -> C:\P...` |
| PROPOSED_VAULT_TREE.md | 103 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\OLLAMA_AUDIT.md -> C:\PING\vau...` |
| PROPOSED_VAULT_TREE.md | 104 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PHASE6_PING_ABSORPTION_AUDIT.m...` |
| PROPOSED_VAULT_TREE.md | 105 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PHASE_E_INFRASTRUCTURE_SOVEREI...` |
| PROPOSED_VAULT_TREE.md | 106 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_ABSORPTION_AUDIT.md -> C:...` |
| PROPOSED_VAULT_TREE.md | 107 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\PING_REPOSITORY_TRUTH_AUDIT.md...` |
| PROPOSED_VAULT_TREE.md | 108 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\REPOSITORY_GOVERNANCE_AUDIT.md...` |
| PROPOSED_VAULT_TREE.md | 109 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SQLITE_RECONSTRUCTION_AUDIT.md...` |
| PROPOSED_VAULT_TREE.md | 110 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP10_CAPABILITY_AUTHORITY_A...` |
| PROPOSED_VAULT_TREE.md | 111 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP10_TIME_AUTHORITY_AUDIT.m...` |
| PROPOSED_VAULT_TREE.md | 112 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP11_EVENT_AUTHORITY_AUDIT....` |
| PROPOSED_VAULT_TREE.md | 113 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP12_KNOWLEDGE_FABRIC_AUDIT...` |
| PROPOSED_VAULT_TREE.md | 114 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP13_AGENT_CONTAINMENT_AUDI...` |
| PROPOSED_VAULT_TREE.md | 115 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP14_RETRIEVAL_AUDIT.md -> ...` |
| PROPOSED_VAULT_TREE.md | 116 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP15_SURVIVABILITY_AUDIT.md...` |
| PROPOSED_VAULT_TREE.md | 117 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP16_ECONOMIC_AUTHORITY_AUD...` |
| PROPOSED_VAULT_TREE.md | 118 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP17_DECISION_QUALITY_AUDIT...` |
| PROPOSED_VAULT_TREE.md | 119 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP4_REPLAY_WITNESS_AUDIT.md...` |
| PROPOSED_VAULT_TREE.md | 120 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP5_SOVEREIGNTY_OPTIONALITY...` |
| PROPOSED_VAULT_TREE.md | 121 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP7_PING_ADAPTER_INSERTION_...` |
| PROPOSED_VAULT_TREE.md | 122 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\SWEEP8_PERSISTENCE_ABSTRACTION...` |
| PROPOSED_VAULT_TREE.md | 123 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\TEST_COVERAGE_AUDIT.md -> C:\P...` |
| PROPOSED_VAULT_TREE.md | 124 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\VALIDATION_AUDITS_BEFORE_IMPLE...` |
| PROPOSED_VAULT_TREE.md | 125 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\artifact_commit_monocult...` |
| PROPOSED_VAULT_TREE.md | 126 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\audit_hardening_sweep.md...` |
| PROPOSED_VAULT_TREE.md | 127 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\crx_runtime_archaeology_...` |
| PROPOSED_VAULT_TREE.md | 128 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\operational_audit_modes....` |
| PROPOSED_VAULT_TREE.md | 129 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\audit\replay_protocol_closure_...` |
| PROPOSED_VAULT_TREE.md | 130 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CascadeProjects\infra\AUTHORIT...` |
| PROPOSED_VAULT_TREE.md | 131 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\CascadeProjects\infra\INFRA_AU...` |
| PROPOSED_VAULT_TREE.md | 132 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSOLIDAT...` |
| PROPOSED_VAULT_TREE.md | 133 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSOLIDAT...` |
| PROPOSED_VAULT_TREE.md | 134 | `C:\\Users\\nolan` | User-specific path | `C:\Users\nolan\PING\docs\constitutional\CONSOLIDAT...` |
