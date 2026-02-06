import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Import portal
import { getApiUrl, getAuthHeaders } from '../lib/config';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script'; // Import Script for Razorpay
import Header from '../components/Header';
import Footer from '../components/Footer';
import PaymentLayout from '../components/checkout/PaymentLayout'; // NEW COMPONENT

import { ShoppingBag, ArrowLeft, Lock, CreditCard, Truck, Check, Tag, Phone, CheckCircle, User } from 'lucide-react';
import { useMsg91OTP } from '../hooks/useMsg91OTP';

import { useCart } from '../context/CartContext';

export default function Checkout() {
  const router = useRouter();
  const { cartItems: contextCartItems } = useCart(); // Get items from Context
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false); // Mounted state for portal

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

  // Handle mounting for Portals
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [discount, setDiscount] = useState(0);

  // Payment method state (managed by PaymentLayout mostly, but kept for logic)
  const [paymentMethod, setPaymentMethod] = useState('online');

  // Cart items state (Local state used for checkout logic)
  const [cartItems, setCartItems] = useState([]);

  // Product details from URL params (for direct checkout from product page)
  const [orderDetails, setOrderDetails] = useState(null);
  const [edd, setEdd] = useState(null); // Estimated Delivery Date state
  const [isFlashDelivery, setIsFlashDelivery] = useState(false);
  const [serviceabilityMsg, setServiceabilityMsg] = useState("");

  // OTP Verification States (for guest checkout)
  // const [isPhoneVerified, setIsPhoneVerified] = useState(true); // Removed - No Guest Checkout
  // const [isOtpLoading, setIsOtpLoading] = useState(false); // Removed
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  // Check if user is logged in - STRICTLY check customer_token
  useEffect(() => {
    // Only accept customer_token. 'token' is often used for Admin, which shouldn't grant checkout access.
    const token = localStorage.getItem('customer_token');
    const user = localStorage.getItem('customer_user');

    if (token && user) {
      setIsLoggedIn(true);

      // Pre-fill form if user data exists
      try {
        const userData = JSON.parse(user);
        if (userData.email) {
          setFormData(prev => ({
            ...prev,
            email: userData.email,
            name: userData.full_name || userData.name || prev.name
          }));
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Guest Verification Success Handler
  // REMOVED: handleGuestVerificationSuccess
  // Guest checkout is disabled. Users ONLY proceed if logged in.

  useEffect(() => {
    // Check if coming from cart or direct product checkout
    const { productId, variantId, quantity, amount, productName, fromCart } = router.query;

    if (fromCart === 'true') {
      // Use items from Context if available
      if (contextCartItems && contextCartItems.length > 0) {
        setCartItems(contextCartItems);
      } else {
        // Fallback: Try loading from localStorage if context is empty (e.g., hard refresh)
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            const items = JSON.parse(savedCart);
            setCartItems(items);
          } catch (e) {
            console.error('Failed to parse cart:', e);
          }
        }
      }
    } else if (productId && variantId && quantity && amount) {
      // Direct checkout from product page
      const { image, description } = router.query;
      setOrderDetails({
        productId,
        variantId,
        quantity: parseInt(quantity),
        amount: parseFloat(amount),
        productName: productName || 'Product',
        image: image || null,
        description: description || ''
      });
    }
  }, [router.query, contextCartItems]); // Re-run when context updates

  // New Effect: Redirect if no items found after a short check
  useEffect(() => {
    if (!router.isReady) return;

    // Small delay to allow hydration/context load
    const timeout = setTimeout(() => {
      const { productId } = router.query;

      // If no direct buy params AND context cart is empty AND localstorage cart is empty/missing
      const hasItems = (contextCartItems && contextCartItems.length > 0) ||
        (typeof window !== 'undefined' && localStorage.getItem('cart') && JSON.parse(localStorage.getItem('cart') || '[]').length > 0) ||
        productId; // Direct buy presence

      if (!hasItems) {
        console.log('Redirecting from checkout: No items found');
        router.replace('/');
      }
    }, 1000); // 1s buffer for context

    return () => clearTimeout(timeout);
  }, [router.isReady, router.query, contextCartItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // Validate based on field type
    if (name === 'name') {
      sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'contact') {
      if (value.startsWith('+')) {
        sanitizedValue = '+' + value.slice(1).replace(/[^0-9]/g, '');
      } else {
        sanitizedValue = value.replace(/[^0-9]/g, '');
      }
    } else if (name === 'pincode') {
      sanitizedValue = value.replace(/[^0-9]/g, '');
    } else if (name === 'city' || name === 'state') {
      sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Auto-fetch city and state when pincode is entered (6 digits)
    if (name === 'pincode' && sanitizedValue.length === 6) {
      fetchPincodeDetails(sanitizedValue);
    }
  };

  // Fetch city and state from pincode (and now Serviceability)
  const fetchPincodeDetails = async (pincode) => {
    // 1. Fetch City/State from Public API
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

    // 2. Fetch Serviceability (EDD) from Our Backend
    checkServiceability(pincode);
  };

  const checkServiceability = async (pincode) => {
    if (!pincode || pincode.length !== 6) return;

    try {
      // Calculate logical total for insurance/serviceability check
      let currentTotal = 0;
      if (cartItems.length > 0) {
        currentTotal = cartItems.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
      } else if (orderDetails) {
        currentTotal = orderDetails.amount;
      }

      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/serviceability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pincode: pincode,
          delivery_pincode: pincode,
          value: currentTotal,
          mode: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
          weight: 0.5
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.available) {
          if (data.is_flash) {
            setIsFlashDelivery(true);
            setEdd(data.date); // "Today (2-4 Hrs)"
            setServiceabilityMsg(data.message);
          } else if (data.date) {
            setIsFlashDelivery(false);
            setEdd(data.date);
            setServiceabilityMsg("");
          }
        } else {
          setEdd(null); // Fallback to default logic if not available
          setIsFlashDelivery(false);
          setServiceabilityMsg("");
        }
      }
    } catch (err) {
      console.error("Serviceability check failed:", err);
    }
  };

  // Re-check serviceability if payment method changes (as it might affect COD availability/dates)
  useEffect(() => {
    if (formData.pincode && formData.pincode.length === 6) {
      checkServiceability(formData.pincode);
    }
  }, [paymentMethod]);

  const handleApplyCoupon = async () => {
    setCouponError('');
    setAppliedCoupon(null);
    setDiscount(0);

    if (couponCode.trim() === '') {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/coupons/param/${couponCode}`);

      if (res.ok) {
        const data = await res.json();
        setAppliedCoupon(data); // Store full coupon object: { code, discount_type, discount_value }
      } else {
        const err = await res.json();
        setCouponError(err.detail || 'Invalid Coupon');
      }
    } catch (e) {
      setCouponError('Failed to validate coupon');
    }
  };

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

  // Calculate discounted amount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = (totalAmount * appliedCoupon.discount_value) / 100;
    } else if (appliedCoupon.discount_type === 'fixed') {
      discountAmount = appliedCoupon.discount_value;
    } else if (appliedCoupon.discount_type === 'flat_price') {
      discountAmount = totalAmount - appliedCoupon.discount_value;
    }
  }

  // Calculate final amount
  let finalAmount = totalAmount - discountAmount;
  if (finalAmount < 0) finalAmount = 0;

  // Handle Razorpay Payment Success
  const handleRazorpaySuccess = async (response) => {
    try {
      console.log("Payment success, validating...", response);
      const API_URL = getApiUrl();

      // Reconstruct order data
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
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          isCartCheckout: true,
          paymentMethod: 'online'
        }
        : {
          productId: orderDetails.productId,
          variantId: orderDetails.variantId,
          quantity: orderDetails.quantity,
          amount: Math.round(finalAmount),
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          paymentMethod: 'online'
        };

      // Explicitly verify and create order in backend
      const verifyRes = await fetch(`${API_URL}/api/update-order-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          order_data: orderData
        })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.detail || "Payment verification failed");
      }

      // Success
      if (cartItems.length > 0) localStorage.removeItem('cart');
      setIsSuccess(true);

      setTimeout(() => {
        router.push({
          pathname: '/payment-success',
          query: {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            amount: finalAmount,
            email: formData.email,
            name: formData.name
          }
        });
      }, 2000);

    } catch (err) {
      console.error("Payment Success Handler Error:", err);
      setError("Payment successful but order creation failed: " + err.message);
    }
  };

  const handleRefundableExecution = async (executeMethod, methodType) => {
    setIsLoading(true);
    setError(null);

    // Validation
    if (!formData.name || !formData.email || !formData.contact || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      setError('Please fill all required fields');
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Phone validation: 10 digits, or 0+10 digits, or +91+10 digits
    const phoneRegex = /^(\+91[0-9]{10}|0[0-9]{10}|[0-9]{10})$/;
    if (!phoneRegex.test(formData.contact)) {
      setError('Please enter a valid mobile number (10 digits, or with 0 or +91 prefix)');
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Ensure there are items
    if (cartItems.length === 0 && !orderDetails) {
      setError('No items to checkout.');
      setIsLoading(false);
      return;
    }

    try {
      await executeMethod();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleCODPayment = () => {
    handleRefundableExecution(async () => {
      setPaymentMethod('cod');
      const API_URL = getApiUrl();
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');

      // Prepare data with COD charge added to final amount logic if needed, 
      // OR rely on backend adding it. Backend adds it if 'codCharges' is passed.
      // My PaymentLayout adds 59 to the button text, let's ensure backend knows.

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
          amount: Math.round(finalAmount), // Base amount, backend usually adds COD charge logic or we pass it
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          isCartCheckout: true,
          paymentMethod: 'cod'
        }
        : {
          productId: orderDetails.productId,
          variantId: orderDetails.variantId,
          quantity: orderDetails.quantity,
          amount: Math.round(finalAmount),
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          paymentMethod: 'cod'
        };

      const response = await fetch(`${API_URL}/api/create-cod-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...orderData, codCharges: COD_CHARGE })
      });

      const data = await response.json();
      if (response.ok) {
        if (cartItems.length > 0) localStorage.removeItem('cart');
        setIsSuccess(true);
        setTimeout(() => {
          router.push({
            pathname: '/payment-success',
            query: { orderId: data.orderId, amount: finalAmount + COD_CHARGE, codMode: 'true', email: formData.email, name: formData.name }
          });
        }, 2000);
      } else {
        throw new Error(data.detail || 'Failed to place order');
      }
    }, 'cod');
  };

  const handleRazorpayPayment = () => {
    handleRefundableExecution(async () => {
      setPaymentMethod('online');
      const API_URL = getApiUrl();
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');

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
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          isCartCheckout: true,
          paymentMethod: 'online'
        }
        : {
          productId: orderDetails.productId,
          variantId: orderDetails.variantId,
          quantity: orderDetails.quantity,
          amount: Math.round(finalAmount),
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          paymentMethod: 'online'
        };


      const response = await fetch(`${getApiUrl()}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || 'Failed to initiate payment');

      // Handle different payment providers
      if (data.provider === 'phonepe' && data.redirectUrl) {
        // PhonePe - Redirect to payment page
        // Store order data in sessionStorage for callback
        sessionStorage.setItem('pending_order', JSON.stringify({
          ...orderData,
          transactionId: data.orderId
        }));

        window.location.href = data.redirectUrl;
        return;
      }

      // Razorpay flow
      if (data && data.key && data.orderId) {
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: "Varaha Jewels",
          description: "Purchase from Varaha Jewels",
          image: "/varaha-assets/logo.png",
          order_id: data.orderId,
          handler: handleRazorpaySuccess,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.contact.startsWith('+') ? formData.contact : `+91${formData.contact.replace(/^0+/, '')}`
          },
          theme: { color: "#B76E79" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setIsLoading(false);
      } else {
        throw new Error('Invalid payment configuration from server');
      }
    }, 'online');
  };


  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Payment/Review

  const handleValidation = () => {
    if (!formData.name || !formData.email || !formData.contact || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      setError('Please fill all required fields');
      return false;
    }
    const phoneRegex = /^(\+91[0-9]{10}|0[0-9]{10}|[0-9]{10})$/;
    if (!phoneRegex.test(formData.contact)) {
      setError('Please enter a valid mobile number');
      return false;
    }
    setError(null);
    return true;
  };


  const handleContinueToStep2 = () => {
    if (handleValidation()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Checkout - Varaha Jewels™</title>
      </Head>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Simplified Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/varaha-assets/logo.png" alt="Varaha" width={100} height={30} className="h-6 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button onClick={() => setCurrentStep(currentStep - 1)} className="text-sm text-heritage font-medium flex items-center gap-1">
              ← Back
            </button>
          )}
        </div>
      </div>

      <div className="hidden lg:block">
        <Header />
      </div>

      <main className="min-h-screen bg-warm-sand/30 pb-24 lg:pb-16 lg:pt-12">
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">

          {error && <div className="max-w-2xl mx-auto bg-red-50 text-red-600 p-4 mb-6 rounded-lg text-sm border border-red-100 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-red-500" /> {error}
          </div>}


          {/* STEP 1: VERIFICATION or ADDRESS */}
          {currentStep === 1 && (

            !isLoggedIn ? (
              // LOGIN REQUIRED PROMPT
              <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8 text-center animate-fadeIn border border-heritage/10 mt-12">
                <div className="w-16 h-16 bg-heritage/10 text-heritage rounded-full flex items-center justify-center mx-auto mb-6">
                  <User size={32} />
                </div>
                <h2 className="text-2xl font-bold text-heritage mb-3 font-royal">Login Required</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  To ensure a secure checkout and order tracking, please log in or create an account to proceed.
                </p>
                <div className="space-y-4">
                  <Link
                    href="/login?redirect=/checkout"
                    className="block w-full py-4 bg-heritage text-white font-bold rounded-xl shadow-lg hover:bg-heritage/90 hover:shadow-xl transition-all transform hover:-translate-y-1"
                  >
                    Login / Sign Up
                  </Link>
                  <Link href="/cart" className="block text-sm text-heritage/60 hover:text-heritage font-medium">
                    Return to Cart
                  </Link>
                </div>
              </div>
            ) : (
              // LOGGED IN - SHOW ADDRESS FORM
              <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6 lg:p-10 animate-fadeIn">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <h2 className="text-2xl font-bold text-heritage font-royal">Shipping Details</h2>
                  <div className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 font-medium">
                    <CheckCircle size={14} /> Logged In
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleContinueToStep2(); }} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className='lg:col-span-2'>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Info</label>
                      <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} readOnly={false} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none transition-all" required />
                    </div>

                    <div>
                      <input name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none transition-all" required />
                    </div>
                    <div>
                      <input name="contact" type="tel" placeholder="Mobile Number" value={formData.contact} onChange={handleInputChange} readOnly={false} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none transition-all" required />
                    </div>

                    <div className='lg:col-span-2'>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                      <input name="address" placeholder="Address (House No, Building, Street)" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none transition-all" required />
                    </div>

                    <div>
                      <input name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none transition-all" required />
                      {isFlashDelivery && (
                        <p className="text-xs font-bold text-green-600 mt-1 flex items-center gap-1 animate-pulse">
                          {serviceabilityMsg}
                        </p>
                      )}
                    </div>
                    <div>
                      <input name="city" placeholder="City" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none transition-all" required />
                    </div>
                    <div>
                      <input name="state" placeholder="State" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none transition-all" required />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-lg font-bold uppercase tracking-wider shadow-lg mt-8 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 bg-heritage text-white hover:bg-heritage/90"
                  >
                    <>
                      <CheckCircle size={18} />
                      Continue to Payment
                    </>
                  </button>
                </form>
              </div>
            )
          )}

          {/* STEP 2: PAYMENT LAYOUT */}
          {currentStep === 2 && (
            <PaymentLayout
              cartItems={cartItems}
              orderDetails={orderDetails}
              handleRazorpayPayment={handleRazorpayPayment}
              handleCODPayment={handleCODPayment}
              isLoading={isLoading}
              formData={formData}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              handleApplyCoupon={handleApplyCoupon}
              couponError={couponError}
              appliedCoupon={appliedCoupon}
              setAppliedCoupon={setAppliedCoupon}
              setDiscount={setDiscount}
              isFlashDelivery={isFlashDelivery}
              edd={edd}
            />
          )}

        </div>
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </>
  );
}
