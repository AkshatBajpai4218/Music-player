// Firebase Configuration Template
// Copy this file to firebase.config.js and add your Firebase credentials

export const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

/* 
HOW TO GET YOUR FIREBASE CONFIG:
1. Go to https://console.firebase.google.com/
2. Create a new project or select existing one
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on "Web app" or add a new web app
6. Copy the configuration object
7. Replace the values above with your actual Firebase config
8. Save this file as 'firebase.config.js' (remove .example)
9. Make sure firebase.config.js is added to .gitignore
*/
