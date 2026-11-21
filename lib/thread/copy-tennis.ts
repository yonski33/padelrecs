/*
 * TennisRecs' Thread copy (owner 2026-11-21, v3 wave 2), the same shape as lib/thread/copy.ts (padel), which picks this file on
 * NICHE=tennis. The five guide slots: choosing a racket, beginner tips, head size ("shape"), string pattern ("side") and tennis
 * elbow ("elbow"). Plain words, no prices, nothing claims testing.
 * Info pages (About, Score, Affiliate, Contact): padel's live text with tennis's words swapped in.
 */
import type { GuideCopy, GuideStep, InfoCopy } from "./copy";

const steps = (list: [string, string][]): GuideStep[] => list.map(([title, body]) => ({ title, body }));
const COMPOSER_PLACEHOLDER = "Share a tip or ask a question";

export const TN_GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = {
  racket: "How to choose a tennis racket",
  beginner: "Beginner tennis tips",
  shape: "Which head size?",
  side: "16x19 or 18x20?",
  elbow: "Rackets for tennis elbow",
};

const CHOOSE_STEPS = steps([
  ["Start with your level", "Newer players do best with a 100 to 105 sq in head and a light, easy frame. Advanced players often prefer a 97 or 98 for precision."],
  ["Pick a head size", "A bigger head gives a bigger sweet spot and easier depth. A smaller head gives more control on full swings but punishes mishits."],
  ["Mind the weight and balance", "Light frames swing fast but feel unstable against pace. Heavier frames feel solid and need a full, fast swing."],
  ["Check the string pattern", "An open 16x19 pattern gives easier spin and launch. A dense 18x20 gives a flatter, more controlled ball."],
  ["Think about your arm", "Stiff frames feel crisp and powerful but pass more shock. A flexible frame and softer strings are kinder to a sore elbow."],
  ["Demo before you buy", "The same specs can feel different in your hand. Hit a few rackets if you can, ideally with your usual strings."],
]);
const BEGINNER_STEPS = steps([
  ["Watch the ball onto the strings", "Most mishits come from looking up too early. Keep your head still until after contact."],
  ["Swing low to high", "A low to high swing adds topspin, which pulls the ball down into the court and gives you more margin."],
  ["Use your legs and turn", "Power comes from turning your shoulders and hips, not from your arm alone. That also saves your elbow."],
  ["Get ready early", "Split step as your opponent hits, then turn sideways. Being early matters more than swinging hard."],
  ["Aim for the middle of the court", "Hitting deep through the middle wins more points at club level than chasing the lines."],
  ["Serve with a relaxed arm", "A loose arm and a full motion give more pace than muscling the ball. Practise the toss on its own."],
  ["Play with a forgiving racket", "A 100 to 105 sq in head and a light frame make learning easier. Upgrade once your swing is consistent."],
  ["Restring more often than you think", "Strings lose tension and feel over weeks. Fresh strings make control and comfort easier."],
]);
const HEAD_STEPS = steps([
  ["Sweet spot", "Oversize heads (104 sq in and up) are the most forgiving. 100 sq in is the middle ground. 97 to 98 sq in is smaller and more precise."],
  ["Power", "A bigger head acts more like a trampoline, so the ball comes off easier. Small heads need you to supply the pace."],
  ["Control", "Smaller heads give a lower launch and more precision on full swings. Big heads can fly long when you swing out."],
  ["Spin", "A 100 sq in head with an open pattern is the easiest way to get spin. Smaller heads need a faster swing for the same spin."],
  ["Swing speed", "Bigger heads catch more air and can feel slower through the air. Small heads feel quick and stable at the net."],
  ["Who each suits", "Oversize: beginners and players who want easy depth. 100: most club players. 97 to 98: advanced players with full swings."],
]);
const PATTERN_STEPS = steps([
  ["What the numbers mean", "16x19 means 16 main strings and 19 cross strings. Fewer strings leave more space between them."],
  ["Spin", "Open patterns let the strings move and snap back, which adds spin. Dense patterns grip less, so spin needs a faster swing."],
  ["Launch and control", "Open patterns launch the ball higher. Dense patterns keep it lower and more predictable on flat drives."],
  ["Feel", "Open patterns feel livelier and softer. Dense patterns feel firmer and more direct."],
  ["String life", "Strings move more in an open pattern, so they wear and break sooner, especially with heavy topspin."],
  ["Who each suits", "16x19 suits most players. 18x20 suits flat hitters and big swingers who want control. 16x18 suits heavy spin players."],
]);
const ELBOW_STEPS = steps([
  ["Choose a flexible frame", "Lower stiffness (a lower RA number) means less shock reaches your arm. Many arm-friendly frames sit around 60 RA or less."],
  ["Do not go too light", "Very light rackets pass more shock to the arm. A bit more weight, often in the handle, absorbs more of it."],
  ["Soften the strings", "Multifilament or gut strings at a lower tension are far kinder than stiff polyester at high tension."],
  ["Find the sweet spot", "Off-centre hits twist the racket and jar the arm. A bigger head or a stable frame helps."],
  ["Check your grip size", "A grip that is too small makes you squeeze harder, which strains the forearm."],
  ["Fix the technique too", "Late contact and arm-only swings cause most tennis elbow. Turning the body takes load off the arm."],
]);

export const TN_GUIDES: GuideCopy[] = [
  {
    key: "racket", crumb: "Rackets", title: "How to choose a tennis racket", seoTitle: "How to choose a tennis racket",
    description: "Start with your level, then head size, weight and string pattern. Players with a sore arm should also check stiffness.",
    tldrLead: "Start with your level, then pick a head size, a weight you can swing and a string pattern for your game. Check stiffness if your arm is sore.",
    tldr: ["Beginners: 100 to 105 sq in, light and forgiving.", "Club players: a 100 sq in frame around 300 g.", "Advanced: 97 to 98 sq in, heavier, often 18x20."],
    stepsTitle: "6 things to check, in order", steps: CHOOSE_STEPS, picksTitle: "Players' favourite in each category",
    commentsTitle: "Ask or share", composerPrompt: "What made you pick your racket? Or ask for advice", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: CHOOSE_STEPS.map(s => s.title),
  },
  {
    key: "beginner", crumb: "Beginners", title: "Beginner tennis tips that actually help", seoTitle: "Beginner tennis tips that actually help",
    description: "Beginner tennis tips: watch the ball, swing low to high, turn your body and play with a forgiving racket.",
    tldrLead: "Most new players lose points by rushing and swinging with the arm alone. Get ready early, turn your body and keep the ball in play.",
    tldr: ["Watch the ball onto the strings.", "Swing low to high for topspin and margin.", "Play a forgiving racket while you learn."],
    stepsTitle: "8 tips, most useful first", steps: BEGINNER_STEPS, picksTitle: "Rackets beginners vote for",
    commentsTitle: "Add your tip", composerPrompt: "What helped you most as a beginner?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: BEGINNER_STEPS.map(s => s.title), extra: { highlightFirstSteps: 3 },
  },
  {
    key: "shape", crumb: "Rackets", title: "Which head size: 97, 100 or oversize?", seoTitle: "Tennis racket head size: 97, 100 or oversize?",
    description: "Head size decides the sweet spot, the power and the control. 100 sq in suits most players; bigger is easier, smaller is precise.",
    tldrLead: "Head size decides the sweet spot, the power and the control. 100 sq in suits most players; bigger is easier, smaller is more precise.",
    tldr: ["Oversize (104+): biggest sweet spot, easy depth.", "100 sq in: the middle ground most players use.", "97 to 98: precision for full, clean swings."],
    stepsTitle: "6 things that change with head size", steps: HEAD_STEPS, picksTitle: "Players' favourite in each size",
    commentsTitle: "Ask or share", composerPrompt: "Which head size do you play, and would you switch?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: HEAD_STEPS.map(s => s.title),
  },
  {
    key: "side", crumb: "Rackets", title: "16x19 or 18x20: which string pattern?", seoTitle: "Tennis string pattern: 16x19 or 18x20?",
    description: "An open 16x19 pattern gives easier spin and launch. A dense 18x20 gives a flatter, more controlled ball.",
    tldrLead: "An open 16x19 pattern gives easier spin and launch. A dense 18x20 gives a flatter, more controlled ball that needs a faster swing.",
    tldr: ["16x19: easy spin and launch, suits most players.", "18x20: control and a lower ball for big swingers.", "16x18: the most spin, strings wear faster."],
    stepsTitle: "6 things that change with the pattern", steps: PATTERN_STEPS, picksTitle: "Players' picks for each pattern",
    commentsTitle: "Ask or share", composerPrompt: "Which pattern do you play, and why?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: PATTERN_STEPS.map(s => s.title),
  },
  {
    key: "elbow", crumb: "Health", title: "Tennis rackets for tennis elbow", seoTitle: "Best tennis rackets for tennis elbow: what to look for",
    description: "A flexible frame, a bit more weight and soft strings at lower tension take the most shock off a sore elbow.",
    tldrLead: "A flexible frame, a bit more weight and soft strings at lower tension take the most shock off a sore elbow. Technique matters too.",
    tldr: ["Flexible frame: a lower RA number.", "Not too light: weight absorbs shock.", "Soft strings at lower tension."],
    stepsTitle: "6 things that help a sore arm", steps: ELBOW_STEPS, picksTitle: "Rackets players with a sore arm vote for",
    commentsTitle: "Ask or share", composerPrompt: "Played through tennis elbow? Share what helped, or ask", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: ELBOW_STEPS.map(s => s.title),
  },
];

/** Padel's live words → tennis's, for the info pages. Order matters (the site name and "padel players" first). */
const SWAPS: [RegExp, string][] = [[/PadelRecs/g, "TennisRecs"], [/\bpadel players\b/g, "tennis players"], [/r\/padel\b/g, "r/tennis"],
  [/\bpadel\b/g, "tennis"], [/\bPadel\b/g, "Tennis"]];
export const toTennis = (t: string) => SWAPS.reduce((s, [re, to]) => s.replace(re, to), t);
const swapDeep = <T,>(v: T): T => (typeof v === "string" ? toTennis(v) : Array.isArray(v) ? v.map(swapDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [toTennis(k), swapDeep(x)])) : v) as T;
export const tennisInfo = (padel: InfoCopy[]): InfoCopy[] => swapDeep(padel);
