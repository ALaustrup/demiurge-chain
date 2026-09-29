#!/bin/bash
set -e

echo "SSL Setup for demiurge.cloud (demiurge.guru will be configured after DNS)"
echo ""

# Create directories
sudo mkdir -p /etc/nginx/ssl/demiurge.cloud
sudo mkdir -p /var/www/certbot
sudo chown -R ubuntu:ubuntu /var/www/certbot

# Stop nginx temporarily
docker compose -f /data/Demiurge-Blockchain/docker/docker-compose.production.yml stop nginx 2>/dev/null || true

# Obtain certificate for demiurge.cloud
echo "Requesting certificate for demiurge.cloud..."
sudo certbot certonly --standalone \
    --preferred-challenges http \
    -d demiurge.cloud \
    -d www.demiurge.cloud \
    --email admin@demiurge.cloud \
    --agree-tos \
    --non-interactive || {
    echo "Failed to obtain certificate for demiurge.cloud"
    exit 1
}

# Copy certificates
sudo cp /etc/letsencrypt/live/demiurge.cloud/fullchain.pem /etc/nginx/ssl/demiurge.cloud/
sudo cp /etc/letsencrypt/live/demiurge.cloud/privkey.pem /etc/nginx/ssl/demiurge.cloud/
sudo chmod 644 /etc/nginx/ssl/demiurge.cloud/*.pem

# Set up auto-renewal
sudo systemctl enable certbot.timer 2>/dev/null || true
sudo systemctl start certbot.timer 2>/dev/null || true

echo ""
echo "✓ Certificate for demiurge.cloud obtained!"
echo "Note: demiurge.guru will be configured once DNS is set up"
echo ""
