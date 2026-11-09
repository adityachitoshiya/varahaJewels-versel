import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Package, Upload, Image as ImageIcon, Sparkles, ArrowRight } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getApiUrl, getAdminHeaders } from '../../lib/config';
import { utcDate, istDate, isTodayIST } from '../../lib/istDate';

// Admin overview: only figures computed from real orders and products.

const OPEN = ['pending', 'paid', 'processing'];          // still to be shipped
const STATUS_STYLE = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-sky-100 text-sky-800',
    processing: 'bg-violet-100 text-violet-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-emerald-100 text-emerald-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-gray-200 text-gray-600',
};
const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const isToday = isTodayIST;
const LOW = 2;

export default function AdminDashboard() {
    const [orders, setOrders] = useState(null);
    const [products, setProducts] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const API = getApiUrl();
        Promise.all([
            fetch(`${API}/api/orders`, { headers: getAdminHeaders(false) }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
            fetch(`${API}/api/products`).then((r) => (r.ok ? r.json() : [])),
        ])
            .then(([o, p]) => { setOrders(o); setProducts(p); })
            .catch((s) => {
                setError(s === 401 || s === 403 ? 'Your session has expired. Sign in again to see orders.' : 'Could not load orders. Check the backend is running.');
                setOrders([]);
                fetch(`${API}/api/products`).then((r) => (r.ok ? r.json() : [])).then(setProducts).catch(() => setProducts([]));
            });
    }, []);

    const stats = useMemo(() => {
        if (!orders || !products) return null;
        const live = orders.filter((o) => o.status !== 'cancelled');
        const inStock = products.filter((p) => p.stock !== 0);
        const bySection = {};
        products.forEach((p) => {
            const s = p.category || 'Other';
            bySection[s] ||= { total: 0, inStock: 0 };
            bySection[s].total += 1;
            if (p.stock !== 0) bySection[s].inStock += 1;
        });
        return {
            revenue: live.reduce((s, o) => s + (o.total_amount || 0), 0),
            todayCount: orders.filter((o) => isToday(o.created_at)).length,
            todayRevenue: live.filter((o) => isToday(o.created_at)).reduce((s, o) => s + (o.total_amount || 0), 0),
            toShip: orders.filter((o) => OPEN.includes(o.status)).length,
            inStock: inStock.length,
            outOfStock: products.length - inStock.length,
            low: products.filter((p) => p.stock > 0 && p.stock <= LOW).sort((a, b) => a.stock - b.stock),
            sections: Object.entries(bySection).sort((a, b) => b[1].total - a[1].total),
            recent: [...orders].sort((a, b) => utcDate(b.created_at) - utcDate(a.created_at)).slice(0, 6),
            orderCount: live.length,
        };
    }, [orders, products]);

    const restock = async (p, qty) => {
        const res = await fetch(`${getApiUrl()}/api/products/${p.id}`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify({ stock: qty }) });
        if (res.ok) setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, stock: qty } : x)));
    };

    const tiles = stats ? [
        { label: 'Revenue', value: inr(stats.revenue), note: `${stats.orderCount} orders, cancelled not counted` },
        { label: 'Orders today', value: stats.todayCount, note: stats.todayCount ? `${inr(stats.todayRevenue)} today` : 'None yet today' },
        { label: 'Waiting to ship', value: stats.toShip, note: 'Pending, paid or processing', href: '/admin/orders', alert: stats.toShip > 0 },
        { label: 'Products in stock', value: stats.inStock, note: `${stats.outOfStock} out of stock`, href: '/admin/products' },
    ] : [];

    const maxSection = stats ? Math.max(...stats.sections.map(([, v]) => v.total), 1) : 1;

    return (
        <AdminLayout>
            <Head><title>Overview - Varaha Admin</title></Head>

            <div className="max-w-7xl">
                <h1 className="sr-only">Overview</h1>
                <p className="text-[#2a150c]/60">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}
                </p>
                {error && <p className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}

                {/* Key figures */}
                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                    {(stats ? tiles : Array.from({ length: 4 })).map((t, i) => {
                        const body = t ? (
                            <>
                                <p className="text-sm text-[#2a150c]/60">{t.label}</p>
                                <p className={`mt-2 font-royal font-bold text-4xl md:text-5xl leading-none tabular-nums ${t.alert ? 'text-royal-orange' : ''}`}>{t.value}</p>
                                <p className="mt-2 text-xs text-[#2a150c]/50">{t.note}</p>
                            </>
                        ) : <div className="h-24 animate-pulse rounded-lg bg-[#2a150c]/5" />;
                        const cls = 'block rounded-2xl bg-white border border-[#2a150c]/10 p-5 md:p-6';
                        return t?.href ? <Link key={i} href={t.href} className={`${cls} hover:border-copper`}>{body}</Link> : <div key={i} className={cls}>{body}</div>;
                    })}
                </div>

                <div className="mt-6 grid lg:grid-cols-3 gap-5">
                    {/* Recent orders */}
                    <section className="lg:col-span-2 rounded-2xl bg-white border border-[#2a150c]/10 overflow-hidden">
                        <div className="px-5 md:px-6 py-4 flex items-center justify-between border-b border-[#2a150c]/10">
                            <h2 className="font-royal font-bold text-2xl">Recent orders</h2>
                            <Link href="/admin/orders" className="text-sm font-semibold text-copper hover:text-heritage">All orders</Link>
                        </div>
                        {!stats ? (
                            <p className="p-6 text-sm text-[#2a150c]/50">Loading orders…</p>
                        ) : stats.recent.length === 0 ? (
                            <p className="p-6 text-sm text-[#2a150c]/60">No orders yet. New orders will show here.</p>
                        ) : (
                            <ul className="divide-y divide-[#2a150c]/5">
                                {stats.recent.map((o) => (
                                    <li key={o.id} className="px-5 md:px-6 py-3.5 flex items-center gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate">{o.customer_name || 'Customer'}</p>
                                            <p className="text-xs text-[#2a150c]/50 font-mono truncate">{o.order_id || `#${o.id}`} · {istDate(o.created_at, { day: 'numeric', month: 'short' })}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status}</span>
                                        <span className="w-24 text-right text-sm font-semibold tabular-nums">{inr(o.total_amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Low stock */}
                    <section className="rounded-2xl bg-white border border-[#2a150c]/10 overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#2a150c]/10">
                            <h2 className="font-royal font-bold text-2xl">Running low</h2>
                            <p className="text-xs text-[#2a150c]/50 mt-0.5">{LOW} or fewer left. Top up after you confirm stock with your supplier.</p>
                        </div>
                        {!stats ? (
                            <p className="p-5 text-sm text-[#2a150c]/50">Loading…</p>
                        ) : stats.low.length === 0 ? (
                            <p className="p-5 text-sm text-[#2a150c]/60">Nothing is running low.</p>
                        ) : (
                            <ul className="max-h-[420px] overflow-y-auto divide-y divide-[#2a150c]/5">
                                {stats.low.map((p) => (
                                    <li key={p.id} className="px-5 py-3 flex items-center gap-3">
                                        <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-[#F6F1EB] flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <Link href={`/admin/products/edit/${p.id}`} className="block text-sm truncate hover:text-copper">{p.name}</Link>
                                            <p className="text-xs text-royal-orange font-semibold">{p.stock} left</p>
                                        </div>
                                        <button onClick={() => restock(p, p.stock + 5)} className="flex-shrink-0 h-8 px-3 rounded-full border border-[#2a150c]/15 text-xs font-semibold hover:bg-[#2a150c] hover:text-white">+5</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                <div className="mt-5 grid lg:grid-cols-3 gap-5">
                    {/* Stock by section */}
                    <section className="lg:col-span-2 rounded-2xl bg-white border border-[#2a150c]/10 p-5 md:p-6">
                        <h2 className="font-royal font-bold text-2xl">Catalogue by section</h2>
                        <ul className="mt-4 space-y-3">
                            {(stats?.sections || []).map(([name, v]) => (
                                <li key={name}>
                                    <Link href={`/admin/products?section=${encodeURIComponent(name)}`} className="grid grid-cols-[120px_1fr_auto] items-center gap-4 text-sm group">
                                        <span className="truncate group-hover:text-copper">{name}</span>
                                        <span className="h-2.5 rounded-full bg-[#2a150c]/5 overflow-hidden">
                                            <span className="block h-full rounded-full bg-copper" style={{ width: `${(v.inStock / maxSection) * 100}%` }} />
                                        </span>
                                        <span className="tabular-nums text-[#2a150c]/60 text-right whitespace-nowrap">{v.inStock} of {v.total} in stock</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Shortcuts */}
                    <section className="rounded-2xl bg-[#2a150c] text-white p-5 md:p-6">
                        <h2 className="font-royal font-bold text-2xl">Shortcuts</h2>
                        <ul className="mt-4 space-y-1">
                            {[
                                { href: '/admin/products/new', icon: Package, label: 'Add a product' },
                                { href: '/admin/stock-sync', icon: Upload, label: 'Update stock from Excel' },
                                { href: '/admin/products/bulk-upload', icon: Package, label: 'Bulk upload products' },
                                { href: '/admin/cms', icon: ImageIcon, label: 'Edit homepage content' },
                                { href: '/admin/offers', icon: Sparkles, label: 'Create an offer' },
                            ].map((s) => (
                                <li key={s.href}>
                                    <Link href={s.href} className="flex items-center gap-3 h-11 px-3 -mx-3 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white">
                                        <s.icon size={18} className="text-[#E8C9A0]" /> {s.label}
                                        <ArrowRight size={15} className="ml-auto opacity-50" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
