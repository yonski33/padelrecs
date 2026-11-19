ALTER TABLE "padelrecs"."comments" ADD COLUMN IF NOT EXISTS "player_level" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."comments" ADD COLUMN IF NOT EXISTS "playing_side" text;
