import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getApiUrl, getAuthHeaders } from '../lib/config';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PaymentCallback() {
    const router = useRouter();
    const [status, setStatus] = useState('checking'); // checking, confirming, success, failed
    const [message, setMessage] = useState('Verifying your payment...');
    const [orderData, setOrderData] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 10;

    useEffect(() => {
        if (!router.isReady) return;

        const { txnId, orderId } = router.query;
        const transactionId = txnId || orderId;

        if (!transactionId) {
            setStatus('failed');
            setMessage('Invalid payment callback. No transaction ID found.');
            return;
        }

        // Get stored order data from sessionStorage
        const getPendingOrder = () => {
            try {
                const stored = sessionStorage.getItem('pending_order');
                if (stored) {
                    return JSON.parse(stored);
                }
            } catch (e) {
                console.error('Error parsing pending order:', e);
            }
            return null;
        };

        // Confirm order with backend (creates order in DB)
        const confirmOrder = async (pendingOrder) => {
            try {
                setStatus('confirming');
                setMessage('Creating your order...');

                const API_URL = getApiUrl();
                const token = localStorage.getItem('customer_token') || localStorage.getItem('token');

                const response = await fetch(`${API_URL}/api/phonepe/confirm-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        transaction_id: transactionId,
                        orderId: transactionId,
                        order_data: pendingOrder
                    })
                });

                const data = await response.json();
                console.log('Order Confirmation Response:', data);

                if (data.ok) {
                    // Clear pending order
                    sessionStorage.removeItem('pending_order');
                    localStorage.removeItem('cart');

                    setStatus('success');
                    setMessage('Order placed successfully!');
                    setOrderData(data);

                    // Redirect to success page
                    setTimeout(() => {
                        router.push({
                            pathname: '/payment-success',
                            query: {
                                orderId: data.orderId || transactionId,
                                amount: data.amount || pendingOrder?.amount || 0,
                                provider: 'phonepe',
                                email: pendingOrder?.email,
                                name: pendingOrder?.name
                            }
                        });
                    }, 2000);
                } else {
                    setStatus('failed');
                    setMessage(data.message || 'Order confirmation failed');
                }
            } catch (error) {
                console.error('Order confirmation error:', error);
                setStatus('failed');
                setMessage('Failed to create order. Please contact support.');
            }
        };

        // Check payment status with backend
        const checkPaymentStatus = async () => {
            try {
                const API_URL = getApiUrl();
                const response = await fetch(`${API_URL}/api/phonepe/status/${transactionId}`);
                const data = await response.json();

                console.log('Payment Status:', data);

                if (data.success && data.status === 'SUCCESS') {
                    // Payment successful - now confirm order
                    const pendingOrder = getPendingOrder();

                    if (pendingOrder) {
                        await confirmOrder(pendingOrder);
                    } else {
                        // No pending order data - maybe already processed or lost
                        setStatus('success');
                        setMessage('Payment successful! Redirecting...');

                        setTimeout(() => {
                            router.push({
                                pathname: '/payment-success',
                                query: {
                                    orderId: transactionId,
                                    amount: data.amount ? data.amount / 100 : 0,
                                    provider: 'phonepe'
                                }
                            });
                        }, 2000);
                    }
                } else if (data.status === 'PENDING' || data.status === 'PAYMENT_PENDING' || data.status === 'INITIATED') {
                    setStatus('checking');
                    setMessage('Payment is being processed. Please wait...');

                    // Retry with exponential backoff
                    if (retryCount < MAX_RETRIES) {
                        setRetryCount(prev => prev + 1);
                        setTimeout(checkPaymentStatus, Math.min(3000 + retryCount * 1000, 10000));
                    } else {
                        setStatus('failed');
                        setMessage('Payment verification timed out. If amount was deducted, please contact support.');
                    }
                } else if (data.status === 'AUTH_FAILED') {
                    setStatus('failed');
                    setMessage('Payment verification failed. Please contact support.');
                } else {
                    setStatus('failed');
                    setMessage(data.message || 'Payment failed or was cancelled.');
                }
            } catch (error) {
                console.error('Payment status check error:', error);

                if (retryCount < 3) {
                    setRetryCount(prev => prev + 1);
                    setTimeout(checkPaymentStatus, 3000);
                } else {
                    setStatus('failed');
                    setMessage('Unable to verify payment status. Please contact support.');
                }
            }
        };

        checkPaymentStatus();
    }, [router.isReady, router.query]);

    return (
        <>
            <Head>
                <title>Payment Status - Varaha Jewels</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-warm-sand via-white to-copper/10 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">

                    {/* Status Icon */}
                    <div className="mb-6">
                        {(status === 'checking' || status === 'confirming') && (
                            <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                        )}
                        {status === 'failed' && (
                            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-600" />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {status === 'checking' && 'Verifying Payment'}
                        {status === 'confirming' && 'Creating Order'}
                        {status === 'success' && 'Payment Successful!'}
                        {status === 'failed' && 'Payment Failed'}
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">{message}</p>

                    {/* Retry Count */}
                    {status === 'checking' && retryCount > 0 && (
                        <p className="text-xs text-gray-400 mb-4">
                            Checking... ({retryCount}/{MAX_RETRIES})
                        </p>
                    )}

                    {/* Transaction ID */}
                    {(router.query.txnId || router.query.orderId) && (
                        <p className="text-xs text-gray-400 mb-6">
                            Transaction ID: {router.query.txnId || router.query.orderId}
                        </p>
                    )}

                    {/* Actions */}
                    {status === 'failed' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/checkout')}
                                className="w-full bg-heritage text-white py-3 rounded-lg font-semibold hover:bg-heritage/90 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Go to Home
                            </button>
                        </div>
                    )}

                    {status === 'success' && (
                        <p className="text-sm text-gray-500">
                            Redirecting to order confirmation...
                        </p>
                    )}

                </div>
            </div>
        </>
    );
}
