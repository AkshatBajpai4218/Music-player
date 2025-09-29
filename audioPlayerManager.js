// Shared Audio Player State Management
// This file manages audio playback state across different pages

class AudioPlayerManager {
    constructor() {
        this.storageKey = 'musicPlayerState';
        this.audio = null;
        this.currentSong = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 1;
        
        this.initializeAudio();
        this.loadState();
        this.setupEventListeners();
    }
    
    initializeAudio() {
        // Find audio element on current page
        this.audio = document.getElementById('audio');
        if (!this.audio) {
            // Create audio element if not found
            this.audio = document.createElement('audio');
            this.audio.id = 'audio';
            document.body.appendChild(this.audio);
        }
        
        // Set up audio event listeners
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.updateProgressDisplay();
            this.saveState();
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.updateProgressDisplay();
            this.saveState();
        });
        
        this.audio.addEventListener('ended', () => {
            // When a song ends, automatically play the next one
            this.isPlaying = true; // Ensure we continue playing
            this.nextSong(true); // Pass true to indicate auto-play
        });
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.saveState();
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.saveState();
        });
    }
    
    setupEventListeners() {
        // Set up control button listeners
        const playBtn = document.getElementById('play');
        const prevBtn = document.getElementById('prev');
        const nextBtn = document.getElementById('next');
        const progressBar = document.getElementById('progress');
        const volumeSlider = document.getElementById('volume');
        
        console.log('Setting up event listeners:', { playBtn, prevBtn, nextBtn });
        
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                console.log('Play button clicked via audioPlayerManager');
                this.togglePlayPause();
            });
        } else {
            console.warn('Play button not found!');
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSong());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSong());
        }
        
        if (progressBar) {
            progressBar.addEventListener('input', () => this.seekTo(progressBar.value));
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => this.setVolume(volumeSlider.value));
        }
        
        // Listen for storage changes (when another tab updates the state)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.loadState();
                this.updateUI();
            }
        });
        
        // Save state when page is about to unload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    }
    
    loadSong(song, index = 0) {
        this.currentSong = song;
        this.currentIndex = index;
        
        // Update global index variable for compatibility
        if (typeof window.index !== 'undefined') {
            window.index = index;
        }
        
        if (this.audio) {
            this.audio.src = song.previewUrl || song.src;
            this.audio.volume = this.volume;
        }
        
        this.updateSongDisplay();
        this.saveState();
    }
    
    togglePlayPause() {
        console.log('togglePlayPause called:', { 
            hasAudio: !!this.audio, 
            hasSong: !!this.currentSong, 
            isPaused: this.audio?.paused,
            isPlaying: this.isPlaying 
        });
        
        if (!this.audio || !this.currentSong) {
            console.warn('No audio or song to play/pause');
            return;
        }
        
        if (this.audio.paused) {
            console.log('Playing audio...');
            this.audio.play().catch(error => {
                console.error('Error playing audio:', error);
            });
        } else {
            console.log('Pausing audio...');
            this.audio.pause();
        }
    }
    
    nextSong(autoPlay = false) {
        if (this.playlist.length === 0) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.loadSong(this.playlist[this.currentIndex], this.currentIndex);
        
        // Auto-play if song ended naturally or if currently playing
        if (autoPlay || this.isPlaying) {
            // Small delay to ensure audio source is loaded
            setTimeout(() => {
                this.audio.play().catch(error => {
                    console.error('Error auto-playing next song:', error);
                });
            }, 100);
        }
    }
    
    previousSong() {
        if (this.playlist.length === 0) return;
        
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadSong(this.playlist[this.currentIndex], this.currentIndex);
        
        if (this.isPlaying) {
            this.audio.play();
        }
    }
    
    seekTo(percentage) {
        if (this.audio && this.duration) {
            this.audio.currentTime = (percentage / 100) * this.duration;
        }
    }
    
    setVolume(volume) {
        this.volume = volume;
        if (this.audio) {
            this.audio.volume = volume;
        }
        this.saveState();
    }
    
    setPlaylist(songs, startIndex = 0) {
        this.playlist = songs;
        this.currentIndex = startIndex;
        
        if (songs.length > 0) {
            this.loadSong(songs[startIndex], startIndex);
        }
    }
    
    addToPlaylist(song) {
        this.playlist.push(song);
        this.saveState();
    }
    
    updateSongDisplay() {
        const titleElement = document.getElementById('title');
        const artistElement = document.getElementById('artist');
        const coverElement = document.getElementById('cover');
        
        if (this.currentSong) {
            if (titleElement) titleElement.textContent = this.currentSong.trackName || this.currentSong.title || 'Unknown';
            if (artistElement) artistElement.textContent = this.currentSong.artistName || this.currentSong.artist || 'Unknown';
            if (coverElement) {
                coverElement.src = this.currentSong.artworkUrl100 || this.currentSong.cover || 'images/default.jpg';
                coverElement.alt = `${this.currentSong.trackName || this.currentSong.title} cover`;
            }
        }
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('play');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
        }
    }
    
    updateProgressDisplay() {
        const progressBar = document.getElementById('progress');
        const currentTimeElement = document.getElementById('current');
        const durationElement = document.getElementById('duration');
        
        if (progressBar && this.duration > 0) {
            const percentage = (this.currentTime / this.duration) * 100;
            progressBar.value = percentage;
        }
        
        if (currentTimeElement) {
            currentTimeElement.textContent = this.formatTime(this.currentTime);
        }
        
        if (durationElement) {
            durationElement.textContent = this.formatTime(this.duration);
        }
    }
    
    updateUI() {
        this.updateSongDisplay();
        this.updatePlayButton();
        this.updateProgressDisplay();
        
        const volumeSlider = document.getElementById('volume');
        if (volumeSlider) {
            volumeSlider.value = this.volume;
        }
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    saveState() {
        const state = {
            currentSong: this.currentSong,
            playlist: this.playlist,
            currentIndex: this.currentIndex,
            isPlaying: this.isPlaying,
            currentTime: this.currentTime,
            duration: this.duration,
            volume: this.volume,
            audioSrc: this.audio ? this.audio.src : null,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (error) {
            console.warn('Could not save audio player state:', error);
        }
    }
    
    loadState() {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (!savedState) return;
            
            const state = JSON.parse(savedState);
            
            // Only load state if it's recent (within last hour)
            const hourAgo = Date.now() - (60 * 60 * 1000);
            if (state.timestamp < hourAgo) return;
            
            this.currentSong = state.currentSong;
            this.playlist = state.playlist || [];
            this.currentIndex = state.currentIndex || 0;
            this.isPlaying = state.isPlaying || false;
            this.currentTime = state.currentTime || 0;
            this.duration = state.duration || 0;
            this.volume = state.volume || 1;
            
            // Restore audio state
            if (this.audio && state.audioSrc) {
                this.audio.src = state.audioSrc;
                this.audio.volume = this.volume;
                this.audio.currentTime = this.currentTime;
                
                if (this.isPlaying) {
                    // Don't auto-play on page load, just restore the state
                    // User will need to click play to resume
                    this.isPlaying = false;
                }
            }
            
            this.updateUI();
            
        } catch (error) {
            console.warn('Could not load audio player state:', error);
        }
    }
    
    // Method to play a specific song (called when user clicks on a song)
    playSong(song, playlist = null, index = 0) {
        if (playlist) {
            this.setPlaylist(playlist, index);
        } else {
            this.loadSong(song, index);
        }
        
        // Small delay to ensure audio is loaded
        setTimeout(() => {
            this.audio.play();
        }, 100);
    }
    
    // Clear saved state (useful for logout/reset)
    clearState() {
        localStorage.removeItem(this.storageKey);
        this.currentSong = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
        
        this.updateUI();
    }
}

// Initialize the global audio player manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.audioPlayerManager = new AudioPlayerManager();
    console.log('AudioPlayerManager initialized');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioPlayerManager;
}