# 🎥 YT Video Downloader

A powerful, multi-platform video downloader with both frontend and backend support. Download videos from YouTube, Facebook, Instagram, Twitter, TikTok, and many more platforms with various format and quality options.

## ✨ Features

### 🎬 Multiple Video Formats
- **Video formats**: MP4, MKV, MPEG
- **Resolutions**: 4K, 2K, 1080p, 720p, 480p, 360p
- **Audio formats**: MP3, FLAC, M4A

### 🌐 Supported Platforms
- 📺 YouTube
- 📘 Facebook 
- 📷 Instagram
- 🐦 Twitter/X
- 🎵 TikTok
- 🌍 And many more!

### 🔐 Advanced Features
- **Cookie authentication** for private videos
- **Real-time download progress** tracking
- **Batch download management**
- **Optimized for 1GB RAM VPS** servers
- **Modern React frontend** with responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- yt-dlp
- ffmpeg

### Installation

#### Option 1: Auto Installation (Ubuntu 22.04)
```bash
chmod +x install.sh
./install.sh
```

#### Option 2: Manual Installation
```bash
# Install dependencies
npm run install:all

# Copy environment file
cp .env.example .env

# Build frontend
npm run build

# Start the server
npm start
```

#### Option 3: Docker Deployment
```bash
docker-compose up -d
```

## 🖥️ Usage

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Access the web interface**:
   Open `http://your-server-ip:3001` in your browser

3. **Download videos**:
   - Paste any supported video URL
   - Select format and quality
   - Add cookies if needed for private videos
   - Click "Download Now"

## 🔧 Configuration

### Environment Variables
Create a `.env` file from `.env.example`:

```env
NODE_ENV=production
PORT=3001
DOWNLOADS_DIR=./downloads
TEMP_DIR=./temp
MAX_CONCURRENT_DOWNLOADS=2
AUTO_CLEANUP_HOURS=24
```

### Memory Optimization (1GB RAM VPS)
The application is optimized for low-memory environments:
- Limited concurrent downloads
- Automatic cleanup of temporary files
- Efficient memory usage patterns
- Docker memory limits configured

## 📡 API Endpoints

### Get Video Information
```bash
POST /api/video-info
{
  "url": "https://youtube.com/watch?v=example",
  "cookies": "optional_cookies_string"
}
```

### Start Download
```bash
POST /api/download
{
  "url": "https://youtube.com/watch?v=example",
  "format": "mp4",
  "quality": "1080p",
  "type": "video",
  "cookies": "optional_cookies_string"
}
```

### Check Download Status
```bash
GET /api/download/{id}/status
```

### Download File
```bash
GET /api/download/{id}/file
```

## 🍪 Using Cookies

For downloading private or age-restricted videos:

1. **Get cookies** from your browser:
   - Install a browser extension like "Get cookies.txt"
   - Export cookies in Netscape format
   
2. **Add cookies** in the web interface:
   - Check "Use cookies for authentication"
   - Paste your cookies in the text area

## 🐳 Docker Deployment

### Build and Run
```bash
# Build the image
docker build -t yt-downloader .

# Run with docker-compose
docker-compose up -d
```

### Custom Configuration
Edit `docker-compose.yml` to:
- Change ports
- Mount different volumes
- Adjust memory limits

## 🛠️ Development

### Start Development Server
```bash
# Backend
npm run dev:server

# Frontend (in another terminal)
npm run dev:frontend
```

### Project Structure
```
.
├── server/             # Backend Node.js/Express
│   └── index.js       # Main server file
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   └── App.css
│   └── public/
├── downloads/         # Downloaded files
├── temp/             # Temporary files
├── Dockerfile        # Docker configuration
├── docker-compose.yml
└── install.sh        # Auto-installation script
```

## 🔒 Security Notes

- **Never commit** cookie files to version control
- **Rotate cookies** regularly for security
- **Use HTTPS** in production
- **Limit file access** permissions appropriately

## 🐛 Troubleshooting

### Common Issues

1. **"yt-dlp not found"**:
   ```bash
   pip3 install yt-dlp
   ```

2. **"FFmpeg not found"**:
   ```bash
   sudo apt install ffmpeg  # Ubuntu/Debian
   brew install ffmpeg      # macOS
   ```

3. **Memory issues on VPS**:
   - Reduce `MAX_CONCURRENT_DOWNLOADS`
   - Enable swap if available
   - Monitor with `htop`

4. **Download fails**:
   - Check video URL validity
   - Try with cookies for private videos
   - Verify yt-dlp is updated: `pip3 install -U yt-dlp`

## 📊 Performance

Optimized for 1GB RAM VPS:
- **Memory usage**: ~200-400MB
- **Concurrent downloads**: 2 (configurable)
- **Storage**: Depends on video sizes
- **CPU**: Minimal during downloads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for video downloading capabilities
- [React](https://reactjs.org/) for the frontend framework
- [Express](https://expressjs.com/) for the backend framework

---

**⚠️ Disclaimer**: This tool is for educational and personal use only. Please respect copyright laws and platform terms of service.