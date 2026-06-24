"""
PING Filesystem Constitutional Worker
Phases 1-2: Repository Snapshot + Differential Tracking

Outputs SQL INSERT statements to stdout for piping into postgres container.
No AI. No embeddings. No Qdrant. Only events.
"""

import os
import sys
import json
import uuid
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("filesystem_worker")

SQL_FILE = Path(__file__).parent / ".constitutional_events.sql"

PING_ROOT = Path(__file__).parent.resolve()
SNAPSHOT_PATH = PING_ROOT / ".constitutional_snapshot.json"

EXCLUDE_DIRS = {".git", "__pycache__", "node_modules", ".venv", "venv", ".opencode"}
EXCLUDE_FILES = {".constitutional_snapshot.json"}


def make_aggregate_id(file_path: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"file:///{file_path.replace(os.sep, '/')}"))


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                h.update(chunk)
        return h.hexdigest()
    except (OSError, PermissionError) as e:
        logger.warning("Cannot hash %s: %s", path, e)
        return ""


def scan_files(root: Path) -> List[Dict]:
    files = []
    scan_queue = [root]
    while scan_queue:
        current = scan_queue.pop()
        try:
            with os.scandir(current) as it:
                for entry in it:
                    try:
                        if entry.is_dir(follow_symlinks=False):
                            if entry.name not in EXCLUDE_DIRS and entry.name != ".git":
                                scan_queue.append(Path(entry.path))
                        elif entry.is_file(follow_symlinks=False):
                            if entry.name in EXCLUDE_FILES:
                                continue
                            rel = Path(entry.path).relative_to(root).as_posix()
                            stat = entry.stat(follow_symlinks=False)
                            fpath = Path(entry.path)
                            file_hash = sha256_file(fpath)
                            files.append({
                                "path": rel,
                                "size": stat.st_size,
                                "sha256": file_hash,
                                "modified_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                                "source": "filesystem",
                            })
                    except (OSError, PermissionError):
                        pass
        except (OSError, PermissionError):
            pass
    return files


def escape_literal(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"


def gen_insert_sql(event_type, aggregate_id, aggregate_type, event_data, correlation_id):
    event_id = str(uuid.uuid4())
    ts = datetime.now(timezone.utc).isoformat()
    payload_json = json.dumps(event_data, sort_keys=True)
    payload_hash = hashlib.sha256(payload_json.encode()).hexdigest()
    return (
        f"INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, "
        f"event_data, causation_id, correlation_id, metadata, payload_hash, projected_to_qdrant) "
        f"VALUES ({escape_literal(event_id)}, {escape_literal(event_type)}, "
        f"{escape_literal(ts)}, {escape_literal(aggregate_id)}, "
        f"{escape_literal(aggregate_type)}, {escape_literal(payload_json)}::jsonb, "
        f"NULL, {escape_literal(correlation_id)}, NULL, "
        f"{escape_literal(payload_hash)}, FALSE);"
    )


def emit_phase1_sql(files):
    """Generate SQL for FILE_DISCOVERED events."""
    correlation_id = str(uuid.uuid4())
    count = 0
    lines = ["BEGIN;"]
    for f in files:
        agg_id = make_aggregate_id(f["path"])
        sql = gen_insert_sql("FILE_DISCOVERED", agg_id, "FILE", {
            "path": f["path"],
            "size": f["size"],
            "sha256": f["sha256"],
            "modified_at": f["modified_at"],
            "source": "filesystem",
        }, correlation_id)
        lines.append(sql)
        count += 1
    lines.append("COMMIT;")
    SQL_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    logger.info("Phase 1 SQL written: %d FILE_DISCOVERED inserts -> %s", count, SQL_FILE)


def load_snapshot() -> Dict[str, Dict]:
    if SNAPSHOT_PATH.exists():
        try:
            return json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning("Cannot load snapshot: %s", e)
    return {}


def save_snapshot(files: List[Dict]):
    snapshot = {}
    for f in files:
        snapshot[f["path"]] = {
            "sha256": f["sha256"],
            "size": f["size"],
            "modified_at": f["modified_at"],
        }
    SNAPSHOT_PATH.write_text(json.dumps(snapshot, indent=2, sort_keys=True), encoding="utf-8")
    logger.info("Snapshot saved: %d entries -> %s", len(snapshot), SNAPSHOT_PATH)


def emit_phase2_sql(files):
    """Generate SQL for change events based on snapshot diff.
    
    First run (no existing snapshot): creates snapshot, no events.
    Subsequent runs: diffs current state vs snapshot, emits changes.
    """
    prev = load_snapshot()
    current = {f["path"]: f for f in files}
    has_prev = bool(prev)

    if not has_prev:
        save_snapshot(files)
        logger.info("Phase 2: Snapshot A created (%d files). No events emitted.", len(files))
        return {"FILE_CREATED": 0, "FILE_MODIFIED": 0, "FILE_DELETED": 0}

    correlation_id = str(uuid.uuid4())
    counts = {"FILE_CREATED": 0, "FILE_MODIFIED": 0, "FILE_DELETED": 0}
    prev_paths = set(prev.keys())
    curr_paths = set(current.keys())
    lines = ["BEGIN;"]

    for path in sorted(curr_paths - prev_paths):
        f = current[path]
        agg_id = make_aggregate_id(path)
        sql = gen_insert_sql("FILE_CREATED", agg_id, "FILE", {
            "path": f["path"], "size": f["size"], "sha256": f["sha256"],
            "modified_at": f["modified_at"], "source": "filesystem",
        }, correlation_id)
        lines.append(sql)
        counts["FILE_CREATED"] += 1

    for path in sorted(curr_paths & prev_paths):
        f = current[path]
        if f["sha256"] != prev[path]["sha256"]:
            agg_id = make_aggregate_id(path)
            sql = gen_insert_sql("FILE_MODIFIED", agg_id, "FILE", {
                "path": f["path"], "size": f["size"], "sha256": f["sha256"],
                "modified_at": f["modified_at"], "source": "filesystem",
                "previous_sha256": prev[path]["sha256"],
            }, correlation_id)
            lines.append(sql)
            counts["FILE_MODIFIED"] += 1

    for path in sorted(prev_paths - curr_paths):
        agg_id = make_aggregate_id(path)
        sql = gen_insert_sql("FILE_DELETED", agg_id, "FILE", {
            "path": path, "source": "filesystem",
        }, correlation_id)
        lines.append(sql)
        counts["FILE_DELETED"] += 1

    lines.append("COMMIT;")
    SQL_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    save_snapshot(files)
    logger.info("Phase 2 SQL generated: %s", counts)
    return counts


def main():
    phase = sys.argv[1] if len(sys.argv) > 1 else "all"
    logger.info("=== PING Filesystem Constitutional Worker ===")
    logger.info("Root: %s Phase: %s", PING_ROOT, phase)

    files = scan_files(PING_ROOT)
    logger.info("Scanned %d files", len(files))

    if phase in ("all", "1"):
        emit_phase1_sql(files)

    if phase in ("all", "2"):
        counts = emit_phase2_sql(files)


if __name__ == "__main__":
    main()
