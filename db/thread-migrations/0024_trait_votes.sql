-- Thread: "How does it play?" trait votes (Metalbone CTRL Thread v7). One vote per group per device, changeable; the device is
-- the same keyed hash as product_votes.voter (app/api/racket-votes), the network hash rate-limits like product_votes.
-- Groups and options are app constants (side, plays_like, sweet_spot, level, arm, durability, trampoline, feel, maneuver).
-- NOT APPLIED. Waiting for the owner's OK (db/thread-migrations/README.md).
BEGIN;
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
);
ALTER TABLE "padelrecs"."trait_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "padelrecs"."trait_votes" ADD CONSTRAINT "trait_votes_racket_id_rackets_id_fk" FOREIGN KEY ("racket_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE cascade;
CREATE UNIQUE INDEX "trait_votes_unique" ON "padelrecs"."trait_votes" USING btree ("racket_id","voter","trait");
CREATE INDEX "trait_votes_racket_idx" ON "padelrecs"."trait_votes" USING btree ("racket_id","trait","choice");
CREATE INDEX "trait_votes_network_idx" ON "padelrecs"."trait_votes" USING btree ("network","updated_at");
SELECT count(*) AS trait_votes_rows FROM "padelrecs"."trait_votes";
COMMIT;
