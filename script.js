// Import Firebase service for user-specific playlists
import firebaseMusicService from './firebaseService.js';

let songs = [
  {
    title: "Sample Song",
    artist: "Unknown",
    src: "songs/sample.mp3",
    cover: "images/default.jpg",
    isApiResult: false
  }
];

let index = 0;
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const cover = document.getElementById("cover");
const progress = document.getElementById("progress");
const current = document.getElementById("current");
const duration = document.getElementById("duration");
const volume = document.getElementById("volume");
const playlist = document.getElementById("playlist");
const fileUpload = document.getElementById("fileUpload");
const topSearch = document.getElementById("topSearch");
const topSearchBtn = document.getElementById("topSearchBtn");
const searchSuggestions = document.getElementById("searchSuggestions");

// Sidebar toggle functionality
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
let sidebarCollapsed = false;

// Search suggestions data
let searchHistory = [];
let currentSearchResults = [];
let selectedSuggestionIndex = -1;
let suggestionItems = [];

// Music categories with Hindi priority
const musicCategories = {
  hindi: { 
    name: 'Hindi Songs', 
    terms: ['arijit singh', 'shreya ghoshal', 'atif aslam', 'rahat fateh ali khan', 'mohit chauhan', 'armaan malik', 'bollywood songs', 'hindi songs', 'jubin nautiyal', 'darshan raval']
  },
  english: { 
    name: 'English Songs', 
    terms: ['taylor swift', 'ed sheeran', 'adele', 'bruno mars', 'imagine dragons', 'coldplay', 'billie eilish', 'the weeknd', 'dua lipa', 'ariana grande']
  },
  '1990s': { 
    name: '1990s Hits', 
    terms: ['kumar sanu hindi', 'udit narayan bollywood', 'alka yagnik 90s', 'bollywood 1990s', 'hindi songs 90s', '90s bollywood hits', 'abhijeet bhattacharya', 'sadhana sargam hindi']
  },
  '2000s': { 
    name: '2000s Hits', 
    terms: ['sonu nigam', 'shaan', 'kk singer', 'bollywood 2000s', 'hindi songs', 'sunidhi chauhan', 'shreya ghoshal 2000s', 'mohit chauhan']
  },
  love: { 
    name: 'Love Songs', 
    terms: ['arijit singh romantic', 'bollywood love songs', 'tum hi ho', 'raabta', 'hindi romantic', 'love songs hindi', 'atif aslam love', 'armaan malik romantic']
  },
  lofi: { 
    name: 'Lofi Songs', 
    terms: ['hindi lofi songs', 'bollywood lofi remix', 'arijit singh lofi', 'hindi chill songs', 'bollywood acoustic', 'hindi unplugged songs', 'lofi bollywood', 'hindi slow songs']
  }
};

// Page navigation
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Remove active class from nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Show selected page
  document.getElementById(pageId + 'Page').classList.add('active');
  
  // Add active class to selected nav item
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
  
  // Update content when switching to library page
  if (pageId === 'library') {
    renderLibraryContent();
    if (window.playlistManager) {
      window.playlistManager.renderLibraryPlaylists();
    }
  }
}

// Helper function to switch pages (used by playlist manager)
function switchPage(pageId) {
  showPage(pageId);
}

// Navigation event listeners
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    showPage(page);
  });
});

// Fetch songs for a category
async function fetchCategorySongs(category, limit = 5) {
  const categoryData = musicCategories[category];
  if (!categoryData) {
    console.error(`Category ${category} not found`);
    return [];
  }
  
  const terms = categoryData.terms;
  const randomTerm = terms[Math.floor(Math.random() * terms.length)];
  
  console.log(`Fetching songs for ${category} with term: ${randomTerm}`);
  
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(randomTerm)}&entity=song&limit=${limit}&country=IN`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`Got ${data.results.length} results for ${category}`);
    
    return data.results;
  } catch (error) {
    console.error(`Failed to fetch ${category} songs:`, error);
    
    // Fallback: try without country restriction
    try {
      console.log(`Trying fallback for ${category}...`);
      const fallbackRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(randomTerm)}&entity=song&limit=${limit}`);
      const fallbackData = await fallbackRes.json();
      console.log(`Fallback got ${fallbackData.results.length} results for ${category}`);
      return fallbackData.results;
    } catch (fallbackError) {
      console.error(`Fallback also failed for ${category}:`, fallbackError);
      return [];
    }
  }
}

// Render song cards in grid
function renderSongCards(container, tracks, limit = 5) {
  container.innerHTML = '';
  
  const tracksToShow = tracks.slice(0, limit);
  
  tracksToShow.forEach(track => {
    const card = document.createElement('div');
    card.classList.add('song-card');
    card.innerHTML = `
      <img src="${track.artworkUrl100 || 'images/default.jpg'}" alt="${track.trackName}">
      <h4>${track.trackName}</h4>
      <p>${track.artistName}</p>
    `;
    
    // Create standardized song object for playlist system
    const songForPlaylist = {
      title: track.trackName,
      artist: track.artistName,
      src: track.previewUrl,
      cover: track.artworkUrl100 || 'images/default.jpg',
      isApiResult: true,
      previewUrl: track.previewUrl,
      trackId: track.trackId
    };
    
    card.addEventListener('click', () => {
      // Use global audio player manager
      window.audioPlayerManager.playSong(track, tracks, tracks.indexOf(track));
    });
    
    // Add context menu support
    card.addEventListener('contextmenu', (e) => {
      if (window.playlistManager) {
        window.playlistManager.showContextMenu(e, songForPlaylist);
      }
    });
    
    container.appendChild(card);
  });
}

// Show modal with all songs from category
async function showCategoryModal(category) {
  const categoryData = musicCategories[category];
  if (!categoryData) return;
  
  const modal = document.getElementById('categoryModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalGrid = document.getElementById('modalSongsGrid');
  
  modalTitle.textContent = categoryData.name;
  modalGrid.innerHTML = '<div style="color: #888; padding: 20px; text-align: center;">Loading...</div>';
  
  modal.classList.add('show');
  
  // Fetch more songs for the modal
  const allSongs = [];
  const terms = categoryData.terms;
  
  // Fetch from multiple terms to get variety
  for (let i = 0; i < Math.min(terms.length, 3); i++) {
    const term = terms[i];
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10&country=IN`);
      const data = await res.json();
      allSongs.push(...data.results);
    } catch (error) {
      console.error(`Failed to fetch songs for term ${term}:`, error);
    }
  }
  
  // Remove duplicates
  const uniqueSongs = allSongs.filter((song, index, self) => 
    index === self.findIndex(s => s.trackName === song.trackName && s.artistName === song.artistName)
  );
  
  renderSongCards(modalGrid, uniqueSongs, uniqueSongs.length);
}

// Modal event listeners
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('categoryModal');
  const closeModal = document.querySelector('.close-modal');
  
  // Show all buttons
  document.querySelectorAll('.show-all-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      showCategoryModal(category);
    });
  });
  
  // Close modal
  closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
  });
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      modal.classList.remove('show');
    }
  });
});

// Load trending content
async function loadTrendingContent() {
  const categories = ['hindi', 'english', '1990s', '2000s', 'love', 'lofi'];
  
  for (const category of categories) {
    const containerId = category === '1990s' ? 'songs1990s' : 
                       category === '2000s' ? 'songs2000s' : 
                       `${category}Songs`;
    const container = document.getElementById(containerId);
    
    console.log(`Loading category: ${category}, container ID: ${containerId}, container found: ${!!container}`);
    
    if (container) {
      // Show loading
      container.innerHTML = '<div style="color: #888; padding: 20px;">Loading...</div>';
      
      try {
        const tracks = await fetchCategorySongs(category, 5);
        
        if (tracks.length > 0) {
          renderSongCards(container, tracks, 5);
        } else {
          container.innerHTML = '<div style="color: #888; padding: 20px;">No songs found. Try refreshing.</div>';
        }
      } catch (error) {
        console.error(`Error loading ${category}:`, error);
        container.innerHTML = '<div style="color: #ff6b6b; padding: 20px;">Failed to load songs.</div>';
      }
    } else {
      console.error(`Container not found for category: ${category}, expected ID: ${containerId}`);
    }
  }
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Load song - simplified version that doesn't interfere with audioPlayerManager
function loadSong(song) {
  if (!song) {
    console.error('No song provided to loadSong');
    return;
  }
  
  title.textContent = song.title || 'Unknown Title';
  artist.textContent = song.artist || 'Unknown Artist';
  cover.src = song.cover || 'images/default.jpg';
  
  // Let audioPlayerManager handle audio loading and button states
  if (window.audioPlayerManager) {
    window.audioPlayerManager.loadSong(song, index);
  } else {
    // Fallback: only load audio source without changing button states
    audio.pause();
    audio.currentTime = 0;
    audio.src = song.src;
  }
}

// Initialize first song if available
if (songs.length > 0) {
  loadSong(songs[index]);
}

// Render Playlist
function renderPlaylist() {
  playlist.innerHTML = "";
  songs.forEach((song, i) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <img src="${song.cover}" alt="${song.title}">
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;
    card.addEventListener("click", () => {
      index = i; // Update global index
      // Use global audio player manager
      if (window.audioPlayerManager) {
        window.audioPlayerManager.playSong(songs[i], songs, i);
      } else {
        // Fallback to direct control
        loadSong(songs[i]);
        audio.play().catch(error => console.error('Error playing song:', error));
      }
    });
    
    // Add context menu support for all songs in the main playlist
    card.addEventListener('contextmenu', (e) => {
      if (window.playlistManager) {
        window.playlistManager.showContextMenu(e, song);
      }
    });
    
    playlist.appendChild(card);
  });
  
  // Update audioPlayerManager with new playlist if it exists
  if (window.audioPlayerManager && songs.length > 0) {
    window.audioPlayerManager.setPlaylist(songs, index);
  }
}
renderPlaylist();

// Play/Pause is handled by audioPlayerManager.js
// No need to add additional event listeners here as it causes conflicts

// Next & Prev buttons are handled by audioPlayerManager.js
// No need to add additional event listeners here as it causes conflicts

// Sidebar toggle functionality
menuToggle.addEventListener("click", () => {
  sidebarCollapsed = !sidebarCollapsed;
  if (sidebarCollapsed) {
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
  }
});

// Initialize sidebar as collapsed on page load
document.addEventListener("DOMContentLoaded", () => {
  sidebar.classList.add("collapsed");
  sidebarCollapsed = true;
  
  // Wait a bit for audioPlayerManager to initialize, then load existing songs
  setTimeout(() => {
    loadExistingSongs();
  }, 100);
});

// Load existing songs from backend
async function loadExistingSongs() {
  try {
    const response = await fetch('/api/songs');
    const result = await response.json();
    
    if (result.success && result.songs.length > 0) {
      // Add existing songs to the playlist
      for (let songData of result.songs) {
        songs.push(songData);
      }
      renderPlaylist();
      
      // Load first song if no song is currently loaded
      if (songs.length > 0 && (!audio.src || audio.src === '')) {
        loadSong(songs[0]);
      }
      
      console.log(`Loaded ${result.count} existing songs from server`);
    }
  } catch (error) {
    console.log('Could not load existing songs from server (server may not be running):', error.message);
    // This is not critical, so we don't show an error notification
  }
}

// Note: Audio state event listeners are handled by audioPlayerManager.js

// Progress Bar
audio.addEventListener("timeupdate", () => {
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  progress.value = progressPercent || 0;

  let curMin = Math.floor(audio.currentTime / 60);
  let curSec = Math.floor(audio.currentTime % 60);
  if (curSec < 10) curSec = "0" + curSec;
  current.textContent = `${curMin}:${curSec}`;

  let durMin = Math.floor(audio.duration / 60) || 0;
  let durSec = Math.floor(audio.duration % 60) || 0;
  if (durSec < 10) durSec = "0" + durSec;
  duration.textContent = `${durMin}:${durSec}`;
});

progress.addEventListener("input", () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
});

// Volume
volume.addEventListener("input", () => {
  audio.volume = volume.value;
});

// Upload local songs to backend
fileUpload.addEventListener("change", async (e) => {
  const files = e.target.files;
  if (files.length === 0) return;
  
  // Show upload progress
  showNotification("Uploading files...", "info");
  
  try {
    const formData = new FormData();
    
    // Add all selected files to FormData
    for (let file of files) {
      formData.append('files', file);
    }
    
    // Send files to backend
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Add uploaded songs to the playlist
      for (let songData of result.uploaded_files) {
        songs.push(songData);
      }
      
      renderPlaylist();
      renderLibraryContent(); // Update library display
      showNotification(`Successfully uploaded ${result.count} song(s)!`, "success");
      
      // Show any errors that occurred during upload
      if (result.errors && result.errors.length > 0) {
        console.warn("Upload errors:", result.errors);
        showNotification(`Some files had errors: ${result.errors.join(', ')}`, "warning");
      }
    } else {
      showNotification(`Upload failed: ${result.error}`, "error");
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    showNotification("Upload failed. Make sure the server is running.", "error");
  }
  
  // Clear the file input
  e.target.value = '';
});

// Fetch songs from iTunes API for search
async function fetchSongs(query) {
  console.log(`Starting search for: "${query}"`);
  
  try {
    // Try multiple search approaches
    const searchUrls = [
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=20&country=US`,
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=20`,
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`
    ];
    
    for (let i = 0; i < searchUrls.length; i++) {
      try {
        console.log(`Trying search URL ${i + 1}: ${searchUrls[i]}`);
        const res = await fetch(searchUrls[i]);
        
        if (!res.ok) {
          console.error(`HTTP error! status: ${res.status}`);
          continue;
        }
        
        const data = await res.json();
        console.log(`Search attempt ${i + 1} returned:`, data);
        
        if (data.results && data.results.length > 0) {
          console.log(`✅ Success! Found ${data.results.length} results`);
          currentSearchResults = data.results;
          return data.results;
        } else {
          console.log(`❌ No results from attempt ${i + 1}`);
        }
      } catch (attemptError) {
        console.error(`Search attempt ${i + 1} failed:`, attemptError);
      }
    }
    
    console.error("All search attempts failed");
    return [];
    
  } catch (error) {
    console.error("Search completely failed:", error);
    return [];
  }
}

// Enhanced render search results function
function renderSearchResults(tracks, query) {
  const searchResults = document.getElementById('searchResults');
  const searchTitle = document.getElementById('searchResultsTitle');
  const searchSubtitle = document.getElementById('searchResultsSubtitle');
  const searchCount = document.getElementById('searchResultsCount');
  
  // Update header
  searchTitle.textContent = `Search Results for "${query}"`;
  searchSubtitle.textContent = `Found ${tracks.length} ${tracks.length === 1 ? 'result' : 'results'}`;
  
  // Update count
  if (searchCount) {
    searchCount.textContent = `${tracks.length} results found`;
  }
  
  // Clear previous results
  searchResults.innerHTML = '';
  
  if (tracks.length === 0) {
    searchResults.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">😞</div>
        <h3>No results found for "${query}"</h3>
        <p>Try searching for different keywords or check your spelling</p>
      </div>
    `;
    return;
  }
  
  tracks.forEach(track => {
    const card = document.createElement('div');
    card.classList.add('search-result-item');
    card.innerHTML = `
      <img src="${track.artworkUrl100 || 'images/default.jpg'}" alt="${track.trackName}">
      <h4>${track.trackName}</h4>
      <p>${track.artistName}</p>
    `;
    
    // Create standardized song object for playlist system
    const songForPlaylist = {
      title: track.trackName,
      artist: track.artistName,
      src: track.previewUrl,
      cover: track.artworkUrl100 || 'images/default.jpg',
      isApiResult: true,
      previewUrl: track.previewUrl,
      trackId: track.trackId
    };
    
    card.addEventListener('click', () => {
      // Use global audio player manager
      window.audioPlayerManager.playSong(track, tracks, tracks.indexOf(track));
      
      // Show success message
      showNotification(`Playing "${track.trackName}"`);
    });
    
    // Add context menu support
    card.addEventListener('contextmenu', (e) => {
      if (window.playlistManager) {
        window.playlistManager.showContextMenu(e, songForPlaylist);
      }
    });
    
    searchResults.appendChild(card);
  });
}

// Show notification
function showNotification(message, type = 'success') {
  const colors = {
    success: { bg: 'linear-gradient(135deg, #1ed760 0%, #17c653 100%)', shadow: 'rgba(30, 215, 96, 0.3)' },
    error: { bg: 'linear-gradient(135deg, #ff4757 0%, #ff3742 100%)', shadow: 'rgba(255, 71, 87, 0.3)' },
    warning: { bg: 'linear-gradient(135deg, #ffa502 0%, #ff9500 100%)', shadow: 'rgba(255, 165, 2, 0.3)' },
    info: { bg: 'linear-gradient(135deg, #3742fa 0%, #2f3542 100%)', shadow: 'rgba(55, 66, 250, 0.3)' }
  };
  
  const color = colors[type] || colors.success;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 90px;
    right: 20px;
    background: ${color.bg};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 3000;
    font-weight: 500;
    box-shadow: 0 4px 20px ${color.shadow};
    animation: slideIn 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Make showNotification globally available
window.showNotification = showNotification;

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Search suggestions functionality
async function showSearchSuggestions(query) {
  if (!query.trim()) {
    searchSuggestions.classList.remove('show');
    selectedSuggestionIndex = -1;
    return;
  }

  console.log(`Getting suggestions for: "${query}"`);

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5&country=US`);
    
    if (!res.ok) {
      console.error(`Suggestions HTTP error! status: ${res.status}`);
      searchSuggestions.classList.remove('show');
      return;
    }
    
    const data = await res.json();
    console.log(`Suggestions returned:`, data);
    
    if (!data.results || data.results.length === 0) {
      console.log("No suggestions found");
      searchSuggestions.classList.remove('show');
      return;
    }
    
    const suggestions = data.results.map(track => ({
      title: track.trackName,
      artist: track.artistName,
      cover: track.artworkUrl100 || "images/default.jpg"
    }));

    currentSearchResults = suggestions; // Store for keyboard navigation
    renderSuggestions(suggestions);
  } catch (error) {
    console.error("Suggestions failed:", error);
    searchSuggestions.classList.remove('show');
  }
}

function renderSuggestions(suggestions) {
  searchSuggestions.innerHTML = '';
  suggestionItems = [];
  selectedSuggestionIndex = -1;
  
  if (suggestions.length === 0) {
    searchSuggestions.classList.remove('show');
    return;
  }

  suggestions.forEach((suggestion, index) => {
    const item = document.createElement('div');
    item.classList.add('suggestion-item');
    item.dataset.index = index;
    item.innerHTML = `
      <img src="${suggestion.cover}" alt="${suggestion.title}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
      <div>
        <div style="font-weight: 500; color: #fff;">${suggestion.title}</div>
        <div style="font-size: 12px; color: #888;">${suggestion.artist}</div>
      </div>
    `;
    
    item.addEventListener('click', () => {
      selectSuggestion(index);
    });
    
    searchSuggestions.appendChild(item);
    suggestionItems.push(item);
  });
  
  searchSuggestions.classList.add('show');
}

function selectSuggestion(index) {
  if (index >= 0 && index < suggestionItems.length) {
    const suggestion = currentSearchResults[index];
    topSearch.value = `${suggestion.title} ${suggestion.artist}`;
    searchSuggestions.classList.remove('show');
    selectedSuggestionIndex = -1;
    performSearch();
  }
}

function highlightSuggestion(index) {
  // Remove previous highlights
  suggestionItems.forEach(item => item.classList.remove('highlighted'));
  
  if (index >= 0 && index < suggestionItems.length) {
    suggestionItems[index].classList.add('highlighted');
    selectedSuggestionIndex = index;
    
    // Scroll into view if needed
    suggestionItems[index].scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  } else {
    selectedSuggestionIndex = -1;
  }
}

// Debounced search function
const debouncedSearch = debounce(showSearchSuggestions, 300);

// Search input event listeners
topSearch.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  selectedSuggestionIndex = -1;
  debouncedSearch(query);
});

topSearch.addEventListener('focus', (e) => {
  const query = e.target.value.trim();
  if (query) {
    debouncedSearch(query);
  }
});

// Keyboard navigation for search suggestions
topSearch.addEventListener('keydown', (e) => {
  if (!searchSuggestions.classList.contains('show')) return;
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      const nextIndex = selectedSuggestionIndex + 1;
      if (nextIndex < suggestionItems.length) {
        highlightSuggestion(nextIndex);
      }
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      const prevIndex = selectedSuggestionIndex - 1;
      if (prevIndex >= 0) {
        highlightSuggestion(prevIndex);
      }
      break;
      
    case 'Enter':
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        selectSuggestion(selectedSuggestionIndex);
      } else {
        searchSuggestions.classList.remove('show');
        performSearch();
      }
      break;
      
    case 'Escape':
      e.preventDefault();
      searchSuggestions.classList.remove('show');
      selectedSuggestionIndex = -1;
      topSearch.blur();
      break;
  }
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!searchSuggestions.contains(e.target) && e.target !== topSearch) {
    searchSuggestions.classList.remove('show');
  }
});

// Test search functionality
async function testSearch() {
  console.log("🧪 Testing search functionality...");
  
  // Test with a simple, well-known query
  const testQuery = "taylor swift";
  console.log(`Testing with query: "${testQuery}"`);
  
  try {
    const results = await fetchSongs(testQuery);
    console.log("Test results:", results);
    
    if (results.length > 0) {
      console.log("✅ Search is working!");
      return true;
    } else {
      console.log("❌ Search returned no results");
      return false;
    }
  } catch (error) {
    console.error("❌ Test search failed:", error);
    return false;
  }
}

// Add mock data as fallback
const mockSearchResults = [
  {
    trackName: "Tum Hi Ho",
    artistName: "Arijit Singh",
    artworkUrl100: "images/default.jpg",
    previewUrl: "songs/sample.mp3"
  },
  {
    trackName: "Perfect",
    artistName: "Ed Sheeran",
    artworkUrl100: "images/default.jpg",
    previewUrl: "songs/sample.mp3"
  },
  {
    trackName: "Shape of You",
    artistName: "Ed Sheeran", 
    artworkUrl100: "images/default.jpg",
    previewUrl: "songs/sample.mp3"
  },
  {
    trackName: "Raabta",
    artistName: "Arijit Singh",
    artworkUrl100: "images/default.jpg",
    previewUrl: "songs/sample.mp3"
  },
  {
    trackName: "Tera Ban Jaunga",
    artistName: "Akhil Sachdeva",
    artworkUrl100: "images/default.jpg",
    previewUrl: "songs/sample.mp3"
  }
];

// Enhanced perform search with redirect to results page
async function performSearch() {
  const query = topSearch.value.trim();
  if (!query) {
    console.log("Empty search query");
    return;
  }

  console.log(`🔍 Redirecting search for: "${query}"`);
  
  // Redirect to results page with query parameter
  window.location.href = `results.html?q=${encodeURIComponent(query)}`;
}

// Handle Search Button
topSearchBtn.addEventListener("click", performSearch);

// Allow Enter key to trigger search
topSearch.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !searchSuggestions.classList.contains('show')) {
    performSearch();
  }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  loadTrendingContent();
  
  // Reset search button state
  const topSearchBtn = document.getElementById('topSearchBtn');
  if (topSearchBtn) {
    topSearchBtn.textContent = "🔍";
  }
  
  // Add debugging info
  console.log("🎵 Music Player initialized!");
  console.log("🔍 Search ready. Type in search box and press Enter.");
  console.log("🧪 Use testSearch() function to debug search issues.");
});

// Simple diagnostic function
function diagnoseProblem() {
  console.log("🔧 Running diagnostics...");
  
  // Check if search elements exist
  const topSearch = document.getElementById('topSearch');
  const topSearchBtn = document.getElementById('topSearchBtn');
  
  console.log("Search input exists:", !!topSearch);
  console.log("Search button exists:", !!topSearchBtn);
  
  if (topSearch) {
    console.log("Search input value:", topSearch.value);
  }
  
  // Test a simple fetch
  console.log("Testing basic fetch...");
  fetch('https://httpbin.org/get')
    .then(response => {
      console.log("✅ Basic fetch works:", response.status);
      return testSearch();
    })
    .catch(error => {
      console.log("❌ Basic fetch failed:", error);
      console.log("Network might be blocked or CORS issue");
    });
}

// Add helper function to reset search button
function resetSearchButton() {
  const topSearchBtn = document.getElementById('topSearchBtn');
  if (topSearchBtn) {
    topSearchBtn.textContent = "🔍";
  }
}

// Render library content (uploaded songs)
function renderLibraryContent() {
  const container = document.getElementById('libraryContent');
  if (!container) return;

  // Filter local songs (non-API results)
  const localSongs = songs.filter(song => !song.isApiResult);
  
  if (localSongs.length === 0) {
    container.innerHTML = '<p>Your uploaded songs will appear here</p>';
    return;
  }

  container.innerHTML = '';
  
  localSongs.forEach((song, index) => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <img src="${song.cover}" alt="${song.title}">
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;
    
    card.addEventListener('click', () => {
      const songIndex = songs.indexOf(song);
      if (window.audioPlayerManager) {
        window.audioPlayerManager.playSong(song, songs, songIndex);
      } else {
        index = songIndex;
        loadSong(song);
        audio.play().catch(error => console.error('Error playing song:', error));
      }
    });
    
    // Add context menu support for local songs
    card.addEventListener('contextmenu', (e) => {
      if (window.playlistManager) {
        window.playlistManager.showContextMenu(e, song);
      }
    });
    
    container.appendChild(card);
  });
}

// =========================
// PLAYLIST MANAGEMENT SYSTEM
// =========================

class PlaylistManager {
  constructor() {
    this.playlists = this.loadPlaylists(); // Initialize with empty object
    this.currentSelectedSong = null;
    this.currentDetailPlaylist = null;
    this.currentContextPlaylist = null;
    this.currentContextSongIndex = null;
    this.isPlaylistDetailModalOpen = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderCustomPlaylists();
    this.renderLibraryPlaylists();
    
    // Show initial loading state
    this.showLoadingState('Initializing...');
    
    // Wait for Firebase to be ready before loading playlists
    this.waitForFirebaseAndLoadPlaylists();
  }

  // Wait for Firebase service to be ready and then load playlists
  async waitForFirebaseAndLoadPlaylists() {
    try {
      console.log('� Waiting for Firebase service to initialize...');
      this.showLoadingState('Initializing Firebase...');
      
      // Wait for firebase service to exist
      let attempts = 0;
      while (!window.firebaseMusicService && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.firebaseMusicService) {
        console.error('❌ Firebase service not available after waiting');
        this.loadLocalPlaylists();
        this.showNotification('Using local playlists - Firebase unavailable', 'warning');
        return;
      }
      
      console.log('🔥 Firebase service exists, waiting for auth state...');
      this.showLoadingState('Checking authentication...');
      
      // Wait for auth state to be resolved using the new Promise-based method
      await window.firebaseMusicService.waitForAuthState();
      
      console.log('✅ Auth state resolved, loading playlists...');
      
      if (window.firebaseMusicService.isAuthenticated()) {
        console.log('👤 User is authenticated, loading cloud playlists...');
        await this.loadUserPlaylists();
      } else {
        console.log('👤 User not authenticated, loading local playlists...');
        this.loadLocalPlaylists();
      }
      
    } catch (error) {
      console.error('❌ Error in waitForFirebaseAndLoadPlaylists:', error);
      this.loadLocalPlaylists();
      this.showNotification('Error loading playlists - using local storage', 'error');
    }
  }

  bindEvents() {
    // Create playlist button
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    if (createPlaylistBtn) {
      createPlaylistBtn.addEventListener('click', () => this.showCreatePlaylistModal());
    }

    // Refresh playlists button
    const refreshPlaylistsBtn = document.getElementById('refreshPlaylistsBtn');
    if (refreshPlaylistsBtn) {
      refreshPlaylistsBtn.addEventListener('click', () => this.refreshPlaylists());
    }

    // Sync playlists button
    const syncPlaylistsBtn = document.getElementById('syncPlaylistsBtn');
    if (syncPlaylistsBtn) {
      syncPlaylistsBtn.addEventListener('click', () => this.syncPlaylists());
    }

    // Go online button
    const goOnlineBtn = document.getElementById('goOnlineBtn');
    if (goOnlineBtn) {
      goOnlineBtn.addEventListener('click', () => this.forceGoOnline());
    }

    // Create playlist modal events
    const confirmCreatePlaylist = document.getElementById('confirmCreatePlaylist');
    const cancelCreatePlaylist = document.getElementById('cancelCreatePlaylist');
    const closeCreatePlaylistModal = document.getElementById('closeCreatePlaylistModal');
    
    if (confirmCreatePlaylist) {
      confirmCreatePlaylist.addEventListener('click', () => this.createPlaylist());
    }
    if (cancelCreatePlaylist) {
      cancelCreatePlaylist.addEventListener('click', () => this.hideCreatePlaylistModal());
    }
    if (closeCreatePlaylistModal) {
      closeCreatePlaylistModal.addEventListener('click', () => this.hideCreatePlaylistModal());
    }

    // Add to playlist modal events
    const cancelAddToPlaylist = document.getElementById('cancelAddToPlaylist');
    const closeAddToPlaylistModal = document.getElementById('closeAddToPlaylistModal');
    
    if (cancelAddToPlaylist) {
      cancelAddToPlaylist.addEventListener('click', () => this.hideAddToPlaylistModal());
    }
    if (closeAddToPlaylistModal) {
      closeAddToPlaylistModal.addEventListener('click', () => this.hideAddToPlaylistModal());
    }

    // Context menu events
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu')) {
        this.hideContextMenu();
      }
    });
    
    const addToPlaylistOption = document.getElementById('addToPlaylistOption');
    const playNowOption = document.getElementById('playNowOption');
    
    if (addToPlaylistOption) {
      addToPlaylistOption.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showAddToPlaylistModal();
      });
    }
    
    if (playNowOption) {
      playNowOption.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playNow();
      });
    }

    // Playlist detail modal events
    const closePlaylistDetailModal = document.getElementById('closePlaylistDetailModal');
    const playPlaylistBtn = document.getElementById('playPlaylistBtn');
    const editPlaylistBtn = document.getElementById('editPlaylistBtn');
    const deletePlaylistBtn = document.getElementById('deletePlaylistBtn');
    
    if (closePlaylistDetailModal) {
      closePlaylistDetailModal.addEventListener('click', () => this.hidePlaylistDetailModal());
    }
    if (playPlaylistBtn) {
      playPlaylistBtn.addEventListener('click', () => this.playCurrentDetailPlaylist());
    }
    if (editPlaylistBtn) {
      editPlaylistBtn.addEventListener('click', () => this.editCurrentDetailPlaylist());
    }
    if (deletePlaylistBtn) {
      deletePlaylistBtn.addEventListener('click', () => this.deleteCurrentDetailPlaylist());
    }

    // Playlist song context menu
    const removeSongOption = document.getElementById('removeSongOption');
    const playSongOption = document.getElementById('playSongOption');
    
    if (removeSongOption) {
      removeSongOption.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeCurrentSongFromPlaylist();
      });
    }
    if (playSongOption) {
      playSongOption.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playCurrentSong();
      });
    }

    // Modal backdrop clicks - only close if clicking directly on the modal backdrop
    document.addEventListener('click', (e) => {
      // Don't process backdrop clicks if playlist detail modal is open
      // (it has its own handler)
      if (this.isPlaylistDetailModalOpen) return;
      
      // Only close if we clicked exactly on an element with 'modal' class (the backdrop)
      if (e.target.classList.contains('modal')) {
        this.hideCreatePlaylistModal();
        this.hideAddToPlaylistModal();
        // Don't close playlist detail modal here - it has its own handler
      }
    });
  }

  loadPlaylists() {
    // Return empty object initially - will be loaded asynchronously
    return {};
  }

  // Load playlists asynchronously from Firebase
  async loadUserPlaylists() {
    try {
      console.log('🔄 Loading user playlists from Firebase...');
      this.showLoadingState('Loading your playlists...');
      
      const playlists = await window.firebaseMusicService.loadPlaylists();
      this.playlists = playlists;
      this.renderCustomPlaylists();
      this.renderLibraryPlaylists();
      
      console.log('✅ User playlists loaded:', Object.keys(playlists).length, 'playlists');
      this.hideLoadingState();
      
      // Show debug info
      if (window.firebaseMusicService) {
        window.firebaseMusicService.showPlaylistStatus();
      }
    } catch (error) {
      console.error('❌ Error loading user playlists:', error);
      this.playlists = {};
      this.hideLoadingState();
    }
  }

  // Manually refresh playlists
  async refreshPlaylists() {
    try {
      console.log('🔄 Manually refreshing playlists...');
      
      // Add rotation animation to the refresh button
      const refreshBtn = document.getElementById('refreshPlaylistsBtn');
      if (refreshBtn) {
        refreshBtn.style.transform = 'rotate(180deg)';
        refreshBtn.style.pointerEvents = 'none';
      }
      
      this.showLoadingState('Refreshing playlists...');
      
      if (window.firebaseMusicService && window.firebaseMusicService.currentUser) {
        await this.loadUserPlaylists();
        this.showNotification('Playlists refreshed successfully!', 'success');
      } else {
        this.loadLocalPlaylists();
        this.showNotification('Local playlists refreshed!', 'info');
      }
    } catch (error) {
      console.error('❌ Error refreshing playlists:', error);
      this.showNotification('Failed to refresh playlists', 'error');
    } finally {
      // Reset the refresh button
      const refreshBtn = document.getElementById('refreshPlaylistsBtn');
      if (refreshBtn) {
        setTimeout(() => {
          refreshBtn.style.transform = 'rotate(0deg)';
          refreshBtn.style.pointerEvents = 'auto';
        }, 300);
      }
      this.hideLoadingState();
    }
  }

  // Manually sync playlists to cloud
  async syncPlaylists() {
    if (!window.firebaseMusicService || !window.firebaseMusicService.isAuthenticated()) {
      this.showNotification('Please sign in to sync playlists', 'warning');
      return;
    }

    try {
      console.log('☁️ Manually syncing playlists to cloud...');
      
      const syncBtn = document.getElementById('syncPlaylistsBtn');
      if (syncBtn) {
        syncBtn.style.transform = 'scale(1.1)';
        syncBtn.style.pointerEvents = 'none';
      }
      
      this.showLoadingState('Syncing to cloud...');
      
      await window.firebaseMusicService.syncWhenOnline();
      this.showNotification('Playlists synced successfully!', 'success');
      
      // Hide sync button after successful sync
      if (syncBtn) {
        syncBtn.style.display = 'none';
      }
      
    } catch (error) {
      console.error('❌ Error syncing playlists:', error);
      this.showNotification('Failed to sync playlists', 'error');
    } finally {
      const syncBtn = document.getElementById('syncPlaylistsBtn');
      if (syncBtn) {
        setTimeout(() => {
          syncBtn.style.transform = 'scale(1)';
          syncBtn.style.pointerEvents = 'auto';
        }, 300);
      }
      this.hideLoadingState();
    }
  }

  // Load local playlists when signed out
  loadLocalPlaylists() {
    try {
      console.log('📂 Loading local playlists from localStorage...');
      
      // Get the appropriate localStorage key (user-specific if available)
      const localStorageKey = window.firebaseMusicService ? 
        window.firebaseMusicService.getLocalStorageKey() : 
        'musicPlayerPlaylists';
      
      const saved = localStorage.getItem(localStorageKey);
      this.playlists = saved ? JSON.parse(saved) : {};
      this.renderCustomPlaylists();
      this.renderLibraryPlaylists();
      this.hideLoadingState();
      console.log('✅ Local playlists loaded:', Object.keys(this.playlists).length, 'playlists from key:', localStorageKey);
      
      // Show sync button if user is authenticated and has local playlists
      this.checkAndShowSyncButton();
    } catch (error) {
      console.error('❌ Error loading local playlists:', error);
      this.playlists = {};
      this.renderCustomPlaylists();
      this.renderLibraryPlaylists();
      this.hideLoadingState();
    }
  }

  // Clear all playlists (used when switching users)
  clearPlaylists() {
    console.log('🧹 Clearing all playlists for user switch');
    this.playlists = {};
    this.currentSelectedSong = null;
    this.currentDetailPlaylist = null;
    this.currentContextPlaylist = null;
    this.currentContextSongIndex = null;
    
    // Re-render empty playlist views
    this.renderCustomPlaylists();
    this.renderLibraryPlaylists();
    
    // Hide any playlist-related UI elements
    this.checkAndShowSyncButton();
    
    console.log('✅ Playlists cleared successfully');
  }

  // Check if sync button should be shown
  checkAndShowSyncButton() {
    const syncBtn = document.getElementById('syncPlaylistsBtn');
    const goOnlineBtn = document.getElementById('goOnlineBtn');
    
    if (!syncBtn) return;
    
    const hasLocalPlaylists = Object.keys(this.playlists).length > 0;
    const isAuthenticated = window.firebaseMusicService && window.firebaseMusicService.isAuthenticated();
    const isFirestoreOnline = window.firebaseMusicService && window.firebaseMusicService.isFirestoreOnline;
    
    if (hasLocalPlaylists && isAuthenticated) {
      syncBtn.style.display = 'flex';
      console.log('💡 Showing sync button - local playlists available for sync');
    } else {
      syncBtn.style.display = 'none';
    }
    
    // Show go online button if user is authenticated but Firestore is offline
    if (goOnlineBtn && isAuthenticated && !isFirestoreOnline) {
      goOnlineBtn.style.display = 'flex';
      console.log('🌐 Showing go online button - Firestore appears offline');
    } else if (goOnlineBtn) {
      goOnlineBtn.style.display = 'none';
    }
  }

  // Force Firebase to go online
  async forceGoOnline() {
    if (!window.firebaseMusicService) {
      this.showNotification('Firebase service not available', 'error');
      return;
    }

    try {
      console.log('🌐 Forcing Firebase to go online...');
      this.showLoadingState('Connecting to Firebase...');
      
      const goOnlineBtn = document.getElementById('goOnlineBtn');
      if (goOnlineBtn) {
        goOnlineBtn.style.pointerEvents = 'none';
        goOnlineBtn.style.opacity = '0.5';
      }
      
      // Force reinitialize Firestore
      await window.firebaseMusicService.initializeFirestore();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to load playlists again
      if (window.firebaseMusicService.isAuthenticated()) {
        await this.loadUserPlaylists();
        this.showNotification('Successfully connected to Firebase!', 'success');
        
        // Hide the go online button after successful connection
        if (goOnlineBtn) {
          goOnlineBtn.style.display = 'none';
        }
      } else {
        this.showNotification('Please sign in to use cloud features', 'info');
      }
      
    } catch (error) {
      console.error('❌ Error forcing Firebase online:', error);
      this.showNotification('Failed to connect to Firebase', 'error');
    } finally {
      this.hideLoadingState();
      const goOnlineBtn = document.getElementById('goOnlineBtn');
      if (goOnlineBtn) {
        goOnlineBtn.style.pointerEvents = 'auto';
        goOnlineBtn.style.opacity = '1';
      }
    }
  }

  savePlaylists() {
    // Save to Firebase (with localStorage fallback)
    if (window.firebaseMusicService) {
      window.firebaseMusicService.savePlaylists(this.playlists);
    } else {
      // Fallback to localStorage if Firebase service not available
      const localStorageKey = window.firebaseMusicService ? 
        window.firebaseMusicService.getLocalStorageKey() : 
        'musicPlayerPlaylists';
      localStorage.setItem(localStorageKey, JSON.stringify(this.playlists));
    }
  }

  // Force save playlists immediately (useful before user switches)
  async savePlaylistsImmediate() {
    if (window.firebaseMusicService) {
      await window.firebaseMusicService.savePlaylists(this.playlists);
    } else {
      const localStorageKey = window.firebaseMusicService ? 
        window.firebaseMusicService.getLocalStorageKey() : 
        'musicPlayerPlaylists';
      localStorage.setItem(localStorageKey, JSON.stringify(this.playlists));
    }
  }

  // Show loading state
  showLoadingState(message) {
    const statusElement = document.getElementById('playlistStatus');
    const statusText = statusElement.querySelector('.status-text');
    
    if (statusElement && statusText) {
      statusText.textContent = message;
      statusElement.style.display = 'block';
    }
  }

  // Hide loading state
  hideLoadingState() {
    const statusElement = document.getElementById('playlistStatus');
    if (statusElement) {
      statusElement.style.display = 'none';
    }
  }

  createPlaylist() {
    const nameInput = document.getElementById('playlistName');
    const descriptionInput = document.getElementById('playlistDescription');
    
    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    
    if (!name) {
      alert('Please enter a playlist name');
      return;
    }

    if (this.playlists[name]) {
      alert('A playlist with this name already exists');
      return;
    }

    this.playlists[name] = {
      name: name,
      description: description,
      songs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.savePlaylists();
    this.renderCustomPlaylists();
    this.renderLibraryPlaylists();
    this.hideCreatePlaylistModal();
    
    // Clear form
    nameInput.value = '';
    descriptionInput.value = '';
  }

  deletePlaylist(playlistName) {
    if (confirm(`Are you sure you want to delete "${playlistName}"?`)) {
      delete this.playlists[playlistName];
      this.savePlaylists();
      this.renderCustomPlaylists();
      this.renderLibraryPlaylists();
    }
  }

  renamePlaylist(oldName) {
    const newName = prompt('Enter new playlist name:', oldName);
    if (newName && newName.trim() && newName !== oldName) {
      const trimmedName = newName.trim();
      if (this.playlists[trimmedName]) {
        alert('A playlist with this name already exists');
        return;
      }
      
      this.playlists[trimmedName] = { ...this.playlists[oldName] };
      this.playlists[trimmedName].name = trimmedName;
      this.playlists[trimmedName].updatedAt = new Date().toISOString();
      delete this.playlists[oldName];
      
      this.savePlaylists();
      this.renderCustomPlaylists();
      this.renderLibraryPlaylists();
    }
  }

  addSongToPlaylist(playlistName, song) {
    if (!this.playlists[playlistName]) {
      console.error('Playlist not found:', playlistName);
      return;
    }

    // Check if song already exists in playlist
    const exists = this.playlists[playlistName].songs.some(s => 
      s.src === song.src || (s.previewUrl && s.previewUrl === song.previewUrl)
    );

    if (exists) {
      alert('This song is already in the playlist');
      return;
    }

    this.playlists[playlistName].songs.push(song);
    this.playlists[playlistName].updatedAt = new Date().toISOString();
    this.savePlaylists();
    this.renderCustomPlaylists();
    this.renderLibraryPlaylists();
    
    // Show success message
    this.showToast(`Added to "${playlistName}"`);
  }

  removeSongFromPlaylist(playlistName, songIndex) {
    if (!this.playlists[playlistName]) return;
    
    this.playlists[playlistName].songs.splice(songIndex, 1);
    this.playlists[playlistName].updatedAt = new Date().toISOString();
    this.savePlaylists();
    this.renderCustomPlaylists();
    this.renderLibraryPlaylists();
  }

  playPlaylist(playlistName) {
    const playlist = this.playlists[playlistName];
    if (!playlist || playlist.songs.length === 0) {
      alert('This playlist is empty');
      return;
    }

    // Replace current songs array with playlist songs
    songs.length = 0;
    songs.push(...playlist.songs);
    
    index = 0;
    renderPlaylist();
    
    // Start playing the first song
    if (window.audioPlayerManager) {
      window.audioPlayerManager.playSong(songs[0], songs, 0);
    } else {
      loadSong(songs[0]);
      audio.play().catch(error => console.error('Error playing song:', error));
    }

    // Switch to the playlist page to show what's playing
    switchPage('playlist');
  }

  showCreatePlaylistModal() {
    const modal = document.getElementById('createPlaylistModal');
    if (modal) {
      modal.classList.add('show');
      document.getElementById('playlistName').focus();
    }
  }

  hideCreatePlaylistModal() {
    const modal = document.getElementById('createPlaylistModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  showAddToPlaylistModal() {
    const modal = document.getElementById('addToPlaylistModal');
    const list = document.getElementById('playlistSelectionList');
    
    if (!modal || !list) return;

    // Clear and populate playlist list
    list.innerHTML = '';
    
    const playlistNames = Object.keys(this.playlists);
    if (playlistNames.length === 0) {
      list.innerHTML = `
        <div class="empty-playlists">
          <div class="empty-playlists-icon">📝</div>
          <h3>No playlists yet</h3>
          <p>Create your first playlist to get started</p>
        </div>
      `;
    } else {
      playlistNames.forEach(name => {
        const playlist = this.playlists[name];
        const item = document.createElement('div');
        item.className = 'playlist-selection-item';
        item.innerHTML = `
          <div class="playlist-selection-icon">🎵</div>
          <div class="playlist-selection-info">
            <h4>${playlist.name}</h4>
            <p>${playlist.songs.length} songs</p>
          </div>
        `;
        item.addEventListener('click', () => {
          this.addSongToPlaylist(name, this.currentSelectedSong);
          this.hideAddToPlaylistModal();
        });
        list.appendChild(item);
      });
    }
    
    modal.classList.add('show');
  }

  hideAddToPlaylistModal() {
    const modal = document.getElementById('addToPlaylistModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  showContextMenu(e, song) {
    e.preventDefault();
    e.stopPropagation();
    
    this.currentSelectedSong = song;
    const contextMenu = document.getElementById('contextMenu');
    
    if (!contextMenu) return;
    
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
    
    // Adjust position if menu goes off screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      contextMenu.style.left = (e.pageX - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.style.top = (e.pageY - rect.height) + 'px';
    }
  }

  hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
      contextMenu.style.display = 'none';
    }
    this.hidePlaylistSongContextMenu();
  }

  playNow() {
    if (!this.currentSelectedSong) return;
    
    // Add song to current queue if not already there
    const songExists = songs.some(s => 
      s.src === this.currentSelectedSong.src || 
      (s.previewUrl && s.previewUrl === this.currentSelectedSong.previewUrl)
    );
    
    if (!songExists) {
      songs.push(this.currentSelectedSong);
      renderPlaylist();
    }
    
    // Find the song index and play it
    const songIndex = songs.findIndex(s => 
      s.src === this.currentSelectedSong.src || 
      (s.previewUrl && s.previewUrl === this.currentSelectedSong.previewUrl)
    );
    
    if (songIndex !== -1) {
      index = songIndex;
      if (window.audioPlayerManager) {
        window.audioPlayerManager.playSong(songs[songIndex], songs, songIndex);
      } else {
        loadSong(songs[songIndex]);
        audio.play().catch(error => console.error('Error playing song:', error));
      }
    }
    
    this.hideContextMenu();
  }

  renderCustomPlaylists() {
    const container = document.getElementById('customPlaylists');
    if (!container) return;

    const playlistNames = Object.keys(this.playlists);
    
    if (playlistNames.length === 0) {
      container.innerHTML = `
        <div class="empty-playlists">
          <div class="empty-playlists-icon">🎵</div>
          <h3>No playlists yet</h3>
          <p>Create your first playlist to organize your favorite songs</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    
    playlistNames.forEach(name => {
      const playlist = this.playlists[name];
      const card = document.createElement('div');
      card.className = 'playlist-card';
      
      card.innerHTML = `
        <div class="playlist-actions">
          <button class="playlist-action-btn" onclick="playlistManager.renamePlaylist('${name}')" title="Rename Playlist">✏️</button>
          <button class="playlist-action-btn delete-btn" onclick="playlistManager.deletePlaylist('${name}')" title="Delete Playlist">🗑️</button>
        </div>
        <div class="playlist-card-cover ${playlist.songs.length > 0 ? 'has-songs' : ''}">
          🎵
        </div>
        <div class="playlist-card-info">
          <h4>${playlist.name}</h4>
          <p>${playlist.description || 'No description'}</p>
          <div class="playlist-card-meta">
            ${playlist.songs.length} songs
            <span class="playlist-hint">Hover for options</span>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        // Don't open playlist detail if clicking on action buttons or their parent container
        if (!e.target.classList.contains('playlist-action-btn') && 
            !e.target.closest('.playlist-actions')) {
          this.showPlaylistDetail(name);
        }
      });

      container.appendChild(card);
    });
  }

  renderLibraryPlaylists() {
    const container = document.getElementById('libraryPlaylists');
    if (!container) return;

    const playlistNames = Object.keys(this.playlists);
    
    if (playlistNames.length === 0) {
      container.innerHTML = `
        <div class="empty-playlists">
          <div class="empty-playlists-icon">🎵</div>
          <h3>No playlists yet</h3>
          <p>Create playlists to organize your favorite songs</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    
    playlistNames.forEach(name => {
      const playlist = this.playlists[name];
      const card = document.createElement('div');
      card.className = 'playlist-card';
      
      card.innerHTML = `
        <div class="playlist-card-cover ${playlist.songs.length > 0 ? 'has-songs' : ''}">
          🎵
        </div>
        <div class="playlist-card-info">
          <h4>${playlist.name}</h4>
          <p>${playlist.description || 'No description'}</p>
          <div class="playlist-card-meta">
            ${playlist.songs.length} songs
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.showPlaylistDetail(name);
      });

      container.appendChild(card);
    });
  }

  showPlaylistDetail(playlistName) {
    const playlist = this.playlists[playlistName];
    if (!playlist) return;

    this.currentDetailPlaylist = playlistName;
    this.isPlaylistDetailModalOpen = true;
    
    const modal = document.getElementById('playlistDetailModal');
    const title = document.getElementById('playlistDetailTitle');
    const name = document.getElementById('playlistDetailName');
    const description = document.getElementById('playlistDetailDescription');
    const stats = document.getElementById('playlistDetailStats');
    const songsList = document.getElementById('playlistSongsList');
    
    if (!modal) return;
    
    title.textContent = playlist.name;
    name.textContent = playlist.name;
    description.textContent = playlist.description || 'No description';
    stats.textContent = `${playlist.songs.length} songs`;
    
    // Render songs list
    songsList.innerHTML = '';
    
    if (playlist.songs.length === 0) {
      songsList.innerHTML = `
        <div class="empty-playlists">
          <div class="empty-playlists-icon">🎵</div>
          <h3>This playlist is empty</h3>
          <p>Add songs by right-clicking on them and selecting "Add to Playlist"</p>
        </div>
      `;
    } else {
      playlist.songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-song-item';
        item.innerHTML = `
          <div class="playlist-song-number">${index + 1}</div>
          <img class="playlist-song-cover" src="${song.cover}" alt="${song.title}">
          <div class="playlist-song-info">
            <h5>${song.title}</h5>
            <p>${song.artist}</p>
          </div>
          <div class="playlist-song-duration">3:30</div>
        `;
        
        item.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent event bubbling
          this.playSongFromPlaylist(playlistName, index);
        });
        
        item.addEventListener('contextmenu', (e) => {
          this.showPlaylistSongContextMenu(e, playlistName, index);
        });
        
        songsList.appendChild(item);
      });
    }
    
    modal.classList.add('show');
  }

  hidePlaylistDetailModal() {
    this.isPlaylistDetailModalOpen = false;
    const modal = document.getElementById('playlistDetailModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  playCurrentDetailPlaylist() {
    if (this.currentDetailPlaylist) {
      this.playPlaylist(this.currentDetailPlaylist);
      // Don't close the modal - let user continue browsing
      this.showToast(`Playing playlist: ${this.currentDetailPlaylist}`);
    }
  }

  editCurrentDetailPlaylist() {
    if (this.currentDetailPlaylist) {
      this.renamePlaylist(this.currentDetailPlaylist);
    }
  }

  deleteCurrentDetailPlaylist() {
    if (this.currentDetailPlaylist) {
      this.deletePlaylist(this.currentDetailPlaylist);
      this.hidePlaylistDetailModal(); // Close the modal after deletion
    }
  }

  playSongFromPlaylist(playlistName, songIndex) {
    const playlist = this.playlists[playlistName];
    if (!playlist || !playlist.songs[songIndex]) return;
    
    // Replace current songs array with playlist songs
    songs.length = 0;
    songs.push(...playlist.songs);
    
    index = songIndex;
    renderPlaylist();
    
    // Ensure the song has a valid source
    const songToPlay = songs[songIndex];
    if (!songToPlay.src && songToPlay.previewUrl) {
      songToPlay.src = songToPlay.previewUrl;
    }
    
    // Start playing the selected song
    if (window.audioPlayerManager && songToPlay.src) {
      window.audioPlayerManager.playSong(songToPlay, songs, songIndex);
    } else if (songToPlay.src) {
      loadSong(songToPlay);
      audio.play().catch(error => console.error('Error playing song:', error));
    } else {
      this.showToast('Unable to play this song - no audio source available');
      return;
    }

    // Don't close the modal or switch pages - let user continue browsing the playlist
    // Show a brief toast notification that the song is now playing
    this.showToast(`Now playing: ${playlist.songs[songIndex].title}`);
  }

  showPlaylistSongContextMenu(e, playlistName, songIndex) {
    e.preventDefault();
    e.stopPropagation();
    
    this.currentContextPlaylist = playlistName;
    this.currentContextSongIndex = songIndex;
    
    const contextMenu = document.getElementById('playlistSongContextMenu');
    if (!contextMenu) return;
    
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
    
    // Adjust position if menu goes off screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      contextMenu.style.left = (e.pageX - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.style.top = (e.pageY - rect.height) + 'px';
    }
  }

  removeCurrentSongFromPlaylist() {
    if (this.currentContextPlaylist && this.currentContextSongIndex !== null) {
      this.removeSongFromPlaylist(this.currentContextPlaylist, this.currentContextSongIndex);
      this.showPlaylistDetail(this.currentContextPlaylist); // Refresh the detail view
    }
    this.hidePlaylistSongContextMenu();
  }

  playCurrentSong() {
    if (this.currentContextPlaylist && this.currentContextSongIndex !== null) {
      this.playSongFromPlaylist(this.currentContextPlaylist, this.currentContextSongIndex);
    }
    this.hidePlaylistSongContextMenu();
  }

  hidePlaylistSongContextMenu() {
    const contextMenu = document.getElementById('playlistSongContextMenu');
    if (contextMenu) {
      contextMenu.style.display = 'none';
    }
  }

  showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(29, 185, 84, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      z-index: 1003;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize playlist manager
let playlistManager;

// Make sure playlist manager is available globally
window.playlistManager = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎵 Initializing Music Player App...');
  playlistManager = new PlaylistManager();
  window.playlistManager = playlistManager;
  
  // Initial render of library content
  renderLibraryContent();
  console.log('✅ Music Player App initialized successfully');
});
