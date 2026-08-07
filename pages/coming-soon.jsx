import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Wrench, Sparkles, Clock } from 'lucide-react';
import Image from 'next/image';

export default function ComingSoon() {
  const [showLogin, setShowLogin] = useState(false);
  const [accessId, setAccessId] = useState('');
  const [dots, setDots] = useState('');

  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    // Basic countdown simulation for dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Fetch maintenance end time
    const fetchSettings = async () => {
      try {
        const { getApiUrl } = require('../lib/config');
        const API_URL = getApiUrl();
        const res = await fetch(`${API_URL}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.maintenance_end_time) {
            setEndTime(new Date(data.maintenance_end_time).getTime());
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    
    fetchSettings();

    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        return { days: '00', hours: '00', minutes: '00', seconds: '00' };
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      return {
        days: d.toString().padStart(2, '0'),
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0')
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const handleLogin = async () => {
    const validIds = ["DEV2024", "adi1", "adi2", "adi3"];

    if (validIds.includes(accessId)) {
      try {
        const { getApiUrl } = require('../lib/config');
        const API_URL = getApiUrl();

        await fetch(`${API_URL}/api/track-visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: `/tester-login/${accessId}` })
        }).catch(err => console.error(err));

        localStorage.setItem("dev_mode", "true");
        localStorage.setItem("tester_id", accessId);
        window.location.href = "/";
      } catch (e) {
        localStorage.setItem("dev_mode", "true");
        window.location.href = "/";
      }
    } else {
      alert("Invalid Access ID");
    }
  };

  return (
    <>
      <Head>
        <title>Under Maintenance - Varaha Jewels™</title>
        <meta name="description" content="This page is under construction. Check back soon!" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-warm-sand via-ivory-smoke to-warm-sand flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-copper/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-heritage/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-royal-orange/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          {/* Logo */}
          <div className="mb-6 sm:mb-8 flex justify-center animate-fadeIn">
            <Image
              src="/varaha-assets/logo.png"
              alt="Varaha Jewels"
              width={200}
              height={70}
              className="h-12 sm:h-16 w-auto"
              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/dd5zrsmok/image/upload/v1766342264/logo_hvef6t.png'; }}
            />
          </div>

          {/* Construction Icon */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-copper/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-copper to-heritage p-5 sm:p-6 rounded-full shadow-2xl animate-bounce">
                <Wrench size={40} className="text-warm-sand sm:w-12 sm:h-12" />
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="font-royal text-4xl sm:text-5xl md:text-7xl font-bold text-heritage mb-4 sm:mb-6 animate-fadeUp">
            Under Maintenance
          </h1>

          {/* Animated Dots */}
          <div className="h-6 sm:h-8 mb-4 sm:mb-6">
            <p className="text-copper text-xl sm:text-2xl font-semibold animate-pulse">
              Crafting Excellence{dots}
            </p>
          </div>

          {/* Description */}
          <p className="text-heritage/80 text-base sm:text-lg md:text-xl mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed animate-fadeUp px-4" style={{ animationDelay: '0.2s' }}>
            We're carefully crafting something beautiful for you. Just like our exquisite jewelry,
            this page is being created with attention to every detail.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-3xl mx-auto">
            <div className="bg-white/50 backdrop-blur-sm p-5 sm:p-6 rounded-lg shadow-lg border border-copper/20 animate-fadeUp" style={{ animationDelay: '0.3s' }}>
              <Sparkles className="mx-auto mb-3 sm:mb-4 text-copper" size={28} />
              <h3 className="font-semibold text-heritage mb-2 text-sm sm:text-base">Premium Quality</h3>
              <p className="text-heritage/70 text-xs sm:text-sm">Exceptional craftsmanship in every piece</p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm p-5 sm:p-6 rounded-lg shadow-lg border border-copper/20 animate-fadeUp" style={{ animationDelay: '0.4s' }}>
              <Clock className="mx-auto mb-3 sm:mb-4 text-copper" size={28} />
              <h3 className="font-semibold text-heritage mb-2 text-sm sm:text-base">Under Maintenance</h3>
              <p className="text-heritage/70 text-xs sm:text-sm">We will be back shortly</p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm p-5 sm:p-6 rounded-lg shadow-lg border border-copper/20 animate-fadeUp" style={{ animationDelay: '0.5s' }}>
              <Wrench className="mx-auto mb-3 sm:mb-4 text-copper" size={28} />
              <h3 className="font-semibold text-heritage mb-2 text-sm sm:text-base">In Progress</h3>
              <p className="text-heritage/70 text-xs sm:text-sm">Building something special</p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-copper to-heritage rounded-lg shadow-xl flex items-center justify-center mb-2 hover:scale-105 transition-transform">
                  <span className="text-2xl sm:text-3xl font-bold text-warm-sand font-mono">
                    {item.value}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-heritage uppercase tracking-wider font-semibold">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Developer Access Section */}
          <div className="flex flex-col items-center gap-4 animate-scaleIn" style={{ animationDelay: '0.6s' }}>
            {!showLogin ? (
              <button
                onClick={() => setShowLogin(true)}
                className="group px-6 py-3 bg-transparent border border-copper/30 text-heritage/70 rounded-full hover:bg-copper/5 hover:border-copper hover:text-heritage transition-all duration-300 text-sm flex items-center gap-2"
              >
                <Wrench size={16} className="group-hover:rotate-90 transition-transform" />
                <span>I'm a Developer or a Tester</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 items-center bg-white/40 backdrop-blur-md p-2 rounded-xl border border-white/50 shadow-lg animate-fadeIn">
                <input
                  type="password"
                  placeholder="Enter Access ID"
                  value={accessId}
                  onChange={(e) => setAccessId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="bg-transparent border-none outline-none px-4 py-2 text-heritage placeholder-heritage/50 w-48 text-center sm:text-left"
                  autoFocus
                />
                <button
                  onClick={handleLogin}
                  className="bg-heritage text-warm-sand px-6 py-2 rounded-lg font-semibold text-sm hover:bg-heritage/90 transition-colors shadow-md"
                >
                  Enter
                </button>
                <button
                  onClick={() => setShowLogin(false)}
                  className="p-2 text-heritage/50 hover:text-heritage transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Bottom Text */}
          <p className="mt-16 text-heritage/40 text-xs animate-fadeIn px-4 font-serif italic">
            "Elegance is the only beauty that never fades."
          </p>
        </div>
      </div>
    </>
  );
}
