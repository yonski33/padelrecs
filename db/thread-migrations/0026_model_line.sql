-- Thread: a model-line tag per racket ("metalbone", "at10", "vertex"), for the racket page's "The Metalbone line" block.
-- Nullable; untagged rackets keep "More from <brand>". Filled afterwards by a dry-run script from lib/compare-pairs.ts
-- modelFamily, reviewed by the owner before its own write.
-- NOT APPLIED. Waiting for the owner's OK (db/thread-migrations/README.md).
BEGIN;
ALTER TABLE "padelrecs"."rackets" ADD COLUMN "model_line" text;
ALTER TABLE "padelrecs"."rackets" ADD CONSTRAINT "racket_model_line" CHECK ("model_line" IS NULL OR "model_line" ~ '^[a-z0-9-]{2,40}$');
CREATE INDEX "rackets_model_line_idx" ON "padelrecs"."rackets" USING btree ("brand_id","model_line");
SELECT count(*) FILTER (WHERE "model_line" IS NULL) AS untagged FROM "padelrecs"."rackets";
COMMIT;
