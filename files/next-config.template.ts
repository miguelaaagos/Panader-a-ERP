import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable Cache Components ("use cache" directive)
  cacheComponents: true,
  
  // Experimental features
  experimental: {
    // Type-safe routing
    typedRoutes: true,
    // Type-safe env vars
    typedEnv: true,
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
