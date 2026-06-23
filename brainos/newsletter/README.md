# CRX Newsletter Brain v1

A reliable continuous newsletter ingestion system that processes Yahoo Mail newsletters using local Ollama for AI-powered summarization and insight extraction.

## Overview

This system demonstrates autonomous newsletter processing:
- Fetches unread newsletters from Yahoo Mail via IMAP
- Filters by word count (500+ words)
- Summarizes content using local Ollama
- Extracts tags, key ideas, and actionable insights
- Stores in SQLite database and markdown archive
- Generates daily digests and weekly intelligence reports

## Architecture

```
Yahoo Mail (IMAP)
    ↓
Ingestion Worker (15-minute polling)
    ↓
SQLite Database
    ↓
Ollama Summarizer
    ↓
Knowledge Archive (Markdown)
    ↓
Digest Generator
    ↓
Daily Digest / Weekly Report
```

## Prerequisites

- Python 3.8+
- Ollama installed and running
- Yahoo Mail account with app password
- 7B parameter Ollama model (qwen2.5-coder:7b or similar)

## Installation

1. Navigate to project directory:
```bash
cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Configure credentials in `.env`:
```env
YAHOO_EMAIL=your_email@yahoo.com
YAHOO_APP_PASSWORD=your_app_password_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

4. Ensure Ollama is running:
```bash
ollama serve
```

5. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Yahoo OAuth Setup Guide

### Step 1: Generate Yahoo App Password

1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Sign in to your Yahoo account
3. Scroll down to "App passwords"
4. Click "Generate app password"
5. Select "Mail" as the app
6. Give it a name (e.g., "Newsletter Brain")
7. Click "Generate"
8. Copy the 16-character password (format: `abcd efgh ijkl mnop`)

### Step 2: Configure Environment Variables

Add the generated app password to your `.env` file:
```env
YAHOO_EMAIL=your_email@yahoo.com
YAHOO_APP_PASSWORD=abcd efgh ijkl mnop
```

### Step 3: Test Connection

Run the connection test:
```bash
python -c "from yahoo_client import YahooMailClient; client = YahooMailClient(); client.test_connection()"
```

Expected output: `Connected to Yahoo Mail as your_email@yahoo.com`

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

### Metrics Dashboard

Access metrics at: http://localhost:5001/stats

Returns:
```json
{
  "total_newsletters": 42,
  "processed_newsletters": 40,
  "unprocessed_newsletters": 2,
  "last_received": "2026-06-14T02:00:00",
  "total_digests": 5,
  "uptime": "3600 seconds"
}
```

### Daily Digest

Generated automatically every day at 08:00 (configurable).

Access at: `digests/daily-YYYY-MM-DD.md`

### Weekly Intelligence Report

Generated automatically every Monday at 09:00 (configurable).

Access at: `digests/weekly-YYYY-MM-DD.md`

## Configuration

### Environment Variables

Edit `.env` to customize:

```env
# Yahoo Mail
YAHOO_EMAIL=your_email@yahoo.com
YAHOO_APP_PASSWORD=your_app_password

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b

# Worker
CYCLE_INTERVAL=900  # 15 minutes in seconds
MIN_WORD_COUNT=500  # Minimum words to process

# Digest
DAILY_DIGEST_TIME=08:00
WEEKLY_REPORT_DAY=monday
WEEKLY_REPORT_TIME=09:00

# Dashboard
DASHBOARD_PORT=5001
DASHBOARD_HOST=0.0.0.0
```

## Directory Structure

```
crx-newsletter-brain/
├── database.py              # SQLite database operations
├── yahoo_client.py          # Yahoo Mail IMAP client
├── summarizer.py           # Ollama summarization pipeline
├── archive.py              # Markdown archive storage
├── digest_generator.py     # Daily/weekly digest generation
├── worker.py               # Main perpetual worker
├── dashboard.py            # Metrics dashboard (Flask)
├── requirements.txt        # Python dependencies
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # Docker image
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── start.sh               # Linux/Mac startup script
├── start.ps1              # Windows startup script
├── newsletters.db         # SQLite database (auto-created)
├── knowledge/             # Markdown archive (auto-created)
│   └── YYYY/MM/
│       └── newsletter-slug.md
└── digests/               # Generated digests (auto-created)
    ├── daily-YYYY-MM-DD.md
    └── weekly-YYYY-MM-DD.md
```

## Database Schema

### Newsletters Table
```sql
CREATE TABLE newsletters (
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
);
```

### Digests Table
```sql
CREATE TABLE digests (
    id INTEGER PRIMARY KEY,
    type TEXT,
    date TEXT,
    content TEXT,
    generated_at TEXT,
    newsletter_count INTEGER
);
```

## Operation

The worker runs in a perpetual loop:

1. **Every 15 minutes** (configurable)
2. Connects to Yahoo Mail via IMAP
3. Fetches unread emails
4. Filters by word count (500+ words)
5. Stores raw email in SQLite
6. Processes with Ollama:
   - Summarizes content
   - Extracts tags
   - Extracts key ideas
   - Generates actionable insights
7. Archives as markdown
8. Generates daily digest
9. Generates weekly report (Mondays)
10. Continues indefinitely

The system is designed to survive:
- Network failures
- IMAP connection errors
- Ollama unavailability
- Malformed emails

## Verification Steps

### 1. Test Yahoo Connection
```bash
python -c "from yahoo_client import YahooMailClient; client = YahooMailClient(); client.test_connection()"
```

### 2. Test Database
```bash
python -c "from database import init_database, get_stats; init_database(); print(get_stats())"
```

### 3. Test Dashboard
```bash
python dashboard.py
# Visit http://localhost:5001/stats
```

### 4. Test Worker (Single Cycle)
```bash
python -c "from worker import run_ingestion_cycle, run_processing_cycle; print(run_ingestion_cycle())"
```

### 5. Check Archive
```bash
ls knowledge/
```

### 6. Check Digests
```bash
ls digests/
```

## Docker Deployment

### Build and Run
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
```

### Stop
```bash
docker-compose down
```

## Troubleshooting

### Yahoo Connection Failed
- Verify app password is correct
- Check IMAP is enabled in Yahoo settings
- Ensure email and password are in `.env` file

### Ollama Not Responding
- Ensure Ollama is running: `ollama serve`
- Check model is available: `ollama list`
- Verify OLLAMA_BASE_URL in `.env`

### No Newsletters Fetched
- Check inbox has unread emails
- Verify word count filter (default: 500+ words)
- Check worker logs for errors

### Digests Not Generating
- Check database has processed newsletters
- Verify digest generation times in `.env`
- Manually trigger: `python -c "from digest_generator import generate_daily_digest; print(generate_daily_digest())"`

## Out of Scope

This project explicitly does NOT include:
- Scraping
- Selenium
- Browser automation
- Social media automation
- Vector databases
- Redis
- Postgres
- Multi-node systems
- Cloud storage

This is a focused newsletter ingestion system using Yahoo Mail API and local Ollama.

## License

MIT
