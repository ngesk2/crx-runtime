# CRX Autonomous Content Digestion Worker v1

A minimal autonomous content digestion system that can run continuously for 24+ hours with no human intervention.

## Overview

This system demonstrates that Ollama can continuously:
- Discover content from RSS feeds
- Summarize content using local LLM
- Store knowledge in SQLite database
- Accumulate information over time

## Architecture

```
Open WebUI (Docker)
    ↓
Ollama (Local)
    ↓
RSS Worker (Python)
    ↓
SQLite Knowledge Store
```

## Components

- **Open WebUI**: Web interface for Ollama (Docker)
- **Ollama**: Local LLM inference engine
- **RSS Worker**: Python worker that fetches, summarizes, and stores articles
- **SQLite**: Persistent knowledge storage
- **Markdown Archive**: Human-readable article storage

## Prerequisites

- Docker
- Ollama installed and running
- Python 3.8+
- 7B parameter Ollama model (llama3.2 or similar)

## Installation

1. Clone or navigate to the project directory:
```bash
cd C:\Users\nolan\CascadeProjects\crx-digestion-worker
```

2. Ensure Ollama is running:
```bash
ollama serve
```

3. Pull the required model (if not already available):
```bash
ollama pull qwen2.5-coder:7b
```

4. Install Python dependencies:
```bash
pip install -r requirements.txt
```

5. Start Open WebUI:
```bash
docker-compose up -d
```

## Startup Instructions

### Windows (PowerShell)
```powershell
.\start.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x start.sh
./start.sh
```

### Manual Startup
```bash
# Terminal 1: Start dashboard
python dashboard.py

# Terminal 2: Start worker
python worker.py
```

## Usage

### Open WebUI

Access Open WebUI at: http://localhost:3000

Open WebUI should automatically connect to your local Ollama instance.

### Metrics Dashboard

Access metrics at: http://localhost:5000/stats

Returns:
```json
{
  "articles": 42,
  "sources": 5,
  "last_run": "2026-06-13T19:30:00",
  "uptime": "3600 seconds"
}
```

### Search Articles

Use the Python REPL or create a script:

```python
from tools import search_articles

results = search_articles("machine learning")
for article in results:
    print(f"Title: {article['title']}")
    print(f"URL: {article['url']}")
    print(f"Summary: {article['summary']}")
    print("---")
```

## Configuration

### RSS Sources

Edit `sources.yaml` to add or modify RSS feeds:

```yaml
sources:
  - name: "Your Feed"
    url: "https://example.com/feed.xml"
    type: "rss"
```

### Ollama Model

Edit `summarizer.py` to change the model:

```python
OLLAMA_MODEL = "llama3.2"  # Change to your preferred model
```

### Cycle Interval

Edit `worker.py` to change the polling interval:

```python
CYCLE_INTERVAL = 900  # 15 minutes in seconds
```

## Directory Structure

```
crx-digestion-worker/
├── database.py          # SQLite database operations
├── tools.py            # Callable tools (fetch_rss, write_markdown, etc.)
├── summarizer.py       # Ollama summarization pipeline
├── archive.py          # Markdown archive storage
├── worker.py           # Main perpetual worker
├── dashboard.py        # Metrics dashboard (Flask)
├── sources.yaml        # RSS source registry
├── requirements.txt    # Python dependencies
├── docker-compose.yml  # Open WebUI configuration
├── start.sh           # Linux/Mac startup script
├── start.ps1          # Windows startup script
├── knowledge/         # Markdown archive (auto-created)
│   ├── YYYY/
│   │   └── MM/
│   │       └── article-slug.md
└── knowledge.db       # SQLite database (auto-created)
```

## Database Schema

### Articles Table
```sql
CREATE TABLE articles (
    id INTEGER PRIMARY KEY,
    url TEXT UNIQUE,
    title TEXT,
    summary TEXT,
    source TEXT,
    published_at TEXT,
    processed_at TEXT,
    tags TEXT
);
```

### Sources Table
```sql
CREATE TABLE sources (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    url TEXT UNIQUE,
    type TEXT,
    active INTEGER DEFAULT 1
);
```

## Operation

The worker runs in a perpetual loop:

1. Every 15 minutes (configurable)
2. Fetches RSS feeds from configured sources
3. Detects new articles (by URL)
4. Summarizes each new article via Ollama
5. Stores summary in SQLite
6. Archives as markdown in knowledge/
7. Persists state between runs
8. Logs errors and continues

The system is designed to survive:
- Feed failures
- Network failures
- Malformed feeds
- Ollama unavailability

## Verification

### 1. Check Open WebUI
Visit http://localhost:3000 and verify Ollama is connected.

### 2. Check Dashboard
Visit http://localhost:5000/stats and verify metrics are returned.

### 3. Check Database
```bash
sqlite3 knowledge.db "SELECT COUNT(*) FROM articles;"
```

### 4. Check Archive
```bash
ls knowledge/
```

### 5. Check Worker Logs
Worker logs to stdout. Watch for:
- "Processing source: ..."
- "Saved: ..."
- "Cycle complete"

## Troubleshooting

### Ollama not responding
- Ensure Ollama is running: `ollama serve`
- Check model is available: `ollama list`
- Verify model is pulled: `ollama pull llama3.2`

### Open WebUI not connecting to Ollama
- Check docker-compose.yml has correct OLLAMA_BASE_URL
- Ensure host.docker.internal resolves (works on Docker Desktop)
- Check Ollama is accessible from container

### Worker not fetching articles
- Check sources.yaml has valid RSS URLs
- Verify network connectivity
- Check worker logs for specific errors

### Database locked
- Ensure only one worker instance is running
- Check for zombie processes

## Out of Scope

This project explicitly does NOT include:
- ReplayEngine
- WitnessAuthority
- CanonicalHashAuthority
- LineageAuthority
- ProjectionBuilder
- Social graph
- Marketplace
- Placement systems
- Advertising
- Vector databases
- Temporal
- DBOS
- Agent swarms
- Google Drive sync
- Cloud storage
- Distributed execution
- Multi-node systems
- CRX constitutional runtime

This is a proof-of-concept for continuous autonomous content accumulation only.

## License

MIT
