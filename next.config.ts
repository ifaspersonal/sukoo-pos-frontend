import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: [
      "http://localhost:3000",
      "http://192.168.18.117:3000",
      "http://192.168.18.117",
    ],
  },
};

export default nextConfig;
