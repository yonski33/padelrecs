import { pgSchema, text, integer, boolean, index, check, uniqueIndex, jsonb, primaryKey } from "drizzle-orm/pg-core";
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
// Quick ratings (2026-11-14 pivot): one 1–5 tap of the niche's balls per product per device, with the voter's level, style
// and side when they gave them. voter is a keyed hash of a random device cookie; network a keyed hash of IP + browser, for rate limits.
export const productVotes = catalogSchema.table("product_votes", {
 racketId: text("racket_id").notNull().references(() => rackets.id), voter: text("voter").notNull(), network: text("network").notNull(),
 rating: integer("rating").notNull(), level: text("level"), style: text("style"), side: text("side"),
 createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull()
}, t => [uniqueIndex("product_votes_unique").on(t.racketId, t.voter), index("product_votes_voter_idx").on(t.voter), index("product_votes_network_idx").on(t.network, t.updatedAt), check("product_vote_rating", sql`${t.rating} between 1 and 5`)]).enableRLS();
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

// Thread redesign (owner OK 2026-11-19, drizzle/0024–0026; applied to PadelRecs only). rackets.model_line (0026) is not
// mapped here: the other sites' schemas don't have it yet, so it is read with SQL on padel only.
/** "How does it play?" votes: one per trait group per device (voter, the product_votes hash), changeable. */
export const traitVotes = catalogSchema.table("trait_votes", {
 racketId: text("racket_id").notNull().references(() => rackets.id, { onDelete: "cascade" }), voter: text("voter").notNull(), network: text("network").notNull(),
 trait: text("trait").notNull(), choice: text("choice").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull()
}, t => [uniqueIndex("trait_votes_unique").on(t.racketId, t.voter, t.trait), index("trait_votes_racket_idx").on(t.racketId, t.trait, t.choice), index("trait_votes_network_idx").on(t.network, t.updatedAt),
 check("trait_vote_trait", sql`${t.trait} ~ '^[a-z_]{2,20}$'`), check("trait_vote_choice", sql`${t.choice} ~ '^[a-z_]{2,20}$'`)]).enableRLS();
/** Comments on racket, ranking and guide pages ("racket:<id>", "ranking:<slug>", "guide:<key>"), one level of replies, moderated like reviews. */
export const comments = catalogSchema.table("comments", {
 id: text("id").primaryKey(), page: text("page").notNull(), parentId: text("parent_id"), alias: text("alias").notNull(), body: text("body").notNull(),
 isQuestion: boolean("is_question").notNull().default(false), status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
 spamScore: integer("spam_score").notNull().default(0), voter: text("voter").notNull(), network: text("network").notNull(), createdAt: text("created_at").notNull()
}, t => [index("comments_page_idx").on(t.page, t.status, t.createdAt), index("comments_queue_idx").on(t.status, t.createdAt), index("comments_network_idx").on(t.network, t.createdAt)]).enableRLS();
/** ▲▼ on comments: one per device, +1 or -1. */
export const commentVotes = catalogSchema.table("comment_votes", {
 commentId: text("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }), voter: text("voter").notNull(), value: integer("value").notNull(), updatedAt: text("updated_at").notNull()
}, t => [uniqueIndex("comment_votes_unique").on(t.commentId, t.voter), check("comment_vote_value", sql`${t.value} in (-1, 1)`)]).enableRLS();
/** Owner fixes to "How does it play?" (drizzle/0027, admin Traits tab): per racket and group, review counts that replace the
 *  prefill file's (null = use the file) and a freeze that stops new votes. trait "_all" freezes the whole racket. */
export const traitOverrides = catalogSchema.table("trait_overrides", {
 racketId: text("racket_id").notNull().references(() => rackets.id, { onDelete: "cascade" }), trait: text("trait").notNull(),
 reviewCounts: jsonb("review_counts").$type<Record<string, number>>(), frozen: boolean("frozen").notNull().default(false), updatedAt: text("updated_at").notNull()
}, t => [primaryKey({ name: "trait_overrides_pk", columns: [t.racketId, t.trait] }), check("trait_override_trait", sql`${t.trait} ~ '^[a-z_]{2,20}$'`)]).enableRLS();
/** Every Traits-tab change: what was done, to which racket and group, and what it removed or replaced (detail). Kept when a
 *  racket is removed, so the record stays. */
export const traitAdminLog = catalogSchema.table("trait_admin_log", {
 id: text("id").primaryKey(), racketId: text("racket_id").notNull(), trait: text("trait"), action: text("action").notNull(), detail: jsonb("detail").$type<Record<string, unknown>>(), createdAt: text("created_at").notNull()
}, t => [index("trait_admin_log_racket_idx").on(t.racketId, t.createdAt), check("trait_admin_log_action", sql`${t.action} ~ '^[a-z_]{2,30}$'`)]).enableRLS();
// Optional player accounts (drizzle/0028, PadelRecs Thread): a Supabase Auth user (email magic link) who reserved a name.
// The email stays in Supabase Auth; only the name, level and side live here. name_key (lib/thread/account-name.ts) makes
// "Padel Pete" and "padelpete" the same name. Blocked accounts keep their name reserved but can't post.
export const accounts = catalogSchema.table("accounts", {
 id: text("id").primaryKey(), name: text("name").notNull(), nameKey: text("name_key").notNull(), level: text("level"), side: text("side"),
 status: text("status", { enum: ["active", "blocked"] }).notNull().default("active"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull()
}, t => [uniqueIndex("accounts_name_key_unique").on(t.nameKey), check("account_status", sql`${t.status} in ('active','blocked')`)]).enableRLS();
/** Member stories (drizzle/0031, PadelRecs Thread pilot, owner 2026-11-20): short posts by signed-in members ("10 things I
 *  learned in my first year"), with optional racket tags. They go through the review queue like comments; the owner's own
 *  go live at once. Comments under a story use the comments table with page "story:<slug>". */
export const stories = catalogSchema.table("stories", {
 id: text("id").primaryKey(), slug: text("slug").notNull(), accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
 title: text("title").notNull(), body: text("body").notNull(), rackets: jsonb("rackets").$type<string[]>().notNull().default([]),
 status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"), spamScore: integer("spam_score").notNull().default(0),
 network: text("network").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
 /** A member's edit to a live story, waiting for the owner (drizzle/0032); the live text stays until it is approved. */
 pendingEdit: jsonb("pending_edit").$type<{ title: string; body: string; rackets: string[]; at: string } | null>(),
 /** When the live text last changed after it was first published ("edited <date>"). */ editedAt: text("edited_at")
}, t => [uniqueIndex("stories_slug_unique").on(t.slug), index("stories_list_idx").on(t.status, t.createdAt), index("stories_account_idx").on(t.accountId),
 check("story_status", sql`${t.status} in ('pending','approved','rejected')`)]).enableRLS();
/** Which reviews and comments belong to an account (their small "member" mark). Not a column on reviews/comments, so the
 *  other sites' tables stay as they are. */
export const accountPosts = catalogSchema.table("account_posts", {
 kind: text("kind", { enum: ["review", "comment"] }).notNull(), postId: text("post_id").notNull(), accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }), createdAt: text("created_at").notNull()
}, t => [primaryKey({ name: "account_posts_pk", columns: [t.kind, t.postId] }), index("account_posts_account_idx").on(t.accountId)]).enableRLS();
/** Devices (the "rv" cookie's keyed hash) an account signed in on, so their earlier guest posts are linked once. */
export const accountDevices = catalogSchema.table("account_devices", {
 accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }), voter: text("voter").notNull(), linkedAt: text("linked_at").notNull()
}, t => [primaryKey({ name: "account_devices_pk", columns: [t.accountId, t.voter] })]).enableRLS();
/** The device a guest review came from (comments already keep theirs), so a later sign-in on that device can claim it. */
export const reviewDevices = catalogSchema.table("review_devices", {
 reviewId: text("review_id").primaryKey().references(() => reviews.id, { onDelete: "cascade" }), voter: text("voter").notNull()
}, t => [index("review_devices_voter_idx").on(t.voter)]).enableRLS();
