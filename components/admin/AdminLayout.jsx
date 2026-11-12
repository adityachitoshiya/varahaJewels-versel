import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Package, Menu, X, Search, Bell,
    Activity, Image as ImageIcon, Sparkles, RotateCcw, FolderTree, FileBarChart, ExternalLink,
    PanelLeftClose, PanelLeftOpen, FileSpreadsheet, ShoppingCart, MessageCircle, Inbox } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { getApiUrl, getAdminHeaders } from '../../lib/config';
import { AdminToastProvider } from './AdminToast';
import { istDateTime } from '../../lib/istDate';

// Shared admin frame: grouped sidebar, page title bar, product search and
// notifications. Every /admin page renders inside this.

const NAV = [
    {
        group: 'Sell',
        items: [
            { name: 'Overview', href: '/admin', icon: LayoutDashboard },
            { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
            { name: 'Returns', href: '/admin/returns', icon: RotateCcw },
            { name: 'Customers', href: '/admin/customers', icon: Users },
            { name: 'Abandoned carts', href: '/admin/abandoned', icon: ShoppingCart },
        ],
    },
    {
        group: 'Catalogue',
        items: [
            { name: 'Products', href: '/admin/products', icon: Package },
            { name: 'Stock update', href: '/admin/stock-sync', icon: FileSpreadsheet },
            { name: 'Categories', href: '/admin/categories', icon: FolderTree },
            { name: 'Offers', href: '/admin/offers', icon: Sparkles },
        ],
    },
    {
        group: 'Store',
        items: [
            { name: 'Content', href: '/admin/cms', icon: ImageIcon },
            { name: 'Analytics', href: '/admin/analytics', icon: Activity },
            { name: 'Reports', href: '/admin/reports', icon: FileBarChart },
            { name: 'Notifications', href: '/admin/notifications', icon: Bell },
            { name: 'WhatsApp Inbox', href: '/admin/whatsapp-inbox', icon: Inbox },
            { name: 'WhatsApp', href: '/admin/whatsapp', icon: MessageCircle },
            { name: 'Settings', href: '/admin/settings', icon: Settings },
        ],
    },
];

const isActive = (pathname, href) => (href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`));

export default function AdminLayout({ children }) {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);   // desktop: icon-only sidebar
    const [mobileOpen, setMobileOpen] = useState(false); // phone: drawer
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/api/notifications`, { headers: getAdminHeaders(false) });
            if (res.ok) setNotifications(await res.json());
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    useEffect(() => {
        if (!showNotifications) return;
        const close = (e) => {
            if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotifications(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [showNotifications]);

    const markAsRead = async (id) => {
        try {
            await fetch(`${getApiUrl()}/api/notifications/${id}/read`, { method: 'PUT', headers: getAdminHeaders(false) });
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // Auth check (token in localStorage, same as before)
    useEffect(() => {
        if (router.pathname === '/admin/login') {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
        }
        const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
        if (!token) router.push('/admin/login');
        else setIsAuthenticated(true);
        setIsLoading(false);
    }, [router]);

    // Remember the collapsed sidebar; close the phone drawer on navigation
    useEffect(() => {
        try { setCollapsed(localStorage.getItem('admin_sidebar_collapsed') === '1'); } catch {}
    }, []);
    useEffect(() => { setMobileOpen(false); }, [router.asPath]);
    const toggleCollapsed = () => {
        setCollapsed((c) => {
            try { localStorage.setItem('admin_sidebar_collapsed', c ? '0' : '1'); } catch {}
            return !c;
        });
    };

    useEffect(() => {
        if (typeof router.query.q === 'string') setQuery(router.query.q);
    }, [router.query.q]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('token');
        router.push('/admin/login');
    };

    const onSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(q ? `/admin/products?q=${encodeURIComponent(q)}` : '/admin/products');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F6F1EB]">
                <div className="w-12 h-12 border-4 border-copper border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (!isAuthenticated && router.pathname !== '/admin/login') return null;
    if (router.pathname === '/admin/login') return <>{children}</>;

    const current = NAV.flatMap((g) => g.items).find((i) => isActive(router.pathname, i.href));
    const sidebarWidth = collapsed ? 'md:w-[76px]' : 'md:w-64';

    const sidebar = (
        <>
            <div className={`h-16 flex items-center gap-3 px-5 border-b border-white/10 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
                <img
                    src="/varaha-assets/logo.png"
                    alt="Varaha Jewels"
                    className={`object-contain brightness-0 invert ${collapsed ? 'md:h-8 md:w-8' : ''} h-8 w-auto`}
                    onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/dd5zrsmok/image/upload/v1766342264/logo_hvef6t.png'; }}
                />
                <span className={`text-xs text-[#E8C9A0] ${collapsed ? 'md:hidden' : ''}`}>Admin</span>
                <button onClick={() => setMobileOpen(false)} className="md:hidden ml-auto p-1 text-white/60 hover:text-white" aria-label="Close menu">
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Admin">
                {NAV.map((g) => (
                    <div key={g.group}>
                        <p className={`px-3 mb-1.5 text-xs text-white/40 ${collapsed ? 'md:hidden' : ''}`}>{g.group}</p>
                        <ul className="space-y-0.5">
                            {g.items.map((item) => {
                                const active = isActive(router.pathname, item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            title={collapsed ? item.name : undefined}
                                            aria-current={active ? 'page' : undefined}
                                            className={`relative flex items-center gap-3 h-10 rounded-lg text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8C9A0] ${collapsed ? 'md:justify-center px-3 md:px-0' : 'px-3'} ${active ? 'bg-white/10 text-white font-semibold' : 'text-white/65 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#E8C9A0]" />}
                                            <item.icon size={18} strokeWidth={active ? 2.4 : 2} className={active ? 'text-[#E8C9A0]' : ''} />
                                            <span className={collapsed ? 'md:hidden' : ''}>{item.name}</span>
                                            {item.href === '/admin/notifications' && unreadCount > 0 && (
                                                <span className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-royal-orange text-white text-[11px] font-bold flex items-center justify-center ${collapsed ? 'md:absolute md:top-0.5 md:right-1 md:ml-0' : ''}`}>{unreadCount}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="p-3 border-t border-white/10 space-y-0.5">
                <a href="/" target="_blank" rel="noreferrer" className={`flex items-center gap-3 h-10 rounded-lg text-sm text-white/65 hover:bg-white/5 hover:text-white ${collapsed ? 'md:justify-center px-3 md:px-0' : 'px-3'}`} title={collapsed ? 'View store' : undefined}>
                    <ExternalLink size={18} /><span className={collapsed ? 'md:hidden' : ''}>View store</span>
                </a>
                <button onClick={handleLogout} className={`w-full flex items-center gap-3 h-10 rounded-lg text-sm text-white/65 hover:bg-red-500/15 hover:text-red-200 ${collapsed ? 'md:justify-center px-3 md:px-0' : 'px-3'}`} title={collapsed ? 'Sign out' : undefined}>
                    <LogOut size={18} /><span className={collapsed ? 'md:hidden' : ''}>Sign out</span>
                </button>
                <button onClick={toggleCollapsed} className={`hidden md:flex w-full items-center gap-3 h-10 rounded-lg text-sm text-white/45 hover:bg-white/5 hover:text-white ${collapsed ? 'justify-center' : 'px-3'}`} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                    {collapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /><span>Collapse</span></>}
                </button>
            </div>
        </>
    );

    return (
        <AdminToastProvider>
            <div className="min-h-screen bg-[#F6F1EB] text-[#2a150c] font-sans">
                {/* Phone drawer backdrop */}
                {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}

                <aside className={`fixed inset-y-0 left-0 z-50 w-64 ${sidebarWidth} bg-[#2a150c] flex flex-col transition-[transform,width] duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                    {sidebar}
                </aside>

                <div className={`min-h-screen flex flex-col transition-[margin] duration-200 ${collapsed ? 'md:ml-[76px]' : 'md:ml-64'}`}>
                    <header className="sticky top-0 z-30 h-16 px-4 md:px-8 flex items-center gap-4 bg-[#F6F1EB]/90 backdrop-blur border-b border-[#2a150c]/10">
                        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 text-[#2a150c]" aria-label="Open menu">
                            <Menu size={22} />
                        </button>
                        <p className="font-royal font-bold text-2xl leading-none truncate">{current?.name || 'Admin'}</p>

                        <form onSubmit={onSearch} className="relative ml-auto hidden sm:block" role="search">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2a150c]/40" size={16} />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search products"
                                aria-label="Search products"
                                className="w-56 lg:w-72 h-10 pl-9 pr-3 rounded-full bg-white border border-[#2a150c]/10 text-sm focus:outline-none focus:border-copper focus:ring-2 focus:ring-copper/20"
                            />
                        </form>

                        <div className="relative sm:ml-0 ml-auto" ref={notificationRef}>
                            <button onClick={() => setShowNotifications((s) => !s)} className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#2a150c]/70 hover:bg-white" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-royal-orange text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-[#2a150c]/10 overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-[#2a150c]/10 flex justify-between items-center">
                                        <p className="font-semibold">Notifications</p>
                                        <button onClick={fetchNotifications} className="text-xs font-semibold text-copper">Refresh</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <p className="p-6 text-center text-sm text-[#2a150c]/50">You are all caught up.</p>
                                        ) : notifications.map((n) => (
                                            <button key={n.id} onClick={() => markAsRead(n.id)} className={`w-full text-left px-4 py-3 border-b border-[#2a150c]/5 hover:bg-[#F6F1EB] ${!n.is_read ? 'bg-amber-50/60' : ''}`}>
                                                <p className={`text-sm ${!n.is_read ? 'font-semibold' : 'text-[#2a150c]/70'}`}>{n.message}</p>
                                                <p className="text-xs text-[#2a150c]/45 mt-1">{istDateTime(n.created_at)}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <Link href="/admin/notifications" className="block px-4 py-2.5 text-center text-xs font-semibold text-copper hover:bg-[#F6F1EB]">See all notifications</Link>
                                </div>
                            )}
                        </div>
                    </header>

                    <main className="flex-1 p-4 md:p-8">{children}</main>
                </div>
            </div>
        </AdminToastProvider>
    );
}
