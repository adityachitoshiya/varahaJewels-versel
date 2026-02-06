import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getApiUrl, getAuthHeaders } from '../lib/config';
import { Search, Heart, ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRouter } from 'next/router';
import ProductSkeleton from '../components/ProductSkeleton';

export default function Shop() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Default to Men initially (server-safe)
    const [selectedGender, setSelectedGender] = useState('Men');

    // Restore selected gender from session storage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('shop_selected_gender');
            if (saved) {
                setSelectedGender(saved);
            }
        }
    }, []);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();

    // Save gender to sessionStorage whenever it changes
    const handleGenderChange = (gender) => {
        setSelectedGender(gender);
        sessionStorage.setItem('shop_selected_gender', gender);
    };

    useEffect(() => {
        // Disable browser's default scroll restoration to handle it manually
        if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        fetchProducts();
    }, []);

    // Handle URL query for gender if needed (optional enhancement)
    useEffect(() => {
        if (router.isReady && router.query.gender) {
            const g = router.query.gender.toLowerCase();
            if (g === 'women') handleGenderChange('Women');
            else if (g === 'men') handleGenderChange('Men');
        }
    }, [router.isReady, router.query]);

    const fetchProducts = async () => {
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/products`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            } else {
                console.error("Failed to fetch products");
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Scroll Restoration: Restore position after products load
    useEffect(() => {
        if (!isLoading && products.length > 0) {
            const savedPosition = sessionStorage.getItem('shop_scroll_position');
            if (savedPosition) {
                const pos = parseInt(savedPosition);
                // Attempt restore immediately and after delay to ensure layout is ready
                const scroll = () => window.scrollTo(0, pos);

                setTimeout(scroll, 100);
                setTimeout(() => {
                    scroll();
                    sessionStorage.removeItem('shop_scroll_position');
                }, 500);
            }
        }
    }, [isLoading, products]);



    const handleAddToCart = (product) => {
        const variant = {
            sku: product.id,
            price: product.price,
            name: product.name,
            image: product.image
        };
        addToCart(product, variant, 1);
    };

    // Save scroll position before navigating to product
    const saveScrollPosition = () => {
        sessionStorage.setItem('shop_scroll_position', window.scrollY.toString());
    };



    // 1. Filter by Gender
    // If product has no gender set/null, allow it in both? Or strict? 
    // User said "default m men", implying strict separation.
    // I'll be inclusive: if matches selected OR (if user wants) unisex?
    // Let's stick to strict match first, assuming migration set data.
    const genderFiltered = products.filter(p => {
        if (searchQuery) {
            const term = searchQuery.toLowerCase();
            const matcheSearch =
                p.name.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term);
            if (!matcheSearch) return false;
        }

        // Strict match for Men/Women. 
        // Note: Backend might use "Men", "Women".
        // Also allowing "Unisex" to show in both if needed, but for now strict.
        return p.gender === selectedGender;
    });

    // 2. Group by Category
    const groupedProducts = genderFiltered.reduce((acc, product) => {
        const cat = product.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(product);
        return acc;
    }, {});

    // Get sorted category names (optional: custom order)
    const categoryKeys = Object.keys(groupedProducts).sort();

    return (
        <>
            <Head>
                <title>Buy Certified Gold & Diamond Jewellery | Varaha Jewels™ Collection</title>
                <meta name="description" content="Browse our exquisite collection of heritage jewelry." />
            </Head>
            <Header />
            <main className="min-h-screen bg-warm-sand pt-24 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header with Search & Gender Tabs */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 sticky top-20 z-40 bg-warm-sand/95 backdrop-blur-sm py-2">
                        <div className="flex bg-white rounded-full p-1 shadow-sm border border-copper/20">
                            <button
                                onClick={() => handleGenderChange('Men')}
                                className={`px-8 py-2 rounded-full text-sm font-bold transition-all duration-300 ${selectedGender === 'Men'
                                    ? 'bg-heritage text-white shadow-md'
                                    : 'text-heritage hover:bg-gray-50'
                                    }`}
                            >
                                Men
                            </button>
                            <button
                                onClick={() => handleGenderChange('Women')}
                                className={`px-8 py-2 rounded-full text-sm font-bold transition-all duration-300 ${selectedGender === 'Women'
                                    ? 'bg-heritage text-white shadow-md'
                                    : 'text-heritage hover:bg-gray-50'
                                    }`}
                            >
                                Women
                            </button>
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-copper bg-white"
                            />
                        </div>
                    </div>

                    {/* Content Area */}
                    {isLoading ? (
                        <div className="space-y-8">
                            {[1, 2].map(i => (
                                <div key={i}>
                                    <div className="h-8 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
                                    <div className="flex gap-4 overflow-hidden">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="w-64 h-80 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : categoryKeys.length === 0 ? (
                        <div className="text-center py-20">
                            <h3 className="text-2xl font-royal font-bold text-heritage mb-2">No products found</h3>
                            <p className="text-heritage/70">Try changing the gender tab or search query.</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {categoryKeys.map((category) => (
                                <section key={category} className="animate-fadeUp">
                                    <div className="flex justify-between items-end mb-4 px-1">
                                        <h2 className="text-2xl md:text-3xl font-royal font-bold text-heritage">{category}</h2>
                                        <Link
                                            href={`/shop/${selectedGender.toLowerCase()}/${category.toLowerCase().replace(/ /g, '-')}`}
                                            className="text-copper hover:text-heritage font-medium text-sm flex items-center gap-1 transition-colors"
                                        >
                                            View all <ChevronRight size={16} />
                                        </Link>
                                    </div>

                                    {/* Horizontal Scroll Container */}
                                    <div
                                        className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide snap-x"
                                        style={{
                                            scrollPaddingLeft: '1rem',
                                            scrollPaddingRight: '1rem',
                                            WebkitOverflowScrolling: 'touch'
                                        }}
                                    >
                                        {groupedProducts[category].map((product) => (
                                            <div
                                                key={product.id}
                                                className="flex-shrink-0 w-[45%] md:w-[280px] snap-start group"
                                            >
                                                <div className="bg-white border border-copper/20 rounded-sm overflow-hidden hover:shadow-lg transition-all duration-300">
                                                    {/* Image */}
                                                    <div className="relative aspect-square overflow-hidden">
                                                        <Link href={`/product/${product.id}`} onClick={saveScrollPosition}>
                                                            <Image
                                                                src={product.image}
                                                                alt={product.name}
                                                                width={300}
                                                                height={300}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                onError={(e) => { e.target.srcset = ''; e.target.src = '/varaha-assets/logo.png'; }}
                                                            />
                                                        </Link>
                                                        {product.tag && (
                                                            <span className="absolute top-2 left-2 px-2 py-1 bg-copper text-warm-sand text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                                {product.tag}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => toggleWishlist(product.id, product.name)}
                                                            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors z-10"
                                                        >
                                                            <Heart
                                                                size={16}
                                                                className={isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-heritage'}
                                                            />
                                                        </button>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="p-3 md:p-4">
                                                        <Link href={`/product/${product.id}`} onClick={saveScrollPosition}>
                                                            <h3 className="text-sm md:text-base font-royal font-bold text-heritage mb-1 line-clamp-1 truncate group-hover:text-copper transition-colors">
                                                                {product.name}
                                                            </h3>
                                                        </Link>

                                                        <div className="flex items-center justify-between mt-2">
                                                            {product.price ? (
                                                                <p className="text-sm md:text-lg font-bold text-heritage">
                                                                    ₹{product.price.toLocaleString('en-IN')}
                                                                </p>
                                                            ) : (
                                                                <p className="text-xs font-semibold text-copper">Price on Request</p>
                                                            )}
                                                        </div>

                                                        {/* Mobile: Compact Add/View Button */}
                                                        {product.price ? (
                                                            <button
                                                                onClick={() => handleAddToCart(product)}
                                                                className="mt-3 w-full py-2 bg-heritage text-warm-sand text-xs md:text-sm font-semibold rounded-sm hover:bg-copper transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                Add <ShoppingBag size={14} />
                                                            </button>
                                                        ) : (
                                                            <Link
                                                                href={`/product/${product.id}`}
                                                                className="mt-3 block w-full py-2 bg-copper text-warm-sand text-xs md:text-sm font-semibold rounded-sm hover:bg-heritage transition-colors text-center"
                                                            >
                                                                View
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* "View More" Card at the end of the row */}
                                        <div className="flex-shrink-0 w-[40%] md:w-[200px] snap-start flex items-center justify-center">
                                            <Link
                                                href={`/shop/${selectedGender.toLowerCase()}/${category.toLowerCase().replace(/ /g, '-')}`}
                                                className="flex flex-col items-center justify-center gap-2 text-copper hover:text-heritage group p-4 border border-copper/10 rounded-full aspect-square bg-white shadow-sm hover:shadow-md transition-all"
                                            >
                                                <div className="p-3 rounded-full bg-warm-sand group-hover:bg-copper group-hover:text-white transition-colors">
                                                    <ChevronRight size={24} />
                                                </div>
                                                <span className="font-medium text-sm">View All</span>
                                            </Link>
                                        </div>
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
