use base64::{engine::general_purpose::STANDARD, Engine};
use crate::{EvidenceRef, ImmutableRef, Outcome};
use serde::Deserialize;
pub const MAX_WIRE_BYTES: usize = 1024 * 1024;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct WireRef { id: String, bytes_base64: String }
#[derive(Deserialize)]
#[serde(tag="kind", rename_all="snake_case", deny_unknown_fields)]
enum Request {
    Signature { bytes_base64:String, public_key_base64:String, signature_base64:String },
    Digest { bytes_base64:String, expected_digest:String },
    Evidence { claim_refs:Vec<EvidenceRef>, immutable_refs:Vec<WireRef> },
}
pub fn verify_request(line: &str) -> Outcome {
    if line.len() > MAX_WIRE_BYTES { return Outcome::MalformedInput; }
    let Ok(request)=serde_json::from_str::<Request>(line) else { return Outcome::MalformedInput };
    evaluate(request)
}
fn evaluate(request: Request) -> Outcome {
    match request {
        Request::Signature{bytes_base64,public_key_base64,signature_base64} => {
            let (Ok(bytes),Ok(key),Ok(sig))=(STANDARD.decode(bytes_base64),STANDARD.decode(public_key_base64),STANDARD.decode(signature_base64)) else { return Outcome::MalformedInput };
            crate::verify_signature(&bytes,&key,&sig)
        }
        Request::Digest{bytes_base64,expected_digest} => {
            let Ok(bytes)=STANDARD.decode(bytes_base64) else { return Outcome::MalformedInput };
            crate::verify_digest(&bytes,&expected_digest)
        }
        Request::Evidence{claim_refs,immutable_refs} => {
            let mut refs=Vec::new();
            for r in immutable_refs {
                let Ok(bytes)=STANDARD.decode(r.bytes_base64) else { return Outcome::MalformedInput };
                refs.push(ImmutableRef{id:r.id,exact_bytes:bytes});
            }
            crate::verify_evidence_reference_integrity(&claim_refs,&refs)
        }
    }
}

// A separate, explicit wire version. Historical exact-byte verification and
// the original CLI contract above are unchanged. This is not an admission policy.
#[derive(Deserialize)]
#[serde(tag="kind", rename_all="snake_case", deny_unknown_fields)]
enum RequestV2 {
    Signature { version:String, bytes_base64:String, public_key_base64:String, signature_base64:String },
    Digest { version:String, bytes_base64:String, expected_digest:String },
    Evidence { version:String, claim_refs:Vec<EvidenceRef>, immutable_refs:Vec<WireRef> },
}
pub fn verify_request_v2(line: &str) -> Outcome {
    if line.len() > MAX_WIRE_BYTES { return Outcome::MalformedInput; }
    let Ok(request)=serde_json::from_str::<RequestV2>(line) else { return Outcome::MalformedInput };
    let (version, legacy)=match request {
        RequestV2::Signature{version,bytes_base64,public_key_base64,signature_base64} =>
          (version,Request::Signature{bytes_base64,public_key_base64,signature_base64}),
        RequestV2::Digest{version,bytes_base64,expected_digest} =>
          (version,Request::Digest{bytes_base64,expected_digest}),
        RequestV2::Evidence{version,claim_refs,immutable_refs} =>
          (version,Request::Evidence{claim_refs,immutable_refs}),
    };
    if version != "ping.proof-wire@2" { return Outcome::MalformedInput; }
    evaluate(legacy)
}
