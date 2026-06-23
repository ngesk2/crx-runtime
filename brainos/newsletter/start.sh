#!/bin/bash

echo "Starting CRX Newsletter Brain v1"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found. Please copy .env.example to .env and configure your credentials."
    exit 1
fi

# Check if Ollama is running
echo "Checking Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "Ollama is running"
else
    echo "ERROR: Ollama is not running. Please start Ollama first."
    echo "Run: ollama serve"
    exit 1
fi

# Check if required model is available
echo "Checking Ollama model..."
if ollama list | grep -q "qwen2.5-coder:7b"; then
    echo "Model qwen2.5-coder:7b is available"
else
    echo "Pulling qwen2.5-coder:7b model..."
    ollama pull qwen2.5-coder:7b
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Initialize database
echo "Initializing database..."
python -c "from database import init_database; init_database(); print('Database initialized')"

# Test Yahoo connection
echo "Testing Yahoo Mail connection..."
python -c "from yahoo_client import YahooMailClient; client = YahooMailClient(); client.test_connection()"

# Start the dashboard in background
echo "Starting metrics dashboard..."
python dashboard.py &
DASHBOARD_PID=$!

# Start the worker
echo "Starting newsletter ingestion worker..."
python worker.py

# Cleanup
kill $DASHBOARD_PID
