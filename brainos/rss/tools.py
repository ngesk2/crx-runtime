import feedparser
import requests
import os
from typing import List, Dict, Optional
from datetime import datetime

def fetch_rss(url: str) -> List[Dict]:
    """
    Fetch and parse RSS feed from given URL.
    Returns list of articles with title, url, published_at, and content.
    """
    try:
        feed = feedparser.parse(url)
        
        if feed.bozo:
            print(f"Warning: Feed parsing error for {url}: {feed.bozo_exception}")
        
        articles = []
        for entry in feed.entries:
            article = {
                'title': entry.get('title', 'Untitled'),
                'url': entry.get('link', ''),
                'published_at': entry.get('published', entry.get('updated', '')),
                'content': extract_content(entry),
                'summary': entry.get('summary', '')
            }
            articles.append(article)
        
        return articles
    except Exception as e:
        print(f"Error fetching RSS from {url}: {e}")
        return []

def extract_content(entry) -> str:
    """Extract content from RSS entry, trying multiple fields."""
    content = ""
    
    if hasattr(entry, 'content'):
        content = entry.content[0].value if entry.content else ""
    elif hasattr(entry, 'description'):
        content = entry.description
    elif hasattr(entry, 'summary'):
        content = entry.summary
    
    # Strip HTML tags for cleaner text
    import re
    content = re.sub('<[^<]+?>', ' ', content)
    content = ' '.join(content.split())
    
    return content

def write_markdown(path: str, content: str) -> bool:
    """
    Write content to a markdown file.
    Creates parent directories if they don't exist.
    """
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error writing markdown to {path}: {e}")
        return False

def save_article(article: Dict) -> bool:
    """
    Save article to database using the database module.
    This is a wrapper for the database.save_article function.
    """
    from database import save_article as db_save_article
    return db_save_article(article)

def search_articles(query: str) -> List[Dict]:
    """
    Search articles in the database.
    This is a wrapper for the database.search_articles function.
    """
    from database import search_articles as db_search_articles
    return db_search_articles(query)
