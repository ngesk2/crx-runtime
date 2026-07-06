import json
import tempfile
import unittest
from pathlib import Path

from scripts.mission_graph import build_mission_graph, query_mission_graph


class MissionGraphTests(unittest.TestCase):
    def test_mission_graph_expands_to_authority_and_capability(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            graph = build_mission_graph(root=root)
            self.assertTrue(graph["missions"])
            mission = query_mission_graph(graph, "VerifyReplay")
            self.assertIsNotNone(mission)
            self.assertIn("ReplayAuthority", mission["authorities"])
            self.assertIn("ReplayTranscript", mission["capabilities"])


if __name__ == "__main__":
    unittest.main()
