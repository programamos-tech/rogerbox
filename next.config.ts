import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Configuraciones para estabilizar Next.js 15 en desarrollo
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  // Asegurar que pako se resuelva (lo usa fast-png → jspdf)
  transpilePackages: ['pako', 'fast-png'],
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      pako: require.resolve('pako'),
    };
    if (process.env.NODE_ENV === 'development') {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
