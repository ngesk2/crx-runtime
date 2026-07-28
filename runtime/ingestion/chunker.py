"""
Document Chunker

Chunks text content for embedding and retrieval.
"""

import logging
from typing import List, Dict
import re

logger = logging.getLogger(__name__)


class Chunker:
    """Chunks text content for embedding."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_text(self, text: str, metadata: Dict = None) -> List[Dict]:
        """
        Chunk text into overlapping segments.
        
        Args:
            text: Text to chunk
            metadata: Optional metadata to include with each chunk
        
        Returns:
            List of chunk dictionaries with text and metadata
        """
        if not text:
            return []
        
        chunks = []
        start = 0
        chunk_id = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # Try to break at word boundary
            if end < len(text):
                # Find last space before end
                last_space = text.rfind(' ', start, end)
                if last_space > start:
                    end = last_space
            
            chunk_text = text[start:end].strip()
            
            if chunk_text:
                chunk_metadata = metadata.copy() if metadata else {}
                chunk_metadata.update({
                    'chunk_id': chunk_id,
                    'chunk_start': start,
                    'chunk_end': end,
                    'chunk_size': len(chunk_text)
                })
                
                chunks.append({
                    'text': chunk_text,
                    'metadata': chunk_metadata
                })
                
                chunk_id += 1
            
            start = end - self.chunk_overlap
            if start < 0:
                start = 0
        
        return chunks
    
    def chunk_by_paragraph(self, text: str, metadata: Dict = None) -> List[Dict]:
        """
        Chunk text by paragraph boundaries.
        
        Args:
            text: Text to chunk
            metadata: Optional metadata to include with each chunk
        
        Returns:
            List of chunk dictionaries with text and metadata
        """
        if not text:
            return []
        
        paragraphs = re.split(r'\n\s*\n', text)
        chunks = []
        
        current_chunk = []
        current_size = 0
        chunk_id = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            para_size = len(para)
            
            if current_size + para_size > self.chunk_size and current_chunk:
                # Emit current chunk
                chunk_text = '\n\n'.join(current_chunk)
                chunk_metadata = metadata.copy() if metadata else {}
                chunk_metadata.update({
                    'chunk_id': chunk_id,
                    'chunk_size': len(chunk_text)
                })
                
                chunks.append({
                    'text': chunk_text,
                    'metadata': chunk_metadata
                })
                
                current_chunk = []
                current_size = 0
                chunk_id += 1
            
            current_chunk.append(para)
            current_size += para_size
        
        # Emit remaining chunk
        if current_chunk:
            chunk_text = '\n\n'.join(current_chunk)
            chunk_metadata = metadata.copy() if metadata else {}
            chunk_metadata.update({
                'chunk_id': chunk_id,
                'chunk_size': len(chunk_text)
            })
            
            chunks.append({
                'text': chunk_text,
                'metadata': chunk_metadata
            })
        
        return chunks
