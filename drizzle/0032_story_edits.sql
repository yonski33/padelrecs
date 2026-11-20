ALTER TABLE "padelrecs"."stories" ADD COLUMN IF NOT EXISTS "pending_edit" jsonb;--> statement-breakpoint
ALTER TABLE "padelrecs"."stories" ADD COLUMN IF NOT EXISTS "edited_at" text;
