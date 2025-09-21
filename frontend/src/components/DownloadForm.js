import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DownloadForm = ({ onVideoInfo, onDownload, loading, error }) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [type, setType] = useState('video');
  const [cookies, setCookies] = useState('');
  const [useCookies, setUseCookies] = useState(false);
  const [formats, setFormats] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchFormats = async () => {
      try {
        const response = await axios.get('/api/formats');
        setFormats(response.data);
      } catch (err) {
        console.error('Failed to fetch formats:', err);
      }
    };
    fetchFormats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    await onVideoInfo(url, useCookies ? cookies : '');
  };

  const handleDownload = async () => {
    if (!url.trim()) return;

    setDownloading(true);
    setSuccess('');
    
    try {
      const downloadData = {
        url,
        format: type === 'audio' ? format : format,
        quality: type === 'video' ? quality : undefined,
        type,
        cookies: useCookies ? cookies : ''
      };
      
      await onDownload(downloadData);
      setSuccess('Download started successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const detectPlatform = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter';
    if (url.includes('tiktok.com')) return 'TikTok';
    return 'Unknown';
  };

  const currentFormats = type === 'video' ? formats.video?.formats : formats.audio?.formats;
  const qualities = formats.video?.qualities || [];

  return (
    <div className="form-container">
      <div className="supported-platforms">
        <h4>Supported Platforms</h4>
        <div className="platform-badges">
          <span className="platform-badge">📺 YouTube</span>
          <span className="platform-badge">📘 Facebook</span>
          <span className="platform-badge">📷 Instagram</span>
          <span className="platform-badge">🐦 Twitter</span>
          <span className="platform-badge">🎵 TikTok</span>
          <span className="platform-badge">🌐 And More!</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">Video URL</label>
          <input
            type="url"
            id="url"
            className="form-control"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your video URL here (YouTube, Facebook, Instagram, etc.)"
            required
          />
          {url && (
            <small style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem', display: 'block' }}>
              Platform detected: {detectPlatform(url)}
            </small>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Download Type</label>
            <select
              id="type"
              className="form-control"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                if (e.target.value === 'audio') {
                  setFormat('mp3');
                } else {
                  setFormat('mp4');
                }
              }}
            >
              <option value="video">Video</option>
              <option value="audio">Audio Only</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="format">Format</label>
            <select
              id="format"
              className="form-control"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {currentFormats && Object.entries(currentFormats).map(([key, value]) => (
                <option key={key} value={value}>{key.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {type === 'video' && (
            <div className="form-group">
              <label htmlFor="quality">Quality</label>
              <select
                id="quality"
                className="form-control"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                {qualities.map((q) => (
                  <option key={q} value={q}>{q.toUpperCase()}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={useCookies}
                onChange={(e) => setUseCookies(e.target.checked)}
              />
              Use cookies for authentication (for private videos)
            </label>
          </div>
          
          {useCookies && (
            <textarea
              className="form-control textarea"
              value={cookies}
              onChange={(e) => setCookies(e.target.value)}
              placeholder="Paste your cookies here (Netscape format)"
              rows={4}
            />
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <div className="btn-group">
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={loading || !url.trim()}
          >
            {loading && <span className="loading-spinner"></span>}
            Get Video Info
          </button>
          
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={downloading || !url.trim()}
          >
            {downloading && <span className="loading-spinner"></span>}
            Download Now
          </button>
        </div>
      </form>
    </div>
  );
};

export default DownloadForm;