/**
 * Auth Utility for Varaha Jewels
 * 
 * Handles the hybrid auth flow:
 * 1. Firebase Auth for sign-in (Google/Phone) - bypasses ISP blocks
 * 2. Backend verification and local JWT issuance
 */

import { getApiUrl } from './config';

/**
 * Authenticate with backend using Firebase ID token
 * 
 * Flow:
 * 1. Get Firebase ID token from signInWithGoogle() or verifyPhoneOTP()
 * 2. Send to backend /api/auth/firebase endpoint
 * 3. Backend verifies with Firebase Admin SDK
 * 4. Backend returns local JWT + user profile
 * 5. Store in localStorage for subsequent API calls
 * 
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function authenticateWithBackend(idToken) {
    const API_URL = getApiUrl();
    
    try {
        const response = await fetch(`${API_URL}/api/auth/firebase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: idToken }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Backend auth failed:', error);
            return {
                success: false,
                error: error.detail || 'Authentication failed'
            };
        }
        
        const data = await response.json();
        
        // Store credentials in localStorage
        const userData = {
            id: data.user.id,
            full_name: data.user.name,
            name: data.user.name,  // For backward compatibility
            email: data.user.email,
            phone: data.user.phone,
            role: 'customer'
        };
        
        localStorage.setItem('customer_token', data.access_token);
        localStorage.setItem('customer_user', JSON.stringify(userData));
        
        console.log('✅ Backend authentication successful');
        
        return {
            success: true,
            user: userData,
            token: data.access_token
        };
        
    } catch (error) {
        console.error('Backend auth error:', error);
        return {
            success: false,
            error: 'Network error. Please try again.'
        };
    }
}

/**
 * Clear all auth tokens (logout)
 */
export function clearAuthTokens() {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
}

/**
 * Get stored auth token
 * @returns {string|null}
 */
export function getStoredToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('customer_token');
}

/**
 * Get stored user data
 * @returns {object|null}
 */
export function getStoredUser() {
    if (typeof window === 'undefined') return null;
    try {
        const user = localStorage.getItem('customer_user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
    return !!getStoredToken() && !!getStoredUser();
}
