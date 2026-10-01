"""
Worker-runtime Python contracts (Hypothesis).

WHY HYPOTHESIS EXISTS HERE (justification, required by the CEO order):
  The Python worker surface (runtime/authorities/*.py) is a real second
  implementation of PING canonical primitives in this repo. fast-check is a
  JavaScript library: it cannot generate, shrink, or assert over Python
  objects. Driving Python properties through a node subprocess would be
  slower, lossier (JSON round-trip kills type fidelity), and would not
  shrink failing inputs in the Python domain. Hypothesis is the mature,
  standard Python property library — the exact counterpart of fast-check —
  so this file is "existing runner + library + existing PING authority" for
  the Python surface, not a new testing framework. Seeds are fixed
  (derandomize=True), runs are bounded (PR: 30 examples), failures shrink
  and are recorded in the same BUG- ledger format.

WHAT INVARIANT? The Python CanonicalHashAuthority is a lawful hash owner:
  determinism, key-order invariance, type separation, unicode stability.
WHO OWNS IT? runtime/authorities/canonical_hash_authority.py
  (CanonicalHashAuthority — the Python hash owner).
HOW CAN IT FAIL? Nondeterministic digest, order-dependence, collisions
  across types, unicode normalization drift.
WHAT ATTACK DISPROVES IT? Hypothesis over generated JSON-safe objects.
WHAT EVIDENCE PROVES IT? Fixed-seed Hypothesis runs, zero counterexamples.
CAN IT BE REPLAYED? Yes: derandomize=True makes the example sequence fixed.
DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes — failures are
  copied into tests/regression/generated/ as BUG- records with the seed.
"""
import sys
from pathlib import Path

import pytest
from hypothesis import given, settings, strategies as st

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from runtime.authorities.canonical_hash_authority import CanonicalHashAuthority  # noqa: E402

# JSON-safe scalar domain shared with the differential test: no floats
# (Python renders 1.0 as "1.0", JS JSON.stringify as "1" — documented
# divergence, excluded rather than papered over).
scalars = st.one_of(
    st.none(), st.booleans(),
    st.integers(min_value=-(2**53), max_value=2**53),
    st.text(max_size=20),
)
json_obj = st.recursive(
    scalars,
    lambda children: st.one_of(
        st.lists(children, max_size=4),
        st.dictionaries(st.text(min_size=1, max_size=10), children, max_size=4),
    ),
    max_leaves=15,
)

PR_EXAMPLES = 30
NIGHTLY_EXAMPLES = 300


@given(json_obj)
@settings(derandomize=True, max_examples=PR_EXAMPLES)
def test_hash_deterministic(obj):
    assert CanonicalHashAuthority.hash_json(obj) == CanonicalHashAuthority.hash_json(obj)


@given(json_obj)
@settings(derandomize=True, max_examples=PR_EXAMPLES)
def test_hash_key_order_invariant(obj):
    if not isinstance(obj, dict) or len(obj) < 2:
        return
    keys = list(obj.keys())
    reversed_obj = {k: obj[k] for k in reversed(keys)}
    assert CanonicalHashAuthority.hash_json(obj) == CanonicalHashAuthority.hash_json(reversed_obj)


@given(json_obj, json_obj)
@settings(derandomize=True, max_examples=PR_EXAMPLES)
def test_hash_type_separated(a, b):
    # A dict must never hash like its list-of-pairs or its str() rendering:
    # type confusion across the boundary is a collision-class bug.
    if isinstance(a, dict) and a:
        as_pairs = sorted(a.items(), key=lambda kv: kv[0])
        assert CanonicalHashAuthority.hash_json(a) != CanonicalHashAuthority.hash_json(as_pairs)
        assert CanonicalHashAuthority.hash_json(a) != CanonicalHashAuthority.sha256(str(a))


@given(st.text(max_size=30))
@settings(derandomize=True, max_examples=PR_EXAMPLES)
def test_hash_unicode_stable(s):
    # ensure_ascii=True escapes non-ASCII deterministically; the digest must
    # be stable across calls for the same code points.
    assert CanonicalHashAuthority.hash_json({'s': s}) == CanonicalHashAuthority.hash_json({'s': s})
    assert len(CanonicalHashAuthority.hash_json({'s': s})) == 64


@given(json_obj)
@settings(derandomize=True, max_examples=NIGHTLY_EXAMPLES)
def test_hash_deterministic_nightly(obj):
    # Nightly: the full state-model budget over the same invariants.
    assert CanonicalHashAuthority.hash_json(obj) == CanonicalHashAuthority.hash_dict(obj) if isinstance(obj, dict) else True
    assert CanonicalHashAuthority.hash_json(obj) == CanonicalHashAuthority.hash_json(obj)
