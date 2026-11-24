/*
 * SkinRecs' Thread copy (owner 2026-11-20), the same shape as lib/thread/copy.ts (padel), which picks this file on NICHE=skin.
 *
 * Guides: from the owner's skin mocks (design_handoff_skinrecs: Choose, Beginner, Texture, Routine and Sensitive Guide),
 * word for word apart from these:
 * - Score page "Person reviews count the most" (a mock slip) is not used: the info pages come from padel's live text.
 * - The mock's "Kept by [your names]" footer and "How we score" link are not used (no "we"; padel's footer pattern).
 * - The mock spells British ("moisturiser"); the live site's type pages spell US ("Moisturizers"). Kept as the mock has it.
 * Info pages (About, Score, Affiliate, Contact): padel's live text (with the owner's fixes: the real score rule, the
 * {contactLink} token) with skin's words swapped in. It matches the skin mocks apart from the mock's older score rule.
 */
import type { GuideCopy, GuideStep, InfoCopy } from "./copy";

const steps = (list: [string, string][]): GuideStep[] => list.map(([title, body]) => ({ title, body }));
const COMPOSER_PLACEHOLDER = "Share a tip or ask a question";

export const SKIN_GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = {
  racket: "How to choose a moisturiser",
  beginner: "Skincare basics for beginners",
  shape: "Cream vs lotion vs gel",
  side: "Morning or night routine?",
  elbow: "Skincare for sensitive skin",
};

const CHOOSE_STEPS = steps([
  ["Your skin type", "Dry skin needs richer creams. Oily skin does better with light gels. Combination skin often likes a lotion."],
  ["Texture", "Creams are thickest, lotions sit in the middle, gels are lightest. Texture matters more than brand."],
  ["Key ingredients", "Ceramides repair the barrier, hyaluronic acid draws in water, and niacinamide calms oil and redness."],
  ["Fragrance", "Fragrance is one of the most common causes of irritation. Fragrance free is safest for sensitive skin."],
  ["Under makeup", "If you wear makeup, pick something that sinks in fast and does not pill."],
  ["Your climate", "Many people use a richer cream in winter and a lighter one in summer."],
  ["Price", "Some of the best rated moisturisers are pharmacy brands. Expensive does not mean better."],
]);
const BEGINNER_STEPS = steps([
  ["Start with three steps", "A gentle cleanser, a moisturiser and sunscreen cover most skin needs. Everything else is optional."],
  ["Wear sunscreen every day", "SPF 30 or higher, even when it is cloudy. It prevents more damage than any serum can fix."],
  ["Add one product at a time", "Wait about two weeks before adding the next one. If something breaks you out, you will know which it was."],
  ["Patch test first", "Try new products on a small spot on your jaw or arm for a few days before using them all over."],
  ["Do not over-exfoliate", "Acids and scrubs a few times a week are plenty. Tight, shiny or stinging skin means stop."],
  ["Moisturise on damp skin", "Applying moisturiser right after cleansing locks in more water and makes it spread easier."],
  ["Give it time", "Most products need four to eight weeks to show results. Retinoids can take longer."],
  ["Cheap can be great", "Many of the highest rated products here cost less than a takeaway. Price is not a guide to results."],
]);
const TEXTURE_STEPS = steps([
  ["How heavy it feels", "Creams leave a soft, rich layer. Gels absorb almost straight away. Lotions sit between the two."],
  ["Hydration", "Creams hold water in best. Gels add water but lose it faster on very dry skin."],
  ["Under makeup", "Gels and lotions sit better under makeup. Thick creams can pill or slide."],
  ["Breakouts", "Heavy creams can clog pores on oily skin. Gels are less likely to cause breakouts."],
  ["Season", "Many people switch texture with the weather: cream in winter, gel in summer."],
  ["Which one to buy", "Dry or sensitive: cream. Combination: lotion. Oily or acne-prone: gel."],
]);
const ROUTINE_STEPS = steps([
  ["What the morning does", "Protects your skin from sun and pollution. Keep it light so it sits well under makeup."],
  ["What the night does", "Repairs and treats while you sleep. This is where retinol, acids and rich creams belong."],
  ["Where actives go", "Retinol and exfoliating acids at night. Vitamin C works well in the morning under sunscreen."],
  ["Do not mix too much", "Retinol and strong acids on the same night can irritate. Alternate nights instead."],
  ["Moisturiser for each", "A lighter one in the morning, a richer one at night works for many people."],
  ["Keep it simple", "Three steps morning and night is enough for most skin. Add more only if you need it."],
]);
const SENSITIVE_STEPS = steps([
  ["Go fragrance free", "Fragrance and essential oils are among the most common triggers. Look for fragrance free, not unscented."],
  ["Keep the list short", "Fewer ingredients means fewer chances of a reaction. Simple formulas are easier to trust."],
  ["Repair the barrier", "Ceramides, glycerin and panthenol help calm and rebuild irritated skin."],
  ["Patch test", "Try new products on a small area for three to five days before using them on your face."],
  ["Go slow with actives", "Start retinol or acids once or twice a week, and stop if your skin stings or peels."],
  ["Get it checked", "If redness, burning or flaking lasts more than a few weeks, see a dermatologist."],
]);

export const SKIN_GUIDES: GuideCopy[] = [
  {
    key: "racket", crumb: "Products", title: "How to choose a moisturiser", seoTitle: "How to choose a moisturiser",
    description: "Pick the texture for your skin type first, then check the ingredients. Dry: rich creams. Oily: light gels. Sensitive: fragrance free.",
    tldrLead: "Pick the texture for your skin type first, then check the ingredients. Most people are happier with something simpler than they think.",
    tldr: ["Dry skin: rich creams with ceramides.", "Oily skin: light gels or lotions.", "Sensitive skin: fragrance free and short ingredient lists."],
    stepsTitle: "7 things to check, in order", steps: CHOOSE_STEPS, picksTitle: "People's favourite for each skin type", picksTitles: ["Dry skin", "Oily skin", "Combination skin"],
    commentsTitle: "Ask or share", composerPrompt: "What made you pick your moisturiser? Or ask for advice", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: CHOOSE_STEPS.map(s => s.title),
  },
  {
    key: "beginner", crumb: "Beginners", title: "Skincare basics that actually help", seoTitle: "Skincare basics that actually help",
    description: "Skincare basics for beginners: cleanse, moisturise and wear SPF every day, add one product at a time and patch test anything strong.",
    tldrLead: "Most new routines fail because they do too much at once. Start with three steps, add one product at a time, and wear sunscreen every day.",
    tldr: ["Cleanse, moisturise and use SPF every morning.", "Add one new product at a time, two weeks apart.", "Patch test anything strong before using it on your face."],
    stepsTitle: "8 tips, most useful first", steps: BEGINNER_STEPS, picksTitle: "Products beginners vote for",
    commentsTitle: "Add your tip", composerPrompt: "What helped you most when you started?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: BEGINNER_STEPS.map(s => s.title), extra: { highlightFirstSteps: 3 },
  },
  {
    key: "shape", crumb: "Products", title: "Cream vs lotion vs gel", seoTitle: "Cream vs lotion vs gel moisturisers",
    description: "Cream vs lotion vs gel: texture decides how heavy a product feels and how it suits your skin. Cream for dry, gel for oily, lotion between.",
    tldrLead: "Texture decides how heavy a product feels and how well it suits your skin type. Cream for dry, gel for oily, lotion in between.",
    tldr: ["Cream: richest, best for dry skin and winter.", "Lotion: balanced, suits most combination skin.", "Gel: lightest, best for oily skin and summer."],
    stepsTitle: "6 things that change with texture", steps: TEXTURE_STEPS, picksTitle: "People's favourite in each texture",
    commentsTitle: "Ask or share", composerPrompt: "Which texture do you use, and would you switch?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: TEXTURE_STEPS.map(s => s.title),
  },
  {
    key: "side", crumb: "Routines", title: "Morning or night routine?", seoTitle: "Morning or night skincare routine?",
    description: "Morning or night skincare? Mornings are for protection, nights are for repair. Keep the morning light and put actives at night.",
    tldrLead: "Mornings are for protection, nights are for repair. Keep the morning light and put your active ingredients at night.",
    tldr: ["Morning: cleanse, moisturise, sunscreen.", "Night: cleanse, treatment, moisturiser.", "Retinol and acids go at night, vitamin C in the morning."],
    stepsTitle: "6 ways to plan your routine", steps: ROUTINE_STEPS, picksTitle: "People's picks for each routine", picksTitles: ["Morning", "Night"],
    commentsTitle: "Ask or share", composerPrompt: "What does your routine look like?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: ROUTINE_STEPS.map(s => s.title),
  },
  {
    key: "elbow", crumb: "Products", title: "Skincare for sensitive skin", seoTitle: "Skincare for sensitive skin",
    description: "Skincare for sensitive skin: fragrance free, short ingredient lists and one change at a time. Patch test everything new.",
    tldrLead: "Short ingredient lists, no fragrance and one change at a time. Most reactions come from doing too much, not too little.",
    tldr: ["Pick fragrance-free, short ingredient lists.", "Patch test everything new for a few days.", "See a dermatologist if redness or burning lasts."],
    stepsTitle: "6 things that help sensitive skin", steps: SENSITIVE_STEPS, picksTitle: "Products people with sensitive skin vote for",
    commentsTitle: "Ask or share", composerPrompt: "Got sensitive skin? Share what helped, or ask", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: SENSITIVE_STEPS.map(s => s.title),
  },
];

/** Padel's live words → skin's, for the info pages. Order matters (the site name and "padel players" first). */
const SWAPS: [RegExp, string][] = [[/PadelRecs/g, "SkinRecs"], [/\bpadel players\b/g, "skincare fans"], [/\bpadel\b/g, "skincare"], [/\bPadel\b/g, "Skincare"],
  [/\brackets\b/g, "products"], [/\bracket\b/g, "product"], [/\bRackets\b/g, "Products"], [/\bRacket\b/g, "Product"],
  [/\bplayer score\b/g, "user score"], [/\bPlayer score\b/g, "User score"], [/\bplayers\b/g, "people"], [/\bPlayers\b/g, "People"], [/\bplayed\b/g, "tried"]];
export const toSkin = (t: string) => SWAPS.reduce((s, [re, to]) => s.replace(re, to), t);
const swapDeep = <T,>(v: T): T => (typeof v === "string" ? toSkin(v) : Array.isArray(v) ? v.map(swapDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [toSkin(k), swapDeep(x)])) : v) as T;
export const skinInfo = (padel: InfoCopy[]): InfoCopy[] => swapDeep(padel);
