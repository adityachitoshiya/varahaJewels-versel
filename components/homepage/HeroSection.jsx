import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, RotateCcw, Truck } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl, getAuthHeaders } from '../../lib/config';
import ShimmerImage from '../ShimmerImage';

// Default slides constant moved outside for reusability
const defaultSlides = [
  {
    id: 1,
    image: '/varaha-assets/heroimage.avif',
    title: 'Timeless Elegance',
    subtitle: 'Heritage-inspired masterpieces crafted with tradition and artistry',
    link_text: 'Explore Collections',
    link_url: '/collections',
    secondary_link_text: 'Our Heritage',
    secondary_link_url: '/heritage'
  },
  {
    id: 2,
    image: '/varaha-assets/Jimage2.avif',
    title: 'Royal Heritage',
    subtitle: 'Exquisite pieces that celebrate India\'s rich cultural legacy',
    link_text: 'Explore Collections',
    link_url: '/collections',
    secondary_link_text: 'Our Heritage',
    secondary_link_url: '/heritage'
  },
  {
    id: 3,
    image: '/varaha-assets/Jimage3.webp',
    title: 'Artisan Excellence',
    subtitle: 'Every piece handcrafted by master artisans with devotion and precision',
    link_text: 'Explore Collections',
    link_url: '/collections',
    secondary_link_text: 'Our Heritage',
    secondary_link_url: '/heritage'
  }
];

const SLIDE_MS = 6000; // time each slide stays on screen

export default function HeroSection({ initialSlides }) {
  // Initialize with passed props to ensure immediate render (Hyperspeed LCP)
  const [slides, setSlides] = useState(initialSlides || defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loadedSlides, setLoadedSlides] = useState([0]); // Track which slides have been allowed to load

  // Still fetch on mount to get updates if any (stale-while-revalidate strategy)
  useEffect(() => {
    if (!initialSlides) {
      fetchSlides();
    }
  }, [initialSlides]);

  const fetchSlides = async () => {
    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/content/hero`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setSlides(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch hero slides:", err);
      // Keep existing slides
    }
  };

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_MS);

    return () => clearInterval(timer);
  }, [isAutoPlaying, slides, currentSlide]);

  // Progressive Loading Effect: Add current slide to loaded list
  useEffect(() => {
    if (!loadedSlides.includes(currentSlide)) {
      setLoadedSlides(prev => [...prev, currentSlide]);
    }
    // Preload next slide for smoother auto-play transition
    const nextIndex = (currentSlide + 1) % slides.length;
    if (!loadedSlides.includes(nextIndex)) {
      const timer = setTimeout(() => {
        setLoadedSlides(prev => {
          if (!prev.includes(nextIndex)) return [...prev, nextIndex];
          return prev;
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentSlide, slides.length]);

  const resumeTimer = useRef(null);
  const pauseThenResume = () => {
    setIsAutoPlaying(false);
    clearTimeout(resumeTimer.current);
    // Resume auto-play after 10 seconds of no interaction
    resumeTimer.current = setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    pauseThenResume();
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % slides.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + slides.length) % slides.length);

  // Swipe on touch devices
  const touchX = useRef(null);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) (dx < 0 ? nextSlide : prevSlide)();
    touchX.current = null;
  };

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <section
      className="hero relative h-[calc(100svh-196px)] lg:h-[calc(100svh-180px)] min-h-[520px] overflow-hidden bg-[#2a150c]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      {/* Slides */}
      {slides.map((slide, index) => {
        const active = index === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${active ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`}
            aria-hidden={!active}
          >
            {/* Background image with slow zoom while the slide is on screen */}
            <div className={`absolute inset-0 ${active ? 'hero-zoom' : ''}`}>
              {loadedSlides.includes(index) && (
                <>
                  <div className="md:hidden w-full h-full">
                    <ShimmerImage
                      src={slide.mobile_image || slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      priority={index === 0}
                      quality={60}
                      sizes="100vw"
                    />
                  </div>
                  <div className="hidden md:block w-full h-full">
                    <ShimmerImage
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      priority={index === 0}
                      quality={75}
                      sizes="100vw"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Rich warm shade: from the bottom on phones, from the left on larger screens,
                so the text stays readable and the jewellery stays bright */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2a150c]/95 via-[#2a150c]/45 to-[#2a150c]/10 md:bg-gradient-to-r md:from-[#2a150c]/90 md:via-[#2a150c]/45 md:to-transparent"></div>
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#2a150c]/40 to-transparent"></div>
          </div>
        );
      })}

      {/* Content (re-mounted per slide so the entrance animation replays) */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex flex-col justify-end md:justify-center pb-20 md:pb-24">
        {slides[currentSlide] && (
          <div key={currentSlide} className="max-w-xl xl:max-w-2xl text-left">
            <p className="hero-in flex items-center gap-3 text-[11px] sm:text-xs uppercase tracking-[0.35em] text-[#E8C9A0] font-medium" style={{ animationDelay: '0.1s' }}>
              <span className="h-px w-10 bg-[#E8C9A0]/70"></span>
              Varaha Jewels
            </p>

            <h1 className="hero-in mt-5 font-royal font-semibold text-[2.75rem] leading-[1.02] sm:text-6xl xl:text-[5.5rem] text-[#FBF3EA] tracking-tight" style={{ animationDelay: '0.25s' }}>
              {slides[currentSlide].title}
            </h1>

            <p className="hero-in mt-5 font-playfair text-base sm:text-lg lg:text-xl text-[#F4E6D8]/85 leading-relaxed max-w-lg" style={{ animationDelay: '0.45s' }}>
              {slides[currentSlide].subtitle}
            </p>

            <div className="hero-in mt-6 sm:mt-8 flex flex-row gap-3 sm:gap-4" style={{ animationDelay: '0.65s' }}>
              <Link
                href={slides[currentSlide].link_url || "/collections"}
                className="group flex-[1.4] sm:flex-none inline-flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-[#C8894F] to-copper text-white text-[11px] sm:text-sm font-semibold tracking-[0.06em] sm:tracking-[0.12em] uppercase whitespace-nowrap rounded-full shadow-[0_10px_30px_-8px_rgba(200,137,79,0.7)] hover:shadow-[0_14px_36px_-8px_rgba(200,137,79,0.9)] hover:-translate-y-0.5 transition-all duration-300"
              >
                {slides[currentSlide].link_text || "Explore Collections"}
                <ArrowRight size={18} className="hidden sm:block group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
              <Link
                href={slides[currentSlide].secondary_link_url || "/heritage"}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-8 py-3.5 sm:py-4 border border-[#F4E6D8]/50 text-[#FBF3EA] text-[11px] sm:text-sm font-semibold tracking-[0.06em] sm:tracking-[0.12em] uppercase whitespace-nowrap rounded-full backdrop-blur-sm bg-white/5 hover:bg-white/15 hover:border-[#F4E6D8] transition-all duration-300"
              >
                {slides[currentSlide].secondary_link_text || "Our Heritage"}
              </Link>
            </div>

            {/* Trust points (same promises the store makes elsewhere) */}
            <ul className="hero-in mt-8 hidden sm:flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#F4E6D8]/75" style={{ animationDelay: '0.85s' }}>
              <li className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-[#E8C9A0]" /> 100% Authentic</li>
              <li className="flex items-center gap-1.5"><RotateCcw size={15} className="text-[#E8C9A0]" /> 7 Day Returns</li>
              <li className="flex items-center gap-1.5"><Truck size={15} className="text-[#E8C9A0]" /> Free Delivery over ₹499</li>
            </ul>
          </div>
        )}
      </div>

      {/* Bottom bar: slide progress + arrows */}
      {slides.length > 1 && (
        <div className="absolute z-20 bottom-6 md:bottom-8 inset-x-0">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex items-end gap-4 md:gap-8">
            <span className="hidden md:block font-royal text-[#FBF3EA] text-2xl leading-none tabular-nums">
              {pad(currentSlide + 1)}<span className="text-[#F4E6D8]/40 text-base"> / {pad(slides.length)}</span>
            </span>

            <div className="flex-1 grid gap-3 md:gap-5" style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))` }}>
              {slides.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => goToSlide(index)}
                  className="group text-left min-h-0 min-w-0 py-2"
                  aria-label={`Go to slide ${index + 1}: ${s.title}`}
                  aria-current={index === currentSlide}
                >
                  <span className={`hidden md:block mb-2 text-[11px] uppercase tracking-[0.2em] truncate transition-colors ${index === currentSlide ? 'text-[#FBF3EA]' : 'text-[#F4E6D8]/45 group-hover:text-[#F4E6D8]/80'}`}>
                    {s.title}
                  </span>
                  <span className="block h-[2px] w-full bg-white/20 overflow-hidden rounded-full">
                    <span
                      key={index === currentSlide ? `on-${currentSlide}-${isAutoPlaying}` : 'off'}
                      className={`block h-full bg-[#E8C9A0] origin-left ${index === currentSlide ? (isAutoPlaying ? 'hero-progress' : 'scale-x-100') : index < currentSlide ? 'scale-x-100 opacity-50' : 'scale-x-0'}`}
                      style={{ animationDuration: `${SLIDE_MS}ms` }}
                    />
                  </span>
                </button>
              ))}
            </div>

            <div className="hidden md:flex gap-2">
              <button
                onClick={prevSlide}
                className="w-11 h-11 rounded-full border border-[#F4E6D8]/40 text-[#FBF3EA] flex items-center justify-center hover:bg-[#FBF3EA] hover:text-heritage transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="w-11 h-11 rounded-full border border-[#F4E6D8]/40 text-[#FBF3EA] flex items-center justify-center hover:bg-[#FBF3EA] hover:text-heritage transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .hero .hero-zoom {
          animation: vjHeroZoom 9s ease-out forwards;
        }
        .hero .hero-in {
          opacity: 0;
          animation: vjHeroIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .hero .hero-progress {
          transform: scaleX(0);
          animation-name: vjHeroProgress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes vjHeroZoom {
          from { transform: scale(1.1); }
          to { transform: scale(1); }
        }
        @keyframes vjHeroIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vjHeroProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero .hero-zoom,
          .hero .hero-in,
          .hero .hero-progress {
            animation: none;
            opacity: 1;
            transform: none;
            filter: none;
          }
        }
      `}</style>
    </section>
  );
}
