#!/bin/bash

set -e

echo "=== PING Infrastructure Bootstrap ==="
echo ""
echo "This script guides you through setting up PING infrastructure"
echo ""

# Prompt for credentials
echo "Please provide the following credentials:"
echo ""

read -p "Oracle Cloud SSH Key Path: " ORACLE_SSH_KEY
read -p "Oracle Cloud Instance IP: " ORACLE_HOST
read -p "Fly.io Token (or press Enter to skip): " FLY_TOKEN
read -p "Domain Name (optional, press Enter to skip): " DOMAIN_NAME
read -p "GitHub PAT (optional, press Enter to skip): " GITHUB_PAT

echo ""
echo "Configuration Summary:"
echo "Oracle SSH Key: $ORACLE_SSH_KEY"
echo "Oracle Host: $ORACLE_HOST"
echo "Fly.io Token: ${FLY_TOKEN:+[SET]}"
echo "Domain: ${DOMAIN_NAME:-[NOT SET]}"
echo "GitHub PAT: ${GITHUB_PAT:+[SET]}"
echo ""

read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Aborted"
    exit 1
fi

# Bootstrap Oracle
echo ""
echo "=== Step 1: Bootstrapping Oracle Cloud ==="
echo "Copying bootstrap script to Oracle..."
scp -i "$ORACLE_SSH_KEY" infra/oracle/bootstrap.sh ubuntu@$ORACLE_HOST:/tmp/bootstrap.sh
ssh -i "$ORACLE_SSH_KEY" ubuntu@$ORACLE_HOST "sudo bash /tmp/bootstrap.sh"

# Deploy to Oracle
echo ""
echo "=== Step 2: Deploying to Oracle Cloud ==="
export ORACLE_SSH_KEY
export ORACLE_HOST
bash infra/oracle/deploy-oracle.sh

# Deploy to Fly.io (if token provided)
if [ -n "$FLY_TOKEN" ]; then
    echo ""
    echo "=== Step 3: Deploying to Fly.io ==="
    export FLY_TOKEN
    flyctl auth token
    bash infra/fly/deploy-fly.sh
else
    echo ""
    echo "Skipping Fly.io deployment (no token provided)"
fi

# Configure domain (if provided)
if [ -n "$DOMAIN_NAME" ]; then
    echo ""
    echo "=== Step 4: Configuring Domain ==="
    echo "Please configure DNS to point to:"
    echo "  - Oracle: $ORACLE_HOST"
    echo "  - Fly: *.fly.dev (or configure custom domain)"
    echo ""
    echo "Then update Traefik configuration with your domain"
fi

echo ""
echo "=== Bootstrap Complete ==="
echo ""
echo "Next steps:"
echo "1. Configure /opt/ping/.env on Oracle with your secrets"
echo "2. Set up GitHub PAT if needed for repository operations"
echo "3. Configure Vault secrets if using Vault"
echo "4. Test services: curl http://$ORACLE_HOST:8000/health"
echo "5. Access Grafana: http://$ORACLE_HOST:3000"
echo ""
echo "For troubleshooting, see infra/README.md"
