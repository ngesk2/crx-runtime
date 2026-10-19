use napi_derive::napi;
use napi::JsString;
use ping_proof_kernel::wire::MAX_WIRE_BYTES;

fn bounded(value: &JsString<'_>) -> bool {
    // N-API length queries borrow the JS handle; no Rust string/vector copy has
    // occurred yet. Check UTF-8 bytes as well as UTF-16 units before conversion.
    matches!(value.utf16_len(),Ok(n) if n<=MAX_WIRE_BYTES) &&
        matches!(value.utf8_len(),Ok(n) if n<=MAX_WIRE_BYTES)
}

/// Test-only Node bridge. Exact bytes cross as base64; no serialization of signed
/// objects, ownership decision, key custody, networking or persistence occurs.
#[napi]
pub fn verify_proof(request_json: JsString<'_>) -> String {
    if !bounded(&request_json) { return "malformed_input".to_owned(); }
    // Keep the original interface's conversion behavior for historical vectors.
    let Ok(text) = request_json.into_utf8() else { return "malformed_input".to_owned(); };
    let Ok(text) = text.as_str() else { return "malformed_input".to_owned(); };
    let outcome = ping_proof_kernel::wire::verify_request(text);
    serde_json::to_value(outcome).unwrap().as_str().unwrap().to_owned()
}

#[napi]
pub fn verify_proof_v2(request_json: JsString<'_>) -> String {
    // JS strings may contain unpaired surrogates. Converting through N-API's
    // UTF-8 String first silently repairs them, changing rejection behavior.
    if !bounded(&request_json) {
        return "malformed_input".to_owned();
    }
    let Ok(length) = request_json.utf16_len() else { return "malformed_input".to_owned(); };
    let Ok(units) = request_json.into_utf16() else { return "malformed_input".to_owned(); };
    // napi's JsStringUtf16 includes the terminating NUL; it is not wire data.
    let Ok(exact_text) = String::from_utf16(&units.as_slice()[..length]) else {
        return "malformed_input".to_owned();
    };
    serde_json::to_value(ping_proof_kernel::wire::verify_request_v2(&exact_text)).unwrap().as_str().unwrap().to_owned()
}
