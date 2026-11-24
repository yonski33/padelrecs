ALTER TABLE "padelrecs"."rackets" ADD COLUMN "model_line" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."rackets" ADD CONSTRAINT "racket_model_line" CHECK ("model_line" IS NULL OR "model_line" ~ '^[a-z0-9-]{2,40}$');--> statement-breakpoint
CREATE INDEX "rackets_model_line_idx" ON "padelrecs"."rackets" USING btree ("brand_id","model_line");
