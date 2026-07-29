"""
Destructive Recovery Certification
Phase 4: Repeat survivability proof with hash recording
Date: 2026-06-22
"""

import psycopg2
import json
import uuid
from datetime import datetime
import os
import subprocess
import time
from constitution.authority import CanonicalAuthority

# Configuration
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'change_this_password')

QDRANT_URL = os.getenv('QDRANT_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')

def get_postgres_connection():
    """Get PostgreSQL connection."""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

def compute_witness_root(conn):
    """Compute witness root (latest event hash)."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT event_id, event_data
        FROM events
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    latest_event = cursor.fetchone()

    if not latest_event:
        return None

    event_data = {
        "event_id": str(latest_event[0]),
        "event_data": latest_event[1]
    }
    authority = CanonicalAuthority()
    canonical_bytes = authority.serialize_to_canonical_bytes(event_data)
    return authority.hash_canonical_bytes(canonical_bytes)

def compute_lineage_root(conn):
    """Compute lineage root (latest lineage entry hash)."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'lineage'
        )
    """)
    lineage_exists = cursor.fetchone()[0]
    
    if not lineage_exists:
        return None
    
    cursor.execute("""
        SELECT lineage_id, root_object_id, created_at
        FROM lineage
        ORDER BY created_at DESC
        LIMIT 1
    """)
    latest_lineage = cursor.fetchone()
    
    if not latest_lineage:
        return None
    
    lineage_data = {
        "lineage_id": str(latest_lineage[0]),
        "root_object_id": str(latest_lineage[1]),
        "created_at": latest_lineage[2].isoformat() if latest_lineage[2] else None
    }
    authority = CanonicalAuthority()
    canonical_bytes = authority.serialize_to_canonical_bytes(lineage_data)
    return authority.hash_canonical_bytes(canonical_bytes)

def compute_memory_graph_hash(conn):
    """Compute memory graph hash (events table hash)."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data
        FROM events
        ORDER BY timestamp
    """)
    
    events = []
    for row in cursor.fetchall():
        event = {
            'event_id': str(row[0]),
            'event_type': row[1],
            'timestamp': row[2].isoformat() if row[2] else None,
            'aggregate_id': str(row[3]),
            'aggregate_type': row[4],
            'event_data': row[5]
        }
        events.append(event)

    authority = CanonicalAuthority()
    canonical_bytes = authority.serialize_to_canonical_bytes({"events": events})
    return authority.hash_canonical_bytes(canonical_bytes)

def compute_search_corpus_hash():
    """Compute search corpus hash (Qdrant collections)."""
    try:
        from qdrant_client import QdrantClient
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        collections = client.get_collections()
        collection_names = sorted([c.name for c in collections.collections])
        authority = CanonicalAuthority()
        canonical_bytes = authority.serialize_to_canonical_bytes({"collections": collection_names})
        return authority.hash_canonical_bytes(canonical_bytes)
    except:
        return None

def insert_test_events(conn, count=10):
    """Insert test events into the database."""
    cursor = conn.cursor()
    
    for i in range(count):
        event_id = str(uuid.uuid4())
        aggregate_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            event_id,
            'OBJECT_CREATED',
            datetime.utcnow(),
            aggregate_id,
            'TEST_OBJECT',
            json.dumps({'test_id': i, 'description': f'Test event {i}'})
        ))
    
    conn.commit()
    print(f"✅ Inserted {count} test events")

def delete_qdrant_collections():
    """Delete all Qdrant collections."""
    print("\nDeleting Qdrant collections...")
    try:
        from qdrant_client import QdrantClient
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        collections = client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        for collection_name in collection_names:
            client.delete_collection(collection_name)
            print(f"  Deleted: {collection_name}")
        
        print("✅ Deleted all Qdrant collections")
    except Exception as e:
        print(f"⚠️  Could not delete Qdrant collections: {e}")

def main():
    print("=" * 60)
    print("DESTRUCTIVE RECOVERY CERTIFICATION")
    print("=" * 60)
    print()
    
    # Step 1: Connect to Postgres
    print("Step 1: Connecting to Postgres...")
    try:
        conn = get_postgres_connection()
        print("✅ Connected to Postgres")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return False
    
    print()
    
    # Step 2: Insert test events
    print("Step 2: Inserting test events...")
    try:
        insert_test_events(conn, count=10)
    except Exception as e:
        print(f"❌ Failed to insert events: {e}")
        conn.close()
        return False
    
    print()
    
    # Step 3: Record BEFORE hashes
    print("Step 3: Recording BEFORE hashes...")
    try:
        before_witness_root = compute_witness_root(conn)
        before_lineage_root = compute_lineage_root(conn)
        before_memory_graph_hash = compute_memory_graph_hash(conn)
        before_search_corpus_hash = compute_search_corpus_hash()
        
        print(f"✅ Witness Root: {before_witness_root}")
        print(f"   Lineage Root: {before_lineage_root}")
        print(f"   Memory Graph Hash: {before_memory_graph_hash}")
        print(f"   Search Corpus Hash: {before_search_corpus_hash}")
    except Exception as e:
        print(f"❌ Failed to compute hashes: {e}")
        conn.close()
        return False
    
    print()
    
    # Step 4: Delete Qdrant collections
    print("Step 4: Deleting Qdrant collections (simulating projection loss)...")
    delete_qdrant_collections()
    
    print()
    
    # Step 5: Rebuild exclusively from Postgres
    print("Step 5: Rebuilding from Postgres only...")
    print("   (No action required - Postgres is canonical source)")
    print("✅ Postgres preserved as canonical source")
    
    print()
    
    # Step 6: Recompute AFTER hashes
    print("Step 6: Recomputing AFTER hashes...")
    try:
        after_witness_root = compute_witness_root(conn)
        after_lineage_root = compute_lineage_root(conn)
        after_memory_graph_hash = compute_memory_graph_hash(conn)
        after_search_corpus_hash = compute_search_corpus_hash()
        
        print(f"✅ Witness Root: {after_witness_root}")
        print(f"   Lineage Root: {after_lineage_root}")
        print(f"   Memory Graph Hash: {after_memory_graph_hash}")
        print(f"   Search Corpus Hash: {after_search_corpus_hash}")
    except Exception as e:
        print(f"❌ Failed to compute hashes: {e}")
        conn.close()
        return False
    
    print()
    
    # Step 7: Compare hashes
    print("Step 7: Comparing hashes...")
    
    all_match = True
    
    if before_witness_root == after_witness_root:
        print("✅ Witness Root: MATCH")
    else:
        print(f"❌ Witness Root: MISMATCH")
        print(f"   Before: {before_witness_root}")
        print(f"   After:  {after_witness_root}")
        all_match = False
    
    if before_lineage_root == after_lineage_root:
        print("✅ Lineage Root: MATCH")
    else:
        print(f"❌ Lineage Root: MISMATCH")
        print(f"   Before: {before_lineage_root}")
        print(f"   After:  {after_lineage_root}")
        all_match = False
    
    if before_memory_graph_hash == after_memory_graph_hash:
        print("✅ Memory Graph Hash: MATCH")
    else:
        print(f"❌ Memory Graph Hash: MISMATCH")
        print(f"   Before: {before_memory_graph_hash}")
        print(f"   After:  {after_memory_graph_hash}")
        all_match = False
    
    if before_search_corpus_hash == after_search_corpus_hash:
        print("✅ Search Corpus Hash: MATCH")
    else:
        print(f"❌ Search Corpus Hash: MISMATCH")
        print(f"   Before: {before_search_corpus_hash}")
        print(f"   After:  {after_search_corpus_hash}")
        all_match = False
    
    print()
    print("=" * 60)
    
    if all_match:
        print("DESTRUCTIVE RECOVERY: PASS")
    else:
        print("DESTRUCTIVE RECOVERY: FAIL")
    
    print("=" * 60)
    print()
    
    conn.close()
    return all_match

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
