CREATE TABLE "padelrecs"."trait_votes" (
	"racket_id" text NOT NULL,
	"voter" text NOT NULL,
	"network" text NOT NULL,
	"trait" text NOT NULL,
	"choice" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "trait_vote_trait" CHECK ("trait" ~ '^[a-z_]{2,20}$'),
	CONSTRAINT "trait_vote_choice" CHECK ("choice" ~ '^[a-z_]{2,20}$')
);--> statement-breakpoint
ALTER TABLE "padelrecs"."trait_votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."trait_votes" ADD CONSTRAINT "trait_votes_racket_id_rackets_id_fk" FOREIGN KEY ("racket_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "trait_votes_unique" ON "padelrecs"."trait_votes" USING btree ("racket_id","voter","trait");--> statement-breakpoint
CREATE INDEX "trait_votes_racket_idx" ON "padelrecs"."trait_votes" USING btree ("racket_id","trait","choice");--> statement-breakpoint
CREATE INDEX "trait_votes_network_idx" ON "padelrecs"."trait_votes" USING btree ("network","updated_at");
