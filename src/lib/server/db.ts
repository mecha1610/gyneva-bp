import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as { _prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error('POSTGRES_PRISMA_URL is not set');
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

// Lazy proxy — defers connection until first use (safe at build/import time)
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!g._prisma) {
      g._prisma = createPrismaClient();
    }
    const client = g._prisma;
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
