from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from scripts.knowledge_event_bus import emit_knowledge_event

ROOT = Path(__file__).resolve().parents[1]


def _read_yaml(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        import yaml
    except ModuleNotFoundError:
        return {}
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def _load_intent_manifests() -> List[Dict[str, Any]]:
    manifests: List[Dict[str, Any]] = []
    intent_dir = ROOT / "intent"
    if not intent_dir.exists():
        return manifests
    for manifest_path in sorted(intent_dir.glob("*.intent.yaml")):
        data = _read_yaml(manifest_path)
        if not data:
            continue
        manifests.append({"path": manifest_path, **data})
    return manifests


def _load_registry_data() -> Dict[str, Any]:
    intent_map = _read_yaml(ROOT / "intent-map.yaml")
    authority_registry = _read_yaml(ROOT / "authorities" / "registry.yaml")
    capability_registry = _read_yaml(ROOT / "capabilities" / "registry.yaml")
    knowledge_graph = _read_yaml(ROOT / "knowledge" / "knowledge-graph.json")
    intent_manifests = _load_intent_manifests()
    return {
        "intent_map": intent_map,
        "authority_registry": authority_registry,
        "capability_registry": capability_registry,
        "knowledge_graph": knowledge_graph,
        "intent_manifests": intent_manifests,
    }


def _normalize_intent_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _collect_intent_entries(intent_map: Dict[str, Any], manifests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if manifests:
        entries: List[Dict[str, Any]] = []
        seen_ids: set[str] = set()
        for manifest in manifests:
            name = manifest.get("intent")
            if not name:
                continue
            entry_id = f"intent:{_normalize_intent_name(name)}"
            if entry_id in seen_ids:
                continue
            seen_ids.add(entry_id)
            entries.append(
                {
                    "id": entry_id,
                    "name": name,
                    "authority": manifest.get("owner"),
                    "implementation": manifest.get("implements") or [],
                    "specifications": [manifest.get("spec", "")],
                    "capabilities": manifest.get("produces") or [],
                    "evidence": manifest.get("proofs") or [],
                    "status": "implemented",
                }
            )
        return entries

    entries: List[Dict[str, Any]] = []
    for name, data in intent_map.items():
        if not isinstance(data, dict):
            continue
        entries.append(
            {
                "id": f"intent:{_normalize_intent_name(name)}",
                "name": name,
                "authority": data.get("Authority") or data.get("authority"),
                "implementation": data.get("Implementation") or data.get("implementation"),
                "specifications": data.get("Specifications") or data.get("specifications") or [],
                "capabilities": data.get("Capabilities") or data.get("capabilities") or [],
                "evidence": data.get("Evidence") or data.get("evidence"),
                "status": data.get("Status") or data.get("status"),
            }
        )
    return entries


def _collect_authority_entries(authority_registry: Dict[str, Any]) -> List[Dict[str, Any]]:
    authorities = authority_registry.get("authorities", {}) if isinstance(authority_registry, dict) else {}
    entries: List[Dict[str, Any]] = []
    for name, data in authorities.items():
        if not isinstance(data, dict):
            continue
        entries.append(
            {
                "id": f"authority:{name}",
                "name": name,
                "intent": data.get("intent"),
                "owner": data.get("owner"),
                "status": data.get("status"),
                "capabilities": data.get("capabilities") or [],
                "specifications": data.get("specifications") or [],
            }
        )
    return entries


def _collect_capability_entries(capability_registry: Dict[str, Any]) -> List[Dict[str, Any]]:
    capabilities = capability_registry.get("capabilities", {}) if isinstance(capability_registry, dict) else {}
    entries: List[Dict[str, Any]] = []
    for name, data in capabilities.items():
        if not isinstance(data, dict):
            continue
        entries.append(
            {
                "id": f"capability:{name}",
                "name": name,
                "intent": data.get("intent"),
                "authority": data.get("authority"),
                "status": data.get("status"),
                "owner": data.get("owner"),
            }
        )
    return entries


def _collect_spec_entries(intent_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    seen: set[str] = set()
    for intent in intent_entries:
        for spec in intent.get("specifications", []) or []:
            spec_id = f"spec:{spec.split('/')[-1]}"
            if spec_id in seen:
                continue
            seen.add(spec_id)
            entries.append({"id": spec_id, "name": spec, "intent": intent["name"]})
    return entries


def _collect_provider_entries(intent_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    seen: set[str] = set()
    for intent in intent_entries:
        for provider in intent.get("implementation", []) or []:
            if isinstance(provider, str):
                provider_name = provider.split("/")[-1]
            else:
                provider_name = str(provider)
            provider_id = f"provider:{provider_name}"
            if provider_id in seen:
                continue
            seen.add(provider_id)
            entries.append({"id": provider_id, "name": provider_name, "type": "Provider"})
    return entries


def _collect_implementation_entries(intent_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    seen: set[str] = set()
    for intent in intent_entries:
        implementations = intent.get("implementation", []) or []
        if isinstance(implementations, str):
            implementations = [implementations]
        for implementation in implementations:
            impl_id = f"implementation:{implementation}"
            if impl_id in seen:
                continue
            seen.add(impl_id)
            entries.append({"id": impl_id, "name": implementation, "type": "Implementation"})
    return entries


def _collect_proof_entries(intent_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    seen: set[str] = set()
    for intent in intent_entries:
        proofs = intent.get("evidence", []) or []
        if isinstance(proofs, str):
            proofs = [proofs]
        for proof in proofs:
            proof_id = f"proof:{proof}"
            if proof_id in seen:
                continue
            seen.add(proof_id)
            entries.append({"id": proof_id, "name": proof, "type": "Proof"})
    return entries


def _collect_evidence_entries(intent_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    seen: set[str] = set()
    for intent in intent_entries:
        evidence_items = intent.get("evidence", []) or []
        if isinstance(evidence_items, str):
            evidence_items = [evidence_items]
        for evidence in evidence_items:
            evidence_id = f"evidence:{evidence}"
            if evidence_id in seen:
                continue
            seen.add(evidence_id)
            entries.append({"id": evidence_id, "name": evidence, "type": "Evidence"})
    return entries


def _collect_mission_entries(intent_entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    for intent in intent_entries:
        mission_id = f"mission:{_normalize_intent_name(intent['name'])}"
        entries.append({"id": mission_id, "name": intent["name"], "type": "Mission"})
    return entries


def _build_graph(data: Dict[str, Any]) -> Dict[str, Any]:
    intent_entries = _collect_intent_entries(data["intent_map"], data.get("intent_manifests", []))
    authority_entries = _collect_authority_entries(data["authority_registry"])
    capability_entries = _collect_capability_entries(data["capability_registry"])
    spec_entries = _collect_spec_entries(intent_entries)
    provider_entries = _collect_provider_entries(intent_entries)
    implementation_entries = _collect_implementation_entries(intent_entries)
    proof_entries = _collect_proof_entries(intent_entries)
    evidence_entries = _collect_evidence_entries(intent_entries)
    mission_entries = _collect_mission_entries(intent_entries)

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

    for entry in intent_entries:
        nodes.append({"id": entry["id"], "type": "Intent", "label": entry["name"]})
    for entry in authority_entries:
        nodes.append({"id": entry["id"], "type": "Authority", "label": entry["name"]})
    for entry in capability_entries:
        nodes.append({"id": entry["id"], "type": "Capability", "label": entry["name"]})
    for entry in spec_entries:
        nodes.append({"id": entry["id"], "type": "Specification", "label": entry["name"]})
    for entry in provider_entries:
        nodes.append({"id": entry["id"], "type": "Provider", "label": entry["name"]})
    for entry in implementation_entries:
        nodes.append({"id": entry["id"], "type": "Implementation", "label": entry["name"]})
    for entry in proof_entries:
        nodes.append({"id": entry["id"], "type": "Proof", "label": entry["name"]})
    for entry in evidence_entries:
        nodes.append({"id": entry["id"], "type": "Evidence", "label": entry["name"]})
    for entry in mission_entries:
        nodes.append({"id": entry["id"], "type": "Mission", "label": entry["name"]})

    for intent in intent_entries:
        if intent.get("authority"):
            edges.append({"source": intent["id"], "target": f"authority:{intent['authority']}", "type": "governed_by"})
        for capability in intent.get("capabilities", []) or []:
            edges.append({"source": intent["id"], "target": f"capability:{capability}", "type": "exposes"})
        for spec in intent.get("specifications", []) or []:
            edges.append({"source": intent["id"], "target": f"spec:{spec.split('/')[-1]}", "type": "specified_by"})
        if intent.get("implementation"):
            implementations = intent.get("implementation") if isinstance(intent.get("implementation"), list) else [intent.get("implementation")]
            for implementation in implementations:
                edges.append({"source": intent["id"], "target": f"implementation:{implementation}", "type": "implements"})
        for proof in intent.get("evidence", []) or []:
            edges.append({"source": intent["id"], "target": f"proof:{proof}", "type": "produces"})
        for evidence in intent.get("evidence", []) or []:
            edges.append({"source": intent["id"], "target": f"evidence:{evidence}", "type": "evidences"})
        mission_id = f"mission:{_normalize_intent_name(intent['name'])}"
        edges.append({"source": intent["id"], "target": mission_id, "type": "has_mission"})

    for entry in implementation_entries:
        impl_name = entry["name"]
        target_spec = None
        for intent in intent_entries:
            if impl_name in (intent.get("implementation") if isinstance(intent.get("implementation"), list) else [intent.get("implementation")]):
                specs = intent.get("specifications", []) or []
                if specs:
                    target_spec = specs[0]
                    break
        if target_spec:
            edges.append({"source": entry["id"], "target": f"spec:{target_spec.split('/')[-1]}", "type": "targets_spec"})

    return {"nodes": nodes, "edges": edges}


def generate_indexes(output_root: Optional[Path] = None) -> Dict[str, Any]:
    output_root = Path(output_root or ROOT)
    data = _load_registry_data()
    graph = _build_graph(data)
    knowledge_dir = output_root / "knowledge"
    knowledge_dir.mkdir(parents=True, exist_ok=True)

    indexes = {
        "authority-index.json": _build_index(graph, "Authority"),
        "intent-index.json": _build_index(graph, "Intent"),
        "provider-index.json": _build_index(graph, "Provider"),
        "implementation-index.json": _build_index(graph, "Implementation"),
        "spec-index.json": _build_index(graph, "Specification"),
        "proof-index.json": _build_index(graph, "Proof"),
        "dependency-index.json": _build_dependencies(graph),
        "mission-index.json": _build_index(graph, "Mission"),
    }

    for filename, payload in indexes.items():
        (knowledge_dir / filename).write_text(json.dumps(payload, indent=2), encoding="utf-8")

    graph_payload = {"version": "1.0.0", "generated": "2026-06-27", "nodes": graph["nodes"], "edges": graph["edges"]}
    (knowledge_dir / "knowledge-graph.json").write_text(json.dumps(graph_payload, indent=2), encoding="utf-8")

    summary = {
        "intent_count": len([n for n in graph["nodes"] if n["type"] == "Intent"]),
        "authority_count": len([n for n in graph["nodes"] if n["type"] == "Authority"]),
        "capability_count": len([n for n in graph["nodes"] if n["type"] == "Capability"]),
        "spec_count": len([n for n in graph["nodes"] if n["type"] == "Specification"]),
    }

    emit_knowledge_event(
        "GRAPH_UPDATED",
        mission="intent-graph-refresh",
        authority="ConfigurationAuthority",
        provider="intent-graph-builder",
        capability="graph-generation",
        evidence={"index_files": sorted(indexes.keys())},
        proof={"proof_type": "graph-indexes", "summary": summary},
        workflow="intent-graph",
    )

    return {
        "graph": graph_payload,
        "indexes": indexes,
        "summary": summary,
    }


def _build_index(graph: Dict[str, Any], node_type: str) -> List[Dict[str, Any]]:
    return [node for node in graph["nodes"] if node["type"] == node_type]


def _build_dependencies(graph: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [edge for edge in graph["edges"] if edge["type"] in {"governed_by", "specified_by", "implements", "exposes"}]


def query_graph(graph: Dict[str, Any], node_type: str, name: str) -> Optional[Dict[str, Any]]:
    target = f"{node_type.lower()}:{name}" if not name.startswith("intent:") and not name.startswith("authority:") else name
    for node in graph.get("nodes", []):
        if node.get("id") == target:
            return node
    return None


if __name__ == "__main__":
    result = generate_indexes()
    print(json.dumps(result["summary"], indent=2))
