ALTER TABLE "padelrecs"."accounts" ADD COLUMN IF NOT EXISTS "trust" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."accounts" ADD CONSTRAINT "account_trust" CHECK ("trust" is null or "trust" in ('earned','on','off'));
