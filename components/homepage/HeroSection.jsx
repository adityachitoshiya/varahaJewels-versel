import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    link_url: '/collections/all',
    secondary_link_text: 'Our Heritage',
    secondary_link_url: '/heritage'
  },
  {
    id: 2,
    image: '/varaha-assets/Jimage2.avif',
    title: 'Royal Heritage',
    subtitle: 'Exquisite pieces that celebrate India\'s rich cultural legacy',
    link_text: 'Explore Collections',
    link_url: '/collections/all',
    secondary_link_text: 'Our Heritage',
    secondary_link_url: '/heritage'
  },
  {
    id: 3,
    image: '/varaha-assets/Jimage3.webp',
    title: 'Artisan Excellence',
    subtitle: 'Every piece handcrafted by master artisans with devotion and precision',
    link_text: 'Explore Collections',
    link_url: '/collections/all',
    secondary_link_text: 'Our Heritage',
    secondary_link_url: '/heritage'
  }
];

export default function HeroSection({ initialSlides }) {
  const [slides, setSlides] = useState(initialSlides || defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loadedSlides, setLoadedSlides] = useState([0]);

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
    }
  };

  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // Extended to 6 seconds for better Ken Burns visibility

    return () => clearInterval(timer);
  }, [isAutoPlaying, slides]);

  useEffect(() => {
    if (!loadedSlides.includes(currentSlide)) {
      setLoadedSlides(prev => [...prev, currentSlide]);
    }
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

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  return (
    <section className="relative h-screen bg-prestige overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 h-screen transition-opacity duration-[1500ms] ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {/* Background Image with Ken Burns Effect */}
          <div className={`absolute inset-0 ${index === currentSlide ? 'animate-kenBurns' : ''}`}>
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
                    quality={85}
                    sizes="100vw"
                  />
                </div>
              </>
            )}
            {/* Dark immersive lighting overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-prestige/90 via-prestige/20 to-transparent"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Content - Glassmorphism Card */}
          <div className="relative h-full flex flex-col justify-end md:justify-center items-start z-20 pb-24 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full flex justify-start">
              {/* Content Card */}
              <div 
                className={`w-full md:max-w-2xl p-8 md:p-12 transition-all duration-1000 ease-out transform ${
                  index === currentSlide 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-12'
                }`}
                style={{ transitionDelay: index === currentSlide ? '400ms' : '0ms' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-px bg-copper"></div>
                  <span className="font-sans text-copper uppercase tracking-widest text-xs font-semibold">Varaha Premium</span>
                </div>
                
                <h1 className="font-royal text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-md">
                  {slide.title}
                </h1>
                
                <p className="font-playfair text-lg md:text-xl text-ivory-smoke/90 mb-10 max-w-lg leading-relaxed font-light drop-shadow-sm">
                  {slide.subtitle}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <Link
                    href={slide.link_url || "/collections/all"}
                    className="group w-full sm:w-auto px-8 py-4 bg-copper text-white font-medium hover:bg-white hover:text-heritage transition-colors duration-300 flex items-center justify-center gap-3 rounded-sm shadow-lg shadow-copper/20"
                  >
                    {slide.link_text || "Explore Collections"}
                    <ChevronRight className="group-hover:translate-x-1 transition-transform duration-300" size={20} />
                  </Link>

                  <Link
                    href={slide.secondary_link_url || "/heritage"}
                    className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/40 text-white font-medium hover:bg-white/10 transition-colors duration-300 rounded-sm flex items-center justify-center"
                  >
                    {slide.secondary_link_text || "Our Heritage"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Modern Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-transparent text-white border border-white/40 rounded-full hover:bg-white hover:text-heritage items-center justify-center transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>
      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-transparent text-white border border-white/40 rounded-full hover:bg-white hover:text-heritage items-center justify-center transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Slide Indicators - Minimal Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentSlide
                ? 'w-10 bg-copper'
                : 'w-2 bg-white/40 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
