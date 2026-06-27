import { CanonicalJson } from "@crx/replay";

export function canonicalize(value: unknown): string {
  return CanonicalJson.canonicalize(value);
}
