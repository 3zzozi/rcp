import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcrypt'],
    serverActions: true,
    // API configuration should go here
    api: {
      bodyParser: {
        sizeLimit: '10mb',
      },
    },
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig

export default nextConfig;
