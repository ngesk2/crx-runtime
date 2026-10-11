use napi_derive::napi;
use napi::bindgen_prelude::Utf16String;

/// Test-only Node bridge. Exact bytes cross as base64; no serialization of signed
/// objects, ownership decision, key custody, networking or persistence occurs.
#[napi]
pub fn verify_proof(request_json: String) -> String {
    let outcome = ping_proof_kernel::wire::verify_request(&request_json);
    serde_json::to_value(outcome).unwrap().as_str().unwrap().to_owned()
}

#[napi]
pub fn verify_proof_v2(request_json: Utf16String) -> String {
    // JS strings may contain unpaired surrogates. Converting through N-API's
    // UTF-8 String first silently repairs them, changing rejection behavior.
    if request_json.len() > 1024 * 1024 {
        return "malformed_input".to_owned();
    }
    let Ok(exact_text) = String::from_utf16(&request_json) else {
        return "malformed_input".to_owned();
    };
    serde_json::to_value(ping_proof_kernel::wire::verify_request_v2(&exact_text)).unwrap().as_str().unwrap().to_owned()
}
