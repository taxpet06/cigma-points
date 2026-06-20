-- Migration: reply_thread_xor_check
-- Adds a database-level CHECK constraint enforcing the XOR invariant on Reply:
-- exactly one of post_id or task_id must be non-null (WR-03).
-- This makes orphaned replies (both null) impossible at the DB level,
-- complementing the Zod refine in createReplySchema.

ALTER TABLE replies
  ADD CONSTRAINT reply_thread_xor
  CHECK (
    (post_id IS NOT NULL AND task_id IS NULL) OR
    (post_id IS NULL AND task_id IS NOT NULL)
  );
