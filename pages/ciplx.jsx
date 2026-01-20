import { useState, useEffect } from 'react';
import Head from 'next/head';
import { getApiUrl } from '../lib/config';

export default function Ciplx() {
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/settings`);
            if (res.ok) {
                const data = await res.json();
                // Use mobile/desktop media based on screen size
                const url = isMobile
                    ? (data.ciplx_video_mobile || data.ciplx_video_desktop)
                    : (data.ciplx_video_desktop || data.ciplx_video_mobile);

                if (url) {
                    setMediaUrl(url);
                    // Detect type from URL
                    if (url.match(/\.(mp4|mov|webm|avi)$/i) || url.includes('/video/')) {
                        setMediaType('video');
                    } else {
                        setMediaType('image');
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching settings", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch when isMobile changes
    useEffect(() => {
        if (!isLoading) {
            fetchSettings();
        }
    }, [isMobile]);

    return (
        <>
            <Head>
                <title>Ciplx by Varaha Heaths</title>
                <meta name="description" content="Ciplx by Varaha Heaths - Premium Health & Wellness" />
            </Head>

            <div className="fixed inset-0 w-full h-full bg-black">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                ) : mediaUrl && mediaType === 'video' ? (
                    <video
                        className="w-full h-full object-cover"
                        src={mediaUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                ) : mediaUrl && mediaType === 'image' ? (
                    <img
                        src={mediaUrl}
                        alt="Ciplx by Varaha Heaths"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white text-center px-4">
                        <h1 className="text-4xl font-royal font-bold mb-4">Ciplx</h1>
                        <p className="text-lg opacity-70">by Varaha Heaths</p>
                        <p className="text-sm opacity-50 mt-8">Coming soon...</p>
                    </div>
                )}
            </div>
        </>
    );
}
