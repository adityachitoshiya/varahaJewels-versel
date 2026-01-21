import { useEffect, useCallback, useState } from 'react';
import { MSG91_CONFIG, getApiUrl, getAuthHeaders } from '../lib/config';

/**
 * MSG91 OTP Widget Hook
 * Usage:
 *   const { initOTP, verifyOTP, isLoaded, error } = useMsg91OTP({
 *     onSuccess: (data) => console.log('Verified!', data),
 *     onFailure: (error) => console.log('Failed:', error)
 *   });
 * 
 *   // To trigger OTP popup:
 *   initOTP('919876543210');
 */

export const useMsg91OTP = ({ onSuccess, onFailure }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        // Load MSG91 OTP Script if not already loaded
        if (typeof window !== 'undefined' && !window.initSendOTP) {
            const loadScript = (urls, index = 0) => {
                if (index >= urls.length) {
                    setError('Failed to load MSG91 OTP script');
                    return;
                }

                const script = document.createElement('script');
                script.src = urls[index];
                script.async = true;

                script.onload = () => {
                    if (typeof window.initSendOTP === 'function') {
                        setIsLoaded(true);
                        console.log('MSG91 OTP Script loaded successfully');
                    }
                };

                script.onerror = () => {
                    console.warn(`Failed to load from ${urls[index]}, trying next...`);
                    loadScript(urls, index + 1);
                };

                document.head.appendChild(script);
            };

            loadScript([
                'https://verify.msg91.com/otp-provider.js',
                'https://verify.phone91.com/otp-provider.js'
            ]);
        } else if (typeof window.initSendOTP === 'function') {
            setIsLoaded(true);
        }
    }, []);

    // Verify access token with backend
    const verifyWithBackend = useCallback(async (accessToken) => {
        setIsVerifying(true);
        try {
            const response = await fetch(`${getApiUrl()}/api/verify-otp`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ access_token: accessToken })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return { success: true, phone: data.phone, country_code: data.country_code };
            } else {
                throw new Error(data.detail || 'Verification failed');
            }
        } catch (err) {
            console.error('Backend verification error:', err);
            throw err;
        } finally {
            setIsVerifying(false);
        }
    }, []);

    const initOTP = useCallback((mobileNumber) => {
        if (!isLoaded || typeof window.initSendOTP !== 'function') {
            console.error('MSG91 OTP not loaded yet');
            onFailure?.({ message: 'OTP service not ready' });
            return;
        }

        // Ensure mobile number has country code
        const formattedMobile = mobileNumber.startsWith('91')
            ? mobileNumber
            : `91${mobileNumber.replace(/^0+/, '')}`;

        const configuration = {
            widgetId: MSG91_CONFIG.widgetId,
            tokenAuth: MSG91_CONFIG.tokenAuth,
            identifier: formattedMobile,
            exposeMethods: true,
            success: async (data) => {
                console.log('OTP Widget Success:', data);

                // Verify token with backend
                try {
                    const backendResult = await verifyWithBackend(data.token || data.accessToken);
                    onSuccess?.({ ...data, ...backendResult, verified: true });
                } catch (err) {
                    onFailure?.({ message: 'Backend verification failed', error: err });
                }
            },
            failure: (error) => {
                console.error('OTP Widget Failed:', error);
                onFailure?.(error);
            }
        };

        window.initSendOTP(configuration);
    }, [isLoaded, onSuccess, onFailure, verifyWithBackend]);

    // For exposeMethods: true - manual verification
    const verifyOTP = useCallback((otp) => {
        if (typeof window.verifyOtp === 'function') {
            window.verifyOtp(otp);
        } else {
            console.error('verifyOtp method not exposed. Set exposeMethods: true');
        }
    }, []);

    const resendOTP = useCallback((type = 'text') => {
        if (typeof window.retryOtp === 'function') {
            window.retryOtp(type); // 'text' or 'voice'
        } else {
            console.error('retryOtp method not exposed');
        }
    }, []);

    return {
        initOTP,
        verifyOTP,
        resendOTP,
        isLoaded,
        isVerifying,
        error
    };
};

export default useMsg91OTP;
