"""
Utility to classify existing skills from the registry.

Loads existing skills and classifies them as Pure Transformations or Effect Nodes.
"""

from typing import List, Dict, Any
from runtime.skills.skill_registry import SkillDefinition, get_skill_registry
from runtime.skills.skill_classification import (
    SkillClassifier, SkillCategory, PureTransform, EffectNode,
    get_skill_classifier, get_classified_skill_registry
)


def classify_all_registered_skills() -> Dict[str, Any]:
    """
    Classify all registered skills.
    
    Returns:
        Classification results
    """
    skill_registry = get_skill_registry()
    classifier = get_skill_classifier()
    classified_registry = get_classified_skill_registry()
    
    results = {
        "total_skills": 0,
        "pure_transforms": 0,
        "effect_nodes": 0,
        "classifications": []
    }
    
    # Get all skills from registry
    all_skills = skill_registry._skills.values()
    results["total_skills"] = len(all_skills)
    
    for skill in all_skills:
        category, classified = classifier.classify_skill(skill)
        
        classification_result = {
            "skill_id": skill.skill_id,
            "skill_name": skill.skill_name,
            "category": category.value,
            "determinism": skill.determinism.value,
            "capabilities": skill.capabilities_required,
            "produces": skill.produces,
            "consumes": skill.consumes
        }
        
        if category == SkillCategory.PURE_TRANSFORM:
            results["pure_transforms"] += 1
            classification_result["transform_type"] = classified.transform_type.value if isinstance(classified, PureTransform) else "unknown"
        else:
            results["effect_nodes"] += 1
            classification_result["effect_type"] = classified.effect_type.value if isinstance(classified, EffectNode) else "unknown"
        
        results["classifications"].append(classification_result)
    
    return results


def print_classification_report(results: Dict[str, Any]) -> None:
    """Print classification report."""
    print("=" * 80)
    print("Skill Classification Report")
    print("=" * 80)
    print(f"Total Skills: {results['total_skills']}")
    print(f"Pure Transforms: {results['pure_transforms']}")
    print(f"Effect Nodes: {results['effect_nodes']}")
    print()
    
    print("Pure Transformations:")
    print("-" * 80)
    for classification in results["classifications"]:
        if classification["category"] == "pure_transform":
            print(f"  - {classification['skill_name']} ({classification['skill_id']})")
            print(f"    Type: {classification['transform_type']}")
            print(f"    Determinism: {classification['determinism']}")
            print()
    
    print("Effect Nodes:")
    print("-" * 80)
    for classification in results["classifications"]:
        if classification["category"] == "effect_node":
            print(f"  - {classification['skill_name']} ({classification['skill_id']})")
            print(f"    Type: {classification['effect_type']}")
            print(f"    Determinism: {classification['determinism']}")
            print(f"    Capabilities: {', '.join(classification['capabilities'])}")
            print()


def create_sample_skills_for_classification() -> None:
    """Create sample skills for classification demonstration."""
    from runtime.skills.skill_registry import SkillDefinition, SkillInput, SkillOutput, FailureMode, Determinism, SkillBuilder
    
    skill_registry = get_skill_registry()
    
    # Sample pure transforms
    normalization_skill = SkillBuilder() \
        .with_id("normalize_data") \
        .with_name("Data Normalization") \
        .with_description("Normalizes data to standard format") \
        .with_category("normalization") \
        .with_input("input_data", "object", "Input data to normalize") \
        .with_output("normalized_data", "object", "Normalized data") \
        .with_determinism(Determinism.DETERMINISTIC) \
        .with_cost(100, 1) \
        .build()
    
    schema_transform_skill = SkillBuilder() \
        .with_id("transform_schema") \
        .with_name("Schema Transformation") \
        .with_description("Transforms data schema") \
        .with_category("schema") \
        .with_input("old_schema", "object", "Old schema") \
        .with_output("new_schema", "object", "New schema") \
        .with_determinism(Determinism.DETERMINISTIC) \
        .with_cost(50, 1) \
        .build()
    
    # Sample effect nodes
    filesystem_skill = SkillBuilder() \
        .with_id("write_file") \
        .with_name("Write File") \
        .with_description("Writes data to filesystem") \
        .with_category("filesystem") \
        .with_capability("filesystem.write") \
        .with_input("file_path", "string", "File path") \
        .with_input("content", "string", "File content") \
        .with_output("success", "boolean", "Write success") \
        .with_produces("file") \
        .with_determinism(Determinism.DETERMINISTIC) \
        .with_cost(10, 1) \
        .build()
    
    llm_skill = SkillBuilder() \
        .with_id("llm_generate") \
        .with_name("LLM Generation") \
        .with_description("Generates text using LLM") \
        .with_category("llm") \
        .with_capability("llm.inference") \
        .with_input("prompt", "string", "Input prompt") \
        .with_output("text", "string", "Generated text") \
        .with_determinism(Determinism.PROBABILISTIC) \
        .with_cost(1000, 10) \
        .build()
    
    network_skill = SkillBuilder() \
        .with_id("http_request") \
        .with_name("HTTP Request") \
        .with_description("Makes HTTP request") \
        .with_category("network") \
        .with_capability("network.request") \
        .with_input("url", "string", "URL to request") \
        .with_output("response", "object", "HTTP response") \
        .with_determinism(Determinism.PROBABILISTIC) \
        .with_cost(50, 5) \
        .build()
    
    # Register skills
    skill_registry.register(normalization_skill)
    skill_registry.register(schema_transform_skill)
    skill_registry.register(filesystem_skill)
    skill_registry.register(llm_skill)
    skill_registry.register(network_skill)
    
    print("Created 5 sample skills for classification demonstration")


if __name__ == "__main__":
    # Create sample skills
    create_sample_skills_for_classification()
    
    # Classify all skills
    results = classify_all_registered_skills()
    
    # Print report
    print_classification_report(results)
