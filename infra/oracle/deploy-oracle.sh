#!/bin/bash

set -e

echo "=== PING Oracle Cloud Deployment Script ==="
echo ""

# Check for required credentials
if [ -z "$ORACLE_SSH_KEY" ]; then
    echo "ERROR: ORACLE_SSH_KEY environment variable not set"
    echo "Please set it to your SSH private key path"
    exit 1
fi

if [ -z "$ORACLE_HOST" ]; then
    echo "ERROR: ORACLE_HOST environment variable not set"
    echo "Please set it to your Oracle Cloud instance public IP"
    exit 1
fi

echo "Deploying to: $ORACLE_HOST"
echo ""

# Copy Docker Compose files
echo "Step 1: Copying Docker Compose files..."
scp -i "$ORACLE_SSH_KEY" \
    infra/docker/docker-compose.yml \
    infra/docker/config/* \
    ping@$ORACLE_HOST:/opt/ping/

# Copy application code
echo "Step 2: Copying application code..."
rsync -avz -e "ssh -i $ORACLE_SSH_KEY" \
    --exclude '__pycache__' \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.venv' \
    --exclude '*.pyc' \
    ./ ping@$ORACLE_HOST:/opt/ping/app/

# Configure environment
echo "Step 3: Configuring environment..."
if [ -f .env ]; then
    scp -i "$ORACLE_SSH_KEY" .env ping@$ORACLE_HOST:/opt/ping/.env
else
    echo "WARNING: .env file not found. Using template."
    ssh -i "$ORACLE_SSH_KEY" ping@$ORACLE_HOST "cp /opt/ping/.env.example /opt/ping/.env"
    echo "Please edit /opt/ping/.env on the remote server with your secrets"
fi

# Start services
echo "Step 4: Starting services..."
ssh -i "$ORACLE_SSH_KEY" ping@$ORACLE_HOST "cd /opt/ping && systemctl start ping-runtime"

# Wait for services to be healthy
echo "Step 5: Waiting for services to be healthy..."
sleep 30

# Check service status
echo "Step 6: Checking service status..."
ssh -i "$ORACLE_SSH_KEY" ping@$ORACLE_HOST "docker-compose -f /opt/ping/docker-compose.yml ps"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Access URLs:"
echo "- API: http://$ORACLE_HOST:8000"
echo "- Grafana: http://$ORACLE_HOST:3000"
echo "- Prometheus: http://$ORACLE_HOST:9090"
echo "- Temporal UI: http://$ORACLE_HOST:8088"
echo ""
echo "To view logs: ssh -i $ORACLE_SSH_KEY ping@$ORACLE_HOST 'journalctl -u ping-runtime -f'"
