import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
