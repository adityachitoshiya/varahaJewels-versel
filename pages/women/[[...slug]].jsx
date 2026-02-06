import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getApiUrl, getAuthHeaders } from '../../lib/config';
import { ChevronRight, Heart, ShoppingBag, Grid, List, SlidersHorizontal, Search, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import ProductSkeleton from '../../components/ProductSkeleton';

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
    const [wishlist, setWishlist] = useState([]);
    const { addToCart } = useCart();

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

                // Filter by gender = Women
                data = data.filter(p => p.gender === 'Women');

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

                setProducts(data);
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
            sku: product.id,
            price: product.price,
            name: product.name,
            image: product.image
        };
        addToCart(product, variant, 1);
    };

    const isInWishlist = (productId) => wishlist.some(item => item.id === productId);

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
                        <div className={viewMode === 'grid'
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                            : 'space-y-6'
                        }>
                            {sortedProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className={`group bg-white border border-copper/30 rounded-sm overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col ${viewMode === 'list' ? 'sm:flex-row' : 'h-full'}`}
                                >
                                    {/* Product Image */}
                                    <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 h-48 sm:h-auto flex-shrink-0' : 'aspect-square'}`}>
                                        <Link href={`/product/${product.id}`} className="block h-full cursor-pointer">
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                width={400}
                                                height={400}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => { e.target.srcset = ''; e.target.src = '/varaha-assets/logo.png'; }}
                                            />
                                        </Link>
                                        {product.tag && (
                                            <span className="absolute top-3 left-3 px-3 py-1 bg-copper text-warm-sand text-xs font-bold rounded-full">
                                                {product.tag}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => toggleWishlist(product.id, product.name)}
                                            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors z-10"
                                        >
                                            <Heart
                                                size={20}
                                                className={isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-heritage'}
                                            />
                                        </button>
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-4 flex flex-col flex-1">
                                        <Link href={`/product/${product.id}`}>
                                            <h3 className="text-lg font-royal font-bold text-heritage mb-1 line-clamp-2 hover:text-copper transition-colors">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-heritage/60 mb-2">{product.category} • {product.metal}</p>
                                        <div className="mt-auto">
                                            {product.price ? (
                                                <p className="text-xl font-bold text-heritage mb-3">
                                                    ₹{product.price.toLocaleString('en-IN')}
                                                </p>
                                            ) : (
                                                <p className="text-lg font-semibold text-copper mb-3">Price on Request</p>
                                            )}
                                            {product.price ? (
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    className="w-full px-4 py-2.5 bg-heritage text-warm-sand font-semibold rounded-sm hover:bg-copper transition-all flex items-center justify-center gap-2"
                                                >
                                                    Add to Cart <ShoppingBag size={16} />
                                                </button>
                                            ) : (
                                                <Link
                                                    href={`/product/${product.id}`}
                                                    className="block w-full px-4 py-2.5 bg-copper text-warm-sand font-semibold rounded-sm hover:bg-heritage transition-all text-center"
                                                >
                                                    View Details
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
