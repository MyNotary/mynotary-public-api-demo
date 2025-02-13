import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/mynotary/:path*',
        destination: 'https://api-preprod.mynotary.fr/api/v1/:path*'
      },
    ];
  },
};

export default nextConfig;
