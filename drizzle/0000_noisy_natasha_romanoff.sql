CREATE SCHEMA "padelrecs";
--> statement-breakpoint
CREATE TABLE "padelrecs"."brands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "padelrecs"."external_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"racket_id" text NOT NULL,
	"excerpt" text NOT NULL,
	"source_platform" text NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"source_date" text,
	"external_rating" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "padelrecs"."rackets" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"year" integer NOT NULL,
	"image_url" text,
	"shape" text,
	"weight" text,
	"balance" text,
	"surface" text,
	"core" text,
	"description" text,
	"created_at" text NOT NULL,
	CONSTRAINT "rackets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "padelrecs"."reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"racket_id" text NOT NULL,
	"rating" integer NOT NULL,
	"power_rating" integer,
	"control_rating" integer,
	"maneuverability_rating" integer,
	"comfort_rating" integer,
	"forgiveness_rating" integer,
	"player_level" text,
	"playing_side" text,
	"playing_style" text,
	"time_with_racket" text,
	"review_text" text NOT NULL,
	"alias" text,
	"email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "review_status" CHECK ("padelrecs"."reviews"."status" in ('pending','approved','rejected')),
	CONSTRAINT "review_rating" CHECK ("padelrecs"."reviews"."rating" between 1 and 5),
	CONSTRAINT "review_category_0" CHECK ("padelrecs"."reviews"."power_rating" is null or "padelrecs"."reviews"."power_rating" between 1 and 5),
	CONSTRAINT "review_category_1" CHECK ("padelrecs"."reviews"."control_rating" is null or "padelrecs"."reviews"."control_rating" between 1 and 5),
	CONSTRAINT "review_category_2" CHECK ("padelrecs"."reviews"."maneuverability_rating" is null or "padelrecs"."reviews"."maneuverability_rating" between 1 and 5),
	CONSTRAINT "review_category_3" CHECK ("padelrecs"."reviews"."comfort_rating" is null or "padelrecs"."reviews"."comfort_rating" between 1 and 5),
	CONSTRAINT "review_category_4" CHECK ("padelrecs"."reviews"."forgiveness_rating" is null or "padelrecs"."reviews"."forgiveness_rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "padelrecs"."external_reviews" ADD CONSTRAINT "external_reviews_racket_id_rackets_id_fk" FOREIGN KEY ("racket_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "padelrecs"."rackets" ADD CONSTRAINT "rackets_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "padelrecs"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "padelrecs"."reviews" ADD CONSTRAINT "reviews_racket_id_rackets_id_fk" FOREIGN KEY ("racket_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "external_racket_idx" ON "padelrecs"."external_reviews" USING btree ("racket_id");--> statement-breakpoint
CREATE INDEX "external_feed_idx" ON "padelrecs"."external_reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rackets_brand_idx" ON "padelrecs"."rackets" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "reviews_feed_idx" ON "padelrecs"."reviews" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reviews_racket_idx" ON "padelrecs"."reviews" USING btree ("racket_id");