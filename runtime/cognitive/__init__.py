"""
Constitutional Cognitive Runtime
Transforms Ollama from chat model into constitutional reasoning runtime.
Architecture: Supervisor (14B) plans + Workers (7B) execute + Structured protocol
"""

from .models import ContextPack, WorkerTask, WorkerResponse, AuthorityResolution, ReasoningPlan
from .worker_protocol import WorkerProtocol
from .context_pack import ContextPackBuilder
from .context_pack_cache import ContextPackCache
from .projection_sovereignty import ProjectionSovereignty
from .repository_cognition import RepositoryCognition
from .supervisor import Supervisor
from .search_worker import SearchWorker
from .contradiction_worker import ContradictionWorker
from .architecture_worker import ArchitectureWorker
from .memory_worker import MemoryWorker
from .reasoning_gateway import ReasoningGateway
