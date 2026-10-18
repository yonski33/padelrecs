CREATE TABLE "padelrecs"."review_votes" (
	"review_type" text NOT NULL,
	"review_id" text NOT NULL,
	"voter" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "review_vote_type" CHECK ("padelrecs"."review_votes"."review_type" in ('player','web'))
);
--> statement-breakpoint
ALTER TABLE "padelrecs"."review_votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "review_votes_unique" ON "padelrecs"."review_votes" USING btree ("review_type","review_id","voter");--> statement-breakpoint
CREATE INDEX "review_votes_voter_idx" ON "padelrecs"."review_votes" USING btree ("voter","created_at");