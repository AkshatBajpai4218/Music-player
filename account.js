// Account page JavaScript functionality
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const analytics = getAnalytics(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Global variables
let currentUser = null;
let isSignUpMode = false;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAccount();
    setupEventListeners();
});

// Initialize account functionality
function initializeAccount() {
    // Check Firebase config
    checkFirebaseConfig();
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userData = {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                picture: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email.split('@')[0])}&background=ff6b6b&color=fff&size=120`,
                provider: user.providerData[0]?.providerId || 'firebase'
            };
            
            currentUser = userData;
            saveUserSession(userData);
            showUserProfile(userData);
        } else {
            currentUser = null;
            localStorage.removeItem('musicPlayerUser');
            showAuthSection();
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Auth form
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleEmailAuth);
    }
    
    // Toggle auth mode link
    const toggleAuthModeLink = document.getElementById('toggleAuthMode');
    if (toggleAuthModeLink) {
        toggleAuthModeLink.addEventListener('click', toggleAuthMode);
    }
    
    // Google sign-in button
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    // Forgot password link
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
}

// Check Firebase configuration
function checkFirebaseConfig() {
    if (firebaseConfig.apiKey === "your-api-key" || !firebaseConfig.apiKey) {
        showFirebaseSetupNotice();
        return false;
    }
    
    hideFirebaseSetupNotice();
    return true;
}

// Show Firebase setup notice
function showFirebaseSetupNotice() {
    const setupNotice = document.getElementById('firebaseSetupNotice');
    const authSection = document.getElementById('firebaseAuthSection');
    
    if (setupNotice) setupNotice.style.display = 'block';
    if (authSection) authSection.style.display = 'none';
}

// Hide Firebase setup notice
function hideFirebaseSetupNotice() {
    const setupNotice = document.getElementById('firebaseSetupNotice');
    const authSection = document.getElementById('firebaseAuthSection');
    
    if (setupNotice) setupNotice.style.display = 'none';
    if (authSection) authSection.style.display = 'block';
}

// Show Firebase setup instructions modal
function showFirebaseSetupInstructions() {
    const modal = document.getElementById('firebaseSetupModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Close Firebase setup modal
function closeFirebaseSetupModal() {
    const modal = document.getElementById('firebaseSetupModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Skip Firebase setup
function skipFirebaseSetup() {
    showNotification('Firebase setup skipped. Authentication features will not work.', 'info');
    closeFirebaseSetupModal();
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
    if (!checkFirebaseConfig()) {
        showNotification('Firebase not configured. Please set up Firebase first.', 'error');
        return;
    }
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        showNotification('Successfully signed in with Google!', 'success');
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        
        let errorMessage = 'Google Sign-In failed. ';
        
        if (error.code === 'auth/popup-blocked') {
            errorMessage += 'Please allow popups and try again.';
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage += 'Sign-in popup was closed.';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'This domain is not authorized. Please add it to Firebase Console.';
        } else {
            errorMessage += 'Please try using email sign-in instead.';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// Handle email authentication (sign in or sign up)
async function handleEmailAuth(event) {
    event.preventDefault();
    
    if (!checkFirebaseConfig()) {
        showNotification('Firebase not configured. Please set up Firebase first.', 'error');
        return;
    }
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Basic validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (isSignUpMode && password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('authBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
    submitBtn.disabled = true;
    
    try {
        if (isSignUpMode) {
            await createUserWithEmailAndPassword(auth, email, password);
            showNotification('Account created successfully!', 'success');
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showNotification('Successfully signed in!', 'success');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        
        let errorMessage = 'Authentication failed. ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered. Please sign in instead.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email authentication is not enabled.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please choose a stronger password.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Please sign up first.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage += 'Please try again.';
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Toggle between sign in and sign up mode
function toggleAuthMode(event) {
    event.preventDefault();
    
    isSignUpMode = !isSignUpMode;
    
    const authBtn = document.getElementById('authBtn');
    const authBtnText = document.getElementById('authBtnText');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    
    if (isSignUpMode) {
        // Switch to sign up mode
        authBtnText.textContent = 'Create Account';
        authBtn.innerHTML = '<i class="fas fa-user-plus"></i> <span id="authBtnText">Create Account</span>';
        toggleAuthMode.textContent = 'Sign In Instead';
        confirmPasswordGroup.style.display = 'block';
        document.getElementById('confirmPassword').required = true;
    } else {
        // Switch to sign in mode
        authBtnText.textContent = 'Sign In';
        authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span id="authBtnText">Sign In</span>';
        toggleAuthMode.textContent = 'Create Account';
        confirmPasswordGroup.style.display = 'none';
        document.getElementById('confirmPassword').required = false;
    }
}

// Handle forgot password
function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    
    if (!email) {
        showNotification('Please enter your email address first', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // For now, just show a notification
    // In a real app, you'd use Firebase sendPasswordResetEmail
    showNotification('Password reset functionality would send an email to: ' + email, 'info');
}

// Save user session
function saveUserSession(userData) {
    currentUser = userData;
    localStorage.setItem('musicPlayerUser', JSON.stringify(userData));
}

// Show authentication section
function showAuthSection() {
    document.querySelector('.auth-section').style.display = 'block';
    document.getElementById('userProfile').style.display = 'none';
}

// Show user profile
function showUserProfile(userData) {
    // Hide auth section
    document.querySelector('.auth-section').style.display = 'none';
    
    // Show user profile
    const userProfile = document.getElementById('userProfile');
    userProfile.style.display = 'block';
    
    // Update profile information
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('userAvatar').src = userData.picture;
}

// Sign out user
async function signOutUser() {
    try {
        await signOut(auth);
        showNotification('Successfully signed out!', 'success');
        
        // Reset form
        document.getElementById('authForm').reset();
        
        // Reset to sign in mode
        if (isSignUpMode) {
            toggleAuthMode({ preventDefault: () => {} });
        }
        
    } catch (error) {
        console.error('Sign out error:', error);
        showNotification('Error signing out. Please try again.', 'error');
    }
}

// Navigate to home page
function goToHome() {
    // Add user data to URL or session for the main app
    if (currentUser) {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        zIndex: '1000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        animation: 'slideInRight 0.3s ease',
        minWidth: '250px'
    });
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Firebase Playlist Service
class FirebasePlaylistService {
    constructor() {
        this.db = db;
        this.auth = auth;
    }

    // Get user-specific playlist collection path
    getUserPlaylistsPath(userId) {
        return `users/${userId}/playlists`;
    }

    // Save playlists to Firebase for current user
    async savePlaylists(playlists) {
        if (!this.auth.currentUser) return;
        
        try {
            const userId = this.auth.currentUser.uid;
            const userDoc = doc(this.db, 'users', userId);
            
            await setDoc(userDoc, {
                playlists: playlists,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            console.log('Playlists saved to Firebase');
        } catch (error) {
            console.error('Error saving playlists to Firebase:', error);
            // Fallback to localStorage
            localStorage.setItem('musicPlayerPlaylists', JSON.stringify(playlists));
        }
    }

    // Load playlists from Firebase for current user
    async loadPlaylists() {
        if (!this.auth.currentUser) {
            // Fallback to localStorage if not authenticated
            try {
                const saved = localStorage.getItem('musicPlayerPlaylists');
                return saved ? JSON.parse(saved) : {};
            } catch (error) {
                return {};
            }
        }

        try {
            const userId = this.auth.currentUser.uid;
            const userDoc = doc(this.db, 'users', userId);
            const userSnap = await getDoc(userDoc);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                return userData.playlists || {};
            } else {
                // User document doesn't exist yet, return empty playlists
                return {};
            }
        } catch (error) {
            console.error('Error loading playlists from Firebase:', error);
            // Fallback to localStorage
            try {
                const saved = localStorage.getItem('musicPlayerPlaylists');
                return saved ? JSON.parse(saved) : {};
            } catch (fallbackError) {
                return {};
            }
        }
    }

    // Delete a specific playlist from Firebase
    async deletePlaylist(playlistName, allPlaylists) {
        if (!this.auth.currentUser) return;
        
        try {
            delete allPlaylists[playlistName];
            await this.savePlaylists(allPlaylists);
        } catch (error) {
            console.error('Error deleting playlist from Firebase:', error);
        }
    }

    // Migrate localStorage playlists to Firebase (one-time migration)
    async migrateLocalPlaylistsToFirebase() {
        if (!this.auth.currentUser) return;

        try {
            const localPlaylists = localStorage.getItem('musicPlayerPlaylists');
            if (localPlaylists) {
                const parsedPlaylists = JSON.parse(localPlaylists);
                if (Object.keys(parsedPlaylists).length > 0) {
                    await this.savePlaylists(parsedPlaylists);
                    console.log('Local playlists migrated to Firebase');
                    
                    // Optionally clear localStorage after successful migration
                    // localStorage.removeItem('musicPlayerPlaylists');
                }
            }
        } catch (error) {
            console.error('Error migrating local playlists to Firebase:', error);
        }
    }
}

// Create global Firebase service instance
window.firebasePlaylistService = new FirebasePlaylistService();

// Global functions for HTML onclick events
window.signOutUser = signOutUser;
window.goToHome = goToHome;
window.showFirebaseSetupInstructions = showFirebaseSetupInstructions;
window.closeFirebaseSetupModal = closeFirebaseSetupModal;
window.skipFirebaseSetup = skipFirebaseSetup;