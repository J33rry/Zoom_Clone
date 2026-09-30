import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // StrictMode double-mounts effects in dev, which would open (and drop) every
  // meeting WebSocket and camera stream twice.
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;
