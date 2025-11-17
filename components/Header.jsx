import { useState, useRef, useEffect } from 'react';
import { Search, Menu, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header({ cartCount = 0, onCartClick }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const searchRef = useRef(null);

  // Desktop sticky header only
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 1024) {
        setIsSticky(window.scrollY > 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#EFE9E2] border-b border-heritage/15 shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex flex-col items-center justify-center group py-2">
              <Image
                src="/varaha-assets/logo.png"
                alt="Varaha Jewels"
                width={160}
                height={50}
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-[9px] text-heritage/60 font-light tracking-[0.15em] mt-0.5 italic whitespace-nowrap">
                Where heritage meets royalty
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              <Link href="/coming-soon" className="text-heritage hover:text-copper transition-colors duration-200 font-medium border-b-2 border-transparent hover:border-copper pb-1">
                Collections
              </Link>
              <Link href="/coming-soon" className="text-heritage hover:text-copper transition-colors duration-200 font-medium border-b-2 border-transparent hover:border-copper pb-1">
                Heritage
              </Link>
              <Link href="/coming-soon" className="text-heritage hover:text-copper transition-colors duration-200 font-medium border-b-2 border-transparent hover:border-copper pb-1">
                New Arrivals
              </Link>
              <Link href="/contact" className="text-heritage hover:text-copper transition-colors duration-200 font-medium border-b-2 border-transparent hover:border-copper pb-1">
                Contact
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-6">
              {/* Search */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hidden md:block text-heritage hover:text-copper transition-colors duration-200"
                aria-label="Search"
              >
                <Search size={22} />
              </button>

              {/* Cart */}
              <button 
                onClick={onCartClick}
                className="relative text-heritage hover:text-copper transition-colors duration-200"
                aria-label="Shopping cart"
              >
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-copper text-warm-sand text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-heritage hover:text-copper transition-colors duration-200"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          {isSearchOpen && (
            <div className="hidden md:block pb-4">
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search for jewelry..."
                  className="w-full px-4 py-3 pl-12 pr-4 border-2 border-copper/30 rounded-lg focus:outline-none focus:border-copper bg-white text-heritage"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsSearchOpen(false);
                  }}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-copper" size={20} />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-heritage/60 hover:text-copper"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-heritage/15 bg-gradient-to-b from-warm-sand to-ivory-smoke backdrop-blur-lg">
            <nav className="px-4 py-6 space-y-2">
              {/* Mobile Search with animation */}
              <div className="relative mb-6 transform transition-all duration-300 animate-slideDown">
                <input
                  type="text"
                  placeholder="Search for jewelry..."
                  className="w-full px-4 py-3.5 pl-12 pr-4 border-2 border-copper/30 rounded-xl focus:outline-none focus:border-copper focus:ring-2 focus:ring-copper/20 bg-white text-heritage shadow-sm transition-all duration-200"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-copper animate-pulse" size={20} />
              </div>

              {/* Menu Items with staggered animation */}
              <Link 
                href="/coming-soon" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="group block relative overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                  <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                    Collections
                  </span>
                  <div className="w-2 h-2 rounded-full bg-copper/0 group-hover:bg-copper transition-all duration-300"></div>
                </div>
              </Link>

              <Link 
                href="/coming-soon" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="group block relative overflow-hidden"
                style={{ animationDelay: '50ms' }}
              >
                <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                  <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                    Heritage
                  </span>
                  <div className="w-2 h-2 rounded-full bg-copper/0 group-hover:bg-copper transition-all duration-300"></div>
                </div>
              </Link>

              <Link 
                href="/coming-soon" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="group block relative overflow-hidden"
                style={{ animationDelay: '100ms' }}
              >
                <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                  <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                    New Arrivals
                  </span>
                  <div className="w-2 h-2 rounded-full bg-copper/0 group-hover:bg-copper transition-all duration-300"></div>
                </div>
              </Link>

              <Link 
                href="/contact" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="group block relative overflow-hidden"
                style={{ animationDelay: '150ms' }}
              >
                <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                  <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                    Contact
                  </span>
                  <div className="w-2 h-2 rounded-full bg-copper/0 group-hover:bg-copper transition-all duration-300"></div>
                </div>
              </Link>

              {/* Decorative element */}
              <div className="mt-6 pt-4 border-t border-heritage/10">
                <p className="text-center text-xs text-heritage/60 italic">
                  Discover timeless elegance
                </p>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

