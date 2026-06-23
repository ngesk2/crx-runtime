import os
from datetime import datetime
from typing import Dict
import sys
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_archive_written, emit_archive_write_failed

KNOWLEDGE_DIR = "knowledge"

def archive_newsletter(newsletter: Dict) -> bool:
    """
    Store newsletter as markdown in the knowledge archive.
    Directory structure: knowledge/YYYY/MM/newsletter-slug.md
    """
    try:
        # Parse received date
        received = newsletter.get('received_at', '')
        if received:
            try:
                # Try various date formats
                for fmt in ['%a, %d %b %Y %H:%M:%S %z', '%Y-%m-%dT%H:%M:%S%z', '%Y-%m-%d %H:%M:%S']:
                    try:
                        dt = datetime.strptime(received, fmt)
                        break
                    except:
                        dt = datetime.utcnow()
            except:
                dt = datetime.utcnow()
        else:
            dt = datetime.utcnow()
        
        # Create directory structure
        year = dt.strftime('%Y')
        month = dt.strftime('%m')
        
        # Create slug from subject
        slug = newsletter['subject'].lower()
        slug = ''.join(c if c.isalnum() or c in (' ', '-', '_') else '' for c in slug)
        slug = slug.replace(' ', '-')[:50]
        
        dir_path = os.path.join(KNOWLEDGE_DIR, year, month)
        file_path = os.path.join(dir_path, f"{slug}.md")
        
        # Create markdown content
        markdown = f"""# {newsletter['subject']}

**From:** {newsletter['sender']}
**Received:** {newsletter['received_at']}
**Processed:** {newsletter.get('processed_at', '')}

## Summary

{newsletter.get('summary', '')}

## Tags

{newsletter.get('tags', '')}

## Key Ideas

{newsletter.get('key_ideas', '')}

## Actionable Insights

{newsletter.get('actionable_insights', '')}

## Original Content

{newsletter.get('body', '')[:2000]}...
"""
        
        # Write file
        os.makedirs(dir_path, exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        # Emit constitutional event
        emit_archive_written(file_path, markdown)
        
        return True
        
    except Exception as e:
        print(f"Error archiving newsletter: {e}")
        
        # Emit constitutional event for archive write failure
        emit_archive_write_failed(file_path, str(e), 'yahoo_worker')
        
        return False
