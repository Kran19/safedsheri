/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://localhost:4000/api/v1'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
