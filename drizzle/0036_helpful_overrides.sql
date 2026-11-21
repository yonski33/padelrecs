CREATE TABLE IF NOT EXISTS "padelrecs"."helpful_overrides" (
	"kind" text NOT NULL,
	"post_id" text NOT NULL,
	"value" integer NOT NULL,
	"set_by" text NOT NULL,
	"set_at" text NOT NULL,
	CONSTRAINT "helpful_overrides_pk" PRIMARY KEY("kind","post_id"),
	CONSTRAINT "helpful_override_kind" CHECK ("kind" in ('player','web','comment')),
	CONSTRAINT "helpful_override_value" CHECK ("value" between -99999 and 99999)
);--> statement-breakpoint
ALTER TABLE "padelrecs"."helpful_overrides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "padelrecs"."helpful_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"post_id" text NOT NULL,
	"action" text NOT NULL,
	"from_shown" integer NOT NULL,
	"to_shown" integer NOT NULL,
	"real_count" integer NOT NULL,
	"voter" text,
	"by" text NOT NULL,
	"at" text NOT NULL,
	CONSTRAINT "helpful_audit_action" CHECK ("action" in ('set','reset','remove-voter','remove-voter-everywhere'))
);--> statement-breakpoint
ALTER TABLE "padelrecs"."helpful_audit" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "helpful_audit_post_idx" ON "padelrecs"."helpful_audit" USING btree ("kind","post_id","at");
