import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { User, Package, Heart, LogOut, Settings, ChevronUp, ChevronDown, MapPin, Loader2, Plus, Pencil, Trash2, Star, CheckCircle2, X, Home, Briefcase } from 'lucide-react';
import { getApiUrl } from '../lib/config';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import Footer from '../components/Footer';

const EMPTY_ADDR = {
    label: 'Home',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    is_default: false,
    address_type: 'both'
};

const LABEL_ICONS = { Home: Home, Office: Briefcase, Other: MapPin };

export default function Account() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    // Address state
    const [addresses, setAddresses] = useState([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null); // null = new, id = edit
    const [addrForm, setAddrForm] = useState(EMPTY_ADDR);
    const [addrSaving, setAddrSaving] = useState(false);
    const [addrError, setAddrError] = useState('');

    // Bottom Dropdown State
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const moreMenuRef = useRef(null);

    useEffect(() => {
        // Auth Check
        const token = localStorage.getItem('customer_token');
        const storedUser = localStorage.getItem('customer_user');

        if (!token || !storedUser) {
            router.push('/login');
            return;
        }

        setUser(JSON.parse(storedUser));
        fetchOrders(token);
        fetchAddresses(token);
    }, [router]);

    const fetchOrders = async (token) => {
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/customer/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Map backend fields to UI fields if necessary, or use directly
                // Backend: id, created_at, status, total_amount, items_json
                const formattedOrders = data.map(order => ({
                    id: order.order_id || `ORD-${order.id}`,
                    date: new Date(order.created_at).toLocaleDateString(),
                    status: order.status,
                    total: `₹${order.total_amount}`,
                    items: JSON.parse(order.items_json).length
                }));
                setOrders(formattedOrders);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAddresses = async (token) => {
        try {
            const res = await fetch(`${getApiUrl()}/api/addresses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses(data);
            }
        } catch (e) {
            console.error('Failed to fetch addresses', e);
        }
    };

    const openNewAddress = () => {
        setEditingAddress(null);
        setAddrForm(EMPTY_ADDR);
        setAddrError('');
        setShowAddressForm(true);
    };

    const openEditAddress = (addr) => {
        setEditingAddress(addr.id);
        setAddrForm({ ...addr });
        setAddrError('');
        setShowAddressForm(true);
    };

    const handleAddrInput = (e) => {
        const { name, value, type, checked } = e.target;
        setAddrForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const saveAddress = async (e) => {
        e.preventDefault();
        setAddrSaving(true);
        setAddrError('');
        const token = localStorage.getItem('customer_token');

        try {
            const url = editingAddress
                ? `${getApiUrl()}/api/addresses/${editingAddress}`
                : `${getApiUrl()}/api/addresses`;
            const method = editingAddress ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addrForm)
            });

            if (res.ok) {
                await fetchAddresses(token);
                setShowAddressForm(false);
            } else {
                const err = await res.json();
                setAddrError(err.detail || 'Failed to save address');
            }
        } catch (e) {
            setAddrError('Network error. Please try again.');
        } finally {
            setAddrSaving(false);
        }
    };

    const deleteAddress = async (id) => {
        if (!confirm('Delete this address?')) return;
        const token = localStorage.getItem('customer_token');
        try {
            await fetch(`${getApiUrl()}/api/addresses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    const setDefaultAddress = async (addr) => {
        const token = localStorage.getItem('customer_token');
        try {
            const res = await fetch(`${getApiUrl()}/api/addresses/${addr.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...addr, is_default: true })
            });
            if (res.ok) await fetchAddresses(token);
        } catch (e) {
            console.error('Set default failed', e);
        }
    };

    // Handle outside click for bottom menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setIsMoreOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [moreMenuRef]);

    const handleLogout = async () => {
        // Clear local storage
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_user');

        // Also sign out from Supabase (for social login users)
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.log('Supabase signout error (ignorable):', err);
        }

        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 className="animate-spin text-copper" size={40} />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>My Account | Varaha Jewels™</title>
            </Head>
            <Header />
            <div className="min-h-screen bg-[#F8F9FA] pb-24">

                {/* Profile Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-copper to-heritage flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {(user?.full_name || user?.name)?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl font-bold text-gray-900 font-serif mb-1">{user?.full_name || user?.name}</h1>
                            <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                                {user?.email}
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                                <span className="px-3 py-1 bg-copper/10 text-copper rounded-full text-xs font-bold uppercase tracking-wider">
                                    Gold Member
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

                    {/* Stats / Quick Links */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Link href="/orders" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-copper/50 hover:shadow-md transition-all text-center group cursor-pointer">
                            <Package className="w-8 h-8 mx-auto text-gray-400 group-hover:text-copper mb-3 transition-colors" />
                            <h3 className="font-semibold text-gray-900">Orders</h3>
                            <p className="text-xs text-gray-500 mt-1">{orders.length} active</p>
                        </Link>
                        <Link href="/wishlist" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-copper/50 hover:shadow-md transition-all text-center group cursor-pointer">
                            <Heart className="w-8 h-8 mx-auto text-gray-400 group-hover:text-red-500 mb-3 transition-colors" />
                            <h3 className="font-semibold text-gray-900">Wishlist</h3>
                            <p className="text-xs text-gray-500 mt-1">View Saved</p>
                        </Link>
                        <div onClick={openNewAddress} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-copper/50 hover:shadow-md transition-all text-center group cursor-pointer">
                            <MapPin className="w-8 h-8 mx-auto text-gray-400 group-hover:text-copper mb-3 transition-colors" />
                            <h3 className="font-semibold text-gray-900">Addresses</h3>
                            <p className="text-xs text-gray-500 mt-1">{addresses.length > 0 ? `${addresses.length} saved` : 'Manage'}</p>
                        </div>
                        <div onClick={handleLogout} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-red-200 hover:shadow-md transition-all text-center group cursor-pointer">
                            <LogOut className="w-8 h-8 mx-auto text-gray-400 group-hover:text-red-500 mb-3 transition-colors" />
                            <h3 className="font-semibold text-gray-900 group-hover:text-red-600">Logout</h3>
                            <p className="text-xs text-gray-500 mt-1">Sign out</p>
                        </div>
                    </div>

                    {/* Recent Orders Preview */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-gray-900">Recent Orders</h2>
                            <Link href="/orders" className="text-sm text-copper hover:text-heritage font-medium">View All</Link>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {orders.length === 0 && (
                                <p className="p-6 text-sm text-gray-400 text-center">No orders yet.</p>
                            )}
                            {orders.map(order => (
                                <div key={order.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-semibold text-gray-900">{order.id} <span className="text-gray-400 font-normal mx-2">•</span> {order.date}</p>
                                        <p className="text-sm text-gray-500 mt-1">{order.items} Items • {order.total}</p>
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Saved Addresses ─── */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <MapPin size={16} className="text-copper" /> Saved Addresses
                            </h2>
                            <button
                                onClick={openNewAddress}
                                className="flex items-center gap-1.5 text-sm text-copper hover:text-heritage font-medium"
                            >
                                <Plus size={15} /> Add New
                            </button>
                        </div>

                        {addresses.length === 0 ? (
                            <div className="p-8 text-center">
                                <MapPin size={36} className="text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400 mb-4">No addresses saved yet.</p>
                                <button
                                    onClick={openNewAddress}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-heritage text-white rounded-lg text-sm font-semibold hover:bg-copper transition-colors"
                                >
                                    <Plus size={14} /> Add Address
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {addresses.map(addr => {
                                    const LabelIcon = LABEL_ICONS[addr.label] || MapPin;
                                    return (
                                        <div key={addr.id} className="p-5 flex items-start gap-4 hover:bg-gray-50/60 transition-colors">
                                            <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${addr.is_default ? 'bg-copper/15 text-copper' : 'bg-gray-100 text-gray-400'}`}>
                                                <LabelIcon size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-sm font-bold text-gray-800">{addr.label}</span>
                                                    {addr.is_default && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-copper/10 text-copper rounded-full text-[10px] font-bold uppercase tracking-wide">
                                                            <CheckCircle2 size={10} /> Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 font-medium">{addr.full_name} · {addr.phone}</p>
                                                <p className="text-sm text-gray-500 leading-snug mt-0.5">
                                                    {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} – {addr.pincode}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {!addr.is_default && (
                                                    <button
                                                        onClick={() => setDefaultAddress(addr)}
                                                        title="Set as default"
                                                        className="p-2 rounded-lg text-gray-400 hover:text-copper hover:bg-copper/8 transition-colors"
                                                    >
                                                        <Star size={15} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openEditAddress(addr)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-heritage hover:bg-heritage/8 transition-colors"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => deleteAddress(addr.id)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom "More" Dropdown Area */}
                <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
                    <div className="relative pointer-events-auto" ref={moreMenuRef}>

                        {/* Dropdown Menu (Appears ABOVE the button) */}
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 transition-all duration-300 origin-bottom ${isMoreOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                            }`}>
                            <div className="p-2 space-y-1">
                                <button
                                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                >
                                    <Settings size={18} className="mr-3 text-gray-400 group-hover:text-copper" />
                                    Account Settings
                                </button>
                                <button
                                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                >
                                    <UsersIcon />
                                    Refer a Friend
                                </button>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut size={18} className="mr-3" />
                                    Logout
                                </button>
                            </div>
                            {/* Little triangle arrow pointing down */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45 shadow-sm"></div>
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={() => setIsMoreOpen(!isMoreOpen)}
                            className={`flex items-center gap-2 px-6 py-3 bg-heritage text-white rounded-full shadow-lg hover:bg-heritage/90 transition-all transform hover:scale-105 active:scale-95 ${isMoreOpen ? 'ring-4 ring-copper/30' : ''}`}
                        >
                            <span className="font-medium text-sm">Click here for more</span>
                            {isMoreOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                    </div>
                </div>
            </div>
            <Footer />

            {/* ─── Address Form Modal ─── */}
            {showAddressForm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddressForm(false)}>
                    <div
                        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[calc(92vh-4rem)] sm:max-h-[90vh] overflow-y-auto mb-16 sm:mb-0"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between z-10 rounded-t-2xl">
                            <h3 className="font-bold text-gray-900 text-lg">
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h3>
                            <button onClick={() => setShowAddressForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={saveAddress} className="p-5 space-y-4">
                            {/* Label */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address Type</label>
                                <div className="flex gap-2">
                                    {['Home', 'Office', 'Other'].map(l => (
                                        <button
                                            key={l}
                                            type="button"
                                            onClick={() => setAddrForm(p => ({ ...p, label: l }))}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${addrForm.label === l ? 'bg-heritage text-white border-heritage' : 'bg-white text-gray-600 border-gray-200 hover:border-heritage/40'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name & Phone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
                                    <input
                                        name="full_name" value={addrForm.full_name} onChange={handleAddrInput}
                                        placeholder="Recipient name" required
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none text-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phone *</label>
                                    <input
                                        name="phone" value={addrForm.phone} onChange={handleAddrInput}
                                        placeholder="10-digit mobile" required maxLength={10}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none text-sm transition-all"
                                    />
                                </div>
                            </div>

                            {/* Address Lines */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Address Line 1 *</label>
                                <input
                                    name="address_line1" value={addrForm.address_line1} onChange={handleAddrInput}
                                    placeholder="House No, Building, Street" required
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none text-sm transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Address Line 2 <span className="font-normal">(optional)</span></label>
                                <input
                                    name="address_line2" value={addrForm.address_line2 || ''} onChange={handleAddrInput}
                                    placeholder="Landmark, Area"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none text-sm transition-all"
                                />
                            </div>

                            {/* City, State, Pincode */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Pincode *</label>
                                    <input
                                        name="pincode" value={addrForm.pincode} onChange={handleAddrInput}
                                        placeholder="6-digit" required maxLength={6}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none text-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">City *</label>
                                    <input
                                        name="city" value={addrForm.city} onChange={handleAddrInput}
                                        placeholder="City" required
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none text-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">State *</label>
                                    <input
                                        name="state" value={addrForm.state} onChange={handleAddrInput}
                                        placeholder="State" required
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-copper focus:ring-1 focus:ring-copper outline-none text-sm transition-all"
                                    />
                                </div>
                            </div>

                            {/* Set as default */}
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox" name="is_default" checked={addrForm.is_default}
                                    onChange={handleAddrInput}
                                    className="w-4 h-4 accent-copper rounded"
                                />
                                <span className="text-sm text-gray-700">Set as default address</span>
                            </label>

                            {addrError && (
                                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{addrError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={addrSaving}
                                className="w-full py-3 bg-heritage text-white font-bold rounded-xl hover:bg-copper transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {addrSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                {addrSaving ? 'Saving…' : editingAddress ? 'Update Address' : 'Save Address'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function UsersIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-400 group-hover:text-copper"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    )
}
