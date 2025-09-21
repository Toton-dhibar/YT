import React from 'react';

const DownloadList = ({ downloads, onDelete, onRefresh }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'downloading': return 'status-downloading';
      case 'completed': return 'status-completed';
      case 'error': return 'status-error';
      default: return 'status-downloading';
    }
  };

  const handleDownload = (id, filename) => {
    const link = document.createElement('a');
    link.href = `/api/download/${id}/file`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (downloads.length === 0) {
    return (
      <div className="downloads-container">
        <div className="empty-state">
          <h4>No downloads yet</h4>
          <p>Your downloads will appear here once you start downloading videos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="downloads-container">
      <div className="downloads-header">
        <h3>📥 Downloads ({downloads.length})</h3>
        <button 
          className="btn btn-secondary"
          onClick={onRefresh}
          title="Refresh downloads"
        >
          🔄 Refresh
        </button>
      </div>

      {downloads.map((download) => (
        <div key={download.id} className="download-item">
          <div className="download-header">
            <div className="download-id">ID: {download.id}</div>
            <div className={`download-status ${getStatusClass(download.status)}`}>
              {download.status}
            </div>
          </div>

          {download.status === 'downloading' && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${download.progress || 0}%` }}
              ></div>
            </div>
          )}

          {download.status === 'downloading' && (
            <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
              Progress: {(download.progress || 0).toFixed(1)}%
            </div>
          )}

          {download.status === 'error' && download.error && (
            <div className="error-message" style={{ marginTop: '1rem', marginBottom: '0' }}>
              Error: {download.error}
            </div>
          )}

          {download.filename && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.5rem', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              📁 {download.filename}
            </div>
          )}

          <div className="download-actions">
            {download.status === 'completed' && download.filename && (
              <button
                className="btn btn-primary"
                onClick={() => handleDownload(download.id, download.filename)}
              >
                💾 Download File
              </button>
            )}
            
            <button
              className="btn btn-danger"
              onClick={() => onDelete(download.id)}
              title="Delete download"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DownloadList;