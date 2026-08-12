import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle in .next/standalone so the Docker
  // image only needs Node + the built app (no full node_modules copy).
  output: "standalone",
};

export default nextConfig;
