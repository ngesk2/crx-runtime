from flask import Flask, jsonify, request
from database import get_stats
from datetime import datetime
import time
import os

app = Flask(__name__)

START_TIME = time.time()
DASHBOARD_PORT = int(os.getenv("DASHBOARD_PORT", "5001"))
DASHBOARD_HOST = os.getenv("DASHBOARD_HOST", "0.0.0.0")
processing_errors = []

@app.route('/stats')
def stats():
    """Return system statistics"""
    db_stats = get_stats()
    uptime = time.time() - START_TIME
    
    return jsonify({
        'newsletters_processed': db_stats['processed_newsletters'],
        'summaries_generated': db_stats['processed_newsletters'],
        'topics_extracted': db_stats['total_topics'],
        'database_articles': db_stats['total_newsletters'],
        'database_topics': db_stats['total_topics'],
        'last_successful_run': db_stats['last_received'],
        'processing_errors': len(processing_errors),
        'archive_files': db_stats['processed_newsletters'],  # Approximate
        'total_newsletters': db_stats['total_newsletters'],
        'unprocessed_newsletters': db_stats['unprocessed_newsletters'],
        'total_digests': db_stats['total_digests'],
        'uptime': f"{uptime:.0f} seconds"
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

@app.route('/error', methods=['POST'])
def log_error():
    """Log processing errors"""
    error_data = request.get_json()
    if error_data and 'error' in error_data:
        processing_errors.append({
            'error': error_data['error'],
            'timestamp': datetime.utcnow().isoformat()
        })
    return jsonify({'status': 'logged'})

if __name__ == '__main__':
    app.run(host=DASHBOARD_HOST, port=DASHBOARD_PORT)
