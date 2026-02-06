import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl, getAuthHeaders } from '../lib/config';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Load initial wishlist
    useEffect(() => {
        const token = localStorage.getItem('customer_token');
        if (token) {
            fetchRemoteWishlist(token);
        } else {
            const saved = localStorage.getItem('wishlist');
            if (saved) {
                try {
                    setWishlist(JSON.parse(saved));
                } catch (e) {
                    console.error('Error parsing local wishlist', e);
                }
            }
        }
    }, []);

    // Sync on login/auth change
    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem('customer_token');
            if (token) {
                syncLocalToRemote(token);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const fetchRemoteWishlist = async (token) => {
        try {
            setLoading(true);
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/wishlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWishlist(data); // Expects array of product IDs
            }
        } catch (error) {
            console.error('Failed to fetch wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    const syncLocalToRemote = async (token) => {
        const localItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (localItems.length === 0) {
            fetchRemoteWishlist(token); // Just fetch if nothing local
            return;
        }

        try {
            const API_URL = getApiUrl();
            // Prepare payload: array of { product_id: "..." }
            const payload = { items: localItems.map(id => ({ product_id: id })) };

            const res = await fetch(`${API_URL}/api/wishlist/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updatedList = await res.json();
                setWishlist(updatedList);
                localStorage.removeItem('wishlist'); // Clear local after sync
            }
        } catch (error) {
            console.error('Sync failed', error);
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.includes(productId);
    };

    const addToWishlist = async (productId) => {
        // Optimistic update
        const updatedList = [...wishlist, productId];
        setWishlist(updatedList);

        const token = localStorage.getItem('customer_token');

        if (token) {
            // Server Sync
            try {
                const API_URL = getApiUrl();
                await fetch(`${API_URL}/api/wishlist`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ product_id: productId })
                });
            } catch (e) {
                console.error('Add to remote wishlist failed', e);
                // Revert if failed? keeping simple for now
            }
        } else {
            // Local Storage
            localStorage.setItem('wishlist', JSON.stringify(updatedList));
        }
    };

    const removeFromWishlist = async (productId) => {
        const updatedList = wishlist.filter(id => id !== productId);
        setWishlist(updatedList);

        const token = localStorage.getItem('customer_token');

        if (token) {
            try {
                const API_URL = getApiUrl();
                await fetch(`${API_URL}/api/wishlist/${productId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                console.error('Remove from remote wishlist failed', e);
            }
        } else {
            localStorage.setItem('wishlist', JSON.stringify(updatedList));
        }
    };

    const toggleWishlist = (productId) => {
        if (isInWishlist(productId)) {
            removeFromWishlist(productId);
        } else {
            addToWishlist(productId);
        }
    };

    return (
        <WishlistContext.Provider value={{
            wishlist,
            loading,
            isInWishlist,
            addToWishlist,
            removeFromWishlist,
            toggleWishlist,
            syncLocalToRemote
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export const useWishlist = () => useContext(WishlistContext);
