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

// Cache IP geo lookups for 30 minutes
const geoCache = new Map();
const GEO_CACHE_DURATION = 30 * 60 * 1000;

async function getBlockedRegions() {
    const now = Date.now();

    if (cachedBlockedRegions.length > 0 && (now - cacheTime) < CACHE_DURATION) {
        return cachedBlockedRegions;
    }

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend.varahajewels.in'}/api/settings/blocked-regions/active`, {
            next: { revalidate: 300 }
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

async function getGeoFromIP(ip) {
    if (!ip || ip === '127.0.0.1' || ip === '::1') return null;

    const now = Date.now();
    const cached = geoCache.get(ip);
    if (cached && (now - cached.time) < GEO_CACHE_DURATION) {
        return cached.data;
    }

    try {
        // Free IP geo lookup API (no key needed, 45 req/min)
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,region`, {
            signal: AbortSignal.timeout(3000) // 3s timeout
        });

        if (res.ok) {
            const data = await res.json();
            const result = {
                country: data.countryCode || '',
                region: data.region || ''  // Returns state code like "GJ", "MH"
            };
            geoCache.set(ip, { data: result, time: now });

            // Clean old entries (keep cache small)
            if (geoCache.size > 500) {
                const oldest = geoCache.keys().next().value;
                geoCache.delete(oldest);
            }

            return result;
        }
    } catch (error) {
        // Silently fail — don't block users if geo lookup fails
        console.error('Geo lookup failed:', error.message);
    }

    return null;
}

export async function middleware(request) {
    // Try Vercel's built-in geo first (works on Pro plan)
    let geo = request.geo || {};
    let region = geo.region || '';
    let country = geo.country || '';

    // Fallback: If Vercel geo is empty, use IP-based lookup
    if (!country) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || request.ip;

        const ipGeo = await getGeoFromIP(ip);
        if (ipGeo) {
            country = ipGeo.country;
            region = ipGeo.region;
        }
    }

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
