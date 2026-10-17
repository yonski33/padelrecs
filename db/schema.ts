import { pgSchema, text, integer, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
// Not exposed through Supabase's public Data API. All catalog access goes through Next.js.
export const catalogSchema = pgSchema("padelrecs");
export const brands = catalogSchema.table("brands", { id: text("id").primaryKey(), name: text("name").notNull(), slug: text("slug").notNull().unique() }).enableRLS();
export const rackets = catalogSchema.table("rackets", {
 id: text("id").primaryKey(), brandId: text("brand_id").notNull().references(() => brands.id), name: text("name").notNull(), slug: text("slug").notNull().unique(), year: integer("year").notNull(), imageUrl: text("image_url"), shape: text("shape"), weight: text("weight"), balance: text("balance"), surface: text("surface"), core: text("core"), description: text("description"), createdAt: text("created_at").notNull()
}, table => [index("rackets_brand_idx").on(table.brandId)]).enableRLS();
export const reviews = catalogSchema.table("reviews", {
 id: text("id").primaryKey(), racketId: text("racket_id").notNull().references(() => rackets.id), rating: integer("rating").notNull(), powerRating: integer("power_rating"), controlRating: integer("control_rating"), maneuverabilityRating: integer("maneuverability_rating"), comfortRating: integer("comfort_rating"), forgivenessRating: integer("forgiveness_rating"), playerLevel: text("player_level"), playingSide: text("playing_side"), playingStyle: text("playing_style"), timeWithRacket: text("time_with_racket"), reviewText: text("review_text").notNull(), alias: text("alias"), email: text("email"), status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"), createdAt: text("created_at").notNull()
}, t => [index("reviews_feed_idx").on(t.status,t.createdAt),index("reviews_racket_idx").on(t.racketId),check("review_status",sql`${t.status} in ('pending','approved','rejected')`),check("review_rating",sql`${t.rating} between 1 and 5`),...([t.powerRating,t.controlRating,t.maneuverabilityRating,t.comfortRating,t.forgivenessRating].map((column,i)=>check(`review_category_${i}`,sql`${column} is null or ${column} between 1 and 5`)))]).enableRLS();
export const externalReviews = catalogSchema.table("external_reviews", {
 id: text("id").primaryKey(), racketId: text("racket_id").notNull().references(() => rackets.id), excerpt: text("excerpt").notNull(), sourcePlatform: text("source_platform").notNull(), sourceName: text("source_name").notNull(), sourceUrl: text("source_url").notNull(), sourceDate: text("source_date"), externalRating: integer("external_rating"), createdAt: text("created_at").notNull()
}, t => [index("external_racket_idx").on(t.racketId),index("external_feed_idx").on(t.createdAt)]).enableRLS();
