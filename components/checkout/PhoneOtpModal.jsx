import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { getApiUrl } from '../../lib/config';

// Asks the shopper to confirm their mobile number with an OTP (needed for Cash on
// Delivery). Calls onVerified(proof) once the server accepts the code.
export default function PhoneOtpModal({ phone, onVerified, onClose }) {
    const [session, setSession] = useState('');
    const [otp, setOtp] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [wait, setWait] = useState(0);
    const sentOnce = useRef(false);

    const digits = (phone || '').replace(/\D/g, '').slice(-10);

    const send = async () => {
        setBusy(true); setError(''); setOtp('');
        try {
            const res = await fetch(`${getApiUrl()}/api/otp/send`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: digits }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || 'Could not send the OTP');
            setSession(data.otp_session);
            setWait(45);
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    useEffect(() => {
        if (sentOnce.current) return;
        sentOnce.current = true;
        send();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (wait <= 0) return undefined;
        const t = setTimeout(() => setWait((w) => w - 1), 1000);
        return () => clearTimeout(t);
    }, [wait]);

    const verify = async (e) => {
        e?.preventDefault();
        if (otp.length < 4) { setError('Enter the OTP you received'); return; }
        setBusy(true); setError('');
        try {
            const res = await fetch(`${getApiUrl()}/api/otp/verify`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: digits, otp, otp_session: session }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || 'Wrong OTP');
            onVerified(data.phone_proof);
        } catch (err) { setError(err.message); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Verify your mobile number">
            <form onSubmit={verify} className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-[#2a150c] text-[#E8C9A0] flex items-center justify-center"><ShieldCheck size={20} /></span>
                        <div>
                            <h2 className="font-semibold text-lg text-[#2a150c]">Verify your mobile</h2>
                            <p className="text-sm text-[#2a150c]/60">OTP sent to +91 {digits}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-gray-500"><X size={20} /></button>
                </div>
                <p className="mt-3 text-xs text-[#2a150c]/55">The OTP comes as an SMS or a call. This keeps Cash on Delivery orders genuine.</p>

                <input
                    inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} autoFocus
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP"
                    className="mt-4 w-full h-12 rounded-xl border border-[#2a150c]/20 text-center text-xl tracking-[0.4em] focus:outline-none focus:border-[#7A3B23]"
                />
                {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

                <button type="submit" disabled={busy || !session} className="mt-4 w-full h-12 rounded-full bg-[#2a150c] text-white font-semibold disabled:opacity-50">
                    {busy ? 'Please wait…' : 'Verify and place order'}
                </button>
                <button type="button" onClick={send} disabled={busy || wait > 0} className="mt-3 w-full text-sm text-[#7A3B23] font-medium disabled:text-gray-400">
                    {wait > 0 ? `Send again in ${wait}s` : 'Send OTP again'}
                </button>
            </form>
        </div>
    );
}
