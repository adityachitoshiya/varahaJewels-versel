import { useEffect } from 'react';
import Head from 'next/head';
import { getApiUrl } from '../lib/config';
import dynamic from 'next/dynamic';
import '../lib/firebase'; // Initialize Firebase (for Phone OTP)
import { GoogleOAuthProvider } from '@react-oauth/google';
import '../styles/globals.css';
import DeliveryBar from '../components/DeliveryBar';
import { useRouter } from 'next/router';
import { CartProvider } from '../context/CartContext';
import { NotificationProvider } from '../context/NotificationContext';
import NotificationPopup from '../components/NotificationPopup';
import MobileBottomNav from '../components/MobileBottomNav';
import { WishlistProvider } from '../context/WishlistContext';
import clarity from '@microsoft/clarity';

const CookieConsent = dynamic(() => import('../components/CookieConsent'), { ssr: false });

const CLARITY_PROJECT_ID = 'vme6nv0h09';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isHomePage = router.pathname === '/';
  const isAdmin = router.pathname.startsWith('/admin');
  const isCiplx = router.pathname === '/ciplx';
  const isHeritage = router.pathname === '/heritage';

  // Initialize Microsoft Clarity (only in production, client-side)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      clarity.init(CLARITY_PROJECT_ID);
    }
  }, []);

  useEffect(() => {
    const trackVisit = async () => {
      // Wait for router to be ready (avoids logging /product/[slug] template paths)
      if (!router.isReady) return;

      // Skip tracking on localhost / development
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return;
      }
      try {
        const API_URL = getApiUrl();
        await fetch(`${API_URL}/api/track-visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: router.asPath })
        });
      } catch (err) {
        console.error('Tracking error:', err);
      }
    };

    trackVisit(); // Track initial load

    // Subscribe to route changes
    router.events.on('routeChangeComplete', trackVisit);

    // --- Global Error Logging ---
    const handleError = (event) => {
      // Avoid loops
      if (event?.message?.includes?.('api/log-frontend')) return;

      const API_URL = getApiUrl();
      fetch(`${API_URL}/api/log-frontend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'ERROR',
          message: event?.message || event?.reason?.toString() || 'Unknown Error'
        })
      }).catch(e => console.error("Logger failed:", e));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      router.events.off('routeChangeComplete', trackVisit);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [router.asPath, router.isReady]);

  if (isAdmin) {
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover" />
          <link rel="icon" href="/favicon-circle.png" />
        </Head>
        <Component {...pageProps} />
      </>
    );
  }

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '390681375827-jt3d2qcr9bo0geboirt03ii5m0tqfiij.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#F4E6D8" />
        <link rel="icon" href="/favicon-circle.png" />
        <link rel="canonical" href={`https://www.varahajewels.in${router.asPath === '/' ? '' : router.asPath.split('?')[0]}`} />
      </Head>

      <NotificationProvider>
        <NotificationPopup />
        <CartProvider>
          <WishlistProvider>
            {isHomePage && <DeliveryBar variant="desktop" />}

            {/* Main Content with Transition */}
            <Component {...pageProps} />

            <CookieConsent />

            {/* Mobile Bottom Nav - Hidden on Product, Checkout, Ciplx & Heritage Pages */}
            {!router.pathname.startsWith('/product/') && router.pathname !== '/checkout' && !isCiplx && !isHeritage && (
              <MobileBottomNav />
            )}
          </WishlistProvider>
        </CartProvider>
      </NotificationProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp;
