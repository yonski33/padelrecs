CREATE TABLE "padelrecs"."racket_slug_redirects" (
	"slug" text PRIMARY KEY NOT NULL,
	"racket_id" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "padelrecs"."racket_slug_redirects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."racket_slug_redirects" ADD CONSTRAINT "racket_slug_redirects_racket_id_rackets_id_fk" FOREIGN KEY ("racket_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "racket_slug_redirects_racket_idx" ON "padelrecs"."racket_slug_redirects" USING btree ("racket_id");