-- Creator reviews per config (LaptopRecs, 2026-11-24, CONFIG-GROUPING-PROPOSAL.md): reviewers test different configs of one
-- laptop model (CPU, GPU, RAM, screen), so each review keeps the config it covered. `config` holds the source's own words per
-- field ({"cpu","gpu","ram","storage","screen","price_as_tested"}, null where the source doesn't say); `config_label` is the
-- card's short "Reviewed: ..." line; `config_note` the line for a source that covers two configs; `config_group` is an
-- optional hand-set group ("Snapdragon", "RTX 5080") that wins over the one the page derives (db/creators/laptop-config-axes.json).
-- Needs 0039 and 0040 first. NOT APPLIED anywhere: applied by hand to laptoprecs only, with the owner's OK. Safe to run twice.
ALTER TABLE "padelrecs"."creator_reviews" ADD COLUMN IF NOT EXISTS "config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_reviews" ADD COLUMN IF NOT EXISTS "config_label" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_reviews" ADD COLUMN IF NOT EXISTS "config_note" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_reviews" ADD COLUMN IF NOT EXISTS "config_group" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_reviews" DROP CONSTRAINT IF EXISTS "creator_review_config_label";--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_reviews" ADD CONSTRAINT "creator_review_config_label" CHECK ("config_label" IS NULL OR char_length("config_label") <= 120);
