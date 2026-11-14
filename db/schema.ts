import { pgSchema, text, integer, index, check, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { niche } from "../lib/niche";
// One Postgres schema per niche ("padelrecs", …) in the shared Supabase project. Not exposed through Supabase's
// public Data API; all catalog access goes through Next.js. Table names say "rackets" for every niche.
export const catalogSchema = pgSchema(niche.schema);
export const brands = catalogSchema.table("brands", { id: text("id").primaryKey(), name: text("name").notNull(), slug: text("slug").notNull().unique() }).enableRLS();
export const rackets = catalogSchema.table("rackets", {
 id: text("id").primaryKey(), brandId: text("brand_id").notNull().references(() => brands.id), name: text("name").notNull(), slug: text("slug").notNull().unique(), year: integer("year").notNull(), imageUrl: text("image_url"), shape: text("shape"), weight: text("weight"), balance: text("balance"), surface: text("surface"), core: text("core"), description: text("description"),
 // The owner can set a product's signal score by hand (0–99) in the admin area; null means worked out from reviews.
 signalOverride: integer("signal_override"),
  // The product's official website (software, financial products) and, once the site has one, an affiliate link that
  // replaces it on the "Visit site" button. See lib/product-links.ts.
  websiteUrl: text("website_url"), affiliateUrl: text("affiliate_url"), reviewSummary: text("review_summary"), amazonAsin: text("amazon_asin"), amazonImage: text("amazon_image"), amazonCheckedAt: text("amazon_checked_at"), createdAt: text("created_at").notNull()
}, table => [index("rackets_brand_idx").on(table.brandId)]).enableRLS();
export const reviews = catalogSchema.table("reviews", {
 id: text("id").primaryKey(), racketId: text("racket_id").notNull().references(() => rackets.id), rating: integer("rating").notNull(), powerRating: integer("power_rating"), controlRating: integer("control_rating"), maneuverabilityRating: integer("maneuverability_rating"), comfortRating: integer("comfort_rating"), forgivenessRating: integer("forgiveness_rating"), playerLevel: text("player_level"), playingSide: text("playing_side"), playingStyle: text("playing_style"), timeWithRacket: text("time_with_racket"), reviewText: text("review_text").notNull(), alias: text("alias"), email: text("email"),
 // The variant the player used, on niches with niche.variants (DiscGolfRecs: the plastic, one of the product's `core` list); null when unknown.
 // Marker highlights: 1-2 exact phrases of review_text, picked by a Sonnet pass (owner 2026-11-14); null until picked.
 highlights: text("highlights").array(),
 variant: text("variant"), status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"), tags: text("tags").array().notNull().default(sql`'{}'::text[]`), createdAt: text("created_at").notNull()
}, t => [index("reviews_feed_idx").on(t.status,t.createdAt),index("reviews_racket_idx").on(t.racketId),check("review_status",sql`${t.status} in ('pending','approved','rejected')`),check("review_rating",sql`${t.rating} between 1 and 5`),...([t.powerRating,t.controlRating,t.maneuverabilityRating,t.comfortRating,t.forgivenessRating].map((column,i)=>check(`review_category_${i}`,sql`${column} is null or ${column} between 1 and 5`)))]).enableRLS();
export const externalReviews = catalogSchema.table("external_reviews", {
 id: text("id").primaryKey(), racketId: text("racket_id").notNull().references(() => rackets.id), // Our own words describing the source's experience (shown as "<Site> summary"); excerpt is the source's exact words.
 // At least one of the two is present.
 excerpt: text("excerpt"), summary: text("summary"),
 // When the source is not in English: its language (ISO 639-1, e.g. "es") and our English translation of the excerpt. The excerpt
 // itself stays the source's exact words; the site shows the translation, labelled, with the original one click away.
 sourceLanguage: text("source_language"), excerptTranslation: text("excerpt_translation"),
 // How the source felt overall, judged when the item was moderated; null when nobody judged it.
 sentiment: text("sentiment", { enum: ["positive", "negative", "mixed"] }), sourcePlatform: text("source_platform").notNull(), sourceName: text("source_name").notNull(), sourceUrl: text("source_url").notNull(), sourceDate: text("source_date"), externalRating: integer("external_rating"),
 // The product variant the source used, on niches with niche.variants (DiscGolfRecs: the plastic, one of the product's `core` list); null when unknown.
 variant: text("variant"), tags: text("tags").array().notNull().default(sql`'{}'::text[]`), createdAt: text("created_at").notNull(),
 // Set when the owner edits or confirms the review in the admin; publishing then leaves its text, sentiment and tags alone.
 adminEditedAt: text("admin_edited_at"),
 // Marker highlights: 1-2 exact phrases of the text the card shows (summary, else the excerpt or its translation); null until picked.
 highlights: text("highlights").array()
}, t => [index("external_racket_idx").on(t.racketId),index("external_feed_idx").on(t.createdAt),check("external_review_text",sql`${t.excerpt} is not null or ${t.summary} is not null`),check("external_review_sentiment",sql`${t.sentiment} is null or ${t.sentiment} in ('positive','negative','mixed')`)]).enableRLS();
// "Helpful" votes. The voter is a keyed hash of the visitor's network and browser, never the raw IP.
export const reviewVotes = catalogSchema.table("review_votes", {
 reviewType: text("review_type", { enum: ["player", "web"] }).notNull(), reviewId: text("review_id").notNull(), voter: text("voter").notNull(), createdAt: text("created_at").notNull()
}, t => [uniqueIndex("review_votes_unique").on(t.reviewType, t.reviewId, t.voter), index("review_votes_voter_idx").on(t.voter, t.createdAt), check("review_vote_type", sql`${t.reviewType} in ('player','web')`)]).enableRLS();
// Old racket URLs keep working after a slug change: /rackets/<old slug> redirects to the racket's current slug.
export const racketSlugRedirects = catalogSchema.table("racket_slug_redirects", {
 slug: text("slug").primaryKey(), racketId: text("racket_id").notNull().references(() => rackets.id), createdAt: text("created_at").notNull()
}, t => [index("racket_slug_redirects_racket_idx").on(t.racketId)]).enableRLS();
// Contact-form messages (app/api/contact). Saved before the email is sent, so a Resend failure loses nothing; status says
// what happened to the email. Written only by the server; like every table here it is not exposed through the Data API.
/** Photos uploaded in the admin area, base64 webp. A table of its own so catalog reads don't carry them. */
export const productPhotos = catalogSchema.table("product_photos", {
  racketId: text("racket_id").primaryKey().references(() => rackets.id, { onDelete: "cascade" }), data: text("data").notNull(), updatedAt: text("updated_at").notNull()
}).enableRLS();

export const contactMessages = catalogSchema.table("contact_messages", {
 id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull(), subject: text("subject").notNull(), message: text("message").notNull(), status: text("status", { enum: ["pending", "sent", "failed", "spam"] }).notNull().default("pending"), error: text("error"), createdAt: text("created_at").notNull()
}, t => [index("contact_messages_created_idx").on(t.createdAt), check("contact_message_status", sql`${t.status} in ('pending','sent','failed','spam')`)]).enableRLS();
