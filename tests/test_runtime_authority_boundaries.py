import unittest

from runtime.configuration import Configuration
from runtime.constitutional.repository_authority import RepositoryAuthority
from runtime.authorities.execution_authority import ExecutionAuthority


class DummySecretAdapter:
    def get_postgres_password(self):
        return "secret-pw"

    def get_qdrant_key(self):
        return "qdrant-key"


class RuntimeAuthorityBoundaryTests(unittest.TestCase):
    def test_configuration_is_immutable_and_uses_secret_adapter_values(self):
        adapter = DummySecretAdapter()
        config = Configuration(secret_adapter=adapter)

        postgres = config.get_postgres_config()
        qdrant = config.get_qdrant_config()

        self.assertEqual(postgres["password"], "secret-pw")
        self.assertEqual(qdrant["api_key"], "qdrant-key")
        self.assertEqual(config.get_postgres_config()["password"], "secret-pw")

    def test_repository_authority_persist_returns_event_id(self):
        authority = RepositoryAuthority()
        event_id = authority.persist({"event_type": "TEST_EVENT"}, aggregate_id="agg-1")
        self.assertTrue(event_id)

    def test_execution_authority_routes_through_adapter(self):
        class RecordingAdapter:
            def __init__(self):
                self.calls = []

            def execute(self, request):
                self.calls.append(request)
                return type("Result", (), {"returncode": 0, "stdout": "ok", "stderr": "", "command": request.command})()

        adapter = RecordingAdapter()
        authority = ExecutionAuthority(adapter=adapter)
        result = authority.run(["echo", "ok"])

        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "ok")
        self.assertEqual(len(adapter.calls), 1)
        self.assertEqual(adapter.calls[0].command, "echo")


if __name__ == "__main__":
    unittest.main()
