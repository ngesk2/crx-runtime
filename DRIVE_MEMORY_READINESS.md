# Drive → Memory Readiness Assessment

## Path: Google Drive → Document Discovery → Document Retrieval → Projection Worker → Qdrant

### Prerequisite Verification

| Step | Required | Status | Notes |
|---|---|---|---|
| **Google Drive** | OAuth + API access | ✅ VERIFIED | Access token + refresh token work. Drive API enabled. |
| **Document Discovery** | Ability to list/search files | ✅ VERIFIED | Search by name, mimeType, and modifiedTime works. Pagination works. |
| **Document Retrieval** | Ability to download file content | ⚠️ UNTESTED | Drive API files.get and files.export endpoints available but not yet tested for content download. For Google-native formats (Docs, Sheets), export to DOCX/PDF is required. For native files (DOCX, PPTX), direct download is available. |
| **Projection Worker** | Worker service to process documents | ❌ NOT DEPLOYED | `crx-digestion-worker` container is Exited. No projection worker is running. No running container maps Drive → Qdrant. |
| **Qdrant Storage** | Vector database ready | ❌ NOT READY | Local Qdrant has 0 collections and is unhealthy. Qdrant Cloud has 3 collections but MC points to Cloud, not local. No constitutional memory collections exist locally. |

### Blocker Breakdown

#### Blocker 1: Document Retrieval (Untested)
The `drive.files.get` and `drive.files.export` endpoints are available but not yet tested. Need to verify:
- Can we download binary content (DOCX, PPTX)?
- Can we export Google Docs to readable formats?
- Rate limits and quota limits for the project

#### Blocker 2: No Running Projection Worker
The `crx-digestion-worker` (part of the CRX stack) has exited. There is currently no running service that:
- Polls Google Drive for new/changed files
- Downloads documents
- Processes/extracts text content
- Generates embeddings
- Stores to Qdrant

#### Blocker 3: Qdrant Not Ready for Constitutional Memory
- Local `brain-qdrant` has 0 collections and is unhealthy
- Qdrant Cloud has 3 collections (`constitutional_documents`, `tier2_operational`, `tier3_working`) but MC is configured to use Cloud, not local
- No collections named for the creator content (no `creator_memory`, `drive_content`, etc.)

#### Blocker 4: Drive Organization
- No folder structure means no logical partition of content
- Discovery would need to scan all 39 files every time
- No way to distinguish "already processed" from "new" without tracking state externally

### Summary

| Prerequisite | Status |
|---|---|
| Authentication | ✅ VERIFIED |
| API Access | ✅ VERIFIED |
| Document Discovery | ✅ VERIFIED |
| Document Retrieval | ⚠️ UNTESTED |
| Projection Worker Running | ❌ MISSING |
| Qdrant Ready (local) | ❌ BROKEN |
| Qdrant Ready (cloud) | ✅ VERIFIED but not wired |
| Drive Organization | ❌ MISSING |

The path from Drive to constitutional memory is **not yet feasible** without deploying a projection worker and resolving the Qdrant split-brain (local vs. cloud).
