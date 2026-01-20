import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl } from '../../lib/config';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import OrderStepper from '../../components/OrderStepper';
import {
    Package, Truck, CheckCircle, Clock, MapPin,
    ChevronLeft, Star, Upload, Video, Image as ImageIcon, RefreshCw
} from 'lucide-react';

// Status to step mapping
const STATUS_STEP_MAP = {
    'pending': 1,
    'ordered': 1,
    'confirmed': 1,
    'packed': 2,
    'ready_to_ship': 2,
    'shipped': 3,
    'in_transit': 4,
    'out_for_delivery': 5,
    'delivered': 6,
    'completed': 6
};

function getStepsFromOrder(order) {
    const currentStep = STATUS_STEP_MAP[order.status?.toLowerCase()] || 1;

    return [
        {
            step: 1,
            title: "Ordered",
            description: "Order confirmed",
            completed: currentStep >= 1,
            active: currentStep === 1,
            date: order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null
        },
        {
            step: 2,
            title: "Packed",
            description: "Varaha craftsmen have packed your piece",
            completed: currentStep >= 2,
            active: currentStep === 2,
            date: null
        },
        {
            step: 3,
            title: "Shipped",
            description: order.awb_number ? `AWB: ${order.awb_number}` : "Your piece is on the way",
            completed: currentStep >= 3,
            active: currentStep === 3,
            date: null
        },
        {
            step: 4,
            title: "In Transit",
            description: "Package moving through courier network",
            completed: currentStep >= 4,
            active: currentStep === 4,
            date: null
        },
        {
            step: 5,
            title: "Out for Delivery",
            description: "Your package is out for delivery today",
            completed: currentStep >= 5,
            active: currentStep === 5,
            date: null
        },
        {
            step: 6,
            title: "Delivered",
            description: "Package delivered successfully",
            completed: currentStep >= 6,
            active: currentStep === 6,
            date: null
        }
    ];
}

export default function OrderDetails() {
    const router = useRouter();
    const { orderId } = router.query;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trackingHistory, setTrackingHistory] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Review State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/api/orders/${orderId}`);
            if (response.ok) {
                const data = await response.json();

                // Parse items and history
                let products = [];
                try { products = JSON.parse(data.items_json); } catch (e) { }

                // Parse tracking_data
                let trackHistory = [];
                try {
                    trackHistory = data.tracking_data ? JSON.parse(data.tracking_data) : [];
                } catch (e) { }
                setTrackingHistory(trackHistory);

                setOrder({
                    ...data,
                    items: products,
                    statusLower: data.status?.toLowerCase() || 'pending'
                });

            } else {
                console.error("Failed to fetch order");
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshTracking = async () => {
        if (!order?.awb_number) return;

        setRefreshing(true);
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/orders/${orderId}/refresh-tracking`);
            if (res.ok) {
                // Refetch order to get updated tracking
                await fetchOrderDetails();
            }
        } catch (e) {
            console.error('Refresh tracking error:', e);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!comment) return;

        setSubmittingReview(true);
        try {
            const productId = order.items[0]?.id || 'unknown';

            const response = await fetch(`${getApiUrl()}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: productId,
                    customer_name: order.customer_name,
                    rating: rating,
                    comment: comment,
                    media_urls: mediaUrl ? [mediaUrl] : []
                })
            });

            if (response.ok) {
                setReviewSubmitted(true);
                alert("Review submitted successfully!");
            } else {
                alert("Failed to submit review.");
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-warm-sand flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-copper border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-warm-sand flex flex-col items-center justify-center">
                <h1 className="text-2xl font-royal text-heritage mb-4">Order Not Found</h1>
                <Link href="/account" className="text-copper hover:underline">Back to My Account</Link>
            </div>
        );
    }

    const isDelivered = ['delivered', 'completed'].includes(order.statusLower);
    const steps = getStepsFromOrder(order);
    const currentStep = STATUS_STEP_MAP[order.statusLower] || 1;

    return (
        <>
            <Head>
                <title>Order #{order.order_id} - Varaha Jewels</title>
            </Head>
            <Header />

            <main className="min-h-screen bg-warm-sand py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <Link href="/account" className="inline-flex items-center text-heritage/60 hover:text-heritage mb-6 transition-colors">
                        <ChevronLeft size={20} /> Back to My Account
                    </Link>

                    {/* Header with Order ID and Refresh */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-royal font-bold text-heritage mb-2">Order Tracking</h1>
                            <p className="text-heritage/60">Order ID: <span className="font-mono text-heritage">{order.order_id}</span></p>
                        </div>
                        {order.awb_number && (
                            <button
                                onClick={handleRefreshTracking}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-copper/10 text-copper rounded-lg hover:bg-copper/20 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        )}
                    </div>

                    {/* AWB Info Banner */}
                    {order.awb_number && (
                        <div className="bg-copper/10 border border-copper/30 rounded-lg p-4 mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-heritage/70">Tracking Number (AWB)</p>
                                <p className="font-mono font-bold text-heritage text-lg">{order.awb_number}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-heritage/70">Courier</p>
                                <p className="font-bold text-heritage">{order.courier_name || 'RapidShyp'}</p>
                            </div>
                        </div>
                    )}

                    {/* New Order Stepper */}
                    <div className="bg-white p-8 rounded-xl border border-copper/30 mb-8 shadow-sm">
                        <h2 className="text-xl font-royal font-bold text-heritage mb-6">Delivery Status</h2>
                        <OrderStepper
                            steps={steps}
                            currentStep={currentStep}
                            trackingHistory={trackingHistory}
                        />
                    </div>

                    {/* Order Items Summary */}
                    <div className="bg-white p-8 rounded-xl border border-copper/30 mb-8 shadow-sm">
                        <h2 className="text-xl font-royal font-bold text-heritage mb-4">Items</h2>
                        <div className="space-y-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                    <div>
                                        <p className="font-medium text-heritage">{item.name}</p>
                                        <p className="text-sm text-heritage/60">Qty: {item.quantity} | {item.variant || 'Standard'}</p>
                                    </div>
                                    <p className="font-bold text-copper">₹{item.price}</p>
                                </div>
                            ))}
                        </div>

                        {/* Price Breakdown */}
                        <div className="mt-6 pt-4 border-t border-copper/20 space-y-2">
                            {(() => {
                                const subtotal = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
                                const codCharges = order.payment_method === 'cod' ? 59 : 0;
                                const discount = subtotal + codCharges - order.total_amount;

                                return (
                                    <>
                                        <div className="flex justify-between text-sm text-heritage/70">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toLocaleString()}</span>
                                        </div>

                                        {discount > 0 && (
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Discount</span>
                                                <span>-₹{discount.toLocaleString()}</span>
                                            </div>
                                        )}

                                        {codCharges > 0 && (
                                            <div className="flex justify-between text-sm text-heritage/70">
                                                <span>COD Charges</span>
                                                <span>₹{codCharges}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-copper/30">
                                            <span className="font-bold text-heritage">Total Amount</span>
                                            <span className="text-xl font-royal font-bold text-copper">₹{order.total_amount.toLocaleString()}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Review Section - Only if Delivered */}
                    {isDelivered && !reviewSubmitted && (
                        <div className="bg-white p-8 rounded-xl border border-copper/30 shadow-sm">
                            <h2 className="text-xl font-royal font-bold text-heritage mb-2">Rate & Review</h2>
                            <p className="text-heritage/60 mb-6">Tell us about your experience with the product.</p>

                            <form onSubmit={handleSubmitReview}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-heritage mb-2">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={`transition-colors ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                            >
                                                <Star size={28} fill={star <= rating ? "currentColor" : "none"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-heritage mb-2">Review (Text)</label>
                                    <textarea
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-copper focus:border-copper"
                                        rows="4"
                                        placeholder="Write your feedback here..."
                                        required
                                    ></textarea>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-heritage mb-2">Add Media (Optional)</label>
                                    <div className="flex gap-4 mb-2">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={mediaUrl}
                                                onChange={e => setMediaUrl(e.target.value)}
                                                placeholder="Paste image or video URL..."
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-heritage/50 flex gap-2 items-center">
                                        <ImageIcon size={14} /> Supports Images
                                        <Video size={14} /> Supports Video URLs
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="w-full py-3 bg-heritage text-warm-sand font-bold rounded-lg hover:bg-copper transition-colors disabled:opacity-50"
                                >
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        </div>
                    )}

                    {reviewSubmitted && (
                        <div className="bg-green-50 border border-green-200 p-8 rounded-xl text-center">
                            <CheckCircle className="mx-auto text-green-600 mb-2" size={48} />
                            <h3 className="text-xl font-bold text-green-800">Thank You!</h3>
                            <p className="text-green-700">Your review has been submitted successfully.</p>
                        </div>
                    )}

                </div>
            </main>
            <Footer />
        </>
    );
}
