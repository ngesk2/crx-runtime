"""
Daily Runtime Digest Generator
PING EXECUTION DIRECTIVE - PHASE B.5
Date: 2026-06-14

This script generates a daily runtime report from SQL events.
Output: knowledge/runtime/YYYY-MM-DD.md
"""

import os
import sys
from datetime import datetime, date
import psycopg2
from psycopg2.extras import Json

# PostgreSQL connection configuration
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '')

# Output directory
OUTPUT_DIR = 'knowledge/runtime'


def get_postgres_connection():
    """Get a PostgreSQL connection."""
    try:
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            database=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD
        )
        return conn
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        return None


def generate_daily_digest(digest_date: date = None):
    """Generate daily runtime digest from SQL events."""
    if digest_date is None:
        digest_date = date.today()
    
    conn = get_postgres_connection()
    if not conn:
        print("Failed to connect to PostgreSQL")
        return False
    
    try:
        cursor = conn.cursor()
        
        # RSS metrics
        cursor.execute("""
            SELECT
                COUNT(*) FILTER (WHERE event_type = 'ARTICLE_CREATED') as articles_processed,
                COUNT(*) FILTER (WHERE event_type LIKE '%_FAILED') as failures,
                COUNT(*) FILTER (WHERE event_type = 'CYCLE_STARTED') as cycles
            FROM events
            WHERE stream = 'rss'
              AND created_at >= %s
              AND created_at < %s + INTERVAL '1 day'
        """, (digest_date, digest_date))
        
        rss_result = cursor.fetchone()
        rss_articles, rss_failures, rss_cycles = rss_result if rss_result else (0, 0, 0)
        
        # Yahoo metrics
        cursor.execute("""
            SELECT
                COUNT(*) FILTER (WHERE event_type = 'NEWSLETTER_CREATED') as newsletters_processed,
                COUNT(*) FILTER (WHERE event_type = 'DIGEST_GENERATED') as digests_generated,
                COUNT(*) FILTER (WHERE event_type LIKE '%_FAILED') as failures,
                COUNT(*) FILTER (WHERE event_type = 'INGESTION_CYCLE_STARTED') as ingestion_cycles,
                COUNT(*) FILTER (WHERE event_type = 'PROCESSING_CYCLE_STARTED') as processing_cycles
            FROM events
            WHERE stream = 'yahoo'
              AND created_at >= %s
              AND created_at < %s + INTERVAL '1 day'
        """, (digest_date, digest_date))
        
        yahoo_result = cursor.fetchone()
        yahoo_newsletters, yahoo_digests, yahoo_failures, yahoo_ingestion_cycles, yahoo_processing_cycles = yahoo_result if yahoo_result else (0, 0, 0, 0, 0)
        
        # Gateway metrics
        cursor.execute("""
            SELECT
                COUNT(*) FILTER (WHERE event_type = 'INFERENCE_RESPONSE') as inference_count,
                AVG((payload->>'duration_ms')::INTEGER) FILTER (WHERE event_type = 'INFERENCE_RESPONSE') as avg_latency_ms
            FROM events
            WHERE stream = 'gateway'
              AND created_at >= %s
              AND created_at < %s + INTERVAL '1 day'
        """, (digest_date, digest_date))
        
        gateway_result = cursor.fetchone()
        gateway_inference_count, gateway_avg_latency = gateway_result if gateway_result else (0, 0)
        
        # Storage metrics
        cursor.execute("""
            SELECT
                COUNT(*) FILTER (WHERE event_type = 'MARKDOWN_WRITTEN' OR event_type = 'ARCHIVE_WRITTEN') as archives_written,
                COUNT(*) FILTER (WHERE event_type = 'ARTICLE_CREATED' OR event_type = 'NEWSLETTER_CREATED') as db_growth
            FROM events
            WHERE created_at >= %s
              AND created_at < %s + INTERVAL '1 day'
        """, (digest_date, digest_date))
        
        storage_result = cursor.fetchone()
        storage_archives, storage_growth = storage_result if storage_result else (0, 0)
        
        # Top errors
        cursor.execute("""
            SELECT
                event_type as error_type,
                COUNT(*) as error_count
            FROM events
            WHERE event_type LIKE '%_FAILED'
              AND created_at >= %s
              AND created_at < %s + INTERVAL '1 day'
            GROUP BY event_type
            ORDER BY error_count DESC
            LIMIT 5
        """, (digest_date, digest_date))
        
        top_errors = cursor.fetchall()
        
        # Dead workers
        cursor.execute("""
            SELECT
                payload->>'worker' as worker,
                MAX(created_at) as last_heartbeat
            FROM events
            WHERE event_type = 'WORKER_HEARTBEAT'
              AND created_at < NOW() - INTERVAL '30 minutes'
            GROUP BY payload->>'worker'
        """)
        
        dead_workers = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Generate markdown report
        date_str = digest_date.strftime('%Y-%m-%d')
        output_path = os.path.join(OUTPUT_DIR, f"{date_str}.md")
        
        # Create output directory if it doesn't exist
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # Write markdown report
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"# Runtime Report\n\n")
            f.write(f"**Date:** {date_str}\n")
            f.write(f"**Generated:** {datetime.utcnow().isoformat()}\n\n")
            
            f.write("## RSS\n\n")
            f.write(f"- **Articles Processed:** {rss_articles}\n")
            f.write(f"- **Failures:** {rss_failures}\n")
            f.write(f"- **Cycles:** {rss_cycles}\n\n")
            
            f.write("## Yahoo\n\n")
            f.write(f"- **Newsletters Processed:** {yahoo_newsletters}\n")
            f.write(f"- **Digests Generated:** {yahoo_digests}\n")
            f.write(f"- **Failures:** {yahoo_failures}\n")
            f.write(f"- **Ingestion Cycles:** {yahoo_ingestion_cycles}\n")
            f.write(f"- **Processing Cycles:** {yahoo_processing_cycles}\n\n")
            
            f.write("## Gateway\n\n")
            f.write(f"- **Inference Count:** {gateway_inference_count}\n")
            f.write(f"- **Avg Latency:** {gateway_avg_latency:.2f}ms\n\n")
            
            f.write("## Storage\n\n")
            f.write(f"- **Archives Written:** {storage_archives}\n")
            f.write(f"- **DB Growth:** {storage_growth}\n\n")
            
            if top_errors:
                f.write("## Top Errors\n\n")
                for error_type, error_count in top_errors:
                    f.write(f"- **{error_type}:** {error_count}\n")
                f.write("\n")
            else:
                f.write("## Top Errors\n\n")
                f.write("No errors reported.\n\n")
            
            if dead_workers:
                f.write("## Dead Workers\n\n")
                for worker, last_heartbeat in dead_workers:
                    f.write(f"- **{worker}:** Last heartbeat at {last_heartbeat}\n")
                f.write("\n")
            else:
                f.write("## Dead Workers\n\n")
                f.write("All workers alive.\n\n")
        
        print(f"Daily runtime digest generated: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error generating daily digest: {e}")
        if conn:
            conn.close()
        return False


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate daily runtime digest')
    parser.add_argument('--date', type=str, help='Date in YYYY-MM-DD format (default: today)')
    
    args = parser.parse_args()
    
    if args.date:
        try:
            digest_date = datetime.strptime(args.date, '%Y-%m-%d').date()
        except ValueError:
            print(f"Invalid date format: {args.date}")
            print("Use YYYY-MM-DD format")
            return
    else:
        digest_date = date.today()
    
    generate_daily_digest(digest_date)


if __name__ == "__main__":
    main()
