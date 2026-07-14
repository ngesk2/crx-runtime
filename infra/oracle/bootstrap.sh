#!/bin/bash

set -e

echo "=== PING Oracle Cloud Bootstrap Script ==="
echo "This script sets up the Oracle Cloud Always Free instance for PING runtime"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# System updates
echo "Step 1: Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "Step 2: Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    tmux \
    ufw \
    fail2ban \
    ca-certificates \
    gnupg \
    lsb-release

# Configure swap (Oracle Free tier has limited RAM)
echo "Step 3: Configuring swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf
    sysctl -p
fi

# Install Docker
echo "Step 4: Installing Docker..."
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose standalone (for compatibility)
echo "Step 5: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Configure firewall
echo "Step 6: Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
echo "Step 7: Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF
systemctl enable fail2ban
systemctl start fail2ban

# Create PING directory structure
echo "Step 8: Creating directory structure..."
mkdir -p /opt/ping
mkdir -p /opt/ping/data
mkdir -p /opt/ping/logs
mkdir -p /opt/ping/config

# Set up SSH key authentication
echo "Step 9: Configuring SSH..."
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart sshd

# Create PING user
echo "Step 10: Creating PING user..."
if ! id -u ping &> /dev/null; then
    useradd -m -s /bin/bash ping
    usermod -aG docker ping
    echo "PING user created. Please add SSH public key to /home/ping/.ssh/authorized_keys"
fi

# Set permissions
echo "Step 11: Setting permissions..."
chown -R ping:ping /opt/ping

# Create systemd service for Docker Compose
echo "Step 12: Creating systemd service..."
cat > /etc/systemd/system/ping-runtime.service <<EOF
[Unit]
Description=PING Runtime
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/ping
ExecStart=/usr/local/bin/docker-compose -f /opt/ping/docker-compose.yml up -d
ExecStop=/usr/local/bin/docker-compose -f /opt/ping/docker-compose.yml down
TimeoutStartSec=0
User=ping

[Install]
WantedBy=multi-user.target
EOF
systemctl enable ping-runtime.service

# Set up cron jobs for scheduling
echo "Step 13: Setting up cron jobs..."
cat > /etc/cron.d/ping <<EOF
# PING Scheduled Tasks
# Hourly maintenance
0 * * * * ping cd /opt/ping && docker-compose exec -T ping-api python -m ping.scripts.hourly_maintenance >> /opt/ping/logs/maintenance.log 2>&1

# Daily executive brief
0 8 * * * ping cd /opt/ping && docker-compose exec -T ping-api python -m ping.scripts.daily_brief >> /opt/ping/logs/brief.log 2>&1

# Weekly engineering newsletter
0 9 * * 1 ping cd /opt/ping && docker-compose exec -T ping-api python -m ping.scripts.weekly_newsletter >> /opt/ping/logs/newsletter.log 2>&1

# Connector health checks
*/30 * * * * ping cd /opt/ping && docker-compose exec -T ping-api python -m ping.scripts.health_check >> /opt/ping/logs/health.log 2>&1

# Repository inventory refresh
0 2 * * * ping cd /opt/ping && docker-compose exec -T ping-api python -m ping.scripts.refresh_inventory >> /opt/ping/logs/inventory.log 2>&1
EOF
chmod 644 /etc/cron.d/ping

# Create log rotation
echo "Step 14: Setting up log rotation..."
cat > /etc/logrotate.d/ping <<EOF
/opt/ping/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ping ping
}
EOF

# Install Node Exporter for monitoring
echo "Step 15: Installing Node Exporter..."
if ! command -v /usr/local/bin/node_exporter &> /dev/null; then
    wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-arm64.tar.gz
    tar xvfz node_exporter-1.7.0.linux-arm64.tar.gz
    mv node_exporter-1.7.0.linux-arm64/node_exporter /usr/local/bin/
    rm -rf node_exporter-1.7.0.linux-arm64*
    
    cat > /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/node_exporter
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    systemctl enable node_exporter
    systemctl start node_exporter
fi

# Create environment file template
echo "Step 16: Creating environment file template..."
cat > /opt/ping/.env.example <<EOF
# Database
POSTGRES_DB=ping
POSTGRES_USER=ping
POSTGRES_PASSWORD=CHANGE_ME

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=CHANGE_ME

# ACME (for SSL)
ACME_EMAIL=your-email@example.com

# OpenAI (optional)
OPENAI_API_KEY=sk-...

# Other API keys as needed
EOF
chown ping:ping /opt/ping/.env.example

echo ""
echo "=== Bootstrap Complete ==="
echo ""
echo "Next steps:"
echo "1. Copy your Docker Compose files to /opt/ping/"
echo "2. Configure /opt/ping/.env with your secrets"
echo "3. Add your SSH public key to /home/ping/.ssh/authorized_keys"
echo "4. Start the runtime: systemctl start ping-runtime"
echo "5. Check status: systemctl status ping-runtime"
echo "6. View logs: journalctl -u ping-runtime -f"
echo ""
echo "Services will be available at:"
echo "- API: http://localhost:8000"
echo "- Grafana: http://localhost:3000"
echo "- Prometheus: http://localhost:9090"
echo "- Temporal UI: http://localhost:8088"
