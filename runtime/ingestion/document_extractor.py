"""
Document Content Extractor

Extracts text content from various document formats.
Phase 2: Content extraction for Google Drive documents.
"""

import os
import logging
from typing import Dict, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class DocumentExtractor:
    """Extract content from various document formats."""
    
    def __init__(self):
        self.supported_formats = {
            'application/pdf': self._extract_pdf,
            'text/markdown': self._extract_text,
            'text/plain': self._extract_text,
            'application/vnd.google-apps.document': self._extract_google_doc,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': self._extract_word,
            'application/msword': self._extract_word
        }
    
    def extract(self, file_path: str, mime_type: str, drive_service=None) -> Optional[Dict]:
        """
        Extract content from a document.
        
        Args:
            file_path: Path to the downloaded file
            mime_type: MIME type of the document
            drive_service: Google Drive service (for Google Docs)
        
        Returns:
            Dictionary with extracted content or None if extraction fails
        """
        extractor = self.supported_formats.get(mime_type)
        
        if not extractor:
            logger.warning(f"Unsupported MIME type: {mime_type}")
            return None
        
        try:
            return extractor(file_path, drive_service)
        except Exception as e:
            logger.error(f"Failed to extract content: {e}")
            return None
    
    def _extract_text(self, file_path: str, drive_service=None) -> Dict:
        """Extract content from text files."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {
            'content': content,
            'content_type': 'text',
            'success': True
        }
    
    def _extract_pdf(self, file_path: str, drive_service=None) -> Dict:
        """Extract content from PDF files."""
        try:
            import PyPDF2
            
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                content = ""
                for page in reader.pages:
                    content += page.extract_text() + "\n"
            
            return {
                'content': content,
                'content_type': 'pdf',
                'success': True
            }
        except ImportError:
            logger.error("PyPDF2 not installed")
            return {'success': False, 'error': 'PyPDF2 not installed'}
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def _extract_google_doc(self, file_path: str, drive_service) -> Dict:
        """Extract content from Google Docs via Drive API."""
        try:
            # For Google Docs, we need to export via Drive API
            # file_path is actually the document ID
            doc_id = file_path
            
            # Export as plain text
            response = drive_service.files().export(
                fileId=doc_id,
                mimeType='text/plain'
            ).execute()
            
            content = response.decode('utf-8')
            
            return {
                'content': content,
                'content_type': 'google_doc',
                'success': True
            }
        except Exception as e:
            logger.error(f"Google Doc extraction failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def _extract_word(self, file_path: str, drive_service=None) -> Dict:
        """Extract content from Word documents."""
        try:
            import docx
            
            doc = docx.Document(file_path)
            content = ""
            for paragraph in doc.paragraphs:
                content += paragraph.text + "\n"
            
            return {
                'content': content,
                'content_type': 'word',
                'success': True
            }
        except ImportError:
            logger.error("python-docx not installed")
            return {'success': False, 'error': 'python-docx not installed'}
        except Exception as e:
            logger.error(f"Word extraction failed: {e}")
            return {'success': False, 'error': str(e)}
