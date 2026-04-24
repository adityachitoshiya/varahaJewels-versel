import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getApiUrl } from '../lib/config';
import OrderStepper from '../components/OrderStepper';
import { Package, Search, ChevronRight, ArrowRight, MapPin, Truck, CheckCircle, Clock, Mail, Phone, ExternalLink } from 'lucide-react';

export default function TrackOrder() {
    const [searchType, setSearchType] = useState('email'); // 'email' or 'phone'
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!searchValue.trim()) {
            setError('Please enter your email or phone number');
            return;
        }

        setLoading(true);
        setError('');
        setOrders(null);

        try {
            const API_URL = getApiUrl();
            const payload = searchType === 'email' 
                ? { email: searchValue.trim() } 
                : { phone: searchValue.trim() };

            const res = await fetch(`${API_URL}/api/track/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || 'No orders found. Please check your details.');
                return;
            }

            const data = await res.json();
            setOrders(data.orders || []);
            
            // Auto-expand first order
            if (data.orders && data.orders.length > 0) {
                setExpandedOrder(data.orders[0].order_id);
            }
        } catch (err) {
            console.error('Track lookup error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            'pending': 'Order Placed',
            'ordered': 'Order Confirmed',
            'packed': 'Packed',
            'shipped': 'Shipped',
            'in_transit': 'In Transit',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
            'rto': 'Return Initiated',
            'rto_delivered': 'Returned'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'shipped': case 'in_transit': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'out_for_delivery': return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'cancelled': case 'rto': case 'rto_delivered': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-copper/10 text-heritage border-copper/30';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'delivered': return <CheckCircle size={16} className="text-emerald-600" />;
            case 'shipped': case 'in_transit': return <Truck size={16} className="text-blue-600" />;
            case 'out_for_delivery': return <MapPin size={16} className="text-amber-600" />;
            default: return <Clock size={16} className="text-copper" />;
        }
    };

    return (
        <>
            <Head>
                <title>Track Your Order | Varaha Jewels</title>
                <meta name="description" content="Track your Varaha Jewels order using your email or phone number. Get real-time updates on your order status." />
            </Head>

            <Header />

            <main className="min-h-screen bg-gradient-to-b from-warm-sand via-white to-warm-sand">
                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-heritage/5 via-transparent to-copper/5" />
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8 sm:pt-16 sm:pb-12 relative">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-copper/10 border border-copper/20 rounded-full text-xs font-medium text-copper tracking-wider uppercase mb-6">
                                <Package size={14} />
                                Order Tracking
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-royal font-bold text-heritage mb-4 leading-tight">
                                Track Your Order
                            </h1>
                            <p className="text-heritage/60 text-base sm:text-lg max-w-xl mx-auto">
                                Enter your email or phone number to see the status of your orders
                            </p>
                        </div>

                        {/* Search Card */}
                        <div className="bg-white rounded-2xl shadow-xl border border-heritage/10 p-6 sm:p-8 max-w-2xl mx-auto">
                            {/* Toggle Email/Phone */}
                            <div className="flex bg-warm-sand rounded-xl p-1 mb-6">
                                <button
                                    onClick={() => { setSearchType('email'); setSearchValue(''); setError(''); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                                        searchType === 'email' 
                                            ? 'bg-white text-heritage shadow-md' 
                                            : 'text-heritage/60 hover:text-heritage'
                                    }`}
                                >
                                    <Mail size={16} />
                                    Email
                                </button>
                                <button
                                    onClick={() => { setSearchType('phone'); setSearchValue(''); setError(''); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                                        searchType === 'phone' 
                                            ? 'bg-white text-heritage shadow-md' 
                                            : 'text-heritage/60 hover:text-heritage'
                                    }`}
                                >
                                    <Phone size={16} />
                                    Phone
                                </button>
                            </div>

                            {/* Search Form */}
                            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-heritage/40">
                                        {searchType === 'email' ? <Mail size={20} /> : <Phone size={20} />}
                                    </div>
                                    <input
                                        type={searchType === 'email' ? 'email' : 'tel'}
                                        value={searchValue}
                                        onChange={(e) => { setSearchValue(e.target.value); setError(''); }}
                                        placeholder={searchType === 'email' ? 'Enter your email address' : 'Enter your phone number'}
                                        className="w-full pl-12 pr-4 py-4 border-2 border-heritage/15 rounded-xl focus:outline-none focus:border-copper focus:ring-2 focus:ring-copper/20 bg-white text-heritage placeholder:text-heritage/35 transition-all text-base"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-4 bg-gradient-to-r from-heritage to-heritage/90 text-white font-semibold rounded-xl hover:from-copper hover:to-copper/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Search size={18} />
                                            Track
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Error */}
                            {error && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                                    <Package size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Results Section */}
                {orders && (
                    <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
                        {orders.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg border border-heritage/10 p-12 text-center">
                                <Package size={64} className="text-heritage/20 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-heritage mb-2">No Orders Found</h2>
                                <p className="text-heritage/60 mb-6">We couldn&apos;t find any orders with the details provided.</p>
                                <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-copper text-white rounded-xl font-medium hover:bg-heritage transition-colors">
                                    Start Shopping <ArrowRight size={16} />
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Results Header */}
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <p className="text-sm text-heritage/60">
                                        Found <span className="font-semibold text-heritage">{orders.length}</span> order{orders.length > 1 ? 's' : ''}
                                    </p>
                                </div>

                                {/* Order Cards */}
                                {orders.map((order) => (
                                    <div 
                                        key={order.order_id} 
                                        className="bg-white rounded-2xl shadow-lg border border-heritage/10 overflow-hidden transition-all duration-300 hover:shadow-xl"
                                    >
                                        {/* Order Header */}
                                        <button
                                            onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                                            className="w-full p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left hover:bg-warm-sand/30 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-copper/10 to-heritage/10 flex items-center justify-center flex-shrink-0">
                                                    {getStatusIcon(order.status)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                        <h3 className="text-base font-bold text-heritage">
                                                            {order.order_id}
                                                        </h3>
                                                        <span className={`px-2.5 py-0.5 text-xs font-semibold border rounded-full ${getStatusColor(order.status)}`}>
                                                            {getStatusLabel(order.status)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-heritage/50">
                                                        {order.product_names?.slice(0, 2).join(', ')}
                                                        {order.item_count > 2 && ` +${order.item_count - 2} more`}
                                                    </p>
                                                    <p className="text-xs text-heritage/40 mt-1">
                                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'long', year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 sm:ml-auto">
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-heritage">
                                                        ₹{order.total_amount?.toLocaleString('en-IN')}
                                                    </p>
                                                    <p className="text-xs text-heritage/40 uppercase tracking-wider">
                                                        {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                                                    </p>
                                                </div>
                                                <ChevronRight 
                                                    size={20} 
                                                    className={`text-heritage/30 transition-transform duration-300 hidden sm:block ${
                                                        expandedOrder === order.order_id ? 'rotate-90' : ''
                                                    }`} 
                                                />
                                            </div>
                                        </button>

                                        {/* Expanded Tracking */}
                                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                            expandedOrder === order.order_id ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}>
                                            <div className="px-5 sm:px-6 pb-6 border-t border-heritage/10">
                                                {/* Order Stepper */}
                                                <div className="py-6">
                                                    <OrderStepper
                                                        steps={order.steps || []}
                                                        currentStep={order.current_step || 1}
                                                        trackingHistory={[]}
                                                    />
                                                </div>

                                                {/* AWB & Tracking Link */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-heritage/10">
                                                    {order.awb_number ? (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Truck size={16} className="text-copper" />
                                                            <span className="text-heritage/60">AWB:</span>
                                                            <span className="font-mono font-semibold text-heritage">{order.awb_number}</span>
                                                            {order.courier_name && (
                                                                <span className="text-heritage/40">• {order.courier_name}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-heritage/50 italic">Tracking details will be available once shipped</p>
                                                    )}
                                                    
                                                    <Link
                                                        href={order.tracking_url || '#'}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-heritage text-white text-sm font-medium rounded-lg hover:bg-copper transition-colors"
                                                    >
                                                        View Full Details <ExternalLink size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Help Section */}
                {!orders && (
                    <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
                        <div className="grid sm:grid-cols-3 gap-6 mt-4">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-heritage/8 text-center">
                                <div className="w-12 h-12 rounded-full bg-copper/10 flex items-center justify-center mx-auto mb-4">
                                    <Mail size={22} className="text-copper" />
                                </div>
                                <h3 className="font-semibold text-heritage mb-2">Track via Email</h3>
                                <p className="text-sm text-heritage/55 leading-relaxed">Enter the same email you used while placing your order</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-heritage/8 text-center">
                                <div className="w-12 h-12 rounded-full bg-copper/10 flex items-center justify-center mx-auto mb-4">
                                    <Phone size={22} className="text-copper" />
                                </div>
                                <h3 className="font-semibold text-heritage mb-2">Track via Phone</h3>
                                <p className="text-sm text-heritage/55 leading-relaxed">Enter your phone number associated with the order</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-heritage/8 text-center">
                                <div className="w-12 h-12 rounded-full bg-copper/10 flex items-center justify-center mx-auto mb-4">
                                    <Package size={22} className="text-copper" />
                                </div>
                                <h3 className="font-semibold text-heritage mb-2">Real-time Updates</h3>
                                <p className="text-sm text-heritage/55 leading-relaxed">Get live tracking updates from order placement to delivery</p>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </>
    );
}
