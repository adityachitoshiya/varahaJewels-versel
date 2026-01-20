import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getApiUrl } from '../lib/config';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';

export default function Ciplx() {
    // Video intro states
    const [videoSettings, setVideoSettings] = useState({ desktop: '', mobile: '' });
    const [showVideo, setShowVideo] = useState(true);
    const [showAnimation, setShowAnimation] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

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
                if (data.ciplx_video_desktop || data.ciplx_video_mobile) {
                    setVideoSettings({
                        desktop: data.ciplx_video_desktop,
                        mobile: data.ciplx_video_mobile
                    });
                } else {
                    // No video, skip to content
                    setShowVideo(false);
                    setContentVisible(true);
                }
            }
        } catch (e) {
            console.error("Error fetching settings", e);
            setShowVideo(false);
            setContentVisible(true);
        }
    };

    const handleVideoEnd = () => {
        setShowVideo(false);
        setShowAnimation(true);
        setTimeout(() => {
            setShowAnimation(false);
            setContentVisible(true);
        }, 4000);
    };

    return (
        <>
            <Head>
                <title>Ciplx by Varaha Heaths | Premium Health & Wellness</title>
                <meta name="description" content="Discover Ciplx by Varaha Heaths - Premium health and wellness products." />
            </Head>

            {/* VIDEO OVERLAY */}
            {showVideo && (videoSettings.desktop || videoSettings.mobile) && (
                <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
                    {isMobile ? (
                        <video
                            className="w-full h-full object-cover"
                            src={videoSettings.mobile || videoSettings.desktop}
                            autoPlay
                            playsInline
                            muted
                            onEnded={handleVideoEnd}
                        />
                    ) : (
                        <video
                            className="w-full h-full object-cover"
                            src={videoSettings.desktop || videoSettings.mobile}
                            autoPlay
                            playsInline
                            muted
                            onEnded={handleVideoEnd}
                        />
                    )}

                    <button
                        onClick={handleVideoEnd}
                        className="absolute top-8 right-8 text-white/50 hover:text-white text-sm border border-white/30 rounded-full px-4 py-2 z-50 uppercase tracking-widest"
                    >
                        Skip Intro
                    </button>
                </div>
            )}

            {/* ANIMATION OVERLAY */}
            {showAnimation && (
                <div className="fixed inset-0 z-[50] bg-gradient-to-br from-emerald-900 to-teal-800 flex flex-col items-center justify-center text-center px-4 animate-fadeIn">
                    <h2 className="text-3xl md:text-5xl font-royal text-white/90 mb-6 leading-tight animate-fadeUp">
                        Wellness Reimagined
                    </h2>
                    <h1 className="text-4xl md:text-7xl font-royal font-bold text-emerald-300 mb-4 animate-scaleIn">
                        Ciplx by Varaha Heaths
                    </h1>
                    <div className="w-32 h-1 bg-white/50 mt-8 animate-width-expand"></div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className={`transition-opacity duration-1000 ${contentVisible ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                <Header />

                <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
                    {/* Hero Section */}
                    <section className="relative py-20 px-4">
                        <div className="max-w-6xl mx-auto text-center">
                            <h1 className="text-4xl md:text-6xl font-royal font-bold text-emerald-900 mb-6">
                                Ciplx
                            </h1>
                            <p className="text-lg md:text-xl text-emerald-700 max-w-2xl mx-auto mb-8">
                                Premium health and wellness products by Varaha Heaths.
                                Coming soon with a curated collection for your well-being.
                            </p>

                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-emerald-100 max-w-md mx-auto">
                                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <Heart size={28} className="text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-900 mb-2">Coming Soon</h3>
                                <p className="text-emerald-600 mb-6">
                                    We're preparing something special for you. Stay tuned!
                                </p>
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors font-medium"
                                >
                                    Explore Our Store <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
}
