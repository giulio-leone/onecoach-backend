import type { PrismaClient } from '@prisma/client';
import { getDbClient as getCoreDbClient } from '@giulio-leone/core';

/** Type-safe accessor for the PrismaClient via the hexagonal core layer. */
export function getDbClient(): PrismaClient {
  return getCoreDbClient() as PrismaClient;
}
