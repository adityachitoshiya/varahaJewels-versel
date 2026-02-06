import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
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
                setProducts(filtered);
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
        const variant = {
            sku: product.id,
            price: product.price,
            name: product.name,
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="group bg-white border border-copper/20 rounded-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-square overflow-hidden">
                                            <Link href={`/product/${product.id}`}>
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    width={400}
                                                    height={400}
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
                                            <Link href={`/product/${product.id}`}>
                                                <h3 className="text-sm md:text-base font-royal font-bold text-heritage mb-1 line-clamp-2 group-hover:text-copper transition-colors">
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
