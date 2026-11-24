ALTER TABLE "padelrecs"."stories" ADD COLUMN IF NOT EXISTS "topic" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."stories" ADD COLUMN IF NOT EXISTS "featured_at" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."stories" DROP CONSTRAINT IF EXISTS "story_topic";--> statement-breakpoint
ALTER TABLE "padelrecs"."stories" ADD CONSTRAINT "story_topic" CHECK ("topic" is null or "topic" in ('first','gear','injuries','technique','clubs'));--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "padelrecs"."story_likes" (
	"story_id" text NOT NULL,
	"account_id" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "story_likes_pk" PRIMARY KEY("story_id","account_id")
);--> statement-breakpoint
ALTER TABLE "padelrecs"."story_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."story_likes" ADD CONSTRAINT "story_likes_story_fk" FOREIGN KEY ("story_id") REFERENCES "padelrecs"."stories"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "padelrecs"."story_likes" ADD CONSTRAINT "story_likes_account_fk" FOREIGN KEY ("account_id") REFERENCES "padelrecs"."accounts"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_likes_account_idx" ON "padelrecs"."story_likes" USING btree ("account_id");
