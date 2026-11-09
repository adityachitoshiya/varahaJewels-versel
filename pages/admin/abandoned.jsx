import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Phone, MessageCircle, Check, ShoppingBag } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getApiUrl, getAdminHeaders } from '../../lib/config';
import { istDateTime } from '../../lib/istDate';

// Carts that Razorpay Magic Checkout reported as left before paying.
const inr = (n) => (n == null ? '-' : `₹${Math.round(n).toLocaleString('en-IN')}`);
const when = (iso) => istDateTime(iso, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const digits = (p) => (p || '').replace(/\D/g, '').slice(-10);

export default function Abandoned() {
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');
    const [hideDone, setHideDone] = useState(false);

    const load = () =>
        fetch(`${getApiUrl()}/api/admin/abandoned`, { headers: getAdminHeaders(false) })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then(setRows)
            .catch(() => setError('Could not load the list.'));
    useEffect(() => { load(); }, []);

    const mark = async (r) => {
        setRows((all) => all.map((x) => (x.id === r.id ? { ...x, contacted: !x.contacted } : x)));
        try {
            await fetch(`${getApiUrl()}/api/admin/abandoned/${r.id}/contacted?contacted=${!r.contacted}`, { method: 'PUT', headers: getAdminHeaders(false) });
        } catch { load(); }
    };

    const shown = (rows || []).filter((r) => !(hideDone && r.contacted));

    return (
        <AdminLayout>
            <Head><title>Abandoned carts - Varaha Admin</title></Head>
            <h1 className="sr-only">Abandoned carts</h1>
            <div className="max-w-4xl">
                <p className="text-[#2a150c]/70 max-w-2xl">Shoppers who started Magic Checkout and left before paying. Message them while the cart is fresh.</p>
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#2a150c]/70">
                    <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="accent-[#7A3B23]" /> Hide the ones I already contacted
                </label>
                {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
                {rows && shown.length === 0 && (
                    <div className="mt-6 rounded-2xl bg-white border border-[#2a150c]/10 p-8 text-center text-[#2a150c]/60">
                        <ShoppingBag className="mx-auto mb-2 opacity-40" /> No abandoned carts yet.
                    </div>
                )}
                <ul className="mt-5 space-y-3">
                    {shown.map((r) => (
                        <li key={r.id} className={`rounded-2xl bg-white border p-4 ${r.contacted ? 'border-emerald-200 opacity-70' : 'border-[#2a150c]/10'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold">{r.name || 'Customer'} <span className="font-normal text-sm text-[#2a150c]/50">· {when(r.at)}</span></p>
                                    <p className="text-sm text-[#2a150c]/60 break-all">{[r.phone, r.email].filter(Boolean).join(' · ')}</p>
                                </div>
                                <p className="font-royal font-bold text-2xl tabular-nums">{inr(r.total)}</p>
                            </div>
                            {r.items?.length > 0 && (
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {r.items.map((it, i) => (
                                        <li key={i} className="flex items-center gap-2 rounded-lg bg-[#F6F1EB] pr-3 text-sm">
                                            {it.image && <img src={it.image} alt="" className="w-10 h-10 rounded-l-lg object-cover" />}
                                            <span className="py-1 max-w-[220px] truncate">{it.name}{it.qty > 1 ? ` × ${it.qty}` : ''}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                {digits(r.phone) && (
                                    <>
                                        <a href={`https://wa.me/91${digits(r.phone)}?text=${encodeURIComponent(`Hi ${r.name || ''}, you left something in your Varaha Jewels cart.${r.checkout_url ? ` Finish your order here: ${r.checkout_url}` : ''}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-emerald-600 text-white font-medium"><MessageCircle size={15} /> WhatsApp</a>
                                        <a href={`tel:+91${digits(r.phone)}`} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#2a150c]/20 font-medium"><Phone size={15} /> Call</a>
                                    </>
                                )}
                                <button onClick={() => mark(r)} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#2a150c]/20 font-medium"><Check size={15} /> {r.contacted ? 'Contacted' : 'Mark contacted'}</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </AdminLayout>
    );
}
