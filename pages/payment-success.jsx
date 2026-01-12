import { getApiUrl } from '../lib/config';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CheckCircle, Package, Mail, Phone, Home, Download } from 'lucide-react';

export default function PaymentSuccess() {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState(null);
  const [fullOrderData, setFullOrderData] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [invoiceDownloaded, setInvoiceDownloaded] = useState(false);

  const handleDownloadInvoice = async (orderData = fullOrderData) => {
    if (!orderData) {
      console.log('⚠️ Order data not available yet');
      alert('Order data not available yet. Please wait a moment and try again.');
      return;
    }

    console.log('🔍 Order data for invoice:', orderData);

    // Ensure we have the required data
    if (!orderData.discount || orderData.discount.originalAmount === null) {
      console.log('⚠️ Missing discount data, using fallback');
      orderData = {
        ...orderData,
        discount: {
          ...orderData.discount,
          originalAmount: orderData.amount === 1 ? 2499 : orderData.amount,
          discountAmount: orderData.amount === 1 ? 2498 : 0
        }
      };
    }

    try {
      console.log('📄 Dynamically importing invoice generator...');
      // Dynamic import to avoid SSR issues
      const { generateInvoicePDF } = await import('../lib/invoiceGenerator');
      console.log('📄 Calling generateInvoicePDF...');
      const fileName = generateInvoicePDF(orderData);
      console.log('✅ Invoice generated:', fileName);
      setInvoiceDownloaded(true);
    } catch (error) {
      console.error('❌ Failed to generate invoice:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`Failed to generate invoice: ${error.message}. Please try again or contact support.`);
    }
  };

  useEffect(() => {
    // Get order details from URL params
    const { orderId } = router.query;

    if (orderId) {
      fetchOrder(orderId);
    }
  }, [router.query]);

  const fetchOrder = async (id, attempt = 1) => {
    try {
      const API_URL = getApiUrl();
      console.log(`Fetching order: ${id} (Attempt ${attempt})`);

      const res = await fetch(`${API_URL}/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();

        // Parse items
        let items = [];
        try { items = JSON.parse(data.items_json); } catch (e) { console.error(e); }

        setFullOrderData(data); // Store raw for invoice

        setOrderDetails({
          orderId: data.id, // Use NUMERIC ID for display
          displayId: `Order #${data.id}`,
          amount: data.total_amount,
          paymentId: data.payment_method === 'online' ? id : 'COD', // Use Razorpay ID as ref if needed? Or check history.
          productName: items.length > 0 ? (items.length > 1 ? `${items[0].productName} + ${items.length - 1} more` : items[0].productName) : 'Product',
          quantity: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
          email: data.email,
          name: data.customer_name,
          isCod: data.payment_method === 'cod',
          items: items // Store full items
        });

      } else {
        console.error(`Failed to fetch order (Status: ${res.status})`);

        // Retry logic for 404 (Order might be creating in background)
        if (res.status === 404 && attempt < 5) {
          console.log(`Order not found yet, retrying in 2s...`);
          setTimeout(() => fetchOrder(id, attempt + 1), 2000);
        } else if (attempt >= 5) {
          alert("Order processing is taking longer than expected. Please check your email for confirmation.");
          // Fallback to basic display if needed, or let user wait
        }
      }
    } catch (err) {
      console.error("Error fetching order:", err);
    }
  };

  // Preload Audio to prevent delay
  const [successAudio] = useState(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/varaha-assets/Success.mp3');
      audio.preload = 'auto';
      audio.load();
      return audio;
    }
    return null;
  });

  // Play Success Audio with Interaction Fallback
  useEffect(() => {
    if (orderDetails && successAudio) {
      const playAudio = async () => {
        try {
          successAudio.currentTime = 0;
          await successAudio.play();
          console.log('Audio played successfully');
        } catch (err) {
          console.log('Autoplay blocked. Waiting for interaction.', err);
          // Add one-time click listener to play sound if blocked
          const enableAudio = () => {
            successAudio.play().catch(e => console.error('Audio interaction play failed', e));
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
          };
          document.addEventListener('click', enableAudio);
          document.addEventListener('touchstart', enableAudio);
        }
      };

      playAudio();
    }
  }, [orderDetails, successAudio]);

  // ... (keep useEffect for countdown)

  if (!orderDetails) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-warm-sand flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-copper border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-heritage/70">Verifying Order...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{orderDetails.isCod ? 'Order Placed' : 'Payment Successful'} - Varaha Jewels</title>
        <meta name="description" content="Your order has been confirmed" />
      </Head>

      <Header />

      <main className="min-h-screen bg-warm-sand py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Test Mode Badge */}
          {router.query.testMode === 'true' && (
            <div className="mb-8 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
              <p className="text-center text-yellow-800 font-semibold">
                🧪 TEST MODE - This is a demo order using TESTADI coupon code
              </p>
            </div>
          )}

          {/* Success Icon */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 relative shadow-lg">
              <CheckCircle className="text-green-600" size={64} strokeWidth={2} />
              <div className="absolute inset-0 rounded-full bg-green-600/20 animate-ping"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold text-heritage mb-4">
              {orderDetails.isCod ? 'Order Placed Successfully!' : 'Payment Successful!'}
            </h1>
            <p className="text-lg text-heritage/70 mb-2">
              Thank you for your purchase, {orderDetails.name}
            </p>
            <p className="text-sm text-heritage/60">
              Order confirmation has been sent to your email
            </p>
            {orderDetails.isCod && (
              <p className="text-md text-copper font-medium mt-4 bg-copper/10 inline-block px-4 py-2 rounded-full">
                Please pay ₹{orderDetails.amount.toLocaleString('en-IN')} on delivery
              </p>
            )}
          </div>

          {/* Order Details Card */}
          <div className="bg-white border border-copper/30 rounded-xl shadow-sm p-8 mb-8">
            <div className="border-b border-copper/30 pb-6 mb-6">
              <h2 className="text-2xl font-royal font-bold text-heritage mb-4">Order Details</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-heritage/60 mb-1">Order ID</p>
                  <p className="font-semibold text-heritage text-lg">{orderDetails.displayId}</p>
                </div>

                {!orderDetails.isCod && (
                  <div>
                    <p className="text-sm text-heritage/60 mb-1">Razorpay Ref</p>
                    <p className="font-semibold text-heritage text-sm font-mono truncate">{router.query.paymentId || 'N/A'}</p>
                  </div>
                )}
                {orderDetails.isCod && (
                  <div>
                    <p className="text-sm text-heritage/60 mb-1">Payment Method</p>
                    <p className="font-semibold text-heritage text-sm">Cash on Delivery</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details - Dynamic List */}
            <div className="border-b border-copper/30 pb-6 mb-6">
              <h3 className="text-lg font-semibold text-heritage mb-4">Product Information</h3>

              <div className="space-y-4">
                {orderDetails.items && orderDetails.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-dashed border-copper/10 pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-heritage mb-1">{item.productName || item.name}</p>
                      <p className="text-sm text-heritage/60">
                        Qty: {item.quantity}
                        {item.variantName && <span className="text-xs ml-1">({item.variantName})</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-copper">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="flex items-center justify-between mt-4 params-t-4 border-t border-copper/20 pt-4">
                <p className="font-bold text-heritage">Total Paid</p>
                <div>
                  <p className="text-2xl font-royal font-bold text-copper">
                    ₹{orderDetails.amount.toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs mt-1 font-medium text-right ${orderDetails.isCod ? 'text-orange-600' : 'text-green-600'}`}>
                    {orderDetails.isCod ? 'Payment Pending' : 'Paid'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {orderDetails.email && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-heritage mb-4">Contact Information</h3>
                <div className="flex items-center gap-2 text-heritage/70">
                  <Mail size={16} />
                  <span className="text-sm">{orderDetails.email}</span>
                </div>
              </div>
            )}

            {/* Download Invoice Button */}
            <button
              onClick={() => handleDownloadInvoice()}
              disabled={!fullOrderData}
              className="w-full px-6 py-3 bg-copper text-warm-sand font-semibold rounded-sm hover:bg-heritage transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              {invoiceDownloaded ? 'Download Invoice Again' : 'Download Invoice'}
            </button>

            {invoiceDownloaded && (
              <p className="text-xs text-center text-green-600 mt-2">
                ✓ Invoice downloaded automatically
              </p>
            )}
          </div>

          {/* What's Next Section */}
          <div className="bg-white border border-copper/30 rounded-sm p-8 mb-8">
            <h2 className="text-2xl font-royal font-bold text-heritage mb-6">What's Next?</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-copper/10 rounded-full flex items-center justify-center">
                  <Mail className="text-copper" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-heritage mb-1">Order Confirmation Email</h3>
                  <p className="text-sm text-heritage/70">
                    We've sent a confirmation email with your order details and tracking information.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-copper/10 rounded-full flex items-center justify-center">
                  <Package className="text-copper" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-heritage mb-1">Processing & Dispatch</h3>
                  <p className="text-sm text-heritage/70">
                    Your order will be carefully processed and dispatched within 2-3 business days.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-copper/10 rounded-full flex items-center justify-center">
                  <Home className="text-copper" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-heritage mb-1">Delivery</h3>
                  <p className="text-sm text-heritage/70">
                    Expect delivery within 5-7 business days. Track your order using the tracking link in your email.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-copper/10 rounded-full flex items-center justify-center">
                  <Phone className="text-copper" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-heritage mb-1">Need Help?</h3>
                  <p className="text-sm text-heritage/70">
                    Contact our customer support at support@varahajewels.com or call +91-XXXXXXXXXX
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/"
              className="px-8 py-4 bg-copper text-warm-sand font-semibold rounded-sm hover:bg-heritage transition-all duration-300 text-center"
            >
              Continue Shopping
            </Link>

            <Link
              href="/orders"
              className="px-8 py-4 bg-white border-2 border-copper text-copper font-semibold rounded-sm hover:bg-copper hover:text-warm-sand transition-all duration-300 text-center"
            >
              View Orders
            </Link>
          </div>

          {/* Auto Redirect Notice */}
          <div className="mt-8 text-center">
            <p className="text-sm text-heritage/60">
              Redirecting to homepage in <span className="font-semibold text-copper">{countdown}</span> seconds...
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
