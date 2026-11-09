import { useEffect, useState } from 'react';
import Head from 'next/head';
import { MessageCircle, KeyRound, ShoppingBag, RefreshCw, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getApiUrl, getAdminHeaders } from '../../lib/config';
import { istDateTime } from '../../lib/istDate';

// What WhatsApp costs: login OTPs and order messages, from Meta's own figures.
const WINDOWS = [['today', 'Today'], ['week', 'Last 7 days'], ['month', 'This month']];
const money = (n, cur = 'INR') => (cur === 'INR' ? `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${cur} ${Number(n || 0).toFixed(2)}`);

export default function WhatsAppCost() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [win, setWin] = useState('month');
    const [loading, setLoading] = useState(false);

    const load = () => {
        setLoading(true);
        fetch(`${getApiUrl()}/api/admin/whatsapp-cost`, { headers: getAdminHeaders(false) })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => { setData(d); setError(''); })
            .catch(() => setError('Could not load WhatsApp costs.'))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const w = data?.windows?.[win];
    const cur = data?.currency || 'INR';
    const find = (cat) => (w?.rows || []).filter((r) => r.category.startsWith(cat)).reduce((a, r) => ({ count: a.count + r.count, cost: a.cost + r.cost }), { count: 0, cost: 0 });
    const otp = find('AUTHENTICATION');
    const orders = find('UTILITY');
    const ours = data?.ours?.[win];

    const tiles = [
        { label: 'Total spent', value: money(w?.total_cost, cur), note: `${w?.total_count ?? 0} messages`, icon: MessageCircle },
        { label: 'Login OTPs', value: money(otp.cost, cur), note: `${otp.count} OTPs (Meta) · ${ours?.otp_sent ?? 0} sent by site · ${ours?.logins ?? 0} logins`, icon: KeyRound },
        { label: 'Order messages', value: money(orders.cost, cur), note: `${orders.count} order confirmations`, icon: ShoppingBag },
    ];

    return (
        <AdminLayout>
            <Head><title>WhatsApp - Varaha Admin</title></Head>
            <h1 className="sr-only">WhatsApp cost</h1>
            <div className="max-w-5xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[#2a150c]/70 max-w-2xl">What WhatsApp login OTPs and order messages cost, from Meta's own figures.</p>
                    <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#2a150c]/15 bg-white px-3 py-2 text-sm hover:bg-[#F6F1EB] disabled:opacity-60">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                <div className="mt-4 inline-flex rounded-xl bg-white border border-[#2a150c]/10 p-1" role="tablist">
                    {WINDOWS.map(([k, label]) => (
                        <button key={k} role="tab" aria-selected={win === k} onClick={() => setWin(k)}
                            className={`px-4 py-1.5 rounded-lg text-sm ${win === k ? 'bg-[#7A3B23] text-white' : 'text-[#2a150c]/70 hover:bg-[#F6F1EB]'}`}>{label}</button>
                    ))}
                </div>

                {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
                {data?.error && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                        <span>Meta figures are not available: {data.error}. The counts from this site are still shown.</span>
                    </div>
                )}

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
                    {tiles.map((t) => (
                        <div key={t.label} className="rounded-2xl bg-white border border-[#2a150c]/10 p-5">
                            <p className="flex items-center gap-2 text-sm text-[#2a150c]/60"><t.icon size={16} /> {t.label}</p>
                            <p className="mt-2 font-royal font-bold text-3xl md:text-4xl leading-none tabular-nums">{data ? (data.windows ? t.value : '–') : '…'}</p>
                            <p className="mt-2 text-xs text-[#2a150c]/50">{t.note}</p>
                        </div>
                    ))}
                </div>

                {w && (
                    <div className="mt-6 rounded-2xl bg-white border border-[#2a150c]/10 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-[#F6F1EB] text-[#2a150c]/60 text-left">
                                <tr><th className="px-4 py-2.5 font-medium">Type</th><th className="px-4 py-2.5 font-medium text-right">Messages</th><th className="px-4 py-2.5 font-medium text-right">Cost</th></tr>
                            </thead>
                            <tbody>
                                {w.rows.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-[#2a150c]/50">No paid WhatsApp messages in this period.</td></tr>}
                                {w.rows.map((r) => (
                                    <tr key={r.category} className="border-t border-[#2a150c]/5">
                                        <td className="px-4 py-2.5">{r.label}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">{r.count}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">{money(r.cost, cur)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="mt-4 text-xs text-[#2a150c]/50">
                    {data?.note} Rough rates in India: login OTP and order message about ₹0.12 each; replies within 24 hours of a customer's message are free.
                    {data?.updated_at && <> Checked {istDateTime(data.updated_at, { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })}.</>}
                </p>
            </div>
        </AdminLayout>
    );
}
