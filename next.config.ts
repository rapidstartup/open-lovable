import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages Functions compatibility
  // Keep standard Next.js config for API routes
  experimental: {
    // Enable if you need server actions
    // serverActions: false,
  },
};

export default nextConfig;
