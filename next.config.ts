import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Phase 1-2 — API routes are now in src/app/api/ (Next.js Route Handlers).
  // The old api/ Vercel functions remain for backward compatibility until Phase 5.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // needed for Excel upload route
    },
  },
};

export default nextConfig;
