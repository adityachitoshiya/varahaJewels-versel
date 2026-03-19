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

function normalizeCode(value) {
    return (value || '').toString().trim().toUpperCase();
}

function normalizeName(value) {
    return (value || '').toString().trim().toLowerCase();
}

async function getBlockedRegions() {
    const now = Date.now();

    if (cachedBlockedRegions.length > 0 && (now - cacheTime) < CACHE_DURATION) {
        return cachedBlockedRegions;
    }

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend.varahajewels.in'}/api/settings/blocked-regions`, {
            next: { revalidate: 300 }
        });

        if (res.ok) {
            const regions = await res.json();
            cachedBlockedRegions = regions
                .filter((r) => r && r.is_blocked)
                .map((r) => ({
                    code: normalizeCode(r.region_code),
                    name: normalizeName(r.region_name)
                }));
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
        // HTTPS fallback geo lookup for edge/runtime compatibility
        const res = await fetch(`https://ipapi.co/${ip}/json/`, {
            signal: AbortSignal.timeout(3000) // 3s timeout
        });

        if (res.ok) {
            const data = await res.json();
            const result = {
                country: normalizeCode(data.country_code || data.country),
                regionCode: normalizeCode(data.region_code),
                regionName: normalizeName(data.region)
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
    const geo = request.geo || {};
    const headerCountry = request.headers.get('x-vercel-ip-country');
    const headerRegion = request.headers.get('x-vercel-ip-country-region');

    let country = normalizeCode(headerCountry || geo.country);
    let regionCode = normalizeCode(headerRegion || geo.region);
    let regionName = normalizeName(geo.regionName);

    // Fallback: If Vercel geo is empty, use IP-based lookup
    if (!country) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || request.ip;

        const ipGeo = await getGeoFromIP(ip);
        if (ipGeo) {
            country = ipGeo.country;
            regionCode = ipGeo.regionCode;
            regionName = ipGeo.regionName;
        }
    }

    // Get blocked regions
    const blockedRegions = await getBlockedRegions();
    const blockedCodes = new Set(blockedRegions.map((r) => r.code).filter(Boolean));
    const blockedNames = new Set(blockedRegions.map((r) => r.name).filter(Boolean));

    // Check blocked region first, even when country is missing from geo provider.
    // This avoids bypass when only region data is available.
    if ((regionCode && blockedCodes.has(regionCode)) || (regionName && blockedNames.has(regionName))) {
        return NextResponse.redirect(new URL('/geo-blocked', request.url));
    }

    // Allow non-Indian visitors when no blocked region match exists
    if (country && country !== 'IN') {
        return NextResponse.next();
    }

    return NextResponse.next();
}
