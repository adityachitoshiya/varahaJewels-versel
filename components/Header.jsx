import { useState, useRef, useEffect } from 'react';
import { Search, Menu, ShoppingBag, X, Heart, User, LogOut, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import AddToCartModal from './AddToCartModal';

export default function Header({ cartCount = 0, onCartClick }) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const cartContext = useCart();
  const { cartCount: contextCartCount = 0, cartItems = [], removeFromCart = () => { }, updateQuantity = () => { } } = cartContext || {};
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist.length;
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null); // 'women', 'men', or null

  const searchRef = useRef(null);
  const profileRef = useRef(null);

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

  // Update User Auth State
  useEffect(() => {
    const updateState = () => {
      try {
        // User
        const storedUser = localStorage.getItem('customer_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error reading storage:', error);
      }
    };

    // Initial load
    updateState();

    // Listen for updates
    window.addEventListener('storage', updateState);

    return () => {
      window.removeEventListener('storage', updateState);
    };
  }, []);

  // Handle outside click for profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Use prop if provided (override) or context
  const displayCartCount = cartCount > 0 ? cartCount : contextCartCount;

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    setUser(null);
    setIsProfileOpen(false);
    router.push('/');
  };

  const handleCartClick = (e) => {
    if (e) e.preventDefault();
    if (onCartClick) {
      onCartClick();
    } else {
      setIsCartModalOpen(true);
    }
  };

  return (
    <>
      <header className="fixed lg:sticky top-0 left-0 right-0 z-[1000] w-full bg-[#EFE9E2] border-b border-heritage/15 shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" prefetch={false} className="flex flex-col items-start sm:items-center justify-center group py-2 flex-shrink min-w-0">
              <Image
                src="/varaha-assets/logo.png"
                alt="Varaha Jewels™"
                width={160}
                height={50}
                className="h-8 sm:h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <span className="text-[8px] sm:text-[9px] text-heritage/60 font-light tracking-[0.12em] sm:tracking-[0.15em] mt-0.5 italic whitespace-nowrap">
                Where heritage meets royalty
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {/* Collections Mega Menu */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-heritage hover:text-copper transition-colors duration-200 font-medium border-b-2 border-transparent hover:border-copper pb-1">
                  Collections
                  <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
                </button>

                {/* Mega Dropdown */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="bg-white rounded-lg shadow-2xl border border-heritage/10 p-6 min-w-[500px]">
                    <div className="grid grid-cols-2 gap-8">
                      {/* Women Section */}
                      <div>
                        <h3 className="font-royal font-bold text-heritage text-lg mb-4 pb-2 border-b border-copper/30">Women</h3>

                        <div className="mb-4">
                          <p className="text-xs uppercase tracking-wider text-heritage/50 mb-2">Shop by Category</p>
                          <div className="space-y-2">
                            <Link href="/women/necklaces" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Necklaces</Link>
                            <Link href="/women/earrings" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Earrings</Link>
                            <Link href="/women/rings" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Rings</Link>
                            <Link href="/women/bangles-bracelets" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Bangles & Bracelets</Link>
                            <Link href="/women/mangalsutra" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Mangalsutra</Link>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-heritage/50 mb-2">Shop by Look</p>
                          <div className="space-y-2">
                            <Link href="/women/bridal-jewellery" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Bridal</Link>
                            <Link href="/women/minimal" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Minimal</Link>
                          </div>
                        </div>

                        <Link href="/women" prefetch={false} className="inline-block mt-4 text-sm font-semibold text-copper hover:underline">
                          View All Women's →
                        </Link>
                      </div>

                      {/* Men Section */}
                      <div>
                        <h3 className="font-royal font-bold text-heritage text-lg mb-4 pb-2 border-b border-copper/30">Men</h3>

                        <div className="space-y-2">
                          <Link href="/men/necklaces-chains" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Necklaces & Chains</Link>
                          <Link href="/men/rings" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Rings</Link>
                          <Link href="/men/bracelets" prefetch={false} className="block text-sm text-heritage hover:text-copper hover:pl-2 transition-all">Bracelets</Link>
                        </div>

                        <Link href="/men" prefetch={false} className="inline-block mt-4 text-sm font-semibold text-copper hover:underline">
                          View All Men's →
                        </Link>
                      </div>
                    </div>

                    {/* All Collections Link */}
                    <div className="mt-6 pt-4 border-t border-heritage/10 text-center">
                      <Link href="/shop" prefetch={false} className="text-sm font-semibold text-heritage hover:text-copper transition-colors">
                        Browse All Collections →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/ciplx" prefetch={false} className="group flex flex-col items-center justify-center text-center leading-tight text-heritage hover:text-copper transition-colors duration-200 font-medium border-b-2 border-transparent hover:border-copper pb-1">
                <span>Ciplx</span>
                <span className="text-[9px] font-normal tracking-wide opacity-80 group-hover:opacity-100">by varaha heaths</span>
              </Link>
              <Link href="/heritage" prefetch={false} className="text-heritage hover:text-copper transition-colors duration-200 font-medium border-b-2 border-transparent hover:border-copper pb-1">
                Heritage
              </Link>
              <Link href="/new-arrivals" prefetch={false} className="text-heritage hover:text-copper transition-colors duration-200 font-medium border-b-2 border-transparent hover:border-copper pb-1">
                New Arrivals
              </Link>
              <Link href="/contact" prefetch={false} className="text-heritage hover:text-copper transition-colors duration-200 font-medium border-b-2 border-transparent hover:border-copper pb-1">
                Contact
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-3 lg:gap-4">
              {/* Search - Hidden on mobile */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hidden md:flex items-center justify-center w-10 h-10 text-heritage hover:text-copper transition-colors duration-200"
                aria-label="Search"
              >
                <Search size={22} />
              </button>

              {/* Wishlist - Visible on desktop only now (moved to bottom nav for mobile) */}
              <Link
                href="/wishlist"
                prefetch={false}
                className="hidden lg:flex relative items-center justify-center w-10 h-10 text-heritage hover:text-copper transition-colors duration-200 group flex-shrink-0"
                aria-label="Wishlist"
              >
                <Heart size={18} className="sm:w-5 sm:h-5 group-hover:fill-current transition-all duration-200" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[18px] sm:h-[18px] flex items-center justify-center px-0.5 leading-none">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart - Visible on all devices */}
              <button
                onClick={handleCartClick}
                className="relative flex items-center justify-center w-12 h-12 text-heritage hover:text-copper transition-colors duration-200 flex-shrink-0 touch-manipulation"
                aria-label="Shopping cart"
              >
                <ShoppingBag size={20} className="sm:w-5 sm:h-5" />
                {displayCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-copper text-warm-sand text-[9px] sm:text-[10px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[18px] sm:h-[18px] flex items-center justify-center px-0.5 leading-none">
                    {displayCartCount}
                  </span>
                )}
              </button>

              {/* User Profile / Login - Visible on desktop only (moved to bottom nav for mobile) */}
              <div className="hidden lg:block relative">
                {user ? (
                  <button
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-heritage hover:text-copper transition-colors duration-200 flex-shrink-0"
                    aria-label="My Account"
                  >
                    <User size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:block text-sm font-medium whitespace-nowrap">
                      Hi {user.full_name?.split(' ')[0] || user.name?.split(' ')[0] || 'User'}!
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    prefetch={false}
                    className="flex items-center justify-center w-10 h-10 text-heritage hover:text-copper transition-colors duration-200 flex-shrink-0"
                    aria-label="Sign In"
                  >
                    <User size={18} className="sm:w-5 sm:h-5" />
                  </Link>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 text-heritage hover:text-copper transition-all duration-300 flex-shrink-0"
                aria-label="Menu"
              >
                <div className={`transition-all duration-300 ${isMobileMenuOpen ? 'rotate-90 scale-110' : 'rotate-0 scale-100'}`}>
                  {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </div>
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
      </header>

      {/* Dark Blur Backdrop for Mobile Menu - Starts below header */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed top-16 sm:top-20 inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm z-[1001] transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsMobileMenuOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu - Higher z-index than backdrop */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 top-16 sm:top-20 z-[1002] transition-all duration-300 ease-in-out ${isMobileMenuOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
      >
        <div className="h-full border-t border-heritage/15 bg-gradient-to-b from-warm-sand to-ivory-smoke backdrop-blur-lg overflow-y-auto">
          <nav className="px-4 py-6 space-y-2">
            {/* Mobile Search with animation */}
            <div className="relative mb-6 transform transition-all duration-300 animate-slideDown">
              <input
                type="text"
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mobileSearchQuery.trim()) {
                    setIsMobileMenuOpen(false);
                    router.push(`/collections?search=${encodeURIComponent(mobileSearchQuery.trim())}`);
                  }
                }}
                placeholder="Search for jewelry..."
                className="w-full px-4 py-3.5 pl-12 pr-4 border-2 border-copper/30 rounded-xl focus:outline-none focus:border-copper focus:ring-2 focus:ring-copper/20 bg-white text-heritage shadow-sm transition-all duration-200"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-copper" size={20} />
            </div>

            {/* Mobile Auth Status */}
            <div className="mb-4">
              {user ? (
                <div className="bg-white/50 rounded-lg p-3 flex items-center justify-between border border-heritage/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-copper/10 flex items-center justify-center text-copper font-bold">
                      {(user.full_name || user.name)?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-heritage">{user.full_name || user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  prefetch={false}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 bg-heritage text-white rounded-lg font-medium hover:bg-heritage/90 transition-colors shadow-sm"
                >
                  Sign In / Register
                </Link>
              )}
            </div>

            {/* Menu Items with staggered animation */}

            {/* Women Accordion */}
            <div className="space-y-1">
              <button
                onClick={() => setMobileAccordion(mobileAccordion === 'women' ? null : 'women')}
                className="w-full group block relative overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300">
                  <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                    Women
                  </span>
                  <ChevronDown size={18} className={`text-heritage transition-transform duration-300 ${mobileAccordion === 'women' ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Women Submenu */}
              <div className={`overflow-hidden transition-all duration-300 ${mobileAccordion === 'women' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-4 py-2 space-y-1">
                  <p className="text-xs uppercase tracking-wider text-heritage/50 px-4 mb-1">Shop by Category</p>
                  <Link href="/women/necklaces" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Necklaces</Link>
                  <Link href="/women/earrings" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Earrings</Link>
                  <Link href="/women/rings" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Rings</Link>
                  <Link href="/women/bangles-bracelets" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Bangles & Bracelets</Link>
                  <Link href="/women/mangalsutra" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Mangalsutra</Link>
                  <p className="text-xs uppercase tracking-wider text-heritage/50 px-4 mt-2 mb-1">Shop by Look</p>
                  <Link href="/women/bridal-jewellery" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Bridal</Link>
                  <Link href="/women/minimal" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Minimal</Link>
                  <Link href="/women" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-semibold text-copper">View All Women's →</Link>
                </div>
              </div>
            </div>

            {/* Men Accordion */}
            <div className="space-y-1">
              <button
                onClick={() => setMobileAccordion(mobileAccordion === 'men' ? null : 'men')}
                className="w-full group block relative overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300">
                  <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                    Men
                  </span>
                  <ChevronDown size={18} className={`text-heritage transition-transform duration-300 ${mobileAccordion === 'men' ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Men Submenu */}
              <div className={`overflow-hidden transition-all duration-300 ${mobileAccordion === 'men' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-4 py-2 space-y-1">
                  <Link href="/men/necklaces-chains" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Necklaces & Chains</Link>
                  <Link href="/men/rings" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Rings</Link>
                  <Link href="/men/bracelets" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">Bracelets</Link>
                  <Link href="/men" prefetch={false} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-semibold text-copper">View All Men's →</Link>
                </div>
              </div>
            </div>

            {/* All Collections Link */}
            <Link
              href="/shop"
              prefetch={false}
              onClick={() => setIsMobileMenuOpen(false)}
              className="group block relative overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                  All Collections
                </span>
                <div className="w-2 h-2 rounded-full bg-copper/0 group-hover:bg-copper transition-all duration-300"></div>
              </div>
            </Link>

            <Link
              href="/ciplx"
              prefetch={false}
              onClick={() => setIsMobileMenuOpen(false)}
              className="group block relative overflow-hidden"
              style={{ animationDelay: '50ms' }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                <div className="flex flex-col items-start justify-center text-left">
                  <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium leading-tight">
                    Ciplx
                  </span>
                  <span className="text-[10px] text-heritage/60 group-hover:text-copper/80 font-normal">by varaha heaths</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-copper/0 group-hover:bg-copper transition-all duration-300 flex-shrink-0 ml-2"></div>
              </div>
            </Link>

            <Link
              href="/heritage"
              prefetch={false}
              onClick={() => setIsMobileMenuOpen(false)}
              className="group block relative overflow-hidden"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                  Heritage
                </span>
                <div className="w-2 h-2 rounded-full bg-copper/0 group-hover:bg-copper transition-all duration-300"></div>
              </div>
            </Link>

            <Link
              href="/new-arrivals"
              prefetch={false}
              onClick={() => setIsMobileMenuOpen(false)}
              className="group block relative overflow-hidden"
              style={{ animationDelay: '150ms' }}
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
              prefetch={false}
              onClick={() => setIsMobileMenuOpen(false)}
              className="group block relative overflow-hidden"
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                  Contact
                </span>
                <div className="w-2 h-2 rounded-full bg-copper/0 group-hover:bg-copper transition-all duration-300"></div>
              </div>
            </Link>

            {/* Wishlist Link - Mobile Menu */}
            <Link
              href="/wishlist"
              prefetch={false}
              onClick={() => setIsMobileMenuOpen(false)}
              className="group block relative overflow-hidden"
              style={{ animationDelay: '250ms' }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 backdrop-blur-sm border border-red-200 hover:border-red-400 hover:bg-red-100 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Heart size={18} className="text-red-500 group-hover:fill-current transition-all duration-200" />
                  <span className="text-heritage group-hover:text-red-600 transition-colors duration-200 font-medium">
                    My Wishlist
                  </span>
                </div>
                {wishlistCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">
                    {wishlistCount}
                  </span>
                )}
              </div>
            </Link>

            {/* My Account Link - Mobile Menu */}
            <Link
              href="/account"
              prefetch={false}
              onClick={() => setIsMobileMenuOpen(false)}
              className="group block relative overflow-hidden"
              style={{ animationDelay: '300ms' }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-white/50 backdrop-blur-sm border border-heritage/10 hover:border-copper/50 hover:bg-copper/5 transition-all duration-300 transform hover:translate-x-2 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-heritage group-hover:text-copper transition-all duration-200" />
                  <span className="text-heritage group-hover:text-copper transition-colors duration-200 font-medium">
                    My Account
                  </span>
                </div>
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

      {/* Spacer for fixed header on mobile */}
      <div className="h-16 sm:h-20 lg:hidden" aria-hidden="true" />

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

      {/* Global Cart Modal */}
      <AddToCartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cartItems={cartItems || []}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={(sku) => removeFromCart(null, sku)}
        onContinueShopping={() => setIsCartModalOpen(false)}
        onViewCart={() => {
          setIsCartModalOpen(false);
        }}
        onCheckout={() => {
          setIsCartModalOpen(false);
          window.location.href = '/checkout?fromCart=true';
        }}
      />
    </>
  );
}
