let currentDownloadId = null;
let progressInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('downloadForm');
    const formatType = document.getElementById('formatType');
    
    // Load downloads on page load
    refreshDownloads();
    
    // Handle form submission
    form.addEventListener('submit', handleDownload);
    
    // Handle format type change
    formatType.addEventListener('change', toggleOptions);
});

function toggleOptions() {
    const formatType = document.getElementById('formatType').value;
    const videoOptions = document.getElementById('videoOptions');
    const audioOptions = document.getElementById('audioOptions');
    
    if (formatType === 'video') {
        videoOptions.classList.remove('hidden');
        audioOptions.classList.add('hidden');
    } else {
        videoOptions.classList.add('hidden');
        audioOptions.classList.remove('hidden');
    }
}

async function handleDownload(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const url = formData.get('url');
    const formatType = formData.get('formatType');
    
    if (!url) {
        showError('Please enter a valid URL');
        return;
    }
    
    // Prepare download data
    const downloadData = {
        url: url,
        format_type: formatType
    };
    
    if (formatType === 'video') {
        downloadData.quality = formData.get('videoQuality');
        downloadData.format = formData.get('videoFormat');
    } else {
        downloadData.format = formData.get('audioFormat');
    }
    
    // Handle cookies file if uploaded
    const cookiesFile = document.getElementById('cookiesFile').files[0];
    if (cookiesFile) {
        // For simplicity, we'll just pass the filename
        // In a production app, you'd upload the file to the server first
        downloadData.cookies_file = cookiesFile.name;
    }
    
    try {
        setDownloadState(true);
        showProgressSection();
        
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(downloadData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentDownloadId = result.download_id;
            showSuccess('Download started successfully!');
            startProgressTracking();
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        showError('Error starting download: ' + error.message);
        setDownloadState(false);
        hideProgressSection();
    }
}

function startProgressTracking() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    progressInterval = setInterval(async () => {
        if (!currentDownloadId) return;
        
        try {
            const response = await fetch(`/progress/${currentDownloadId}`);
            const progress = await response.json();
            
            updateProgress(progress);
            
            if (progress.status === 'finished' || progress.status === 'error') {
                clearInterval(progressInterval);
                setDownloadState(false);
                
                if (progress.status === 'finished') {
                    showSuccess('Download completed successfully!');
                    refreshDownloads();
                } else {
                    showError('Download failed: ' + progress.error);
                }
                
                setTimeout(() => {
                    hideProgressSection();
                }, 3000);
            }
            
        } catch (error) {
            console.error('Error tracking progress:', error);
        }
    }, 1000);
}

function updateProgress(progress) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const speedText = document.getElementById('speedText');
    const downloadStatus = document.getElementById('downloadStatus');
    
    if (progress.status === 'downloading') {
        const percent = progress.percent || '0%';
        const percentValue = parseFloat(percent.replace('%', ''));
        
        progressFill.style.width = percent;
        progressText.textContent = percent;
        speedText.textContent = progress.speed || '';
        downloadStatus.textContent = 'Downloading...';
        downloadStatus.className = '';
        
    } else if (progress.status === 'finished') {
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
        speedText.textContent = '';
        downloadStatus.textContent = 'Download completed!';
        downloadStatus.className = 'success';
        
    } else if (progress.status === 'error') {
        downloadStatus.textContent = 'Download failed: ' + progress.error;
        downloadStatus.className = 'error';
    }
}

async function refreshDownloads() {
    try {
        const response = await fetch('/downloads');
        const downloads = await response.json();
        
        const downloadsList = document.getElementById('downloadsList');
        
        if (downloads.length === 0) {
            downloadsList.innerHTML = '<p>No downloads yet</p>';
            return;
        }
        
        const downloadsHTML = downloads.map(file => `
            <div class="download-item">
                <div class="download-info">
                    <h4>${file.filename}</h4>
                    <p>Size: ${formatFileSize(file.size)} | Created: ${formatDate(file.created)}</p>
                </div>
                <a href="/download_file/${encodeURIComponent(file.filename)}" 
                   class="download-link" 
                   download>
                    Download
                </a>
            </div>
        `).join('');
        
        downloadsList.innerHTML = downloadsHTML;
        
    } catch (error) {
        console.error('Error loading downloads:', error);
        showError('Error loading downloads list');
    }
}

function setDownloadState(downloading) {
    const downloadBtn = document.getElementById('downloadBtn');
    const btnText = downloadBtn.querySelector('.btn-text');
    const btnLoading = downloadBtn.querySelector('.btn-loading');
    
    downloadBtn.disabled = downloading;
    
    if (downloading) {
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

function showProgressSection() {
    const progressSection = document.getElementById('progressSection');
    progressSection.classList.remove('hidden');
    
    // Reset progress
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    document.getElementById('speedText').textContent = '';
    document.getElementById('downloadStatus').textContent = 'Starting download...';
    document.getElementById('downloadStatus').className = '';
}

function hideProgressSection() {
    const progressSection = document.getElementById('progressSection');
    progressSection.classList.add('hidden');
}

function showError(message) {
    removeExistingMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const form = document.querySelector('.download-form');
    form.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    removeExistingMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    
    const form = document.querySelector('.download-form');
    form.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

function removeExistingMessages() {
    const existing = document.querySelectorAll('.error, .success');
    existing.forEach(el => el.remove());
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}