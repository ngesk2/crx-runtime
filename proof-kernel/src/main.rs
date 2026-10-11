use std::io::{self, BufRead};
fn main() {
    let version2=std::env::args().nth(1).as_deref()==Some("--wire-v2");
    for line in io::stdin().lock().lines() {
        match line {
            Ok(line) => println!("{}",serde_json::to_string(&if version2 {ping_proof_kernel::wire::verify_request_v2(&line)}else{ping_proof_kernel::wire::verify_request(&line)}).unwrap()),
            Err(_) => { println!("\"malformed_input\""); break; }
        }
    }
}
