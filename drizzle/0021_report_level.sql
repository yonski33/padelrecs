ALTER TABLE "padelrecs"."external_reviews" ADD COLUMN "player_level" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."external_reviews" ADD COLUMN "level_quote" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."reviews" ADD COLUMN "level_quote" text;
