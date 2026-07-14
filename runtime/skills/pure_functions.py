"""
Skills as Pure Functions.

Instead of:
Skill → runs code

Make:
Skill → Transformation

Input → Output

No side effects.
Side effects belong inside Execution Nodes.

Then planner can reason:
Skill A → Skill B → Skill C

Like compiler optimization.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Callable, TypeVar, Generic
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from pathlib import Path


class FunctionType(Enum):
    """Types of pure functions."""
    TRANSFORMATION = "transformation"
    VALIDATION = "validation"
    COMPUTATION = "computation"
    AGGREGATION = "aggregation"
    FILTER = "filter"
    MAP = "map"
    REDUCE = "reduce"


class Determinism(Enum):
    """Determinism level."""
    DETERMINISTIC = "deterministic"
    PROBABILISTIC = "probabilistic"
    NON_DETERMINISTIC = "non_deterministic"


T = TypeVar('T')
U = TypeVar('U')


@dataclass
class PureFunctionSignature:
    """Signature of a pure function."""
    function_id: str
    function_name: str
    function_type: FunctionType
    input_types: List[str]
    output_types: List[str]
    determinism: Determinism
    description: str
    estimated_cost_tokens: int
    estimated_time_seconds: int
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "function_id": self.function_id,
            "function_name": self.function_name,
            "function_type": self.function_type.value,
            "input_types": self.input_types,
            "output_types": self.output_types,
            "determinism": self.determinism.value,
            "description": self.description,
            "estimated_cost_tokens": self.estimated_cost_tokens,
            "estimated_time_seconds": self.estimated_time_seconds,
            "metadata": self.metadata
        }


@dataclass
class FunctionCall:
    """A call to a pure function."""
    call_id: str
    function_id: str
    inputs: Dict[str, Any]
    outputs: Optional[Dict[str, Any]]
    called_at: str
    completed_at: Optional[str]
    success: bool
    error_message: Optional[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "call_id": self.call_id,
            "function_id": self.function_id,
            "inputs": self.inputs,
            "outputs": self.outputs,
            "called_at": self.called_at,
            "completed_at": self.completed_at,
            "success": self.success,
            "error_message": self.error_message
        }


class PureFunction(Generic[T, U]):
    """
    A pure function - no side effects.
    
    Input → Output transformation only.
    Side effects belong in Execution Nodes.
    """
    
    def __init__(
        self,
        function_id: str,
        function_name: str,
        function_type: FunctionType,
        determinism: Determinism,
        description: str,
        implementation: Callable[[T], U]
    ):
        self.function_id = function_id
        self.function_name = function_name
        self.function_type = function_type
        self.determinism = determinism
        self.description = description
        self.implementation = implementation
        self._signature = PureFunctionSignature(
            function_id=function_id,
            function_name=function_name,
            function_type=function_type,
            input_types=[],
            output_types=[],
            determinism=determinism,
            description=description,
            estimated_cost_tokens=0,
            estimated_time_seconds=0,
            metadata={}
        )
    
    def __call__(self, input_data: T) -> U:
        """Execute the pure function."""
        return self.implementation(input_data)
    
    def get_signature(self) -> PureFunctionSignature:
        """Get function signature."""
        return self._signature
    
    def compose(self, other: 'PureFunction[U, Any]') -> 'PureFunction[T, Any]':
        """
        Compose this function with another.
        
        Returns: f ∘ g (f after g)
        """
        def composed(input_data: T) -> Any:
            intermediate = self(input_data)
            return other(intermediate)
        
        return PureFunction(
            function_id=f"composed_{self.function_id}_{other.function_id}",
            function_name=f"{self.function_name} → {other.function_name}",
            function_type=FunctionType.TRANSFORMATION,
            determinism=Determinism.DETERMINISTIC if (
                self.determinism == Determinism.DETERMINISTIC and 
                other.determinism == Determinism.DETERMINISTIC
            ) else Determinism.PROBABILISTIC,
            description=f"Composition of {self.function_name} and {other.function_name}",
            implementation=composed
        )


class PureFunctionRegistry:
    """
    Registry for pure functions.
    
    Skills become pure functions - no side effects.
    """
    
    def __init__(self):
        self._functions: Dict[str, PureFunction] = {}
    
    def register(self, function: PureFunction) -> None:
        """Register a pure function."""
        self._functions[function.function_id] = function
    
    def get(self, function_id: str) -> Optional[PureFunction]:
        """Get function by ID."""
        return self._functions.get(function_id)
    
    def get_by_type(self, function_type: FunctionType) -> List[PureFunction]:
        """Get all functions of a type."""
        return [
            func for func in self._functions.values()
            if func.function_type == function_type
        ]
    
    def get_deterministic_functions(self) -> List[PureFunction]:
        """Get all deterministic functions."""
        return [
            func for func in self._functions.values()
            if func.determinism == Determinism.DETERMINISTIC
        ]
    
    def compose_chain(self, function_ids: List[str]) -> Optional[PureFunction]:
        """
        Compose a chain of functions.
        
        Args:
            function_ids: List of function IDs to compose in order
        
        Returns:
            Composed function or None if composition fails
        """
        if not function_ids:
            return None
        
        first_func = self.get(function_ids[0])
        if not first_func:
            return None
        
        composed = first_func
        
        for func_id in function_ids[1:]:
            next_func = self.get(func_id)
            if not next_func:
                return None
            composed = composed.compose(next_func)
        
        return composed
    
    def find_composable_chain(
        self,
        input_type: str,
        output_type: str
    ) -> List[List[str]]:
        """
        Find all chains that transform input_type to output_type.
        
        Args:
            input_type: Input type
            output_type: Output type
        
        Returns:
            List of function ID chains
        """
        # This is a simplified implementation
        # In production, this would use graph search
        chains = []
        
        for func in self._functions.values():
            if input_type in func._signature.input_types:
                if output_type in func._signature.output_types:
                    chains.append([func.function_id])
        
        return chains


class FunctionExecutor:
    """
    Executes pure functions.
    
    Tracks function calls and results.
    """
    
    def __init__(self, registry: PureFunctionRegistry):
        self.registry = registry
        self._call_history: List[FunctionCall] = []
    
    async def execute(
        self,
        function_id: str,
        input_data: Any
    ) -> FunctionCall:
        """
        Execute a pure function.
        
        Args:
            function_id: Function ID
            input_data: Input data
        
        Returns:
            Function call record
        """
        func = self.registry.get(function_id)
        if not func:
            raise ValueError(f"Function {function_id} not found")
        
        call = FunctionCall(
            call_id=str(uuid.uuid4()),
            function_id=function_id,
            inputs={"input": input_data},
            outputs=None,
            called_at=datetime.now(timezone.utc).isoformat(),
            completed_at=None,
            success=False,
            error_message=None
        )
        
        try:
            result = func(input_data)
            call.outputs = {"output": result}
            call.success = True
        except Exception as e:
            call.error_message = str(e)
            call.success = False
        finally:
            call.completed_at = datetime.now(timezone.utc).isoformat()
            self._call_history.append(call)
        
        return call
    
    def get_call_history(self, function_id: Optional[str] = None) -> List[FunctionCall]:
        """Get call history."""
        if function_id:
            return [call for call in self._call_history if call.function_id == function_id]
        return self._call_history.copy()
    
    def clear_history(self) -> None:
        """Clear call history."""
        self._call_history.clear()


class FunctionOptimizer:
    """
    Optimizes function composition.
    
    Like compiler optimization for pure functions.
    """
    
    def __init__(self, registry: PureFunctionRegistry):
        self.registry = registry
    
    def optimize_chain(self, function_ids: List[str]) -> List[str]:
        """
        Optimize a function chain.
        
        Args:
            function_ids: Original function chain
        
        Returns:
            Optimized function chain
        """
        # Simplified optimization:
        # 1. Remove redundant functions
        # 2. Merge compatible functions
        # 3. Reorder for efficiency
        
        optimized = []
        seen_signatures = set()
        
        for func_id in function_ids:
            func = self.registry.get(func_id)
            if not func:
                optimized.append(func_id)
                continue
            
            signature = f"{func.function_type.value}_{func.determinism.value}"
            
            # Skip if we've seen an equivalent function
            if signature in seen_signatures:
                continue
            
            optimized.append(func_id)
            seen_signatures.add(signature)
        
        return optimized
    
    def find_shortest_path(
        self,
        input_type: str,
        output_type: str
    ) -> Optional[List[str]]:
        """
        Find shortest path from input_type to output_type.
        
        Args:
            input_type: Input type
            output_type: Output type
        
        Returns:
            Shortest function chain or None
        """
        # BFS to find shortest path
        from collections import deque
        
        queue = deque([(input_type, [])])
        visited = set()
        
        while queue:
            current_type, path = queue.popleft()
            
            if current_type == output_type:
                return path
            
            if current_type in visited:
                continue
            visited.add(current_type)
            
            # Find functions that take current_type as input
            for func in self.registry._functions.values():
                if current_type in func._signature.input_types:
                    for out_type in func._signature.output_types:
                        queue.append((out_type, path + [func.function_id]))
        
        return None


# Built-in pure functions
def identity(x: T) -> T:
    """Identity function."""
    return x


def to_uppercase(text: str) -> str:
    """Convert text to uppercase."""
    return text.upper()


def to_lowercase(text: str) -> str:
    """Convert text to lowercase."""
    return text.lower()


def reverse_list(items: List[T]) -> List[T]:
    """Reverse a list."""
    return list(reversed(items))


def filter_positive(numbers: List[int]) -> List[int]:
    """Filter positive numbers."""
    return [n for n in numbers if n > 0]


def sum_list(numbers: List[int]) -> int:
    """Sum a list of numbers."""
    return sum(numbers)


# Initialize registry with built-in functions
_pure_function_registry = PureFunctionRegistry()

_pure_function_registry.register(PureFunction(
    function_id="identity",
    function_name="Identity",
    function_type=FunctionType.TRANSFORMATION,
    determinism=Determinism.DETERMINISTIC,
    description="Identity function - returns input unchanged",
    implementation=identity
))

_pure_function_registry.register(PureFunction(
    function_id="to_uppercase",
    function_name="To Uppercase",
    function_type=FunctionType.TRANSFORMATION,
    determinism=Determinism.DETERMINISTIC,
    description="Convert text to uppercase",
    implementation=to_uppercase
))

_pure_function_registry.register(PureFunction(
    function_id="to_lowercase",
    function_name="To Lowercase",
    function_type=FunctionType.TRANSFORMATION,
    determinism=Determinism.DETERMINISTIC,
    description="Convert text to lowercase",
    implementation=to_lowercase
))

_pure_function_registry.register(PureFunction(
    function_id="reverse_list",
    function_name="Reverse List",
    function_type=FunctionType.TRANSFORMATION,
    determinism=Determinism.DETERMINISTIC,
    description="Reverse a list",
    implementation=reverse_list
))

_pure_function_registry.register(PureFunction(
    function_id="filter_positive",
    function_name="Filter Positive",
    function_type=FunctionType.FILTER,
    determinism=Determinism.DETERMINISTIC,
    description="Filter positive numbers from list",
    implementation=filter_positive
))

_pure_function_registry.register(PureFunction(
    function_id="sum_list",
    function_name="Sum List",
    function_type=FunctionType.REDUCE,
    determinism=Determinism.DETERMINISTIC,
    description="Sum a list of numbers",
    implementation=sum_list
))


def get_pure_function_registry() -> PureFunctionRegistry:
    """Get the singleton pure function registry."""
    return _pure_function_registry


def get_function_executor() -> FunctionExecutor:
    """Get a new function executor."""
    return FunctionExecutor(_pure_function_registry)


def get_function_optimizer() -> FunctionOptimizer:
    """Get a new function optimizer."""
    return FunctionOptimizer(_pure_function_registry)
