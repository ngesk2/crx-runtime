use std::io::{self, Write};
use ping_proof_kernel::{input::{read_frame, Frame}, Outcome};
fn main() {
    let version2=std::env::args().nth(1).as_deref()==Some("--wire-v2");
    let mut input=io::stdin().lock();
    let mut output=io::stdout().lock();
    loop {
        let (outcome, stop) = match read_frame(&mut input) {
            Ok(Frame::End) => break,
            Ok(Frame::Line(bytes)) => match String::from_utf8(bytes) {
                Ok(line) => (if version2 {ping_proof_kernel::wire::verify_request_v2(&line)}else{ping_proof_kernel::wire::verify_request(&line)},false),
                Err(_) => (Outcome::MalformedInput,true),
            },
            Ok(Frame::TooLarge) | Err(_) => (Outcome::MalformedInput,true),
        };
        if writeln!(output,"{}",serde_json::to_string(&outcome).unwrap()).is_err() || output.flush().is_err() { break; }
        // An oversized unterminated frame has no trustworthy next boundary.
        // Reject it immediately and terminate rather than reinterpret its tail.
        if stop { break; }
    }
}
