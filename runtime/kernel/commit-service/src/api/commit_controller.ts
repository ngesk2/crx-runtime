/**
 * CONSTITUTIONAL ROLE
 *
 * Authority: NO
 * Creates Truth: NO
 * Derives Truth: NO
 * Stores Truth: NO
 * Presents Truth: YES (HTTP API)
 *
 * Truth Source:
 * runtime/replay/replay_event_stream.ts (via event_log.ts)
 *
 * Constitutional Flow:
 * 1. Accepts artifact payload via HTTP
 * 2. Delegates to CertificateAuthority for identity
 * 3. Delegates to CanonicalJson for canonicalization
 * 4. Delegates to event_log.ts for truth creation
 * 5. Delegates to artifact_store.ts for projection persistence
 *
 * This component does NOT create constitutional truth.
 * It is a presentation layer that routes requests to constitutional authorities.
 */

import { Request, Response } from "express"
import { CertificateAuthority } from "@crx/replay"
import { CanonicalJson } from "@crx/replay"
import { validateLineage } from "../validation/dag_validator"
import { storeArtifact } from "../persistence/artifact_store"
import { logEvent } from "../events/event_log"
import { logger } from "../utils/logger"

export async function commitArtifact(req: Request, res: Response) {
  try {
    const { artifact, lineage } = req.body

    // CONSTITUTIONAL RULE: Use CanonicalJson (sole canonicalization authority)
    // CONSTITUTIONAL RULE: Use CertificateAuthority (sole hash authority)
    const canonical = CanonicalJson.canonicalize(artifact)
    const artifactId = CertificateAuthority.sha256(canonical)

    const parentIds = lineage?.parents || []

    validateLineage(parentIds, artifactId)

    await storeArtifact(artifactId, artifact)

    // CONSTITUTIONAL RULE: Lineage is established by replay, not direct database writes
    // Lineage will be derived from event stream during replay
    await logEvent("artifact_commit", { artifactId, parentIds })

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
