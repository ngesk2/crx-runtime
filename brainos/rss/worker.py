import time
import yaml
import os
from datetime import datetime
from database import init_database, article_exists, save_article, register_source, get_sources, get_stats
from tools import fetch_rss
from summarizer import process_article
from archive import archive_article
import sys
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_event

CYCLE_INTERVAL = int(os.getenv("CYCLE_INTERVAL", "900"))  # 15 minutes in seconds

def load_sources():
    """Load RSS sources from sources.yaml"""
    try:
        with open('sources.yaml', 'r') as f:
            config = yaml.safe_load(f)
            return config.get('sources', [])
    except Exception as e:
        print(f"Error loading sources: {e}")
        return []

def initialize_sources():
    """Register sources from config into database"""
    sources = load_sources()
    for source in sources:
        register_source(source['name'], source['url'], source['type'])
    print(f"Registered {len(sources)} sources")

def process_source(source):
    """Process a single RSS source"""
    print(f"Processing source: {source['name']}")
    
    try:
        articles = fetch_rss(source['url'])
        print(f"  Fetched {len(articles)} articles")
        
        new_count = 0
        for article in articles:
            if not article['url']:
                continue
                
            # Check for duplicates
            if article_exists(article['url']):
                continue
            
            # Process and summarize
            processed = process_article(article, source['name'])
            if not processed:
                continue
            
            # Save to database
            if save_article(processed):
                # Archive as markdown
                archive_article(processed)
                new_count += 1
                print(f"    Saved: {processed['title'][:50]}...")
        
        print(f"  Added {new_count} new articles")
        return new_count
        
    except Exception as e:
        print(f"  Error processing source {source['name']}: {e}")
        return 0

def run_cycle():
    """Run a single digestion cycle"""
    print(f"\n=== Cycle started at {datetime.utcnow().isoformat()} ===")
    
    # Emit constitutional event for cycle start
    emit_event('rss', 'CYCLE_STARTED', {
        'timestamp': datetime.utcnow().isoformat()
    })
    
    # Emit worker heartbeat
    emit_event('rss', 'WORKER_HEARTBEAT', {
        'worker': 'rss',
        'cycle': datetime.utcnow().isoformat()
    })
    
    sources = get_sources()
    if not sources:
        print("No sources found, initializing from config...")
        initialize_sources()
        sources = get_sources()
    
    total_new = 0
    for source in sources:
        new_count = process_source(source)
        total_new += new_count
    
    stats = get_stats()
    print(f"=== Cycle complete. New articles: {total_new}. Total in DB: {stats['articles']} ===")
    
    return total_new

def main():
    """Main worker loop"""
    print("Starting CRX Autonomous Content Digestion Worker")
    print("=" * 60)
    
    # Initialize database
    init_database()
    print("Database initialized")
    
    # Initialize sources
    initialize_sources()
    
    # Run first cycle immediately
    run_cycle()
    
    # Perpetual loop
    while True:
        try:
            print(f"\nSleeping for {CYCLE_INTERVAL} seconds...")
            time.sleep(CYCLE_INTERVAL)
            run_cycle()
        except KeyboardInterrupt:
            print("\nShutting down...")
            break
        except Exception as e:
            print(f"Error in main loop: {e}")
            print("Continuing...")
            time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    main()
