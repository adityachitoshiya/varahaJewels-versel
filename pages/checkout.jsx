import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ShoppingBag, ArrowLeft, Lock, CreditCard, Truck, Check } from 'lucide-react';

export default function Checkout() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Customer details
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [discount, setDiscount] = useState(0);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'

  // COD Confirmation Modal state
  const [showCODConfirmation, setShowCODConfirmation] = useState(false);

  // Cart items state
  const [cartItems, setCartItems] = useState([]);
  
  // Product details from URL params (for direct checkout from product page)
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Check if coming from cart or direct product checkout
    const { productId, variantId, quantity, amount, productName, fromCart } = router.query;
    
    if (fromCart === 'true') {
      // Load cart items from localStorage
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const items = JSON.parse(savedCart);
          setCartItems(items);
        } catch (e) {
          console.error('Failed to parse cart:', e);
        }
      }
    } else if (productId && variantId && quantity && amount) {
      // Direct checkout from product page
      setOrderDetails({
        productId,
        variantId,
        quantity: parseInt(quantity),
        amount: parseFloat(amount),
        productName: productName || 'Product'
      });
    }
  }, [router.query]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fetch city and state when pincode is entered (6 digits)
    if (name === 'pincode' && value.length === 6) {
      fetchPincodeDetails(value);
    }
  };

  // Fetch city and state from pincode
  const fetchPincodeDetails = async (pincode) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setFormData(prev => ({
          ...prev,
          city: postOffice.District,
          state: postOffice.State
        }));
      }
    } catch (error) {
      console.error('Error fetching pincode details:', error);
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    
    if (couponCode.trim().toUpperCase() === 'TESTADI') {
      setAppliedCoupon('TESTADI');
      setDiscount(1); // 100% discount - make it ₹1
      setCouponError('');
    } else if (couponCode.trim() === '') {
      setCouponError('Please enter a coupon code');
    } else {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
      setDiscount(0);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  // Handle COD Order Confirmation
  const handleCODConfirmation = async () => {
    setShowCODConfirmation(false);
    setIsLoading(true);

    try {
      // Prepare order data based on cart or single product
      const orderData = cartItems.length > 0 
        ? {
            items: cartItems.map(item => ({
              productId: item.productId || item.id,
              productName: item.productName || item.name,
              variantId: item.variant.id,
              variantName: item.variant.name,
              quantity: item.quantity,
              price: item.variant.price,
            })),
            amount: Math.round(finalAmount),
            name: formData.name,
            email: formData.email,
            contact: formData.contact,
            address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
            couponCode: appliedCoupon || '',
            discount: discount * 100,
            paymentMethod: paymentMethod,
            codCharges: paymentMethod === 'cod' ? COD_CHARGE : 0,
            isCartCheckout: true,
          }
        : {
            productId: orderDetails.productId,
            variantId: orderDetails.variantId,
            quantity: orderDetails.quantity,
            amount: Math.round(finalAmount),
            name: formData.name,
            email: formData.email,
            contact: formData.contact,
            address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
            couponCode: appliedCoupon || '',
            discount: discount * 100,
            paymentMethod: paymentMethod,
            codCharges: paymentMethod === 'cod' ? COD_CHARGE : 0,
          };

      const response = await fetch('/api/create-cod-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Use the order ID from API response
      const orderId = data.orderId || `ORD-${Date.now()}`;

      // Clear cart if it was a cart checkout
      if (cartItems.length > 0) {
        localStorage.removeItem('cart');
      }

      // Redirect directly to payment success page (COD confirmed)
      router.push({
        pathname: '/payment-success',
        query: {
          orderId: orderId,
          amount: Math.round(finalAmount),
          paymentId: `COD-${Date.now()}`,
          productName: cartItems.length > 0 
            ? `${cartItems.length} items` 
            : orderDetails.productName,
          quantity: cartItems.length > 0 
            ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
            : orderDetails.quantity,
          email: formData.email,
          name: formData.name,
          codMode: 'true'
        }
      });
    } catch (err) {
      console.error('COD order error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  // Calculate total amount based on cart or single product
  const calculateTotal = () => {
    if (cartItems.length > 0) {
      return cartItems.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
    } else if (orderDetails) {
      return orderDetails.amount;
    }
    return 0;
  };

  const totalAmount = calculateTotal();
  const COD_CHARGE = 59; // Cash on delivery charges

  // Calculate discounted amount - TESTADI makes it ₹1
  const discountAmount = appliedCoupon === 'TESTADI' 
    ? totalAmount - 1 
    : totalAmount * discount;
  
  // Calculate final amount with COD charges if applicable
  let finalAmount = appliedCoupon === 'TESTADI' 
    ? 1 
    : totalAmount - discountAmount;
  
  // Add COD charges if COD payment method is selected
  if (paymentMethod === 'cod') {
    finalAmount += COD_CHARGE;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (!formData.name || !formData.email || !formData.contact || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      setError('Please fill all required fields');
      setIsLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.contact)) {
      setError('Please enter a valid 10-digit mobile number');
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      setIsLoading(false);
      return;
    }

    // TESTADI Code - Skip payment, go directly to success page
    if (appliedCoupon === 'TESTADI') {
      try {
        // Prepare order data based on cart or single product
        const orderData = cartItems.length > 0 
          ? {
              items: cartItems.map(item => ({
                productId: item.productId || item.id,
                productName: item.productName || item.name,
                variantId: item.variant.id,
                variantName: item.variant.name,
                quantity: item.quantity,
                price: item.variant.price,
              })),
              amount: Math.round(finalAmount),
              name: formData.name,
              email: formData.email,
              contact: formData.contact,
              address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
              couponCode: appliedCoupon || '',
              discount: discount * 100,
              paymentMethod: paymentMethod,
              codCharges: paymentMethod === 'cod' ? COD_CHARGE : 0,
              isCartCheckout: true,
            }
          : {
              productId: orderDetails.productId,
              variantId: orderDetails.variantId,
              quantity: orderDetails.quantity,
              amount: Math.round(finalAmount),
              name: formData.name,
              email: formData.email,
              contact: formData.contact,
              address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
              couponCode: appliedCoupon || '',
              discount: discount * 100,
              paymentMethod: paymentMethod,
              codCharges: paymentMethod === 'cod' ? COD_CHARGE : 0,
            };

        // Create order in database
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create order');
        }

        // Use the order ID from API response
        const orderId = data.orderId || `ORD-${Date.now()}`;

        // Clear cart if it was a cart checkout
        if (cartItems.length > 0) {
          localStorage.removeItem('cart');
        }

        // Redirect directly to payment success page (skip Razorpay)
        router.push({
          pathname: '/payment-success',
          query: {
            orderId: orderId,
            amount: Math.round(finalAmount),
            paymentId: `TEST-${Date.now()}`,
            productName: cartItems.length > 0 
              ? `${cartItems.length} items` 
              : orderDetails.productName,
            quantity: cartItems.length > 0 
              ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
              : orderDetails.quantity,
            email: formData.email,
            name: formData.name,
            testMode: 'true'
          }
        });
        
        return;
      } catch (err) {
        console.error('Test order error:', err);
        setError(err.message || 'Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // Normal payment flow (non-TESTADI)
    try {
      // Prepare order data based on cart or single product
      const orderData = cartItems.length > 0 
        ? {
            items: cartItems.map(item => ({
              productId: item.productId || item.id,
              productName: item.productName || item.name,
              variantId: item.variant.id,
              variantName: item.variant.name,
              quantity: item.quantity,
              price: item.variant.price,
            })),
            amount: Math.round(finalAmount),
            name: formData.name,
            email: formData.email,
            contact: formData.contact,
            address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
            couponCode: appliedCoupon || '',
            discount: discount * 100,
            paymentMethod: paymentMethod,
            codCharges: paymentMethod === 'cod' ? COD_CHARGE : 0,
            isCartCheckout: true,
          }
        : {
            productId: orderDetails.productId,
            variantId: orderDetails.variantId,
            quantity: orderDetails.quantity,
            amount: Math.round(finalAmount),
            name: formData.name,
            email: formData.email,
            contact: formData.contact,
            address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
            couponCode: appliedCoupon || '',
            discount: discount * 100,
            paymentMethod: paymentMethod,
            codCharges: paymentMethod === 'cod' ? COD_CHARGE : 0,
          };

      // Cash on Delivery - Show confirmation modal first
      if (paymentMethod === 'cod') {
        setShowCODConfirmation(true);
        setIsLoading(false);
        return;
      }

      // Online Payment - Use Razorpay
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Clear cart if it was a cart checkout
      if (cartItems.length > 0) {
        localStorage.removeItem('cart');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (!orderDetails) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-warm-sand flex items-center justify-center px-4">
          <div className="text-center">
            <ShoppingBag className="mx-auto mb-4 text-heritage" size={64} />
            <h1 className="text-3xl font-royal font-bold text-heritage mb-4">No items to checkout</h1>
            <p className="text-heritage/70 mb-8">Please add items to your cart first.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-copper text-warm-sand font-medium rounded-sm hover:bg-heritage transition-all duration-300"
            >
              <ArrowLeft size={20} />
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - Varaha Jewels</title>
        <meta name="description" content="Complete your purchase" />
      </Head>

      <Header />

      <main className="min-h-screen bg-warm-sand py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/product/sample-product"
              className="inline-flex items-center gap-2 text-heritage hover:text-copper transition-colors mb-6"
            >
              <ArrowLeft size={20} />
              Back to Product
            </Link>
            <h1 className="text-4xl md:text-5xl font-royal font-bold text-heritage mb-4">Checkout</h1>
            <div className="w-20 h-px bg-copper"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left - Customer Details Form */}
            <div className="bg-white border border-copper/30 rounded-sm p-8">
              <h2 className="text-2xl font-royal font-bold text-heritage mb-6">Customer Details</h2>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-heritage mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-heritage mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Contact */}
                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-heritage mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    required
                    value={formData.contact}
                    onChange={handleInputChange}
                    maxLength="10"
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-3 border border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all"
                    placeholder="10-digit mobile number"
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-heritage mb-2">
                    Street Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all resize-none"
                    placeholder="House no., Building name, Street"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-heritage mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-heritage mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all"
                      placeholder="State"
                    />
                  </div>
                </div>

                {/* Pincode */}
                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-heritage mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleInputChange}
                    maxLength="6"
                    pattern="[0-9]{6}"
                    className="w-full px-4 py-3 border border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all"
                    placeholder="6-digit pincode"
                  />
                </div>

                {/* Payment Method Selection */}
                <div className="border border-copper/30 rounded-sm p-6">
                  <h3 className="text-lg font-royal font-bold text-heritage mb-4">Payment Method</h3>
                  
                  <div className="space-y-4">
                    {/* Online Payment Option */}
                    <label className={`flex items-start gap-4 p-4 border-2 rounded-sm cursor-pointer transition-all ${
                      paymentMethod === 'online' 
                        ? 'border-copper bg-copper/5' 
                        : 'border-copper/20 hover:border-copper/40'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-1 w-4 h-4 text-copper focus:ring-copper"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard size={20} className="text-copper" />
                          <span className="font-semibold text-heritage">Pay Online</span>
                        </div>
                        <p className="text-sm text-heritage/70 mb-2">
                          UPI, Credit/Debit Card, Net Banking
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-sm">
                            <Check size={12} />
                            Free Shipping
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-sm">
                            <Check size={12} />
                            Extra Discount
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-sm">
                            <Check size={12} />
                            Faster Processing
                          </span>
                        </div>
                      </div>
                    </label>

                    {/* Cash on Delivery Option */}
                    <label className={`flex items-start gap-4 p-4 border-2 rounded-sm cursor-pointer transition-all ${
                      paymentMethod === 'cod' 
                        ? 'border-copper bg-copper/5' 
                        : 'border-copper/20 hover:border-copper/40'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-1 w-4 h-4 text-copper focus:ring-copper"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck size={20} className="text-copper" />
                          <span className="font-semibold text-heritage">Cash on Delivery</span>
                        </div>
                        <p className="text-sm text-heritage/70 mb-2">
                          Pay when you receive the product
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-sm font-medium">
                            +₹{COD_CHARGE} COD Charges
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-8 py-4 bg-copper text-warm-sand font-semibold rounded-sm hover:bg-heritage transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-warm-sand border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      Proceed to Payment
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-heritage/60 mt-4">
                  Your payment details are secure and encrypted
                </p>
              </form>
            </div>

            {/* Right - Order Summary */}
            <div className="bg-white border border-copper/30 rounded-sm p-8 h-fit sticky top-24">
              <h2 className="text-2xl font-royal font-bold text-heritage mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 pb-6 border-b border-copper/30">
                {cartItems.length > 0 ? (
                  // Show cart items
                  <>
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-start py-2">
                        <div className="flex-1">
                          <p className="font-semibold text-heritage text-sm">{item.productName || item.name}</p>
                          <p className="text-xs text-heritage/60">{item.variant.name}</p>
                          <p className="text-xs text-heritage/60">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-heritage ml-4">
                          ₹{(item.variant.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-4">
                      <span className="text-heritage/70">Subtotal</span>
                      <span className="font-semibold text-heritage">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : orderDetails ? (
                  // Show single product
                  <>
                    <div className="flex justify-between">
                      <span className="text-heritage/70">Product</span>
                      <span className="font-semibold text-heritage">{orderDetails.productName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-heritage/70">Quantity</span>
                      <span className="font-semibold text-heritage">{orderDetails.quantity}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-heritage/70">Subtotal</span>
                      <span className="font-semibold text-heritage">₹{orderDetails.amount.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Coupon Section */}
              <div className="mb-6 pb-6 border-b border-copper/30">
                {!appliedCoupon ? (
                  <div>
                    <label className="block text-sm font-medium text-heritage mb-2">
                      Have a Coupon Code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 px-4 py-2 border border-copper/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-copper text-warm-sand font-medium rounded-sm hover:bg-heritage transition-all duration-300 text-sm whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-500 text-xs mt-2">{couponError}</p>
                    )}
                    <p className="text-xs text-heritage/50 mt-2">Try code: TESTADI</p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-sm p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Coupon Applied! 🎉</p>
                        <p className="text-xs text-green-600 mt-1">Code: {appliedCoupon} - Final Price ₹1</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-copper/30">
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Discount ({appliedCoupon})</span>
                    <span className="text-green-600 font-medium">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-heritage/70">Shipping</span>
                  <span className="text-green-600 font-medium">
                    {paymentMethod === 'online' ? 'FREE' : 'FREE'}
                  </span>
                </div>

                {/* COD Charges */}
                {paymentMethod === 'cod' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-heritage/70">COD Charges</span>
                    <span className="text-orange-600 font-medium">+₹{COD_CHARGE}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-heritage/70">Tax (Incl.)</span>
                  <span className="text-heritage">Included</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-royal font-bold text-heritage">Total</span>
                <div className="text-right">
                  {appliedCoupon && (
                    <div className="text-sm text-heritage/50 line-through mb-1">
                      ₹{orderDetails.amount.toLocaleString('en-IN')}
                    </div>
                  )}
                  <span className="text-3xl font-royal font-bold text-copper">₹{Math.round(finalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-copper/30">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-copper/10 rounded-full flex items-center justify-center">
                    <span className="text-copper font-bold text-lg">✓</span>
                  </div>
                  <p className="text-xs text-heritage/70">Secure Payment</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-copper/10 rounded-full flex items-center justify-center">
                    <span className="text-copper font-bold text-lg">BIS</span>
                  </div>
                  <p className="text-xs text-heritage/70">Hallmarked</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-copper/10 rounded-full flex items-center justify-center">
                    <span className="text-copper font-bold text-lg">30</span>
                  </div>
                  <p className="text-xs text-heritage/70">Day Returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* COD Confirmation Modal */}
      {showCODConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-copper/10 mb-4">
                <svg className="h-8 w-8 text-copper" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-heritage mb-2">Confirm COD Order</h3>
              <p className="text-sm text-heritage/70 mb-4">
                Are you sure you want to process this Cash on Delivery order?
              </p>
            </div>

            <div className="bg-gradient-to-r from-heritage/5 via-copper/5 to-heritage/5 rounded-sm p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-heritage/70">Order Amount:</span>
                <span className="text-lg font-bold text-copper">₹{finalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-heritage/60">
                <span>Payment Method:</span>
                <span className="font-medium">Cash on Delivery</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCODConfirmation(false);
                  setIsLoading(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-heritage font-medium rounded-sm hover:bg-gray-200 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCODConfirmation}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-heritage via-copper to-heritage text-warm-sand font-medium rounded-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
