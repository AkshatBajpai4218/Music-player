// Global variables - same as homepage
let searchHistory = ['hindi songs', 'english songs', 'arijit singh', 'taylor swift', 'ed sheeran', 'love songs', 'bollywood', 'punjabi songs'];
let selectedSuggestionIndex = -1;
let currentSearchResults = [];
let suggestionItems = [];

// Search elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchSuggestions = document.getElementById('searchSuggestions');

// Results elements
const resultsTitle = document.getElementById('resultsTitle');
const resultsSubtitle = document.getElementById('resultsSubtitle');
const resultsCount = document.getElementById('resultsCount');
const resultsGrid = document.getElementById('resultsGrid');

// Enhanced fetch songs function with multiple fallbacks
async function fetchSongs(query) {
  console.log(`🔍 Searching for: "${query}"`);
  
  const searchUrls = [
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`,
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=20`,
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicTrack&limit=20`
  ];
  
  for (let i = 0; i < searchUrls.length; i++) {
    try {
      console.log(`🌐 Trying URL ${i + 1}:`, searchUrls[i]);
      
      const response = await fetch(searchUrls[i]);
      console.log(`📡 Response status:`, response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 API Response:`, data);
      
      if (data.results && data.results.length > 0) {
        console.log(`✅ Found ${data.results.length} results from URL ${i + 1}`);
        return data.results;
      } else {
        console.log(`⚠️ No results from URL ${i + 1}`);
      }
      
    } catch (error) {
      console.error(`❌ Error with URL ${i + 1}:`, error);
      if (i === searchUrls.length - 1) {
        console.log(`🔄 All URLs failed, using mock data...`);
        return getMockData(query);
      }
    }
  }
  
  return [];
}

// Mock data for fallback
function getMockData(query) {
  const mockResults = [
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
    },
    {
      trackName: "Dil Diyan Gallan",
      artistName: "Atif Aslam",
      artworkUrl100: "images/default.jpg",
      previewUrl: "songs/sample.mp3"
    },
    {
      trackName: "Hawayein",
      artistName: "Arijit Singh",
      artworkUrl100: "images/default.jpg",
      previewUrl: "songs/sample.mp3"
    },
    {
      trackName: "Channa Mereya",
      artistName: "Arijit Singh",
      artworkUrl100: "images/default.jpg",
      previewUrl: "songs/sample.mp3"
    }
  ];
  
  // Filter based on query
  const filtered = mockResults.filter(track => 
    track.trackName.toLowerCase().includes(query.toLowerCase()) ||
    track.artistName.toLowerCase().includes(query.toLowerCase())
  );
  
  return filtered.length > 0 ? filtered : mockResults.slice(0, 6);
}

// Search functionality
async function performSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showEmptyState();
    return;
  }

  console.log(`🔍 Performing search for: "${query}"`);
  showLoadingState();
  
  try {
    const results = await fetchSongs(query);
    renderSearchResults(results, query);
    
    // Add to search history
    if (!searchHistory.includes(query)) {
      searchHistory.unshift(query);
      if (searchHistory.length > 10) {
        searchHistory.pop();
      }
    }
    
  } catch (error) {
    console.error("❌ Search failed:", error);
    showErrorState(query);
  }
}

// Render search results
function renderSearchResults(results, query) {
  resultsTitle.textContent = `Search Results for "${query}"`;
  resultsSubtitle.textContent = `Found ${results.length} ${results.length === 1 ? 'result' : 'results'}`;
  resultsCount.textContent = `${results.length} results found`;
  
  resultsGrid.innerHTML = '';
  
  if (results.length === 0) {
    showNoResultsState(query);
    return;
  }
  
  results.forEach(track => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.onclick = () => {
      // Use the global audio player manager
      window.audioPlayerManager.playSong(track, results, results.indexOf(track));
    };
    
    card.innerHTML = `
      <img src="${track.artworkUrl100 || 'images/default.jpg'}" alt="${track.trackName}">
      <h4>${track.trackName}</h4>
      <p>${track.artistName}</p>
    `;
    
    resultsGrid.appendChild(card);
  });
  
  console.log(`✅ Rendered ${results.length} search results`);
}

// State management functions
function showEmptyState() {
  resultsTitle.textContent = 'Search Results';
  resultsSubtitle.textContent = 'Start typing to search for music';
  resultsCount.textContent = '0 results';
  
  resultsGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>Start your search</h3>
      <p>Use the search bar above to find your favorite music</p>
    </div>
  `;
}

function showLoadingState() {
  resultsTitle.textContent = 'Searching...';
  resultsSubtitle.textContent = 'Please wait while we find your music';
  resultsCount.textContent = 'Loading...';
  
  resultsGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Searching for music...</p>
    </div>
  `;
}

function showNoResultsState(query) {
  resultsGrid.innerHTML = `
    <div class="no-results">
      <div class="no-results-icon">😞</div>
      <h3>No results found for "${query}"</h3>
      <p>Try searching for different keywords or check your spelling</p>
    </div>
  `;
}

function showErrorState(query) {
  resultsTitle.textContent = 'Search Failed';
  resultsSubtitle.textContent = 'Please try again';
  resultsCount.textContent = 'Error';
  
  resultsGrid.innerHTML = `
    <div class="no-results">
      <div class="no-results-icon">⚠️</div>
      <h3>Search failed</h3>
      <p>Please check your internet connection and try again</p>
      <button onclick="testSearch()" class="debug-btn" style="margin-top: 20px;">
        🧪 Test Search Function
      </button>
    </div>
  `;
}

// Debounce function - same as homepage
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

// Search suggestions functionality - exact copy from homepage
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
    searchInput.value = `${suggestion.title} ${suggestion.artist}`;
    searchSuggestions.classList.remove('show');
    selectedSuggestionIndex = -1;
    performSearch();
  }
}

function highlightSuggestion(index) {
  // Remove previous highlight
  suggestionItems.forEach(item => item.classList.remove('highlighted'));
  
  if (index >= 0 && index < suggestionItems.length) {
    suggestionItems[index].classList.add('highlighted');
    suggestionItems[index].scrollIntoView({ block: 'nearest' });
    selectedSuggestionIndex = index;
  } else {
    selectedSuggestionIndex = -1;
  }
}

// Debounced search function - same as homepage
const debouncedSearch = debounce(showSearchSuggestions, 300);

// Enhanced search event listeners - exact copy from homepage
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  selectedSuggestionIndex = -1;
  debouncedSearch(query);
});

searchInput.addEventListener('focus', (e) => {
  const query = e.target.value.trim();
  if (query) {
    debouncedSearch(query);
  }
});

// Keyboard navigation for search suggestions - exact copy from homepage
searchInput.addEventListener('keydown', (e) => {
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
      break;
  }
});

searchBtn.addEventListener('click', () => {
  searchSuggestions.classList.remove('show');
  selectedSuggestionIndex = -1;
  performSearch();
});

// Filter results function
function filterResults(type) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // For now, show all results (can be enhanced later)
  console.log(`Filter selected: ${type}`);
}

// Debug functions
async function testSearch() {
  console.log("🧪 Testing search functionality...");
  searchInput.value = "taylor swift";
  await performSearch();
}

function diagnoseProblem() {
  console.log("🔧 Running diagnostics...");
  
  // Check elements
  console.log("Search input exists:", !!searchInput);
  console.log("Results grid exists:", !!resultsGrid);
  
  // Test basic fetch
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

// Get URL parameters
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    query: urlParams.get('q') || urlParams.get('query')
  };
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  console.log("🎵 Search Results page loaded!");
  
  // Check if there's a search query in URL
  const params = getUrlParams();
  if (params.query) {
    searchInput.value = params.query;
    performSearch();
  } else {
    showEmptyState();
  }
  
  console.log("🔍 Search ready. Type in search box or use debug tools.");
});

// Hide suggestions when clicking outside - same as homepage
document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
    searchSuggestions.classList.remove('show');
    selectedSuggestionIndex = -1;
  }
});