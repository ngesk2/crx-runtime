#!/bin/bash
# AppRole Secret ID Rotation Script
# Run this daily via cron to rotate secret IDs

VAULT_ADDR="https://vault.example.com"
VAULT_TOKEN="${VAULT_ROOT_TOKEN}"
ROLE_NAME="ping-app"

# Get current secret ID
CURRENT_SECRET_ID=$(vault read -field=secret_id auth/approle/role/${ROLE_NAME}/secret-id)

# Generate new secret ID
NEW_SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/${ROLE_NAME}/secret-id)

# Revoke old secret ID
vault delete auth/approle/role/${ROLE_NAME}/secret-id/${CURRENT_SECRET_ID}

# Update application configuration
# TODO: Update your application with new secret_id
# Example: Update environment variable, Kubernetes secret, etc.

echo "Secret ID rotated successfully"
echo "New secret ID: ${NEW_SECRET_ID}"
echo "Old secret ID revoked: ${CURRENT_SECRET_ID}"
