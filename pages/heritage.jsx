import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getApiUrl } from '../lib/config';
import { Search, SlidersHorizontal, Grid, List, Heart, ChevronDown, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import HeritageWaiting from '../components/HeritageWaiting';

export default function Heritage() {
  // Initialize products empty
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states - Initialize Heritage category as selected
  const [selectedCategories, setSelectedCategories] = useState(['Heritage']);
  const [selectedMetals, setSelectedMetals] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000000]); // Increased range
  const [sortBy, setSortBy] = useState('featured');

  // Wishlist state
  const [wishlist, setWishlist] = useState([]);

  // Cart Hook
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        // Filter initally happens in useEffect
      } else {
        console.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
  const metals = [...new Set(products.map(p => p.metal))].filter(Boolean);
  const styles = [...new Set(products.map(p => p.style))].filter(Boolean);
  const tags = [...new Set(products.map(p => p.tag))].filter(Boolean);

  // Apply filters
  useEffect(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      // Logic: If "Heritage" is selected (default), show items that are category Heritage OR have Heritage tag?
      // For now, strict category match or maybe relaxed if needed. 
      // The page IS "Heritage Collection", so we probably only want Heritage items.
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    if (selectedMetals.length > 0) {
      filtered = filtered.filter(p => selectedMetals.includes(p.metal));
    }

    if (selectedStyles.length > 0) {
      filtered = filtered.filter(p => selectedStyles.includes(p.style));
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(p => selectedTags.includes(p.tag));
    }

    filtered = filtered.filter(p => {
      if (p.price === null || p.price === undefined) return true;
      return p.price >= priceRange[0] && p.price <= priceRange[1];
    });

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => String(b.id).localeCompare(String(a.id)));
        break;
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategories, selectedMetals, selectedStyles, selectedTags, priceRange, sortBy, products]);

  const toggleFilter = (filterArray, setFilterArray, value) => {
    if (filterArray.includes(value)) {
      setFilterArray(filterArray.filter(item => item !== value));
    } else {
      setFilterArray([...filterArray, value]);
    }
  };

  const clearAllFilters = () => {
    // Reset to default state (keep Heritage selected)
    setSelectedCategories(['Heritage']);
    setSelectedMetals([]);
    setSelectedStyles([]);
    setSelectedTags([]);
    setPriceRange([0, 5000000]);
    setSearchQuery('');
  };

  const toggleWishlist = (productId, productName) => {
    const savedWishlist = localStorage.getItem('wishlist');
    let wishlistArray = savedWishlist ? JSON.parse(savedWishlist) : [];
    const existingIndex = wishlistArray.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      wishlistArray.splice(existingIndex, 1);
    } else {
      wishlistArray.push({ id: productId, productName });
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlistArray));
    setWishlist(wishlistArray);
  };

  const handleAddToCart = (product) => {
    const variant = {
      sku: product.id,
      price: product.price,
      name: product.name,
      image: product.image
    };
    addToCart(product, variant, 1);
  };

  const isInWishlist = (productId) => wishlist.some(item => item.id === productId);

  const activeFiltersCount =
    (selectedCategories.length > 1 || (selectedCategories.length === 1 && !selectedCategories.includes('Heritage')) ? 1 : 0) +
    selectedMetals.length +
    selectedStyles.length +
    selectedTags.length +
    (priceRange[0] !== 0 || priceRange[1] !== 5000000 ? 1 : 0);

  // Fetch Settings for Video
  const [videoSettings, setVideoSettings] = useState({ desktop: '', mobile: '' });
  const [showVideo, setShowVideo] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.heritage_video_desktop || data.heritage_video_mobile) {
          setVideoSettings({
            desktop: data.heritage_video_desktop,
            mobile: data.heritage_video_mobile
          });
        } else {
          // If no video, skip straight to content
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
    setVideoEnded(true);
    setShowVideo(false); // Hide video container
    setShowAnimation(true); // Start text animation

    // After animation duration, show content (e.g., 4 seconds)
    setTimeout(() => {
      setShowAnimation(false);
      setContentVisible(true);
    }, 4000);
  };

  return (
    <>
      <Head>
        <title>Heritage Collection - Varaha Jewels | Timeless & Royal</title>
        <meta name="description" content="Explore the Heritage Collection by Varaha Jewels. Royal antique designs, polki work, and traditional craftsmanship." />
      </Head>

      {/* VIDEO OVERLAY */}
      {showVideo && (videoSettings.desktop || videoSettings.mobile) && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
          {/* Mobile Video */}
          <div className="block md:hidden w-full h-full">
            {videoSettings.mobile ? (
              <video
                className="w-full h-full object-cover"
                src={videoSettings.mobile}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
              />
            ) : (
              /* Fallback if only desktop video exists */
              <video
                className="w-full h-full object-cover"
                src={videoSettings.desktop}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
              />
            )}
          </div>

          {/* Desktop Video */}
          <div className="hidden md:block w-full h-full">
            {videoSettings.desktop ? (
              <video
                className="w-full h-full object-cover"
                src={videoSettings.desktop}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
              />
            ) : (
              /* Fallback if only mobile video exists */
              <video
                className="w-full h-full object-cover"
                src={videoSettings.mobile}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
              />
            )}
          </div>

          <button
            onClick={handleVideoEnd}
            className="absolute top-8 right-8 text-white/50 hover:text-white text-sm border border-white/30 rounded-full px-4 py-2 z-50 uppercase tracking-widest"
          >
            Skip Intro
          </button>
        </div>
      )}

      {/* ROYAL ANIMATION OVERLAY */}
      {showAnimation && (
        <div className="fixed inset-0 z-[50] bg-heritage flex flex-col items-center justify-center text-center px-4 animate-fadeIn">
          <h2 className="text-3xl md:text-5xl font-royal text-warm-sand mb-6 leading-tight animate-fadeUp">
            Our craftsmen work hard <br /> to bring you
          </h2>
          <h1 className="text-4xl md:text-7xl font-royal font-bold text-copper mb-4 animate-scaleIn delay-500">
            Royal Rajasthani Jewellery
          </h1>
          <div className="w-32 h-1 bg-warm-sand mt-8 animate-width-expand"></div>
        </div>
      )}

      {/* MAIN CONTENT (Hidden until intro done) */}
      <div className={`transition-opacity duration-1000 ${contentVisible ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <Header />

        <main className="min-h-screen bg-warm-sand">
          <HeritageWaiting />
        </main>
        <Footer />
      </div>
    </>
  );
}
