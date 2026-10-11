# Isolated exact-byte proof kernel

MERGE = HOLD. Production cutover = HOLD. There are no production callers.

This crate checks SHA-256 digests, Ed25519 signatures over supplied exact bytes,
and the digest integrity of supplied immutable evidence references. It does not
serialize business objects, mint identities, authenticate actors, establish
business ownership, issue grants, inspect consent, persist events, or project
objects. Those decisions remain with the existing PING authorities. A `valid`
outcome says only that the specified mathematical check succeeded.

The original byte serializer and knowledge hash/identity implementations remain
the Node references. The frozen golden corpus records their existing bytes,
including historical array behavior and weak-key signature interpretation.
Rewriting those bytes with a different canonicalizer would change identity and
signature meaning. This kernel never does so. Its new strict wire contract
`ping.proof-wire@2` is an envelope around opaque base64 bytes, not a replacement
canonical identity format.

The v2 contract rejects duplicate fields, unknown fields, missing fields,
unrecognized versions, noncanonical base64, invalid UTF-8/Unicode, and malformed
digests or signature/key lengths. Duplicate keys are rejected before JavaScript
object parsing; Rust uses typed Serde deserialization. The native adapter reads
UTF-16 without lossy repair and rejects unpaired surrogates before conversion.
Whitespace and field order in the envelope do not change the opaque signed bytes.
The v2 input limit is one MiB. The original proof interface remains available
only for compatibility tests.

The supplied evidence-reference bytes are not automatically trustworthy evidence:
their acquisition, immutability, rights, and authoritative resolution must be
established outside this crate. Likewise, preserving a historical weak-key math
result does not authorize that key for new commissioning. That policy belongs to
the separate admission lane.

## Reproduce

On the tested Ubuntu/WSL x86-64 environment, with the isolated compiler/dependency
cache already provisioned and the existing gateway Node dependencies available:

```sh
python3 proof-kernel/check.py \
  --tools-root ../ping-admission-rust-20261010/.build-tools \
  --node-path /home/nolan/ping/gateway/node_modules
```

The runner compiles the existing TypeScript reference, builds both Rust crates
with locked offline dependencies, runs the unit tests and frozen differential
vectors, then records the source SHA, source hashes, environment, exact commands,
exit codes, counts and native artifact digest in `proof-kernel/evidence/proof.json`.
It checks 52 historical vectors, 207 versioned wire vectors, 226 additional
Ed25519 encoding/signature edge vectors and four native UTF-16 rejection cases.
It never regenerates the golden corpus. Native artifacts and proof outputs are
ignored; source and Cargo locks are reviewable.

Windows native linking and the Oracle deployment target have not passed. Linux
parity is not a portability proof, an exhaustive cryptographic equivalence proof,
or production throughput evidence. Earlier synthetic measurements favored Rust,
including against cached Node public keys; end-to-end gains remain unmeasured.
Any integration must remain shadow/test-only until authorization, recovery,
platform compatibility, and deployment provenance gates are independently closed.

## Dependencies

Direct pure-crate pins: sha2 0.10.9 (MIT/Apache-2.0), ed25519-dalek 2.2.0
(BSD-3-Clause), serde 1.0.228 (MIT/Apache-2.0), serde_json 1.0.145
(MIT/Apache-2.0), base64 0.22.1 (MIT/Apache-2.0). The optional native bridge adds
napi 3.3.0 and napi-derive 3.2.5 (MIT). Cargo lockfiles retain package checksums.
No private key storage, networking, database client, scheduler, or authority
framework is introduced.
