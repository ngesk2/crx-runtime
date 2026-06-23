import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Optional
import sys
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_newsletter_created, emit_digest_generated, emit_newsletter_processing_failed, emit_database_write_failed

DATABASE_PATH = "newsletters.db"

def init_database():
    """Initialize the SQLite database with the required schema."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Newsletters table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS newsletters (
            id INTEGER PRIMARY KEY,
            message_id TEXT UNIQUE,
            subject TEXT,
            sender TEXT,
            body TEXT,
            word_count INTEGER,
            received_at TEXT,
            processed_at TEXT,
            summary TEXT,
            tags TEXT,
            key_ideas TEXT,
            actionable_insights TEXT,
            archived INTEGER DEFAULT 0
        )
    """)
    
    # Digests table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS digests (
            id INTEGER PRIMARY KEY,
            type TEXT,
            date TEXT,
            content TEXT,
            generated_at TEXT,
            newsletter_count INTEGER
        )
    """)
    
    # Indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_newsletters_message_id ON newsletters(message_id)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_newsletters_received_at ON newsletters(received_at)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_newsletters_processed_at ON newsletters(processed_at)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_digests_date ON digests(date)
    """)
    
    # Newsletter topics table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS newsletter_topics (
            id INTEGER PRIMARY KEY,
            article_id INTEGER,
            topic TEXT,
            confidence REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (article_id) REFERENCES newsletters(id)
        )
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_newsletter_topics_article_id ON newsletter_topics(article_id)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_newsletter_topics_topic ON newsletter_topics(topic)
    """)
    
    conn.commit()
    conn.close()

def save_raw_newsletter(newsletter: Dict) -> bool:
    """Save raw newsletter to database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO newsletters (message_id, subject, sender, body, word_count, received_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            newsletter['message_id'],
            newsletter['subject'],
            newsletter['sender'],
            newsletter['body'],
            newsletter['word_count'],
            newsletter['received_at']
        ))
        conn.commit()
        
        # Emit constitutional event
        emit_newsletter_created(newsletter)
        
        return True
    except sqlite3.IntegrityError:
        # Message ID already exists
        return False
    except Exception as e:
        print(f"Error saving newsletter: {e}")
        conn.rollback()
        
        # Emit constitutional event for database write failure
        emit_database_write_failed('newsletters', str(e), 'yahoo_worker')
        
        return False
    finally:
        conn.close()

def update_newsletter_analysis(message_id: str, analysis: Dict) -> bool:
    """Update newsletter with Ollama analysis results."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE newsletters
            SET summary = ?, tags = ?, key_ideas = ?, actionable_insights = ?, processed_at = ?
            WHERE message_id = ?
        """, (
            analysis.get('summary', ''),
            analysis.get('tags', ''),
            analysis.get('key_ideas', ''),
            analysis.get('actionable_insights', ''),
            datetime.utcnow().isoformat(),
            message_id
        ))
        
        # Get the article ID
        cursor.execute("SELECT id FROM newsletters WHERE message_id = ?", (message_id,))
        result = cursor.fetchone()
        if result:
            article_id = result[0]
            
            # Save topics
            if 'topics' in analysis and analysis['topics']:
                topics = analysis['topics']
                if isinstance(topics, list):
                    for topic in topics:
                        cursor.execute("""
                            INSERT INTO newsletter_topics (article_id, topic, confidence)
                            VALUES (?, ?, ?)
                        """, (article_id, topic, 1.0))
                else:
                    # Handle if topics is a string
                    cursor.execute("""
                        INSERT INTO newsletter_topics (article_id, topic, confidence)
                        VALUES (?, ?, ?)
                    """, (article_id, str(topics), 1.0))
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating newsletter analysis: {e}")
        conn.rollback()
        
        # Emit constitutional event for database write failure
        emit_database_write_failed('newsletters', str(e), 'yahoo_worker')
        
        return False
    finally:
        conn.close()

def mark_newsletter_archived(message_id: str) -> bool:
    """Mark newsletter as archived."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE newsletters
            SET archived = 1
            WHERE message_id = ?
        """, (message_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error marking newsletter archived: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_unprocessed_newsletters() -> List[Dict]:
    """Get newsletters that haven't been processed by Ollama."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT message_id, subject, sender, body, word_count, received_at
        FROM newsletters
        WHERE summary IS NULL
        ORDER BY received_at DESC
    """)
    
    results = []
    for row in cursor.fetchall():
        results.append({
            'message_id': row[0],
            'subject': row[1],
            'sender': row[2],
            'body': row[3],
            'word_count': row[4],
            'received_at': row[5]
        })
    
    conn.close()
    return results

def get_newsletters_by_date_range(start_date: str, end_date: str) -> List[Dict]:
    """Get newsletters within a date range."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT message_id, subject, sender, summary, tags, key_ideas, actionable_insights, received_at
        FROM newsletters
        WHERE received_at >= ? AND received_at <= ?
        ORDER BY received_at DESC
    """, (start_date, end_date))
    
    results = []
    for row in cursor.fetchall():
        results.append({
            'message_id': row[0],
            'subject': row[1],
            'sender': row[2],
            'summary': row[3],
            'tags': row[4],
            'key_ideas': row[5],
            'actionable_insights': row[6],
            'received_at': row[7]
        })
    
    conn.close()
    return results

def save_digest(digest_type: str, date: str, content: str, newsletter_count: int) -> bool:
    """Save a digest to the database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO digests (type, date, content, generated_at, newsletter_count)
            VALUES (?, ?, ?, ?, ?)
        """, (
            digest_type,
            date,
            content,
            datetime.utcnow().isoformat(),
            newsletter_count
        ))
        conn.commit()
        
        # Emit constitutional event
        emit_digest_generated({
            'type': digest_type,
            'date': date,
            'newsletter_count': newsletter_count,
            'content_length': len(content)
        })
        
        return True
    except Exception as e:
        print(f"Error saving digest: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_stats() -> Dict:
    """Get database statistics."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM newsletters")
    newsletter_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM newsletters WHERE summary IS NOT NULL")
    processed_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM newsletters WHERE summary IS NULL")
    unprocessed_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT MAX(received_at) FROM newsletters")
    last_received = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM digests")
    digest_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM newsletter_topics")
    topic_count = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        'total_newsletters': newsletter_count,
        'processed_newsletters': processed_count,
        'unprocessed_newsletters': unprocessed_count,
        'last_received': last_received or 'Never',
        'total_digests': digest_count,
        'total_topics': topic_count
    }

def newsletter_exists(message_id: str) -> bool:
    """Check if a newsletter with the given message ID already exists."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT 1 FROM newsletters WHERE message_id = ?", (message_id,))
    result = cursor.fetchone()
    conn.close()
    
    return result is not None
