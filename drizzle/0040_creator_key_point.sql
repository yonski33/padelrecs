-- Creator-review glance table (owner 2026-11-22): one short bottom-line sentence per review, shown as the table's "Key point"
-- (6-12 words, 70 characters or fewer), written only from that review's verified fields. Null = the page falls back to the
-- summary's first sentence. Pickleballrecs only for now; safe to run twice.
ALTER TABLE "padelrecs"."creator_reviews" ADD COLUMN IF NOT EXISTS "key_point" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_reviews" DROP CONSTRAINT IF EXISTS "creator_review_key_point";--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_reviews" ADD CONSTRAINT "creator_review_key_point" CHECK ("key_point" IS NULL OR char_length("key_point") <= 90);
