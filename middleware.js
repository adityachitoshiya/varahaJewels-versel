import { NextResponse } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - API routes
         * - Static files
         * - Geo-blocked page itself
         * - Admin pages
         */
        '/((?!api|_next/static|_next/image|favicon.ico|varaha-assets|geo-blocked|admin).*)',
    ],
};

// Cache blocked regions for 5 minutes to reduce API calls
let cachedBlockedRegions = [];
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getBlockedRegions() {
    const now = Date.now();

    if (cachedBlockedRegions.length > 0 && (now - cacheTime) < CACHE_DURATION) {
        return cachedBlockedRegions;
    }

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend.varahajewels.in'}/api/settings/blocked-regions/active`, {
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (res.ok) {
            cachedBlockedRegions = await res.json();
            cacheTime = now;
        }
    } catch (error) {
        console.error('Failed to fetch blocked regions:', error);
    }

    return cachedBlockedRegions;
}

export async function middleware(request) {
    // Get geo information from Vercel's edge
    const geo = request.geo || {};
    const region = geo.region || ''; // State/Region code like 'GJ', 'MH'
    const country = geo.country || '';

    // Only check for Indian visitors
    if (country !== 'IN') {
        return NextResponse.next();
    }

    // Get blocked regions
    const blockedRegions = await getBlockedRegions();

    // Check if user's region is blocked
    if (region && blockedRegions.includes(region)) {
        // Redirect to geo-blocked page
        return NextResponse.rewrite(new URL('/geo-blocked', request.url));
    }

    return NextResponse.next();
}
