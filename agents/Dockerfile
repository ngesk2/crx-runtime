# CRX Agent Base Container
FROM python:3.11-slim

LABEL maintainer="CRX KnowledgeOS"
LABEL description="Base container for CRX agents"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /crx

# Copy workspace structure
COPY authoritative/ /crx/authoritative/
COPY derived/ /crx/derived/
COPY experimental/ /crx/experimental/

# Install Python dependencies
COPY requirements.txt /crx/
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent scripts
COPY agents/ /crx/agents/

# Set environment variables
ENV PYTHONPATH=/crx
ENV CRX_WORKSPACE=/crx
ENV CRX_AUTHORITATIVE=/crx/authoritative
ENV CRX_DERIVED=/crx/derived
ENV CRX_EXPERIMENTAL=/crx/experimental

# Default command
CMD ["python", "-m", "agents.base"]
