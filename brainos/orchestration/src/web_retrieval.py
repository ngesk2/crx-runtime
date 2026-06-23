"""
Web Retrieval Tools
PING Constitutional Stabilization Phase E
Date: 2026-06-22

Pipeline: Search → Fetch → Summarize → Emit Observation Event
"""

import os
import logging
import requests
import psycopg2
from psycopg2 import sql
from datetime import datetime
from typing import Dict, List, Optional
import hashlib
import json
from urllib.parse import urljoin, urlparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# PostgreSQL configuration
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')

# Ollama configuration


class WebRetrieval:
    """Web retrieval with observation event emission."""
    
    def __init__(self):
        self.postgres_conn = self._get_postgres_connection()
    
    def _get_postgres_connection(self):
        """Get PostgreSQL connection."""
        try:
            conn = psycopg2.connect(
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                database=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD
            )
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            return None
    
    def _emit_observation_event(self, event_type: str, payload: Dict):
        """Emit observation event to PostgreSQL."""
        if not self.postgres_conn:
            logger.error("PostgreSQL connection not available")
            return False
        
        try:
            cursor = self.postgres_conn.cursor()
            
            # Generate payload hash
            payload_json = json.dumps(payload, sort_keys=True)
            payload_hash = hashlib.sha256(payload_json.encode()).hexdigest()
            
            # Insert event
            insert_query = sql.SQL("""
                INSERT INTO events (stream, event_type, payload, created_at, payload_hash, projected_to_qdrant)
                VALUES (%s, %s, %s, %s, %s, %s)
            """)
            
            cursor.execute(insert_query, (
                'web_retrieval',
                event_type,
                json.dumps(payload),
                datetime.utcnow(),
                payload_hash,
                False
            ))
            
            self.postgres_conn.commit()
            logger.info(f"Emitted observation event: {event_type}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to emit observation event: {e}")
            if self.postgres_conn:
                self.postgres_conn.rollback()
            return False
    
    def search(self, query: str, num_results: int = 5) -> List[Dict]:
        """
        Search the web for information.
        Returns list of search results with URLs and snippets.
        """
        # For now, use a simple search API or mock
        # In production, integrate with Tavily, SerpAPI, or Brave Search
        
        logger.info(f"Searching for: {query}")
        
        # Mock search results for now
        # TODO: Integrate with real search API
        mock_results = [
            {
                "url": f"https://example.com/result/{i}",
                "title": f"Search Result {i} for {query}",
                "snippet": f"This is a mock search result for query: {query}"
            }
            for i in range(num_results)
        ]
        
        # Emit search event
        self._emit_observation_event('SEARCH_PERFORMED', {
            'query': query,
            'num_results': len(mock_results),
            'results': mock_results
        })
        
        return mock_results
    
    def fetch(self, url: str) -> Optional[str]:
        """
        Fetch content from a URL.
        Returns the text content of the page.
        """
        try:
            logger.info(f"Fetching: {url}")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            content = response.text
            
            # Emit fetch event
            self._emit_observation_event('PAGE_FETCHED', {
                'url': url,
                'status_code': response.status_code,
                'content_length': len(content)
            })
            
            return content
            
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
            self._emit_observation_event('FETCH_FAILED', {
                'url': url,
                'error': str(e)
            })
            return None
    
    def summarize(self, content: str, max_length: int = 500) -> Optional[str]:
        """
        Summarize content using Ollama.
        Returns a concise summary.
        """
        try:
            logger.info("Summarizing content")
            
            prompt = f"""
            Summarize the following content in {max_length} characters or less:
            
            {content[:5000]}
            
            Summary:
            """
            
            # Use inference authority
            import sys
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'runtime', 'adapters'))
            from inference_adapter import get_inference_adapter
            inference_adapter = get_inference_adapter()
            response = inference_adapter.chat([{"role": "user", "content": prompt}])
            
            if response:
                summary = response.get('message', {}).get('content', '').strip()
                
                # Emit summary event
                self._emit_observation_event('CONTENT_SUMMARIZED', {
                    'original_length': len(content),
                    'summary_length': len(summary),
                    'summary': summary
                })
                
                return summary
            else:
                logger.error(f"Summarization failed: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to summarize: {e}")
            return None
    
    def retrieve_and_summarize(self, query: str, num_results: int = 3) -> List[Dict]:
        """
        Complete pipeline: Search → Fetch → Summarize → Emit Observation
        """
        logger.info(f"Starting retrieval pipeline for: {query}")
        
        # Search
        search_results = self.search(query, num_results)
        
        results = []
        for result in search_results:
            url = result['url']
            
            # Fetch
            content = self.fetch(url)
            if not content:
                continue
            
            # Summarize
            summary = self.summarize(content)
            if not summary:
                summary = content[:500]  # Fallback to truncation
            
            results.append({
                'url': url,
                'title': result['title'],
                'summary': summary,
                'retrieved_at': datetime.utcnow().isoformat()
            })
        
        # Emit pipeline completion event
        self._emit_observation_event('RETRIEVAL_PIPELINE_COMPLETE', {
            'query': query,
            'num_results': len(results),
            'results': results
        })
        
        logger.info(f"Retrieval pipeline complete: {len(results)} results")
        return results
    
    def close(self):
        """Close connections."""
        if self.postgres_conn:
            self.postgres_conn.close()


if __name__ == "__main__":
    # Test web retrieval
    retrieval = WebRetrieval()
    
    print("=== Web Retrieval Test ===")
    
    # Test search
    results = retrieval.search("constitutional law", num_results=3)
    print(f"\nSearch results: {len(results)}")
    for result in results:
        print(f"  - {result['title']}")
    
    # Test fetch
    if results:
        content = retrieval.fetch(results[0]['url'])
        if content:
            print(f"\nFetched content length: {len(content)}")
            
            # Test summarize
            summary = retrieval.summarize(content)
            if summary:
                print(f"\nSummary: {summary}")
    
    # Test complete pipeline
    print("\n=== Complete Pipeline Test ===")
    pipeline_results = retrieval.retrieve_and_summarize("PING constitutional system", num_results=2)
    print(f"Pipeline results: {len(pipeline_results)}")
    for result in pipeline_results:
        print(f"  - {result['title']}")
        print(f"    {result['summary']}")
    
    retrieval.close()
