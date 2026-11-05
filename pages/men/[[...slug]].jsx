import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getApiUrl, getAuthHeaders } from '../../lib/config';
import { collapseColours } from '../../lib/products';
import { ChevronRight, Heart, ShoppingBag, Grid, List, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import ProductSkeleton from '../../components/ProductSkeleton';
import MarketCard from '../../components/MarketCard';

// Category mappings for Men
const CATEGORY_MAP = {
    'necklaces-chains': { category: 'Chain', title: 'Necklaces & Chains', type: 'category' },
    'rings': { category: 'Ring', title: 'Rings', type: 'category' },
    'bracelets': { category: 'Bracelet', title: 'Bracelets', type: 'category' },
};

export default function MenCategory() {
    const router = useRouter();
    const { slug } = router.query;
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('featured');
    const [wishlist, setWishlist] = useState([]);
    const { addToCart } = useCart();

    // Determine current filter from slug
    const currentSlug = slug?.[0] || '';
    const filterConfig = CATEGORY_MAP[currentSlug] || null;
    const isAllMen = !currentSlug || !filterConfig;

    // Generate SEO data
    const pageTitle = isAllMen
        ? "Men's Jewellery"
        : `Men's ${filterConfig?.title}`;

    const metaTitle = isAllMen
        ? "Buy Men's Jewellery Online | Gold & Silver Jewellery - Varaha Jewels"
        : `Buy Men's ${filterConfig?.title} Online | Gold & Silver ${filterConfig?.title} - Varaha Jewels`;

    const metaDescription = isAllMen
        ? "Explore our exclusive collection of men's jewellery. Shop premium gold chains, rings, and bracelets with authentic craftsmanship."
        : `Shop premium Men's ${filterConfig?.title} at Varaha Jewels. Discover gold, silver, and designer ${filterConfig?.title?.toLowerCase()} with exceptional craftsmanship.`;

    // Fetch products
    useEffect(() => {
        if (!router.isReady) return;
        fetchProducts();
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            setWishlist(JSON.parse(savedWishlist));
        }
    }, [router.isReady, currentSlug]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/products`, { headers: getAuthHeaders() });
            if (res.ok) {
                let data = await res.json();

                // Filter by gender = Men
                data = data.filter(p => p.gender === 'Men');

                // Hide out-of-stock products
                data = data.filter(p => p.stock !== 0);

                // Apply additional filter based on category
                if (filterConfig) {
                    data = data.filter(p =>
                        p.category?.toLowerCase().includes(filterConfig.category.toLowerCase())
                    );
                }

                setProducts(collapseColours(data));
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Sort products
    const sortedProducts = [...products].sort((a, b) => {
        switch (sortBy) {
            case 'price-low': return (a.price || Infinity) - (b.price || Infinity);
            case 'price-high': return (b.price || 0) - (a.price || 0);
            case 'name': return a.name.localeCompare(b.name);
            default: return 0;
        }
    });

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
        window.dispatchEvent(new Event('wishlistUpdated'));
    };

    const handleAddToCart = (product) => {
        const variant = {
            sku: `${product.id}-default`,
            price: product.price,
            name: "Standard",
            image: product.image
        };
        addToCart(product, variant, 1);
    };

    const isInWishlist = (productId) => wishlist.some(item => item.id === productId);

    // Breadcrumb data
    const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: 'Men', href: '/men' },
    ];
    if (filterConfig) {
        breadcrumbs.push({ name: filterConfig.title, href: null });
    }

    return (
        <>
            <Head>
                <title>{metaTitle}</title>
                <meta name="description" content={metaDescription} />
                <meta property="og:title" content={metaTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={`https://www.varahajewels.in/men${currentSlug ? `/${currentSlug}` : ''}`} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "CollectionPage",
                            "name": pageTitle,
                            "description": metaDescription,
                            "url": `https://www.varahajewels.in/men${currentSlug ? `/${currentSlug}` : ''}`,
                            "breadcrumb": {
                                "@type": "BreadcrumbList",
                                "itemListElement": breadcrumbs.filter(b => b.href).map((b, i) => ({
                                    "@type": "ListItem",
                                    "position": i + 1,
                                    "name": b.name,
                                    "item": `https://www.varahajewels.in${b.href}`
                                }))
                            }
                        })
                    }}
                />
            </Head>
            <Header />
            <main className="min-h-screen bg-warm-sand pt-24 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumbs */}
                    <nav className="mb-6 flex items-center gap-2 text-sm text-heritage/60 overflow-x-auto">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={index} className="flex items-center gap-2 whitespace-nowrap">
                                {index > 0 && <ChevronRight size={14} />}
                                {crumb.href ? (
                                    <Link href={crumb.href} className="hover:text-copper transition-colors">
                                        {crumb.name}
                                    </Link>
                                ) : (
                                    <span className="text-heritage">{crumb.name}</span>
                                )}
                            </span>
                        ))}
                    </nav>

                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-royal font-bold text-heritage mb-4">
                            {pageTitle}
                        </h1>
                        <p className="text-heritage/70 max-w-2xl">
                            {isAllMen
                                ? "Explore our exclusive collection of men's jewellery crafted for the modern gentleman."
                                : `Discover our premium collection of ${filterConfig?.title?.toLowerCase()} designed for men.`
                            }
                        </p>
                        <div className="w-20 h-px bg-copper mt-4"></div>
                    </div>

                    {/* Controls Bar */}
                    <div className="bg-white p-4 rounded-sm border border-copper/20 mb-8 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                        <p className="text-heritage/70">
                            Showing <span className="font-semibold text-heritage">{isLoading ? '...' : sortedProducts.length}</span> products
                        </p>
                        <div className="flex items-center gap-4">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:border-copper cursor-pointer"
                            >
                                <option value="featured">Featured</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="name">Name: A-Z</option>
                            </select>
                            <div className="flex border border-gray-200 rounded-sm overflow-hidden h-10">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`w-10 flex items-center justify-center ${viewMode === 'grid' ? 'bg-copper text-white' : 'hover:bg-gray-50'}`}
                                >
                                    <Grid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`w-10 flex items-center justify-center ${viewMode === 'list' ? 'bg-copper text-white' : 'hover:bg-gray-50'}`}
                                >
                                    <List size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {isLoading ? (
                        <ProductSkeleton viewMode={viewMode} />
                    ) : sortedProducts.length === 0 ? (
                        <div className="bg-white border border-copper/30 rounded-sm p-12 text-center">
                            <Search className="mx-auto mb-4 text-heritage/30" size={64} />
                            <h3 className="text-2xl font-royal font-bold text-heritage mb-2">No products found</h3>
                            <p className="text-heritage/70 mb-6">We're adding new products to this category soon!</p>
                            <Link
                                href="/men"
                                className="inline-block px-6 py-3 bg-copper text-warm-sand font-semibold rounded-sm hover:bg-heritage transition-all"
                            >
                                Browse All Men's
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10">
                            {sortedProducts.map((product) => (
                                <MarketCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
