import { CertificateAuthority } from "../../../replay/certificate_authority"
import { canonicalize } from "./canonical_engine"

export function computeCanonicalHash(input: any): string {
  const canonical = canonicalize(input)
  const serialized = JSON.stringify(canonical)
  return CertificateAuthority.sha256(serialized)
}
