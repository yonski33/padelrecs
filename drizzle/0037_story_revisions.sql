CREATE TABLE IF NOT EXISTS "padelrecs"."story_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"rackets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"topic" text,
	"edited_by" text NOT NULL,
	"editor_id" text,
	"created_at" text NOT NULL,
	CONSTRAINT "story_revisions_by" CHECK ("edited_by" in ('admin','member'))
);--> statement-breakpoint
ALTER TABLE "padelrecs"."story_revisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."story_revisions" ADD CONSTRAINT "story_revisions_story_fk" FOREIGN KEY ("story_id") REFERENCES "padelrecs"."stories"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_revisions_story_idx" ON "padelrecs"."story_revisions" USING btree ("story_id","created_at");
