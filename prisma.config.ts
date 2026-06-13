// Prisma v7 configuration file.
// - DIRECT_URL (unpooled) is used here for migrations only.
// - The runtime pooled URL (DATABASE_URL) is configured via the PrismaNeon adapter in src/lib/db.ts.
// Source: https://neon.com/docs/guides/prisma (verified 2026-06-13)
import { config as dotenvConfig } from "dotenv"
import { defineConfig, env } from "prisma/config"

// Next.js stores env vars in .env.local (not .env). Load it explicitly so
// prisma CLI commands (db push, migrate dev, generate) pick up DATABASE_URL/DIRECT_URL.
dotenvConfig({ path: ".env.local" })
dotenvConfig({ path: ".env" }) // fallback for CI or environments using .env

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: env("DIRECT_URL"), // unpooled — migrations and db push only
  },
})
