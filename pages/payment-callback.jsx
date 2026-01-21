import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getApiUrl } from '../lib/config';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PaymentCallback() {
    const router = useRouter();
    const [status, setStatus] = useState('checking'); // checking, success, failed
    const [message, setMessage] = useState('Verifying your payment...');
    const [orderData, setOrderData] = useState(null);

    useEffect(() => {
        if (!router.isReady) return;

        const { txnId, orderId } = router.query;
        const transactionId = txnId || orderId;

        if (!transactionId) {
            setStatus('failed');
            setMessage('Invalid payment callback. No transaction ID found.');
            return;
        }

        // Check payment status with backend
        const checkPaymentStatus = async () => {
            try {
                const API_URL = getApiUrl();
                const response = await fetch(`${API_URL}/api/phonepe/status/${transactionId}`);
                const data = await response.json();

                console.log('Payment Status:', data);

                if (data.success && data.status === 'SUCCESS') {
                    setStatus('success');
                    setMessage('Payment successful! Your order has been placed.');
                    setOrderData(data);

                    // Redirect to success page after delay
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
                } else if (data.status === 'PENDING' || data.status === 'PAYMENT_PENDING') {
                    setStatus('checking');
                    setMessage('Payment is being processed. Please wait...');

                    // Retry after 3 seconds
                    setTimeout(checkPaymentStatus, 3000);
                } else {
                    setStatus('failed');
                    setMessage(data.message || 'Payment failed or was cancelled.');
                }
            } catch (error) {
                console.error('Payment status check error:', error);
                setStatus('failed');
                setMessage('Unable to verify payment status. Please contact support.');
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
                        {status === 'checking' && (
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
                        {status === 'success' && 'Payment Successful!'}
                        {status === 'failed' && 'Payment Failed'}
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">{message}</p>

                    {/* Transaction ID */}
                    {router.query.txnId && (
                        <p className="text-xs text-gray-400 mb-6">
                            Transaction ID: {router.query.txnId}
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
