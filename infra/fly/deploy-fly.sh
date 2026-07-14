#!/bin/bash

set -e

echo "=== PING Fly.io Deployment Script ==="
echo ""

# Check for Fly CLI
if ! command -v flyctl &> /dev/null; then
    echo "ERROR: flyctl not found. Install from https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Check for authentication
if ! flyctl auth whoami &> /dev/null; then
    echo "ERROR: Not authenticated with Fly.io. Run: flyctl auth login"
    exit 1
fi

echo "Deploying PING edge services to Fly.io..."
echo ""

# Deploy API Gateway
echo "Step 1: Deploying API Gateway..."
flyctl deploy --config infra/fly/fly-api-gateway.toml

# Deploy Omniroute
echo "Step 2: Deploying Omniroute..."
flyctl deploy --config infra/fly/fly-omniroute.toml

# Deploy Webhook Receiver
echo "Step 3: Deploying Webhook Receiver..."
flyctl deploy --config infra/fly/fly-webhook.toml

# Deploy Worker
echo "Step 4: Deploying Worker Runtime..."
flyctl deploy --config infra/fly/fly-worker.toml

# Set up secrets
echo "Step 5: Setting up secrets..."
echo "Please provide the following secrets:"
read -p "Oracle Postgres URL: " ORACLE_POSTGRES_URL
read -p "Oracle Qdrant URL: " ORACLE_QDRANT_URL
read -p "Oracle Temporal URL: " ORACLE_TEMPORAL_URL

flyctl secrets set ORACLE_POSTGRES_URL="$ORACLE_POSTGRES_URL" --app ping-api-gateway
flyctl secrets set ORACLE_POSTGRES_URL="$ORACLE_POSTGRES_URL" --app ping-omniroute
flyctl secrets set ORACLE_POSTGRES_URL="$ORACLE_POSTGRES_URL" --app ping-webhook
flyctl secrets set ORACLE_POSTGRES_URL="$ORACLE_POSTGRES_URL" --app ping-worker

flyctl secrets set ORACLE_QDRANT_URL="$ORACLE_QDRANT_URL" --app ping-api-gateway
flyctl secrets set ORACLE_QDRANT_URL="$ORACLE_QDRANT_URL" --app ping-omniroute
flyctl secrets set ORACLE_QDRANT_URL="$ORACLE_QDRANT_URL" --app ping-worker

flyctl secrets set ORACLE_TEMPORAL_URL="$ORACLE_TEMPORAL_URL" --app ping-api-gateway
flyctl secrets set ORACLE_TEMPORAL_URL="$ORACLE_TEMPORAL_URL" --app ping-omniroute
flyctl secrets set ORACLE_TEMPORAL_URL="$ORACLE_TEMPORAL_URL" --app ping-worker

# Scale services
echo "Step 6: Configuring scaling..."
flyctl scale count 1 --app ping-api-gateway
flyctl scale count 0 --app ping-omniroute
flyctl scale count 0 --app ping-webhook
flyctl scale count 1 --app ping-worker

echo ""
echo "=== Fly.io Deployment Complete ==="
echo ""
echo "Deployed services:"
echo "- API Gateway: https://ping-api-gateway.fly.dev"
echo "- Omniroute: https://ping-omniroute.fly.dev"
echo "- Webhook: https://ping-webhook.fly.dev"
echo "- Worker: ping-worker (background)"
echo ""
echo "To scale services: flyctl scale count <n> --app <app-name>"
echo "To view logs: flyctl logs --app <app-name>"
