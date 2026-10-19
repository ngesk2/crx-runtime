//! Bounded JSONL framing only; never changes or canonicalizes signed bytes.
use std::io::{self, BufRead};
use crate::wire::MAX_WIRE_BYTES;

#[derive(Debug, PartialEq, Eq)]
pub enum Frame { End, Line(Vec<u8>), TooLarge }

pub fn read_frame<R: BufRead>(reader: &mut R) -> io::Result<Frame> {
    let mut line = Vec::new();
    loop {
        let available = reader.fill_buf()?;
        if available.is_empty() {
            return Ok(if line.is_empty() { Frame::End }
                else if line.len() > MAX_WIRE_BYTES { Frame::TooLarge }
                else { Frame::Line(line) });
        }
        if let Some(end) = available.iter().position(|b| *b == b'\n') {
            let cr = if end > 0 { available[end - 1] == b'\r' }
                else { line.last() == Some(&b'\r') };
            if line.len() + end - usize::from(cr) > MAX_WIRE_BYTES {
                return Ok(Frame::TooLarge);
            }
            line.extend_from_slice(&available[..end]);
            reader.consume(end + 1);
            if cr { line.pop(); }
            return Ok(Frame::Line(line));
        }
        // One extra byte may be a terminal CR belonging to a CRLF delimiter.
        // Never accumulate an unbounded line or wait for EOF after overflow.
        let take = available.len().min(MAX_WIRE_BYTES + 1 - line.len());
        if take == 0 { return Ok(Frame::TooLarge); }
        let more = available.len() > take;
        line.extend_from_slice(&available[..take]);
        reader.consume(take);
        if line.len() > MAX_WIRE_BYTES && (more || line.last() != Some(&b'\r')) {
            return Ok(Frame::TooLarge);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Cursor, Read};
    struct Endless { consumed: usize, chunk: [u8; 4096] }
    impl Read for Endless {
        fn read(&mut self, _: &mut [u8]) -> io::Result<usize> { unreachable!() }
    }
    impl BufRead for Endless {
        fn fill_buf(&mut self) -> io::Result<&[u8]> { Ok(&self.chunk) }
        fn consume(&mut self, n: usize) { self.consumed += n; }
    }
    #[test]
    fn endless_input_stops_at_the_bound() {
        let mut input = Endless { consumed: 0, chunk: [b'x'; 4096] };
        assert_eq!(read_frame(&mut input).unwrap(), Frame::TooLarge);
        assert_eq!(input.consumed, MAX_WIRE_BYTES + 1);
    }
    #[test]
    fn crlf_and_eof_are_framing_not_payload_rewrites() {
        let mut input = Cursor::new(b"a\r\nb\n\nlast");
        for expected in [b"a".to_vec(), b"b".to_vec(), vec![], b"last".to_vec()] {
            assert_eq!(read_frame(&mut input).unwrap(), Frame::Line(expected));
        }
        assert_eq!(read_frame(&mut input).unwrap(), Frame::End);
        let mut exact = vec![b' '; MAX_WIRE_BYTES]; exact.extend_from_slice(b"\r\n");
        assert_eq!(read_frame(&mut Cursor::new(exact)).unwrap(), Frame::Line(vec![b' '; MAX_WIRE_BYTES]));
    }
}
