from flask import Flask, jsonify
from database import get_stats
import time
import os

app = Flask(__name__)

START_TIME = time.time()
DASHBOARD_PORT = int(os.getenv("DASHBOARD_PORT", "5000"))
DASHBOARD_HOST = os.getenv("DASHBOARD_HOST", "0.0.0.0")

@app.route('/stats')
def stats():
    """Return system statistics"""
    db_stats = get_stats()
    uptime = time.time() - START_TIME
    
    return jsonify({
        'articles': db_stats['articles'],
        'sources': db_stats['sources'],
        'last_run': db_stats['last_run'],
        'uptime': f"{uptime:.0f} seconds"
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host=DASHBOARD_HOST, port=DASHBOARD_PORT)
