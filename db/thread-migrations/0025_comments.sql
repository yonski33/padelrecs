-- Thread: light Q&A comments with replies and ▲▼ votes (racket, ranking and guide pages). Auto-moderated like the review queue:
-- the same spam score (lib/review-spam.ts) decides approved / pending / rejected, and only approved ones show.
-- page is "racket:<racket id>", "ranking:<slug>" or "guide:<key>". One level of replies (parent_id). One vote per device.
-- NOT APPLIED. Waiting for the owner's OK (db/thread-migrations/README.md).
BEGIN;
CREATE TABLE "padelrecs"."comments" (
	"id" text PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"parent_id" text,
	"alias" text NOT NULL,
	"body" text NOT NULL,
	"is_question" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"spam_score" integer DEFAULT 0 NOT NULL,
	"voter" text NOT NULL,
	"network" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "comment_status" CHECK ("status" in ('pending','approved','rejected')),
	CONSTRAINT "comment_page" CHECK ("page" ~ '^(racket|ranking|guide):[A-Za-z0-9_-]{1,100}$'),
	CONSTRAINT "comment_body" CHECK (char_length("body") between 2 and 2000),
	CONSTRAINT "comment_alias" CHECK (char_length("alias") between 1 and 50)
);
ALTER TABLE "padelrecs"."comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "padelrecs"."comments" ADD CONSTRAINT "comments_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "padelrecs"."comments"("id") ON DELETE cascade;
CREATE INDEX "comments_page_idx" ON "padelrecs"."comments" USING btree ("page","status","created_at");
CREATE INDEX "comments_queue_idx" ON "padelrecs"."comments" USING btree ("status","created_at");
CREATE INDEX "comments_network_idx" ON "padelrecs"."comments" USING btree ("network","created_at");

CREATE TABLE "padelrecs"."comment_votes" (
	"comment_id" text NOT NULL,
	"voter" text NOT NULL,
	"value" integer NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "comment_vote_value" CHECK ("value" in (-1, 1))
);
ALTER TABLE "padelrecs"."comment_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "padelrecs"."comment_votes" ADD CONSTRAINT "comment_votes_comment_fk" FOREIGN KEY ("comment_id") REFERENCES "padelrecs"."comments"("id") ON DELETE cascade;
CREATE UNIQUE INDEX "comment_votes_unique" ON "padelrecs"."comment_votes" USING btree ("comment_id","voter");
SELECT (SELECT count(*) FROM "padelrecs"."comments") AS comments, (SELECT count(*) FROM "padelrecs"."comment_votes") AS comment_votes;
COMMIT;
