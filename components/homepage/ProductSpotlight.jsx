import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import SpotlightSkeleton from '../SpotlightSkeleton';

import { getApiUrl } from '../../lib/config'; // Import config

const ROTATE_MS = 6000; // time each piece stays in the spotlight

// Descriptions come from the admin editor: drop HTML tags and a leading
// "Product Description" heading so the card shows only the actual text
function cleanDescription(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/^\s*product\s+description\s*:?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const formatINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const pad = (n) => String(n).padStart(2, '0');

export default function ProductSpotlight() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef(null);
  const railRef = useRef(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // Only rotate while the section is on screen
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [isLoading]);

  // Auto-rotate
  useEffect(() => {
    if (products.length <= 1 || isPaused || !isInView) return;
    const timer = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % products.length);
    }, ROTATE_MS);
    return () => clearTimeout(timer);
  }, [currentIndex, products.length, isPaused, isInView]);

  // Keep the active thumbnail visible in the rail (without scrolling the page)
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.children[currentIndex];
    if (!rail || !el) return;
    rail.scrollTo({ left: el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [currentIndex]);

  const fetchFeaturedProducts = async () => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      // Filter for spotlight products (admin-set via toggle)
      const spotlight = data.filter(p => p.is_spotlight);
      // Fallback: if no spotlight set, use featured/bestseller/premium, then first 5
      if (spotlight.length > 0) {
        setProducts(spotlight);
      } else {
        const featured = data.filter(p => p.tag === 'Featured' || p.tag === 'Bestseller' || p.premium);
        setProducts(featured.length > 0 ? featured : data.slice(0, 5));
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <SpotlightSkeleton />;
  // Nothing worth showing to shoppers: skip the section instead of an error/admin link
  if (error || products.length === 0) return null;

  const current = products[currentIndex];
  const hasFeaturedProducts = products.some(p => p.is_spotlight || p.tag === 'Featured' || p.tag === 'Bestseller' || p.premium);
  const href = (p) => `/product/${p.slug || p.id}`;
  const showMrp = current.mrp && current.mrp > current.price;
  const offPct = showMrp ? Math.round((1 - current.price / current.mrp) * 100) : 0;
  const details = [current.category, current.metal, current.polish].filter(Boolean);
  const description = cleanDescription(current.description) ||
    'Experience the timeless elegance of our handcrafted masterpiece, designed to illuminate your grace.';

  const go = (i) => setCurrentIndex((i + products.length) % products.length);

  return (
    <section
      ref={sectionRef}
      className="spotlight relative overflow-hidden bg-[#2a150c] py-20 md:py-28"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Warm glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-copper/25 blur-[140px]"></div>
        <div className="absolute -bottom-48 right-0 w-[30rem] h-[30rem] rounded-full bg-[#C8894F]/15 blur-[140px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Heading */}
        <div className="flex items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <p className="flex items-center gap-3 text-[11px] sm:text-xs uppercase tracking-[0.35em] text-[#E8C9A0] font-medium">
              <span className="h-px w-10 bg-[#E8C9A0]/70"></span>
              {hasFeaturedProducts ? 'In the Spotlight' : 'Fresh Designs'}
            </p>
            <h2 className="mt-4 font-royal font-semibold text-4xl sm:text-5xl md:text-6xl text-[#FBF3EA] leading-[1.05]">
              {hasFeaturedProducts ? 'Featured Masterpieces' : 'New Arrivals'}
            </h2>
          </div>
          <Link
            href="/shop"
            prefetch={false}
            className="hidden sm:inline-flex items-center gap-2 text-sm text-[#F4E6D8]/80 hover:text-[#FBF3EA] border-b border-[#F4E6D8]/30 hover:border-[#FBF3EA] pb-1 transition-colors whitespace-nowrap"
          >
            View all pieces <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Image stage */}
          <div className="lg:col-span-7">
            <Link
              href={href(current)}
              prefetch={false}
              className="group relative block aspect-[4/5] sm:aspect-[5/4] lg:aspect-[6/5] rounded-[28px] overflow-hidden bg-[#3a2014] ring-1 ring-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]"
              aria-label={`View ${current.name}`}
            >
              {products.map((p, i) => (
                <div
                  key={p.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden={i !== currentIndex}
                >
                  <div className={`absolute inset-0 ${i === currentIndex ? 'spotlight-zoom' : ''}`}>
                    <Image
                      src={p.image || '/varaha-assets/logo.png'}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      priority={i === 0}
                      onError={(e) => { e.target.src = '/varaha-assets/logo.png'; }}
                    />
                  </div>
                </div>
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

              {/* Tags */}
              <div className="absolute top-5 left-5 flex gap-2">
                {current.tag && (
                  <span className="px-3 py-1 rounded-full bg-[#FBF3EA] text-heritage text-[11px] font-bold uppercase tracking-[0.15em]">
                    {current.tag}
                  </span>
                )}
                {current.premium && (
                  <span className="px-3 py-1 rounded-full bg-[#C8894F] text-white text-[11px] font-bold uppercase tracking-[0.15em]">
                    Premium
                  </span>
                )}
              </div>

              {/* Counter */}
              {products.length > 1 && (
                <span className="absolute bottom-5 left-6 font-royal text-[#FBF3EA] text-2xl tabular-nums">
                  {pad(currentIndex + 1)}<span className="text-[#F4E6D8]/50 text-base"> / {pad(products.length)}</span>
                </span>
              )}

              <span className="absolute bottom-5 right-5 w-11 h-11 rounded-full bg-[#FBF3EA]/90 text-heritage flex items-center justify-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <ArrowUpRight size={20} />
              </span>
            </Link>
          </div>

          {/* Details (re-mounted per product so the entrance animation replays) */}
          <div className="lg:col-span-5">
            <div key={current.id} className="spotlight-in">
              {details.length > 0 && (
                <p className="flex flex-wrap gap-2">
                  {details.map((d) => (
                    <span key={d} className="px-3 py-1 rounded-full border border-[#F4E6D8]/20 text-[#F4E6D8]/75 text-[11px] uppercase tracking-[0.15em]">
                      {d}
                    </span>
                  ))}
                </p>
              )}

              <h3 className="mt-5 font-royal font-semibold text-3xl md:text-4xl xl:text-[2.75rem] text-[#FBF3EA] leading-[1.12] line-clamp-3" title={current.name}>
                {current.name}
              </h3>

              {/* Real rating only */}
              {current.total_reviews > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-[#F4E6D8]/80">
                  <Star size={15} className="fill-[#E8C9A0] text-[#E8C9A0]" />
                  <span className="font-semibold text-[#FBF3EA]">{Number(current.average_rating).toFixed(1)}</span>
                  <span>· {current.total_reviews} {current.total_reviews === 1 ? 'review' : 'reviews'}</span>
                </div>
              )}

              <p className="mt-5 font-playfair text-base md:text-lg text-[#F4E6D8]/75 leading-relaxed line-clamp-3">
                {description}
              </p>

              <div className="mt-7 flex items-baseline flex-wrap gap-x-3 gap-y-1">
                <span className="font-royal text-4xl md:text-5xl text-[#E8C9A0]">
                  {current.price ? formatINR(current.price) : 'Price on Request'}
                </span>
                {showMrp && (
                  <>
                    <span className="text-[#F4E6D8]/45 line-through">{formatINR(current.mrp)}</span>
                    <span className="text-sm font-semibold text-emerald-300">{offPct}% off</span>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-row gap-3">
                <Link
                  href={href(current)}
                  prefetch={false}
                  className="group flex-1 sm:flex-none lg:flex-1 xl:flex-none min-w-0 inline-flex items-center justify-center gap-3 px-6 sm:px-8 lg:px-5 xl:px-8 py-4 rounded-full bg-gradient-to-r from-[#C8894F] to-copper text-white text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] whitespace-nowrap shadow-[0_10px_30px_-8px_rgba(200,137,79,0.7)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Shop this piece
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                {products.length > 1 && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => go(currentIndex - 1)}
                      className="w-[52px] h-[52px] rounded-full border border-[#F4E6D8]/30 text-[#FBF3EA] flex items-center justify-center hover:bg-[#FBF3EA] hover:text-heritage transition-colors"
                      aria-label="Previous piece"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => go(currentIndex + 1)}
                      className="w-[52px] h-[52px] rounded-full border border-[#F4E6D8]/30 text-[#FBF3EA] flex items-center justify-center hover:bg-[#FBF3EA] hover:text-heritage transition-colors"
                      aria-label="Next piece"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product rail with progress */}
        {products.length > 1 && (
          <div ref={railRef} className="mt-12 md:mt-16 flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide snap-x pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
            {products.map((p, i) => {
              const active = i === currentIndex;
              return (
                <button
                  key={p.id}
                  onClick={() => go(i)}
                  className={`snap-start flex-shrink-0 w-[220px] md:w-[250px] flex items-center gap-3 p-2.5 pr-4 rounded-2xl text-left transition-colors ${active ? 'bg-white/10 ring-1 ring-[#E8C9A0]/50' : 'bg-white/[0.03] hover:bg-white/[0.07]'}`}
                  aria-label={`Show ${p.name}`}
                  aria-current={active}
                >
                  <span className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#3a2014]">
                    <Image
                      src={p.image || '/varaha-assets/logo.png'}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                      onError={(e) => { e.target.src = '/varaha-assets/logo.png'; }}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm truncate ${active ? 'text-[#FBF3EA]' : 'text-[#F4E6D8]/60'}`}>{p.name}</span>
                    <span className={`block text-xs mt-0.5 ${active ? 'text-[#E8C9A0]' : 'text-[#F4E6D8]/40'}`}>
                      {p.price ? formatINR(p.price) : ''}
                    </span>
                    <span className="mt-2 block h-[2px] w-full rounded-full bg-white/10 overflow-hidden">
                      <span
                        key={active ? `on-${currentIndex}-${isPaused}-${isInView}` : 'off'}
                        className={`block h-full bg-[#E8C9A0] origin-left ${active ? (isPaused || !isInView ? 'scale-x-100' : 'spotlight-progress') : 'scale-x-0'}`}
                        style={{ animationDuration: `${ROTATE_MS}ms` }}
                      />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <Link
          href="/shop"
          prefetch={false}
          className="sm:hidden mt-8 inline-flex items-center gap-2 text-sm text-[#F4E6D8]/80 border-b border-[#F4E6D8]/30 pb-1"
        >
          View all pieces <ArrowUpRight size={16} />
        </Link>
      </div>

      <style jsx global>{`
        .spotlight .spotlight-zoom {
          animation: vjSpotZoom 7s ease-out forwards;
        }
        .spotlight .spotlight-in {
          animation: vjSpotIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .spotlight .spotlight-progress {
          transform: scaleX(0);
          animation-name: vjSpotProgress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes vjSpotZoom {
          from { transform: scale(1.08); }
          to { transform: scale(1); }
        }
        @keyframes vjSpotIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vjSpotProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .spotlight .spotlight-zoom,
          .spotlight .spotlight-in,
          .spotlight .spotlight-progress {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
