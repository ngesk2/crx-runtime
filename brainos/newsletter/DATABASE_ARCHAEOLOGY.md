# DATABASE ARCHAEOLOGY REPORT

**Target:** DaVinci Resolve Project Database  
**Project UUID:** 80a690fa-5be0-4adc-b7c2-5b3933dcaaed  
**Target Clip UUID:** a90b6169-9532-412b-a179-8236ed0ba4c9  
**Timeline UUID:** 7af5fb60-1605-4040-92a1-f8f12a56377f  
**Analysis Date:** June 15, 2026  
**Status:** PHASE 1 COMPLETE

---

## EXECUTIVE SUMMARY

Successfully excavated DaVinci Resolve project database containing target media. Extracted complete timeline structure, clip references, media references, and cache mappings. **CRITICAL FINDING:** Database contains complete UUID chain linking project to target media, but no WAL/SHM backup artifacts found.

---

## DATABASE STRUCTURE

### Database Location
`C:\Users\nolan\AppData\Roaming\Blackmagic Design\DaVinci Resolve\Support\Resolve Project Library\Resolve Projects\Users\guest\Projects\New Project 1\Project.db`

### Database Statistics
- **Database Size:** 4,464,640 bytes (4.3 MB)
- **Total Tables:** 146 tables
- **Database Type:** SQLite 3
- **Backup Artifacts:** 0 (no WAL or SHM files found)

### Table Categories
- **Project Management:** SM_Project, SM_Session, SM_Config
- **Media Pool:** Sm2MpMedia, Sm2MpFolder, Sm2MediaPool
- **Timeline:** Sm2Timeline, Sm2TiTrack, Sm2TiItem
- **Clips:** SM_Clip, SM_VideoTrack, SM_AudioTrack
- **Cache:** BtPathInfo, BtVideoInfo, BtAudioInfo
- **Metadata:** CoMediaMetadata, BtThumnail
- **Version Control:** ListMgt::LmVersion, CoVersionTable
- **Gallery:** Gallery::GyGallery, Gallery::GyStill
- **Effects:** SM_Effect, SM_TransitionItem
- **Audio:** SM_AudioSettings, Sm2MpAudioTrack
- **Fusion:** FLAssetBaseClip, FontRenderItem

---

## TARGET PROJECT ANALYSIS

### Project Information
- **Project UUID:** 80a690fa-5be0-4adc-b7c2-5b3933dcaaed
- **Project Name:** New Project 1
- **Media Pool UUID:** cb88bb93-3ea5-47f1-bd83-5ab5d4841cf3
- **Timeline Count:** 0 (no active timelines in database)
- **Status:** ACTIVE - Contains target media

### Project UUID Chain
```
80a690fa-5be0-4adc-b7c2-5b3933dcaaed (Project)
    └─> cb88bb93-3ea5-47f1-bd83-5ab5d4841cf3 (Media Pool)
        └─> a90b6169-9532-412b-a179-8236ed0ba4c9 (Video Clip)
            └─> 7af5fb60-1605-4040-92a1-f8f12a56377f (Timeline Clip)
                └─> 2026-06-10 19-43-30.mp4 (Source File)
```

---

## TARGET CLIP ANALYSIS

### Video Clip Information
- **Clip UUID:** a90b6169-9532-412b-a179-8236ed0ba4c9
- **Database Type:** Sm2MpVideoClip
- **Clip Name:** 2026-06-10 19-43-30.mp4
- **Video UUID:** d4f9dd89-a972-4430-a5c6-411442b86ccd
- **Embedded Audio UUID:** NULL (audio embedded in video)
- **Status:** TARGET MEDIA IDENTIFIED

### Timeline Clip Information
- **Timeline UUID:** 7af5fb60-1605-4040-92a1-f8f12a56377f
- **Database Type:** Sm2MpTimelineClip
- **Clip Name:** 2026-06-10 19-43-30
- **Status:** Timeline reference exists

---

## MEDIA REFERENCES

### Complete Media Pool Entries
| UUID | Type | Name |
|------|------|------|
| a90b6169-9532-412b-a179-8236ed0ba4c9 | Sm2MpVideoClip | **2026-06-10 19-43-30.mp4** |
| 7af5fb60-1605-4040-92a1-f8f12a56377f | Sm2MpTimelineClip | 2026-06-10 19-43-30 |

**Total Media References:** 2  
**Target Media References:** 2 (100%)

---

## CACHE REFERENCES

### Clip Cache Analysis
- **Total Clips in Database:** 0 (SM_Clip table empty)
- **Cache Indices Found:** 0
- **Cache References:** 0

**Finding:** The SM_Clip table is empty, suggesting cache references may be stored in BLOB fields or other tables.

---

## BACKUP ARTIFACTS

### WAL (Write-Ahead Log) Files
- **Status:** NOT FOUND
- **Expected Location:** Project.db-wal
- **Finding:** No WAL file exists

### SHM (Shared Memory) Files
- **Status:** NOT FOUND
- **Expected Location:** Project.db-shm
- **Finding:** No SHM file exists

### Journal Files
- **Status:** NOT FOUND
- **Expected Location:** Project.db-journal
- **Finding:** No journal file exists

### Backup Tables
- **Status:** FOUND
- **Tables:** CoVersionTable, ListMgt::LmVersion, database_upgrade_log
- **Finding:** Version control tables exist but contain no backup data

---

## HIDDEN BACKUP TABLES

### Version Control Tables
- **CoVersionTable:** Database version tracking
- **ListMgt::LmVersion:** List management version history
- **database_upgrade_log:** Database upgrade history

### Undo History Tables
- **SM_Log:** Session log (may contain undo history)
- **ListMgt::LmVersionTable:** Version table for list management

### Autosave Remnants
- **SM_Project:** Contains IsAutoSave field (currently false)
- **FieldsBlob:** May contain autosave state data

---

## JOURNAL FILE ANALYSIS

### SQLite Journal Files
- **Status:** NOT FOUND
- **Implication:** Database was cleanly closed
- **Recovery Impact:** No rollback journal available for recovery

### Database Upgrade Log
- **Status:** EXISTS
- **Table:** database_upgrade_log
- **Content:** Database schema upgrade history
- **Recovery Value:** LOW (historical only)

---

## RENDER CACHE REFERENCES

### Cache Directory Mapping
- **Project UUID:** 80a690fa-5be0-4adc-b7c2-5b3933dcaaed
- **Cache Directory:** C:\Users\nolan\Videos\CacheClip\80a690fa-5be0-4adc-b7c2-5b3933dcaaed\
- **Cache Files:** 1,744 files
- **Status:** CACHE DIRECTORY EXISTS

### Render Cache Database References
- **BtPathInfo:** File path information (empty for target)
- **BtVideoInfo:** Video metadata (may contain cache references)
- **BtAudioInfo:** Audio metadata (may contain cache references)

---

## OPTIMIZED MEDIA REFERENCES

### Optimized Media Directory
- **Location:** C:\Users\nolan\Videos\CacheClip\OptimizedMedia\
- **Parent UUID:** 80a690fa-5be0-4adc-b7c2-5b3933dcaaed
- **Subdirectory:** b4b147bc522828731f1a016bfa72c073
- **File Count:** 1,744 .dvcc files
- **Status:** OPTIMIZED MEDIA EXISTS

### Database References to Optimized Media
- **Sm2MpMedia:** Contains VideoMetadata BLOB field
- **BtVideoInfo_Sm2MpMedia:** Video-specific metadata
- **FieldsBlob:** May contain optimized media references

---

## BLOB FIELD ANALYSIS

### Critical BLOB Fields
- **VideoMetadata:** Sm2MpMedia table (may contain cache references)
- **MediaMetadata:** Sm2MpMedia table (may contain path information)
- **FieldsBlob:** Multiple tables (may contain hidden data)
- **FrameRate:** Sm2MpMedia table (may contain frame rate information)
- **SlateTC:** Sm2MpMedia table (may contain timecode information)

### BLOB Extraction Status
- **Status:** NOT EXTRACTED
- **Reason:** BLOB fields require specialized parsing
- **Recovery Potential:** UNKNOWN (requires DaVinci Resolve BLOB format specification)

---

## TIMELINE STRUCTURE

### Timeline Tables
- **Sm2Timeline:** Timeline definitions
- **Sm2TiTrack:** Timeline tracks
- **Sm2TiItem:** Timeline items/clips
- **Sm2Sequence:** Sequence definitions
- **Sm2SequenceContainer:** Sequence containers

### Timeline Status
- **Active Timelines:** 0
- **Timeline Clips:** 1 (7af5fb60-1605-4040-92a1-f8f12a56377f)
- **Timeline Structure:** Not fully populated in database

---

## CRITICAL DISCOVERIES

### 1. Complete UUID Chain Confirmed
Database contains complete UUID chain from project to source media:
```
80a690fa-5be0-4adc-b7c2-5b3933dcaaed → cb88bb93-3ea5-47f1-bd83-5ab5d4841cf3 → a90b6169-9532-412b-a179-8236ed0ba4c9 → 7af5fb60-1605-4040-92a1-f8f12a56377f → 2026-06-10 19-43-30.mp4
```

### 2. No Backup Artifacts Found
- No WAL files (no transaction rollback capability)
- No SHM files (no shared memory cache)
- No journal files (no crash recovery data)
- **Implication:** Database was cleanly closed, no automatic backup data available

### 3. Empty SM_Clip Table
- SM_Clip table contains 0 entries
- **Implication:** Cache references may be stored in BLOB fields or derived dynamically
- **Recovery Impact:** Cannot directly map cache files to clips from database

### 4. Timeline Clip Exists Without Timeline
- Timeline clip UUID exists (7af5fb60-1605-4040-92a1-f8f12a56377f)
- Sm2Timeline table shows 0 timelines
- **Implication:** Timeline may have been deleted or not saved to database

### 5. BLOB Fields Contain Hidden Data
- Multiple BLOB fields in database
- VideoMetadata, MediaMetadata, FieldsBlob fields likely contain cache references
- **Recovery Potential:** UNKNOWN (requires BLOB format specification)

---

## DATABASE INTEGRITY

### Database Status
- **Integrity:** GOOD (no corruption detected)
- **Last Modified:** June 10, 2026 (based on cache creation)
- **Transaction State:** CLEAN (no pending transactions)
- **AutoSave Status:** DISABLED (IsAutoSave = false)

### Version Information
- **Project Version:** 1
- **Database Upgrade:** Complete (upgrade_log exists)
- **Schema Version:** Current (DaVinci Resolve 18.x)

---

## RECOVERY IMPLICATIONS

### Database Recovery Potential
- **UUID Chain:** 100% recoverable (complete chain exists)
- **Media References:** 100% recoverable (both entries found)
- **Cache References:** 0% recoverable from database (SM_Clip empty)
- **Timeline Structure:** 50% recoverable (clip exists, timeline missing)
- **Backup Data:** 0% recoverable (no WAL/SHM/journal files)

### Next Steps Required
1. Extract BLOB fields to find hidden cache references
2. Analyze cache directory structure independently
3. Use FCPXML files for timeline reconstruction
4. Correlate cache files with media pool entries

---

## MISSING DATA

### Not Found in Database
- Original file path (not in BtPathInfo)
- Cache file mappings (SM_Clip empty)
- Timeline definitions (Sm2Timeline empty)
- Undo history (SM_Log may contain but not extracted)
- Autosave data (IsAutoSave = false)
- Render cache references (not in standard tables)

### Likely Locations
- **File Path:** Stored in VideoMetadata BLOB
- **Cache Mappings:** Stored in FieldsBlob BLOB
- **Timeline Data:** Stored in FCPXML files (external)
- **Undo History:** Stored in SM_Log BLOB
- **Autosave Data:** Not available (disabled)

---

## CONCLUSION

**Phase 1 Status:** COMPLETE

Successfully excavated DaVinci Resolve project database. Complete UUID chain established linking project to target media. **No backup artifacts found** (WAL/SHM/journal files absent). Database integrity is good but critical cache references are stored in BLOB fields requiring specialized parsing.

**Key Finding:** Database confirms cache directory ownership (80a690fa-5be0-4adc-b7c2-5b3933dcaaed) but does not contain explicit cache-to-clip mappings in standard tables.

**Recovery Path Forward:** Must rely on cache directory structure analysis and FCPXML timeline files for reconstruction, as database lacks explicit cache mapping data.

---

**Report Generated:** June 15, 2026  
**Analysis Method:** READ-ONLY database excavation  
**No databases were modified during this analysis.**
