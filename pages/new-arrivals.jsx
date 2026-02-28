import { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/config';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Search, SlidersHorizontal, Grid, List, Heart, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function NewArrivals({ initialProducts = [] }) {
    // Initialize products with SSG data
    const [products, setProducts] = useState(initialProducts);
    const [isLoading, setIsLoading] = useState(false); // No loading state needed initially
    const [filteredProducts, setFilteredProducts] = useState(initialProducts);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Filter states - Initialize 'New' tag as selected by default
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedMetals, setSelectedMetals] = useState([]);
    const [selectedStyles, setSelectedStyles] = useState([]);
    // Default to 'New' tag, but if user didn't tag products as 'New', they might disappear.
    // Changing default to empty to show ALL new arrivals (sorted by date)
    const [selectedTags, setSelectedTags] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 5000000]); // Increased range
    const [sortBy, setSortBy] = useState('featured');

    // Wishlist state
    const [wishlist, setWishlist] = useState([]);

    // Cart Hook
    const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();

    // Track loading state per product to block multiple clicks
    const [addingToCart, setAddingToCart] = useState({});

    useEffect(() => {
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            setWishlist(JSON.parse(savedWishlist));
        }
        // Client-side refresh (optional: could be removed if ISR is enough)
        // refreshProducts(); 
    }, []);

    // Derived unique values for filters
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
                // Sort by ID (descending) correctly assuming id contains timestamp (prod-timestamp)
                // Newer items have higher timestamps
                filtered.sort((a, b) => {
                    const idA = String(a.id).replace(/\D/g, ''); // Extract numbers
                    const idB = String(b.id).replace(/\D/g, '');
                    return (Number(idB) || 0) - (Number(idA) || 0);
                });
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
        // Reset to default state
        setSelectedCategories([]);
        setSelectedMetals([]);
        setSelectedStyles([]);
        // Decide: clear tags fully or keep 'New'? User might want to see EVERYTHING.
        // Let's clear tags fully on reset to allow seeing everything.
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

    const handleAddToCart = async (product) => {
        if (product.stock !== undefined && product.stock <= 0) return;
        if (addingToCart[product.id]) return; // Block multiple clicks

        setAddingToCart(prev => ({ ...prev, [product.id]: true }));
        const variant = {
            sku: `${product.id}-default`,
            price: product.price,
            name: "Standard",
            image: product.image
        };
        await addToCart(product, variant, 1);
        // Keep loading for a short time for visual feedback
        setTimeout(() => {
            setAddingToCart(prev => ({ ...prev, [product.id]: false }));
        }, 600);
    };

    // Get cart item for a product (to show qty selector)
    const getCartItem = (productId) => {
        return cartItems.find(item => item.variant?.sku === productId || item.productId === productId || item.product_id === productId);
    };

    // Render Add to Cart button or Quantity Selector
    const renderCartButton = (product) => {
        const cartItem = getCartItem(product.id);
        const isAdding = addingToCart[product.id];
        const isOutOfStock = product.stock !== undefined && product.stock <= 0;

        if (!product.price) {
            return (
                <Link href={`/product/${product.slug || product.id}`} className="mt-auto w-full px-6 py-3 bg-copper text-warm-sand font-semibold rounded-sm flex items-center justify-center gap-2 hover:bg-heritage transition-all group-hover:shadow-md">
                    View Details <ShoppingBag size={18} />
                </Link>
            );
        }

        if (isOutOfStock) {
            return (
                <button disabled className="mt-auto w-full px-6 py-3 font-semibold rounded-sm flex items-center justify-center gap-2 bg-gray-300 text-gray-500 cursor-not-allowed">
                    Out of Stock <ShoppingBag size={18} />
                </button>
            );
        }

        if (cartItem && cartItem.quantity > 0) {
            return (
                <div className="mt-auto w-full flex items-center rounded-sm overflow-hidden border-2 border-heritage">
                    <button
                        onClick={() => {
                            if (cartItem.quantity <= 1) {
                                removeFromCart(cartItem.id, cartItem.variant?.sku);
                            } else {
                                updateQuantity(cartItem.variant?.sku, cartItem.quantity - 1, cartItem.id);
                            }
                        }}
                        className="px-4 py-3 bg-heritage text-warm-sand hover:bg-copper transition-colors flex items-center justify-center"
                    >
                        <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center font-bold text-heritage text-lg">
                        {cartItem.quantity}
                    </span>
                    <button
                        onClick={() => {
                            updateQuantity(cartItem.variant?.sku, cartItem.quantity + 1, cartItem.id);
                        }}
                        className="px-4 py-3 bg-heritage text-warm-sand hover:bg-copper transition-colors flex items-center justify-center"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            );
        }

        return (
            <button
                onClick={() => handleAddToCart(product)}
                disabled={isAdding}
                className={`mt-auto w-full px-6 py-3 font-semibold rounded-sm flex items-center justify-center gap-2 transition-all group-hover:shadow-md ${isAdding ? 'bg-copper/70 text-warm-sand cursor-wait' : 'bg-heritage text-warm-sand hover:bg-copper'}`}
            >
                {isAdding ? (
                    <><span className="animate-spin rounded-full h-4 w-4 border-2 border-warm-sand border-t-transparent"></span> Adding...</>
                ) : (
                    <>Add to Cart <ShoppingBag size={18} /></>
                )}
            </button>
        );
    };

    const isInWishlist = (productId) => wishlist.some(item => item.id === productId);

    const activeFiltersCount =
        selectedCategories.length +
        selectedMetals.length +
        selectedStyles.length +
        selectedTags.length +
        (priceRange[0] !== 0 || priceRange[1] !== 5000000 ? 1 : 0);

    return (
        <>
            <Head>
                <title>New Arrivals - Varaha Jewels™ | Latest Collections</title>
                <meta name="description" content="Discover the latest additions to the Varaha Jewels collection. Fresh designs, contemporary styles, and timeless classics." />
            </Head>

            <Header />

            <main className="min-h-screen bg-warm-sand py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-royal font-bold text-heritage mb-4">New Arrivals</h1>
                        <p className="text-heritage/70 max-w-2xl">
                            Be the first to explore our latest masterpieces. Fresh from our artisans to you.
                        </p>
                        <div className="w-20 h-px bg-copper mt-4"></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-heritage/40" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search latest jewelry..."
                                className="w-full pl-12 pr-4 py-3 border-2 border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all"
                            />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="sm:hidden px-6 py-3 bg-copper text-warm-sand font-semibold rounded-sm flex items-center justify-center gap-2"
                        >
                            <SlidersHorizontal size={20} />
                            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                        </button>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 border-2 border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper transition-all font-medium text-heritage cursor-pointer"
                        >
                            <option value="featured">Newest First</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="name">Name: A to Z</option>
                        </select>

                        <div className="hidden sm:flex border-2 border-copper/30 rounded-sm overflow-hidden">
                            <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-copper text-warm-sand' : 'text-heritage hover:bg-copper/10'}`}>
                                <Grid size={20} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-copper text-warm-sand' : 'text-heritage hover:bg-copper/10'}`}>
                                <List size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filters Sidebar */}
                        <aside className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                            <div className="bg-white border border-copper/30 rounded-sm p-6 sticky top-24">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-royal font-bold text-heritage flex items-center gap-2">
                                        <SlidersHorizontal size={20} className="text-copper" />
                                        Filters
                                    </h2>
                                    <button onClick={clearAllFilters} className="text-sm text-copper hover:text-heritage font-medium">Reset</button>
                                </div>

                                <div className="space-y-6">
                                    {tags.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-heritage mb-3">Tags</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleFilter(selectedTags, setSelectedTags, tag)}
                                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${selectedTags.includes(tag) ? 'bg-copper text-warm-sand' : 'bg-copper/10 text-copper hover:bg-copper/20'}`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-copper/20">
                                        <h3 className="font-semibold text-heritage mb-3">Category</h3>
                                        <div className="space-y-2">
                                            {categories.map(category => (
                                                <label key={category} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(category)}
                                                        onChange={() => toggleFilter(selectedCategories, setSelectedCategories, category)}
                                                        className="w-4 h-4 text-copper focus:ring-copper rounded"
                                                    />
                                                    <span className="text-sm text-heritage/70 group-hover:text-heritage transition-colors">{category}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1">
                            <div className="mb-6 flex justify-between items-center">
                                <p className="text-heritage/70">
                                    Showing <span className="font-semibold text-heritage">{filteredProducts.length}</span> new arrivals
                                </p>
                                {isLoading && <span className="text-copper animate-pulse">Loading updates...</span>}
                            </div>

                            {filteredProducts.length === 0 && !isLoading ? (
                                <div className="bg-white border border-copper/30 rounded-sm p-12 text-center">
                                    <h3 className="text-2xl font-royal font-bold text-heritage mb-2">No products found</h3>
                                    <p className="text-heritage/60 mb-6">Try adjusting your filters to see more results.</p>
                                    <button onClick={clearAllFilters} className="px-6 py-3 bg-copper text-warm-sand font-semibold rounded-sm">Clear All Filters</button>
                                </div>
                            ) : (
                                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
                                    {filteredProducts.map((product) => (
                                        <div key={product.id} className={`group bg-white border border-copper/30 rounded-sm overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col ${viewMode === 'list' ? 'sm:flex-row' : 'h-full'}`}>
                                            <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 h-48 sm:h-auto flex-shrink-0' : 'aspect-square'}`}>
                                                <Link href={`/product/${product.slug || product.id}`} className="block h-full cursor-pointer">
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        width={400}
                                                        height={400}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        onError={(e) => { e.target.srcset = ''; e.target.src = '/varaha-assets/logo.png'; }}
                                                    />
                                                </Link>
                                                {product.tag && <span className="absolute top-3 left-3 px-3 py-1 bg-copper text-warm-sand text-xs font-bold rounded-full">{product.tag}</span>}
                                                <button onClick={() => toggleWishlist(product.id, product.name)} className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors z-10">
                                                    <Heart size={20} className={isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-heritage'} />
                                                </button>
                                                {product.stock !== undefined && product.stock <= 0 && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[5]">
                                                        <span className="bg-red-600 text-white px-4 py-2 text-sm font-bold rounded-full">Out of Stock</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex-grow">
                                                    <Link href={`/product/${product.slug || product.id}`} className="block group-hover:text-copper transition-colors">
                                                        <h3 className="text-lg font-royal font-bold text-heritage mb-1 line-clamp-2">{product.name}</h3>
                                                    </Link>
                                                    <p className="text-sm text-heritage/60">{product.category} • {product.metal}</p>
                                                    <div className="mt-4 mb-4">
                                                        {product.price ? <p className="text-2xl font-bold text-heritage">₹{product.price.toLocaleString('en-IN')}</p> : <p className="text-lg font-semibold text-copper">Price on Request</p>}
                                                    </div>
                                                </div>
                                                {renderCartButton(product)}

                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

export async function getStaticProps() {
    try {
        const API_URL = getApiUrl();
        // Fetch all products (sorted by newest by default via logic or just fetch all and let client sort)
        // Ideally we pass ?sort=newest from backend
        const res = await fetch(`${API_URL}/api/products?sort=newest`);

        let initialProducts = [];
        if (res.ok) {
            initialProducts = await res.json();
        } else {
            console.error("Failed to fetch matching products");
        }

        return {
            props: {
                initialProducts,
            },
            revalidate: 60, // ISR: Revalidate every 60 seconds
        };
    } catch (error) {
        console.error("SSG Error:", error);
        return {
            props: { initialProducts: [] },
            revalidate: 10,
        };
    }
}
