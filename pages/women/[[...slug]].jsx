import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getApiUrl, getAuthHeaders } from '../../lib/config';
import { collapseColours } from '../../lib/products';
import { ChevronRight, Heart, ShoppingBag, Grid, List, SlidersHorizontal, Search, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import ProductSkeleton from '../../components/ProductSkeleton';
import MarketCard from '../../components/MarketCard';

// Category and Collection mappings
const CATEGORY_MAP = {
    'necklaces': { category: 'Necklace', title: 'Necklaces', type: 'category' },
    'earrings': { category: 'Earrings', title: 'Earrings', type: 'category' },
    'rings': { category: 'Ring', title: 'Rings', type: 'category' },
    'bangles-bracelets': { category: 'Bangles', title: 'Bangles & Bracelets', type: 'category' },
    'mangalsutra': { category: 'Mangalsutra', title: 'Mangalsutra', type: 'category' },
    'bridal-jewellery': { collection: 'Bridal', title: 'Bridal Jewellery', type: 'collection' },
    'minimal': { collection: 'Minimal', title: 'Minimal Jewellery', type: 'collection' },
};

export default function WomenCategory() {
    const router = useRouter();
    const { slug } = router.query;
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('featured');
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();

    // Determine current filter from slug
    const currentSlug = slug?.[0] || '';
    const filterConfig = CATEGORY_MAP[currentSlug] || null;
    const isAllWomen = !currentSlug || !filterConfig;

    // Generate SEO data
    const pageTitle = isAllWomen
        ? "Women's Jewellery"
        : `Women's ${filterConfig?.title}`;

    const metaTitle = isAllWomen
        ? "Buy Women's Jewellery Online | Gold & Diamond Jewellery - Varaha Jewels"
        : `Buy Women's ${filterConfig?.title} Online | Gold & Diamond ${filterConfig?.title} - Varaha Jewels`;

    const metaDescription = isAllWomen
        ? "Explore our exquisite collection of women's jewellery. Shop certified gold, diamond, kundan, and bridal jewelry online with authentic craftsmanship."
        : `Shop stunning Women's ${filterConfig?.title} at Varaha Jewels. Discover certified gold, diamond, and designer ${filterConfig?.title?.toLowerCase()} with authentic craftsmanship and lifetime warranty.`;

    // Fetch products
    useEffect(() => {
        if (!router.isReady) return;
        fetchProducts();
    }, [router.isReady, currentSlug]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/products`, { headers: getAuthHeaders() });
            if (res.ok) {
                let data = await res.json();

                // Filter by gender = Women
                data = data.filter(p => p.gender === 'Women');

                // Hide out-of-stock products
                data = data.filter(p => p.stock !== 0);

                // Apply additional filter based on category/collection
                if (filterConfig) {
                    if (filterConfig.type === 'category') {
                        data = data.filter(p =>
                            p.category?.toLowerCase().includes(filterConfig.category.toLowerCase())
                        );
                    } else if (filterConfig.type === 'collection') {
                        data = data.filter(p =>
                            p.collection?.toLowerCase() === filterConfig.collection.toLowerCase()
                        );
                    }
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

    const handleAddToCart = (product) => {
        const variant = {
            sku: `${product.id}-default`,
            price: product.price,
            name: "Standard",
            image: product.image
        };
        addToCart(product, variant, 1);
    };

    // Breadcrumb data
    const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: 'Women', href: '/women' },
    ];
    if (filterConfig) {
        if (filterConfig.type === 'collection') {
            breadcrumbs.push({ name: 'Shop by Look', href: null });
        } else {
            breadcrumbs.push({ name: 'Shop by Category', href: null });
        }
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
                <link rel="canonical" href={`https://www.varahajewels.in/women${currentSlug ? `/${currentSlug}` : ''}`} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "CollectionPage",
                            "name": pageTitle,
                            "description": metaDescription,
                            "url": `https://www.varahajewels.in/women${currentSlug ? `/${currentSlug}` : ''}`,
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
                            {isAllWomen
                                ? "Explore our stunning collection of women's jewellery crafted with love and heritage."
                                : `Discover our beautiful collection of ${filterConfig?.title?.toLowerCase()} designed for the modern woman.`
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
                                href="/women"
                                className="inline-block px-6 py-3 bg-copper text-warm-sand font-semibold rounded-sm hover:bg-heritage transition-all"
                            >
                                Browse All Women's
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
