-- M-01: multi-target posts.
-- Introduce the post_targets junction table, backfill it from the existing
-- single-target posts.targetUserId column, then drop that column.

-- CreateTable
CREATE TABLE "post_targets" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "post_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_targets_userId_idx" ON "post_targets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "post_targets_postId_userId_key" ON "post_targets"("postId", "userId");

-- AddForeignKey
ALTER TABLE "post_targets" ADD CONSTRAINT "post_targets_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_targets" ADD CONSTRAINT "post_targets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: every existing post becomes a single-target link.
-- gen_random_uuid() is available in Postgres 13+ (pgcrypto / core); ids are opaque strings.
INSERT INTO "post_targets" ("id", "postId", "userId")
SELECT gen_random_uuid()::text, "id", "targetUserId"
FROM "posts";

-- Drop the old single-target FK + column.
ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_targetUserId_fkey";
ALTER TABLE "posts" DROP COLUMN "targetUserId";
