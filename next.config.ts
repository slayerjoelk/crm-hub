import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Pin the workspace root so Turbopack ignores the stray ~/package-lock.json
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://crm-hub.vercel.app",
  },
};

export default nextConfig;
