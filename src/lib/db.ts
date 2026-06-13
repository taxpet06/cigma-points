// Prisma v7 singleton with PrismaNeon adapter.
// - Uses DATABASE_URL (pooled Neon connection) at runtime via the WebSocket driver.
// - Imports PrismaClient from the generated output path (not "@prisma/client") per Prisma v7.
// - Follows the global singleton pattern to prevent connection exhaustion in Next.js dev hot-reload.
// Source: https://neon.com/docs/guides/prisma (verified 2026-06-13)
import { PrismaClient } from "../../prisma/generated/prisma"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  })
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
