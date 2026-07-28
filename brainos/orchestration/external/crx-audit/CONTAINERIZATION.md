# Containerization

**Phase 9:** Create dedicated containers for CRX

---

## Overview

Containerization creates dedicated containers for CRX audit, runtime, and API. No container may directly modify knowledge core, runtime kernel, or object substrate without constitutional APIs.

---

## Container Definitions

### 1. crx-audit Container
**Purpose:** CRX audit and analysis
**Base Image:** ubuntu:latest
**Requirements:**
- Read-only access to CRX code
- Read-only access to constitutional APIs
- No direct database access
- No direct object store access

**Dockerfile:**
```dockerfile
FROM ubuntu:latest

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    nodejs \
    npm \
    python3 \
    python3-pip

# Copy CRX code
COPY brain/external/crx-analysis-working /crx

# Set working directory
WORKDIR /crx

# Default command
CMD ["/bin/bash"]
```

### 2. crx-runtime Container
**Purpose:** CRX runtime execution
**Base Image:** node:latest
**Requirements:**
- Read-only access to constitutional APIs
- No direct database access
- No direct object store access
- All access through constitutional APIs

**Dockerfile:**
```dockerfile
FROM node:latest

# Install dependencies
COPY brain/external/crx-runtime /app
WORKDIR /app
RUN npm install

# Set environment
ENV CONSTITUTIONAL_API_URL=http://localhost:8080

# Expose port
EXPOSE 3000

# Default command
CMD ["npm", "start"]
```

### 3. crx-api Container
**Purpose:** CRX API gateway
**Base Image:** node:latest
**Requirements:**
- Read-only access to constitutional APIs
- No direct database access
- No direct object store access
- All access through constitutional APIs

**Dockerfile:**
```dockerfile
FROM node:latest

# Install dependencies
COPY brain/external/crx-api /app
WORKDIR /app
RUN npm install

# Set environment
ENV CONSTITUTIONAL_API_URL=http://localhost:8080

# Expose port
EXPOSE 8080

# Default command
CMD ["npm", "start"]
```

---

## Container Networking

### Network Configuration
```yaml
version: '3.8'

services:
  crx-audit:
    build: ./brain/external/crx-audit
    networks:
      - crx-network
    volumes:
      - ./brain/external/crx-analysis-working:/crx:ro
      - ./brain/constitutional:/constitutional:ro

  crx-runtime:
    build: ./brain/external/crx-runtime
    networks:
      - crx-network
    environment:
      - CONSTITUTIONAL_API_URL=http://constitutional-api:8080
    depends_on:
      - constitutional-api

  crx-api:
    build: ./brain/external/crx-api
    networks:
      - crx-network
    ports:
      - "8080:8080"
    environment:
      - CONSTITUTIONAL_API_URL=http://constitutional-api:8080
    depends_on:
      - constitutional-api

  constitutional-api:
    image: constitutional-api:latest
    networks:
      - crx-network
    ports:
      - "8080:8080"

networks:
  crx-network:
    driver: bridge
```

---

## Container Security

### Security Rules
1. **No Direct Database Access:** Containers must not access database directly
2. **No Direct Object Store Access:** Containers must not access object store directly
3. **API-Only Access:** All access through constitutional APIs
4. **Read-Only Access:** Audit container has read-only access to code
5. **Network Isolation:** Containers isolated on dedicated network

### Security Implementation
```yaml
# Security configurations
security_opt:
  - no-new-privileges:true
  - seccomp:default.json
  - apparmor:docker-default

# Resource limits
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M

# Read-only root filesystem
read_only: true

# Drop capabilities
cap_drop:
  - ALL
cap_add:
  - NET_BIND_SERVICE
```

---

## Container Best Practices

### 1. Container Isolation
- CRX containers isolated on dedicated network
- No direct access to constitutional storage
- API-only access to constitutional primitives
- Network segmentation

### 2. Security Hardening
- No direct database access
- No direct object store access
- Read-only file systems
- Drop unnecessary capabilities
- Security profiles enabled

### 3. Resource Limits
- CPU limits
- Memory limits
- Disk limits
- Network limits

### 4. Access Control
- API-only access
- Read-only access where appropriate
- No privileged containers
- No root access

### 5. Monitoring
- Container health checks
- Container metrics
- Container logs
- Container security monitoring
