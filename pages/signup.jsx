import { useState } from 'react';
import { getApiUrl } from '../lib/config';
import { useGoogleLogin } from '@react-oauth/google';
import { authenticateWithGoogleBackend } from '../lib/authUtils';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { User, Mail, Lock, AlertCircle, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Google OAuth sign-in via Google Identity Services
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError(null);
            try {
                const result = await authenticateWithGoogleBackend(tokenResponse.access_token);
                if (!result.success) throw new Error(result.error || 'Backend authentication failed');
                setSuccess(true);
                setTimeout(() => router.push('/'), 1500);
            } catch (err) {
                setError('Google Sign Up Failed: ' + (err.message || 'Please try again.'));
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError('Google Sign Up Failed. Please try again.');
            setLoading(false);
        },
    });

    const [existingAccount, setExistingAccount] = useState(null);

    const checkEmail = async (email) => {
        if (!email || !email.includes('@')) return;
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/auth/check-email?email=${email}`);
            const data = await res.json();
            if (data.exists) {
                setExistingAccount(data);
                if (data.is_guest) {
                    // Pre-fill name if available
                    if (data.full_name && !formData.full_name) {
                        setFormData(prev => ({ ...prev, full_name: data.full_name }));
                    }
                }
            } else {
                setExistingAccount(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);

        if (e.target.name === 'email') {
            setExistingAccount(null); // Reset while typing
        }
    };

    const handleEmailBlur = () => {
        checkEmail(formData.email);
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const API_URL = getApiUrl();
            
            // Create user via backend API (stores in Supabase PostgreSQL)
            const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    email: formData.email,
                    password: formData.password
                })
            });

            if (!signupRes.ok) {
                const errData = await signupRes.json();
                throw new Error(errData.detail || "Registration failed");
            }

            // Signup successful - now login to get token
            const loginRes = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            if (loginRes.ok) {
                const loginData = await loginRes.json();
                
                const userData = {
                    id: loginData.user?.id,
                    full_name: formData.full_name,
                    name: formData.full_name,
                    email: formData.email,
                    role: 'customer'
                };

                localStorage.setItem('customer_token', loginData.access_token);
                localStorage.setItem('customer_user', JSON.stringify(userData));

                setSuccess(true);
                setTimeout(() => router.push('/'), 1500);
            } else {
                // Signup worked but auto-login failed - send to login page
                setSuccess(true);
                setTimeout(() => router.push('/login?registered=true'), 2000);
            }

        } catch (err) {
            console.error("Signup error:", err);
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle Google signup (uses Google OAuth 2.0)
    const handleGoogleSignup = () => {
        setLoading(true);
        setError(null);
        googleLogin();
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head>
                <title>Create Account | Varaha Jewels™</title>
            </Head>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link href="/" className="flex justify-center mb-6">
                    <img
                        className="h-16 w-auto"
                        src="/varaha-assets/logo.png"
                        alt="Varaha Jewels"
                        onError={(e) => { e.target.src = 'https://res.cloudinary.com/dd5zrsmok/image/upload/v1766342264/logo_hvef6t.png'; }}
                    />
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-serif">
                    Join the Royal Family
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Create an account to unlock exclusive privileges
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSignup}>
                        {success && (
                            <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <CheckCircle size={16} />
                                Account created successfully! Redirecting...
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    name="full_name"
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="focus:ring-copper focus:border-copper block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="focus:ring-copper focus:border-copper block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5"
                                    placeholder="you@example.com"
                                    onBlur={handleEmailBlur}
                                />
                            </div>
                            {existingAccount && (
                                <div className={`mt-2 text-sm p-3 rounded-lg flex items-start gap-2 ${existingAccount.is_guest ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <div>
                                        {existingAccount.is_guest ? (
                                            <>
                                                <strong>Account Found!</strong>
                                                <p>You have placed orders as a guest. Create a password now to claim your account and view order history.</p>
                                            </>
                                        ) : (
                                            <>
                                                <strong>Already Registered</strong>
                                                <p>An account exists with this email. <Link href="/login" className="underline font-semibold">Sign in here</Link>.</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="focus:ring-copper focus:border-copper block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    name="confirm_password"
                                    type="password"
                                    required
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="focus:ring-copper focus:border-copper block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-heritage hover:bg-heritage/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-copper transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2" size={18} />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account <ArrowRight className="ml-2" size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="my-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-400 font-medium">
                                Or sign up with
                            </span>
                        </div>
                    </div>

                    {/* Google Sign Up Button */}
                    <button
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                    >
                        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link href="/login" className="font-medium text-copper hover:text-heritage transition-colors">
                                Sign in instead
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-copper/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-heritage/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
}
