import os
import sys
from dotenv import load_dotenv
from typing import Dict

load_dotenv()

# Add runtime adapters to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'runtime', 'adapters'))
from inference_adapter import get_inference_adapter

CHAT_MODEL = os.getenv("CHAT_MODEL", "qwen2.5-coder:7b")

def analyze_newsletter(subject: str, body: str, sender: str) -> Dict:
    """
    Analyze a newsletter using inference authority.
    Returns dict with summary, topics, key ideas, and actionable insights.
    """
    try:
        inference_adapter = get_inference_adapter()
        
        # Truncate body if too long
        body_truncated = body[:8000] if len(body) > 8000 else body
        
        prompt = f"""You are a newsletter analysis assistant. Please analyze the following newsletter and provide:

1. A concise summary (3-5 sentences)
2. Relevant topics (list of 3-5 main themes like: AI, Energy, Markets, Defense, Politics, Macro, Software, Startups)
3. Key ideas (bullet points, 3-5 main points)
4. Actionable insights (bullet points, 2-4 specific actions)

Newsletter Subject: {subject}
Newsletter From: {sender}
Newsletter Content: {body_truncated}

Please respond in the following JSON format:
{{
  "summary": "your summary here",
  "topics": ["topic1", "topic2", "topic3"],
  "key_ideas": ["idea 1", "idea 2", "idea 3"],
  "actionable_insights": ["insight 1", "insight 2"]
}}
"""
        
        response = inference_adapter.chat(messages=[
            {
                'role': 'user',
                'content': prompt
            }
        ])
        
        result_text = response['message']['content']
        
        # Try to parse as JSON
        try:
            import json
            result = json.loads(result_text)
            
            return {
                'summary': result.get('summary', 'Summary not available'),
                'topics': result.get('topics', []),
                'key_ideas': result.get('key_ideas', []),
                'actionable_insights': result.get('actionable_insights', [])
            }
        except json.JSONDecodeError:
            # Fallback to text parsing if JSON fails
            print("JSON parsing failed, using fallback")
            return {
                'summary': result_text[:500],
                'topics': ['general'],
                'key_ideas': ['Analysis parsing failed'],
                'actionable_insights': ['Analysis parsing failed']
            }
        
    except Exception as e:
        print(f"Error analyzing newsletter: {e}")
        return {
            'summary': "Analysis failed",
            'topics': ['error'],
            'key_ideas': ['Analysis failed'],
            'actionable_insights': ['Analysis failed']
        }
