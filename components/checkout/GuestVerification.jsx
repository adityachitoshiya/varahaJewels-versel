import { useState, useEffect, useRef } from 'react';
import { Phone, Mail, ArrowRight, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../../lib/config';

export default function GuestVerification({ onVerificationSuccess }) {
    const [step, setStep] = useState(1); // 1: Contact, 2: OTP, 3: Success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        createAccount: true
    });

    // OTP State
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const otpInputRefs = useRef([]);

    // Timer logic
    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    // Handle Input Changes
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Backend API Call
        try {
            const res = await fetch(`${getApiUrl()}/api/otp/send-custom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    email: formData.email
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setStep(2);
                setTimer(60);
            } else {
                setError(data.detail || data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Handle OTP Input
    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1].focus();
        }

        // Auto-submit if filled
        if (newOtp.join('').length === 6) {
            handleVerifyOtp(null, newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1].focus();
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e, codeOverride = null) => {
        if (e) e.preventDefault();
        const code = codeOverride || otp.join('');
        if (code.length !== 6) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${getApiUrl()}/api/otp/verify-custom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    email: formData.email,
                    otp: code,
                    name: formData.email.split('@')[0] // Fallback name
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setStep(3);

                // Auto-redirect callback after delay
                setTimeout(() => {
                    onVerificationSuccess({
                        email: formData.email,
                        phone: formData.phone,
                        auth_token: data.auth_token
                    });
                }, 2000);
            } else {
                setError(data.detail || 'Invalid OTP');
                setOtp(['', '', '', '', '', '']); // Clear OTP
                otpInputRefs.current[0].focus();
            }
        } catch (err) {
            setError('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fadeIn">
            {/* Header Visual */}
            <div className="bg-heritage/5 p-6 text-center border-b border-heritage/10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mb-3">
                    <ShieldCheck className="text-heritage" size={24} />
                </div>
                <h3 className="text-xl font-royal font-bold text-gray-900">Secure Checkout</h3>
                <p className="text-sm text-gray-500 mt-1">Verify details for faster delivery</p>
            </div>

            <div className="p-6">
                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                            <div className="relative">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none transition-all"
                                    placeholder="name@example.com"
                                />
                                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                            <div className="relative">
                                <input
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none transition-all"
                                    placeholder="+91 98765 43210"
                                />
                                <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <input
                                type="checkbox"
                                id="createAccount"
                                checked={formData.createAccount}
                                onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                                className="w-4 h-4 text-heritage border-gray-300 rounded focus:ring-heritage"
                            />
                            <label htmlFor="createAccount" className="text-sm text-gray-600 cursor-pointer select-none">
                                Create an account for faster checkout next time
                            </label>
                        </div>

                        {error && <p className="text-xs text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-heritage text-white rounded-xl font-semibold shadow-lg hover:bg-heritage/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Send Code <ArrowRight size={18} /></>}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="space-y-6 text-center">
                        <div className="bg-copper/10 text-copper text-xs font-medium px-4 py-2 rounded-full inline-block">
                            Code sent to {formData.phone}
                        </div>

                        <div className="flex justify-center gap-2">
                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => otpInputRefs.current[idx] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={otp[idx]}
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className="w-10 h-12 text-center text-xl font-bold border border-gray-200 rounded-lg focus:border-heritage focus:ring-1 focus:ring-heritage outline-none transition-all bg-gray-50 focus:bg-white"
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <button
                                onClick={() => setStep(1)}
                                className="text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Change Number
                            </button>
                            {timer > 0 ? (
                                <span className="text-gray-400">Resend in {timer}s</span>
                            ) : (
                                <button
                                    onClick={handleSendOtp}
                                    className="text-heritage font-semibold hover:underline"
                                >
                                    Resend Code
                                </button>
                            )}
                        </div>

                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                        <button
                            onClick={(e) => handleVerifyOtp(e)}
                            disabled={loading || otp.join('').length !== 6}
                            className="w-full py-3.5 bg-heritage text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-heritage/90 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Continue'}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Verified Successfully!</h3>
                        <p className="text-sm text-gray-500">Redirecting to shipping details...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
