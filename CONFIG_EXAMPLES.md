# 📋 Configuration Examples

This file contains example configurations for different deployment scenarios.

## Development Configuration (.env.development)
```env
NODE_ENV=development
PORT=3001
DOWNLOADS_DIR=./downloads
TEMP_DIR=./temp
MAX_CONCURRENT_DOWNLOADS=1
AUTO_CLEANUP_HOURS=2
DEBUG=true
```

## Production Configuration (.env.production)
```env
NODE_ENV=production
PORT=3001
DOWNLOADS_DIR=./downloads
TEMP_DIR=./temp
MAX_CONCURRENT_DOWNLOADS=2
AUTO_CLEANUP_HOURS=24
```

## High-Memory Server Configuration (.env.high-memory)
```env
NODE_ENV=production
PORT=3001
DOWNLOADS_DIR=./downloads
TEMP_DIR=./temp
MAX_CONCURRENT_DOWNLOADS=5
AUTO_CLEANUP_HOURS=48
```

## VPS 1GB RAM Configuration (.env.vps)
```env
NODE_ENV=production
PORT=3001
DOWNLOADS_DIR=./downloads
TEMP_DIR=./temp
MAX_CONCURRENT_DOWNLOADS=2
AUTO_CLEANUP_HOURS=12
MEMORY_LIMIT=800
```

## Docker Configuration (docker-compose.override.yml)
```yaml
version: '3.8'

services:
  yt-downloader:
    environment:
      - MAX_CONCURRENT_DOWNLOADS=3
      - AUTO_CLEANUP_HOURS=48
    volumes:
      - /host/path/downloads:/app/downloads
      - /host/path/temp:/app/temp
    ports:
      - "80:3001"  # Map to port 80
```

## Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Increase upload size for cookies file
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings for long downloads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }

    # Serve downloads directly through Nginx for better performance
    location /downloads/ {
        alias /path/to/YT/downloads/;
        autoindex off;
        add_header Content-Disposition "attachment";
    }
}
```

## PM2 Ecosystem Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'yt-downloader',
    script: 'server/index.js',
    instances: 1,
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      MAX_CONCURRENT_DOWNLOADS: 2
    },
    max_memory_restart: '800M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## Systemd Service Configuration
```ini
[Unit]
Description=YT Video Downloader
After=network.target

[Service]
Type=simple
User=yt-downloader
Group=yt-downloader
WorkingDirectory=/opt/yt-downloader
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=MAX_CONCURRENT_DOWNLOADS=2

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/opt/yt-downloader/downloads /opt/yt-downloader/temp

[Install]
WantedBy=multi-user.target
```

## Logrotate Configuration (/etc/logrotate.d/yt-downloader)
```
/opt/yt-downloader/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 yt-downloader yt-downloader
}
```

## Firewall Rules (UFW)
```bash
# Basic rules
ufw allow ssh
ufw allow 3001/tcp
ufw enable

# Or for Nginx proxy
ufw allow 'Nginx Full'
ufw allow ssh
ufw enable
```

## Cron Jobs for Maintenance
```bash
# Edit crontab
crontab -e

# Add these lines:
# Clean old downloads every day at 2 AM
0 2 * * * find /opt/yt-downloader/downloads -type f -mtime +7 -delete

# Update yt-dlp weekly
0 3 * * 0 /usr/bin/pip3 install -U yt-dlp

# Restart service weekly to clear memory
0 4 * * 0 systemctl restart yt-downloader
```

## Monitoring with Prometheus
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'yt-downloader'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
```