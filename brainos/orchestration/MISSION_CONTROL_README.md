# PING Mission Control

Observability and Control Layer for PING Constitutional System

## Quick Start

### Prerequisites
- Docker and Docker Compose
- PostgreSQL credentials
- Qdrant API key
- Ollama running or accessible

### Start Mission Control

**Linux/Mac:**
```bash
cd brainos/orchestration
chmod +x start-mission-control.sh
./start-mission-control.sh
```

**Windows:**
```powershell
cd brainos\orchestration
.\start-mission-control.ps1
```

### Access Services

- **Mission Control API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Open WebUI:** http://localhost:3000

## API Endpoints

### Infrastructure
- `GET /infrastructure/status` - Status of all services
- `GET /health` - Health check

### Credentials
- `GET /credentials/inventory` - Credential inventory

### Memory
- `GET /memory/stats` - Memory statistics
- `GET /memory/search?query=...` - Search memory

### Qdrant
- `GET /qdrant/health` - Qdrant health status

### Ollama
- `GET /ollama/models` - Model inventory

### Events
- `GET /events/recent?limit=50` - Recent events
- `GET /events/summary` - Events summary

### Lineage
- `GET /lineage/graph` - Lineage graph

### Replay
- `GET /replay/status` - Replay status

### Backup
- `GET /backup/status` - Backup status

## Open WebUI Integration

### Custom Pages

Mission Control provides the following pages in Open WebUI:

1. **Memory Dashboard**
   - Total events
   - Projected events
   - Collection size
   - Search interface

2. **Events Observatory**
   - Recent events
   - Event types
   - Streams
   - Failures

3. **Infrastructure Dashboard**
   - Service status
   - Health checks
   - Dependencies

4. **Credentials Dashboard**
   - Credential inventory
   - Missing credentials
   - Risk levels

5. **Lineage Explorer**
   - Artifact graph
   - Parent-child relationships
   - Witness chains

6. **Replay Observatory**
   - Replay state
   - Event counts
   - Recoverability metrics

### Integration Method

Open WebUI talks to Mission Control API via HTTP:

```
Open WebUI → Mission Control API → PostgreSQL/Qdrant/Ollama
```

Open WebUI never directly accesses:
- PostgreSQL
- Qdrant
- Ollama

All access goes through Mission Control API.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Open WebUI                            │
│                  (Presentation Layer)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Mission Control API                          │
│                  (FastAPI)                                 │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │   Qdrant     │  │   Ollama     │
│  (Canonical) │  │ (Projection) │  │ (Inference)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Configuration

Environment variables are defined in `.env.mission-control`:

```bash
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=crx_runtime
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_password

QDRANT_URL=https://...
QDRANT_API_KEY=...
QDRANT_COLLECTION=constitutional_memory

OLLAMA_BASE_URL=http://ollama:11434

YAHOO_EMAIL=nolan.geske@yahoo.com
YAHOO_APP_PASSWORD=your_app_password

WEBUI_SECRET_KEY=change_this_secret_key
```

## Stopping Services

```bash
docker-compose -f infrastructure/docker/compose/docker-compose-mission-control.yml down
```

## Viewing Logs

```bash
docker-compose -f infrastructure/docker/compose/docker-compose-mission-control.yml logs -f
```

## Troubleshooting

### Mission Control not starting
- Check Docker is running
- Verify environment variables
- Check port 8000 is not in use

### PostgreSQL connection failed
- Verify PostgreSQL is running
- Check credentials in .env file
- Ensure network connectivity

### Qdrant connection failed
- Verify Qdrant URL and API key
- Check Qdrant service is accessible
- Ensure network connectivity

### Ollama connection failed
- Verify Ollama is running
- Check OLLAMA_BASE_URL
- Ensure Ollama has models installed

## Development

### Running locally without Docker

```bash
cd brainos/orchestration
pip install -r requirements-mission-control.txt
export $(cat config/environments/.env.mission-control | xargs)
uvicorn src.mission_control.app:app --reload
```

### Adding new endpoints

1. Add endpoint to `src/mission_control/app.py`
2. Add corresponding Pydantic model
3. Update documentation
4. Restart services

## Security Notes

- Never commit `.env.mission-control` with real credentials
- Change default passwords before production deployment
- Use HTTPS in production
- Implement authentication for production
- Restrict API access to trusted networks

## Next Steps

1. Implement projection worker heartbeat
2. Implement backup health checks
3. Add authentication to Mission Control API
4. Implement real-time event streaming
5. Add alerting for service failures
6. Implement credential rotation
