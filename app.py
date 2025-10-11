from flask import Flask, render_template, request, jsonify
import requests
import re
from urllib.parse import quote, unquote, urlparse
import os

app = Flask(__name__)

def is_valid_terabox_url(url):
    """
    Validate that the URL is from a Terabox domain
    """
    try:
        parsed = urlparse(url)
        allowed_domains = ['terabox.com', 'www.terabox.com', '1024terabox.com', 'www.1024terabox.com']
        return parsed.netloc.lower() in allowed_domains
    except (ValueError, AttributeError):
        return False

def extract_terabox_video_url(terabox_url):
    """
    Extract direct video URL from Terabox share link
    """
    try:
        # Clean the URL
        terabox_url = terabox_url.strip()
        
        # Validate URL is from Terabox domain
        if not is_valid_terabox_url(terabox_url):
            return None, "Invalid Terabox URL. Please use a valid Terabox domain."
        
        # Get the page content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(terabox_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return None, f"Failed to fetch Terabox page. Status code: {response.status_code}"
        
        # Try to extract video URL from page content
        # Terabox often embeds video URLs in the page source
        content = response.text
        
        # Look for common video URL patterns
        video_patterns = [
            r'"dlink":"([^"]+)"',
            r'"videoUrl":"([^"]+)"',
            r'"url":"([^"]+\.mp4[^"]*)"',
            r'videoUrl\s*:\s*"([^"]+)"'
        ]
        
        for pattern in video_patterns:
            match = re.search(pattern, content)
            if match:
                video_url = match.group(1)
                # Unescape the URL if needed
                video_url = video_url.replace('\\/', '/')
                return video_url, None
        
        return None, "Could not extract video URL from Terabox page"
        
    except requests.RequestException as e:
        return None, f"Request error: {str(e)}"
    except Exception as e:
        return None, f"Error: {str(e)}"

@app.route('/')
def index():
    """
    Main page with video player interface
    """
    return render_template('index.html')

@app.route('/play', methods=['POST'])
def play_video():
    """
    Endpoint to process Terabox URL and return video information
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400
    
    terabox_url = data.get('url', '')
    
    if not terabox_url:
        return jsonify({'error': 'No URL provided'}), 400
    
    video_url, error = extract_terabox_video_url(terabox_url)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({
        'video_url': video_url,
        'original_url': terabox_url
    })

@app.route('/stream')
def stream_video():
    """
    Proxy endpoint to stream video (helps with CORS issues)
    """
    video_url = request.args.get('url')
    
    if not video_url:
        return "No video URL provided", 400
    
    # Validate that the video URL is from a trusted source
    try:
        parsed = urlparse(video_url)
        # Only allow streaming from Terabox-related domains
        if not any(domain in parsed.netloc.lower() for domain in ['terabox', '1024terabox']):
            return "Invalid video URL source", 403
    except (ValueError, AttributeError):
        return "Invalid video URL", 400
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.terabox.com/'
        }
        
        # Get range header if present
        range_header = request.headers.get('Range')
        if range_header:
            headers['Range'] = range_header
        
        response = requests.get(video_url, headers=headers, stream=True, timeout=30)
        
        # Create response with appropriate headers
        def generate():
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    yield chunk
        
        flask_response = app.response_class(generate(), status=response.status_code)
        
        # Copy relevant headers
        for header in ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges']:
            if header in response.headers:
                flask_response.headers[header] = response.headers[header]
        
        return flask_response
        
    except Exception as e:
        return f"Error streaming video: {str(e)}", 500

if __name__ == '__main__':
    # Use environment variables for production settings
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(debug=debug_mode, host=host, port=port)
