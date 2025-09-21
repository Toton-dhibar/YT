from flask import Flask, render_template, request, jsonify, send_file
import yt_dlp
import os
import tempfile
import threading
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Store download progress
download_progress = {}

# Configure upload folder for cookies
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create upload directory
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class ProgressHook:
    def __init__(self, download_id):
        self.download_id = download_id
    
    def hook(self, d):
        if d['status'] == 'downloading':
            percent = d.get('_percent_str', '0%')
            speed = d.get('_speed_str', 'N/A')
            download_progress[self.download_id] = {
                'status': 'downloading',
                'percent': percent,
                'speed': speed
            }
        elif d['status'] == 'finished':
            download_progress[self.download_id] = {
                'status': 'finished',
                'filename': d['filename']
            }

@app.route('/upload_cookies', methods=['POST'])
def upload_cookies():
    try:
        if 'cookies_file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['cookies_file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to avoid filename conflicts
            timestamp = str(int(datetime.now().timestamp()))
            filename = f"{timestamp}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            return jsonify({
                'success': True,
                'filename': filename,
                'message': 'Cookies file uploaded successfully'
            })
        else:
            return jsonify({'error': 'Invalid file type. Only .txt files are allowed'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download_video():
    try:
        data = request.json
        url = data.get('url')
        format_type = data.get('format_type')  # 'video' or 'audio'
        quality = data.get('quality')
        format_ext = data.get('format')
        cookies_file = data.get('cookies_file')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        download_id = str(uuid.uuid4())
        
        # Start download in background
        thread = threading.Thread(
            target=perform_download,
            args=(download_id, url, format_type, quality, format_ext, cookies_file)
        )
        thread.start()
        
        return jsonify({
            'download_id': download_id,
            'message': 'Download started'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def perform_download(download_id, url, format_type, quality, format_ext, cookies_file):
    try:
        # Create downloads directory
        downloads_dir = 'downloads'
        os.makedirs(downloads_dir, exist_ok=True)
        
        # Configure yt-dlp options
        ydl_opts = {
            'outtmpl': f'{downloads_dir}/%(title)s.%(ext)s',
            'progress_hooks': [ProgressHook(download_id).hook],
            'extract_flat': False,
            'writethumbnail': False,
            'writeinfojson': False,
            'ignoreerrors': False,
            'no_warnings': False,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            'extractor_retries': 3,
            'retries': 3,
        }
        
        # Add cookies if provided
        if cookies_file:
            cookies_path = os.path.join(app.config['UPLOAD_FOLDER'], cookies_file)
            if os.path.exists(cookies_path):
                ydl_opts['cookiefile'] = cookies_path
            else:
                download_progress[download_id] = {
                    'status': 'error',
                    'error': 'Cookies file not found'
                }
                return
        
        # Configure format based on user selection
        if format_type == 'audio':
            if format_ext == 'mp3':
                ydl_opts['format'] = 'bestaudio/best'
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }]
            elif format_ext == 'flac':
                ydl_opts['format'] = 'bestaudio/best'
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'flac',
                }]
            elif format_ext == 'm4a':
                ydl_opts['format'] = 'bestaudio/best'
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'm4a',
                }]
        else:  # video
            # Map quality to format selector
            quality_map = {
                '4k': 'best[height<=2160]',
                '2k': 'best[height<=1440]', 
                '1080p': 'best[height<=1080]',
                '720p': 'best[height<=720]',
                '480p': 'best[height<=480]',
                '360p': 'best[height<=360]'
            }
            
            base_format = quality_map.get(quality, 'best')
            
            if format_ext == 'mp4':
                ydl_opts['format'] = f'{base_format}[ext=mp4]/best[ext=mp4]/{base_format}'
            elif format_ext == 'mkv':
                ydl_opts['format'] = f'{base_format}[ext=mkv]/best[ext=mkv]/{base_format}'
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegVideoConvertor',
                    'preferedformat': 'mkv',
                }]
            elif format_ext == 'mpeg':
                ydl_opts['format'] = base_format
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegVideoConvertor',
                    'preferedformat': 'mpeg',
                }]
        
        # Download the video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                # First, try to extract info to validate the URL
                info = ydl.extract_info(url, download=False)
                if not info:
                    download_progress[download_id] = {
                        'status': 'error',
                        'error': 'Could not extract video information'
                    }
                    return
                
                # Now perform the actual download
                ydl.download([url])
                
            except yt_dlp.utils.ExtractorError as e:
                error_msg = str(e)
                if "Private video" in error_msg:
                    error_msg = "This video is private. Try uploading a cookies file to access it."
                elif "Video unavailable" in error_msg:
                    error_msg = "This video is unavailable or has been removed."
                elif "Sign in to confirm your age" in error_msg:
                    error_msg = "Age-restricted content. Please upload a cookies file from a logged-in session."
                download_progress[download_id] = {
                    'status': 'error',
                    'error': f'Extraction failed: {error_msg}'
                }
                return
            except yt_dlp.utils.DownloadError as e:
                download_progress[download_id] = {
                    'status': 'error', 
                    'error': f'Download failed: {str(e)}'
                }
                return
            except Exception as e:
                download_progress[download_id] = {
                    'status': 'error',
                    'error': f'Unexpected error: {str(e)}'
                }
                return
            
    except Exception as e:
        download_progress[download_id] = {
            'status': 'error',
            'error': str(e)
        }

@app.route('/progress/<download_id>')
def get_progress(download_id):
    progress = download_progress.get(download_id, {'status': 'not_found'})
    return jsonify(progress)

@app.route('/downloads')
def list_downloads():
    downloads_dir = 'downloads'
    if not os.path.exists(downloads_dir):
        return jsonify([])
    
    files = []
    for filename in os.listdir(downloads_dir):
        file_path = os.path.join(downloads_dir, filename)
        if os.path.isfile(file_path):
            files.append({
                'filename': filename,
                'size': os.path.getsize(file_path),
                'created': datetime.fromtimestamp(os.path.getctime(file_path)).isoformat()
            })
    
    return jsonify(files)

@app.route('/download_file/<filename>')
def download_file(filename):
    try:
        file_path = os.path.join('downloads', filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)