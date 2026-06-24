# Google Drive Reality Report

## 1. Is OAuth working?

**Yes.** The OAuth 2.0 authorization code flow completed successfully using the OOB (`urn:ietf:wg:oauth:2.0:oob`) redirect method. The Google Drive API was enabled for project `high-gecko-498903-j7` after initially being disabled. Token exchange returned HTTP 200 with both access and refresh tokens.

## 2. Is token refresh working?

**Yes.** Token refresh was verified end-to-end. The refresh token was used to obtain a new access token (HTTP 200), and the new token was verified against the Drive API (HTTP 200). New token expires in 3599 seconds.

## 3. Can the system read Drive?

**Yes.** The system can read Drive via the REST API. Verified operations:
- List files (paginated, all 39 files retrieved)
- Search by filename keyword
- Filter by mimeType
- Read file metadata (id, name, mimeType, modifiedTime, size, parents)

**Not yet tested**: file content download (binary export for native formats, format conversion for Google-native docs).

## 4. What constitutional material already exists?

**39 total files** across the following categories:

- **16 PowerPoint presentations** (PING Presentation V2–V18, including 3 explicitly constitutional-themed: V14 Constitutional Civilization, V16 Constitutional Baseline, V17 Constitutional City)
- **8 Word documents** (Constitutional Kernel Master Script, YouTube Full Script, Architecture Guide, Rewrite Blueprint, Transition Architecture, YouTube Launch Kit, Next Video Plan, Build AI Infrastructure Script)
- **5 Google Docs** (untitled docs, "Personal", "D")
- **9 PNG images** (Gemini and ChatGPT generated, ~2-3.4MB each)
- **1 binary file** (agyhub_summaries_proto.pb)

**Zero folders** exist — all files are at root level with no hierarchy.

## 5. Is Drive sufficient as creator storage today?

**No.** Authentication and API access work, but the repository has no organization (zero folders), no metadata tagging, and no automated ingestion pipeline. It is a flat pile of 39 files — usable for manual access only. It cannot serve as a "durable creator repository" in its current state.

## 6. What blockers remain before Drive documents can enter constitutional memory?

| # | Blocker | Severity | Details |
|---|---|---|---|
| 1 | **No projection worker running** | CRITICAL | `crx-digestion-worker` is Exited. No service exists to poll Drive, download content, extract text, or feed Qdrant. |
| 2 | **Qdrant split-brain** | CRITICAL | Local Qdrant has 0 collections and is unhealthy. Cloud Qdrant has 3 collections but MC points to Cloud. Neither is configured for creator content. |
| 3 | **Drive organization** | HIGH | 39 files, 0 folders. No way to partition, prioritize, or track processing state. |
| 4 | **Document content retrieval untested** | MEDIUM | Binary export and Google-native format conversion not yet verified. Quota/rate limits unknown. |
| 5 | **OAuth scope limitation** | LOW | Only read-only scopes granted. Writing back processing status or organizing files would require additional scopes. |

### Operational Risk

The single largest operational risk is the **Qdrant split-brain**: Mission Control sends data to Qdrant Cloud while a local Qdrant instance runs empty and unhealthy. Any Drive-to-memory pipeline built today would need to resolve this fragmentation first, or risk losing data in the wrong Qdrant.
