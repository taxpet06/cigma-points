// Prisma v7 configuration file.
// - DIRECT_URL (unpooled) is used here for migrations only.
// - The runtime pooled URL (DATABASE_URL) is configured via the PrismaNeon adapter in src/lib/db.ts.
// Source: https://neon.com/docs/guides/prisma (verified 2026-06-13)
import "dotenv/config"
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: env("DIRECT_URL"), // unpooled — migrations and db push only
  },
})
