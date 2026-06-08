# Constitutional Replay Kernel - Dockerfile
# Phase 9: Docker Reproducibility Hardening
# Date: 2026-06-07
# Certification: CRX-CK-2026-06-07-v1

# ============================================
# Constitutional Docker Rules
# ============================================

# Pin base images (FORBIDDEN: FROM node:latest)
FROM node:20.11.1-alpine AS base

# Set working directory
WORKDIR /app

# ============================================
# Immutable Install
# ============================================

# Copy package files
COPY package*.json ./

# Immutable install (FORBIDDEN: RUN npm install)
# RUN npm ci is required for reproducible builds
RUN npm ci

# Copy source code
COPY runtime/replay ./runtime/replay
COPY tests ./tests
COPY tsconfig.json ./

# ============================================
# Build
# ============================================

# Install TypeScript globally for build
RUN npm install -g typescript@6.0.3

# Build TypeScript
RUN npx tsc --project tsconfig.json

# ============================================
# Startup Gate
# ============================================

# Container MUST run:
# - constitutional self-check
# - certification verification
# - corpus integrity verification
# before accepting traffic
# Failure MUST terminate container

# Copy certification artifacts
COPY certification ./certification

# ============================================
# Runtime Stage
# ============================================

FROM node:20.11.1-alpine AS runtime

WORKDIR /app

# Copy built artifacts from base stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/runtime/replay ./runtime/replay
COPY --from=base /app/tests ./tests
COPY --from=base /app/certification ./certification
COPY --from=base /app/tsconfig.json ./

# Install TypeScript for runtime
RUN npm install -g typescript@6.0.3 ts-node@10.9.2

# Health check - runs constitutional self-check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD npx ts-node runtime/replay/constitutional_self_check.ts || exit 1

# Startup command - runs constitutional self-check before accepting traffic
CMD ["sh", "-c", "npx ts-node runtime/replay/constitutional_self_check.ts && echo 'Constitutional self-check passed, ready for traffic'"]

# ============================================
# Notes
# ============================================

# Constitutional Rules Enforced:
# ✓ Base image pinned to node:20.11.1-alpine
# ✓ Immutable install with npm ci
# ✓ Startup gate with constitutional self-check
# ✓ Certification verification on startup
# ✓ Corpus integrity verification on startup
# ✓ Health check for ongoing verification
