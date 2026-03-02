import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getApiUrl } from '../lib/config';
import { useNotification } from './NotificationContext';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);
    const { showNotification } = useNotification();
    const initialCartRef = useRef([]); // Store initial local cart for sync
    const isSyncingRef = useRef(false); // Race condition guard for sync

    // Initialize: Load token & Local Cart & Listen for Auth Changes
    useEffect(() => {
        // Cart Version Check - Clear old/stale cart data on version bump
        const CART_VERSION = 'v2'; // Increment this to clear all user carts
        const storedVersion = localStorage.getItem('cart_version');

        if (storedVersion !== CART_VERSION) {
            console.log('🧹 Cart version mismatch, clearing stale cart data');
            localStorage.removeItem('cart');
            localStorage.setItem('cart_version', CART_VERSION);
        }

        // 1. Load Local Cart immediately with VALIDATION + EXPIRY CHECK (6 hours)
        const CART_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours
        const cartSavedAt = localStorage.getItem('cart_saved_at');
        if (cartSavedAt && Date.now() - parseInt(cartSavedAt, 10) > CART_EXPIRY_MS) {
            console.log('🕐 Cart expired (6h), clearing...');
            localStorage.removeItem('cart');
            localStorage.removeItem('cart_saved_at');
        }

        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);

                // Validate cart items - filter out any invalid entries
                const validCart = Array.isArray(parsedCart)
                    ? parsedCart.filter(item => {
                        // Must have productId, variant with sku & price, and quantity
                        const isValid = item
                            && (item.productId || item.product_id)
                            && item.variant
                            && item.variant.sku
                            && typeof item.variant.price === 'number'
                            && item.quantity > 0;

                        if (!isValid) {
                            console.warn('Invalid cart item filtered out:', item);
                        }
                        return isValid;
                    })
                    : [];

                // Only set if valid items exist
                if (validCart.length > 0) {
                    setCartItems(validCart);
                    initialCartRef.current = validCart; // Save for reliable sync
                } else {
                    // Clear corrupted/empty cart
                    localStorage.removeItem('cart');
                }
            } catch (e) {
                console.error("Failed to parse local cart, clearing...", e);
                localStorage.removeItem('cart');
            }
        }

        // 2. Set up Supabase Auth Listener
        // This handles initial session AND updates (Sign In, Sign Out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("CartContext: Auth Event:", event);

            if (session) {
                // User Logged In
                setToken(session.access_token);
                setLoading(false); // Fix: Ensure loading is set to false
                // Optional: Set user data in local storage if not already there
                localStorage.setItem('customer_token', session.access_token);
            } else {
                // User Logged Out
                setToken(null);
                setLoading(false); // Stop loading if no user
            }
        });

        // 3. Check for legacy local storage token (Fallback)
        const storedToken = localStorage.getItem('customer_token');
        if (storedToken) {
            setToken(storedToken);
            // If token exists, we are potentially logged in, but wait for AuthStateChange to confirm session validity
            // OR set loading false here if we trust the token? Better to wait for Supabase.
        }

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Sync with Backend when Token Changes
    useEffect(() => {
        if (token && !loading) {
            handleLoggedInCart();
        }
    }, [token, loading]);

    // Persist to Local Storage — ONLY for GUEST users (no token)
    // Logged-in users use DB as source of truth, never write to localStorage
    useEffect(() => {
        if (!loading && !token) {
            localStorage.setItem('cart', JSON.stringify(cartItems));
            // Save timestamp for 6-hour expiry check
            if (cartItems.length > 0) {
                if (!localStorage.getItem('cart_saved_at')) {
                    localStorage.setItem('cart_saved_at', String(Date.now()));
                }
            } else {
                localStorage.removeItem('cart_saved_at');
            }
        }
        // Always dispatch event for Header cart count (works for both guest & logged in)
        if (!loading) {
            window.dispatchEvent(new Event('cartUpdated'));
        }
    }, [cartItems, loading, token]);

    const handleLoggedInCart = async () => {
        // Race condition guard
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;

        try {
            const API_URL = getApiUrl();

            // Check: Are there GUEST items in localStorage that need syncing?
            const guestCart = initialCartRef.current;
            const hasGuestItems = guestCart.length > 0;

            if (hasGuestItems) {
                // ONE-TIME sync: Push guest items to server, then clear localStorage forever
                console.log("🔄 One-time sync: Pushing guest cart to server...");
                const syncPayload = {
                    local_items: guestCart.map(item => ({
                        product_id: item.productId || item.product_id || item.variant.sku.split('-')[0],
                        quantity: item.quantity,
                        variant_sku: item.variant?.sku
                    }))
                };

                const res = await fetch(`${API_URL}/api/cart/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(syncPayload)
                });

                if (res.ok) {
                    const data = await res.json();
                    const serverCart = data.items || data;
                    console.log("✅ Guest cart synced! Items:", serverCart.length);
                    setCartItems(serverCart);

                    // Notify user if any quantities were reduced due to stock
                    if (data.warnings && data.warnings.length > 0) {
                        data.warnings.forEach(w => {
                            showNotification('error', null, w);
                        });
                    }

                    // CLEAR localStorage — DB is now the truth
                    initialCartRef.current = [];
                    localStorage.removeItem('cart');
                    localStorage.removeItem('cart_saved_at');
                }
            } else {
                // No guest items — just fetch from DB (source of truth)
                console.log("📥 Loading cart from server (DB = truth)...");
                const res = await fetch(`${API_URL}/api/cart`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const serverCart = await res.json();
                    console.log("✅ Cart loaded from DB. Items:", serverCart.length);
                    setCartItems(serverCart);

                    // Ensure localStorage is clean
                    localStorage.removeItem('cart');
                    localStorage.removeItem('cart_saved_at');
                }
            }
        } catch (err) {
            console.error("Cart load/sync failed:", err);
        } finally {
            isSyncingRef.current = false;
        }
    };

    const addToCart = async (product, variant, quantity) => {
        // 1. Optimistic Update
        const newItem = {
            productId: product.id,
            productName: product.name,
            variant, // { sku, price, image, name }
            quantity,
            // Legacy fields for UI
            image: variant.image || product.images?.[0]?.url,
            description: product.description?.substring(0, 100)
        };

        setCartItems(prev => {
            const existingIdx = prev.findIndex(item => item.variant.sku === variant.sku);
            if (existingIdx > -1) {
                const updated = [...prev];
                updated[existingIdx].quantity += quantity;
                return updated;
            }
            return [...prev, newItem];
        });

        // Show Notification
        showNotification('cart', {
            name: product.name,
            image: variant.image || product.images?.[0]?.url,
            price: variant.price
        }, 'Added to Bag');

        // 2. Server Update (if logged in)
        if (token) {
            try {
                const API_URL = getApiUrl();
                const res = await fetch(`${API_URL}/api/cart/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        product_id: product.id,
                        quantity: quantity,
                        variant_sku: variant.sku
                    })
                });

                if (res.ok) {
                    const serverItem = await res.json();

                    // Attach Server ID to the local item
                    setCartItems(prev => prev.map(item => {
                        if (item.variant.sku === variant.sku) {
                            return { ...item, id: serverItem.id };
                        }
                        return item;
                    }));
                } else {
                    // Stock error — rollback optimistic update & show error
                    const errData = await res.json().catch(() => ({}));
                    const errMsg = errData.detail || 'Could not add to cart';
                    showNotification('error', null, errMsg);

                    // Rollback: remove the optimistically added item
                    setCartItems(prev => prev.filter(item => item.variant.sku !== variant.sku));
                }

            } catch (e) {
                console.error("Failed to add to server cart", e);
            }
        }
    };

    const removeFromCart = async (itemId, variantSku) => {
        // Look up the actual backend item ID if not provided
        let resolvedItemId = itemId;
        if (!resolvedItemId && variantSku) {
            const found = cartItems.find(item => item.variant?.sku === variantSku);
            if (found) resolvedItemId = found.id;
        }

        // 1. Optimistic Update (Handle both ID and SKU matches)
        setCartItems(prev => prev.filter(item => {
            // If SKU matches, remove it
            if (variantSku && item.variant?.sku === variantSku) return false;
            // If ID matches, remove it
            if (resolvedItemId && item.id === resolvedItemId) return false;
            // Keep otherwise
            return true;
        }));

        // 2. Server Update
        if (token && resolvedItemId) {
            try {
                const API_URL = getApiUrl();
                await fetch(`${API_URL}/api/cart/items/${resolvedItemId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) { console.error(e); }
        }
    };

    const updateQuantity = async (variantSku, newQty, itemId) => {
        if (newQty <= 0) {
            return removeFromCart(itemId, variantSku);
        }

        // 1. Optimistic Update
        let itemToUpdate = null;

        setCartItems(prev => prev.map(item => {
            const matchesSku = variantSku && item.variant?.sku === variantSku;
            const matchesId = itemId && item.id === itemId;

            if (matchesSku || matchesId) {
                itemToUpdate = item;
                return { ...item, quantity: newQty };
            }
            return item;
        }));

        // 2. Server Update
        if (token && itemToUpdate && itemToUpdate.id) {
            try {
                const API_URL = getApiUrl();
                await fetch(`${API_URL}/api/cart/items/${itemToUpdate.id}?quantity=${newQty}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) { console.error(e); }
        }
    };

    const clearCart = async () => {
        setCartItems([]);
        if (localStorage) {
            localStorage.removeItem('cart');
            localStorage.removeItem('cart_saved_at');
        }

        // Also clear server-side cart if logged in
        if (token) {
            try {
                const API_URL = getApiUrl();
                await fetch(`${API_URL}/api/cart/clear`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                console.error('Failed to clear server cart:', e);
            }
        }
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount: cartItems.reduce((sum, i) => sum + i.quantity, 0)
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
