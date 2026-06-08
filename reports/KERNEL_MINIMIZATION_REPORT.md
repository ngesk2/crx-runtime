# Kernel Minimization Report
**Version:** Pre-Replay Execution  
**Classification:** Forensics (Read-Only)

This report defines the smallest possible permanent kernel for the constitutional substrate.

---

## 1. Minimal Kernel Boundaries

The minimum possible kernel consists of 4 core boundaries that must run in isolation:

1. **Canonicalization (`kernel/canonical/`):** Norms values to a deterministic structure.
2. **Fingerprinting (`kernel/fingerprint/`):** Generates domain-separated byte fingerprints.
3. **Identity (`kernel/identity/`):** Maps domain keys and validates signatures.
4. **Lineage (`kernel/lineage/`):** Runs loop checks over the dependency DAG.

Replay and Witness are execution validation components that sit outside the pure kernel boundary.

---

## 2. Capability Status

- **Canonicalization:** **Fully exists** in `JS.txt`; **partially exists** in CRX runtime.
- **Fingerprinting:** **Fully exists** in `JS.txt`; **partially exists** in CRX runtime.
- **Identity:** **Missing entirely** (spec-only; needs to be designed).
- **Lineage:** **Fully exists** in `JS.txt`; **partially exists** in CRX runtime.
- **Replay:** **Fully exists** in `JS.txt`; **missing entirely** from CRX runtime.
- **Witness:** **Fully exists** in `JS.txt`; **missing entirely** from CRX runtime.\n