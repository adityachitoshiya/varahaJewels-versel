import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notification, setNotification] = useState({
        show: false,
        type: '', // 'cart' | 'wishlist' | 'info'
        product: null, // { name, image, price }
        message: ''
    });

    const timerRef = useRef(null);
    const justShownRef = useRef(false);

    const showNotification = useCallback((type, product, message) => {
        // Clear existing timer if any
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Mark as just shown to prevent immediate dismiss from same click
        justShownRef.current = true;
        setTimeout(() => { justShownRef.current = false; }, 150);

        setNotification({
            show: true,
            type,
            product,
            message
        });

        // Auto hide after 3 seconds
        timerRef.current = setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
            timerRef.current = null;
        }, 3000);
    }, []);

    const hideNotification = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setNotification(prev => ({ ...prev, show: false }));
    }, []);

    // Dismiss notification on any click anywhere
    useEffect(() => {
        const handleAnyClick = () => {
            if (notification.show && !justShownRef.current) {
                hideNotification();
            }
        };

        document.addEventListener('click', handleAnyClick, true);
        document.addEventListener('touchstart', handleAnyClick, true);
        return () => {
            document.removeEventListener('click', handleAnyClick, true);
            document.removeEventListener('touchstart', handleAnyClick, true);
        };
    }, [notification.show, hideNotification]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);
