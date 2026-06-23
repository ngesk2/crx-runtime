"""
Qdrant Collection Setup
PING CONSTITUTIONAL STABILIZATION PHASE D
Date: 2026-06-22

This script sets up the constitutional_memory collection in Qdrant.
"""

import os
import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Qdrant configuration
QDRANT_URL = os.getenv('QDRANT_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
QDRANT_COLLECTION = os.getenv('QDRANT_COLLECTION', 'constitutional_memory')


def setup_qdrant_collection():
    """
    Set up Qdrant collection with correct configuration.
    Collection: constitutional_memory
    Size: 768
    Distance: COSINE
    """
    if not QDRANT_URL:
        logger.error("QDRANT_URL environment variable not set")
        return False
    
    if not QDRANT_API_KEY:
        logger.error("QDRANT_API_KEY environment variable not set")
        return False
    
    try:
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY
        )
        
        # Check if collection exists
        collections = client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if QDRANT_COLLECTION in collection_names:
            logger.info(f"Collection {QDRANT_COLLECTION} already exists")
            
            # Verify configuration
            collection_info = client.get_collection(QDRANT_COLLECTION)
            vector_config = collection_info.config.params.vectors
            
            logger.info(f"Current vector size: {vector_config.size}")
            logger.info(f"Current distance: {vector_config.distance}")
            
            if vector_config.size != 768:
                logger.error(f"ERROR: Collection has wrong vector size: {vector_config.size} (expected 768)")
                logger.error("Collection must be recreated with correct configuration")
                return False
            
            if vector_config.distance != Distance.COSINE:
                logger.error(f"ERROR: Collection has wrong distance metric: {vector_config.distance} (expected COSINE)")
                logger.error("Collection must be recreated with correct configuration")
                return False
            
            logger.info("Collection configuration is correct")
            return True
        
        # Create collection
        logger.info(f"Creating collection {QDRANT_COLLECTION}")
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=768,
                distance=Distance.COSINE
            )
        )
        
        logger.info(f"Successfully created collection {QDRANT_COLLECTION}")
        logger.info(f"Vector size: 768")
        logger.info(f"Distance: COSINE")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to set up Qdrant collection: {e}")
        return False


def main():
    """Main setup function."""
    logger.info("Starting Qdrant collection setup")
    logger.info(f"QDRANT_URL: {QDRANT_URL}")
    logger.info(f"QDRANT_COLLECTION: {QDRANT_COLLECTION}")
    
    success = setup_qdrant_collection()
    
    if success:
        logger.info("Qdrant collection setup completed successfully")
        return 0
    else:
        logger.error("Qdrant collection setup failed")
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
