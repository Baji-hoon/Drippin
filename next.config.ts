import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["pin.it", "api.dicebear.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
    // In case some avatars remain SVGs in metadata
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
