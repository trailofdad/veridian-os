// client/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable standalone output for Docker
  // output: 'export', // Try this, it's often needed for static exports
};

module.exports = nextConfig;