import type { PrismaClient } from '@prisma/client';
import { prisma } from '@giulio-leone/lib-core';

/** Type-safe accessor for the PrismaClient. */
export function getDbClient(): PrismaClient {
  return prisma;
}
