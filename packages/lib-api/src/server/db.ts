import type { PrismaClient } from '@prisma/client';
import { getDatabase } from '@giulio-leone/core';

/** Type-safe accessor for the PrismaClient from the database adapter. */
export function getDbClient(): PrismaClient {
  return (getDatabase() as unknown as { client: PrismaClient }).client;
}
