export const getApiUrl = () => {
    let apiUrl;
    if (typeof window !== 'undefined') {
        // If we are in the browser, allow dynamic hostname for local dev, or use ENV for production
        apiUrl = process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:8000`;
        console.log("API URL configured as:", apiUrl);
    } else {
        // Server-side default: Use localhost if not defined
        apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
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
