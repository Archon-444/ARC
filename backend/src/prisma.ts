import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __arcPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__arcPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__arcPrisma = prisma;
}
