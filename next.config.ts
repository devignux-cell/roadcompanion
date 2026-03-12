import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "s1.ticketimg.com" },
      { protocol: "https", hostname: "*.ticketmaster.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "s1.ticketmaster.com" },
      { protocol: "https", hostname: "s1.tm-media.com" },
      { protocol: "https", hostname: "media.ticketmaster.eu" },
    ],
  },
};

export default nextConfig;
