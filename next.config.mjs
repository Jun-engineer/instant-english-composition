/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  output: isDev ? undefined : 'export',
  images: {
    unoptimized: true
  },
  ...(isDev
    ? {
        rewrites: async () => [
          { source: '/api/:path*', destination: 'http://localhost:7071/api/:path*' }
        ]
      }
    : {})
};

export default nextConfig;
