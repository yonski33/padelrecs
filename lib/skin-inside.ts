// SkinRecs v11c product page (owner 2026-11-18): "What's inside, and what it means for you" and "Where it goes". Pure.
// The cards come from the catalog's key ingredients (the "core" column, read on the maker's page) and a short glossary of
// what each ingredient does for the person using it. Per-product cards from the Grok data job (db/skin-inside.json, keyed by
// slug) win over the glossary once imported. The routine step follows the product type (owner's feedback #7: cleanser = step 1,
// serum/treatment = step 2, moisturizer = step 3, SPF = last in the morning).
// Copy rules: expert voice, no em dashes, no counts, never claim testing, each line ≤ 90 characters.
import INSIDE from "../db/skin-inside.json";

export type InsideIcon = "barrier" | "water" | "calm" | "active" | "sun" | "seal" | "nofrag" | "oil";
export type InsideCard = { name: string; line: string; icon: InsideIcon };

/** [match, the name a shopper knows, the line, the icon]. First match wins, so the specific ones come first. */
const GLOSSARY: [RegExp, string, string, InsideIcon][] = [
  [/\bceramide/i, "Ceramides", "Refill the gaps in your skin barrier, so tight, flaky skin settles.", "barrier"],
  [/\bniacinamide\b/i, "Niacinamide", "Calms redness and evens tone slowly, over weeks rather than days.", "calm"],
  [/polyglutamic/i, "Polyglutamic acid", "Holds water on the skin's surface for a plump, light feel.", "water"],
  [/hyaluron/i, "Hyaluronic acid", "Holds water in the top layer of skin, so it looks plumper and feels less tight.", "water"],
  [/\bglycerin\b/i, "Glycerin", "Pulls water into the top layer of skin, so it stays comfortable for hours.", "water"],
  [/\bsqualane\b/i, "Squalane", "A light oil that softens dry patches without a greasy film.", "oil"],
  [/panthenol|vitamin b5/i, "Panthenol", "Soothes and softens, and helps a stressed barrier recover.", "calm"],
  [/salicylic|\bbha\b/i, "Salicylic acid", "Clears out pores from the inside, so blackheads and breakouts ease over weeks.", "active"],
  [/benzoyl peroxide/i, "Benzoyl peroxide", "Kills acne bacteria to clear spots; it can dry skin and bleach fabric.", "active"],
  [/\bglycolic\b/i, "Glycolic acid", "Loosens dull surface cells for smoother, brighter skin; it can sting at first.", "active"],
  [/\blactic\b/i, "Lactic acid", "A milder acid that smooths and brightens while keeping moisture in.", "active"],
  [/\bmandelic\b/i, "Mandelic acid", "A slow acid that smooths texture with less sting than glycolic.", "active"],
  [/\bpha\b|gluconolactone|lactobionic/i, "PHA", "The gentlest acid: smooths texture with little sting.", "active"],
  [/\bazelaic\b/i, "Azelaic acid", "Calms redness and bumps and fades marks; a tingle at first is common.", "active"],
  [/retin(ol|al|oid|oate)|retinyl/i, "Retinoid", "Speeds up skin renewal for smoother texture and fewer clogs; start slowly, at night.", "active"],
  [/\bbakuchiol\b/i, "Bakuchiol", "A plant alternative to retinol: smoother skin over time, with less irritation.", "active"],
  [/tranexamic/i, "Tranexamic acid", "Fades dark marks and patches over weeks; gentle on most skin.", "active"],
  [/arbutin/i, "Alpha arbutin", "Fades dark spots slowly and gently.", "active"],
  [/vitamin c|ascorb/i, "Vitamin C", "Brightens and fades dark marks over time, and backs up your sunscreen.", "active"],
  [/\bpeptide/i, "Peptides", "Support firmness over time; gentle, but results are slow and subtle.", "active"],
  [/centella|\bcica\b|madecassoside|asiaticoside/i, "Centella", "Soothes redness and irritation and helps skin recover.", "calm"],
  [/heartleaf|houttuynia/i, "Heartleaf", "A calming plant extract for red, irritated skin.", "calm"],
  [/\ballantoin\b/i, "Allantoin", "Soothes and softens rough, irritated skin.", "calm"],
  [/colloidal oat|\boat\b|oatmeal/i, "Oat", "Soothes itchy, irritated skin and supports the barrier.", "calm"],
  [/licorice|liquorice/i, "Licorice root", "Calms redness and helps even out dark marks.", "calm"],
  [/green tea/i, "Green tea", "An antioxidant that calms skin and helps shield it from daily stress.", "calm"],
  [/\baloe\b/i, "Aloe", "Cools and soothes, with light hydration.", "calm"],
  [/ferulic/i, "Ferulic acid", "Helps vitamins C and E keep working as antioxidants.", "calm"],
  [/vitamin e|tocopher/i, "Vitamin E", "An antioxidant that softens skin and helps protect its natural oils.", "oil"],
  [/caffeine/i, "Caffeine", "Can make puffiness look calmer for a while; the effect is short-lived.", "calm"],
  [/zinc oxide|mineral sunscreen/i, "Zinc oxide", "A mineral filter for UVA and UVB; gentle, but it can leave a white cast.", "sun"],
  [/titanium dioxide/i, "Titanium dioxide", "A mineral UV filter; gentle on skin, it can look chalky on deeper tones.", "sun"],
  [/tinosorb|uvinul|mexoryl|bemotrizinol|bisoctrizole/i, "Modern UV filters", "Newer filters with strong, stable UVA cover and a light feel.", "sun"],
  [/avobenzone/i, "Avobenzone", "A filter for UVA, the rays behind sun damage; no white cast.", "sun"],
  [/homosalate|octisalate|octocrylene|octinoxate/i, "Chemical filters", "Absorb UVB so skin doesn't burn; light, with no white cast.", "sun"],
  [/petrolatum|petroleum jelly/i, "Petrolatum", "Seals moisture in and protects cracked or raw skin; heavy, best at night.", "seal"],
  [/\bshea\b/i, "Shea butter", "A rich butter that softens and cushions very dry skin.", "oil"],
  [/\burea\b/i, "Urea", "Hydrates and softens rough skin.", "water"],
  [/cholesterol|fatty acid/i, "Barrier lipids", "Work with ceramides to rebuild a dry, damaged barrier.", "barrier"],
  [/snail/i, "Snail mucin", "Hydrates and soothes with a light, bouncy feel.", "water"],
  [/\bkaolin\b|\bclay\b|bentonite/i, "Clay", "Soaks up oil and leaves skin matte; it can dry out drier skin.", "oil"],
  [/hydrocolloid/i, "Hydrocolloid", "Seals a spot, soaks up fluid and stops picking while it heals.", "seal"],
  [/\bsulfur\b|\bsulphur\b/i, "Sulfur", "Dries out spots and soaks up oil; it has a noticeable smell.", "active"],
  [/collagen/i, "Collagen", "Holds water on the surface for softer skin; it doesn't rebuild your own collagen.", "water"],
  [/\brice\b/i, "Rice extract", "Softens skin and adds a little glow; a gentle brightener.", "calm"],
];
const FRAGRANCE_FREE: InsideCard = { name: "Fragrance-free", line: "No added scent, so reactive skin has less to flare at.", icon: "nofrag" };

type Override = { cards?: { name: string; line: string; icon?: InsideIcon }[]; step?: string; when?: string };
const OVERRIDES = (INSIDE as { items?: Record<string, Override> }).items ?? {};

/** Up to 4 cards: the product's own (Grok data) or its key ingredients matched to the glossary, in the maker's order, each once;
 *  "Fragrance-free" fills a free slot when the maker says so. Under 2 cards: none (one card says too little). */
export function insideOf(slug: string, core: string | null, fragranceFree: boolean): InsideCard[] {
  const own = OVERRIDES[slug]?.cards;
  if (own?.length) return own.slice(0, 4).map(c => ({ name: c.name, line: c.line, icon: c.icon ?? iconOf(c.name) }));
  const out: InsideCard[] = [], seen = new Set<string>();
  for (const part of (core ?? "").split(/,|;|\s\+\s|\band\b/)) {
    const hit = GLOSSARY.find(([re]) => re.test(part));
    if (!hit || seen.has(hit[1])) continue;
    seen.add(hit[1]);
    // The strength when the maker states it ("2% salicylic acid" → "Salicylic acid 2%"); never on a group card.
    const pct = /(\d+(?:\.\d+)?)\s?%/.exec(part)?.[1];
    out.push({ name: pct && !/filters|lipids/i.test(hit[1]) ? `${hit[1]} ${pct}%` : hit[1], line: hit[2], icon: hit[3] });
    if (out.length === 4) break;
  }
  if (fragranceFree && out.length < 4) out.push(FRAGRANCE_FREE);
  return out.length >= 2 ? out : [];
}
const iconOf = (name: string): InsideIcon => /fragrance/i.test(name) ? "nofrag" : GLOSSARY.find(([re]) => re.test(name))?.[3] ?? "calm";

/** "Where it goes": the routine's steps with this product's step marked, and a note on when to use it. A type outside the
 *  four main steps (toner, eye cream, mask…) is shown in its place between them. */
export type RoutineStep = { label: string; me: boolean };
const BASE = ["cleanse", "serum or treatment", "moisturize", "SPF, morning only"];
/** Where each type sits: the base step it is (or the one it comes after, with its own label), and what to know. */
const TYPE: Record<string, { at: number; own?: string; note: string }> = {
  Cleanser: { at: 0, note: "AM and PM, on damp skin. Rinse well before the next step." },
  Toner: { at: 0.5, own: "this toner", note: "After cleansing, before serum. Pat it in with your hands or a pad." },
  Exfoliant: { at: 0.5, own: "this exfoliant", note: "After cleansing, a few times a week to start. Wear sunscreen the next morning." },
  Mask: { at: 0.5, own: "this mask, 1 to 3 times a week", note: "After cleansing, then carry on with your usual steps." },
  Serum: { at: 1, note: "Let it absorb for a minute before moisturizer." },
  Treatment: { at: 1, note: "Let it absorb for a minute before moisturizer. Start a few nights a week if it's strong." },
  "Eye cream": { at: 1.5, own: "this eye cream", note: "Pat a little around the eyes before moisturizer." },
  Moisturizer: { at: 2, note: "AM and PM. Give it a minute before sunscreen." },
  "Balm & ointment": { at: 2.5, own: "this balm, last at night", note: "Last at night, or on dry patches any time of day." },
  Sunscreen: { at: 3, note: "Last step every morning. Reapply if you're outside." },
};
const THIS: Record<string, string> = { Cleanser: "this cleanser", Serum: "this serum", Treatment: "this treatment", Moisturizer: "this moisturizer", Sunscreen: "this SPF" };

export function routineOf(slug: string, shape: string | null): { steps: RoutineStep[]; note: string } | null {
  const t = shape ? TYPE[shape] : undefined;
  if (!t) return null;
  const steps: RoutineStep[] = BASE.map((label, i) => { const me = !t.own && i === t.at; return { label: me ? THIS[shape!] ?? `this ${shape!.toLowerCase()}` : label, me }; });
  if (t.own) steps.splice(Math.ceil(t.at), 0, { label: t.own, me: true });
  // Numbered in order; SPF is "last".
  const numbered = steps.map((s, i) => ({ ...s, label: i === steps.length - 1 && /SPF/i.test(s.label) ? `last · ${s.label}` : `${i + 1} ${s.label}` }));
  const o = OVERRIDES[slug];
  return { steps: numbered, note: o?.when ?? t.note };
}
