#!/bin/bash
# Start PING Mission Control
# PING Constitutional Stabilization Phase E
# Date: 2026-06-22

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/infrastructure/docker/compose/docker-compose-mission-control.yml"
ENV_FILE="$SCRIPT_DIR/config/environments/.env.mission-control"

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "ERROR: docker-compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "WARNING: Environment file not found: $ENV_FILE"
    echo "Using default environment variables"
fi

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
fi

echo "Starting PING Mission Control..."
echo "Docker Compose: $COMPOSE_FILE"
echo ""

# Start services
cd "$SCRIPT_DIR"
docker-compose -f "$COMPOSE_FILE" up -d

echo ""
echo "Mission Control started successfully"
echo ""
echo "Services:"
echo "  - Mission Control API: http://localhost:8000"
echo "  - Open WebUI: http://localhost:3000"
echo "  - API Documentation: http://localhost:8000/docs"
echo ""
echo "To view logs:"
echo "  docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose -f $COMPOSE_FILE down"
