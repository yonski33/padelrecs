CREATE TABLE "padelrecs"."evidence" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"niche" text NOT NULL,
	"source_kind" text NOT NULL,
	"source_ref" text NOT NULL,
	"author_key" text,
	"attribute" text NOT NULL,
	"value" real,
	"value_text" text,
	"strength" real DEFAULT 1 NOT NULL,
	"quote" text,
	"said_at" text,
	"extracted_by" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "evidence_source_kind" CHECK ("padelrecs"."evidence"."source_kind" in ('player_report', 'own_review', 'youtube', 'blog', 'maker', 'owner')),
	CONSTRAINT "evidence_strength" CHECK ("padelrecs"."evidence"."strength" in (0.5, 1, 1.5)),
	CONSTRAINT "evidence_has_value" CHECK ("padelrecs"."evidence"."value" is not null or "padelrecs"."evidence"."value_text" is not null)
);
--> statement-breakpoint
ALTER TABLE "padelrecs"."evidence" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "padelrecs"."evidence" ADD CONSTRAINT "evidence_product_id_rackets_id_fk" FOREIGN KEY ("product_id") REFERENCES "padelrecs"."rackets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "evidence_unique" ON "padelrecs"."evidence" USING btree ("product_id","source_kind","source_ref","attribute","extracted_by");--> statement-breakpoint
CREATE INDEX "evidence_product_idx" ON "padelrecs"."evidence" USING btree ("product_id","attribute");--> statement-breakpoint
CREATE INDEX "evidence_reader_idx" ON "padelrecs"."evidence" USING btree ("extracted_by");
