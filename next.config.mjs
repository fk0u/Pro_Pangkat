/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['bkd.kaltimprov.go.id'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bkd.kaltimprov.go.id',
        port: '',
        pathname: '/assets/portal/images/**',
      },
    ],
  },
  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    // Enable server components for better performance
    serverComponents: true,
    // Optimize page loading
    optimizeCss: true,
    // Cache responses for improved performance
    workerThreads: true,
    // Better code splitting
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'framer-motion'
    ],
  },
}

export default nextConfig
