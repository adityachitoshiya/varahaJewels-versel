/** @type {import('next').NextConfig} */
const nextConfig = {
    // Build standalone server for low-memory VPS/EC2 deployments (production only)
    output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

    // Optimize compilation and reduce recompilation
    reactStrictMode: false,
    swcMinify: true,

    // Skip ESLint during production build (linting runs separately)
    eslint: {
        ignoreDuringBuilds: true,
    },

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

    // Webpack config only applies to production builds (Turbopack handles dev)
    ...(process.env.NODE_ENV === 'production' ? {
        webpack: (config) => config,
    } : {}),

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

    // Enable compression
    compress: true,

    // Optimize fonts
    optimizeFonts: true,

    // Power by header removal for security and slight performance
    poweredByHeader: false,
};

export default nextConfig;
