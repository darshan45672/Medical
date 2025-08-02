import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.externals.push({
      '@prisma/client': 'commonjs @prisma/client',
      'prisma': 'commonjs prisma'
    })
    return config
  }
};

export default nextConfig;
