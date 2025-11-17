import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AnnouncementBar from '../../components/AnnouncementBar';
import Header from '../../components/Header';
import ProductCarousel from '../../components/ProductCarousel';
import ProductInfo from '../../components/ProductInfo';
import StickyBuyBar from '../../components/StickyBuyBar';
import AddToCartModal from '../../components/AddToCartModal';
import ReviewsSection from '../../components/ReviewsSection';
import RecommendedProducts from '../../components/RecommendedProducts';
import Footer from '../../components/Footer';
import { PRODUCT_DATA } from '../../lib/productData';

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  
  // In a real app, fetch product data based on ID
  const product = PRODUCT_DATA;

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Calculate total cart count
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Add to Cart Handler
  const handleAddToCart = (variant, quantity) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.variant.sku === variant.sku
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        // Add new item
        return [...prevItems, { variant, quantity }];
      }
    });

    // Open cart modal
    setIsCartModalOpen(true);
  };

  // Update Cart Item Quantity
  const handleUpdateQuantity = (sku, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(sku);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.variant.sku === sku ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  // Remove Cart Item
  const handleRemoveItem = (sku) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.variant.sku !== sku));
  };

  // Buy Now Handler - Redirect to Checkout Page
  const handleBuyNow = (variant, quantity) => {
    // Redirect to checkout page with product details
    router.push({
      pathname: '/checkout',
      query: {
        productId: product.id,
        variantId: variant.id,
        quantity,
        amount: variant.price * quantity,
        productName: product.name
      }
    });
  };

  // Checkout from Cart
  const handleCheckoutFromCart = async () => {
    if (cartItems.length === 0) return;

    setIsCheckoutLoading(true);
    setCheckoutError(null);

    try {
      // For simplicity, checkout with the first item
      // In a real app, you'd handle multiple items
      const firstItem = cartItems[0];
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: firstItem.variant.id,
          quantity: firstItem.quantity,
          amount: firstItem.variant.price * firstItem.quantity,
          name: "Customer", // You can add a form to collect this
          email: "customer@example.com", // You can add a form to collect this
          contact: "9999999999" // You can add a form to collect this
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.checkoutUrl) {
        // Clear cart and redirect
        setCartItems([]);
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message);
      setIsCheckoutLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{product.title} | Premium Jewelry</title>
        <meta name="description" content={product.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta property="og:title" content={product.title} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.images[0]?.url} />
        <meta property="og:type" content="product" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Announcement Bar */}
        <AnnouncementBar />

        {/* Header */}
        <Header cartCount={cartCount} onCartClick={() => setIsCartModalOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Product Images */}
            <div>
              <ProductCarousel images={product.images} />
            </div>

            {/* Product Info */}
            <div>
              <ProductInfo
                product={product}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            </div>
          </div>

          {/* Reviews */}
          <div className="max-w-5xl mx-auto">
            <ReviewsSection
              reviews={product.reviews}
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
            />
          </div>

          {/* Recommended Products */}
          <div className="max-w-5xl mx-auto">
            <RecommendedProducts products={product.recommendations} />
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

        {/* Checkout Loading Overlay */}
        {isCheckoutLoading && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copper mx-auto mb-4"></div>
              <p className="text-gray-900 font-semibold">Redirecting to checkout...</p>
            </div>
          </div>
        )}

        {/* Checkout Error Toast */}
        {checkoutError && (
          <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md">
            <p className="font-semibold mb-2">Checkout Error</p>
            <p className="text-sm">{checkoutError}</p>
            <button
              onClick={() => setCheckoutError(null)}
              className="mt-3 w-full py-2 bg-white/20 rounded hover:bg-white/30 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </>
  );
}
