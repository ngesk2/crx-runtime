import json
import tempfile
import unittest
from pathlib import Path

from scripts.constitutional_operating_mode import execute_mission, load_mission_state


class ConstitutionalOperatingModeTests(unittest.TestCase):
    def test_execute_mission_persists_workspace_and_results(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            result = execute_mission("VerifyReplay", root=root)
            self.assertTrue(result["ok"])
            self.assertTrue((root / "missions" / "VerifyReplay" / "workspace.json").exists())
            self.assertTrue((root / "missions" / "VerifyReplay" / "results.json").exists())
            state = load_mission_state("VerifyReplay", root=root)
            self.assertEqual(state["mission"], "VerifyReplay")


if __name__ == "__main__":
    unittest.main()
