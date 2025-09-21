#!/bin/bash

# Universal Video Downloader Installation Script
# For Ubuntu 22.04 VPS

echo "🎥 Universal Video Downloader Installation"
echo "=========================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please do not run as root. Create a regular user account first."
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install dependencies
echo "🔧 Installing dependencies..."
sudo apt install python3 python3-pip python3-venv ffmpeg git -y

# Check if we're in the YT directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: Please run this script from the YT directory"
    echo "   Make sure you have cloned the repository first:"
    echo "   git clone https://github.com/Toton-dhibar/YT.git"
    echo "   cd YT"
    exit 1
fi

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📋 Installing Python packages..."
pip install -r requirements.txt

# Create downloads directory
echo "📁 Creating downloads directory..."
mkdir -p downloads

# Make script executable
chmod +x install.sh

echo "✅ Installation completed successfully!"
echo ""
echo "🚀 To start the application:"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "🌐 Then open your browser to http://your-server-ip:5000"
echo ""
echo "🔒 For production deployment, consider using supervisor or systemd"
echo "   See README.md for detailed instructions"