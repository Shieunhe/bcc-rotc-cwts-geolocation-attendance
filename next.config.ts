import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Required so `firebase-admin` is not bundled into Route Handlers (avoids runtime crashes → HTML error pages). */
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
