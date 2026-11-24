CREATE TABLE "padelrecs"."trait_overrides" (
	"racket_id" text NOT NULL,
	"trait" text NOT NULL,
	"review_counts" jsonb,
	"frozen" boolean DEFAULT false NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "trait_overrides_pk" PRIMARY KEY("racket_id","trait"),
	CONSTRAINT "trait_override_trait" CHECK ("trait" ~ '^[a-z_]{2,20}$')
);--> statement-breakpoint
ALTER TABLE "padelrecs"."trait_overrides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."trait_overrides" ADD CONSTRAINT "trait_overrides_racket_id_rackets_id_fk" FOREIGN KEY ("racket_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE cascade;--> statement-breakpoint
CREATE TABLE "padelrecs"."trait_admin_log" (
	"id" text PRIMARY KEY NOT NULL,
	"racket_id" text NOT NULL,
	"trait" text,
	"action" text NOT NULL,
	"detail" jsonb,
	"created_at" text NOT NULL,
	CONSTRAINT "trait_admin_log_action" CHECK ("action" ~ '^[a-z_]{2,30}$')
);--> statement-breakpoint
ALTER TABLE "padelrecs"."trait_admin_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "trait_admin_log_racket_idx" ON "padelrecs"."trait_admin_log" USING btree ("racket_id","created_at");
