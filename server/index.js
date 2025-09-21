const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from downloads directory
app.use('/downloads', express.static(path.join(__dirname, '../downloads')));

// Serve frontend build files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Ensure directories exist
const downloadsDir = path.join(__dirname, '../downloads');
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(downloadsDir);
fs.ensureDirSync(tempDir);

// Store active downloads
const activeDownloads = new Map();

// Supported formats
const VIDEO_FORMATS = {
  'mp4': 'mp4',
  'mkv': 'mkv', 
  'mpeg': 'mpeg'
};

const AUDIO_FORMATS = {
  'mp3': 'mp3',
  'flac': 'flac',
  'm4a': 'm4a'
};

const VIDEO_QUALITIES = ['4k', '2k', '1080p', '720p', '480p', '360p'];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'YT Downloader API is running' });
});

// Get supported formats
app.get('/api/formats', (req, res) => {
  res.json({
    video: {
      formats: VIDEO_FORMATS,
      qualities: VIDEO_QUALITIES
    },
    audio: {
      formats: AUDIO_FORMATS
    }
  });
});

// Get video info
app.post('/api/video-info', async (req, res) => {
  const { url, cookies } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const args = ['--dump-json', '--no-download'];
    
    if (cookies) {
      const cookiesFile = path.join(tempDir, `cookies_${uuidv4()}.txt`);
      await fs.writeFile(cookiesFile, cookies);
      args.push('--cookies', cookiesFile);
    }
    
    args.push(url);

    const ytdlp = spawn('yt-dlp', args);
    let stdout = '';
    let stderr = '';

    ytdlp.stdout.on('data', (data) => {
      stdout += data;
    });

    ytdlp.stderr.on('data', (data) => {
      stderr += data;
    });

    ytdlp.on('close', async (code) => {
      // Clean up cookies file
      if (cookies) {
        try {
          const cookiesFile = args[args.indexOf('--cookies') + 1];
          await fs.remove(cookiesFile);
        } catch (err) {
          console.log('Warning: Could not clean up cookies file');
        }
      }

      if (code === 0) {
        try {
          const videoInfo = JSON.parse(stdout);
          res.json({
            title: videoInfo.title,
            duration: videoInfo.duration,
            uploader: videoInfo.uploader,
            formats: videoInfo.formats?.map(f => ({
              format_id: f.format_id,
              ext: f.ext,
              quality: f.quality,
              filesize: f.filesize,
              vcodec: f.vcodec,
              acodec: f.acodec
            })) || []
          });
        } catch (parseError) {
          res.status(500).json({ error: 'Failed to parse video information' });
        }
      } else {
        res.status(400).json({ error: stderr || 'Failed to fetch video information' });
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download video
app.post('/api/download', async (req, res) => {
  const { url, format, quality, type, cookies } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const downloadId = uuidv4();
  const outputTemplate = path.join(downloadsDir, `${downloadId}.%(ext)s`);
  
  try {
    const args = [];
    
    // Add cookies if provided
    if (cookies) {
      const cookiesFile = path.join(tempDir, `cookies_${downloadId}.txt`);
      await fs.writeFile(cookiesFile, cookies);
      args.push('--cookies', cookiesFile);
    }

    // Configure format based on type
    if (type === 'audio') {
      args.push('-x', '--audio-format', format || 'mp3');
    } else {
      // Video download
      if (quality && format) {
        // Try to get best format with specified quality and format
        args.push('-f', `best[height<=${quality.replace('p', '')}][ext=${format}]/best[height<=${quality.replace('p', '')}]/best`);
      } else if (quality) {
        args.push('-f', `best[height<=${quality.replace('p', '')}]/best`);
      } else if (format) {
        args.push('-f', `best[ext=${format}]/best`);
      }
      
      // Convert to desired format if needed
      if (format && format !== 'mp4') {
        args.push('--recode-video', format);
      }
    }

    args.push('-o', outputTemplate, url);

    const ytdlp = spawn('yt-dlp', args);
    
    // Store download process
    activeDownloads.set(downloadId, {
      process: ytdlp,
      progress: 0,
      status: 'downloading',
      filename: null
    });

    let stderr = '';

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Parse progress
      const progressMatch = output.match(/(\d+\.\d+)%/);
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        if (activeDownloads.has(downloadId)) {
          activeDownloads.get(downloadId).progress = progress;
        }
      }
    });

    ytdlp.stderr.on('data', (data) => {
      stderr += data;
    });

    ytdlp.on('close', async (code) => {
      // Clean up cookies file
      if (cookies) {
        try {
          const cookiesFile = path.join(tempDir, `cookies_${downloadId}.txt`);
          await fs.remove(cookiesFile);
        } catch (err) {
          console.log('Warning: Could not clean up cookies file');
        }
      }

      if (code === 0) {
        // Find the downloaded file
        const files = await fs.readdir(downloadsDir);
        const downloadedFile = files.find(file => file.startsWith(downloadId));
        
        if (downloadedFile) {
          activeDownloads.set(downloadId, {
            ...activeDownloads.get(downloadId),
            status: 'completed',
            progress: 100,
            filename: downloadedFile
          });
        } else {
          activeDownloads.set(downloadId, {
            ...activeDownloads.get(downloadId),
            status: 'error',
            error: 'File not found after download'
          });
        }
      } else {
        activeDownloads.set(downloadId, {
          ...activeDownloads.get(downloadId),
          status: 'error',
          error: stderr || 'Download failed'
        });
      }
    });

    res.json({ downloadId, status: 'started' });

  } catch (error) {
    res.status(500).json({ error: 'Failed to start download' });
  }
});

// Get download status
app.get('/api/download/:id/status', (req, res) => {
  const { id } = req.params;
  const download = activeDownloads.get(id);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  const { process, ...downloadInfo } = download;
  res.json(downloadInfo);
});

// Download file
app.get('/api/download/:id/file', async (req, res) => {
  const { id } = req.params;
  const download = activeDownloads.get(id);
  
  if (!download || download.status !== 'completed' || !download.filename) {
    return res.status(404).json({ error: 'File not found or download not completed' });
  }

  const filePath = path.join(downloadsDir, download.filename);
  
  if (await fs.pathExists(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// List downloads
app.get('/api/downloads', async (req, res) => {
  const downloads = Array.from(activeDownloads.entries()).map(([id, download]) => {
    const { process, ...downloadInfo } = download;
    return { id, ...downloadInfo };
  });
  
  res.json(downloads);
});

// Delete download
app.delete('/api/download/:id', async (req, res) => {
  const { id } = req.params;
  const download = activeDownloads.get(id);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  // Kill process if still running
  if (download.process && !download.process.killed) {
    download.process.kill();
  }

  // Remove file if exists
  if (download.filename) {
    const filePath = path.join(downloadsDir, download.filename);
    try {
      await fs.remove(filePath);
    } catch (err) {
      console.log('Warning: Could not remove file:', err.message);
    }
  }

  activeDownloads.delete(id);
  res.json({ success: true });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`YT Downloader API server running on port ${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;