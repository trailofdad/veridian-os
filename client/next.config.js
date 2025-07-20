// client/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable standalone output for Docker
  // output: 'export', // often needed for static exports - didn't work
};

module.exports = nextConfig;
