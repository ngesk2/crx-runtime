"""
Context Pack Builder — Rule 2

Context Pack becomes mandatory. Every answer must originate from a Context Pack.

Required structure:
{
  "question": "",
  "highest_authority": {},
  "authority_chain": [],
  "lineage": [],
  "supporting_documents": [],
  "supporting_claims": [],
  "contradictions": [],
  "citations": [],
  "witness_roots": [],
  "confidence": 0.0
}
"""
import json
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime

from .models import ContextPack, AuthorityResolution, AuthorityClass, AUTHORITY_HIERARCHY, ContextPackViolation, ProjectionSovereigntyViolation
from .worker_protocol import WorkerProtocol
from .projection_sovereignty import ProjectionSovereignty


class ContextPackBuilder:
    """
    Assembles a Context Pack from worker outputs.
    Validates that all required fields are present.
    """

    def __init__(self):
        self.protocol = WorkerProtocol()

    def build_from_findings(
        self,
        question: str,
        authority_findings: Optional[List[Dict[str, Any]]] = None,
        lineage_findings: Optional[List[Dict[str, Any]]] = None,
        graph_findings: Optional[List[Dict[str, Any]]] = None,
        contradiction_findings: Optional[List[Dict[str, Any]]] = None,
        repository_findings: Optional[List[Dict[str, Any]]] = None
    ) -> ContextPack:
        pack = ContextPack(question=question)
        if authority_findings:
            self._resolve_authority(pack, authority_findings)
        if lineage_findings:
            self._resolve_lineage(pack, lineage_findings)
        if graph_findings:
            self._resolve_graph(pack, graph_findings)
        if contradiction_findings:
            self._resolve_contradictions(pack, contradiction_findings)
        if repository_findings:
            self._resolve_repository(pack, repository_findings)
        pack.confidence = self._compute_confidence(pack)
        return pack

    def _resolve_authority(self, pack: ContextPack, findings: List[Dict[str, Any]]):
        for f in findings:
            data = f.get('data', f)
            if isinstance(data, dict):
                highest = data.get('highest_authority', {})
                if highest:
                    pack.highest_authority = highest
                    pack.authority_chain = data.get('authority_chain', [])
                    auth_class = highest.get('authority_class') or data.get('authority_class')
                    pack.authority_resolution = AuthorityResolution(
                        highest_authority=highest,
                        authority_class=auth_class,
                        authority_chain=pack.authority_chain,
                        supersession_chain=data.get('supersession_chain', []),
                        verification=data.get('verification', {})
                    )

    def _resolve_lineage(self, pack: ContextPack, findings: List[Dict[str, Any]]):
        for f in findings:
            data = f.get('data', f)
            if isinstance(data, dict):
                events = data.get('events', [])
                projections = data.get('projections', [])
                for ev in events:
                    pack.supporting_documents.append(ev)
                for pr in projections:
                    proj_hash = pr.get('payload_hash') or pr.get('projection_hash')
                    verified, _ = ProjectionSovereignty.verify_projection(proj_hash, None, pr, None)
                    if verified:
                        pack.supporting_documents.append(pr)
                    else:
                        pack.supporting_documents.append({**pr, '_projection_verified': False, '_ignored': True})
                pack.lineage = data.get('authorities', [])
                pack.witness_roots = data.get('witness_roots', [])
                artifact = data.get('artifact')
                if artifact:
                    pack.supporting_documents.append(artifact)

    def _resolve_graph(self, pack: ContextPack, findings: List[Dict[str, Any]]):
        for f in findings:
            data = f.get('data', f)
            if isinstance(data, dict):
                pack.graph_expansion = {
                    'nodes': data.get('nodes', []),
                    'edges': data.get('edges', [])
                }

    def _resolve_contradictions(self, pack: ContextPack, findings: List[Dict[str, Any]]):
        for f in findings:
            data = f.get('data', f)
            if isinstance(data, dict):
                conflicts = data.get('contradictions', []) or data.get('conflicts', [])
                if isinstance(conflicts, list):
                    pack.contradictions.extend(conflicts)
                elif isinstance(conflicts, dict):
                    pack.contradictions.append(conflicts)
                stances = data.get('stances', [])
                if isinstance(stances, list):
                    for s in stances:
                        if s not in pack.contradictions:
                            pack.contradictions.append(s)

    def _resolve_repository(self, pack: ContextPack, findings: List[Dict[str, Any]]):
        for f in findings:
            data = f.get('data', f)
            if isinstance(data, dict):
                syms = data.get('definitions', data.get('repository_symbols', []))
                if isinstance(syms, list):
                    pack.repository_symbols.extend(syms)
                rels = data.get('repository_relationships', data)
                if isinstance(rels, dict):
                    pack.repository_relationships = rels

    def _compute_confidence(self, pack: ContextPack) -> float:
        checks = 0
        passed = 0
        if pack.highest_authority:
            passed += 1
        checks += 1
        if pack.authority_chain:
            passed += 1
        checks += 1
        if pack.supporting_documents:
            passed += 1
        checks += 1
        if pack.lineage:
            passed += 1
        checks += 1
        if pack.authority_resolution and pack.authority_resolution.verification.get('overall'):
            passed += 1
        checks += 1
        if pack.witness_roots:
            passed += 1
        checks += 1
        return round(passed / max(checks, 1), 4)

    def validate(self, pack: ContextPack, enforce: bool = False) -> List[str]:
        violations = []
        if not pack.question:
            violations.append("missing question")

        has_authority = bool(pack.highest_authority or pack.authority_chain)
        if not has_authority:
            violations.append("missing authority resolution")

        # Check if authority comes from a fallback source (e.g. Qdrant retrieval)
        highest = pack.highest_authority or {}
        is_fallback = highest.get('_source') == 'qdrant_fallback' or any(
            a.get('_source') == 'qdrant_fallback' for a in (pack.authority_chain or [])
        )

        has_evidence = bool(pack.supporting_documents or pack.repository_symbols)
        if not has_evidence and not is_fallback:
            violations.append("no supporting evidence found")

        if enforce and violations:
            raise ContextPackViolation(violations)
        return violations

    def validate_or_raise(self, pack: ContextPack):
        self.validate(pack, enforce=True)
