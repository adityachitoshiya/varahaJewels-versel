import { useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';

export default function TelegramLoginModal({ isOpen, onClose, onAuth }) {
    const containerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);
        setError(null);

        // Skip loading real widget on localhost to avoid "Invalid Domain" error or silent failure
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            setIsLoading(false);
            return;
        }

        // Timeout to detect if script fails (e.g. adblock)
        const timeoutId = setTimeout(() => {
            if (containerRef.current && !containerRef.current.querySelector('iframe')) {
                // Only show error if still loading and no iframe appeared
                setError("Telegram widget failed to load. Please disable ad-blockers.");
                setIsLoading(false);
            }
        }, 5000); // 5 seconds timeout

        try {
            window.onTelegramAuth = (user) => {
                onAuth(user);
                onClose();
            };

            const script = document.createElement('script');
            script.src = "https://telegram.org/js/telegram-widget.js?22";
            script.setAttribute('data-telegram-login', 'VarahaJewelshelpbot');
            script.setAttribute('data-size', 'large');
            script.setAttribute('data-radius', '8');
            script.setAttribute('data-request-access', 'write');
            script.setAttribute('data-onauth', 'onTelegramAuth(user)');
            script.async = true;

            // Clean up previous instances
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                containerRef.current.appendChild(script);
            }

            // Check for iframe loading
            script.onload = () => setIsLoading(false);
            script.onerror = () => {
                setError("Failed to connect to Telegram. Please check your internet.");
                setIsLoading(false);
            };

        } catch (err) {
            console.error("Telegram Widget Error:", err);
            setError("An unexpected error occurred.");
            setIsLoading(false);
        }

        return () => {
            clearTimeout(timeoutId);
            // Optional cleanup
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-bounceIn">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-[#229ED9]/5">
                    <h3 className="text-lg font-bold text-[#229ED9] flex items-center gap-2">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                        Telegram Login
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* content */}
                <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">

                    {error ? (
                        <div className="text-center text-red-500 animate-fadeIn flex flex-col items-center gap-2">
                            <AlertCircle size={32} />
                            <p className="text-sm font-medium">{error}</p>
                            <button
                                onClick={onClose}
                                className="mt-4 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 text-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">
                                        ⚠️ Localhost Detected<br />
                                        Real Telegram login only works on live domains.
                                    </div>
                                    <button
                                        onClick={() => {
                                            onAuth({
                                                id: 123456789,
                                                first_name: "Dev",
                                                last_name: "User",
                                                username: "dev_user",
                                                photo_url: "",
                                                auth_date: Math.floor(Date.now() / 1000),
                                                hash: "mock_hash"
                                            });
                                            onClose();
                                        }}
                                        className="bg-[#229ED9] text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:bg-[#1a8bc4] transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z" /></svg>
                                        Simulate Login (Dev Mode)
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div
                                        ref={containerRef}
                                        className="scale-110 origin-center min-h-[50px] flex items-center justify-center"
                                    ></div>

                                    <div className="mt-6 text-xs text-center text-gray-400 max-w-[200px]">
                                        Please accept the request in your Telegram app to continue.
                                    </div>
                                </>
                            )}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
