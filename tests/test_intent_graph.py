import json
import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.intent_graph_builder import generate_indexes, query_graph


class IntentGraphBuilderTests(unittest.TestCase):
    def test_generator_creates_indexes_and_query_support(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            result = generate_indexes(output_root=tmp_path)

            self.assertTrue((tmp_path / "knowledge" / "intent-index.json").exists())
            self.assertTrue((tmp_path / "knowledge" / "authority-index.json").exists())
            self.assertTrue((tmp_path / "knowledge" / "knowledge-graph.json").exists())
            self.assertTrue(any(node["id"] == "intent:replay-verification" for node in result["graph"]["nodes"]))
            self.assertEqual(result["summary"]["intent_count"], 8)

            authority = query_graph(result["graph"], "authority", "ReplayAuthority")
            self.assertIsNotNone(authority)
            self.assertEqual(authority["label"], "ReplayAuthority")


if __name__ == "__main__":
    unittest.main()
