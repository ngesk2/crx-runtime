import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Optional
import sys
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_article_created, emit_article_processing_failed, emit_database_write_failed

DATABASE_PATH = "knowledge.db"

def init_database():
    """Initialize the SQLite database with the required schema."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY,
            url TEXT UNIQUE,
            title TEXT,
            summary TEXT,
            source TEXT,
            published_at TEXT,
            processed_at TEXT,
            tags TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sources (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE,
            url TEXT UNIQUE,
            type TEXT,
            active INTEGER DEFAULT 1
        )
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at)
    """)
    
    conn.commit()
    conn.close()

def save_article(article: Dict) -> bool:
    """
    Save an article to the database.
    Returns True if saved successfully, False if duplicate or error.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO articles (url, title, summary, source, published_at, processed_at, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            article['url'],
            article['title'],
            article['summary'],
            article['source'],
            article['published_at'],
            article['processed_at'],
            article['tags']
        ))
        conn.commit()
        
        # Emit constitutional event
        emit_article_created(article)
        
        return True
    except sqlite3.IntegrityError:
        # URL already exists
        return False
    except Exception as e:
        print(f"Error saving article: {e}")
        conn.rollback()
        
        # Emit constitutional event for database write failure
        emit_database_write_failed('articles', str(e), 'rss_worker')
        
        return False
    finally:
        conn.close()

def article_exists(url: str) -> bool:
    """Check if an article with the given URL already exists."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT 1 FROM articles WHERE url = ?", (url,))
    result = cursor.fetchone()
    conn.close()
    
    return result is not None

def search_articles(query: str) -> List[Dict]:
    """
    Search articles by title, summary, or tags.
    Returns list of matching articles.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    search_pattern = f"%{query}%"
    cursor.execute("""
        SELECT title, url, summary, source, published_at, tags
        FROM articles
        WHERE title LIKE ? OR summary LIKE ? OR tags LIKE ?
        ORDER BY published_at DESC
        LIMIT 50
    """, (search_pattern, search_pattern, search_pattern))
    
    results = []
    for row in cursor.fetchall():
        results.append({
            'title': row[0],
            'url': row[1],
            'summary': row[2],
            'source': row[3],
            'published_at': row[4],
            'tags': row[5]
        })
    
    conn.close()
    return results

def get_stats() -> Dict:
    """Get database statistics."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM articles")
    article_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM sources")
    source_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT MAX(processed_at) FROM articles")
    last_run = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        'articles': article_count,
        'sources': source_count,
        'last_run': last_run or 'Never'
    }

def register_source(name: str, url: str, source_type: str) -> bool:
    """Register a source in the database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT OR IGNORE INTO sources (name, url, type)
            VALUES (?, ?, ?)
        """, (name, url, source_type))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error registering source: {e}")
        return False
    finally:
        conn.close()

def get_sources() -> List[Dict]:
    """Get all active sources."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, url, type FROM sources WHERE active = 1")
    results = []
    for row in cursor.fetchall():
        results.append({
            'name': row[0],
            'url': row[1],
            'type': row[2]
        })
    
    conn.close()
    return results
