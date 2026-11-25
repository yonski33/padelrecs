// The niche words for the Batch API writers (scripts/batch-write.ts cards, scripts/batch-pages.ts page text). PickleballRecs is
// the default and keeps the exact wording the paddle runs used; SkinRecs (2026-11-26) gets its own attribute names (the creator
// page's SKIN_ATTRS, lib/thread/creators.ts), "people" for Reddit and forum posters, and the formula / SPF / size rules from
// the skin source packs (SKIN1004 and Supergoop are known traps).
import { niche } from "../lib/niche";

export type BatchNiche = {
  /** Reddit and forum people: "players" on the sports sites, "people" on SkinRecs. */ people: string; person: string;
  attrs: readonly string[]; attrHelp: string;
  /** The writer's "not the exact product" bullet. */ exactRule: string;
  /** The shorthand and spelling copy rules. */ shorthand: string; spelling: string;
  version: string; measured: string; summary: string; summaryMore: string; keyPointExample: string;
  /** What the Reddit box's second paragraph covers. */ redditSecond: string;
  /** Extra card field: the reviewer's own skin type, when they state it. */ skinType: boolean;
  /** Words that never count as a creator's name in the code check. */ nameStop: RegExp;
};

const PICKLEBALL: BatchNiche = {
  people: "players", person: "player",
  attrs: ["power", "control", "spin", "pop", "forgiveness", "comfort", "durability", "value"],
  attrHelp: "Names: power, control, spin, pop, forgiveness (sweet spot), comfort (feel, vibration, arm), durability, value.",
  exactRule: "Shape (elongated, hybrid, widebody, standard), thickness (14mm, 16mm), face, edition and generation all matter; a sibling shape, thickness or generation is a different paddle. Keep it only if the source itself names or clearly shows this exact model; never infer the shape or thickness.",
  shorthand: `Name another product only by its exact model and edition, so readers (and the site's product links) know which one. Reviewers often use shorthand ("the Hard", "the Control", "the Vertex", "the Viper", "the Pro", "the 16mm"): resolve it to the exact model from context. Same family first (in a Metalbone 3.5 2026 review, "the Hard" is the Adidas Metalbone HRD+ 3.5 2026); otherwise the model current at the source's date ("the Vertex" in a late-2025 video is the Bullpadel Vertex 05 2026); use any extra hint in the source (edition, colour, player). Write the full name ("Babolat Technical Viper 2026"), never the line or brand alone. Only when it stays ambiguous, leave the comparison unnamed or describe the feel instead ("sits between soft and firm"). (Owner 2026-11-24.)`,
  spelling: `Spell every product name exactly as the site catalog does. Transcripts often mishear names (Fenix as "Phoenix", AT10 as "AT", Xplo as "Explo", Vertex as "Vortex"); correct them to the catalog spelling, and if a name cannot be pinned down, write "another paddle". (Owner 2026-11-24.)`,
  version: `the shape/thickness/edition the source covers, as stated (e.g. "Widebody, 16mm"), or null.`,
  measured: "only numbers the source states for this paddle (swing weight, twist weight, static weight, RPM, mph, balance point; never a price), as {name, value} with the unit in value.",
  summary: "what they tested and how (drills, matches, hours, weeks, comparisons, pre-production unit), concrete findings (power, control, spin, pop, sweet spot, feel, weight, durability or grit wear) with the source's own numbers, and who they say it suits and who it doesn't.",
  summaryMore: "comparisons, long-term notes, setup tips like lead tape or grip",
  keyPointExample: "Best defensive paddle in the line this year.",
  redditSecond: "durability, weight, comparisons and complaints",
  skinType: false,
  nameStop: /^(pickleball|pickle|paddle|paddles|padel|racket|rackets|review|reviews)$/i,
};

const SKIN: BatchNiche = {
  people: "people", person: "person",
  attrs: ["hydration", "texture", "finish", "absorption", "irritation", "results", "scent", "white_cast", "sun_protection", "adhesion", "packaging", "value"],
  attrHelp: "Names: hydration, texture (how it feels to apply), finish (dewy, matte, natural; rate how well it suits the reviewer), absorption (how fast it sinks in), irritation (Excellent = no stinging, burning or breakouts at all; Weak = it irritated or broke them out), results (visible change over the time they used it), scent (Excellent = pleasant or none), white_cast (sunscreens only; Excellent = no cast), sun_protection (sunscreens only, only when they discuss it: burns, SPF claims, reapplying), adhesion (stays on through sweat, water or the day), packaging, value.",
  exactRule: "Formula, strength, SPF, tint, variant, size line and region all matter: SPF 30 is not SPF 50, 2% is not 7%, tinted is not untinted, Mineral is not chemical, Lotion is not Cream, the AM lotion is not the PM lotion, an eye cream is not the face cream of the same line, COSRX Snail 96 Essence is not Snail 92 Cream, SKIN1004 Hyalu-Cica Water-Fit is not Air-Fit, Supergoop Unseen SPF 50 is not the older Unseen SPF 40 or Glowscreen. A reformulated product is a different product: when the link finder notes or the source say the formula changed, keep only sources about the current formula (the notes give the cut-off). Keep a source only if it names or clearly shows this exact product; never infer the variant from the brand line alone.",
  shorthand: `Name another product only by its exact name and variant, so readers (and the site's product links) know which one. Reviewers often use shorthand ("the snail essence", "the CeraVe cream", "the Water Cream", "the Relief Sun", "the 2% BHA"): resolve it to the exact product from context (brand, texture, SPF, strength), and write the full name ("COSRX Advanced Snail 96 Mucin Power Essence", "Paula's Choice SKIN PERFECTING 2% BHA Liquid Exfoliant"), never the line or brand alone. Only when it stays ambiguous, leave the comparison unnamed or describe it instead ("a richer ceramide cream"). (Owner 2026-11-24.)`,
  spelling: `Spell every product and ingredient name exactly as the site catalog and the label do. Transcripts often mishear names (Cicaplast as "Sicaplast", SKIN1004 as "Skin 1004" or "Skin Ten Oh Four", Anthelios as "Antelios", niacinamide as "niacin amide", Tribioma as "Triobioma"); correct them, and if a name cannot be pinned down, write "another product". (Owner 2026-11-24.)`,
  version: `the formula, SPF, strength, tint or size the source covers, as stated (e.g. "SPF 50+ PA++++, Korean version", "untinted", "2%"), or null.`,
  measured: "only numbers the source states for this product (weeks or months of use, pH, SPF measured or claimed, percentage of an active, how much they apply; never a price), as {name, value} with the unit in value.",
  summary: "how they used it (how long, morning or night, which step of the routine, with what actives, their skin type and concerns), concrete findings (texture, hydration, finish, how it sits under makeup or sunscreen, stinging, breakouts, white cast, visible results) with the source's own numbers, and who they say it suits and who it doesn't.",
  summaryMore: "comparisons, long-term notes, layering and routine tips",
  keyPointExample: "Light gel hydration that sits well under sunscreen.",
  redditSecond: "irritation or breakouts, texture and finish, comparisons and complaints",
  skinType: true,
  nameStop: /^(skin|skincare|beauty|review|reviews|derm|dermatologist|official|channel)$/i,
};

const BY_NICHE: Record<string, BatchNiche> = { pickleball: PICKLEBALL, skin: SKIN };
if (!BY_NICHE[niche.id]) throw new Error(`No batch profile for NICHE=${niche.id}: add one to scripts/batch-niche.ts (attribute names, exact-model rule, words) before a paid run.`);
export const B: BatchNiche = BY_NICHE[niche.id]!;
