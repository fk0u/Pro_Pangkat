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
}

export default nextConfig
