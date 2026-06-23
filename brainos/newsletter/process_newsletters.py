import json
from datetime import datetime
from database import init_database, save_raw_newsletter, newsletter_exists, update_newsletter_analysis, mark_newsletter_archived, get_stats
from summarizer import analyze_newsletter
from archive import archive_newsletter
from dotenv import load_dotenv
import os

load_dotenv()

MIN_WORD_COUNT = 500

def process_latest_newsletters(count=10):
    """Process the latest newsletters from the inspection results."""
    print("=" * 60)
    print("Processing Latest Newsletters")
    print("=" * 60)
    print()
    
    # Initialize database
    print("Initializing database...")
    init_database()
    print("[OK] Database initialized")
    print()
    
    # Load newsletter candidates
    try:
        with open('newsletter_candidates.json', 'r', encoding='utf-8') as f:
            candidates = json.load(f)
    except FileNotFoundError:
        print("[ERROR] newsletter_candidates.json not found")
        print("Run inspect_newsletters.py first")
        return None
    
    # Filter by word count
    qualified = [c for c in candidates if c['word_count'] >= MIN_WORD_COUNT]
    print(f"Qualified newsletters: {len(qualified)}")
    print()
    
    # Take latest count
    to_process = qualified[:count]
    print(f"Processing latest {len(to_process)} newsletters...")
    print()
    
    processed_count = 0
    summaries_created = 0
    topics_created = 0
    archive_files_created = 0
    errors = []
    
    for i, candidate in enumerate(to_process, 1):
        try:
            print(f"{i}. {candidate['subject'][:60]}...")
            print(f"   From: {candidate['sender'][:50]}...")
            print(f"   Words: {candidate['word_count']}")
            
            # Generate message ID
            message_id = f"{candidate['sender']}_{candidate['subject']}".replace(" ", "_").replace("<", "").replace(">", "")
            
            # Check duplicate
            if newsletter_exists(message_id):
                print("   [SKIP] Skipped (duplicate)")
                continue
            
            # Create newsletter object
            newsletter = {
                'message_id': message_id,
                'subject': candidate['subject'],
                'sender': candidate['sender'],
                'body': '',  # Would need to fetch full body from IMAP
                'word_count': candidate['word_count'],
                'received_at': candidate['received_date']
            }
            
            # For this validation, we'll use a placeholder body
            # In production, this would fetch the full email body
            newsletter['body'] = f"This is a placeholder for the full email body. The actual email has {candidate['word_count']} words."
            
            # Save to database
            if save_raw_newsletter(newsletter):
                print("   [OK] Saved to database")
                processed_count += 1
            
            # Analyze with Ollama
            print("   [OK] Analyzing with Ollama...")
            analysis = analyze_newsletter(
                candidate['subject'],
                newsletter['body'],
                candidate['sender']
            )
            
            if analysis and analysis.get('summary'):
                summaries_created += 1
                print(f"   [OK] Summary: {analysis['summary'][:60]}...")
                
                if analysis.get('topics'):
                    topics_created += len(analysis['topics'])
                    print(f"   [OK] Topics: {', '.join(analysis['topics'][:3])}")
                
                # Update database
                update_newsletter_analysis(message_id, analysis)
                
                # Archive
                newsletter_with_analysis = newsletter.copy()
                newsletter_with_analysis.update(analysis)
                newsletter_with_analysis['processed_at'] = datetime.utcnow().isoformat()
                
                if archive_newsletter(newsletter_with_analysis):
                    archive_files_created += 1
                    mark_newsletter_archived(message_id)
                    print("   [OK] Archived as markdown")
            else:
                errors.append(f"Analysis failed for: {candidate['subject']}")
                print("   [ERROR] Analysis failed")
            
            print()
            
        except Exception as e:
            errors.append(f"Error processing {candidate['subject']}: {str(e)}")
            print(f"   [ERROR] Error: {e}")
            print()
            continue
    
    # Get final stats
    stats = get_stats()
    
    print("=" * 60)
    print("PROCESSING COMPLETE")
    print("=" * 60)
    print(f"Newsletters processed: {processed_count}")
    print(f"Summaries created: {summaries_created}")
    print(f"Topics created: {topics_created}")
    print(f"Archive files created: {archive_files_created}")
    print(f"Errors: {len(errors)}")
    print()
    print("Database Statistics:")
    print(f"  Total articles: {stats['total_newsletters']}")
    print(f"  Processed articles: {stats['processed_newsletters']}")
    print(f"  Total topics: {stats['total_topics']}")
    print()
    
    if errors:
        print("Errors:")
        for error in errors:
            # Remove unicode characters for printing
            error_clean = error.encode('ascii', 'ignore').decode('ascii')
            print(f"  - {error_clean}")
        print()
    
    return {
        'processed': processed_count,
        'summaries': summaries_created,
        'topics': topics_created,
        'archives': archive_files_created,
        'errors': errors,
        'stats': stats
    }

if __name__ == "__main__":
    result = process_latest_newsletters(10)
    if result:
        print("\n[SUCCESS] Processing complete")
    else:
        print("\n[FAILURE] Processing failed")
