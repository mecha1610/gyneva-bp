import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

// Enable WebSocket connections for Neon serverless
neonConfig.webSocketConstructor = globalThis.WebSocket;

// Singleton pattern for Prisma client in serverless environment
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error('POSTGRES_PRISMA_URL is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
