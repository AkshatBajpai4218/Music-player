// Firebase Service for Music Player
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, enableNetwork, disableNetwork, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCK5J9-5_20VRgfaZLKIenv_dWL09gix3o",
    authDomain: "sargam-93a31.firebaseapp.com",
    projectId: "sargam-93a31",
    storageBucket: "sargam-93a31.firebasestorage.app",
    messagingSenderId: "1030223620895",
    appId: "1:1030223620895:web:03ecbeeaefbb8d05355e2a",
    measurementId: "G-THYZXG9LS0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Music Player Service
class FirebaseMusicService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.currentUser = null;
        this.authStateResolved = false;
        this.isFirestoreOnline = false;
        
        // Force Firestore online on initialization
        this.initializeFirestore();
        
        // Listen for auth state changes
        onAuthStateChanged(this.auth, (user) => {
            const previousUser = this.currentUser;
            
            // If switching from one user to another, save previous user's playlists first
            if (previousUser && user && previousUser.uid !== user.uid && window.playlistManager) {
                console.log('Switching users - saving previous user playlists first');
                this.savePlaylistsForUser(previousUser.uid, window.playlistManager.playlists);
            }
            
            this.currentUser = user;
            this.authStateResolved = true; // Mark auth state as resolved
            
            if (user) {
                console.log('User authenticated:', user.email);
                this.showUserInHeader();
                
                // Trigger playlist reload when user changes
                if (window.playlistManager) {
                    // Clear current playlists first to prevent mixing user data
                    console.log('🔄 Loading playlists for new user:', user.email);
                    window.playlistManager.clearPlaylists();
                    
                    // Add a small delay to ensure previous user's data is saved
                    setTimeout(() => {
                        window.playlistManager.loadUserPlaylists();
                    }, 500);
                }
            } else {
                console.log('User signed out');
                this.hideUserFromHeader();
                
                // If user signed out, save their playlists first if they existed
                if (previousUser && window.playlistManager) {
                    console.log('User signed out - saving playlists before clearing');
                    this.savePlaylistsForUser(previousUser.uid, window.playlistManager.playlists);
                }
                
                this.currentUser = null;
                
                // Clear current playlists and load local playlists when signed out
                if (window.playlistManager) {
                    console.log('🔄 User signed out - clearing user-specific playlists');
                    window.playlistManager.clearPlaylists();
                    window.playlistManager.loadLocalPlaylists();
                }
            }
        });
    }

    // Initialize Firestore and force it online
    async initializeFirestore() {
        try {
            console.log('🔥 Initializing Firestore connection...');
            
            // Force enable network
            await enableNetwork(this.db);
            console.log('✅ Firestore network enabled successfully');
            this.isFirestoreOnline = true;
            
            // Test the connection with a simple operation
            setTimeout(async () => {
                try {
                    const testDoc = doc(this.db, '_test', 'connection');
                    await getDoc(testDoc);
                    console.log('✅ Firestore connection test passed');
                    this.isFirestoreOnline = true;
                    
                    // Update UI buttons
                    if (window.playlistManager) {
                        window.playlistManager.checkAndShowSyncButton();
                    }
                } catch (error) {
                    console.warn('⚠️ Firestore connection test failed:', error.message);
                    this.isFirestoreOnline = false;
                    
                    // Update UI buttons
                    if (window.playlistManager) {
                        window.playlistManager.checkAndShowSyncButton();
                    }
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ Failed to initialize Firestore:', error);
            this.isFirestoreOnline = false;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Check if Firebase is ready and initialized
    isReady() {
        const ready = this.db !== null && this.auth !== null && this.authStateResolved;
        if (!ready) {
            console.log('🔍 Firebase not ready:', {
                db: !!this.db,
                auth: !!this.auth,
                authStateResolved: this.authStateResolved
            });
        }
        return ready;
    }

    // Promise that resolves when auth state is determined
    waitForAuthState() {
        if (this.authStateResolved) {
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                // Auth state has been determined
                unsubscribe(); // Stop listening
                resolve();
            });
        });
    }

    // Get current user ID
    getCurrentUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }

    // Debug function to check current state
    debugState() {
        console.log('🐛 Firebase Service Debug State:', {
            authStateResolved: this.authStateResolved,
            currentUser: this.currentUser ? {
                email: this.currentUser.email,
                uid: this.currentUser.uid
            } : null,
            isReady: this.isReady(),
            isAuthenticated: this.isAuthenticated()
        });
    }

    // Test Firestore connectivity
    async testFirestoreConnection() {
        try {
            console.log('🔍 Testing Firestore connectivity...');
            
            // Try to enable network first
            await enableNetwork(this.db);
            console.log('✅ Firestore network enabled');
            
            // Try a simple read operation
            const testDoc = doc(this.db, 'test', 'connection');
            await getDoc(testDoc);
            console.log('✅ Firestore connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Firestore connection test failed:', error);
            return false;
        }
    }

    // Attempt to sync local data when connection is restored
    async syncWhenOnline() {
        if (!this.isAuthenticated()) return;
        
        try {
            // Test if we can connect to Firestore
            const isConnected = await this.testFirestoreConnection();
            if (!isConnected) {
                console.log('🔍 Still offline, sync will retry later');
                return;
            }
            
            // Load local playlists and sync to Firebase
            const localData = localStorage.getItem('musicPlayerPlaylists');
            if (localData && window.playlistManager) {
                const playlists = JSON.parse(localData);
                if (Object.keys(playlists).length > 0) {
                    console.log('🔄 Syncing local playlists to Firebase...');
                    await this.savePlaylists(playlists);
                    
                    if (typeof showNotification === 'function') {
                        showNotification('Playlists synced to cloud!', 'success');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error during sync:', error);
        }
    }

    // Get current user info
    getCurrentUser() {
        if (!this.currentUser) return null;
        
        return {
            id: this.currentUser.uid,
            name: this.currentUser.displayName || this.currentUser.email.split('@')[0],
            email: this.currentUser.email,
            picture: this.currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.displayName || this.currentUser.email.split('@')[0])}&background=ff6b6b&color=fff&size=120`
        };
    }

    // Get localStorage key for current user
    getLocalStorageKey() {
        if (this.isAuthenticated()) {
            return `musicPlayerPlaylists_${this.getCurrentUserId()}`;
        }
        return 'musicPlayerPlaylists'; // Default key for anonymous users
    }

    // Save playlists to Firebase for current user
    async savePlaylists(playlists) {
        const localStorageKey = this.getLocalStorageKey();
        
        if (!this.isAuthenticated()) {
            // Fallback to localStorage if not authenticated
            localStorage.setItem(localStorageKey, JSON.stringify(playlists));
            console.log('💾 Saved playlists to localStorage with key:', localStorageKey);
            return;
        }
        
        const userId = this.getCurrentUserId();
        return this.savePlaylistsForUser(userId, playlists);
    }

    // Save playlists to Firebase for specific user
    async savePlaylistsForUser(userId, playlists) {
        if (!userId || !playlists) return;
        
        try {
            const userDoc = doc(this.db, 'users', userId);
            
            await setDoc(userDoc, {
                playlists: playlists,
                updatedAt: new Date().toISOString(),
                lastUserId: userId
            }, { merge: true });
            
            console.log('Playlists saved to Firebase for user ID:', userId);
        } catch (error) {
            console.error('Error saving playlists to Firebase for user:', userId, error);
            
            // Check if it's an offline error
            const isOfflineError = error.message.includes('offline') || 
                                 error.message.includes('network') || 
                                 error.code === 'unavailable';
            
            if (isOfflineError) {
                console.log('📱 Offline - saving to localStorage for sync later');
                if (typeof showNotification === 'function') {
                    showNotification('Saved locally - will sync when online', 'info');
                }
            }
            
            // Fallback to user-specific localStorage
            if (this.isAuthenticated() && this.getCurrentUserId() === userId) {
                const localStorageKey = `musicPlayerPlaylists_${userId}`;
                localStorage.setItem(localStorageKey, JSON.stringify(playlists));
                console.log('✅ Saved to localStorage as fallback with key:', localStorageKey);
            }
        }
    }

    // Load playlists from Firebase for current user
    async loadPlaylists() {
        console.log('🔄 Loading playlists...');
        console.log('🔍 Auth state resolved:', this.authStateResolved);
        console.log('🔍 Current user:', this.currentUser ? this.currentUser.email : 'null');
        console.log('🔍 Is authenticated:', this.isAuthenticated());
        
        const localStorageKey = this.getLocalStorageKey();
        
        if (!this.isAuthenticated()) {
            console.log('📱 Not authenticated, loading from localStorage with key:', localStorageKey);
            // Fallback to localStorage if not authenticated
            try {
                const saved = localStorage.getItem(localStorageKey);
                const playlists = saved ? JSON.parse(saved) : {};
                console.log('✅ Loaded from localStorage:', Object.keys(playlists).length, 'playlists');
                return playlists;
            } catch (error) {
                console.error('❌ Error loading from localStorage:', error);
                return {};
            }
        }

        try {
            const userId = this.getCurrentUserId();
            console.log('🔥 Loading from Firebase for user:', this.currentUser.email, '| ID:', userId);
            
            // Force reinitialize Firestore if it seems offline
            if (!this.isFirestoreOnline) {
                console.log('🔄 Firestore appears offline, attempting to reconnect...');
                await this.initializeFirestore();
                
                // Wait a moment for connection to establish
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Try to enable network first (in case it was disabled)
            try {
                await enableNetwork(this.db);
                console.log('✅ Firestore network enabled');
                this.isFirestoreOnline = true;
            } catch (networkError) {
                console.log('⚠️ Network already enabled or error:', networkError.message);
            }
            
            const userDoc = doc(this.db, 'users', userId);
            const userSnap = await getDoc(userDoc);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const playlists = userData.playlists || {};
                console.log('✅ Playlists loaded from Firebase:', Object.keys(playlists).length, 'playlists');
                console.log('📋 Playlist names:', Object.keys(playlists));
                return playlists;
            } else {
                console.log('📝 No Firebase document found, checking for local playlists to migrate...');
                // User document doesn't exist yet, check for migration from localStorage
                const localPlaylists = await this.migrateLocalPlaylistsToFirebase();
                return localPlaylists;
            }
        } catch (error) {
            console.error('❌ Error loading playlists from Firebase:', error);
            
            // Check if it's an offline error
            const isOfflineError = error.message.includes('offline') || 
                                 error.message.includes('network') || 
                                 error.code === 'unavailable';
            
            if (isOfflineError) {
                console.log('� Detected offline error, using local storage');
                // Show user-friendly message for offline scenario
                if (typeof showNotification === 'function') {
                    showNotification('You\'re offline - showing cached playlists', 'info');
                }
            } else {
                console.log('�🔄 Firebase error (not offline), falling back to localStorage...');
            }
            
            // Fallback to user-specific localStorage
            try {
                const localStorageKey = this.getLocalStorageKey();
                const saved = localStorage.getItem(localStorageKey);
                const playlists = saved ? JSON.parse(saved) : {};
                console.log('✅ Fallback successful:', Object.keys(playlists).length, 'playlists from localStorage key:', localStorageKey);
                return playlists;
            } catch (fallbackError) {
                console.error('❌ Error loading from localStorage fallback:', fallbackError);
                return {};
            }
        }
    }

    // Migrate localStorage playlists to Firebase (one-time migration)
    async migrateLocalPlaylistsToFirebase() {
        if (!this.isAuthenticated()) return {};

        try {
            // Check both old generic key and new user-specific key
            const genericKey = 'musicPlayerPlaylists';
            const userSpecificKey = this.getLocalStorageKey();
            
            let localPlaylists = localStorage.getItem(userSpecificKey) || localStorage.getItem(genericKey);
            
            if (localPlaylists) {
                const parsedPlaylists = JSON.parse(localPlaylists);
                if (Object.keys(parsedPlaylists).length > 0) {
                    console.log('Migrating local playlists to Firebase...');
                    await this.savePlaylists(parsedPlaylists);
                    console.log('Local playlists migrated to Firebase for user:', this.currentUser.email);
                    
                    // Clean up old generic key if it was used
                    if (localStorage.getItem(genericKey) && userSpecificKey !== genericKey) {
                        localStorage.removeItem(genericKey);
                        console.log('Cleaned up old generic localStorage key');
                    }
                    return parsedPlaylists;
                }
            }
            return {};
        } catch (error) {
            console.error('Error migrating local playlists to Firebase:', error);
            return {};
        }
    }

    // Show user info in header
    showUserInHeader() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        const userInfo = document.getElementById('userInfo');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (userInfo && userAvatar && userName) {
            userAvatar.src = user.picture;
            userName.textContent = user.name;
            userInfo.style.display = 'flex';
        }
    }

    // Hide user info from header
    hideUserFromHeader() {
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }

    // Show authentication status in UI
    showAuthStatus() {
        const user = this.getCurrentUser();
        if (user) {
            console.log(`🔐 Authenticated as: ${user.name} (${user.email})`);
            console.log(`📱 Playlists will be synced to your account`);
            console.log(`🆔 User ID: ${user.id}`);
        } else {
            console.log(`🔓 Not authenticated - using local storage`);
            console.log(`💡 Sign in at account.html to sync playlists across devices`);
        }
    }

    // Debug method to show current playlist status
    showPlaylistStatus() {
        if (window.playlistManager) {
            const playlistCount = Object.keys(window.playlistManager.playlists).length;
            const user = this.getCurrentUser();
            console.log(`📊 Current Status:`);
            console.log(`   User: ${user ? user.email : 'Not authenticated'}`);
            console.log(`   Playlists: ${playlistCount}`);
            console.log(`   Playlist names:`, Object.keys(window.playlistManager.playlists));
        }
    }
}

// Create and export the service instance
const firebaseMusicService = new FirebaseMusicService();

// Make it globally available
window.firebaseMusicService = firebaseMusicService;

// Show auth status when service loads
firebaseMusicService.showAuthStatus();

// Listen for online/offline events
window.addEventListener('online', () => {
    console.log('🌐 Connection restored - attempting to sync...');
    firebaseMusicService.syncWhenOnline();
});

window.addEventListener('offline', () => {
    console.log('📱 Connection lost - will use local storage');
});

// Add debug functions to window for testing
window.debugPlaylist = () => {
    console.log('=== PLAYLIST DEBUG INFO ===');
    if (window.firebaseMusicService) {
        window.firebaseMusicService.debugState();
        window.firebaseMusicService.showPlaylistStatus();
    }
    if (window.playlistManager) {
        console.log('🎵 PlaylistManager playlists:', window.playlistManager.playlists);
        console.log('🎵 Local storage:', localStorage.getItem('musicPlayerPlaylists'));
    }
    console.log('=== END DEBUG INFO ===');
};

// Save playlists before page unload to prevent data loss
window.addEventListener('beforeunload', async () => {
    if (window.playlistManager && firebaseMusicService.isAuthenticated()) {
        // Force immediate save before page closes
        await firebaseMusicService.savePlaylists(window.playlistManager.playlists);
    }
});

export default firebaseMusicService;