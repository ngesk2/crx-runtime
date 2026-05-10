export function canonicalize(value: any): any {

  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }

  if (value !== null && typeof value === "object") {

    const sortedKeys = Object.keys(value).sort()

    const result: any = {}

    for (const key of sortedKeys) {
      result[key] = canonicalize(value[key])
    }

    return result
  }

  return value
}