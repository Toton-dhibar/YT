# YT - Terabox Video Player

A simple and elegant web application built with Python Flask to play Terabox videos directly in your browser.

## Features

- 🎬 Play Terabox videos directly in the browser
- 🎨 Modern and responsive user interface
- 🚀 Easy to use - just paste the Terabox URL
- 🔄 Automatic video URL extraction
- 📱 Mobile-friendly design

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Toton-dhibar/YT.git
cd YT
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Paste a Terabox video share link in the input field

4. Click "Play Video" and enjoy!

## Requirements

- Python 3.7+
- Flask 3.0.0
- requests 2.31.0

## How It Works

1. User provides a Terabox share link
2. The application extracts the direct video URL from the Terabox page
3. The video is displayed in an HTML5 video player
4. If direct playback fails, the app uses a proxy endpoint to stream the video

## Deployment

### Local Development
```bash
python app.py
```

### Production (with Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Notes

- This application is for educational purposes
- Terabox video extraction depends on their page structure and may need updates if they change their format
- Some videos may have access restrictions or require authentication

## License

MIT License

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.