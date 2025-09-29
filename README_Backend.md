# Echoify Music Player - Backend Setup

This music player now includes a Python Flask backend that allows you to upload songs and save them permanently to the `songs` folder.

## Features Added

- **File Upload**: Upload multiple audio files (MP3, WAV, OGG, M4A, FLAC) to the server
- **Persistent Storage**: Uploaded songs are saved to the `songs` folder on your computer
- **Auto-loading**: Previously uploaded songs are automatically loaded when you refresh the page
- **File Management**: Secure filename handling to prevent conflicts and security issues

## Setup Instructions

### Prerequisites

- Python 3.7 or higher installed on your computer
- Basic knowledge of using the command line/terminal

### Installation

1. **Open Command Prompt/PowerShell** in the music player folder:
   ```powershell
   cd "d:\Unified Mentor\music-player"
   ```

2. **Install Python dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

3. **Start the backend server**:
   ```powershell
   python app.py
   ```

4. **Open your web browser** and go to:
   ```
   http://localhost:5000
   ```

### Usage

1. **Start the server** by running `python app.py` in the music player folder
2. **Open the web app** at http://localhost:5000
3. **Upload songs** using the "Upload Local Files" button in the sidebar
4. **Your songs will be saved** to the `songs` folder and persist between sessions

### File Specifications

- **Supported formats**: MP3, WAV, OGG, M4A, FLAC
- **Maximum file size**: 16MB per file
- **Upload location**: `songs` folder in the project directory
- **File naming**: Automatic safe filename generation to prevent conflicts

### API Endpoints

The backend provides these API endpoints:

- `POST /api/upload` - Upload multiple audio files
- `GET /api/songs` - List all uploaded songs
- `DELETE /api/songs/<filename>` - Delete a specific song
- `GET /songs/<filename>` - Stream audio files

### Troubleshooting

**"Upload failed. Make sure the server is running."**
- Make sure you started the Python server with `python app.py`
- Check that you're accessing the site through http://localhost:5000 (not by opening the HTML file directly)

**"File type not allowed"**
- Only audio files with these extensions are allowed: MP3, WAV, OGG, M4A, FLAC

**"File too large"**
- Maximum file size is 16MB per file

### Stopping the Server

Press `Ctrl+C` in the command prompt where the server is running to stop it.

### Development Notes

- The server runs in debug mode for development
- CORS is enabled to allow frontend-backend communication
- All uploaded files are stored in the `songs` folder
- The server serves both the API and static files