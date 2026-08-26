/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: rewrites() was removed. It was dead code — Next.js App Router
  // file-system routes (app/api/v1/[...path]/route.ts) take priority over
  // rewrites(), so the rewrite never executed. The proxy is handled entirely
  // by app/api/v1/[...path]/route.ts which reads INTERNAL_API_URL.
};

module.exports = nextConfig;
