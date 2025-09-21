import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DownloadForm from './components/DownloadForm';
import DownloadList from './components/DownloadList';
import VideoInfo from './components/VideoInfo';
import './App.css';

function App() {
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDownloads = async () => {
    try {
      const response = await axios.get('/api/downloads');
      setDownloads(response.data);
    } catch (err) {
      console.error('Failed to fetch downloads:', err);
    }
  };

  useEffect(() => {
    fetchDownloads();
    const interval = setInterval(fetchDownloads, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const handleVideoInfo = async (url, cookies) => {
    setLoading(true);
    setError('');
    setVideoInfo(null);
    
    try {
      const response = await axios.post('/api/video-info', { url, cookies });
      setVideoInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch video information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (downloadData) => {
    try {
      const response = await axios.post('/api/download', downloadData);
      await fetchDownloads(); // Refresh downloads list
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to start download');
    }
  };

  const handleDeleteDownload = async (id) => {
    try {
      await axios.delete(`/api/download/${id}`);
      await fetchDownloads();
    } catch (err) {
      console.error('Failed to delete download:', err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎥 Multi-Platform Video Downloader</h1>
        <p>Download videos from YouTube, Facebook, Instagram and more!</p>
      </header>
      
      <main className="App-main">
        <div className="container">
          <DownloadForm 
            onVideoInfo={handleVideoInfo}
            onDownload={handleDownload}
            loading={loading}
            error={error}
          />
          
          {videoInfo && (
            <VideoInfo videoInfo={videoInfo} />
          )}
          
          <DownloadList 
            downloads={downloads}
            onDelete={handleDeleteDownload}
            onRefresh={fetchDownloads}
          />
        </div>
      </main>
    </div>
  );
}

export default App;