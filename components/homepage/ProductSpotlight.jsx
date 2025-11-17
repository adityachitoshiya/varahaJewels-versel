import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import useScrollAnimation from '../../hooks/useScrollAnimation';

const spotlightProducts = [
  {
    id: 1,
    name: 'Royal Kundan Necklace',
    price: '₹2,45,000',
    image: '/varaha-assets/herosection3.jpeg',
    description: 'Handcrafted with 22K gold and precious gemstones'
  },
  {
    id: 2,
    name: 'Temple Jhumka Earrings',
    price: '₹85,000',
    image: '/varaha-assets/Jimage2.avif',
    description: 'Traditional South Indian design with intricate detailing'
  },
  {
    id: 3,
    name: 'Heritage Bangles Set',
    price: '₹1,95,000',
    image: '/varaha-assets/Jimage3.webp',
    description: 'Classic antique finish with filigree work'
  }
];

export default function ProductSpotlight() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ref, isVisible] = useScrollAnimation();

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % spotlightProducts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + spotlightProducts.length) % spotlightProducts.length);
  };

  const currentProduct = spotlightProducts[currentIndex];

  return (
    <section className="py-24 bg-white border-t border-copper/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          ref={ref}
          className={`text-center mb-20 transition-all duration-800 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="w-16 h-px bg-copper mx-auto mb-6"></div>
          <h2 className="font-royal text-5xl md:text-6xl font-bold text-heritage mb-6 tracking-tight">
            Featured Masterpieces
          </h2>
          <p className="font-playfair text-xl text-heritage/70 font-light">
            Curated selections from our finest collections
          </p>
        </div>

        {/* Product Slider */}
        <div className="relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Side */}
            <div
              className={`relative h-[550px] lg:h-[650px] rounded-sm overflow-hidden bg-white border border-copper/30 shadow-lg transition-all duration-800 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
            >
              <img
                src={currentProduct.image}
                alt={currentProduct.name}
                className="w-full h-full object-cover transition-transform duration-700"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/varaha-assets/og.jpg';
                }}
              />
              
              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/95 text-heritage border border-copper/40 rounded-sm hover:bg-copper hover:text-warm-sand transition-all duration-300 backdrop-blur-sm"
                aria-label="Previous product"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/95 text-heritage border border-copper/40 rounded-sm hover:bg-copper hover:text-warm-sand transition-all duration-300 backdrop-blur-sm"
                aria-label="Next product"
              >
                <ChevronRight size={28} />
              </button>

              {/* Slide Indicators - Hidden for cleaner mobile UX */}
              <div className="hidden">
                {spotlightProducts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      index === currentIndex
                        ? 'w-16 bg-copper'
                        : 'w-8 bg-heritage/30 hover:bg-heritage/50'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Content Side */}
            <div
              className={`space-y-8 transition-all duration-800 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              <div>
                <div className="w-12 h-px bg-copper mb-6"></div>
                <h3 className="font-royal text-4xl md:text-5xl font-bold text-heritage mb-6 leading-tight">
                  {currentProduct.name}
                </h3>
                <div className="w-24 h-px bg-copper/50 mb-8"></div>
                <p className="font-playfair text-xl text-heritage/70 mb-8 leading-relaxed font-light">
                  {currentProduct.description}
                </p>
                <p className="font-royal text-5xl font-bold text-copper mb-10 tracking-wide">
                  {currentProduct.price}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-5">
                <Link
                  href={`/product/${currentProduct.id}`}
                  className="flex-1 px-10 py-4 bg-copper border border-copper text-warm-sand font-medium rounded-sm hover:bg-heritage transition-all duration-300 text-center flex items-center justify-center gap-3"
                >
                  <ShoppingBag size={22} />
                  Buy Now
                </Link>
                <Link
                  href={`/product/${currentProduct.id}`}
                  className="flex-1 px-10 py-4 bg-white border border-copper text-heritage font-medium rounded-sm hover:bg-copper/5 transition-all duration-300 text-center"
                >
                  View Details
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-copper/30">
                <div className="text-center animate-float" style={{ animationDelay: '0s' }}>
                  <p className="font-royal text-3xl font-bold text-copper mb-2">22K</p>
                  <p className="font-sans text-sm text-heritage/70">Pure Gold</p>
                </div>
                <div className="text-center border-x border-copper/30 animate-float" style={{ animationDelay: '1s' }}>
                  <p className="font-royal text-3xl font-bold text-copper mb-2">BIS</p>
                  <p className="font-sans text-sm text-heritage/70">Hallmarked</p>
                </div>
                <div className="text-center animate-float" style={{ animationDelay: '2s' }}>
                  <p className="font-royal text-3xl font-bold text-copper mb-2">100%</p>
                  <p className="font-sans text-sm text-heritage/70">Handcrafted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
