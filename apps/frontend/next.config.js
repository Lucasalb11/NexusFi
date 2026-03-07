/**
 * NexusFi — Next.js Configuration
 *
 * SECURITY: Only NEXT_PUBLIC_* variables are exposed to the browser.
 * NEVER add secret keys (API_SECRET_KEY, SOROBAN_SECRET_KEY, etc.)
 * as NEXT_PUBLIC_ variables — they would be visible in client bundles.
 * Private keys belong in the backend only.
 */

const path = require("path");
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: [
    "passkey-kit",
    "passkey-factory-sdk",
    "passkey-kit-sdk",
    "sac-sdk",
  ],
  webpack: (config) => {
    // Replace @stellar/stellar-sdk lib/minimal/bindings/config.js (requires
    // '../../package.json' which breaks in webpack) with our stub.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /[\\/]@stellar[\\/]stellar-sdk[\\/]lib[\\/]minimal[\\/]bindings[\\/]config\.js$/,
        path.join(__dirname, "stellar-sdk-config-stub.js")
      )
    );

    // Align webpack module resolution with TS path alias "@/..."
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.join(__dirname, "src"),
    };

    return config;
  },
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
