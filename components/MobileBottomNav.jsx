import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Crown, Heart, User } from 'lucide-react';

export default function MobileBottomNav({ wishlistCount = 0 }) {
    const router = useRouter();
    const currentPath = router.pathname;

    const isActive = (path) => {
        if (path === '/' && currentPath === '/') return true;
        if (path !== '/' && currentPath.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { name: 'Home', icon: Home, path: '/' },
        { name: 'Heritage', icon: Crown, path: '/heritage' },
        { name: 'Wishlist', icon: Heart, path: '/wishlist', count: wishlistCount },
        { name: 'Account', icon: User, path: '/account' }, // Redirects to /login if not auth, handled by page usually
    ];

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#EFE9E2]/95 backdrop-blur-xl border-t border-heritage/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_20px_rgba(0,0,0,0.08)] lg:hidden will-change-transform" style={{ transform: 'translateZ(0)' }}>
                <div className="flex items-center justify-around h-14 sm:h-16">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                prefetch={false}
                                className={`relative flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-all duration-200 active:scale-90 ${active ? 'text-royal-orange' : 'text-heritage/60'
                                    }`}
                            >
                                {/* Active Indicator Dot */}
                                {active && (
                                    <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-1 bg-royal-orange rounded-b-full shadow-[0_2px_8px_rgba(224,122,36,0.4)]" />
                                )}

                                <div className={`relative p-1 rounded-xl transition-all duration-200 ${active ? 'bg-royal-orange/10 transform -translate-y-0.5' : ''}`}>
                                    <Icon
                                        size={20}
                                        className={`transition-all duration-200 ${active ? 'fill-royal-orange/20 stroke-[2.5px]' : 'stroke-[1.5px]'}`}
                                    />

                                    {/* Badge for Wishlist */}
                                    {item.count > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none shadow-sm">
                                            {item.count}
                                        </span>
                                    )}
                                </div>

                                <span className={`text-[10px] font-medium tracking-wide transition-all duration-200 ${active ? 'font-bold opacity-100' : 'opacity-70'
                                    }`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Spacer to prevent content from being hidden behind nav + safe area */}
            <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))] sm:h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden" />
        </>
    );
}
