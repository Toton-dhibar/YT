from flask import Flask, render_template, request, jsonify
import requests
import re
from urllib.parse import quote, unquote

app = Flask(__name__)

def extract_terabox_video_url(terabox_url):
    """
    Extract direct video URL from Terabox share link
    """
    try:
        # Clean the URL
        terabox_url = terabox_url.strip()
        
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
    data = request.get_json()
    terabox_url = data.get('url', '')
    
    if not terabox_url:
        return jsonify({'error': 'No URL provided'}), 400
    
    # Validate that it's a Terabox URL
    if 'terabox' not in terabox_url.lower() and '1024terabox' not in terabox_url.lower():
        return jsonify({'error': 'Invalid Terabox URL'}), 400
    
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
    app.run(debug=True, host='0.0.0.0', port=5000)
