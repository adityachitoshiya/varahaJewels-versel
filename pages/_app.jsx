import { useEffect } from 'react';
import Head from 'next/head';
import { getApiUrl } from '../lib/config';
import '../lib/firebase'; // Initialize Firebase
import '../styles/globals.css';
import CookieConsent from '../components/CookieConsent';
import DeliveryBar from '../components/DeliveryBar';
import AnnouncementBar from '../components/AnnouncementBar';
import SpinWheelPopup from '../components/SpinWheelPopup';
import { useRouter } from 'next/router';
import { CartProvider } from '../context/CartContext';
import { NotificationProvider } from '../context/NotificationContext';
import NotificationPopup from '../components/NotificationPopup';
import MobileBottomNav from '../components/MobileBottomNav';
import { SpeedInsights } from "@vercel/speed-insights/next";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isHomePage = router.pathname === '/';
  const isAdmin = router.pathname.startsWith('/admin');
  const isCiplx = router.pathname === '/ciplx';
  const isHeritage = router.pathname === '/heritage';

  useEffect(() => {
    const trackVisit = async () => {
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
  }, [router.asPath]);

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

  return (
    <>
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
          {isHomePage && <DeliveryBar variant="desktop" />}
          {!isHomePage && !isCiplx && !isHeritage && <AnnouncementBar />}

          {/* Main Content with Transition */}
          <Component {...pageProps} />
          <SpeedInsights />

          <CookieConsent />
          <SpinWheelPopup />

          {/* Mobile Bottom Nav - Hidden on Product, Checkout, Ciplx & Heritage Pages */}
          {!router.pathname.startsWith('/product/') && router.pathname !== '/checkout' && !isCiplx && !isHeritage && (
            <MobileBottomNav />
          )}

        </CartProvider>
      </NotificationProvider>
    </>
  );
}

export default MyApp;
