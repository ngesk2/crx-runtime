export function validateLineage(parentIds: string[], childId: string) {
  if (parentIds.includes(childId)) {
    throw new Error("Lineage cycle detected")
  }

  const unique = new Set(parentIds)

  if (unique.size !== parentIds.length) {
    throw new Error("Duplicate parent lineage detected")
  }

  return true
}
