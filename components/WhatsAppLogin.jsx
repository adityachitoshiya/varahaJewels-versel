import { useEffect, useRef, useState } from 'react';
import { Loader2, Phone, User, AlertCircle, ArrowRight } from 'lucide-react';
import { getApiUrl } from '../lib/config';

const RESEND_SECONDS = 45;

const WaIcon = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47a9.4 9.4 0 0 1 6.7 2.78 9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0 0 12.04.62C5.76.62.65 5.73.65 12.01c0 2.01.52 3.97 1.52 5.69L.55 23.62l6.04-1.58a11.36 11.36 0 0 0 5.44 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.05z" />
  </svg>
);

/**
 * Mobile number + WhatsApp OTP. Logs in, or creates the account for a new number.
 * askName: show a name box (sign-up page). onDone(user) runs after the token is saved.
 */
export default function WhatsAppLogin({ askName = false, onDone }) {
  const [enabled, setEnabled] = useState(null);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [session, setSession] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);
  const otpRef = useRef(null);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/auth/whatsapp/config`).then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d) => setEnabled(!!d.enabled)).catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const digits = phone.replace(/\D/g, '').slice(-10);

  const send = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(digits)) { setError('Enter a valid 10 digit mobile number'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/whatsapp/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: digits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Could not send the OTP. Please try again.');
      setSession(data.otp_session);
      setStep('otp');
      setOtp('');
      setWait(RESEND_SECONDS);
      setTimeout(() => otpRef.current?.focus(), 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^\d{4}$/.test(otp)) { setError('Enter the 4 digit OTP from WhatsApp'); return; }
    setBusy(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/whatsapp/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, otp, otp_session: session, name: name.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Wrong OTP. Please try again.');
      const user = {
        id: data.user?.id, full_name: data.user?.name, name: data.user?.name,
        email: data.user?.email || '', phone: digits, role: 'customer',
      };
      localStorage.setItem('customer_token', data.access_token);
      localStorage.setItem('customer_user', JSON.stringify(user));
      onDone?.(user, data.is_new);
    } catch (err) {
      setError(err.message);
      if (/new (OTP|one)/i.test(err.message)) setOtp('');
    } finally {
      setBusy(false);
    }
  };

  if (enabled === false) return null;
  if (enabled === null) return <div className="h-[132px]" aria-hidden="true" />;

  const input = 'block w-full pl-12 pr-4 py-3.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper text-base';

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={send} className="space-y-4">
          {askName && (
            <div className="relative">
              <User size={20} className="absolute left-4 top-3.5 text-gray-400" />
              <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
            </div>
          )}
          <div className="relative">
            <Phone size={20} className="absolute left-4 top-3.5 text-gray-400" />
            <span className="absolute left-12 top-3.5 text-gray-500 text-base select-none border-r border-gray-200 pr-2">+91</span>
            <input
              className={input.replace('pl-12', 'pl-[5.25rem]')} placeholder="Mobile number" inputMode="numeric" autoComplete="tel-national"
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))} aria-label="Mobile number"
            />
          </div>
          <button type="submit" disabled={busy}
            className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl text-base font-semibold text-white bg-heritage hover:bg-heritage/90 shadow-lg shadow-heritage/20 disabled:opacity-70 transition-colors">
            {busy ? <Loader2 className="animate-spin" size={20} /> : <WaIcon />}
            Get OTP
          </button>
          <p className="text-xs text-gray-400 text-center">New here? Your account is made when you verify the OTP.</p>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            We sent a 4 digit code on WhatsApp to <span className="font-semibold text-gray-900">+91 {digits}</span>
          </p>
          <input
            ref={otpRef} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric" autoComplete="one-time-code" placeholder="• • • •" aria-label="OTP"
            className="block w-full text-center tracking-[0.6em] text-2xl font-semibold py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
          />
          <button type="submit" disabled={busy || otp.length !== 4}
            className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl text-base font-semibold text-white bg-heritage hover:bg-heritage/90 disabled:opacity-60 transition-colors">
            {busy ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
            Verify and continue
          </button>
          <div className="flex items-start gap-2 bg-copper/5 border border-copper/20 rounded-xl px-3 py-2.5 text-xs text-gray-600">
            <WaIcon className="h-4 w-4 flex-shrink-0 text-copper mt-0.5" />
            <span>Didn't get the OTP? Please check your <b>WhatsApp</b> messages (not SMS) for a chat from <b>Varaha Jewels</b>. It can take up to a minute.</span>
          </div>
          <div className="flex justify-between text-sm">
            <button type="button" className="text-gray-500 hover:text-heritage" onClick={() => { setStep('phone'); setError(''); }}>Change number</button>
            <button type="button" disabled={wait > 0 || busy} className="text-copper font-medium disabled:text-gray-400" onClick={send}>
              {wait > 0 ? `Resend in ${wait}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
