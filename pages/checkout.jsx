import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // Import portal
import { getApiUrl, getAuthHeaders } from '../lib/config';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script'; // Import Script for Razorpay
import Header from '../components/Header';
import Footer from '../components/Footer';
import PaymentLayout from '../components/checkout/PaymentLayout';
import OrderSummary from '../components/checkout/OrderSummary';
import { trackEvent, storeUserData } from '../lib/metaPixel';

import { ShoppingBag, ArrowLeft, Lock, CreditCard, Truck, Check, Tag, Phone, CheckCircle, User, MapPin, Home, Briefcase, ChevronDown } from 'lucide-react';
import { useMsg91OTP } from '../hooks/useMsg91OTP';

import { useCart } from '../context/CartContext';
import { calcCouponDiscount, toPriceItems } from '../lib/couponCalc';

export default function Checkout() {
  const router = useRouter();
  const { cartItems: contextCartItems, clearCart } = useCart(); // Get items from Context
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
  const [isCodDisabled, setIsCodDisabled] = useState(false);

  // Cart items state (Local state used for checkout logic)
  const [cartItems, setCartItems] = useState([]);

  // Product details from URL params (for direct checkout from product page)
  const [orderDetails, setOrderDetails] = useState(null);
  const [edd, setEdd] = useState(null); // Estimated Delivery Date state
  const [isFlashDelivery, setIsFlashDelivery] = useState(false);
  const [serviceabilityMsg, setServiceabilityMsg] = useState("");

  // Pincode locality suggestions (Shopify-style autocomplete)
  const [pincodeSuggestions, setPincodeSuggestions] = useState([]);
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);
  const pincodeDropdownRef = useRef(null);

  // OTP Verification States (for guest checkout)
  // const [isPhoneVerified, setIsPhoneVerified] = useState(true); // Removed - No Guest Checkout
  // const [isOtpLoading, setIsOtpLoading] = useState(false); // Removed
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showSavedAddrs, setShowSavedAddrs] = useState(false);

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

      // Fetch saved addresses
      (async () => {
        try {
          const res = await fetch(`${getApiUrl()}/api/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const addrs = await res.json();
            setSavedAddresses(addrs);
            // Auto-fill default address if form is empty
            const def = addrs.find(a => a.is_default) || addrs[0];
            if (def) {
              setFormData(prev => ({
                ...prev,
                name: def.full_name || prev.name,
                contact: def.phone || prev.contact,
                address: [def.address_line1, def.address_line2].filter(Boolean).join(', '),
                city: def.city,
                state: def.state,
                pincode: def.pincode
              }));
            }
          }
        } catch (e) { /* ignore */ }
      })();
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Guest checkout is allowed (COD + online). Logged-in users get saved addresses.

  useEffect(() => {
    const { productId, variantId, quantity, amount, productName, fromCart } = router.query;

    if (productId && variantId && quantity && amount) {
      // Direct checkout from product page — use URL params
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
  }, [router.query]);

  // Always sync cart items from context (works across all steps)
  const initiateCheckoutFired = useRef(false);
  useEffect(() => {
    if (contextCartItems && contextCartItems.length > 0) {
      setCartItems(contextCartItems);
    }
  }, [contextCartItems]);

  // ── Fire InitiateCheckout once when cart items / order details are confirmed ──
  useEffect(() => {
    if (initiateCheckoutFired.current) return;

    const items = cartItems.length > 0 ? cartItems : null;
    const hasData = items || orderDetails;
    if (!hasData) return;

    initiateCheckoutFired.current = true;

    const contentIds = items
      ? items.map(i => String(i.productId || i.id))
      : [String(orderDetails?.productId)];

    const totalValue = items
      ? items.reduce((sum, i) => sum + (i.variant.price * i.quantity), 0)
      : (orderDetails?.amount || 0);

    const numItems = items
      ? items.reduce((sum, i) => sum + i.quantity, 0)
      : (orderDetails?.quantity || 1);

    trackEvent(
      'InitiateCheckout',
      {
        content_ids: contentIds,
        content_type: 'product',
        value: totalValue,
        currency: 'INR',
        num_items: numItems,
      }
    ).catch(() => {});
  }, [cartItems, orderDetails]);

  // Latest cart values for the delayed check below (the timeout callback
  // would otherwise only see the empty cart from the first render)
  const latestItemsRef = useRef({ cartItems, contextCartItems });
  latestItemsRef.current = { cartItems, contextCartItems };

  // New Effect: Redirect if no items found after a reasonable check
  useEffect(() => {
    if (!router.isReady) return;

    // Longer delay to allow context + server cart to fully load
    const timeout = setTimeout(() => {
      const { productId, fromCart } = router.query;
      const { cartItems: latestCart, contextCartItems: latestContext } = latestItemsRef.current;

      // Check multiple sources for items
      const hasItems = latestCart.length > 0 ||
        (latestContext && latestContext.length > 0) ||
        productId || // Direct buy presence
        fromCart; // Coming from cart page (data may still be loading)

      if (!hasItems) {
        console.log('Redirecting from checkout: No items found');
        router.replace('/');
      }
    }, 3000); // 3s buffer for server cart fetch

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]); // Only run once when router is ready, not on every cart change

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // Validate based on field type
    if (name === 'name') {
      // Allow letters of any language (e.g. Hindi), spaces, dots and apostrophes
      sanitizedValue = value.replace(/[^\p{L}\p{M}\s.']/gu, '');
    } else if (name === 'contact') {
      if (value.startsWith('+')) {
        sanitizedValue = '+' + value.slice(1).replace(/[^0-9]/g, '');
      } else {
        sanitizedValue = value.replace(/[^0-9]/g, '');
      }
    } else if (name === 'pincode') {
      sanitizedValue = value.replace(/[^0-9]/g, '');
    } else if (name === 'city' || name === 'state') {
      sanitizedValue = value.replace(/[^\p{L}\p{M}\s.\-]/gu, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Store user data for Advanced Matching on later pages (e.g., payment-success)
    if (['email', 'contact', 'name', 'city', 'state', 'pincode'].includes(name)) {
      storeUserData({
        email: name === 'email' ? sanitizedValue : formData.email,
        phone: name === 'contact' ? sanitizedValue : formData.contact,
        name: name === 'name' ? sanitizedValue : formData.name,
        city: name === 'city' ? sanitizedValue : formData.city,
        state: name === 'state' ? sanitizedValue : formData.state,
        zip: name === 'pincode' ? sanitizedValue : formData.pincode,
      });
    }

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
        const postOffices = data[0].PostOffice;
        const firstPO = postOffices[0];
        setFormData(prev => ({
          ...prev,
          city: firstPO.District,
          state: firstPO.State
        }));

        // Store all post offices for locality suggestions dropdown
        setPincodeSuggestions(postOffices);
        setShowPincodeSuggestions(true);
      } else {
        setPincodeSuggestions([]);
        setShowPincodeSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching pincode details:', error);
      setPincodeSuggestions([]);
    }

    // 2. Fetch Serviceability (EDD) from Our Backend
    checkServiceability(pincode);
  };

  // Handle selecting a locality from suggestions
  const handleSelectLocality = (postOffice) => {
    setFormData(prev => {
      // Add the locality to what the shopper typed instead of replacing it
      // (it used to wipe out house no. / street)
      const typed = (prev.address || '').trim();
      const alreadyHas = typed.toLowerCase().includes(postOffice.Name.toLowerCase());
      return {
        ...prev,
        address: !typed ? postOffice.Name : alreadyHas ? typed : `${typed}, ${postOffice.Name}`,
        city: postOffice.District,
        state: postOffice.State
      };
    });
    setShowPincodeSuggestions(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pincodeDropdownRef.current && !pincodeDropdownRef.current.contains(e.target)) {
        setShowPincodeSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Auto-remove coupon if payment method changes and restriction is violated
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.payment_method_restriction) {
      const r = appliedCoupon.payment_method_restriction;
      if (r === 'prepaid_only' && paymentMethod === 'cod') {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponError('Coupon removed: valid only for prepaid/online payments');
      } else if (r === 'cod_only' && paymentMethod !== 'cod') {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponError('Coupon removed: valid only for Cash on Delivery');
      } else if (r === 'upi_only' && paymentMethod === 'cod') {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponError('Coupon removed: valid only for UPI payments');
      }
    }
  }, [paymentMethod]);

  const handleApplyCoupon = async () => {
    setCouponError('');
    setAppliedCoupon(null);
    setDiscount(0);
    setIsCodDisabled(false); // Reset restriction when removing/re-applying

    if (couponCode.trim() === '') {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const API_URL = getApiUrl();
      // email/phone let the server check the per-customer usage limit
      const qs = new URLSearchParams();
      if (formData.email) qs.set('email', formData.email);
      if (formData.contact) qs.set('phone', formData.contact);
      const res = await fetch(`${API_URL}/api/coupons/param/${encodeURIComponent(couponCode.trim())}?${qs.toString()}`);

        if (res.ok) {
        const data = await res.json();
        // Check payment method restriction
        const restriction = data.payment_method_restriction || 'none';
        
        if (['prepaid_only', 'upi_only'].includes(restriction)) {
          setPaymentMethod('online');
          setIsCodDisabled(true);
          setCouponError(''); // Clear error if any, it's successful
        } else if (restriction === 'cod_only') {
          setPaymentMethod('cod');
          setIsCodDisabled(false);
          setCouponError('');
        } else {
          setIsCodDisabled(false);
        }
        // Check minimum order amount
        const minOrder = data.min_order_amount;
        if (minOrder && totalAmount < minOrder) {
          setCouponError(`Minimum order value of ₹${Math.round(minOrder)} required`);
          return;
        }
        setAppliedCoupon(data);
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

  // Items for the order summary on the shipping step (cart or direct "Buy Now")
  const summaryItems = cartItems.length > 0
    ? cartItems.map(item => ({
        name: item.productName || item.name || 'Product',
        image: item.image || item.variant?.image,
        quantity: item.quantity,
        price: item.variant?.price || 0
      }))
    : orderDetails
      ? [{ name: orderDetails.productName, image: orderDetails.image, quantity: orderDetails.quantity, price: orderDetails.amount / (orderDetails.quantity || 1) }]
      : [];

  // Calculate discounted amount
  // Same formula as the server (incl. BOGO + max cap)
  const discountAmount = appliedCoupon
    ? calcCouponDiscount(appliedCoupon, toPriceItems(cartItems, orderDetails), totalAmount)
    : 0;

  // Calculate final amount
  let finalAmount = totalAmount - discountAmount;
  if (finalAmount < 0) finalAmount = 0;

  // Handle Razorpay Payment Success
  const handleRazorpaySuccess = async (response) => {
    try {
      console.log("Payment success, validating...", response);
      const API_URL = getApiUrl();

      // Order details are taken from the server-side checkout snapshot

      // Explicitly verify and create order in backend
      const token = localStorage.getItem('customer_token') || localStorage.getItem('token');
      const verifyRes = await fetch(`${API_URL}/api/update-order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.detail || "Payment verification failed");
      }

      // Success
      if (cartItems.length > 0) {
        localStorage.removeItem('cart');
        // Also clear the server-side cart for logged-in users
        try { await clearCart(); } catch (e) { /* ignore */ }
      }
      setIsSuccess(true);

      setTimeout(() => {
        router.push({
          pathname: '/payment-success',
          query: {
            orderId: verifyData.orderId,          // real order id (ORD-...), not the Razorpay id
            key: verifyData.accessKey,            // lets guests view their own order
            paymentId: response.razorpay_payment_id,
            amount: verifyData.amount
            // no email/name here: personal data in URLs ends up in history, logs and analytics;
            // payment-success loads them from the order instead
          }
        });
      }, 800);

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
          paymentMethod: 'cod',
          couponCode: appliedCoupon?.code || '',
          session_id: localStorage.getItem('vj_session_id') || undefined
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
          paymentMethod: 'cod',
          couponCode: appliedCoupon?.code || '',
          session_id: localStorage.getItem('vj_session_id') || undefined
        };

      const response = await fetch(`${API_URL}/api/create-cod-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderData) // COD charge is added by the server
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error('Server returned an invalid response. Please try again.');
      }
      if (response.ok) {
        if (cartItems.length > 0) {
        localStorage.removeItem('cart');
        // Also clear the server-side cart for logged-in users
        try { await clearCart(); } catch (e) { /* ignore */ }
      }
        setIsSuccess(true);
        setTimeout(() => {
          router.push({
            pathname: '/payment-success',
            query: { orderId: data.orderId, key: data.accessKey, amount: data.amount, codMode: 'true' }
          });
        }, 800);
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
          paymentMethod: 'online',
          couponCode: appliedCoupon?.code || '',
          session_id: localStorage.getItem('vj_session_id') || undefined
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
          paymentMethod: 'online',
          couponCode: appliedCoupon?.code || '',
          session_id: localStorage.getItem('vj_session_id') || undefined
        };


      const response = await fetch(`${getApiUrl()}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderData)
      });
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!response.ok) throw new Error((typeof data.detail === 'string' && data.detail) || 'Failed to initiate payment');

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
      if (data && data.key && typeof data.key === 'string' && data.key.trim() !== '' && data.key !== 'undefined' && data.orderId) {
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

  const field = 'w-full h-12 px-4 rounded-xl border border-heritage/15 bg-white text-heritage placeholder:text-heritage/35 focus:outline-none focus:border-copper focus:ring-2 focus:ring-copper/20 transition-colors';
  const label = 'block text-sm font-medium text-heritage/80 mb-1.5';

  return (
    <>
      <Head>
        <title>Checkout - Varaha Jewels™</title>
      </Head>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Focused checkout header (all screen sizes) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-heritage/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {currentStep > 1 ? (
            <button onClick={() => setCurrentStep(currentStep - 1)} className="text-sm font-semibold text-heritage hover:text-copper whitespace-nowrap">← Back</button>
          ) : (
            <Link href="/cart" className="text-sm font-semibold text-heritage hover:text-copper whitespace-nowrap">← Cart</Link>
          )}
          <Link href="/" className="mx-auto sm:mx-0 flex-shrink-0" aria-label="Varaha Jewels home">
            <Image src="/varaha-assets/logo.png" alt="Varaha Jewels" width={110} height={32} className="h-7 w-auto" onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/dd5zrsmok/image/upload/v1766342264/logo_hvef6t.png'; }} />
          </Link>
          <ol className="hidden sm:flex items-center gap-2 ml-auto text-sm font-medium" aria-label="Checkout steps">
            {['Shipping', 'Payment'].map((labelText, i) => {
              const n = i + 1;
              const done = currentStep > n;
              const active = currentStep === n;
              return (
                <li key={labelText} className="flex items-center gap-2">
                  {i > 0 && <span className={`h-px w-10 ${currentStep >= n ? 'bg-copper' : 'bg-heritage/20'}`} />}
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${done ? 'bg-copper text-white' : active ? 'bg-heritage text-white' : 'bg-heritage/10 text-heritage/50'}`} aria-current={active ? 'step' : undefined}>
                    {done ? <Check size={13} /> : n}
                  </span>
                  <span className={active || done ? 'text-heritage' : 'text-heritage/40'}>{labelText}</span>
                </li>
              );
            })}
          </ol>
          <span className="hidden md:flex items-center gap-1.5 text-xs text-heritage/55 ml-4 whitespace-nowrap">
            <Lock size={13} className="text-emerald-600" /> Secure checkout
          </span>
        </div>
        {/* Phone step bar */}
        <div className="sm:hidden h-1 bg-heritage/10"><div className={`h-full bg-copper transition-all ${currentStep === 1 ? 'w-1/2' : 'w-full'}`} /></div>
      </header>

      <main className="min-h-screen bg-warm-sand/40 pt-5 lg:pt-8 pb-28 lg:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {error && (
            <p role="alert" className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {currentStep === 1 && (
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
              {/* Phone: summary folds into a bar above the form */}
              <div className="lg:hidden mb-4">
                <OrderSummary items={summaryItems} subtotal={totalAmount} collapsible />
              </div>

              <form id="shipping-form" onSubmit={(e) => { e.preventDefault(); handleContinueToStep2(); }} className="lg:col-span-7 space-y-5">
                {/* Contact */}
                <section className="rounded-2xl bg-white border border-heritage/10 p-5 sm:p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                    <h2 className="font-royal font-bold text-2xl text-heritage">Contact</h2>
                    {isLoggedIn ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle size={14} /> Signed in</span>
                    ) : (
                      <Link href="/login?redirect=/checkout" className="text-sm font-semibold text-copper hover:text-heritage underline underline-offset-4">Sign in for faster checkout</Link>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="co-email" className={label}>Email</label>
                      <input id="co-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} className={field} required />
                    </div>
                    <div>
                      <label htmlFor="co-name" className={label}>Full name</label>
                      <input id="co-name" name="name" autoComplete="name" value={formData.name} onChange={handleInputChange} className={field} required />
                    </div>
                    <div>
                      <label htmlFor="co-phone" className={label}>Mobile number</label>
                      <input id="co-phone" name="contact" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" value={formData.contact} onChange={handleInputChange} className={field} required />
                    </div>
                  </div>
                </section>

                {/* Address */}
                <section className="rounded-2xl bg-white border border-heritage/10 p-5 sm:p-6">
                  <h2 className="font-royal font-bold text-2xl text-heritage mb-4">Delivery address</h2>

                  {savedAddresses.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm font-medium text-heritage/80 mb-2">Your saved addresses</p>
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {savedAddresses.map((addr) => {
                          const LabelIcon = addr.label === 'Home' ? Home : addr.label === 'Office' ? Briefcase : MapPin;
                          const isFilled = formData.address === [addr.address_line1, addr.address_line2].filter(Boolean).join(', ')
                            && formData.city === addr.city && formData.pincode === addr.pincode;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              aria-pressed={isFilled}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  name: addr.full_name || prev.name,
                                  contact: addr.phone || prev.contact,
                                  address: [addr.address_line1, addr.address_line2].filter(Boolean).join(', '),
                                  city: addr.city,
                                  state: addr.state,
                                  pincode: addr.pincode,
                                }));
                              }}
                              className={`text-left p-3.5 rounded-xl border-2 flex gap-3 items-start transition-colors ${isFilled ? 'border-heritage bg-[#FBF3EA]' : 'border-heritage/10 hover:border-heritage/30'}`}
                            >
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isFilled ? 'bg-heritage text-white' : 'bg-heritage/5 text-heritage/60'}`}>
                                {isFilled ? <Check size={14} /> : <LabelIcon size={14} />}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-heritage">{addr.label}{addr.is_default ? ', default' : ''}</span>
                                <span className="block text-xs text-heritage/60 leading-snug mt-0.5 line-clamp-2">{addr.address_line1}, {addr.city} {addr.pincode}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs text-heritage/50">Or enter a new address below.</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="co-address" className={label}>House no., building, street, area</label>
                      <input id="co-address" name="address" autoComplete="street-address" value={formData.address} onChange={handleInputChange} className={field} required />
                    </div>

                    <div className="relative" ref={pincodeDropdownRef}>
                      <label htmlFor="co-pincode" className={label}>Pincode</label>
                      <input id="co-pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" placeholder="6 digits" value={formData.pincode} onChange={handleInputChange} className={field} required />
                      {isFlashDelivery && serviceabilityMsg && (
                        <p className="mt-1.5 text-xs font-semibold text-emerald-700">{serviceabilityMsg}</p>
                      )}
                      {showPincodeSuggestions && pincodeSuggestions.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-heritage/15 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          <p className="px-3 py-2 text-xs text-heritage/50 border-b border-heritage/10">Choose your locality</p>
                          {pincodeSuggestions.map((po, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectLocality(po)}
                              className="w-full px-3 py-2.5 text-left hover:bg-[#FBF3EA] flex items-start gap-2 border-b border-heritage/5 last:border-0"
                            >
                              <MapPin size={14} className="text-copper mt-0.5 flex-shrink-0" />
                              <span>
                                <span className="block text-sm font-medium text-heritage">{po.Name}</span>
                                <span className="block text-[11px] text-heritage/50">{po.District}, {po.State}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="co-city" className={label}>City</label>
                      <input id="co-city" name="city" autoComplete="address-level2" value={formData.city} onChange={handleInputChange} className={field} required />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="co-state" className={label}>State</label>
                      <input id="co-state" name="state" autoComplete="address-level1" value={formData.state} onChange={handleInputChange} className={field} required />
                    </div>
                  </div>
                </section>

                {/* Desktop continue button (phones use the sticky bar) */}
                <button type="submit" className="hidden lg:flex w-full h-14 items-center justify-center gap-2 rounded-full bg-heritage text-white font-bold text-base hover:bg-copper transition-colors">
                  Continue to payment
                </button>
              </form>

              <aside className="hidden lg:block lg:col-span-5 lg:sticky lg:top-24">
                <OrderSummary items={summaryItems} subtotal={totalAmount} />
              </aside>

              {/* Sticky continue bar on phones */}
              <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-heritage/10 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(42,21,12,0.25)]">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-heritage/55">Subtotal</p>
                    <p className="font-bold text-lg text-heritage tabular-nums leading-tight">₹{totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <button type="submit" form="shipping-form" className="flex-1 h-12 rounded-full bg-heritage text-white font-bold hover:bg-copper">
                    Continue to payment
                  </button>
                </div>
              </div>
            </div>
          )}

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
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onEditAddress={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          )}
        </div>
      </main>
    </>
  );
}
