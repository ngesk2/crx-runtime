"""
Context Pack Cache — Rule 8

Store context packs with 24-hour TTL.
Keyed by query_hash + authority_root.
"""
import json
import os
import hashlib
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from .models import ContextPack


CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'context_pack_cache')
CACHE_TTL_SECONDS = 86400  # 24 hours


class ContextPackCache:
    """
    Cache for Context Packs with 24-hour TTL.
    Uses query_hash as primary key with authority_root for collision resolution.
    """

    def __init__(self, cache_dir: str = CACHE_DIR, ttl: int = CACHE_TTL_SECONDS):
        self.cache_dir = cache_dir
        self.ttl = ttl
        os.makedirs(cache_dir, exist_ok=True)

    def _cache_path(self, query_hash: str) -> str:
        return os.path.join(self.cache_dir, f"{query_hash}.json")

    def get(self, question: str, authority_root: Optional[str] = None) -> Optional[ContextPack]:
        query_hash = hashlib.sha256(question.encode('utf-8')).hexdigest()[:16]
        path = self._cache_path(query_hash)
        if not os.path.exists(path):
            return None
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            cached_at = data.get('_cached_at', 0)
            if time.time() - cached_at > self.ttl:
                os.remove(path)
                return None
            if authority_root and data.get('authority_root') != authority_root:
                return None
            pack = ContextPack(**{k: v for k, v in data.items() if not k.startswith('_')})
            return pack
        except Exception:
            return None

    def set(self, pack: ContextPack):
        query_hash = pack.query_hash()
        data = pack.to_dict()
        data['_cached_at'] = time.time()
        data['_query_hash'] = query_hash
        auth_root = None
        if pack.highest_authority:
            auth_root = pack.highest_authority.get('artifact_id') or pack.highest_authority.get('id')
        data['authority_root'] = auth_root
        path = self._cache_path(query_hash)
        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass

    def invalidate(self, question: str):
        query_hash = hashlib.sha256(question.encode('utf-8')).hexdigest()[:16]
        path = self._cache_path(query_hash)
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

    def clear_expired(self):
        now = time.time()
        for fname in os.listdir(self.cache_dir):
            if fname.endswith('.json'):
                path = os.path.join(self.cache_dir, fname)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    if now - data.get('_cached_at', 0) > self.ttl:
                        os.remove(path)
                except Exception:
                    try:
                        os.remove(path)
                    except Exception:
                        pass

    def stats(self) -> Dict[str, Any]:
        total = 0
        expired = 0
        now = time.time()
        for fname in os.listdir(self.cache_dir):
            if fname.endswith('.json'):
                total += 1
                path = os.path.join(self.cache_dir, fname)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    if now - data.get('_cached_at', 0) > self.ttl:
                        expired += 1
                except Exception:
                    expired += 1
        return {'total_entries': total, 'expired_entries': expired, 'cache_dir': self.cache_dir, 'ttl_hours': 24}
