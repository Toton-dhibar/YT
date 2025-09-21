# 🚀 Deployment Guide for YT Video Downloader

## Prerequisites for 1GB RAM Ubuntu 22.04 VPS

### System Requirements
- Ubuntu 22.04 LTS
- 1GB RAM (minimum)
- 10GB free disk space
- Root or sudo access

## Quick Deployment

### Option 1: Auto Installation (Recommended)
```bash
# Clone the repository
git clone https://github.com/Toton-dhibar/YT.git
cd YT

# Run auto-install script
chmod +x install.sh
./install.sh

# Start the application
npm start
```

### Option 2: Manual Installation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and pip
sudo apt install -y python3 python3-pip

# Install yt-dlp
sudo pip3 install yt-dlp

# Install FFmpeg
sudo apt install -y ffmpeg

# Clone and setup
git clone https://github.com/Toton-dhibar/YT.git
cd YT
npm run install:all
cp .env.example .env
npm run build
```

### Option 3: Docker Deployment
```bash
# Install Docker
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Clone and deploy
git clone https://github.com/Toton-dhibar/YT.git
cd YT
docker-compose up -d
```

## Configuration

### Environment Variables (.env)
```env
NODE_ENV=production
PORT=3001
DOWNLOADS_DIR=./downloads
TEMP_DIR=./temp
MAX_CONCURRENT_DOWNLOADS=2
AUTO_CLEANUP_HOURS=24
```

### Memory Optimization for 1GB VPS
1. **Limit concurrent downloads**: Set `MAX_CONCURRENT_DOWNLOADS=2`
2. **Enable swap** (if not already):
   ```bash
   sudo fallocate -l 1G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
3. **Monitor memory usage**:
   ```bash
   htop
   # or
   free -h
   ```

## Firewall Configuration

```bash
# Allow SSH (if using UFW)
sudo ufw allow ssh

# Allow the application port
sudo ufw allow 3001

# Enable firewall
sudo ufw enable
```

## SSL/HTTPS Setup (Production)

### Using Nginx as Reverse Proxy
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/yt-downloader
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/yt-downloader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Process Management

### Using PM2 (Recommended)
```bash
# Install PM2
sudo npm install -g pm2

# Start the application
pm2 start server/index.js --name "yt-downloader"

# Save PM2 configuration
pm2 save

# Setup auto-restart on boot
pm2 startup
```

### Using systemd
```bash
# Create service file
sudo nano /etc/systemd/system/yt-downloader.service
```

```ini
[Unit]
Description=YT Video Downloader
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/YT
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable yt-downloader
sudo systemctl start yt-downloader
sudo systemctl status yt-downloader
```

## Monitoring and Maintenance

### Log Monitoring
```bash
# PM2 logs
pm2 logs yt-downloader

# systemd logs
sudo journalctl -u yt-downloader -f
```

### Disk Space Management
```bash
# Check disk usage
df -h

# Clean old downloads (manual)
find ./downloads -type f -mtime +7 -delete

# Set up automatic cleanup (crontab)
crontab -e
# Add: 0 2 * * * find /path/to/YT/downloads -type f -mtime +7 -delete
```

### Update yt-dlp Regularly
```bash
# Update yt-dlp
sudo pip3 install -U yt-dlp

# Restart application
pm2 restart yt-downloader
# or
sudo systemctl restart yt-downloader
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   sudo lsof -i :3001
   sudo kill <PID>
   ```

2. **Permission errors**:
   ```bash
   sudo chown -R $USER:$USER /path/to/YT
   chmod -R 755 /path/to/YT
   ```

3. **Memory issues**:
   ```bash
   # Check memory usage
   free -h
   
   # Restart application
   pm2 restart yt-downloader
   ```

4. **yt-dlp fails**:
   ```bash
   # Update yt-dlp
   sudo pip3 install -U yt-dlp
   
   # Check if FFmpeg is installed
   ffmpeg -version
   ```

## Security Considerations

1. **Use a firewall** and only open necessary ports
2. **Regular updates**: Keep system and dependencies updated
3. **User permissions**: Don't run as root in production
4. **Rate limiting**: Consider implementing rate limiting for public deployments
5. **HTTPS**: Always use SSL/TLS in production

## Performance Tips for 1GB VPS

1. **Limit concurrent downloads**: Max 2 downloads at once
2. **Regular cleanup**: Remove old downloaded files
3. **Monitor resources**: Use `htop` to watch memory/CPU usage
4. **Optimize yt-dlp**: Use specific format selection to reduce processing
5. **Consider swap**: Add swap space for better memory management

---

🎉 Your YT Video Downloader is now ready for production use!