/**
 * NexusFi — Next.js Configuration
 *
 * SECURITY: Only NEXT_PUBLIC_* variables are exposed to the browser.
 * NEVER add secret keys (API_SECRET_KEY, SOROBAN_SECRET_KEY, etc.)
 * as NEXT_PUBLIC_ variables — they would be visible in client bundles.
 * Private keys belong in the backend only.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "Cache-Control",
            value: "no-cache",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
