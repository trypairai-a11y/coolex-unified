import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
