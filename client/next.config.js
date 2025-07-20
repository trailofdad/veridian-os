// client/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable standalone output
  // Don't use assetPrefix for standalone mode - it should handle this automatically
};

module.exports = nextConfig;
