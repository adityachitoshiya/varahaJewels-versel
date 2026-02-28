import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl } from '../../lib/config';
import AdminLayout from '../../components/admin/AdminLayout';
import Head from 'next/head';
import {
    Sparkles, Plus, Trash2, Edit3, Eye, EyeOff, Upload, X, Save,
    Percent, CreditCard, Gift, Zap, ChevronDown, ChevronUp, GripVertical, Tag
} from 'lucide-react';
import { useAdminToast } from '../../components/admin/AdminToast';

const ICON_OPTIONS = [
    { value: 'discount', label: '🏷️ Discount', bg: 'bg-pink-50' },
    { value: 'upi', label: '🏦 UPI', bg: 'bg-green-50' },
    { value: 'card', label: '💳 Card', bg: 'bg-blue-50' },
    { value: 'onecard', label: '⬛ OneCard', bg: 'bg-gray-900' },
    { value: 'mobikwik', label: '📱 Mobikwik', bg: 'bg-purple-50' },
    { value: 'cashback', label: '🪙 Cashback', bg: 'bg-amber-50' },
    { value: 'emi', label: '📅 EMI', bg: 'bg-sky-50' },
    { value: 'gift', label: '🎁 Gift', bg: 'bg-rose-50' },
    { value: 'zap', label: '⚡ Prepaid', bg: 'bg-green-50' },
    { value: 'bogo', label: '🔁 BOGO', bg: 'bg-indigo-50' },
];

const DISCOUNT_TYPES = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'flat', label: 'Flat (₹ Off)' },
    { value: 'flat_price', label: 'Set Price To (₹)' },
    { value: 'bogo', label: 'Buy One Get One' },
];

const PAYMENT_RESTRICTIONS = [
    { value: 'none', label: 'No Restriction' },
    { value: 'prepaid_only', label: 'Prepaid Only (UPI/Cards/Net Banking)' },
    { value: 'upi_only', label: 'UPI Only' },
    { value: 'cod_only', label: 'COD Only' },
];

const emptyForm = {
    title: '',
    highlight: '',
    subtitle: '',
    icon: 'discount',
    coupon_code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_cart_value: '',
    payment_method_restriction: 'none',
    category_restriction: '',
    is_active: true,
    sort_order: 0,
};

export default function OffersPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('offers');
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [iconFile, setIconFile] = useState(null);
    const [iconPreview, setIconPreview] = useState(null);
    const [saving, setSaving] = useState(false);

    // Coupons tab state
    const [coupons, setCoupons] = useState([]);
    const [couponsLoading, setCouponsLoading] = useState(true);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [editingCouponId, setEditingCouponId] = useState(null);
    const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_discount: '', payment_method_restriction: 'none', is_active: true });

    const toast = useAdminToast();
    const API_URL = getApiUrl();
    const getToken = () => localStorage.getItem('admin_token');

    useEffect(() => {
        if (router.query.tab === 'coupons') setActiveTab('coupons');
    }, [router.query.tab]);

    useEffect(() => {
        fetchOffers();
        fetchCoupons();
    }, []);

    const fetchOffers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/promotions`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) setOffers(await res.json());
        } catch (e) {
            console.error('Fetch offers error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...emptyForm });
        setIconFile(null);
        setIconPreview(null);
        setShowForm(true);
    };

    const openEdit = (offer) => {
        setEditingId(offer.id);
        setForm({
            title: offer.title || '',
            highlight: offer.highlight || '',
            subtitle: offer.subtitle || '',
            icon: offer.icon || 'discount',
            coupon_code: offer.coupon_code || '',
            discount_type: offer.discount_type || 'percentage',
            discount_value: offer.discount_value || '',
            min_cart_value: offer.min_cart_value || '',
            payment_method_restriction: offer.payment_method_restriction || 'none',
            category_restriction: offer.category_restriction || '',
            is_active: offer.is_active,
            sort_order: offer.sort_order || 0,
        });
        setIconFile(null);
        setIconPreview(offer.icon_url || null);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('highlight', form.highlight);
            formData.append('subtitle', form.subtitle);
            formData.append('icon', form.icon);
            formData.append('coupon_code', form.coupon_code);
            formData.append('discount_type', form.discount_type);
            formData.append('discount_value', parseFloat(form.discount_value) || 0);
            formData.append('min_cart_value', parseFloat(form.min_cart_value) || 0);
            formData.append('payment_method_restriction', form.payment_method_restriction);
            formData.append('category_restriction', form.category_restriction);
            formData.append('is_active', form.is_active);
            formData.append('sort_order', parseInt(form.sort_order) || 0);
            if (iconFile) formData.append('icon_file', iconFile);

            const url = editingId
                ? `${API_URL}/api/admin/promotions/${editingId}`
                : `${API_URL}/api/admin/promotions`;

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData,
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setForm({ ...emptyForm });
                fetchOffers();
                fetchCoupons();
            } else {
                const err = await res.json();
                toast.error(err.detail || 'Failed to save offer');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error saving offer');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const ok = await toast.confirm('Delete this offer permanently?', { confirmText: 'Delete', type: 'warning' });
        if (!ok) return;
        try {
            const res = await fetch(`${API_URL}/api/admin/promotions/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) fetchOffers(), fetchCoupons();
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggle = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/admin/promotions/${id}/toggle`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) fetchOffers(), fetchCoupons();
        } catch (e) {
            console.error(e);
        }
    };

    const handleIconUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIconFile(file);
            setIconPreview(URL.createObjectURL(file));
        }
    };

    // --- Coupons CRUD ---
    const fetchCoupons = async () => {
        try {
            const res = await fetch(`${API_URL}/api/coupons`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) setCoupons(await res.json());
        } catch (e) {
            console.error('Fetch coupons error:', e);
        } finally {
            setCouponsLoading(false);
        }
    };

    const openCouponCreate = () => {
        setEditingCouponId(null);
        setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_discount: '', payment_method_restriction: 'none', is_active: true });
        setShowCouponForm(true);
    };

    const openCouponEdit = (coupon) => {
        if (coupon.linked_offer) {
            toast.warning(`This coupon is managed by offer "${coupon.linked_offer.title}". Edit the offer instead.`);
            return;
        }
        setEditingCouponId(coupon.id);
        setCouponForm({
            code: coupon.code || '',
            discount_type: coupon.discount_type || 'percentage',
            discount_value: coupon.discount_value || '',
            min_order_amount: coupon.min_order_amount || '',
            max_discount: coupon.max_discount || '',
            payment_method_restriction: coupon.payment_method_restriction || 'none',
            is_active: coupon.is_active !== false,
        });
        setShowCouponForm(true);
    };

    const handleCouponSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                code: couponForm.code.trim().toUpperCase(),
                discount_type: couponForm.discount_type,
                discount_value: parseFloat(couponForm.discount_value) || 0,
                min_order_amount: parseFloat(couponForm.min_order_amount) || null,
                max_discount: parseFloat(couponForm.max_discount) || null,
                payment_method_restriction: couponForm.payment_method_restriction || 'none',
                is_active: couponForm.is_active,
            };

            const url = editingCouponId
                ? `${API_URL}/api/coupons/${editingCouponId}`
                : `${API_URL}/api/coupons`;

            const res = await fetch(url, {
                method: editingCouponId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowCouponForm(false);
                setEditingCouponId(null);
                fetchCoupons();
            } else {
                const err = await res.json();
                toast.error(err.detail || 'Failed to save coupon');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error saving coupon');
        }
    };

    const handleCouponDelete = async (id) => {
        const coupon = coupons.find(c => c.id === id);
        if (coupon?.linked_offer) {
            toast.warning(`This coupon is managed by offer "${coupon.linked_offer.title}". Delete the offer instead.`);
            return;
        }
        const ok = await toast.confirm('Delete this coupon permanently?', { confirmText: 'Delete', type: 'warning' });
        if (!ok) return;
        try {
            const res = await fetch(`${API_URL}/api/coupons/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) fetchCoupons();
        } catch (e) {
            console.error(e);
        }
    };

    const handleCouponToggle = async (coupon) => {
        try {
            const res = await fetch(`${API_URL}/api/coupons/${coupon.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ ...coupon, is_active: !coupon.is_active }),
            });
            if (res.ok) fetchCoupons();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AdminLayout>
            <Head>
                <title>Offers Management - Admin</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="text-amber-500" /> Offers & Coupons
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage offers, promotions & discount coupons from one place
                        </p>
                    </div>
                    <button
                        onClick={activeTab === 'offers' ? openCreate : openCouponCreate}
                        className="flex items-center gap-2 bg-copper text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-copper/90 transition shadow"
                    >
                        <Plus size={18} /> {activeTab === 'offers' ? 'New Offer' : 'New Coupon'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('offers')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'offers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Sparkles size={16} /> Offers ({offers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'coupons' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Tag size={16} /> Coupons ({coupons.length})
                    </button>
                </div>

                {/* ======== OFFERS TAB ======== */}
                {activeTab === 'offers' && (<>

                {/* Offers Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400">Loading offers...</div>
                    ) : offers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Sparkles size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">No offers created yet</p>
                            <button onClick={openCreate} className="mt-3 text-copper text-sm font-semibold hover:underline">
                                Create your first offer →
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Offer</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Coupon</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Discount</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Restrictions</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {offers.map((offer, i) => {
                                    const iconInfo = ICON_OPTIONS.find(ic => ic.value === offer.icon) || ICON_OPTIONS[0];
                                    return (
                                        <tr key={offer.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {offer.icon_url ? (
                                                        <img src={offer.icon_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg">{iconInfo.label.split(' ')[0]}</span>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {offer.highlight && <span className="text-red-600 font-bold mr-1">{offer.highlight}</span>}
                                                            {offer.title}
                                                        </p>
                                                        {offer.subtitle && <p className="text-xs text-gray-400">{offer.subtitle}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {offer.coupon_code ? (
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono font-bold">
                                                        {offer.coupon_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Auto-applied</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {offer.discount_type === 'percentage' && `${offer.discount_value}%`}
                                                {offer.discount_type === 'flat' && `₹${offer.discount_value}`}
                                                {offer.discount_type === 'bogo' && 'BOGO'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    {offer.min_cart_value > 0 && (
                                                        <span className="block text-xs text-gray-500">Min ₹{offer.min_cart_value}</span>
                                                    )}
                                                    {offer.payment_method_restriction !== 'none' && (
                                                        <span className="inline-block bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded">
                                                            {offer.payment_method_restriction.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                    {offer.category_restriction && (
                                                        <span className="inline-block bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded">
                                                            {offer.category_restriction}
                                                        </span>
                                                    )}
                                                    {!offer.min_cart_value && offer.payment_method_restriction === 'none' && !offer.category_restriction && (
                                                        <span className="text-xs text-gray-300">None</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleToggle(offer.id)}
                                                    className={`w-10 h-5 rounded-full transition relative ${offer.is_active ? 'bg-green-400' : 'bg-gray-300'}`}
                                                >
                                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${offer.is_active ? 'left-5' : 'left-0.5'}`} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit(offer)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(offer.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Create / Edit Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
                                <h2 className="text-lg font-bold text-gray-800">
                                    {editingId ? 'Edit Offer' : 'Create New Offer'}
                                </h2>
                                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-5">
                                {/* Display Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Display</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Highlight Text</label>
                                            <input
                                                type="text"
                                                value={form.highlight}
                                                onChange={e => setForm({ ...form, highlight: e.target.value })}
                                                placeholder="e.g. Extra 5%"
                                                className="w-full p-2.5 border rounded-lg text-sm font-bold text-red-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Icon Type</label>
                                            <select
                                                value={form.icon}
                                                onChange={e => setForm({ ...form, icon: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg text-sm bg-white"
                                            >
                                                {ICON_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Offer Title *</label>
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={e => setForm({ ...form, title: e.target.value })}
                                            placeholder="e.g. instant discount on all UPI payments. No code required"
                                            className="w-full p-2.5 border rounded-lg text-sm"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle / Condition</label>
                                        <input
                                            type="text"
                                            value={form.subtitle}
                                            onChange={e => setForm({ ...form, subtitle: e.target.value })}
                                            placeholder="e.g. Max discount ₹500. Valid till March 31."
                                            className="w-full p-2.5 border rounded-lg text-sm text-gray-500"
                                        />
                                    </div>

                                    {/* Custom Icon Upload */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Custom Icon (optional — overrides icon type)</label>
                                        <div className="flex items-center gap-3">
                                            {iconPreview && (
                                                <img src={iconPreview} alt="icon" className="w-10 h-10 rounded-full object-cover border" />
                                            )}
                                            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-copper hover:text-copper transition">
                                                <Upload size={16} /> Upload Bank/Brand Logo
                                                <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
                                            </label>
                                            {iconPreview && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setIconFile(null); setIconPreview(null); }}
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Discount Section */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Discount Rules</h3>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Coupon Code</label>
                                            <input
                                                type="text"
                                                value={form.coupon_code}
                                                onChange={e => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })}
                                                placeholder="e.g. PP5PERCENT"
                                                className="w-full p-2.5 border rounded-lg text-sm font-mono uppercase"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">Leave empty for auto-applied offers</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type</label>
                                            <select
                                                value={form.discount_type}
                                                onChange={e => setForm({ ...form, discount_type: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg text-sm bg-white"
                                            >
                                                {DISCOUNT_TYPES.map(dt => (
                                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Discount Value {form.discount_type === 'percentage' ? '(%)' : form.discount_type === 'flat' ? '(₹)' : ''}
                                            </label>
                                            <input
                                                type="number"
                                                value={form.discount_value}
                                                onChange={e => setForm({ ...form, discount_value: e.target.value })}
                                                placeholder={form.discount_type === 'percentage' ? '5' : '500'}
                                                className="w-full p-2.5 border rounded-lg text-sm"
                                                min="0"
                                                step="any"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Restrictions Section */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Restrictions</h3>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Min Cart Value (₹)</label>
                                            <input
                                                type="number"
                                                value={form.min_cart_value}
                                                onChange={e => setForm({ ...form, min_cart_value: e.target.value })}
                                                placeholder="0 = No minimum"
                                                className="w-full p-2.5 border rounded-lg text-sm"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                                            <select
                                                value={form.payment_method_restriction}
                                                onChange={e => setForm({ ...form, payment_method_restriction: e.target.value })}
                                                className="w-full p-2.5 border rounded-lg text-sm bg-white"
                                            >
                                                {PAYMENT_RESTRICTIONS.map(pr => (
                                                    <option key={pr.value} value={pr.value}>{pr.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Category (optional)</label>
                                            <input
                                                type="text"
                                                value={form.category_restriction}
                                                onChange={e => setForm({ ...form, category_restriction: e.target.value })}
                                                placeholder="e.g. necklaces"
                                                className="w-full p-2.5 border rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Active + Sort */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={form.is_active}
                                                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-copper/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                        <span className="text-sm text-gray-600">Active</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500">Sort Order:</label>
                                        <input
                                            type="number"
                                            value={form.sort_order}
                                            onChange={e => setForm({ ...form, sort_order: e.target.value })}
                                            className="w-16 p-1.5 border rounded text-sm text-center"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">Preview</h3>
                                    <div className="rounded-xl border border-orange-200 p-4 bg-orange-50/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                                {iconPreview ? (
                                                    <img src={iconPreview} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <span className="text-lg">{ICON_OPTIONS.find(i => i.value === form.icon)?.label.split(' ')[0] || '🏷️'}</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                {form.highlight && <span className="font-bold text-red-600">{form.highlight} </span>}
                                                {form.title || 'Offer title will appear here'}
                                                {form.subtitle && <span className="block text-xs text-gray-500 mt-0.5">{form.subtitle}</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 py-3 bg-copper text-white rounded-lg text-sm font-bold hover:bg-copper/90 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Save size={16} /> {saving ? 'Saving...' : editingId ? 'Update Offer' : 'Create Offer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                </>)}

                {/* ======== COUPONS TAB ======== */}
                {activeTab === 'coupons' && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        {couponsLoading ? (
                            <div className="p-12 text-center text-gray-400">Loading coupons...</div>
                        ) : coupons.length === 0 ? (
                            <div className="p-12 text-center">
                                <Tag size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No standalone coupons yet</p>
                                <button onClick={openCouponCreate} className="mt-3 text-copper text-sm font-semibold hover:underline">
                                    Create your first coupon →
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Value</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Conditions</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Source</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {coupons.map((coupon, i) => (
                                        <tr key={coupon.id} className={`hover:bg-gray-50 transition ${coupon.linked_offer ? 'bg-amber-50/30' : ''}`}>
                                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                            <td className="px-4 py-3 font-mono font-bold text-copper">{coupon.code}</td>
                                            <td className="px-4 py-3 text-gray-600 capitalize">{(coupon.discount_type || '').replace('_', ' ')}</td>
                                            <td className="px-4 py-3 font-bold text-gray-800">
                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    {coupon.min_order_amount > 0 && (
                                                        <span className="block text-xs text-gray-500">Min ₹{coupon.min_order_amount}</span>
                                                    )}
                                                    {coupon.max_discount > 0 && (
                                                        <span className="block text-xs text-gray-500">Max ₹{coupon.max_discount}</span>
                                                    )}
                                                    {coupon.payment_method_restriction && coupon.payment_method_restriction !== 'none' && (
                                                        <span className="block text-xs text-blue-600 font-medium">
                                                            {PAYMENT_RESTRICTIONS.find(p => p.value === coupon.payment_method_restriction)?.label || coupon.payment_method_restriction}
                                                        </span>
                                                    )}
                                                    {!coupon.min_order_amount && !coupon.max_discount && (!coupon.payment_method_restriction || coupon.payment_method_restriction === 'none') && (
                                                        <span className="text-xs text-gray-300">None</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {coupon.linked_offer ? (
                                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                                                        <Sparkles size={12} /> Offer
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Standalone</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => !coupon.linked_offer && handleCouponToggle(coupon)}
                                                    disabled={!!coupon.linked_offer}
                                                    className={`w-10 h-5 rounded-full transition relative ${coupon.is_active ? 'bg-green-400' : 'bg-gray-300'} ${coupon.linked_offer ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${coupon.is_active ? 'left-5' : 'left-0.5'}`} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openCouponEdit(coupon)} className={`p-1.5 hover:bg-gray-100 rounded-lg ${coupon.linked_offer ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={() => handleCouponDelete(coupon.id)} className={`p-1.5 hover:bg-red-50 rounded-lg ${coupon.linked_offer ? 'text-gray-300' : 'text-red-400'}`}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Coupon Create/Edit Modal */}
                {showCouponForm && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <h2 className="text-lg font-bold text-gray-800">
                                    {editingCouponId ? 'Edit Coupon' : 'Create Coupon'}
                                </h2>
                                <button onClick={() => setShowCouponForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCouponSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={couponForm.code}
                                        onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. SUMMER50"
                                        className="w-full p-2.5 border rounded-lg text-sm font-mono uppercase"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type</label>
                                        <select
                                            value={couponForm.discount_type}
                                            onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg text-sm bg-white"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₹ Off)</option>
                                            <option value="flat_price">Set Price To (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                                        <input
                                            type="number"
                                            value={couponForm.discount_value}
                                            onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                                            placeholder={couponForm.discount_type === 'percentage' ? '10' : '500'}
                                            className="w-full p-2.5 border rounded-lg text-sm"
                                            min="0"
                                            step="any"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Min Order Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={couponForm.min_order_amount}
                                            onChange={e => setCouponForm({ ...couponForm, min_order_amount: e.target.value })}
                                            placeholder="0 = No minimum"
                                            className="w-full p-2.5 border rounded-lg text-sm"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Max Discount (₹)</label>
                                        <input
                                            type="number"
                                            value={couponForm.max_discount}
                                            onChange={e => setCouponForm({ ...couponForm, max_discount: e.target.value })}
                                            placeholder="No cap"
                                            className="w-full p-2.5 border rounded-lg text-sm"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method Restriction</label>
                                    <select
                                        value={couponForm.payment_method_restriction}
                                        onChange={e => setCouponForm({ ...couponForm, payment_method_restriction: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg text-sm bg-white"
                                    >
                                        {PAYMENT_RESTRICTIONS.map(pr => (
                                            <option key={pr.value} value={pr.value}>{pr.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={couponForm.is_active}
                                            onChange={e => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-copper/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                    <span className="text-sm text-gray-600">Active</span>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCouponForm(false)}
                                        className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-copper text-white rounded-lg text-sm font-bold hover:bg-copper/90 flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} /> {editingCouponId ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
