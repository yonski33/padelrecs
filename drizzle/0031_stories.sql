CREATE TABLE IF NOT EXISTS "padelrecs"."stories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"account_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"rackets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"spam_score" integer DEFAULT 0 NOT NULL,
	"network" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "story_status" CHECK ("status" in ('pending','approved','rejected')),
	CONSTRAINT "story_title" CHECK (char_length("title") between 8 and 100),
	CONSTRAINT "story_body" CHECK (char_length("body") between 400 and 12000)
);--> statement-breakpoint
ALTER TABLE "padelrecs"."stories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."stories" ADD CONSTRAINT "stories_account_fk" FOREIGN KEY ("account_id") REFERENCES "padelrecs"."accounts"("id") ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "stories_slug_unique" ON "padelrecs"."stories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "stories_list_idx" ON "padelrecs"."stories" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "stories_account_idx" ON "padelrecs"."stories" USING btree ("account_id");--> statement-breakpoint
ALTER TABLE "padelrecs"."comments" DROP CONSTRAINT IF EXISTS "comment_page";--> statement-breakpoint
ALTER TABLE "padelrecs"."comments" ADD CONSTRAINT "comment_page" CHECK ("page" ~ '^(racket|ranking|guide|story):[A-Za-z0-9_-]{1,100}$');
