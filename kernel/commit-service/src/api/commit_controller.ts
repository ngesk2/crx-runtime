import { Request, Response } from "express"
import { computeCanonicalHash } from "../engines/identity_engine"
import { validateLineage } from "../validation/dag_validator"

export async function commitArtifact(req: Request, res: Response) {
  try {
    const { artifact, lineage } = req.body

    const artifactId = computeCanonicalHash(artifact)

    const parentIds = lineage?.parents || []

    validateLineage(parentIds, artifactId)

    res.json({
      accepted: true,
      artifact_id: artifactId
    })
  } catch (err: any) {
    res.status(400).json({
      accepted: false,
      error: err.message
    })
  }
}
