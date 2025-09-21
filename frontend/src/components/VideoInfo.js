import React from 'react';

const VideoInfo = ({ videoInfo }) => {
  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="video-info">
      <h3>📹 Video Information</h3>
      
      <div className="video-details">
        <div className="detail-item">
          <div className="detail-label">Title</div>
          <div className="detail-value">{videoInfo.title}</div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Duration</div>
          <div className="detail-value">{formatDuration(videoInfo.duration)}</div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Uploader</div>
          <div className="detail-value">{videoInfo.uploader}</div>
        </div>
        
        <div className="detail-item">
          <div className="detail-label">Available Formats</div>
          <div className="detail-value">{videoInfo.formats?.length || 0} formats</div>
        </div>
      </div>

      {videoInfo.formats && videoInfo.formats.length > 0 && (
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}>
            View Available Formats
          </summary>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Format</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Quality</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Size</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Codecs</th>
                </tr>
              </thead>
              <tbody>
                {videoInfo.formats.slice(0, 10).map((format, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{ padding: '0.5rem' }}>{format.ext}</td>
                    <td style={{ padding: '0.5rem' }}>{format.quality || 'Unknown'}</td>
                    <td style={{ padding: '0.5rem' }}>{formatFileSize(format.filesize)}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                      {format.vcodec !== 'none' && format.vcodec && (
                        <span>V: {format.vcodec}</span>
                      )}
                      {format.acodec !== 'none' && format.acodec && (
                        <span>{format.vcodec !== 'none' ? ', ' : ''}A: {format.acodec}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {videoInfo.formats.length > 10 && (
              <p style={{ textAlign: 'center', margin: '1rem 0', color: 'rgba(255, 255, 255, 0.7)' }}>
                ... and {videoInfo.formats.length - 10} more formats
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

export default VideoInfo;