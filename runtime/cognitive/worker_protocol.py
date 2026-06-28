"""
Worker Protocol — Structured Communication for Constitutional Reasoning

Rule 5: All worker communication must be structured JSON.
Natural language communication between workers is forbidden.
"""
import json
import sys
import os
from typing import Dict, Any, Optional, List
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, ROOT)

from runtime.authorities.execution_authority import ExecutionAuthority

from .models import WorkerTask, WorkerResponse, WorkerRole


TOOL_MAP = {
    'authority_search': os.path.join(os.path.dirname(__file__), '..', 'tools', 'authority_search.py'),
    'lineage_search': os.path.join(os.path.dirname(__file__), '..', 'tools', 'lineage_search.py'),
    'graph_expand': os.path.join(os.path.dirname(__file__), '..', 'tools', 'graph_expand.py'),
    'contradiction_search': os.path.join(os.path.dirname(__file__), '..', 'tools', 'contradiction_search.py'),
    'repository_symbols': os.path.join(os.path.dirname(__file__), '..', 'tools', 'repository_symbols.py'),
    'repository_relationships': os.path.join(os.path.dirname(__file__), '..', 'tools', 'repository_relationships.py'),
}


class WorkerProtocol:
    """
    Structured communication protocol for the constitutional reasoning runtime.
    All inter-worker communication uses JSON task/response format.
    No natural language is permitted between workers.
    """

    @staticmethod
    def call_tool(tool_name: str, args: Dict[str, Any], timeout: int = 30) -> Optional[Dict[str, Any]]:
        path = TOOL_MAP.get(tool_name)
        if not path:
            return {'error': f'unknown tool: {tool_name}'}
        if not os.path.exists(path):
            return {'error': f'missing tool: {path}'}
        try:
            authority = ExecutionAuthority()
            result = authority.run([sys.executable, path], timeout=timeout, input_data=json.dumps(args).encode('utf-8'))
            if result.returncode != 0:
                return {'error': result.stderr[:500]}
            return json.loads(result.stdout)
        except TimeoutError:
            return {'error': f'tool {tool_name} timed out after {timeout}s'}
        except json.JSONDecodeError:
            return {'error': f'invalid JSON from tool {tool_name}'}
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def send_task(worker_role: WorkerRole, task: WorkerTask) -> WorkerResponse:
        """
        Send a structured task to a worker.
        Workers receive structured JSON tasks and return structured JSON responses.
        """
        return WorkerResponse(
            task_id=task.task_id,
            worker=worker_role.value,
            findings=[],
            confidence=0.0,
            error="not_implemented"
        )

    @staticmethod
    def validate_task(task: WorkerTask) -> bool:
        required = ['task_id', 'worker', 'objective']
        d = task.to_dict()
        return all(k in d and d[k] for k in required)

    @staticmethod
    def validate_response(response: WorkerResponse) -> bool:
        required = ['task_id', 'worker', 'findings']
        d = response.to_dict()
        return all(k in d for k in required)

    @staticmethod
    def format_task_output(tool_name: str, raw_output: Any) -> List[Dict[str, Any]]:
        """Normalize any tool's raw output into a list of structured findings."""
        if isinstance(raw_output, dict):
            if 'error' in raw_output:
                return [{'tool': tool_name, 'error': raw_output['error']}]
            return [{'tool': tool_name, 'source': 'tool_output', 'data': raw_output}]
        if isinstance(raw_output, list):
            return [{'tool': tool_name, 'source': 'tool_output', 'data': item} for item in raw_output]
        return [{'tool': tool_name, 'source': 'tool_output', 'data': str(raw_output)}]
