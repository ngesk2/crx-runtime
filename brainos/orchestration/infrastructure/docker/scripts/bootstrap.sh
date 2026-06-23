#!/bin/bash
# Bootstrap Script for Brain Constitutional Infrastructure
# This script initializes the infrastructure from scratch

set -e

echo "=========================================="
echo "Brain Constitutional Infrastructure"
echo "Bootstrap Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi
print_success "Python 3 is installed"

echo ""

# Create directory structure
echo "Creating directory structure..."

DIRECTORIES=(
    "brain/constitutional/object_store"
    "brain/constitutional/event_log"
    "brain/constitutional/canonical_state"
    "brain/infrastructure/docker"
    "brain/infrastructure/terraform"
    "brain/infrastructure/compose"
    "brain/infrastructure/scripts"
    "brain/services/postgres"
    "brain/services/qdrant"
    "brain/services/neo4j"
    "brain/services/temporal"
    "brain/services/kafka"
    "brain/services/duckdb"
    "brain/services/opensearch"
    "brain/services/tika"
    "brain/services/ollama"
    "brain/config/environments"
    "brain/config/credentials"
    "brain/config/secrets"
    "brain/storage/hot"
    "brain/storage/warm"
    "brain/storage/cold"
    "brain/storage/objects"
    "brain/storage/events"
    "brain/storage/snapshots"
    "brain/storage/backups"
    "brain/data/raw"
    "brain/data/processed"
    "brain/data/normalized"
    "brain/data/vectors"
    "brain/data/graph"
    "brain/data/memory"
    "brain/data/analytics"
    "brain/logs/system"
    "brain/logs/security"
    "brain/logs/audit"
    "brain/docs/architecture"
    "brain/docs/operations"
    "brain/docs/recovery"
    "brain/docs/security"
)

for dir in "${DIRECTORIES[@]}"; do
    mkdir -p "$dir"
    print_success "Created directory: $dir"
done

echo ""

# Generate secrets
echo "Generating secrets..."

if [ ! -f "brain/config/environments/.env" ]; then
    python3 brain/infrastructure/docker/scripts/generate_secrets.py
    print_success "Secrets generated"
else
    print_warning ".env file already exists, skipping secret generation"
fi

echo ""

# Generate cryptographic keys
echo "Generating cryptographic keys..."

python3 brain/infrastructure/docker/scripts/generate_keys.py
print_success "Cryptographic keys generated"

echo ""

# Set permissions
echo "Setting permissions..."

chmod 700 brain/config/credentials
chmod 700 brain/config/secrets
chmod 700 brain/storage/hot
chmod 700 brain/storage/warm
chmod 700 brain/storage/cold
chmod 700 brain/logs/security
chmod 700 brain/logs/audit

print_success "Permissions set"

echo ""

# Initialize database schema
echo "Initializing database schema..."

if [ -f "brain/constitutional/canonical_state/schema.sql" ]; then
    # Schema will be applied by PostgreSQL on startup
    print_success "Database schema ready for initialization"
else
    print_error "Database schema file not found"
    exit 1
fi

echo ""

# Create .gitignore
echo "Creating .gitignore..."

cat > brain/.gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.production
.env.secrets
.env.backup

# Credentials
config/credentials/*
config/secrets/*

# Storage
storage/
data/

# Logs
logs/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Docker
.docker/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
*.bak
*.backup
EOF

print_success ".gitignore created"

echo ""

# Start services
echo "Starting services..."

cd brain/infrastructure/docker/compose

if [ -f ".env" ]; then
    cp ../../../config/environments/.env .env
    print_success "Environment configuration copied"
else
    print_warning "Environment configuration not found, using defaults"
fi

docker-compose up -d

print_success "Services started"

echo ""

# Wait for services to be ready
echo "Waiting for services to be ready..."

sleep 10

# Check PostgreSQL
echo "Checking PostgreSQL..."
if docker-compose exec -T postgres pg_isready -U brain_user; then
    print_success "PostgreSQL is ready"
else
    print_error "PostgreSQL is not ready"
fi

# Check Qdrant
echo "Checking Qdrant..."
if docker-compose exec -T qdrant curl -f http://localhost:6333/health; then
    print_success "Qdrant is ready"
else
    print_warning "Qdrant may not be ready yet"
fi

# Check Neo4j
echo "Checking Neo4j..."
if docker-compose exec -T neo4j curl -f http://localhost:7474; then
    print_success "Neo4j is ready"
else
    print_warning "Neo4j may not be ready yet"
fi

echo ""

# Verify database schema
echo "Verifying database schema..."

docker-compose exec -T postgres psql -U brain_user -d brain_db -c "\dt"

print_success "Database schema verified"

echo ""

# Create initial backup
echo "Creating initial backup..."

./scripts/daily_snapshot.sh

print_success "Initial backup created"

echo ""

echo "=========================================="
echo "Bootstrap Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify all services are running: docker-compose ps"
echo "2. Check service logs: docker-compose logs"
echo "3. Access services:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Qdrant: localhost:6333"
echo "   - Neo4j: localhost:7474"
echo "   - Temporal: localhost:7233"
echo "   - OpenSearch: localhost:9200"
echo "   - Tika: localhost:9998"
echo "   - Ollama: localhost:11434"
echo "   - Open WebUI: localhost:3000"
echo ""
echo "Documentation:"
echo "   - Architecture: brain/docs/architecture/"
echo "   - Operations: brain/docs/operations/"
echo "   - Recovery: brain/docs/recovery/"
echo "   - Security: brain/docs/security/"
echo ""
