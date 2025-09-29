#!/usr/bin/env python3
"""
Flask backend for Echoify Music Player
Handles file uploads and saves them to the songs folder
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pathlib import Path
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'songs'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'm4a', 'flac'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_safe_filename(filename):
    """Generate a safe filename to avoid conflicts"""
    secure_name = secure_filename(filename)
    name, ext = os.path.splitext(secure_name)
    
    # If file already exists, add a unique identifier
    counter = 1
    original_name = secure_name
    while os.path.exists(os.path.join(UPLOAD_FOLDER, secure_name)):
        secure_name = f"{name}_{counter}{ext}"
        counter += 1
    
    return secure_name

@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('.', filename)

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Handle multiple file uploads"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        if not files or all(file.filename == '' for file in files):
            return jsonify({'error': 'No files selected'}), 400
        
        uploaded_files = []
        errors = []
        
        for file in files:
            if file and file.filename != '':
                if allowed_file(file.filename):
                    try:
                        # Generate safe filename
                        safe_filename = get_safe_filename(file.filename)
                        filepath = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
                        
                        # Save the file
                        file.save(filepath)
                        
                        # Create song object for frontend
                        song_data = {
                            'title': os.path.splitext(safe_filename)[0],
                            'artist': 'Local Upload',
                            'src': f'songs/{safe_filename}',
                            'cover': 'images/default.jpg',
                            'filename': safe_filename,
                            'isApiResult': False
                        }
                        
                        uploaded_files.append(song_data)
                        
                    except Exception as e:
                        errors.append(f"Error uploading {file.filename}: {str(e)}")
                else:
                    errors.append(f"File type not allowed: {file.filename}")
        
        response = {
            'success': True,
            'uploaded_files': uploaded_files,
            'count': len(uploaded_files)
        }
        
        if errors:
            response['errors'] = errors
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/songs', methods=['GET'])
def list_songs():
    """List all songs in the songs folder"""
    try:
        songs = []
        songs_folder = Path(UPLOAD_FOLDER)
        
        if songs_folder.exists():
            for file_path in songs_folder.iterdir():
                if file_path.is_file() and allowed_file(file_path.name):
                    song_data = {
                        'title': file_path.stem,
                        'artist': 'Local Upload',
                        'src': f'songs/{file_path.name}',
                        'cover': 'images/default.jpg',
                        'filename': file_path.name,
                        'isApiResult': False
                    }
                    songs.append(song_data)
        
        return jsonify({
            'success': True,
            'songs': songs,
            'count': len(songs)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to list songs: {str(e)}'}), 500

@app.route('/api/songs/<filename>', methods=['DELETE'])
def delete_song(filename):
    """Delete a song from the songs folder"""
    try:
        safe_filename = secure_filename(filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
        
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({
                'success': True,
                'message': f'Song {safe_filename} deleted successfully'
            }), 200
        else:
            return jsonify({'error': 'Song not found'}), 404
            
    except Exception as e:
        return jsonify({'error': f'Failed to delete song: {str(e)}'}), 500

@app.route('/songs/<filename>')
def serve_song(filename):
    """Serve audio files from the songs folder"""
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

if __name__ == '__main__':
    print("Starting Echoify Music Player Backend...")
    print(f"Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"Allowed file types: {', '.join(ALLOWED_EXTENSIONS)}")
    print(f"Maximum file size: {MAX_CONTENT_LENGTH // (1024*1024)}MB")
    print("\nServer will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    
    app.run(debug=True, host='0.0.0.0', port=5000)