#!/bin/bash

echo "Starting CRX Autonomous Content Digestion Worker"
echo "================================================"

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
if ollama list | grep -q "llama3.2"; then
    echo "Model llama3.2 is available"
else
    echo "Pulling llama3.2 model..."
    ollama pull llama3.2
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Start Open WebUI
echo "Starting Open WebUI..."
docker-compose up -d

# Wait for Open WebUI to start
echo "Waiting for Open WebUI to start..."
sleep 10

# Start the dashboard in background
echo "Starting metrics dashboard..."
python dashboard.py &
DASHBOARD_PID=$!

# Start the worker
echo "Starting digestion worker..."
python worker.py

# Cleanup on exit
kill $DASHBOARD_PID
