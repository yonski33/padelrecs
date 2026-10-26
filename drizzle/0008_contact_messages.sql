CREATE TABLE "padelrecs"."contact_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" text NOT NULL,
	CONSTRAINT "contact_message_status" CHECK ("padelrecs"."contact_messages"."status" in ('pending','sent','failed','spam'))
);
--> statement-breakpoint
ALTER TABLE "padelrecs"."contact_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "contact_messages_created_idx" ON "padelrecs"."contact_messages" USING btree ("created_at");