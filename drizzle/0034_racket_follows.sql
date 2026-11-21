CREATE TABLE IF NOT EXISTS "padelrecs"."racket_follows" (
	"user_id" text NOT NULL,
	"racket_id" text NOT NULL,
	"created_at" text NOT NULL,
	"last_notified_at" text,
	CONSTRAINT "racket_follows_pk" PRIMARY KEY("user_id","racket_id")
);--> statement-breakpoint
ALTER TABLE "padelrecs"."racket_follows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."racket_follows" ADD CONSTRAINT "racket_follows_racket_fk" FOREIGN KEY ("racket_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "racket_follows_racket_idx" ON "padelrecs"."racket_follows" USING btree ("racket_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "padelrecs"."follow_sent" (
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"post_id" text NOT NULL,
	"sent_at" text NOT NULL,
	CONSTRAINT "follow_sent_pk" PRIMARY KEY("user_id","kind","post_id"),
	CONSTRAINT "follow_sent_kind" CHECK ("kind" in ('review','comment','story'))
);--> statement-breakpoint
ALTER TABLE "padelrecs"."follow_sent" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_sent_at_idx" ON "padelrecs"."follow_sent" USING btree ("sent_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "padelrecs"."follow_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"emails" boolean DEFAULT true NOT NULL,
	"updated_at" text NOT NULL
);--> statement-breakpoint
ALTER TABLE "padelrecs"."follow_settings" ENABLE ROW LEVEL SECURITY;
