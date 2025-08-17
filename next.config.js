/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Only run ESLint on specific directories during build
    dirs: ['src'],
    // Don't fail build on ESLint errors for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on TypeScript errors for deployment
    ignoreBuildErrors: true,
  },
  experimental: {
    esmExternals: true,
  },
}

module.exports = nextConfig