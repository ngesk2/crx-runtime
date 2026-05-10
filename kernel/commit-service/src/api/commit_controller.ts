import { Request, Response } from "express"
import { computeCanonicalHash } from "../engines/identity_engine"
import { validateLineage } from "../validation/dag_validator"
import { storeArtifact } from "../persistence/artifact_store"
import { storeLineage } from "../persistence/lineage_store"
import { logEvent } from "../events/event_log"
import { logger } from "../utils/logger"

export async function commitArtifact(req: Request, res: Response) {
  try {
    const { artifact, lineage } = req.body

    const artifactId = computeCanonicalHash(artifact)

    const parentIds = lineage?.parents || []

    validateLineage(parentIds, artifactId)

    await storeArtifact(artifactId, artifact)
    await storeLineage(parentIds, artifactId)
    await logEvent("artifact_commit", { artifactId })

    logger.info({ artifactId }, "artifact committed")

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
