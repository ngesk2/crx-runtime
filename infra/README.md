# PING Infrastructure

Hybrid always-on infrastructure for PING runtime across Oracle Cloud Always Free and Fly.io.

## Architecture

**Oracle Cloud Always Free (Primary)**
- Ubuntu ARM instance
- Docker Compose stack
- Persistent storage
- Full PING runtime
- Monitoring and logging
- Scheduling

**Fly.io (Edge)**
- API Gateway
- Omniroute
- Webhook Receiver
- Lightweight workers
- Auto-scaling

## Directory Structure

```
infra/
├── oracle/              # Oracle Cloud deployment
│   ├── bootstrap.sh     # Initial server setup
│   └── deploy-oracle.sh # Deployment script
├── fly/                 # Fly.io deployment
│   ├── fly.toml         # Edge service config
│   ├── fly-api-gateway.toml
│   ├── fly-omniroute.toml
│   ├── fly-webhook.toml
│   ├── fly-worker.toml
│   └── deploy-fly.sh    # Fly.io deployment
├── docker/              # Docker Compose stack
│   ├── docker-compose.yml
│   └── config/          # Service configurations
├── bootstrap/           # Bootstrap scripts
│   └── bootstrap.sh     # Main bootstrap
├── .env.example         # Environment template
└── README.md            # This file
```

## Quick Start

### 1. Prerequisites

- Oracle Cloud Always Free account
- Fly.io account
- SSH key pair
- Domain name (optional)

### 2. Bootstrap Infrastructure

```bash
# Copy environment template
cp infra/.env.example infra/.env

# Edit with your credentials
vim infra/.env

# Run bootstrap
bash infra/bootstrap/bootstrap.sh
```

### 3. Manual Oracle Deployment

```bash
# Bootstrap Oracle instance
scp infra/oracle/bootstrap.sh ubuntu@<oracle-ip>:~/
ssh ubuntu@<oracle-ip> "sudo bash bootstrap.sh"

# Deploy to Oracle
export ORACLE_SSH_KEY=~/.ssh/id_rsa
export ORACLE_HOST=<oracle-ip>
bash infra/oracle/deploy-oracle.sh
```

### 4. Manual Fly.io Deployment

```bash
# Install Fly CLI
curl https://fly.io/install.sh | sh

# Authenticate
flyctl auth login

# Deploy
bash infra/fly/deploy-fly.sh
```

## Services

### Oracle Cloud Stack

**Core Services:**
- PostgreSQL (database)
- Qdrant (vector database)
- Temporal (workflow engine)
- Temporal UI (workflow dashboard)
- LiteLLM (LLM gateway)
- Ollama (local inference)

**PING Services:**
- ping-api (main API)
- ping-workers (temporal workers)
- mission-control (scheduler)

**Infrastructure:**
- Traefik (reverse proxy)
- Prometheus (metrics)
- Grafana (dashboards)
- Loki (logs)
- OTEL Collector (telemetry)

### Fly.io Stack

- ping-api-gateway (API gateway)
- ping-omniroute (routing)
- ping-webhook (webhook receiver)
- ping-worker (lightweight workers)

## Access URLs

### Oracle Cloud

- API: `http://<oracle-ip>:8000`
- Grafana: `http://<oracle-ip>:3000`
- Prometheus: `http://<oracle-ip>:9090`
- Temporal UI: `http://<oracle-ip>:8088`

### Fly.io

- API Gateway: `https://ping-api-gateway.fly.dev`
- Omniroute: `https://ping-omniroute.fly.dev`
- Webhook: `https://ping-webhook.fly.dev`

## Monitoring

### Grafana Dashboards

Access Grafana at `http://<oracle-ip>:3000`

Default credentials (change in .env):
- User: `admin`
- Password: `CHANGE_ME`

**Available Dashboards:**
- System Overview
- Docker Containers
- PostgreSQL
- Qdrant
- Temporal
- PING Services

### Logs

View logs with Loki in Grafana or directly:

```bash
# Oracle
ssh ubuntu@<oracle-ip> "docker-compose -f /opt/ping/docker-compose.yml logs -f"

# Fly.io
flyctl logs --app ping-api-gateway
```

## Scheduling

Scheduled tasks are configured via cron on Oracle:

```bash
# View cron jobs
ssh ubuntu@<oracle-ip> "cat /etc/cron.d/ping"

# View logs
ssh ubuntu@<oracle-ip> "tail -f /opt/ping/logs/*.log"
```

**Scheduled Tasks:**
- Hourly maintenance
- Daily executive brief
- Weekly engineering newsletter
- Connector health checks
- Repository inventory refresh

## Security

### SSH Access

- Password authentication disabled
- SSH key authentication required
- Fail2ban enabled

### Firewall

UFW configured to allow:
- SSH (22)
- HTTP (80)
- HTTPS (443)

All other ports blocked.

### Secrets

Never commit secrets to git. Use:
- Environment variables (.env)
- Vault (optional)
- Fly secrets

## Troubleshooting

### Oracle Deployment Issues

**Bootstrap fails:**
```bash
# Check bootstrap logs
ssh ubuntu@<oracle-ip> "sudo journalctl -xe"

# Re-run bootstrap
ssh ubuntu@<oracle-ip> "sudo bash /tmp/bootstrap.sh"
```

**Services not starting:**
```bash
# Check service status
ssh ubuntu@<oracle-ip> "systemctl status ping-runtime"

# View logs
ssh ubuntu@<oracle-ip> "journalctl -u ping-runtime -f"

# Check Docker Compose
ssh ubuntu@<oracle-ip> "cd /opt/ping && docker-compose ps"
```

### Fly.io Deployment Issues

**Authentication:**
```bash
flyctl auth whoami
flyctl auth login
```

**Deployment fails:**
```bash
flyctl logs --app <app-name>
flyctl status --app <app-name>
```

**Scaling issues:**
```bash
flyctl scale count 1 --app <app-name>
flyctl scale memory 1024 --app <app-name>
```

### Network Issues

**Can't access services:**
```bash
# Check firewall
ssh ubuntu@<oracle-ip> "sudo ufw status"

# Check Docker network
ssh ubuntu@<oracle-ip> "docker network ls"
ssh ubuntu@<oracle-ip> "docker network inspect ping_internal"
```

### Database Issues

**Postgres not healthy:**
```bash
ssh ubuntu@<oracle-ip> "docker-compose -f /opt/ping/docker-compose.yml logs postgres"
ssh ubuntu@<oracle-ip> "docker-compose -f /opt/ping/docker-compose.yml exec postgres pg_isready"
```

**Qdrant not healthy:**
```bash
ssh ubuntu@<oracle-ip> "docker-compose -f /opt/ping/docker-compose.yml logs qdrant"
ssh ubuntu@<oracle-ip> "curl http://localhost:6333/health"
```

## Maintenance

### Updates

```bash
# Update Oracle
ssh ubuntu@<oracle-ip> "sudo apt update && sudo apt upgrade -y"

# Restart services
ssh ubuntu@<oracle-ip> "systemctl restart ping-runtime"
```

### Backups

Postgres and Qdrant data is in named volumes. Backup:

```bash
# Backup volumes
ssh ubuntu@<oracle-ip> "docker run --rm -v ping_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data ."
ssh ubuntu@<oracle-ip> "docker run --rm -v ping_qdrant_data:/data -v $(pwd):/backup alpine tar czf /backup/qdrant-backup.tar.gz -C /data ."
```

### Scaling

**Oracle:**
- Limited by Always Free tier (4 OCPU, 24GB RAM)
- Adjust Docker Compose resource limits

**Fly.io:**
```bash
flyctl scale count 3 --app ping-api-gateway
flyctl scale memory 2048 --app ping-worker
```

## Cost

### Oracle Cloud Always Free

- Compute: Free (4 OCPU, 24GB RAM)
- Storage: Free (200GB)
- Bandwidth: Free (10TB/month)

**Total: $0/month**

### Fly.io

- Free tier: 3 shared 1GB VMs
- Additional: $5-10/month per VM

**Estimated: $5-20/month**

## Support

For issues:
1. Check troubleshooting section
2. Review logs in Grafana
3. Check service health
4. Review Oracle/Fly status pages

## Next Steps

After deployment:

1. Configure secrets in .env
2. Set up GitHub PAT for repository operations
3. Configure Vault if using
4. Test all services
5. Set up monitoring alerts
6. Configure custom domain (optional)
7. Set up backup strategy
