#!/bin/bash

# Test script for YT Video Downloader
echo "🧪 Testing YT Video Downloader..."

# Test 1: Check if server is running
echo "1. Testing server health..."
HEALTH=$(curl -s http://localhost:3001/api/health)
if [[ $HEALTH == *"OK"* ]]; then
    echo "   ✅ Server is running"
else
    echo "   ❌ Server not responding"
    exit 1
fi

# Test 2: Check formats endpoint
echo "2. Testing formats endpoint..."
FORMATS=$(curl -s http://localhost:3001/api/formats)
if [[ $FORMATS == *"mp4"* ]] && [[ $FORMATS == *"1080p"* ]]; then
    echo "   ✅ Formats endpoint working"
else
    echo "   ❌ Formats endpoint failed"
    exit 1
fi

# Test 3: Check downloads endpoint
echo "3. Testing downloads endpoint..."
DOWNLOADS=$(curl -s http://localhost:3001/api/downloads)
if [[ $DOWNLOADS == "[]" ]]; then
    echo "   ✅ Downloads endpoint working (empty list)"
else
    echo "   ✅ Downloads endpoint working"
fi

# Test 4: Check frontend build exists
echo "4. Checking frontend build..."
if [ -d "frontend/build" ]; then
    echo "   ✅ Frontend build exists"
else
    echo "   ❌ Frontend build missing"
fi

# Test 5: Check required directories
echo "5. Checking required directories..."
if [ -d "downloads" ] && [ -d "temp" ]; then
    echo "   ✅ Required directories exist"
else
    echo "   ❌ Required directories missing"
fi

# Test 6: Check yt-dlp installation
echo "6. Checking yt-dlp installation..."
if command -v yt-dlp &> /dev/null; then
    echo "   ✅ yt-dlp is installed"
    YT_DLP_VERSION=$(yt-dlp --version)
    echo "   📦 Version: $YT_DLP_VERSION"
else
    echo "   ❌ yt-dlp not found"
fi

# Test 7: Check dependencies
echo "7. Checking Node.js dependencies..."
if [ -d "node_modules" ] && [ -d "frontend/node_modules" ]; then
    echo "   ✅ All dependencies installed"
else
    echo "   ❌ Some dependencies missing"
fi

echo ""
echo "🎉 Basic tests completed!"
echo "💡 To test actual downloads, deploy to a server with internet access."
echo ""
echo "📋 Quick Start Commands:"
echo "   npm start                 # Start production server"
echo "   npm run dev:server        # Start development server"
echo "   docker-compose up -d      # Start with Docker"
echo ""
echo "🌐 Access the application at: http://localhost:3001"