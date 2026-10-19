//! Pure verification of supplied exact bytes. Never canonicalizes, issues IDs,
//! establishes ownership, stores keys, resolves URLs, or writes canonical state.
pub mod wire;
pub mod input;

use ed25519_dalek::{Signature, VerifyingKey, Verifier};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Outcome {
    Valid,
    InvalidSignature,
    DigestMismatch,
    MalformedInput,
    MissingEvidenceReference,
    EvidenceDigestMismatch,
}

pub fn sha256_hex(exact_bytes: &[u8]) -> String {
    Sha256::digest(exact_bytes).iter().map(|b| format!("{b:02x}")).collect()
}

fn valid_digest(s: &str) -> bool {
    s.len() == 64 && s.bytes().all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c))
}

pub fn verify_signature(exact_signed_bytes: &[u8], public_key: &[u8], signature: &[u8]) -> Outcome {
    let Ok(raw_key) = <&[u8; 32]>::try_from(public_key) else { return Outcome::MalformedInput };
    let Ok(sig) = Signature::from_slice(signature) else { return Outcome::MalformedInput };
    let Ok(key) = VerifyingKey::from_bytes(raw_key) else { return Outcome::InvalidSignature };
    // Preserve Node/OpenSSL's historical interpretation. New commissioning keys
    // are subject to a separate small-order-key policy before authorization.
    // Valid proof math is never evidence of owner entitlement or key strength.
    match key.verify(exact_signed_bytes, &sig) {
        Ok(()) => Outcome::Valid,
        Err(_) => Outcome::InvalidSignature,
    }
}

pub fn verify_digest(exact_bytes: &[u8], expected_digest: &str) -> Outcome {
    if !valid_digest(expected_digest) { return Outcome::MalformedInput; }
    if sha256_hex(exact_bytes) == expected_digest { Outcome::Valid } else { Outcome::DigestMismatch }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EvidenceRef {
    pub id: String,
    pub digest: String,
}

#[derive(Debug, Clone)]
pub struct ImmutableRef {
    pub id: String,
    pub exact_bytes: Vec<u8>,
}

pub fn verify_evidence_reference_integrity(claim_refs: &[EvidenceRef], immutable_refs: &[ImmutableRef]) -> Outcome {
    let mut claimed = BTreeSet::new();
    let mut available = BTreeMap::new();
    for r in immutable_refs {
        if r.id.is_empty() || available.insert(&r.id, &r.exact_bytes).is_some() { return Outcome::MalformedInput; }
    }
    for r in claim_refs {
        if r.id.is_empty() || !valid_digest(&r.digest) || !claimed.insert(&r.id) { return Outcome::MalformedInput; }
        let Some(bytes) = available.get(&r.id) else { return Outcome::MissingEvidenceReference };
        if sha256_hex(bytes) != r.digest { return Outcome::EvidenceDigestMismatch; }
    }
    Outcome::Valid
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn exact_digest_and_malformed() {
        assert_eq!(sha256_hex(b"abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        assert_eq!(verify_digest(b"abc", &sha256_hex(b"abc")), Outcome::Valid);
        assert_eq!(verify_digest(b"abd", &sha256_hex(b"abc")), Outcome::DigestMismatch);
        assert_eq!(verify_digest(b"abc", "not-a-digest"), Outcome::MalformedInput);
        assert_eq!(verify_signature(b"abc", &[0;31], &[0;64]), Outcome::MalformedInput);
        assert_eq!(verify_signature(b"abc", &[0;32], &[0;63]), Outcome::MalformedInput);
    }
    #[test]
    fn immutable_refs_are_exact_and_unique() {
        let refs = vec![ImmutableRef{id:"source-1".into(),exact_bytes:b"observed source".to_vec()}];
        let claim=vec![EvidenceRef{id:"source-1".into(),digest:sha256_hex(b"observed source")}];
        assert_eq!(verify_evidence_reference_integrity(&claim,&refs),Outcome::Valid);
        assert_eq!(verify_evidence_reference_integrity(&claim,&[]),Outcome::MissingEvidenceReference);
        let tampered=vec![ImmutableRef{id:"source-1".into(),exact_bytes:b"modified source".to_vec()}];
        assert_eq!(verify_evidence_reference_integrity(&claim,&tampered),Outcome::EvidenceDigestMismatch);
        let duplicate=vec![claim[0].clone(),claim[0].clone()];
        assert_eq!(verify_evidence_reference_integrity(&duplicate,&refs),Outcome::MalformedInput);
    }
}
