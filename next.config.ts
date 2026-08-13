import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle in .next/standalone so the Docker
  // image only needs Node + the built app (no full node_modules copy).
  output: "standalone",
  // Keep the native SQLite addon out of the bundler; Next's file tracing
  // then copies the compiled binary into the standalone output.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
