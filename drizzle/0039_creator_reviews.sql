-- Creator-review pages (PickleballRecs first, owner 2026-11-22): what YouTube, blog and TikTok reviewers said about one
-- product, the page's short lines, and shop prices. Written for "padelrecs" like every migration and rewritten per niche
-- (db/migrations.ts); applied by hand to pickleballrecs only. Every statement is safe to run twice (IF NOT EXISTS, guarded
-- constraints), so a later db:migrate on a schema that already has the tables changes nothing. See CREATOR-DB-SCHEMA.md.
-- Not in db/schema.ts on purpose: only schemas that ran 0039 have these tables (read them with plain SQL, db/creator-reviews.ts).
CREATE TABLE IF NOT EXISTS "padelrecs"."creator_pages" (
	"racket_id" text PRIMARY KEY NOT NULL REFERENCES "padelrecs"."rackets"("id") ON DELETE CASCADE,
	"tldr" text,
	"group_pos" text,
	"group_mix" text,
	"group_neg" text,
	"status" text DEFAULT 'live' NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "creator_page_status" CHECK ("status" in ('live','draft'))
);--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "padelrecs"."creator_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"racket_id" text NOT NULL REFERENCES "padelrecs"."rackets"("id") ON DELETE CASCADE,
	"url" text NOT NULL,
	"platform" text NOT NULL,
	"review_type" text DEFAULT 'review' NOT NULL,
	"creator" text NOT NULL,
	"channel_url" text,
	"handle" text,
	"same_channel_as" text,
	"language" text DEFAULT 'en' NOT NULL,
	"published_on" text,
	"duration_s" integer,
	"video_id" text,
	"thumbnail_url" text,
	"stance" text NOT NULL,
	"summary" text NOT NULL,
	"summary_more" text,
	"summary_short" text,
	"highlights" text[] DEFAULT '{}'::text[] NOT NULL,
	"stood_out" text,
	"trade_off" text,
	"compared_to" text,
	"quote" text,
	"quote_at_s" integer,
	"chapters" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"score_value" numeric,
	"score_scale" numeric,
	"score_label" text,
	"score_hidden" boolean DEFAULT false NOT NULL,
	"measured" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"also_url" text,
	"version" text,
	"edition" text,
	"note" text,
	"brand_tie" text,
	"disclosure" text,
	"evidence_note" text,
	"check_result" text,
	"status" text DEFAULT 'live' NOT NULL,
	"source" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "creator_review_product_url" UNIQUE("racket_id","url"),
	CONSTRAINT "creator_review_platform" CHECK ("platform" in ('youtube','blog','tiktok')),
	CONSTRAINT "creator_review_type" CHECK ("review_type" in ('review','comparison','long-term','short_update','ranking_mention')),
	CONSTRAINT "creator_review_stance" CHECK ("stance" in ('pos','mix','neg')),
	CONSTRAINT "creator_review_edition" CHECK ("edition" is null or "edition" in ('original','crystal_blue','unknown')),
	CONSTRAINT "creator_review_status" CHECK ("status" in ('live','hidden'))
);--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_reviews_racket_idx" ON "padelrecs"."creator_reviews" USING btree ("racket_id","status");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "padelrecs"."creator_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"racket_id" text NOT NULL REFERENCES "padelrecs"."rackets"("id") ON DELETE CASCADE,
	"shop" text NOT NULL,
	"url" text NOT NULL,
	"price" numeric(10,2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"in_stock" boolean NOT NULL,
	"edition" text,
	"listing_title" text,
	"affiliate" boolean DEFAULT false NOT NULL,
	"affiliate_note" text,
	"source" text NOT NULL,
	"checked_at" text NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	CONSTRAINT "creator_price_product_url" UNIQUE("racket_id","url"),
	CONSTRAINT "creator_price_positive" CHECK ("price" > 0),
	CONSTRAINT "creator_price_status" CHECK ("status" in ('live','hidden'))
);--> statement-breakpoint
ALTER TABLE "padelrecs"."creator_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_prices_racket_idx" ON "padelrecs"."creator_prices" USING btree ("racket_id","status");
