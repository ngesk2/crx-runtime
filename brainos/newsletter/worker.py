import time
import os
from datetime import datetime
from database import init_database, save_raw_newsletter, newsletter_exists, update_newsletter_analysis, mark_newsletter_archived, get_unprocessed_newsletters, get_stats
from yahoo_client import YahooMailClient
from summarizer import analyze_newsletter
from archive import archive_newsletter
from digest_generator import generate_daily_digest, generate_weekly_report
import sys
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_event

CYCLE_INTERVAL = int(os.getenv("CYCLE_INTERVAL", "900"))  # 15 minutes
MIN_WORD_COUNT = int(os.getenv("MIN_WORD_COUNT", "500"))

def run_ingestion_cycle():
    """Run a single ingestion cycle."""
    print(f"\n=== Ingestion Cycle Started at {datetime.utcnow().isoformat()} ===")
    
    # Emit constitutional event for cycle start
    emit_event('yahoo', 'INGESTION_CYCLE_STARTED', {
        'timestamp': datetime.utcnow().isoformat()
    })
    
    # Emit worker heartbeat
    emit_event('yahoo', 'WORKER_HEARTBEAT', {
        'worker': 'yahoo',
        'cycle': datetime.utcnow().isoformat()
    })
    
    # Connect to Yahoo Mail
    client = YahooMailClient()
    if not client.connect():
        print("Failed to connect to Yahoo Mail")
        return 0
    
    try:
        # Fetch unread newsletters
        newsletters = client.fetch_unread_newsletters()
        print(f"Fetched {len(newsletters)} unread newsletters")
        
        new_count = 0
        for newsletter in newsletters:
            # Check for duplicates
            if newsletter_exists(newsletter['message_id']):
                print(f"  Skipping duplicate: {newsletter['subject'][:50]}...")
                continue
            
            # Filter by word count
            if newsletter['word_count'] < MIN_WORD_COUNT:
                print(f"  Skipping (too short): {newsletter['subject'][:50]}... ({newsletter['word_count']} words)")
                continue
            
            # Save raw newsletter
            if save_raw_newsletter(newsletter):
                new_count += 1
                print(f"  Saved: {newsletter['subject'][:50]}... ({newsletter['word_count']} words)")
        
        client.disconnect()
        return new_count
        
    except Exception as e:
        print(f"Error in ingestion cycle: {e}")
        client.disconnect()
        return 0

def run_processing_cycle():
    """Run a single processing cycle for unprocessed newsletters."""
    print(f"\n=== Processing Cycle Started at {datetime.utcnow().isoformat()} ===")
    
    # Emit constitutional event for cycle start
    emit_event('yahoo', 'PROCESSING_CYCLE_STARTED', {
        'timestamp': datetime.utcnow().isoformat()
    })
    
    # Emit worker heartbeat
    emit_event('yahoo', 'WORKER_HEARTBEAT', {
        'worker': 'yahoo',
        'cycle': datetime.utcnow().isoformat()
    })
    
    # Get unprocessed newsletters
    newsletters = get_unprocessed_newsletters()
    print(f"Found {len(newsletters)} unprocessed newsletters")
    
    processed_count = 0
    for newsletter in newsletters:
        try:
            # Analyze with Ollama
            print(f"  Analyzing: {newsletter['subject'][:50]}...")
            analysis = analyze_newsletter(
                newsletter['subject'],
                newsletter['body'],
                newsletter['sender']
            )
            
            # Update database with analysis
            if update_newsletter_analysis(newsletter['message_id'], analysis):
                processed_count += 1
                print(f"    Summary: {analysis['summary'][:80]}...")
            
            # Archive as markdown
            newsletter_with_analysis = newsletter.copy()
            newsletter_with_analysis.update(analysis)
            newsletter_with_analysis['processed_at'] = datetime.utcnow().isoformat()
            
            if archive_newsletter(newsletter_with_analysis):
                mark_newsletter_archived(newsletter['message_id'])
                print(f"    Archived successfully")
            
        except Exception as e:
            print(f"    Error processing newsletter: {e}")
            continue
    
    return processed_count

def run_digest_generation():
    """Generate daily digest and weekly report if needed."""
    now = datetime.utcnow()
    date_str = now.strftime('%Y-%m-%d')
    
    # Generate daily digest
    print(f"\n=== Generating Daily Digest for {date_str} ===")
    daily_digest = generate_daily_digest(date_str)
    print(f"Daily digest generated")
    
    # Generate weekly report on Monday
    if now.weekday() == 0:  # Monday
        print(f"\n=== Generating Weekly Report for {date_str} ===")
        weekly_report = generate_weekly_report(date_str)
        print(f"Weekly report generated")

def main():
    """Main worker loop."""
    print("Starting CRX Newsletter Brain v1")
    print("=" * 60)
    
    # Initialize database
    init_database()
    print("Database initialized")
    
    # Test Yahoo connection
    client = YahooMailClient()
    if not client.test_connection():
        print("WARNING: Yahoo Mail connection test failed")
        print("Please check your credentials in .env file")
    else:
        print("Yahoo Mail connection test successful")
    
    # Run initial cycles
    new_newsletters = run_ingestion_cycle()
    processed = run_processing_cycle()
    run_digest_generation()
    
    # Display stats
    stats = get_stats()
    print(f"\n=== Initial Cycle Complete ===")
    print(f"New newsletters: {new_newsletters}")
    print(f"Processed: {processed}")
    print(f"Total in database: {stats['total_newsletters']}")
    print(f"Unprocessed: {stats['unprocessed_newsletters']}")
    
    # Perpetual loop
    while True:
        try:
            print(f"\nSleeping for {CYCLE_INTERVAL} seconds...")
            time.sleep(CYCLE_INTERVAL)
            
            # Run ingestion
            new_newsletters = run_ingestion_cycle()
            
            # Run processing if new newsletters
            if new_newsletters > 0:
                processed = run_processing_cycle()
                run_digest_generation()
            
            # Display stats
            stats = get_stats()
            print(f"\n=== Cycle Complete ===")
            print(f"New newsletters: {new_newsletters}")
            print(f"Total in database: {stats['total_newsletters']}")
            print(f"Unprocessed: {stats['unprocessed_newsletters']}")
            
        except KeyboardInterrupt:
            print("\nShutting down...")
            break
        except Exception as e:
            print(f"Error in main loop: {e}")
            print("Continuing...")
            time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    main()
