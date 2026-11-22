-- Admin "Edit flair" on live posts (2026-11-22): post_type may also hold 'none', an admin's "no flair" that beats the
-- question-from-the-words guess (null stays "no saved type": the page guesses). Only the check changes; no rows move.
ALTER TABLE "padelrecs"."comments" DROP CONSTRAINT IF EXISTS "comment_post_type";--> statement-breakpoint
ALTER TABLE "padelrecs"."comments" ADD CONSTRAINT "comment_post_type" CHECK ("post_type" IS NULL OR "post_type" IN ('question', 'tip', 'none'));
