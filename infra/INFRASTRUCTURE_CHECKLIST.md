# Infrastructure Checklist

## Oracle Cloud Always Free

### Prerequisites
- [ ] Oracle Cloud account created
- [ ] SSH key pair generated
- [ ] Oracle Cloud SSH key uploaded to console
- [ ] Ubuntu ARM instance provisioned (Always Free tier)
- [ ] Instance public IP noted
- [ ] Security group allows SSH (22), HTTP (80), HTTPS (443)

### Bootstrap
- [ ] SSH to Oracle instance: `ssh ubuntu@<oracle-ip>`
- [ ] Run bootstrap script: `sudo bash bootstrap.sh`
- [ ] Verify Docker installed: `docker --version`
- [ ] Verify Docker Compose installed: `docker-compose --version`
- [ ] Verify swap configured: `free -h`
- [ ] Verify firewall configured: `sudo ufw status`
- [ ] Verify fail2ban running: `sudo systemctl status fail2ban`
- [ ] Verify Node Exporter running: `sudo systemctl status node_exporter`
- [ ] Verify PING user created: `id ping`
- [ ] Verify PING user in docker group: `groups ping`

### Deployment
- [ ] Copy Docker Compose files to `/opt/ping/`
- [ ] Copy application code to `/opt/ping/app/`
- [ ] Configure `/opt/ping/.env` with secrets
- [ ] Add SSH public key to `/home/ping/.ssh/authorized_keys`
- [ ] Start runtime: `sudo systemctl start ping-runtime`
- [ ] Check status: `sudo systemctl status ping-runtime`
- [ ] View logs: `sudo journalctl -u ping-runtime -f`

### Service Health
- [ ] PostgreSQL healthy: `docker-compose exec postgres pg_isready`
- [ ] Qdrant healthy: `curl http://localhost:6333/health`
- [ ] Temporal healthy: `curl http://localhost:7233`
- [ ] Temporal UI accessible: `http://localhost:8088`
- [ ] LiteLLM healthy: `curl http://localhost:4000/health`
- [ ] Ollama healthy: `curl http://localhost:11434/api/tags`
- [ ] PING API healthy: `curl http://localhost:8000/health`
- [ ] Traefik dashboard accessible: `http://localhost:8080`

### Monitoring
- [ ] Prometheus accessible: `http://localhost:9090`
- [ ] Grafana accessible: `http://localhost:3000`
- [ ] Grafana datasources configured
- [ ] Grafana dashboards imported
- [ ] Loki accessible: `http://localhost:3100`
- [ ] OTEL Collector running: `docker-compose ps otel-collector`
- [ ] Metrics being scraped: Check Prometheus targets
- [ ] Logs being collected: Check Loki

### Scheduling
- [ ] Cron jobs installed: `cat /etc/cron.d/ping`
- [ ] Log rotation configured: `cat /etc/logrotate.d/ping`
- [ ] Systemd service enabled: `systemctl is-enabled ping-runtime`
- [ ] Scheduled tasks directory exists: `/opt/ping/scripts/`

### Security
- [ ] SSH password authentication disabled
- [ ] SSH key authentication working
- [ ] Fail2ban enabled and configured
- [ ] Firewall rules correct: `sudo ufw status verbose`
- [ ] Only required ports open
- [ ] Automatic security updates enabled
- [ ] Postgres not exposed publicly
- [ ] Qdrant not exposed publicly
- [ ] Temporal not exposed publicly

### Storage
- [ ] Named volumes created: `docker volume ls`
- [ ] Postgres data persistent: Check volume mount
- [ ] Qdrant data persistent: Check volume mount
- [ ] Ollama data persistent: Check volume mount
- [ ] Grafana data persistent: Check volume mount
- [ ] Prometheus data persistent: Check volume mount
- [ ] Loki data persistent: Check volume mount
- [ ] Traefik letsencrypt volume created

### Networking
- [ ] Internal network created: `docker network ls`
- [ ] API network created
- [ ] Services on correct networks
- [ ] Traefik reverse proxy configured
- [ ] SSL/TLS ready (ACME configured)
- [ ] DNS configured (if using custom domain)

## Fly.io

### Prerequisites
- [ ] Fly.io account created
- [ ] Fly CLI installed: `flyctl version`
- [ ] Fly CLI authenticated: `flyctl auth whoami`
- [ ] Fly.io token obtained

### Deployment
- [ ] API Gateway deployed: `flyctl deploy --config infra/fly/fly-api-gateway.toml`
- [ ] Omniroute deployed: `flyctl deploy --config infra/fly/fly-omniroute.toml`
- [ ] Webhook deployed: `flyctl deploy --config infra/fly/fly-webhook.toml`
- [ ] Worker deployed: `flyctl deploy --config infra/fly/fly-worker.toml`

### Configuration
- [ ] Oracle Postgres URL secret set
- [ ] Oracle Qdrant URL secret set
- [ ] Oracle Temporal URL secret set
- [ ] Scaling configured: `flyctl scale count`
- [ ] Memory limits configured: `flyctl scale memory`

### Health
- [ ] API Gateway healthy: `curl https://ping-api-gateway.fly.dev/health`
- [ ] Omniroute healthy: `curl https://ping-omniroute.fly.dev/health`
- [ ] Webhook healthy: `curl https://ping-webhook.fly.dev/health`
- [ ] Worker running: `flyctl status --app ping-worker`

### Monitoring
- [ ] Metrics endpoint accessible: `flyctl dashboard --app ping-api-gateway`
- [ ] Logs accessible: `flyctl logs --app ping-api-gateway`
- [ ] Health checks passing

## Secrets

### Required Secrets
- [ ] POSTGRES_PASSWORD set
- [ ] POSTGRES_USER set
- [ ] POSTGRES_DB set
- [ ] GRAFANA_USER set
- [ ] GRAFANA_PASSWORD set
- [ ] ACME_EMAIL set

### Optional Secrets
- [ ] OPENAI_API_KEY set (if using OpenAI)
- [ ] ANTHROPIC_API_KEY set (if using Anthropic)
- [ ] GITHUB_PAT set (if using GitHub)
- [ ] VAULT_ADDR set (if using Vault)
- [ ] VAULT_TOKEN set (if using Vault)

### Oracle Cloud SDK (optional)
- [ ] OCI_TENANCY_ID set
- [ ] OCI_USER_ID set
- [ ] OCI_FINGERPRINT set
- [ ] OCI_PRIVATE_KEY_PATH set
- [ ] OCI_REGION set

## Remaining Manual Steps

### Post-Deployment
1. [ ] Configure Grafana dashboards for specific use cases
2. [ ] Set up alerting rules in Prometheus
3. [ ] Configure custom domain (if applicable)
4. [ ] Set up DNS records
5. [ ] Configure SSL certificates (if not using Let's Encrypt)
6. [ ] Set up backup strategy for volumes
7. [ ] Test disaster recovery procedures
8. [ ] Configure log retention policies
9. [ ] Set up monitoring alerts (PagerDuty, etc.)
10. [ ] Document runbook for common operations

### Application Configuration
1. [ ] Configure GitHub repositories for monitoring
2. [ ] Set up initial PING missions
3. [ ] Configure connector credentials
4. [ ] Test end-to-end workflows
5. [ ] Configure notification channels
6. [ ] Set up user authentication/authorization
7. [ ] Configure rate limits
8. [ ] Set up API keys for external services

### Operational
1. [ ] Create operational runbooks
2. [ ] Set up on-call procedures
3. [ ] Configure incident response process
4. [ ] Set up capacity planning
5. [ ] Configure cost monitoring
6. [ ] Set up security scanning
7. [ ] Configure compliance monitoring
8. [ ] Set up performance baselines

## Verification

### End-to-End Tests
- [ ] API responds to health check
- [ ] Can create mission via API
- [ ] Mission executes successfully
- [ ] Results stored in database
- [ ] Metrics appear in Grafana
- [ ] Logs appear in Loki
- [ ] Temporal workflows visible in UI
- [ ] Fly.io edge services accessible
- [ ] Oracle to Fly.io communication works
- [ ] Scheduled tasks execute

### Performance
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] Vector search time < 200ms
- [ ] LLM inference time acceptable
- [ ] Memory usage within limits
- [ ] CPU usage within limits
- [ ] Disk usage stable
- [ ] Network latency acceptable

### Security
- [ ] No exposed admin interfaces
- [ ] All secrets encrypted at rest
- [ ] TLS enabled everywhere
- [ ] No default passwords
- [ ] SSH access restricted
- [ ] Firewall rules correct
- [ ] No unnecessary services exposed
- [ ] Security scan passes

## Notes

- Infrastructure is ready for Hermes Runtime deployment
- All services are containerized and orchestrated
- Monitoring and logging are centralized
- Secrets management is in place
- Deployment is reproducible via IaC
- Scaling is configured for both platforms
- Backup strategy needs to be implemented
- Disaster recovery procedures need to be documented
