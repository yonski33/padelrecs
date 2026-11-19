CREATE TABLE "padelrecs"."accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"level" text,
	"side" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "account_status" CHECK ("status" in ('active','blocked')),
	CONSTRAINT "account_name" CHECK (char_length("name") between 2 and 24),
	CONSTRAINT "account_name_key" CHECK (char_length("name_key") between 2 and 24)
);--> statement-breakpoint
ALTER TABLE "padelrecs"."accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_name_key_unique" ON "padelrecs"."accounts" USING btree ("name_key");--> statement-breakpoint
CREATE TABLE "padelrecs"."account_posts" (
	"kind" text NOT NULL,
	"post_id" text NOT NULL,
	"account_id" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "account_posts_pk" PRIMARY KEY("kind","post_id"),
	CONSTRAINT "account_post_kind" CHECK ("kind" in ('review','comment'))
);--> statement-breakpoint
ALTER TABLE "padelrecs"."account_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."account_posts" ADD CONSTRAINT "account_posts_account_fk" FOREIGN KEY ("account_id") REFERENCES "padelrecs"."accounts"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX "account_posts_account_idx" ON "padelrecs"."account_posts" USING btree ("account_id");--> statement-breakpoint
CREATE TABLE "padelrecs"."account_devices" (
	"account_id" text NOT NULL,
	"voter" text NOT NULL,
	"linked_at" text NOT NULL,
	CONSTRAINT "account_devices_pk" PRIMARY KEY("account_id","voter")
);--> statement-breakpoint
ALTER TABLE "padelrecs"."account_devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."account_devices" ADD CONSTRAINT "account_devices_account_fk" FOREIGN KEY ("account_id") REFERENCES "padelrecs"."accounts"("id") ON DELETE cascade;--> statement-breakpoint
CREATE TABLE "padelrecs"."review_devices" (
	"review_id" text PRIMARY KEY NOT NULL,
	"voter" text NOT NULL
);--> statement-breakpoint
ALTER TABLE "padelrecs"."review_devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."review_devices" ADD CONSTRAINT "review_devices_review_fk" FOREIGN KEY ("review_id") REFERENCES "padelrecs"."reviews"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX "review_devices_voter_idx" ON "padelrecs"."review_devices" USING btree ("voter");
