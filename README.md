# 🎵 Sargam - Modern Music Player

A beautiful, modern music streaming application built with HTML, CSS, JavaScript, and Python Flask backend. Sargam offers a Spotify-like experience with local music management, search functionality, and playlist creation.

![Sargam Music Player](images/homepage.png)

## ✨ Features

### 🎧 Core Music Features
- **Audio Playback**: High-quality audio streaming with seek controls
- **Search Functionality**: Real-time search for songs, artists, and albums
- **Playlist Management**: Create, edit, and manage custom playlists
- **Queue System**: Add songs to queue and manage playback order
- **Volume Control**: Smooth volume adjustment with visual feedback

### 🎨 User Interface
- **Modern Design**: Spotify-inspired dark theme with green accents
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Smooth Animations**: CSS transitions and hover effects
- **Card-based Layout**: Clean, organized display of songs and albums
- **Search Suggestions**: Real-time search suggestions with keyboard navigation

### 🔐 User Management
- **Account System**: User registration and authentication
- **Personalized Experience**: User-specific playlists and preferences
- **Firebase Integration**: Secure cloud-based user management

### 📱 Additional Features
- **File Upload**: Upload your local music files to the platform
- **Cross-platform**: Sync your music across all devices
- **Offline Support**: Download songs for offline listening
- **Multiple Formats**: Support for MP3, WAV, OGG, M4A, FLAC

## 📸 Screenshots

### Home Page
![Home Page](images/homepage.png)
*Browse through curated Hindi and English song collections*

### Search Results
![Search Results](images/search-results.png)
*Powerful search functionality with categorized results*

### Account & Login
![Account Page](images/account-page.png)
*User authentication with Google sign-in and email options*

## 🚀 Getting Started

### Prerequisites
- Python 3.7 or higher
- Node.js (for package management)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd music-player
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Set up Firebase (Optional)**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Add your Firebase configuration to `firebaseService.js`
   - Enable Authentication and Firestore

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5000`
   - Start enjoying your music!

## 📁 Project Structure

```
music-player/
├── images/                 # Image assets and screenshots
├── songs/                  # Audio files storage
│   └── playlist_uploads/   # User uploaded songs
├── index.html             # Main application page
├── account.html           # User account page  
├── results.html           # Search results page
├── style.css              # Main stylesheet
├── script.js              # Main JavaScript functionality
├── audioPlayerManager.js  # Audio player logic
├── firebaseService.js     # Firebase integration
├── app.py                 # Flask backend server
├── requirements.txt       # Python dependencies
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid, Flexbox, and animations
- **JavaScript ES6+**: Interactive functionality and DOM manipulation
- **Firebase SDK**: Authentication and real-time database

### Backend
- **Python Flask**: Lightweight web framework
- **File Upload Handling**: Secure file management
- **CORS Support**: Cross-origin resource sharing

### Design
- **Responsive Design**: Mobile-first approach
- **CSS Variables**: Consistent theming system
- **Modern UI Components**: Card layouts, modals, and form elements

## 🎯 Key Components

### Audio Player Manager
- Handles all audio playback functionality
- Queue management and track progression
- Volume and seek controls
- Play/pause state management

### Search System
- Real-time search with debouncing
- Category-based filtering (Songs, Artists, Albums)
- Keyboard navigation support
- Search suggestions dropdown

### Playlist Management
- CRUD operations for playlists
- Drag-and-drop song organization
- Playlist sharing capabilities
- Local storage for offline access

### User Interface
- Collapsible sidebar navigation
- Modal dialogs for forms
- Toast notifications for user feedback
- Loading states and error handling

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```
FLASK_ENV=development
UPLOAD_FOLDER=songs
MAX_CONTENT_LENGTH=16777216
SECRET_KEY=your-secret-key-here
```

### Firebase Configuration
Update `firebaseService.js` with your Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🎉 Acknowledgments

- Inspired by Spotify's user interface design
- Icons from [Font Awesome](https://fontawesome.com)
- Audio files for demo purposes
- Firebase for backend services

## 📞 Support

If you encounter any issues or have questions:
- Create an issue on GitHub
- Check the documentation
- Review the existing issues for solutions

---

**Made with ❤️ for music lovers everywhere**

> *Sargam - Where music meets technology*