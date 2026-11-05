CREATE TABLE "padelrecs"."product_photos" (
	"racket_id" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "product_photos_racket_id_rackets_id_fk" FOREIGN KEY ("racket_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE "padelrecs"."product_photos" ENABLE ROW LEVEL SECURITY;