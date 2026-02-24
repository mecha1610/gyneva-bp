import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Phase 1 — minimal config
  // API routes are still served by Vercel functions (api/) during migration.
  // Phase 2 will migrate them to src/app/api/ Route Handlers.
};

export default nextConfig;
