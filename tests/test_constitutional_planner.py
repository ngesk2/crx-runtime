import unittest

from scripts.constitutional_planner import build_plan


class ConstitutionalPlannerTests(unittest.TestCase):
    def test_plan_expands_to_dag(self):
        plan = build_plan("Verify repository replay determinism.")
        self.assertTrue(plan["ok"])
        self.assertEqual(plan["mission"], "VerifyReplay")
        self.assertTrue(plan["dag"])
        self.assertTrue(any(node["kind"] == "Authority" for node in plan["dag"]))


if __name__ == "__main__":
    unittest.main()
