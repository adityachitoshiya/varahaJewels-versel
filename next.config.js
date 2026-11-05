/** @type {import('next').NextConfig} */
const nextConfig = {
    // Build standalone server for low-memory VPS/EC2 deployments (production only)
    output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

    // Optimize compilation and reduce recompilation
    reactStrictMode: false,

    // Skip TypeScript errors during build
    typescript: {
        ignoreBuildErrors: true,
    },

    // Remove console.logs in production builds only (incompatible with Turbopack in dev)
    ...(process.env.NODE_ENV === 'production' ? {
        compiler: { removeConsole: true },
    } : {}),

    experimental: {
        // Reduce client bundle size by tree-shaking icon imports more aggressively
        optimizePackageImports: ['lucide-react'],
    },

    productionBrowserSourceMaps: false,

    images: {
        unoptimized: false,
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // Cache images for 30 days
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'ui-avatars.com',
            },
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'pin.it',
            },
            {
                protocol: 'https',
                hostname: 'i.pinimg.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn.shopify.com',
            },
            {
                protocol: 'https',
                hostname: 'fqnzerfbrwwranmiznkw.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },

    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|png)',
                locale: false,
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    }
                ],
            },
        ];
    },

    // Old/linked URLs that have no page of their own
    // (hero slides saved in the CMS still point to /collections/all)
    async redirects() {
        return [
            { source: '/collections/all', destination: '/collections', permanent: false },
            { source: '/cookie-policy', destination: '/privacy-policy', permanent: false },
        ];
    },

    // Enable compression
    compress: true,

    // Power by header removal for security and slight performance
    poweredByHeader: false,
};

export default nextConfig;
