import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ArrowRight, ShoppingBag } from 'lucide-react';
import SpotlightSkeleton from '../SpotlightSkeleton';

import { getApiUrl } from '../../lib/config'; // Import config

export default function ProductSpotlight() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true); // Force visible for debugging
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

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

  // Safe fallback if no products
  if (isLoading) return <SpotlightSkeleton />;
  if (error) return <div className="py-24 text-center text-red-500">Error: {error}</div>;
  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-heritage/60 mb-4">No products available yet</p>
        <Link href="/admin/products/new" className="text-copper underline">Add your first product</Link>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  // Check if products are featured or new arrivals state derived from current set
  const hasFeaturedProducts = products.some(p => p.tag === 'Featured' || p.tag === 'Bestseller' || p.premium);

  return (
    <section className="py-12 sm:py-16 md:py-24 relative overflow-hidden bg-[#faf9f6]">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-copper rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-heritage rounded-full blur-[120px]"></div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div
          ref={ref}
          className={`text-center mb-8 sm:mb-12 md:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <span className="text-copper font-medium tracking-[0.2em] uppercase text-sm mb-2 block animate-pulse">
            {hasFeaturedProducts ? 'Exquisite Collection' : 'Fresh Designs'}
          </span>
          <h2 className="font-royal text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-heritage mb-4 sm:mb-6 drop-shadow-sm">
            {hasFeaturedProducts ? 'Featured Masterpieces' : 'New Arrivals'}
          </h2>
        </div>

        {/* Main Showcase */}
        <div className={`relative transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="grid lg:grid-cols-12 gap-8 items-center">

            {/* Image Area - Spans 7 cols - WITH FLOATING EFFECT */}
            <div className="lg:col-span-7 relative group md:animate-float">
              <div className="aspect-[3/4] sm:aspect-[4/5] md:aspect-[16/10] lg:h-[600px] w-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_10px_30px_-8px_rgba(183,110,121,0.25)] sm:shadow-[0_20px_50px_-12px_rgba(183,110,121,0.3)] border border-white/20">
                <Image
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={(e) => { e.target.src = '/varaha-assets/logo.png'; }}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                {/* Tags on Image */}
                <div className="absolute top-3 left-3 sm:top-6 sm:left-6 flex gap-1.5 sm:gap-2">
                  {currentProduct.premium && (
                    <span className="px-2.5 py-0.5 sm:px-4 sm:py-1 bg-white/90 backdrop-blur-md text-heritage text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg">
                      Premium
                    </span>
                  )}
                  {currentProduct.tag && (
                    <span className="px-2.5 py-0.5 sm:px-4 sm:py-1 bg-copper/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg">
                      {currentProduct.tag}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content Area - Floating Glass Card - Spans 5 cols */}
            <div className="lg:col-span-5 lg:-ml-12 relative z-20 mt-4 sm:mt-6 lg:mt-0">
              <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-5 sm:p-8 md:p-12 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(183,110,121,0.2)] transition-shadow duration-500">
                <div className="flex items-center gap-1.5 sm:gap-2 text-copper mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="sm:w-4 sm:h-4" fill="currentColor" />
                  ))}
                  <span className="text-xs text-gray-500 font-medium ml-2 uppercase tracking-wide">(Bestseller)</span>
                </div>

                <h3 className="font-royal text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-heritage mb-3 sm:mb-4 md:mb-6 leading-[1.1]">
                  {currentProduct.name}
                </h3>

                <p className="font-playfair text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {currentProduct.description || "Experience the timeless elegance of our handcrafted masterpiece, designed to illuminate your grace."}
                </p>

                <div className="flex items-baseline gap-2 sm:gap-4 mb-5 sm:mb-8 md:mb-10">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-light text-copper">
                    {currentProduct.price ? `₹${currentProduct.price.toLocaleString('en-IN')} ` : 'Price on Request'}
                  </span>
                </div>

                <div className="flex flex-row gap-2 sm:gap-4">
                  <Link
                    href={`/product/${currentProduct.slug || currentProduct.id}`}
                    className="flex-1 py-3 sm:py-4 bg-heritage text-white text-center rounded-lg font-medium text-sm sm:text-base hover:bg-copper transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-heritage/20 active:scale-[0.97]"
                  >
                    Shop Now
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href={`/product/${currentProduct.slug || currentProduct.id}`}
                    className="px-4 sm:px-6 py-3 sm:py-4 border border-heritage/20 text-heritage rounded-lg hover:bg-heritage/5 transition-colors flex items-center justify-center group active:scale-[0.97]"
                  >
                    <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                  </Link>
                </div>

              </div>

              {/* Thumbnails Navigation */}
              <div className="mt-4 sm:mt-6 md:mt-8 flex gap-2.5 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 hide-scrollbar scrollbar-hide px-1">
                {products.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300 relative active:scale-95 ${idx === currentIndex ? 'border-copper scale-110 shadow-lg ring-2 ring-copper/20' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                  >
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                      onError={(e) => { e.target.src = '/varaha-assets/logo.png'; }}
                    />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
