ALTER TABLE "padelrecs"."stories" ADD COLUMN IF NOT EXISTS "pending_edit" jsonb;--> statement-breakpoint
ALTER TABLE "padelrecs"."stories" ADD COLUMN IF NOT EXISTS "edited_at" text;;--> statement-breakpoint
ALTER TABLE "padelrecs"."stories" ADD COLUMN IF NOT EXISTS "old_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL;
