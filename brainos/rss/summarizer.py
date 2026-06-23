import os
import sys
from typing import Dict, Optional
from datetime import datetime

# Add runtime adapters to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'runtime', 'adapters'))
from inference_adapter import get_inference_adapter

CHAT_MODEL = os.getenv("CHAT_MODEL", "qwen2.5-coder:7b")

def summarize_article(title: str, content: str, source: str) -> Dict:
    """
    Summarize an article using inference authority.
    Returns dict with summary and tags.
    """
    try:
        inference_adapter = get_inference_adapter()
        
        prompt = f"""You are a content summarization assistant. Please analyze the following article and provide:

1. A concise summary (2-3 sentences)
2. Relevant tags (comma-separated, 3-5 tags)

Article Title: {title}
Article Source: {source}
Article Content: {content[:4000]}

Please respond in the following format:
SUMMARY: [your summary here]
TAGS: [tag1, tag2, tag3, tag4, tag5]
"""
        
        response = inference_adapter.chat(messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ])
        
        result_text = response['message']['content']
        
        # Parse the response
        summary = ""
        tags = ""
        
        for line in result_text.split('\n'):
            line = line.strip()
            if line.startswith('SUMMARY:'):
                summary = line.replace('SUMMARY:', '').strip()
            elif line.startswith('TAGS:'):
                tags = line.replace('TAGS:', '').strip()
        
        return {
            'summary': summary or "Summary not available",
            'tags': tags or "general"
        }
        
    except Exception as e:
        print(f"Error summarizing article: {e}")
        return {
            'summary': "Summarization failed",
            'tags': "error"
        }

def process_article(article: Dict, source_name: str) -> Optional[Dict]:
    """
    Process a single article: summarize and prepare for storage.
    """
    try:
        # Generate summary
        summary_result = summarize_article(
            article['title'],
            article['content'],
            source_name
        )
        
        # Prepare article for storage
        processed = {
            'url': article['url'],
            'title': article['title'],
            'summary': summary_result['summary'],
            'source': source_name,
            'published_at': article['published_at'],
            'processed_at': datetime.utcnow().isoformat(),
            'tags': summary_result['tags']
        }
        
        return processed
        
    except Exception as e:
        print(f"Error processing article {article.get('url', 'unknown')}: {e}")
        return None
