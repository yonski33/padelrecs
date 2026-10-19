ALTER TABLE "padelrecs"."external_reviews" ALTER COLUMN "excerpt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "padelrecs"."external_reviews" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "padelrecs"."external_reviews" ADD CONSTRAINT "external_review_text" CHECK ("padelrecs"."external_reviews"."excerpt" is not null or "padelrecs"."external_reviews"."summary" is not null);