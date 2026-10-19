//! Synthetic component measurement; not an application throughput claim.
use std::{hint::black_box, time::Instant};
fn main() {
    for size in [0, 1024, 65536] {
        let bytes=vec![97;size];
        let count=if size>1024 {2000}else{50000};
        for _ in 0..100 {black_box(ping_proof_kernel::sha256_hex(black_box(&bytes)));}
        let mut samples=Vec::new();
        for _ in 0..5 {
            let start=Instant::now();
            for _ in 0..count {black_box(ping_proof_kernel::sha256_hex(black_box(&bytes)));}
            samples.push(start.elapsed().as_nanos() as f64 / count as f64);
        }
        samples.sort_by(f64::total_cmp);
        println!("{{\"bytes\":{size},\"calls_per_sample\":{count},\"median_ns\":{},\"samples_ns\":{samples:?}}}",samples[2]);
    }
}
