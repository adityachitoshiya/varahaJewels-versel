import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl, getAuthHeaders } from '../../lib/config';
import { useCart } from '../../context/CartContext';
import Head from 'next/head';
import Header from '../../components/Header';
import ProductCarousel from '../../components/ProductCarousel';
import ProductInfo from '../../components/ProductInfo';
import StickyBuyBar from '../../components/StickyBuyBar';
import AddToCartModal from '../../components/AddToCartModal';
import ReviewsSection from '../../components/ReviewsSection';
import Footer from '../../components/Footer';
import ProductDetailSkeleton from '../../components/ProductDetailSkeleton';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const suggestionsRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  const { addToCart, updateQuantity, removeFromCart, cartItems } = useCart();
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
    fetchSettings();
  }, [id]);

  const fetchSettings = async () => {
    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/settings`);
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  // Fetch similar products by category
  const fetchSimilarProducts = async (category, currentProductId) => {
    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/products?category=${encodeURIComponent(category)}`);
      if (res.ok) {
        const products = await res.json();
        // Filter out current product and limit to 8
        const filtered = products.filter(p => p.id !== currentProductId).slice(0, 8);
        setSuggestedProducts(filtered);
      }
    } catch (e) {
      console.error('Error fetching similar products:', e);
    }
  };

  // Scroll to suggestions section
  const scrollToSuggestions = () => {
    if (suggestionsRef.current) {
      suggestionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fetchProduct = async (productId) => {
    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/products/${productId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();

        // Parse additional images from JSON string
        let additionalImages = [];
        try {
          additionalImages = data.additional_images ? JSON.parse(data.additional_images) : [];
        } catch (e) {
          console.error("Error parsing additional_images:", e);
          additionalImages = [];
        }

        // Build complete images array: main image first, then additional images
        const allImages = [
          { id: 1, type: 'image', url: data.image, alt: data.name }
        ];

        // Add additional images with sequential IDs
        additionalImages.forEach((imageUrl, index) => {
          if (imageUrl && imageUrl.trim()) {
            allImages.push({
              id: index + 2,
              type: 'image',
              url: imageUrl,
              alt: `${data.name} - Image ${index + 2}`
            });
          }
        });

        const adaptedProduct = {
          id: data.id,
          title: data.name,
          name: data.name,
          description: data.description,
          price: data.price,
          images: allImages,
          category: data.category,
          rating: 4.8,
          reviewCount: 124,
          averageRating: 4.8,

          // Variants
          variants: [
            {
              id: `${data.id}-default`,
              name: "Standard",
              price: data.price,
              sku: `${data.id}-default`,
              inStock: data.stock > 0  // Check real stock
            }
          ],

          // Stock info
          stock: data.stock || 0,

          // Tech specs
          metal: data.metal,
          carat: data.carat,
          polish: data.polish,
          stones: data.stones,

          // Mock Reviews
          reviews: [
            {
              id: 1,
              user: "Priya S.",
              rating: 5,
              comment: "Absolutely stunning piece! The craftsmanship is unmatched.",
              date: "2 days ago"
            },
            {
              id: 2,
              user: "Rahul M.",
              rating: 5,
              comment: "Looks even better in person. Packaging was premium too.",
              date: "1 week ago"
            }
          ],

          recommendations: []
        };

        setProduct(adaptedProduct);

        // Fetch similar products from same category
        if (data.category) {
          fetchSimilarProducts(data.category, data.id);
        }
      } else {
        console.error("Product not found");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total cart count from Context
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Add to Cart Handler
  const handleAddToCart = (variant, quantity) => {
    addToCart(product, variant, quantity);
    setIsCartModalOpen(true);
  };

  // Update Cart Item Quantity
  const handleUpdateQuantity = (sku, newQuantity) => {
    updateQuantity(sku, newQuantity);
  };

  // Remove Cart Item
  const handleRemoveItem = (sku) => {
    removeFromCart(null, sku);
  };

  // Buy Now Handler
  const handleBuyNow = (variant, quantity) => {
    router.push({
      pathname: '/checkout',
      query: {
        productId: product.id,
        variantId: variant.id,
        quantity,
        amount: variant.price * quantity,
        productName: product.name,
        image: product.images[0]?.url,
        description: product.description?.substring(0, 100)
      }
    });
  };

  // Checkout from Cart
  const handleCheckoutFromCart = async () => {
    router.push('/checkout?fromCart=true');
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-warm-sand flex items-center justify-center">
        <div className="text-center">
          <p className="text-heritage text-xl mb-4">Product not found.</p>
          <button
            onClick={() => router.push('/shop')}
            className="px-6 py-2 bg-copper text-white rounded-md hover:bg-heritage transition"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Buy {product.title} Online | Certified Authentic | Varaha Jewels™</title>
        <meta name="description" content={`Buy ${product.name}. ${product.description ? product.description.substring(0, 120) : ''}... Certified authentic heritage jewelry from Varaha Jewels.`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": product.name,
              "image": product.images?.map(img => img.url) || [],
              "description": product.description,
              "sku": product.variants?.[0]?.sku || product.id,
              "brand": {
                "@type": "Brand",
                "name": "Varaha Jewels"
              },
              "offers": {
                "@type": "Offer",
                "url": `https://www.varahajewels.in/product/${product.id}`,
                "priceCurrency": "INR",
                "price": product.price,
                "availability": product.variants?.[0]?.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "itemCondition": "https://schema.org/NewCondition"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": product.averageRating || "4.8",
                "reviewCount": product.reviewCount || "12"
              }
            })
          }}
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-white">
        {/* Header */}
        <Header cartCount={cartCount} onCartClick={() => setIsCartModalOpen(true)} />

        {/* Main Content - Myntra Style Layout */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Desktop Layout: Image Grid Left, Info Right (Sticky) */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">

              {/* Left Column - Product Images (2x2 Grid) */}
              <div className="lg:col-span-7 xl:col-span-7">
                <ProductCarousel
                  images={product.images}
                  rating={product.averageRating}
                  reviewCount={product.reviewCount}
                  onViewSimilar={scrollToSuggestions}
                />
              </div>

              {/* Right Column - Product Info (Sticky on desktop) */}
              <div className="lg:col-span-5 xl:col-span-5 mt-6 lg:mt-0">
                <div className="lg:sticky lg:top-24">
                  <ProductInfo
                    product={product}
                    settings={settings}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                  />
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <ReviewsSection
                reviews={product.reviews}
                averageRating={product.averageRating}
                reviewCount={product.reviewCount}
              />
            </div>

            {/* Suggested For You Section */}
            {suggestedProducts.length > 0 && (
              <div ref={suggestionsRef} className="mt-12 border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold text-heritage mb-6">Suggested For You</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {suggestedProducts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/product/${item.id}`)}
                      className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
                    >
                      <div className="aspect-square bg-warm-sand overflow-hidden">
                        <img
                          src={item.image || '/varaha-assets/og.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/varaha-assets/og.jpg';
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 group-hover:text-heritage transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-heritage font-bold mt-1">₹{item.price?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Sticky Mobile Buy Bar */}
        <StickyBuyBar
          variant={product.variants[0]}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />

        {/* Footer */}
        <Footer />

        {/* Cart Modal */}
        <AddToCartModal
          isOpen={isCartModalOpen}
          onClose={() => setIsCartModalOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onContinueShopping={() => setIsCartModalOpen(false)}
          onViewCart={() => setIsCartModalOpen(true)}
          onCheckout={handleCheckoutFromCart}
          product={product}
        />
      </div>
    </>
  );
}
