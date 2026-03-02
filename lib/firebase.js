import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { 
    getAuth, 
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBKr-u6vC3MgSe0wzrHlZlBYDboKYEsHqc",
    authDomain: "varaha-jewels-online.firebaseapp.com",
    projectId: "varaha-jewels-online",
    storageBucket: "varaha-jewels-online.firebasestorage.app",
    messagingSenderId: "146018955833",
    appId: "1:146018955833:web:92f55eb70edbc4eca693e8",
    measurementId: "G-RM3M6KZXQK"
};

// Initialize Firebase only once
let app;
let analytics;
let perf;
let auth;

if (typeof window !== "undefined" && !getApps().length) {
    app = initializeApp(firebaseConfig);

    // Initialize Analytics conditionally (safeguard)
    isAnalyticsSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
            console.log("Firebase Analytics Initialized 🚀");
        }
    });

    // Initialize Performance Monitoring
    perf = getPerformance(app);
    console.log("Firebase Performance Monitoring Initialized ⚡");
    
    // Initialize Auth
    auth = getAuth(app);
    console.log("Firebase Auth Initialized 🔐");
} else if (getApps().length) {
    app = getApps()[0];
    if (typeof window !== "undefined") {
        auth = getAuth(app);
    }
}

// ============================================================================
// AUTH HELPERS (Phone OTP — Google sign-in moved to Google OAuth 2.0)
// ============================================================================

/**
 * Initialize reCAPTCHA verifier for phone auth
 * @param {string} containerId - The ID of the container element
 * @returns {RecaptchaVerifier}
 */
export function initRecaptchaVerifier(containerId = 'recaptcha-container') {
    if (!auth) {
        auth = getAuth(app);
    }
    
    return new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
            console.log("reCAPTCHA verified");
        },
        'expired-callback': () => {
            console.log("reCAPTCHA expired");
        }
    });
}

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., +91XXXXXXXXXX)
 * @param {RecaptchaVerifier} recaptchaVerifier
 * @returns {Promise<ConfirmationResult>}
 */
export async function sendPhoneOTP(phoneNumber, recaptchaVerifier) {
    if (!auth) {
        auth = getAuth(app);
    }
    
    try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        return confirmationResult;
    } catch (error) {
        console.error("Phone OTP Error:", error);
        throw error;
    }
}

/**
 * Verify OTP and sign in
 * @param {ConfirmationResult} confirmationResult - From sendPhoneOTP
 * @param {string} otp - The OTP entered by user
 * @returns {Promise<{user: object, idToken: string}>}
 */
export async function verifyPhoneOTP(confirmationResult, otp) {
    try {
        const result = await confirmationResult.confirm(otp);
        const idToken = await result.user.getIdToken();
        
        return {
            user: {
                uid: result.user.uid,
                phoneNumber: result.user.phoneNumber,
            },
            idToken
        };
    } catch (error) {
        console.error("OTP Verification Error:", error);
        throw error;
    }
}

/**
 * Get current user's ID token
 * @returns {Promise<string|null>}
 */
export async function getIdToken() {
    if (!auth) {
        auth = getAuth(app);
    }
    
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken(true); // Force refresh
    }
    return null;
}

/**
 * Sign out from Firebase
 */
export async function signOut() {
    if (!auth) {
        auth = getAuth(app);
    }
    
    try {
        await firebaseSignOut(auth);
        console.log("Signed out from Firebase");
    } catch (error) {
        console.error("Sign out error:", error);
        throw error;
    }
}

/**
 * Get current Firebase user
 * @returns {object|null}
 */
export function getCurrentUser() {
    if (!auth) {
        auth = getAuth(app);
    }
    return auth.currentUser;
}

/**
 * Listen to auth state changes
 * @param {function} callback - Called with user object or null
 * @returns {function} Unsubscribe function
 */
export function onAuthChange(callback) {
    if (!auth) {
        auth = getAuth(app);
    }
    return onAuthStateChanged(auth, callback);
}

export { app, analytics, perf, auth };
