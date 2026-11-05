import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getApiUrl, getAdminHeaders } from '../../lib/config';

// On/off switch for the mobile OTP that Cash on Delivery orders need.
export default function OtpToggle() {
    const [state, setState] = useState(null); // { enabled, configured }
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${getApiUrl()}/api/admin/otp-setting`, { headers: getAdminHeaders(false) })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then(setState)
            .catch(() => setError('Could not load this setting.'));
    }, []);

    const flip = async () => {
        if (!state || busy) return;
        setBusy(true); setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/admin/otp-setting`, {
                method: 'PUT', headers: getAdminHeaders(true), body: JSON.stringify({ enabled: !state.enabled }),
            });
            if (!res.ok) throw new Error();
            setState(await res.json());
        } catch { setError('Could not save. Try again.'); }
        finally { setBusy(false); }
    };

    const live = state?.enabled && state?.configured;
    return (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
            <span className="w-10 h-10 rounded-full bg-[#2a150c] text-[#E8C9A0] flex items-center justify-center flex-shrink-0"><ShieldCheck size={20} /></span>
            <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900">Mobile OTP for Cash on Delivery</h2>
                <p className="text-sm text-gray-500 mt-0.5">When on, a customer must confirm their mobile number with an OTP before a COD order is placed. Online (prepaid) orders never ask for it.</p>
                {state && !state.configured && (
                    <p className="mt-2 text-sm text-amber-700">The OTP service key is not set on the server yet, so no OTP is asked even if this is on.</p>
                )}
                {state && state.configured && (
                    <p className={`mt-2 text-sm font-medium ${live ? 'text-emerald-700' : 'text-gray-500'}`}>{live ? 'OTP is being asked on COD orders.' : 'OTP is off. COD orders go through without it.'}</p>
                )}
                {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <button
                type="button" role="switch" aria-checked={!!state?.enabled} aria-label="Mobile OTP for Cash on Delivery"
                onClick={flip} disabled={!state || busy}
                className={`relative w-12 h-7 rounded-full flex-shrink-0 transition-colors disabled:opacity-50 ${state?.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${state?.enabled ? 'translate-x-5' : ''}`} />
            </button>
        </div>
    );
}
