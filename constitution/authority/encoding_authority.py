"""Encoding Authority

Encodes canonical trees to bytes in various formats.

Architecture:
EncodingRegistry
  ↓
  EncodingProvider
  ↓
Encoding Authority
  ↓
Bytes (UTF-8, CBOR, MessagePack, etc.)

This separation allows multiple encoding formats without touching traversal.
New encoders register themselves, exactly like providers.
"""

from dataclasses import dataclass
from typing import Any, Callable
from enum import Enum
import json

from .canonical_tree import CanonicalTree, CanonicalNode, CanonicalNodeType


class EncodingFormat(Enum):
    """Supported encoding formats"""
    UTF8_JSON = "utf8_json"
    CBOR = "cbor"
    MESSAGEPACK = "messagepack"
    BINARY = "binary"


@dataclass(frozen=True)
class EncodingResult:
    """
    Result of encoding a canonical tree.
    
    Contains:
    - bytes (encoded bytes)
    - format (encoding format used)
    - length (byte length)
    """
    bytes: bytes
    format: EncodingFormat
    length: int
    
    @property
    def hex(self) -> str:
        """Get hexadecimal representation"""
        return self.bytes.hex()


class EncodingProvider:
    """
    Provider for a specific encoding format.
    
    Encoders register themselves with the EncodingRegistry.
    """
    
    def __init__(
        self,
        format: EncodingFormat,
        encode_func: Callable[[CanonicalTree], EncodingResult],
        decode_func: Callable[[bytes], CanonicalTree] | None = None,
    ):
        self.format = format
        self.encode_func = encode_func
        self.decode_func = decode_func
    
    def encode(self, tree: CanonicalTree) -> EncodingResult:
        """Encode canonical tree to bytes"""
        return self.encode_func(tree)
    
    def decode(self, data: bytes) -> CanonicalTree:
        """Decode bytes to canonical tree"""
        if self.decode_func is None:
            raise NotImplementedError(f"Decoding not implemented for {self.format.value}")
        return self.decode_func(data)


class EncodingRegistry:
    """
    Registry for encoding providers.
    
    New encoders register themselves, exactly like providers.
    """
    
    def __init__(self):
        self._providers: dict[EncodingFormat, EncodingProvider] = {}
    
    def register_provider(self, provider: EncodingProvider) -> None:
        """Register an encoding provider"""
        self._providers[provider.format] = provider
    
    def get_provider(self, format: EncodingFormat) -> EncodingProvider:
        """Get encoding provider by format"""
        provider = self._providers.get(format)
        if not provider:
            raise ValueError(f"No provider registered for format: {format.value}")
        return provider
    
    def list_formats(self) -> list[EncodingFormat]:
        """List all registered encoding formats"""
        return list(self._providers.keys())


class EncodingAuthority:
    """
    Authority for encoding canonical trees to bytes.
    
    Uses EncodingRegistry for registration-based dispatch.
    New encoders register themselves, exactly like providers.
    
    Separation of concerns:
    - Traversal produces canonical tree
    - Encoding registry manages encoding providers
    - Encoding authority provides unified interface
    """
    
    def __init__(self, default_format: EncodingFormat = EncodingFormat.UTF8_JSON):
        self.default_format = default_format
        self.registry = EncodingRegistry()
        self._register_default_providers()
    
    def _register_default_providers(self) -> None:
        """Register default encoding providers"""
        # Register UTF-8 JSON provider
        utf8_json_provider = EncodingProvider(
            format=EncodingFormat.UTF8_JSON,
            encode_func=self._encode_utf8_json,
            decode_func=self._decode_utf8_json,
        )
        self.registry.register_provider(utf8_json_provider)
    
    def encode(
        self,
        tree: CanonicalTree,
        format: EncodingFormat | None = None,
    ) -> EncodingResult:
        """
        Encode canonical tree to bytes.
        
        Args:
            tree: Canonical tree to encode
            format: Encoding format (uses default if None)
        
        Returns:
            Encoding result with bytes and format
        """
        encoding_format = format or self.default_format
        provider = self.registry.get_provider(encoding_format)
        return provider.encode(tree)
    
    def decode(
        self,
        data: bytes,
        format: EncodingFormat | None = None,
    ) -> CanonicalTree:
        """
        Decode bytes to canonical tree.
        
        Args:
            data: Bytes to decode
            format: Encoding format (uses default if None)
        
        Returns:
            Canonical tree
        """
        encoding_format = format or self.default_format
        provider = self.registry.get_provider(encoding_format)
        return provider.decode(data)
    
    def register_provider(self, provider: EncodingProvider) -> None:
        """Register a custom encoding provider"""
        self.registry.register_provider(provider)
    
    def _encode_utf8_json(self, tree: CanonicalTree) -> EncodingResult:
        """
        Encode canonical tree to UTF-8 JSON bytes.
        
        This is the default encoding format.
        """
        # Convert tree to dictionary
        tree_dict = tree.to_dict()
        
        # Encode as JSON with canonical formatting
        # (sorted keys, no extra whitespace)
        json_str = json.dumps(tree_dict, sort_keys=True, separators=(",", ":"))
        
        # Encode to UTF-8 bytes
        json_bytes = json_str.encode("utf-8")
        
        return EncodingResult(
            bytes=json_bytes,
            format=EncodingFormat.UTF8_JSON,
            length=len(json_bytes),
        )
    
    def _decode_utf8_json(self, data: bytes) -> CanonicalTree:
        """
        Decode UTF-8 JSON bytes to canonical tree.
        
        MVP: Requires canonical tree builder - not implemented yet.
        """
        raise NotImplementedError("UTF-8 JSON decoding not yet implemented")
