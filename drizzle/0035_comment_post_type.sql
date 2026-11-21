-- PadelRecs community feed (owner OK 2026-11-21): a post's optional type, so a Tip saves as a tip. Additive only: one nullable
-- column, existing rows stay null (the page then reads the old rule: a question by its words, else no flair).
ALTER TABLE "padelrecs"."comments" ADD COLUMN IF NOT EXISTS "post_type" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."comments" ADD CONSTRAINT "comment_post_type" CHECK ("post_type" IS NULL OR "post_type" IN ('question', 'tip'));
