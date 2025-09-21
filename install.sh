#!/bin/bash

# Installation script for Ubuntu 22.04 VPS

echo "🚀 Installing YT Video Downloader..."

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

# Install Docker (optional, for containerized deployment)
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Clone repository (if not already cloned)
# git clone https://github.com/Toton-dhibar/YT.git
# cd YT

# Install dependencies
npm run install:all

# Create environment file
cp .env.example .env

# Build frontend
npm run build

echo "✅ Installation complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To start in development mode:"
echo "  npm run dev:server"
echo ""
echo "To use Docker:"
echo "  docker-compose up -d"
echo ""
echo "The application will be available at http://your-server-ip:3001"