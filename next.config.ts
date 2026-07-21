import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'http://21.0.7.77:81',
    'http://21.0.7.77:3000',
    'http://localhost:3000',
  ],
};

export default nextConfig;
