import crypto from "crypto"
import { canonicalize } from "./canonical_engine"

export function computeCanonicalHash(input: any): string {
  const canonical = canonicalize(input)

  const serialized = JSON.stringify(canonical)

  const hash = crypto
    .createHash("sha256")
    .update(serialized)
    .digest("hex")

  return hash
}
