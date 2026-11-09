import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getApiUrl, getAdminHeaders } from '../../lib/config';
import { istDateTime } from '../../lib/istDate';

// Daily stock update: upload the supplier's Excel (SKU + Quantity), check what
// would change, then apply. Nothing is written until "Apply" is pressed.

const inr = (n) => (n == null ? '-' : `₹${Math.round(n).toLocaleString('en-IN')}`);
const when = (iso) => istDateTime(iso, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export default function StockSync() {
    const fileRef = useRef(null);
    const [file, setFile] = useState(null);
    const [maxStock, setMaxStock] = useState(3);
    const [zeroMissing, setZeroMissing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const [done, setDone] = useState(null);
    const [status, setStatus] = useState(null);
    const [showUnchanged, setShowUnchanged] = useState(false);

    const loadStatus = () =>
        fetch(`${getApiUrl()}/api/admin/stock-sync/status`, { headers: getAdminHeaders(false) })
            .then((r) => (r.ok ? r.json() : null))
            .then(setStatus)
            .catch(() => {});
    useEffect(() => { loadStatus(); }, []);

    const check = async (f = file) => {
        if (!f) return;
        setBusy(true); setError(''); setDone(null);
        try {
            const body = new FormData();
            body.append('file', f);
            body.append('max_stock', String(maxStock));
            body.append('zero_missing', String(zeroMissing));
            const res = await fetch(`${getApiUrl()}/api/admin/stock-sync/preview`, { method: 'POST', headers: getAdminHeaders(false), body });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(res.status === 401 ? 'Your session has expired. Sign in again.' : data.detail || 'Could not read the file.');
            setPreview(data);
        } catch (e) {
            setPreview(null);
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const onPick = (f) => {
        if (!f) return;
        setFile(f);
        check(f);
    };

    const toChange = preview ? [...preview.in_file, ...preview.not_in_file].filter((r) => r.changes) : [];

    const apply = async () => {
        if (!toChange.length) return;
        setBusy(true); setError('');
        try {
            const changes = toChange.map((r) => ({
                product_id: r.product_id,
                stock: r.new_stock,
                sku: r.sku,
                supplier_price: r.supplier_price ?? null,
                supplier_qty: r.supplier_qty ?? null,
            }));
            const res = await fetch(`${getApiUrl()}/api/admin/stock-sync/apply`, {
                method: 'POST',
                headers: getAdminHeaders(true),
                body: JSON.stringify({ file: preview.file, changes }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.detail || 'Could not apply the changes.');
            setDone(data);
            setPreview(null);
            setFile(null);
            if (fileRef.current) fileRef.current.value = '';
            loadStatus();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const rows = preview ? preview.in_file.filter((r) => showUnchanged || r.changes) : [];
    const s = preview?.summary;

    return (
        <AdminLayout>
            <Head><title>Stock update - Varaha Admin</title></Head>
            <h1 className="sr-only">Stock update from Excel</h1>

            <div className="max-w-5xl">
                <p className="text-[#2a150c]/70 max-w-2xl">
                    Upload the supplier's Excel (it needs <b>SKU</b> and <b>Quantity</b> columns). You will see what changes first; nothing is saved until you press Apply.
                </p>
                {status && (
                    <p className="mt-2 text-sm text-[#2a150c]/55">
                        {status.linked_products} of {status.total_products} products are linked to a supplier code.
                        {status.last ? ` Last update ${when(status.last.at)}: ${status.last.updated} changed.` : ' No update done yet.'}
                    </p>
                )}

                {done && (
                    <div role="status" className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900">
                        <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                            Stock updated: <b>{done.updated}</b> products changed
                            {done.back_in_stock ? `, ${done.back_in_stock} back in stock` : ''}
                            {done.now_out_of_stock ? `, ${done.now_out_of_stock} now out of stock` : ''}.{' '}
                            <Link href="/admin/products" className="font-semibold underline underline-offset-2">See products</Link>
                        </p>
                    </div>
                )}
                {error && (
                    <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
                        <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" /> {error}
                    </div>
                )}

                {/* Upload */}
                <section className="mt-5 rounded-2xl bg-white border border-[#2a150c]/10 p-5 md:p-6">
                    <div className="grid md:grid-cols-[1fr_auto] gap-5 items-end">
                        <label
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files?.[0]); }}
                            className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-[#2a150c]/20 hover:border-copper bg-[#F6F1EB]/60 px-5 py-6 cursor-pointer"
                        >
                            <span className="w-12 h-12 rounded-xl bg-[#2a150c] text-[#E8C9A0] flex items-center justify-center flex-shrink-0"><FileSpreadsheet size={22} /></span>
                            <span className="min-w-0">
                                <span className="block font-semibold truncate">{file ? file.name : 'Choose the supplier Excel'}</span>
                                <span className="block text-sm text-[#2a150c]/55">{file ? 'Choose another file to replace it' : 'Click here or drop the .xlsx file'}</span>
                            </span>
                            <input ref={fileRef} type="file" accept=".xlsx,.xlsm,.csv" className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} />
                        </label>

                        <div className="flex flex-col gap-3 text-sm">
                            <label className="flex items-center justify-between gap-3">
                                <span>Most to keep in stock per product</span>
                                <input type="number" min="1" max="1000" value={maxStock} onChange={(e) => setMaxStock(Math.max(1, parseInt(e.target.value || '1', 10)))} className="w-16 h-9 px-2 rounded-lg border border-[#2a150c]/15 text-center tabular-nums" />
                            </label>
                            <label className="flex items-start gap-2.5 max-w-xs">
                                <input type="checkbox" checked={zeroMissing} onChange={(e) => setZeroMissing(e.target.checked)} className="mt-1 accent-[#7A3B23]" />
                                <span>Products missing from the file become out of stock</span>
                            </label>
                            {file && (
                                <button onClick={() => check()} disabled={busy} className="h-10 rounded-full border border-[#2a150c]/20 font-semibold hover:bg-[#2a150c] hover:text-white disabled:opacity-50">
                                    {busy ? 'Checking…' : 'Check again with these settings'}
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Preview */}
                {preview && (
                    <>
                        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                ['Will change', s.will_change, s.will_change ? 'text-royal-orange' : ''],
                                ['Already correct', s.unchanged, ''],
                                ['Price changed', s.price_changes, s.price_changes ? 'text-royal-orange' : ''],
                                ['Not in the file', s.not_in_file, ''],
                            ].map(([label, n, tone]) => (
                                <div key={label} className="rounded-2xl bg-white border border-[#2a150c]/10 p-4">
                                    <p className="text-sm text-[#2a150c]/60">{label}</p>
                                    <p className={`mt-1 font-royal font-bold text-4xl leading-none tabular-nums ${tone}`}>{n}</p>
                                </div>
                            ))}
                        </div>

                        <section className="mt-5 rounded-2xl bg-white border border-[#2a150c]/10 overflow-hidden">
                            <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2a150c]/10">
                                <h2 className="font-royal font-bold text-2xl">{showUnchanged ? 'Products in the file' : 'What will change'}</h2>
                                <label className="flex items-center gap-2 text-sm text-[#2a150c]/70">
                                    <input type="checkbox" checked={showUnchanged} onChange={(e) => setShowUnchanged(e.target.checked)} className="accent-[#7A3B23]" /> Also show unchanged
                                </label>
                            </div>
                            {rows.length === 0 ? (
                                <p className="p-6 text-sm text-[#2a150c]/60">Nothing in this file changes your stock.</p>
                            ) : (
                                <ul className="divide-y divide-[#2a150c]/5 max-h-[460px] overflow-y-auto">
                                    {rows.map((r) => (
                                        <li key={r.product_id} className="px-5 py-3 flex items-center gap-3">
                                            <img src={r.image} alt="" className="w-11 h-11 rounded-lg object-cover bg-[#F6F1EB] flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{r.name}</p>
                                                <p className="text-xs text-[#2a150c]/50">{r.section} · {r.sku}{r.price_changed ? ` · supplier price ${inr(r.old_supplier_price)} → ${inr(r.supplier_price)}` : ''}</p>
                                            </div>
                                            <p className="text-sm tabular-nums whitespace-nowrap">
                                                <span className="text-[#2a150c]/50">{r.current_stock ?? '∞'}</span> <ArrowRight size={13} className="inline mx-0.5 text-[#2a150c]/40" /> <b className={r.new_stock === 0 ? 'text-red-600' : ''}>{r.new_stock}</b>
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {preview.not_in_file.length > 0 && (
                            <details className="mt-4 rounded-2xl bg-white border border-[#2a150c]/10 px-5 py-4">
                                <summary className="cursor-pointer font-semibold">
                                    {preview.not_in_file.length} of your products are not in this file
                                    <span className="font-normal text-sm text-[#2a150c]/55"> {zeroMissing ? '(they will become out of stock)' : '(left as they are)'}</span>
                                </summary>
                                <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-[#2a150c]/70 max-h-60 overflow-y-auto">
                                    {preview.not_in_file.map((m) => <li key={m.product_id} className="truncate">{m.section}: {m.name}</li>)}
                                </ul>
                            </details>
                        )}
                        {preview.not_listed_count > 0 && (
                            <p className="mt-3 text-sm text-[#2a150c]/55">
                                {preview.not_listed_count} items in the file are not on your store yet, so they are ignored.
                            </p>
                        )}

                        <div className="sticky bottom-4 mt-6 flex justify-end">
                            <button
                                onClick={apply}
                                disabled={busy || toChange.length === 0}
                                className="h-12 px-8 rounded-full bg-[#2a150c] text-white font-bold shadow-lg hover:bg-copper disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {busy ? 'Saving…' : toChange.length ? `Apply ${toChange.length} changes` : 'No changes to apply'}
                            </button>
                        </div>
                    </>
                )}

                {!preview && !file && (
                    <p className="mt-6 text-sm text-[#2a150c]/55 flex items-center gap-2"><Upload size={16} /> Start by choosing the file above.</p>
                )}
            </div>
        </AdminLayout>
    );
}
