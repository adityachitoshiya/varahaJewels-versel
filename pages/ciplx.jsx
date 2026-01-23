import { useState, useEffect } from 'react';
import Head from 'next/head';
import { getApiUrl } from '../lib/config';

export default function Ciplx() {
    const [settings, setSettings] = useState(null);
    const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [videoEnded, setVideoEnded] = useState(false);

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
                setSettings(data);
            }
        } catch (e) {
            console.error("Error fetching settings", e);
        } finally {
            setIsLoading(false);
        }
    };

    const isVideo = (url) => {
        if (!url) return false;
        return url.match(/\.(mp4|mov|webm|avi)(\?.*)?$/i) || url.includes('/video/');
    };

    const getSource = () => {
        if (!settings) return null;

        if (isMobile) {
            // On mobile: if video ended, show desktop version (usually poster/image)
            // Or if no mobile video, show desktop version
            if (videoEnded) {
                return settings.ciplx_video_desktop;
            }
            return settings.ciplx_video_mobile || settings.ciplx_video_desktop;
        }

        // Desktop
        return settings.ciplx_video_desktop || settings.ciplx_video_mobile;
    };

    const [currentSlide, setCurrentSlide] = useState(0);

    // Placeholder slides - In a real scenario, these might come from settings or a CMS
    // For now, we use the settings image + some high-quality placeholders/duplicates to demonstrate the effect
    // Placeholder slides - In a real scenario, these might come from settings or a CMS
    // For now, we use the settings image + some high-quality placeholders/duplicates to demonstrate the effect
    const getSlides = () => {
        // 1. Try to get images from new JSON list
        if (settings && settings.ciplx_images_json) {
            try {
                const images = JSON.parse(settings.ciplx_images_json);
                if (images.length > 0) return images;
            } catch (e) {
                console.error("Error parsing ciplx images", e);
            }
        }

        // 2. Fallback to existing logic (Single Image + Placeholders if needed)
        const primaryImage = getSource();
        if (!primaryImage) return [];
        return [
            primaryImage,
            // Only add placeholders if strictly needed for demo, otherwise if user uploaded images, we use those.
        ];
    };

    const slides = getSlides();

    useEffect(() => {
        if (slides.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [slides.length]);

    const currentUrl = getSource();
    const currentIsVideo = isVideo(currentUrl);

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
                ) : currentUrl && currentIsVideo ? (
                    <video
                        key={currentUrl} // Re-render if URL changes
                        className="w-full h-full object-cover"
                        src={currentUrl}
                        autoPlay
                        loop={!isMobile} // Loop on desktop, play once on mobile
                        muted
                        playsInline
                        onEnded={() => {
                            if (isMobile) {
                                setVideoEnded(true);
                            }
                        }}
                    />
                ) : slides.length > 0 ? (
                    // Slideshow Container
                    <div className="relative w-full h-full">
                        {slides.map((slide, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                    }`}
                            >
                                <img
                                    src={slide}
                                    alt={`Ciplx Slide ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {/* Optional Overlay for better text readability if needed */}
                                <div className="absolute inset-0 bg-black/20"></div>
                            </div>
                        ))}
                    </div>
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
