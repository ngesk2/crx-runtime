"""
Unicode Normalization Module

Owns the Unicode normalization invariant:
- All strings are normalized to NFC
- Control characters (except tab, newline, carriage return) are rejected
- Bidi control characters are rejected
"""

import unicodedata


class UnicodeNormalizationError(Exception):
    """Unicode normalization error."""
    pass


def normalize_string(data: str) -> str:
    """
    Normalize string with Unicode normalization (NFC) and control character rejection.
    
    Invariant: All strings in the constitutional runtime must pass through this normalization.
    """
    # Unicode normalization (NFC)
    normalized = unicodedata.normalize('NFC', data)
    
    # Reject control characters (except tab, newline, carriage return)
    for char in normalized:
        if unicodedata.category(char) == 'Cc' and char not in '\t\n\r':
            raise UnicodeNormalizationError(f"Control character rejected: {repr(char)}")
    
    # Reject bidi control characters
    for char in normalized:
        if unicodedata.category(char) == 'Cf':
            raise UnicodeNormalizationError(f"Format character rejected: {repr(char)}")
    
    return normalized
