import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Performance for 1000+ users ─────────────────────────
  compress: true,
  poweredByHeader: false,

  // Static asset caching — CDN-friendly immutable hashes
  headers: async () => [
    {
      source: "/_next/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/fonts/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
