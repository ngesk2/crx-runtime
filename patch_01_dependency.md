# Patch 01: Dependency Corrections

## Recommended Structural Changes
- **Move Interfaces:** Extract ReplayID generation from Identity to ReplayAuthority.
- **Remove Imports:** Remove `qdrant_projection_worker.py` imports of repository structures.
- **Introduce Boundaries:** Add strict Dependency Injection between Identity and Execution layers.

No business logic or implementation changes are proposed. Only dependency flow correction.
