import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Plus, Search, Edit, Trash2, Star, Upload, ExternalLink } from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useAdminToast } from '../../../components/admin/AdminToast';
import { getApiUrl, getAdminHeaders } from '../../../lib/config';

// Products: filter by section and stock, search, edit stock in place,
// toggle the homepage spotlight, edit or delete.

const LOW = 2;
const STOCK_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'low', label: `Low (${LOW} or less)`, match: (p) => p.stock > 0 && p.stock <= LOW },
    { key: 'out', label: 'Out of stock', match: (p) => p.stock === 0 },
];
const inr = (n) => (n ? `₹${Math.round(n).toLocaleString('en-IN')}` : 'On request');

export default function Products() {
    const router = useRouter();
    const toast = useAdminToast();
    const [products, setProducts] = useState(null);
    const [search, setSearch] = useState('');
    const [section, setSection] = useState('All');
    const [stockFilter, setStockFilter] = useState('all');

    useEffect(() => {
        if (!router.isReady) return;
        if (typeof router.query.q === 'string') setSearch(router.query.q);
        if (typeof router.query.section === 'string') setSection(router.query.section);
    }, [router.isReady, router.query.q, router.query.section]);

    const load = () =>
        fetch(`${getApiUrl()}/api/products`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setProducts)
            .catch(() => setProducts([]));
    useEffect(() => { load(); }, []);

    const sections = useMemo(() => {
        const c = {};
        (products || []).forEach((p) => { const s = p.category || 'Other'; c[s] = (c[s] || 0) + 1; });
        return Object.entries(c).sort((a, b) => b[1] - a[1]);
    }, [products]);

    const shown = useMemo(() => {
        if (!products) return [];
        const term = search.trim().toLowerCase();
        const sf = STOCK_FILTERS.find((f) => f.key === stockFilter);
        return products.filter((p) =>
            (section === 'All' || (p.category || 'Other') === section) &&
            (!sf?.match || sf.match(p)) &&
            (!term || `${p.name} ${p.id} ${p.tag || ''}`.toLowerCase().includes(term))
        );
    }, [products, search, section, stockFilter]);

    const saveStock = async (p, value) => {
        const stock = Math.max(0, parseInt(value, 10));
        if (Number.isNaN(stock) || stock === p.stock) return;
        const res = await fetch(`${getApiUrl()}/api/products/${p.id}`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify({ stock }) });
        if (res.ok) {
            setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, stock } : x)));
            toast.success?.(`Stock for "${p.name.slice(0, 40)}" set to ${stock}`);
        } else {
            toast.error(res.status === 401 ? 'Sign in again to change stock' : 'Could not save stock');
        }
    };

    const toggleSpotlight = async (p) => {
        const res = await fetch(`${getApiUrl()}/api/products/${p.id}/spotlight`, { method: 'PATCH', headers: getAdminHeaders(false) });
        if (res.ok) {
            const data = await res.json();
            setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, is_spotlight: data.is_spotlight } : x)));
        } else toast.error('Could not change spotlight');
    };

    const remove = async (p) => {
        const ok = await toast.confirm(`Delete "${p.name}"? This cannot be undone.`, { confirmText: 'Delete', type: 'warning' });
        if (!ok) return;
        const res = await fetch(`${getApiUrl()}/api/products/${p.id}`, { method: 'DELETE', headers: getAdminHeaders(false) });
        if (res.ok) setProducts((ps) => ps.filter((x) => x.id !== p.id));
        else toast.error('Could not delete the product');
    };

    const counts = {
        low: (products || []).filter(STOCK_FILTERS[1].match).length,
        out: (products || []).filter(STOCK_FILTERS[2].match).length,
    };

    return (
        <AdminLayout>
            <Head><title>Products - Varaha Admin</title></Head>
            <h1 className="sr-only">Products</h1>

            <div className="max-w-7xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[#2a150c]/60">{products ? `${products.length} products, ${shown.length} shown` : 'Loading products…'}</p>
                    <div className="flex gap-2">
                        <Link href="/admin/products/bulk-upload" className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#2a150c]/15 bg-white text-sm font-semibold hover:border-copper">
                            <Upload size={16} /> Bulk upload
                        </Link>
                        <Link href="/admin/products/new" className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#2a150c] text-white text-sm font-semibold hover:bg-copper">
                            <Plus size={17} /> Add product
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-5 rounded-2xl bg-white border border-[#2a150c]/10 p-4 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <label className="relative flex-1 max-w-md">
                            <span className="sr-only">Search products</span>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2a150c]/40" size={16} />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, ID or tag"
                                className="w-full h-10 pl-9 pr-3 rounded-full bg-[#F6F1EB] border border-transparent text-sm focus:outline-none focus:bg-white focus:border-copper"
                            />
                        </label>
                        <div className="flex gap-1.5 p-1 rounded-full bg-[#F6F1EB] w-fit" role="group" aria-label="Stock">
                            {STOCK_FILTERS.map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => setStockFilter(f.key)}
                                    aria-pressed={stockFilter === f.key}
                                    className={`h-8 px-3.5 rounded-full text-sm font-medium ${stockFilter === f.key ? 'bg-[#2a150c] text-white' : 'text-[#2a150c]/70 hover:text-[#2a150c]'}`}
                                >
                                    {f.label}{f.key !== 'all' && counts[f.key] > 0 && <span className="ml-1.5 tabular-nums opacity-70">{counts[f.key]}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Sections">
                        {[['All', products?.length || 0], ...sections].map(([name, n]) => (
                            <button
                                key={name}
                                role="tab"
                                aria-selected={section === name}
                                onClick={() => setSection(name)}
                                className={`flex-shrink-0 h-8 px-3.5 rounded-full border text-sm ${section === name ? 'bg-copper border-copper text-white' : 'border-[#2a150c]/15 text-[#2a150c]/75 hover:border-copper'}`}
                            >
                                {name} <span className="tabular-nums opacity-60">{n}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="mt-4 rounded-2xl bg-white border border-[#2a150c]/10 overflow-hidden">
                    <div className="hidden md:grid grid-cols-[1fr_120px_120px_90px_110px] gap-4 px-5 py-3 text-xs text-[#2a150c]/50 border-b border-[#2a150c]/10">
                        <span>Product</span><span>Price</span><span>Stock</span><span className="text-center">Spotlight</span><span className="text-right">Actions</span>
                    </div>
                    {!products ? (
                        <p className="p-6 text-sm text-[#2a150c]/50">Loading products…</p>
                    ) : shown.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="font-royal text-2xl">No products match these filters</p>
                            <button onClick={() => { setSearch(''); setSection('All'); setStockFilter('all'); }} className="mt-3 text-sm font-semibold text-copper underline underline-offset-4">Clear filters</button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#2a150c]/5">
                            {shown.map((p) => (
                                <li key={p.id} className="px-4 md:px-5 py-3 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_120px_90px_110px] gap-x-4 gap-y-2 items-center hover:bg-[#F6F1EB]/50">
                                    <div className="flex items-center gap-3 min-w-0 col-span-2 md:col-span-1">
                                        <img src={p.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-[#F6F1EB] flex-shrink-0" onError={(e) => { e.currentTarget.src = '/varaha-assets/logo.png'; }} />
                                        <div className="min-w-0">
                                            <Link href={`/admin/products/edit/${p.id}`} className="block text-sm font-medium truncate hover:text-copper">{p.name}</Link>
                                            <p className="text-xs text-[#2a150c]/50 truncate">{p.category || 'No section'}{p.tag ? `, ${p.tag}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-semibold tabular-nums">{inr(p.price)}</span>
                                        {p.mrp > p.price && <span className="block text-xs text-[#2a150c]/40 line-through tabular-nums">{inr(p.mrp)}</span>}
                                    </div>
                                    <StockInput product={p} onSave={saveStock} />
                                    <div className="hidden md:flex justify-center">
                                        <button onClick={() => toggleSpotlight(p)} className={`w-9 h-9 rounded-full flex items-center justify-center ${p.is_spotlight ? 'text-amber-500 bg-amber-50' : 'text-[#2a150c]/25 hover:text-amber-500'}`} aria-pressed={p.is_spotlight} aria-label={p.is_spotlight ? 'Remove from homepage spotlight' : 'Show in homepage spotlight'}>
                                            <Star size={18} fill={p.is_spotlight ? 'currentColor' : 'none'} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 col-span-2 md:col-span-1">
                                        <button onClick={() => toggleSpotlight(p)} className={`md:hidden w-9 h-9 rounded-full flex items-center justify-center ${p.is_spotlight ? 'text-amber-500 bg-amber-50' : 'text-[#2a150c]/30'}`} aria-label="Toggle spotlight"><Star size={17} fill={p.is_spotlight ? 'currentColor' : 'none'} /></button>
                                        <a href={`/product/${p.slug || p.id}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-[#2a150c]/40 hover:text-copper hover:bg-white" aria-label="View on store"><ExternalLink size={16} /></a>
                                        <Link href={`/admin/products/edit/${p.id}`} className="w-9 h-9 rounded-full flex items-center justify-center text-[#2a150c]/40 hover:text-copper hover:bg-white" aria-label="Edit"><Edit size={16} /></Link>
                                        <button onClick={() => remove(p)} className="w-9 h-9 rounded-full flex items-center justify-center text-[#2a150c]/40 hover:text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 size={16} /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

// Stock box: type a number, press Enter or click away to save
function StockInput({ product, onSave }) {
    const [value, setValue] = useState(product.stock ?? '');
    useEffect(() => setValue(product.stock ?? ''), [product.stock]);
    const unlimited = product.stock === null || product.stock === undefined;
    const tone = product.stock === 0 ? 'border-red-300 bg-red-50 text-red-700' : product.stock <= LOW && !unlimited ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-[#2a150c]/15 bg-white';

    return (
        <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">Stock for {product.name}</span>
            <input
                type="number"
                min="0"
                inputMode="numeric"
                value={value}
                placeholder={unlimited ? '∞' : ''}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => value !== '' && onSave(product, value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                className={`w-16 h-9 px-2 rounded-lg border text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-copper/30 ${tone}`}
            />
            {product.stock === 0 && <span className="text-xs font-semibold text-red-600">Out</span>}
        </label>
    );
}
