import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Allow HMR WebSocket when opening dev server via LAN IP (not only localhost). */
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.68.103",
  ],
};

export default nextConfig;
