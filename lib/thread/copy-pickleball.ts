/*
 * PickleballRecs' Thread copy (plans/PICKLEBALL-THREAD-PLAN.md), the same shape as lib/thread/copy.ts (padel), which picks
 * this file on NICHE=pickleball.
 *
 * Guides: from the owner's pickleball mocks (design_handoff_pickleballrecs: Paddle, Beginner, Shape, Format and Elbow Guide).
 * Lines the mocks kept from padel are rewritten for pickleball:
 * - Paddle guide TL;DR "round shape" became "standard shape"; step 5 "round, soft paddle ... Diamonds" became standard and
 *   elongated; step 6 "Your side of the court" (right and left side) became doubles or singles.
 * - Elbow guide step 1 "Soft EVA or foam cores" (padel cores) became thicker polymer cores.
 * - Format guide "6 ways to pick your side" and "Which side do you play, and why?" now say game, not side.
 * Info pages (About, Score, Affiliate, Contact): padel's live text (with the owner's fixes, such as the real score rule and
 * the {contactLink} token) with the site's words swapped in. It matches the pickleball mocks, apart from the mock's older
 * score rule, which the live text replaced on padel too.
 */
import type { GuideCopy, GuideStep, InfoCopy } from "./copy";

const steps = (list: [string, string][]): GuideStep[] => list.map(([title, body]) => ({ title, body }));
const COMPOSER_PLACEHOLDER = "Share a tip or ask a question";

export const PB_GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = {
  racket: "How to choose a pickleball paddle",
  beginner: "Beginner pickleball tips",
  shape: "Standard vs hybrid vs elongated",
  side: "Doubles or singles?",
  elbow: "Paddles for tennis elbow",
};

const PADDLE_STEPS = steps([
  ["Shape: standard, hybrid or elongated",
    "Standard paddles have the sweet spot low and central, so they forgive mishits. Hybrid is the all-rounder. Elongated adds reach and drive power, but has a smaller sweet spot."],
  ["Feel: soft, medium or hard",
    "A soft feel, usually from a thicker 16 mm core, gives more touch and control at the kitchen and is easier on the arm. A hard feel, often from a thinner core, gives more pop and power, but is less forgiving."],
  ["Weight: the middle suits most players",
    "Most paddles weigh 7.6 to 8.4 oz. Lighter paddles are quicker at the kitchen, but very light ones pass more shock to the arm. Heavier ones add power and stability but tire you faster."],
  ["Balance: where the weight sits",
    "Low balance feels quick and easy to control. High balance adds power to drives but feels slower in fast exchanges. Shape usually sets the balance for you."],
  ["Your level, honestly",
    "Beginners do best with a standard, soft paddle. Intermediate players can try a hybrid. Elongated paddles suit advanced players with clean technique who drive a lot."],
  ["Doubles or singles",
    "Doubles is won at the kitchen, so quick, controlled paddles fit well. Singles rewards reach and drives from the baseline, so elongated paddles make more sense."],
  ["Sore arm? Put comfort first",
    "If you have tennis elbow or a sore wrist, pick a soft core, low balance and a mid weight, not a very light paddle. Add an overgrip and hold the paddle loosely."],
]);
const BEGINNER_STEPS = steps([
  ["Remember the two-bounce rule",
    "The serve must bounce, and so must the return. Stay back after you serve, and only move up once the ball has bounced on both sides."],
  ["Hold the paddle loosely",
    "A tight grip sends resets and dinks flying. Grip around 4 out of 10, squeeze a little at contact, then relax again."],
  ["Learn the dink",
    "A soft shot that lands in the kitchen is the most useful shot in the game. It keeps the ball low and forces a mistake."],
  ["Get to the kitchen line together",
    "Most points are won at the non-volley line. Move up side by side with your partner, and stop just behind the line."],
  ["Stay out of the kitchen on volleys",
    "You cannot volley with a foot in the kitchen, or step in after. Let the ball bounce if it lands short in the kitchen."],
  ["Serve deep, not hard",
    "The underhand serve starts the point. Aim deep towards the baseline and get it in every time."],
  ["Hit the third shot drop",
    "After the return, a soft drop into the kitchen lets your team move up. Driving it every time keeps you stuck at the baseline."],
  ["Start with a forgiving paddle",
    "A 16 mm polymer core with a standard shape hides mishits while you learn. Save thin, stiff power paddles for later."],
]);
const SHAPE_STEPS = steps([
  ["Where the sweet spot sits",
    "Standard paddles have a wide face and a big sweet spot near the middle. Elongated paddles are narrower, so the sweet spot is smaller and higher up."],
  ["Reach",
    "Elongated paddles add about an inch of length. That helps in singles and on wide balls, but it moves the weight away from your hand."],
  ["Hand speed at the kitchen",
    "Standard and hybrid paddles feel quicker in fast hand battles. Elongated paddles can feel slow when the ball comes back at you."],
  ["Power on drives",
    "Elongated wins here. The longer lever turns a good swing into a faster drive. Hybrids give some of that with less risk."],
  ["Two-handed backhands",
    "Longer handles fit two hands. Elongated paddles usually have the longest handles, standard the shortest."],
  ["Which one to buy",
    "Learning or playing doubles at the kitchen: standard. Playing a bit of everything: hybrid. Singles or big drives: elongated."],
]);
const FORMAT_STEPS = steps([
  ["What doubles asks for",
    "Most doubles points are dinks, resets and fast hand battles at the kitchen. Control and a forgiving face matter more than power."],
  ["What singles asks for",
    "Singles covers the whole court alone. Deep drives, passing shots and reach decide most points."],
  ["Shape for each",
    "Standard and hybrid shapes suit doubles. Elongated paddles help in singles, where extra reach wins points."],
  ["Core thickness",
    "A 16 mm core is softer and steadier for doubles at the kitchen. A 14 mm core gives more pop for singles drives."],
  ["Weight",
    "Lighter paddles are quicker in doubles hand battles. Slightly heavier paddles drive harder and feel steadier in singles."],
  ["If you play both",
    "A hybrid shape with a 16 mm core covers most of both games. Many players keep one paddle and adjust their game instead."],
]);
const ELBOW_STEPS = steps([
  ["Go for a soft core",
    "Thicker 16 mm polymer cores take in more of the shock at contact. Thin, stiff paddles send more vibration into your elbow on every hit."],
  ["Pick a mid weight, not a very light one",
    "A very light paddle has little mass to take in the shock and makes you swing harder. A heavy one tires the arm late in a match. Look at about 7.8 to 8.4 oz."],
  ["Choose low balance",
    "Weight near the handle means less leverage on your forearm. Standard paddles usually have the lowest swing weight."],
  ["Hold it loosely",
    "Gripping hard is one of the main causes of elbow pain. Squeeze only at contact and relax between shots."],
  ["Add an overgrip",
    "A thicker, softer grip means you do not have to squeeze as hard. One or two overgrips is enough for most hands."],
  ["Rest and see a physio",
    "If the pain lasts more than a few weeks, take a break and get it checked. A paddle helps, but it does not replace treatment."],
]);

export const PB_GUIDES: GuideCopy[] = [
  {
    key: "racket", crumb: "Paddles", title: "How to choose a pickleball paddle", seoTitle: "How to choose a pickleball paddle",
    description: "Pick the pickleball paddle shape first, then the feel. Beginners: standard, soft and light. Intermediate: try a hybrid. Sore arm: comfort first.",
    tldrLead: "Pick the shape first, then the feel. Most players are happier with a paddle that is easier than they think they need.",
    tldr: ["Beginners: standard shape, soft core, lighter weight.", "Intermediate: try a hybrid for more all-round play.", "Sore arm: comfort first, power can come later."],
    stepsTitle: "7 things to check, in order", steps: PADDLE_STEPS, picksTitle: "Players' favorite in each shape",
    commentsTitle: "Ask or share", composerPrompt: "What made you pick your paddle? Or ask for advice", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: PADDLE_STEPS.map(s => s.title),
  },
  {
    key: "beginner", crumb: "Beginners", title: "Beginner pickleball tips that actually help", seoTitle: "Beginner pickleball tips that actually help",
    description: "Beginner pickleball tips that help: let the serve and return bounce, grip loosely, dink into the kitchen and move up to the line together.",
    tldrLead: "Most new players lose points by hitting too hard and rushing the kitchen. Slow down, keep the ball low and get to the line together.",
    tldr: ["Let the serve and return bounce. It is the rule.", "Dink soft into the kitchen instead of driving everything.", "Move up to the kitchen line with your partner."],
    stepsTitle: "8 tips, most useful first", steps: BEGINNER_STEPS, picksTitle: "Paddles beginners vote for",
    commentsTitle: "Add your tip", composerPrompt: "What helped you most as a beginner?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: BEGINNER_STEPS.map(s => s.title), extra: { highlightFirstSteps: 3 },
  },
  {
    key: "shape", crumb: "Paddles", title: "Standard vs hybrid vs elongated", seoTitle: "Standard vs hybrid vs elongated pickleball paddles",
    description: "Standard vs hybrid vs elongated pickleball paddles: standard forgives, elongated reaches furthest and drives hardest, hybrid sits in between.",
    tldrLead: "Shape changes reach, sweet spot and how fast the paddle swings. Standard forgives, elongated reaches furthest, hybrid sits in between.",
    tldr: ["Standard: widest face, biggest sweet spot, best to learn with.", "Hybrid: a little extra reach, a good second paddle.", "Elongated: most reach and drive power, smallest sweet spot."],
    stepsTitle: "6 things that change with shape", steps: SHAPE_STEPS, picksTitle: "Players' favorite in each shape",
    commentsTitle: "Ask or share", composerPrompt: "Which shape do you play, and would you switch?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: SHAPE_STEPS.map(s => s.title),
  },
  {
    key: "side", crumb: "Playing", title: "Doubles or singles: which paddle?", seoTitle: "Doubles or singles: which pickleball paddle?",
    description: "Doubles or singles? Doubles is won at the kitchen with control and quick hands, singles from the baseline with reach and drives.",
    tldrLead: "Doubles is won at the kitchen with soft hands. Singles is won from the baseline with reach and drives. Pick the paddle for the game you play most.",
    tldr: ["Doubles: control, quick hands and a big sweet spot.", "Singles: reach, drive power and a longer handle.", "Play both? A hybrid shape covers most of it."],
    stepsTitle: "6 ways to pick for your game", steps: FORMAT_STEPS, picksTitle: "Players' top-rated paddles",
    commentsTitle: "Ask or share", composerPrompt: "Doubles or singles? Share what you play with, or ask", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: FORMAT_STEPS.map(s => s.title),
  },
  {
    key: "elbow", crumb: "Paddles", title: "Paddles for tennis elbow", seoTitle: "Pickleball paddles for tennis elbow",
    description: "Pickleball paddles for tennis elbow: a soft core, low balance and a mid weight. Hold it loosely, add an overgrip and see a physio if pain lasts.",
    tldrLead: "A soft, mid-weight paddle with low balance takes most of the shock away from your arm. How you hold it matters just as much.",
    tldr: ["Pick a soft core, low balance and a mid weight.", "Hold the paddle loosely and use an overgrip.", "See a physio if the pain lasts more than a few weeks."],
    stepsTitle: "6 things that help a sore arm", steps: ELBOW_STEPS, picksTitle: "Paddles players with sore arms vote for",
    commentsTitle: "Ask or share", composerPrompt: "Got elbow pain? Share what helped, or ask", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: ELBOW_STEPS.map(s => s.title),
  },
];

/** Padel's live words → pickleball's, for the info pages. Order matters (the site name first). */
const SWAPS: [RegExp, string][] = [[/PadelRecs/g, "PickleballRecs"], [/\bpadel\b/g, "pickleball"], [/\bPadel\b/g, "Pickleball"],
  [/\brackets\b/g, "paddles"], [/\bracket\b/g, "paddle"], [/\bRackets\b/g, "Paddles"], [/\bRacket\b/g, "Paddle"]];
export const toPickleball = (t: string) => SWAPS.reduce((s, [re, to]) => s.replace(re, to), t);
const swapDeep = <T,>(v: T): T => (typeof v === "string" ? toPickleball(v) : Array.isArray(v) ? v.map(swapDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [toPickleball(k), swapDeep(x)])) : v) as T;
export const pickleballInfo = (padel: InfoCopy[]): InfoCopy[] => swapDeep(padel);
