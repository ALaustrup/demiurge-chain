# Setup Monitoring and Alerting
# Configures monitoring for production server

$ErrorActionPreference = "Stop"

Write-Host "📊 Setting Up Monitoring and Alerting..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER = "51.210.209.112"
$SSH_USER = "ubuntu"

Write-Host "📋 Monitoring Components" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Application Logs (journalctl)" -ForegroundColor Gray
Write-Host "2. System Metrics (htop, iotop)" -ForegroundColor Gray
Write-Host "3. Database Monitoring (pg_stat_statements)" -ForegroundColor Gray
Write-Host "4. Redis Monitoring (redis-cli INFO)" -ForegroundColor Gray
Write-Host "5. Nginx Access/Error Logs" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 Setup Instructions" -ForegroundColor Yellow
Write-Host ""

# 1. Log Rotation
Write-Host "1. Configure Log Rotation:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Create /etc/logrotate.d/demiurge:" -ForegroundColor Gray
Write-Host @"
/var/log/demiurge/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        systemctl reload qor-auth || true
    endscript
}
"@ -ForegroundColor DarkGray
Write-Host ""

# 2. Health Check Script
Write-Host "2. Create Health Check Script:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Create /opt/demiurge/scripts/health-check.sh:" -ForegroundColor Gray
Write-Host @"
#!/bin/bash
# Health check script for monitoring

# Check QOR Auth
if ! curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "QOR Auth service is down!"
    exit 1
fi

# Check Hub
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Hub service is down!"
    exit 1
fi

# Check PostgreSQL
if ! pg_isready -U qor_auth > /dev/null 2>&1; then
    echo "PostgreSQL is down!"
    exit 1
fi

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Redis is down!"
    exit 1
fi

echo "All services are healthy"
exit 0
"@ -ForegroundColor DarkGray
Write-Host ""

# 3. Monitoring Script
Write-Host "3. Create Monitoring Script:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Create /opt/demiurge/scripts/monitor.sh:" -ForegroundColor Gray
Write-Host @"
#!/bin/bash
# System monitoring script

echo "=== System Metrics ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}'

echo ""
echo "Memory Usage:"
free -h

echo ""
echo "Disk Usage:"
df -h /

echo ""
echo "=== Service Status ==="
systemctl status qor-auth --no-pager -l | head -10

echo ""
echo "=== Database Connections ==="
psql -U qor_auth -d qor_auth -c "SELECT count(*) FROM pg_stat_activity;"

echo ""
echo "=== Redis Memory ==="
redis-cli INFO memory | grep used_memory_human
"@ -ForegroundColor DarkGray
Write-Host ""

# 4. Alert Configuration
Write-Host "4. Set Up Alerts:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Option A: Email Alerts (using mail)" -ForegroundColor Gray
Write-Host "   Option B: Slack Webhooks" -ForegroundColor Gray
Write-Host "   Option C: Discord Webhooks" -ForegroundColor Gray
Write-Host "   Option D: Custom monitoring service (Prometheus/Grafana)" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 Quick Setup Commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Make scripts executable" -ForegroundColor DarkGray
Write-Host "chmod +x /opt/demiurge/scripts/*.sh" -ForegroundColor DarkGray
Write-Host ""
Write-Host "# Add to crontab for periodic checks" -ForegroundColor DarkGray
Write-Host "crontab -e" -ForegroundColor DarkGray
Write-Host "# Add: */5 * * * * /opt/demiurge/scripts/health-check.sh" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Monitoring setup instructions provided!" -ForegroundColor Green
