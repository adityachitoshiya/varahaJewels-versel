import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { getApiUrl, getAdminHeaders } from '../../lib/config';

// On/off switch for Razorpay Magic Checkout.
export default function MagicToggle() {
    const [enabled, setEnabled] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${getApiUrl()}/api/admin/magic-setting`, { headers: getAdminHeaders(false) })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setEnabled(!!d.enabled))
            .catch(() => setError('Could not load this setting.'));
    }, []);

    const flip = async () => {
        if (enabled === null || busy) return;
        setBusy(true); setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/admin/magic-setting`, {
                method: 'PUT', headers: getAdminHeaders(true), body: JSON.stringify({ enabled: !enabled }),
            });
            if (!res.ok) throw new Error();
            setEnabled((await res.json()).enabled);
        } catch { setError('Could not save. Try again.'); }
        finally { setBusy(false); }
    };

    return (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
            <span className="w-10 h-10 rounded-full bg-[#2a150c] text-[#E8C9A0] flex items-center justify-center flex-shrink-0"><Zap size={20} /></span>
            <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900">Razorpay Magic Checkout</h2>
                <p className="text-sm text-gray-500 mt-0.5">One-tap checkout with saved addresses and coupons shown inside the payment window. When off, the normal checkout is used.</p>
                <p className="mt-2 text-sm text-amber-700">Switches the live checkout for every shopper. Place one test order yourself right after turning it on.</p>
                {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <button
                type="button" role="switch" aria-checked={!!enabled} aria-label="Razorpay Magic Checkout"
                onClick={flip} disabled={enabled === null || busy}
                className={`relative w-12 h-7 rounded-full flex-shrink-0 transition-colors disabled:opacity-50 ${enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
            </button>
        </div>
    );
}
