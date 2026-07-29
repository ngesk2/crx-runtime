"""Implementation Hash

Constitutional implementation hashing from semantic structure.

Architecture:
Source Code
  ↓
AST
  ↓
Canonical AST
  ↓
SHA-256

Implementation identity should derive from immutable artifacts,
not version strings. Otherwise version strings become authority
instead of implementation.

Long-term: Hash semantic structure instead of raw source.
Whitespace, comments, formatting, imports shouldn't change identity.
"""

import hashlib
import inspect
import ast
from pathlib import Path
from typing import Any


class SemanticHasher:
    """
    Computes constitutional hashes from semantic structure (AST).
    
    Replaces raw source hashing with semantic hashing.
    Whitespace, comments, formatting, imports shouldn't change identity.
    """
    
    def __init__(self, hash_algorithm: str = "sha256"):
        self.hash_algorithm = hash_algorithm
    
    def _canonical_ast(self, node: ast.AST) -> dict[str, Any]:
        """
        Convert AST node to canonical dictionary representation.
        
        This removes implementation details that shouldn't affect identity:
        - Line numbers
        - Column offsets
        - Comments
        - Whitespace
        """
        if isinstance(node, ast.Module):
            return {
                "type": "Module",
                "body": [self._canonical_ast(n) for n in node.body],
            }
        elif isinstance(node, ast.FunctionDef):
            return {
                "type": "FunctionDef",
                "name": node.name,
                "args": self._canonical_ast(node.args),
                "body": [self._canonical_ast(n) for n in node.body],
                "returns": self._canonical_ast(node.returns) if node.returns else None,
            }
        elif isinstance(node, ast.ClassDef):
            return {
                "type": "ClassDef",
                "name": node.name,
                "bases": [self._canonical_ast(base) for base in node.bases],
                "body": [self._canonical_ast(n) for n in node.body],
            }
        elif isinstance(node, ast.arguments):
            return {
                "type": "arguments",
                "args": [self._canonical_ast(arg) for arg in node.args],
                "defaults": [self._canonical_ast(d) for d in node.defaults],
            }
        elif isinstance(node, ast.arg):
            return {
                "type": "arg",
                "arg": node.arg,
            }
        elif isinstance(node, ast.Name):
            return {
                "type": "Name",
                "id": node.id,
            }
        elif isinstance(node, ast.Constant):
            return {
                "type": "Constant",
                "value": node.value,
            }
        elif isinstance(node, ast.Return):
            return {
                "type": "Return",
                "value": self._canonical_ast(node.value) if node.value else None,
            }
        elif isinstance(node, ast.Assign):
            return {
                "type": "Assign",
                "targets": [self._canonical_ast(t) for t in node.targets],
                "value": self._canonical_ast(node.value),
            }
        elif isinstance(node, ast.Expr):
            return {
                "type": "Expr",
                "value": self._canonical_ast(node.value),
            }
        elif isinstance(node, ast.Call):
            return {
                "type": "Call",
                "func": self._canonical_ast(node.func),
                "args": [self._canonical_ast(arg) for arg in node.args],
            }
        elif isinstance(node, ast.Attribute):
            return {
                "type": "Attribute",
                "value": self._canonical_ast(node.value),
                "attr": node.attr,
            }
        elif isinstance(node, ast.Import):
            return {
                "type": "Import",
                "names": [alias.name for alias in node.names],
            }
        elif isinstance(node, ast.ImportFrom):
            return {
                "type": "ImportFrom",
                "module": node.module,
                "names": [alias.name for alias in node.names],
            }
        else:
            # Fallback for unsupported node types
            return {
                "type": node.__class__.__name__,
            }
    
    def _hash_canonical_ast(self, canonical_ast: dict[str, Any]) -> str:
        """
        Hash canonical AST representation.
        
        Args:
            canonical_ast: Canonical AST dictionary
        
        Returns:
            Hexadecimal hash of the canonical AST
        """
        import json
        
        # Canonical JSON encoding (sorted keys, no extra whitespace)
        canonical_json = json.dumps(canonical_ast, sort_keys=True, separators=(",", ":"))
        hash_obj = hashlib.sha256(canonical_json.encode("utf-8"))
        return hash_obj.hexdigest()
    
    def hash_source_file(self, file_path: str | Path) -> str:
        """
        Hash a source file using semantic structure (AST).
        
        Args:
            file_path: Path to source file
        
        Returns:
            Hexadecimal hash of the semantic structure
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Source file not found: {file_path}")
        
        # Read source file
        source_code = path.read_text(encoding="utf-8")
        
        # Parse AST
        try:
            tree = ast.parse(source_code)
            canonical_ast = self._canonical_ast(tree)
            return self._hash_canonical_ast(canonical_ast)
        except SyntaxError:
            # Fallback to raw source if parsing fails
            return self._hash_raw_source(source_code)
    
    def _hash_raw_source(self, source_code: str) -> str:
        """
        Fallback: hash raw source (for non-parseable code).
        
        Args:
            source_code: Source code to hash
        
        Returns:
            Hexadecimal hash of the raw source
        """
        # Normalize line endings
        normalized_source = source_code.replace("\r\n", "\n").replace("\r", "\n")
        hash_obj = hashlib.sha256(normalized_source.encode("utf-8"))
        return hash_obj.hexdigest()
    
    def hash_function_source(self, func: callable) -> str:
        """
        Hash the semantic structure of a function.
        
        Args:
            func: Function to hash
        
        Returns:
            Hexadecimal hash of the function's semantic structure
        """
        try:
            source = inspect.getsource(func)
            tree = ast.parse(source)
            # Find the function definition
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef) and node.name == func.__name__:
                    canonical_ast = self._canonical_ast(node)
                    return self._hash_canonical_ast(canonical_ast)
            # Fallback if function not found
            return self._hash_raw_source(source)
        except (TypeError, OSError, SyntaxError):
            # Fallback for built-in functions or C extensions
            return self.hash_string(f"{func.__module__}.{func.__name__}")
    
    def hash_class_source(self, cls: type) -> str:
        """
        Hash the semantic structure of a class.
        
        Args:
            cls: Class to hash
        
        Returns:
            Hexadecimal hash of the class's semantic structure
        """
        try:
            source = inspect.getsource(cls)
            tree = ast.parse(source)
            # Find the class definition
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef) and node.name == cls.__name__:
                    canonical_ast = self._canonical_ast(node)
                    return self._hash_canonical_ast(canonical_ast)
            # Fallback if class not found
            return self._hash_raw_source(source)
        except (TypeError, OSError, SyntaxError):
            # Fallback for built-in classes or C extensions
            return self.hash_string(f"{cls.__module__}.{cls.__name__}")
    
    def hash_module_source(self, module_name: str) -> str:
        """
        Hash the semantic structure of a module.
        
        Args:
            module_name: Module name to hash
        
        Returns:
            Hexadecimal hash of the module's semantic structure
        """
        try:
            module = __import__(module_name)
            module_file = getattr(module, "__file__", None)
            
            if module_file and module_file.endswith(".py"):
                return self.hash_source_file(module_file)
            else:
                # Fallback for C extensions or packages
                return self.hash_string(module_name)
        except ImportError:
            # Module not found
            return self.hash_string(f"module_not_found:{module_name}")
    
    def hash_string(self, value: str) -> str:
        """
        Hash a string (fallback for non-source artifacts).
        
        Args:
            value: String to hash
        
        Returns:
            Hexadecimal hash of the string
        """
        hash_obj = hashlib.sha256(value.encode("utf-8"))
        return hash_obj.hexdigest()
    
    def hash_dict(self, data: dict[str, Any]) -> str:
        """
        Hash a dictionary using canonical encoding.
        
        Args:
            data: Dictionary to hash
        
        Returns:
            Hexadecimal hash of the dictionary
        """
        import json
        
        # Canonical JSON encoding (sorted keys, no extra whitespace)
        canonical_json = json.dumps(data, sort_keys=True, separators=(",", ":"))
        hash_obj = hashlib.sha256(canonical_json.encode("utf-8"))
        return hash_obj.hexdigest()


# Backward compatibility alias
ImplementationHasher = SemanticHasher
