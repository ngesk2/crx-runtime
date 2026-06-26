#!/usr/bin/env python3
"""
Constitutional Runtime Kernel
Polls events table continuously and processes unprocessed events.
"""

import os
import sys
import psycopg2
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path
from observation_worker import ObservationWorker
from claim_worker import ClaimWorker
from replay_worker import ReplayWorker
from witness_worker import WitnessWorker
from lineage_worker import LineageWorker
from constitutional_projection_worker import ConstitutionalProjectionWorker

from runtime.configuration import get_postgres_config


class ConstitutionalRuntime:
    """Constitutional Runtime Kernel"""
    
    def __init__(self, postgres_config: Dict[str, Any]):
        self.postgres_config = postgres_config
        self.running = False
        self.handlers = {}
        
    def get_connection(self):
        """Get PostgreSQL connection"""
        return psycopg2.connect(**self.postgres_config)
    
    def register_handler(self, event_type: str, handler):
        """Register event handler"""
        self.handlers[event_type] = handler
        
    def fetch_unprocessed_events(self, limit: int = 100) -> list:
        """Fetch unprocessed events"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data
            FROM events
            WHERE processed_at IS NULL
            ORDER BY timestamp ASC
            LIMIT %s
        """, (limit,))
        
        events = []
        for row in cursor.fetchall():
            events.append({
                "event_id": row[0],
                "event_type": row[1],
                "timestamp": row[2],
                "aggregate_id": row[3],
                "aggregate_type": row[4],
                "event_data": row[5]
            })
        
        cursor.close()
        conn.close()
        return events
    
    def mark_processed(self, event_id: str):
        """Mark event as processed"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE events
            SET processed_at = %s
            WHERE event_id = %s
        """, (datetime.utcnow(), event_id))
        
        conn.commit()
        cursor.close()
        conn.close()
    
    def process_event(self, event: Dict[str, Any]):
        """Process single event"""
        event_type = event["event_type"]
        
        if event_type in self.handlers:
            print(f"Processing event: {event_type} ({event['event_id']})")
            try:
                self.handlers[event_type](event)
                self.mark_processed(event["event_id"])
                print(f"Event processed: {event_type}")
            except Exception as e:
                print(f"Error processing event {event_type}: {e}")
        else:
            print(f"No handler for event type: {event_type}")
    
    def run(self, poll_interval: int = 5):
        """Run event loop"""
        self.running = True
        print("Constitutional Runtime started")
        
        while self.running:
            try:
                events = self.fetch_unprocessed_events()
                
                if events:
                    print(f"Found {len(events)} unprocessed events")
                    for event in events:
                        self.process_event(event)
                else:
                    print("No unprocessed events")
                
                time.sleep(poll_interval)
            except KeyboardInterrupt:
                print("Stopping runtime...")
                self.running = False
            except Exception as e:
                print(f"Runtime error: {e}")
                time.sleep(poll_interval)
        
        print("Constitutional Runtime stopped")


def main():
    """Main execution"""
    postgres_config = get_postgres_config()
    
    runtime = ConstitutionalRuntime(postgres_config)
    
    # Initialize workers
    observation_worker = ObservationWorker(postgres_config)
    claim_worker = ClaimWorker(postgres_config)
    replay_worker = ReplayWorker(postgres_config)
    witness_worker = WitnessWorker(postgres_config)
    lineage_worker = LineageWorker(postgres_config)
    projection_worker = ConstitutionalProjectionWorker(postgres_config)
    
    # Register handlers
    runtime.register_handler("DOCUMENT_IMPORTED", observation_worker.handle_document_imported)
    runtime.register_handler("OBSERVATION_CREATED", claim_worker.handle_observation_created)
    runtime.register_handler("CLAIM_GENERATED", replay_worker.handle_claim_generated)
    runtime.register_handler("REPLAY_EXECUTED", witness_worker.handle_replay_executed)
    runtime.register_handler("WITNESS_CREATED", lineage_worker.handle_witness_created)
    runtime.register_handler("LINEAGE_CREATED", projection_worker.handle_lineage_created)
    
    runtime.run()


if __name__ == "__main__":
    main()
