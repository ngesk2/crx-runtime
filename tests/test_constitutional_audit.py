import json
from pathlib import Path

from audit import run_audit


def test_audit_generates_proof_artifacts(tmp_path: Path):
    report = run_audit(output_dir=tmp_path)

    assert report["summary"]["status"] in {"pass", "fail"}
    assert (tmp_path / "authority-proof.json").exists()
    assert (tmp_path / "configuration-proof.json").exists()
    assert (tmp_path / "projection-proof.json").exists()
    assert (tmp_path / "replay-proof.json").exists()
    assert (tmp_path / "execution-proof.json").exists()
    assert (tmp_path / "repository-proof.json").exists()
    assert (tmp_path / "dependency-inventory.json").exists()

    proof = json.loads((tmp_path / "authority-proof.json").read_text(encoding="utf-8"))
    assert proof["owner"] == "AuthoritySweep"
    assert proof["invariant"]
    assert proof["test_executed"]
    assert "timestamp" in proof
    assert proof["commit_sha"]
