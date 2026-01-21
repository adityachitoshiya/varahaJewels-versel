export const getApiUrl = () => {
    let apiUrl;
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            // Local & LAN support
            apiUrl = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;
        } else {
            // Production fallback
            apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.varahajewels.in';
        }
        console.log("API URL configured as:", apiUrl);
    } else {
        // Server-side default
        apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.varahajewels.in';
    }
    return apiUrl.replace(/\/$/, '');
};

export const getAuthHeaders = (token = null) => {
    const headers = {
        'Content-Type': 'application/json',
        'x-app-key': process.env.NEXT_PUBLIC_APP_SECRET || 'varaha_secure_key_123'
    };

    // Auto-detect token if not provided but exists in localStorage
    if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token') || localStorage.getItem('customer_token');
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// MSG91 OTP Widget Configuration
export const MSG91_CONFIG = {
    widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '3661756c4655353736383536',
    tokenAuth: process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '',
};
