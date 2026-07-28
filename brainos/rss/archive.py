import os
from datetime import datetime
from typing import Dict
import sys
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_markdown_written, emit_archive_write_failed

KNOWLEDGE_DIR = "knowledge"

def archive_article(article: Dict) -> bool:
    """
    Store article summary as markdown in the knowledge archive.
    Directory structure: knowledge/YYYY/MM/article-slug.md
    """
    try:
        # Parse published date
        published = article.get('published_at', '')
        if published:
            try:
                dt = datetime.strptime(published, '%a, %d %b %Y %H:%M:%S %z')
            except:
                try:
                    dt = datetime.strptime(published, '%Y-%m-%dT%H:%M:%S%z')
                except:
                    dt = datetime.utcnow()
        else:
            dt = datetime.utcnow()
        
        # Create directory structure
        year = dt.strftime('%Y')
        month = dt.strftime('%m')
        
        # Create slug from title
        slug = article['title'].lower()
        slug = ''.join(c if c.isalnum() or c in (' ', '-', '_') else '' for c in slug)
        slug = slug.replace(' ', '-')[:50]
        
        dir_path = os.path.join(KNOWLEDGE_DIR, year, month)
        file_path = os.path.join(dir_path, f"{slug}.md")
        
        # Create markdown content
        markdown = f"""# {article['title']}

**Source:** {article['source']}
**URL:** {article['url']}
**Published:** {article['published_at']}
**Processed:** {article['processed_at']}

## Summary

{article['summary']}

## Tags

{article['tags']}
"""
        
        # Write file
        os.makedirs(dir_path, exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        # Emit constitutional event
        emit_markdown_written(file_path, markdown)
        
        return True
        
    except Exception as e:
        print(f"Error archiving article: {e}")
        
        # Emit constitutional event for archive write failure
        emit_archive_write_failed(file_path, str(e), 'rss_worker')
        
        return False
