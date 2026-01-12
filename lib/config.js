export const getApiUrl = () => {
    let apiUrl;
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
