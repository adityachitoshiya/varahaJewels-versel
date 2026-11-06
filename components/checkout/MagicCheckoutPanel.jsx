import { useState } from 'react';
import { Lock, Truck, Wallet, Tag } from 'lucide-react';
import OrderSummary from './OrderSummary';
import { getApiUrl } from '../../lib/config';

// Razorpay Magic Checkout: one button opens Razorpay's window, which takes the
// address, coupon and payment (or Cash on Delivery). Shown only while the admin
// "Magic Checkout" switch is on.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function MagicCheckoutPanel({ cartItems, orderDetails, summaryItems, totalAmount, onSuccess }) {
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    const headers = () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
        return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    };

    const finish = async (orderId) => {
        setNote('Confirming your order…');
        for (let i = 0; i < 8; i += 1) {
            try {
                const r = await fetch(`${getApiUrl()}/api/magic/complete`, { method: 'POST', headers: headers(), body: JSON.stringify({ razorpay_order_id: orderId }) });
                if (r.ok) { onSuccess(await r.json()); return; }
                if (r.status !== 409) break;
            } catch { /* network blip: try again */ }
            await sleep(2000);
        }
        setNote('');
        setError('We got your checkout but could not confirm the order yet. Please do not pay again. We will email you shortly, or write to help@varahajewels.in.');
        setBusy(false);
    };

    const start = async () => {
        setBusy(true); setError(''); setNote('');
        try {
            const body = cartItems.length > 0
                ? { items: cartItems.map((i) => ({ productId: i.productId || i.id, variantId: i.variant?.id, quantity: i.quantity })) }
                : { productId: orderDetails?.productId, variantId: orderDetails?.variantId, quantity: orderDetails?.quantity || 1 };
            const res = await fetch(`${getApiUrl()}/api/magic/create-order`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
            const d = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(d.detail || 'Could not start the checkout. Please try again.');
            if (!window.Razorpay) throw new Error('The payment window did not load. Please refresh the page and try again.');
            const rz = new window.Razorpay({
                key: d.key,
                order_id: d.orderId,
                amount: d.amount,
                currency: 'INR',
                name: 'Varaha Jewels',
                one_click_checkout: true,
                show_coupons: true,
                prefill: d.prefill || {},
                theme: { color: '#7A3B23' },
                handler: () => finish(d.orderId),
                modal: { ondismiss: () => setBusy(false) },
            });
            rz.open();
        } catch (e) {
            setError(e.message);
            setBusy(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            <section className="lg:col-span-7 rounded-2xl bg-white border border-heritage/10 p-5 sm:p-7">
                <h2 className="font-royal font-bold text-3xl text-heritage">Checkout</h2>
                <p className="mt-2 text-matte-brown">Enter your phone number in the next window. Saved addresses fill in by themselves, and you can apply a coupon there.</p>
                <ul className="mt-5 space-y-3 text-sm text-heritage">
                    <li className="flex gap-3"><Truck size={18} className="text-copper flex-shrink-0" /> Free delivery across India</li>
                    <li className="flex gap-3"><Wallet size={18} className="text-copper flex-shrink-0" /> Pay by UPI, card or net banking, or choose Cash on Delivery</li>
                    <li className="flex gap-3"><Tag size={18} className="text-copper flex-shrink-0" /> Available coupons are shown in the next window</li>
                </ul>
                {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}
                {note && <p role="status" className="mt-5 text-sm text-heritage/70">{note}</p>}
                <button
                    onClick={start} disabled={busy}
                    className="mt-6 w-full h-14 rounded-full bg-heritage text-white text-lg font-bold flex items-center justify-center gap-2 hover:bg-copper disabled:opacity-60"
                >
                    <Lock size={18} /> {busy ? 'Please wait…' : `Checkout · ₹${Math.round(totalAmount || 0).toLocaleString('en-IN')}`}
                </button>
                <p className="mt-3 text-center text-xs text-heritage/50">Secure checkout by Razorpay</p>
            </section>
            <aside className="lg:col-span-5">
                <OrderSummary items={summaryItems} subtotal={totalAmount} />
            </aside>
        </div>
    );
}
