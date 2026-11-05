import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminToast } from '../../components/admin/AdminToast';
import { getApiUrl, getAdminHeaders } from '../../lib/config';
import { RotateCcw, Check, X, IndianRupee, RefreshCw } from 'lucide-react';

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    refunded: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-600',
};

const FILTERS = ['all', 'pending', 'approved', 'refunded', 'rejected'];

export default function AdminReturns() {
    const toast = useAdminToast();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [busyId, setBusyId] = useState(null);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const q = filter === 'all' ? '' : `?status=${filter}`;
            const res = await fetch(`${getApiUrl()}/api/returns${q}`, { headers: getAdminHeaders(false) });
            if (res.ok) setReturns(await res.json());
            else toast.error(res.status === 401 || res.status === 403 ? 'Session expired - please login again' : 'Failed to load returns');
        } catch (e) {
            toast.error('Failed to load returns');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReturns(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const updateStatus = async (r, status) => {
        setBusyId(r.id);
        try {
            const res = await fetch(`${getApiUrl()}/api/returns/${r.id}`, {
                method: 'PUT',
                headers: getAdminHeaders(),
                body: JSON.stringify({ status, admin_notes: r.admin_notes || '', tracking_number: r.tracking_number || null }),
            });
            if (res.ok) {
                toast.success(`Return ${status}`);
                fetchReturns();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Update failed');
            }
        } finally {
            setBusyId(null);
        }
    };

    const refund = async (r) => {
        const ok = await toast.confirm(
            `Refund ₹${Number(r.refund_amount || 0).toLocaleString('en-IN')} for order ${r.order_id}? Online payments will be refunded through Razorpay / PhonePe right away.`,
            { confirmText: 'Refund', type: 'warning' }
        );
        if (!ok) return;
        setBusyId(r.id);
        try {
            const res = await fetch(`${getApiUrl()}/api/returns/${r.id}/refund`, {
                method: 'POST',
                headers: getAdminHeaders(false),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                toast.success(data.message || 'Refund processed');
                fetchReturns();
            } else {
                toast.error(data.detail || 'Refund failed');
            }
        } finally {
            setBusyId(null);
        }
    };

    const checkRefund = async (r) => {
        setBusyId(r.id);
        try {
            const res = await fetch(`${getApiUrl()}/api/returns/${r.id}/refund-status`, { headers: getAdminHeaders(false) });
            const data = await res.json().catch(() => ({}));
            if (res.ok) toast.success(`PhonePe refund: ${data.state || 'UNKNOWN'}${data.errorCode ? ` (${data.errorCode})` : ''}`);
            else toast.error(data.detail || 'Could not fetch status');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AdminLayout>
            <Head><title>Returns - Varaha Admin</title></Head>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><RotateCcw size={22} /> Returns & Refunds</h1>
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border ${filter === f ? 'bg-heritage text-white border-heritage' : 'bg-white text-gray-600 border-gray-200 hover:border-copper'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <p className="p-6 text-sm text-gray-500">Loading…</p>
                ) : returns.length === 0 ? (
                    <p className="p-6 text-sm text-gray-500">No return requests.</p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {returns.map(r => (
                            <div key={r.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link href={`/orders/${r.order_id}`} className="font-mono font-bold text-copper text-sm">{r.order_id}</Link>
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                                        <span className="text-sm font-semibold text-gray-800">₹{Number(r.refund_amount || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Reason:</span> {r.reason}</p>
                                    {r.description && <p className="text-xs text-gray-500 mt-0.5 break-words">{r.description}</p>}
                                    {r.admin_notes && <p className="text-xs text-gray-500 mt-1 whitespace-pre-line break-words">{r.admin_notes}</p>}
                                    <p className="text-[11px] text-gray-400 mt-1">Requested {r.created_at ? new Date(r.created_at + (r.created_at.endsWith('Z') ? '' : 'Z')).toLocaleString('en-IN') : ''}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {r.status === 'pending' && (
                                        <>
                                            <button disabled={busyId === r.id} onClick={() => updateStatus(r, 'approved')} className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"><Check size={14} /> Approve</button>
                                            <button disabled={busyId === r.id} onClick={() => updateStatus(r, 'rejected')} className="px-3 py-2 text-xs font-medium rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"><X size={14} /> Reject</button>
                                        </>
                                    )}
                                    {r.status === 'approved' && (
                                        <button disabled={busyId === r.id} onClick={() => refund(r)} className="px-3 py-2 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"><IndianRupee size={14} /> Refund</button>
                                    )}
                                    {r.status === 'refunded' && (r.admin_notes || '').includes('PhonePe') && (
                                        <button disabled={busyId === r.id} onClick={() => checkRefund(r)} className="px-3 py-2 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-copper disabled:opacity-50 flex items-center gap-1"><RefreshCw size={14} /> Check PhonePe status</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
