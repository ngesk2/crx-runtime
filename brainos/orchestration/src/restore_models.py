"""
Restore Preferred Models
PING Constitutional Stabilization Phase E
Date: 2026-06-22

Audits available models and pulls missing preferred models.
"""

import os
import requests
import logging
from typing import List, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Preferred models in priority order
PREFERRED_MODELS = [
    'qwen3:14b',           # Primary 14B model
    'qwen2.5-coder:14b',   # Fallback 14B model
    'llama3:70b',          # High-performance 70B
    'llama3:8b',           # Fast 8B
    'mistral-nemo',        # Nemo model
    'nomic-embed-text',    # Embedding model (required)
]


def get_available_models() -> List[str]:
    """Get list of available models from provider through authority."""
    try:
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'runtime', 'adapters'))
        from inference_adapter import get_inference_adapter
        inference_adapter = get_inference_adapter()
        
        models = inference_adapter.list_models()
        if models:
            model_names = [m['name'] for m in models]
            logger.info(f"Available models: {model_names}")
            return model_names
        else:
            logger.error("Failed to get models")
            return []
    except Exception as e:
        logger.error(f"Failed to connect to provider: {e}")
        return []


def pull_model(model: str) -> bool:
    """Pull a model from provider registry through authority."""
    logger.info(f"Pulling model: {model}")
    try:
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'runtime', 'adapters'))
        from inference_adapter import get_inference_adapter
        inference_adapter = get_inference_adapter()
        
        return inference_adapter.pull_model(model)
    except Exception as e:
        logger.error(f"Failed to pull model: {e}")
        return False


def audit_and_restore():
    """Audit available models and restore missing ones."""
    available = get_available_models()
    missing = [m for m in PREFERRED_MODELS if m not in available]
    
    print("\n=== Model Audit ===")
    print(f"Available models: {len(available)}")
    print(f"Missing preferred models: {len(missing)}")
    
    if missing:
        print(f"\nMissing models: {missing}")
        print("\nPulling missing models...")
        
        for model in missing:
            success = pull_model(model)
            if success:
                print(f"✓ {model}")
            else:
                print(f"✗ {model}")
    else:
        print("\nAll preferred models are available!")
    
    # Determine primary model
    available = get_available_models()
    primary = None
    
    for model in PREFERRED_MODELS:
        if model in available:
            primary = model
            break
    
    if primary:
        print(f"\n=== Primary Model ===")
        print(f"PING_PRIMARY_MODEL={primary}")
        print(f"\nSet this in your environment:")
        print(f"export PING_PRIMARY_MODEL={primary}")
    else:
        print("\nERROR: No preferred models available!")
        return False
    
    return True


if __name__ == "__main__":
    success = audit_and_restore()
    exit(0 if success else 1)
