import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import MarketCard from '../../../components/MarketCard';
import { collapseColours } from '../../../lib/products';
import { getApiUrl, getAuthHeaders } from '../../../lib/config';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

export default function CategoryPage() {
    const router = useRouter();
    const { gender, category } = router.query;
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [wishlist, setWishlist] = useState([]);
    const { addToCart } = useCart();

    useEffect(() => {
        if (gender && category) {
            fetchProducts();
        }
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            setWishlist(JSON.parse(savedWishlist));
        }
    }, [gender, category]);

    const fetchProducts = async () => {
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/products`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                // Filter by gender and category
                const filtered = data.filter(p => {
                    const matchesGender = p.gender === (gender.charAt(0).toUpperCase() + gender.slice(1));
                    const matchesCategory = p.category?.toLowerCase() === category.toLowerCase().replace('-', ' ');
                    return matchesGender && matchesCategory;
                });
                setProducts(collapseColours(filtered));
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setIsLoading(false);
        }
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
        if (product.stock !== undefined && product.stock <= 0) return;
        const variant = {
            sku: `${product.id}-default`,
            price: product.price,
            name: "Standard",
            image: product.image
        };
        addToCart(product, variant, 1);
    };

    const isInWishlist = (productId) => wishlist.some(item => item.id === productId);

    const categoryName = category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
    const genderName = gender?.charAt(0).toUpperCase() + gender?.slice(1) || '';

    return (
        <>
            <Head>
                <title>{categoryName} - {genderName} | Varaha Jewels™</title>
                <meta name="description" content={`Browse our ${categoryName} collection for ${genderName}`} />
            </Head>
            <Header />
            <main className="min-h-screen bg-warm-sand pt-24 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Back Button */}
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 text-heritage hover:text-copper mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to Shop
                    </Link>

                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-royal font-bold text-heritage mb-2">
                            {categoryName}
                        </h1>
                        <p className="text-heritage/70">{genderName}'s Collection</p>
                    </div>

                    {/* Products Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse"></div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20">
                            <h3 className="text-2xl font-royal font-bold text-heritage mb-2">No products found</h3>
                            <p className="text-heritage/70 mb-6">No products in this category yet.</p>
                            <Link
                                href="/shop"
                                className="inline-block px-6 py-3 bg-copper text-white rounded-sm hover:bg-heritage transition-colors"
                            >
                                Browse All Products
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-heritage/70 mb-6">{products.length} products found</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10">
                                {products.map((product) => (
                                    <MarketCard key={product.id} product={product} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
