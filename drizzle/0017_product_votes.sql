CREATE TABLE "padelrecs"."product_votes" (
	"racket_id" text NOT NULL,
	"voter" text NOT NULL,
	"network" text NOT NULL,
	"verdict" text NOT NULL,
	"level" text,
	"style" text,
	"side" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "product_vote_verdict" CHECK ("padelrecs"."product_votes"."verdict" in ('love','ok','no'))
);
--> statement-breakpoint
ALTER TABLE "padelrecs"."product_votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."product_votes" ADD CONSTRAINT "product_votes_racket_id_rackets_id_fk" FOREIGN KEY ("racket_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_votes_unique" ON "padelrecs"."product_votes" USING btree ("racket_id","voter");--> statement-breakpoint
CREATE INDEX "product_votes_voter_idx" ON "padelrecs"."product_votes" USING btree ("voter");--> statement-breakpoint
CREATE INDEX "product_votes_network_idx" ON "padelrecs"."product_votes" USING btree ("network","updated_at");
