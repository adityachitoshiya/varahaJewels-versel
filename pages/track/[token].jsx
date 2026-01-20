import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Package, RefreshCw, ExternalLink, ArrowLeft } from 'lucide-react';
import OrderStepper from '../../components/OrderStepper';
import { getApiUrl } from '../../lib/config';

export default function TrackOrder() {
    const router = useRouter();
    const { token } = router.query; // token format: ORDER_ID_HASH

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [trackingData, setTrackingData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (token) {
            fetchTracking();
        }
    }, [token]);

    const fetchTracking = async () => {
        try {
            setLoading(true);
            setError('');

            // Parse token: order_id + hash
            const parts = token.split('_');
            if (parts.length < 2) {
                setError('Invalid tracking link');
                return;
            }

            const order_id = parts.slice(0, -1).join('_'); // Everything except last part
            const hash = parts[parts.length - 1]; // Last part is hash

            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/track/${order_id}/${hash}`);

            if (!res.ok) {
                if (res.status === 403) {
                    setError('Invalid or expired tracking link');
                } else if (res.status === 404) {
                    setError('Order not found');
                } else {
                    setError('Failed to load tracking');
                }
                return;
            }

            const data = await res.json();
            setTrackingData(data);
        } catch (err) {
            console.error('Tracking fetch error:', err);
            setError('Failed to load tracking information');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchTracking();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-warm-sand to-ivory-smoke flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-copper/30 border-t-copper rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600">Loading tracking information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-warm-sand to-ivory-smoke flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <Package size={64} className="text-gray-300 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Tracking Unavailable</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/" className="text-copper hover:underline font-medium">
                        ← Back to Varaha Jewels
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Track Order {trackingData?.order_id} | Varaha Jewels</title>
                <meta name="robots" content="noindex" />
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-warm-sand to-ivory-smoke py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-copper transition-colors">
                            <ArrowLeft size={20} />
                            <span className="text-sm font-medium">Back</span>
                        </Link>
                        <Image
                            src="/varaha-assets/logo.png"
                            alt="Varaha Jewels"
                            width={120}
                            height={40}
                            className="h-8 w-auto"
                        />
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-copper to-heritage p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs opacity-80 uppercase tracking-wider">Order</p>
                                    <h1 className="text-xl font-bold">{trackingData?.order_id}</h1>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                    title="Refresh Tracking"
                                >
                                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            {trackingData?.awb_number && (
                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <span className="opacity-80">AWB:</span>
                                    <span className="font-mono font-bold">{trackingData.awb_number}</span>
                                    <span className="opacity-60">•</span>
                                    <span className="opacity-80">{trackingData.courier_name}</span>
                                </div>
                            )}
                        </div>

                        {/* Stepper Content */}
                        <div className="p-6">
                            {trackingData?.customer_name && (
                                <p className="text-sm text-gray-600 mb-6">
                                    Hi <span className="font-medium text-gray-800">{trackingData.customer_name}</span>,
                                    here&apos;s your order status:
                                </p>
                            )}

                            <OrderStepper
                                steps={trackingData?.steps || []}
                                currentStep={trackingData?.current_step || 1}
                                trackingHistory={trackingData?.tracking_history || []}
                            />
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 p-4 bg-gray-50 text-center">
                            <p className="text-xs text-gray-500">
                                Need help? Contact <a href="mailto:support@varahajewels.com" className="text-copper hover:underline">support@varahajewels.com</a>
                            </p>
                        </div>
                    </div>

                    {/* Courier Tracking Link */}
                    {trackingData?.awb_number && (
                        <div className="mt-4 text-center">
                            <a
                                href={`https://www.delhivery.com/track/package/${trackingData.awb_number}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-copper transition-colors"
                            >
                                Track on Courier Website <ExternalLink size={14} />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
