/*
 * DiscGolfRecs' Thread copy (owner 2026-11-20), the same shape as lib/thread/copy.ts (padel), which picks this file on
 * NICHE=discgolf.
 *
 * Guides: from the owner's disc golf mocks (design_handoff_discgolfrecs: Choose, Beginner, Types, Throw and Arm Guide),
 * word for word apart from these:
 * - The Throw guide's prompt "Backhand, forehand or both? Tell us why" says "Share why" (no "we/us").
 * - The mock's "Kept by [your names]" footer and "How we score" link are not used (padel's footer pattern).
 * Info pages (About, Score, Affiliate, Contact): padel's live text (with the owner's fixes) with disc golf's words swapped in.
 */
import type { GuideCopy, GuideStep, InfoCopy } from "./copy";

const steps = (list: [string, string][]): GuideStep[] => list.map(([title, body]) => ({ title, body }));
const COMPOSER_PLACEHOLDER = "Share a tip or ask a question";

export const DG_GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = {
  racket: "How to choose a disc",
  beginner: "Beginner disc golf tips",
  shape: "Putter vs midrange vs driver",
  side: "Backhand or forehand?",
  elbow: "Discs for slower arm speed",
};

const CHOOSE_STEPS = steps([
  ["Disc type", "Putters for short throws, midranges for control, fairway drivers for distance with accuracy, distance drivers for the longest throws."],
  ["Flight numbers", "Speed, glide, turn and fade describe how a disc flies. Lower speed is easier to throw well."],
  ["Stability", "Understable discs turn right for a right-handed backhand. Overstable discs fade left. Stable sits in between."],
  ["Arm speed", "Slower arms suit understable, lower speed discs. Big arms can handle faster, more overstable ones."],
  ["Plastic", "Base plastic grips well and is cheap. Premium plastic lasts longer and flies more consistently."],
  ["Weight", "Lighter discs fly further for slower arms. Heavier discs are steadier in the wind."],
  ["Wind on your course", "Windy courses need overstable discs that hold their line. Calm wooded courses reward straight flyers."],
]);
const BEGINNER_STEPS = steps([
  ["Start with slow discs", "Putters and midranges fly straighter and teach good form. Fast drivers need arm speed most beginners do not have yet."],
  ["Throw smooth, not hard", "Most distance comes from timing and a clean release. Trying to muscle it usually sends the disc into the trees."],
  ["Practise putting", "Putting is where most strokes are saved. Ten minutes of putts beats an hour of drives."],
  ["Learn hyzer and anhyzer", "Tilting the disc changes where it goes. Hyzer curves away from your throwing side, anhyzer curves the other way."],
  ["Keep your eyes on your target", "Pick a small spot, not the whole fairway. The disc follows your focus more than you think."],
  ["Lighter discs fly easier", "A lighter disc is easier to get up to speed. Many beginners do best around 160 to 170 g."],
  ["Play more rounds", "Field work helps, but rounds teach you lines, wind and decisions. Play often and relaxed."],
  ["Write your name on your discs", "Add a name and phone number. Lost discs come back more often than you would think."],
]);
const TYPES_STEPS = steps([
  ["Speed", "Putters are speed 1 to 3, midranges 4 to 6, fairway drivers 7 to 9 and distance drivers 10 and up."],
  ["Distance", "Faster discs can fly further, but only with enough arm speed. Without it, they fade early."],
  ["Accuracy", "Putters and midranges are easier to keep on line. Drivers punish small mistakes more."],
  ["Wind", "Overstable drivers handle headwinds best. Understable putters and mids can flip in strong wind."],
  ["Rim width", "Wider rims mean faster discs and a harder grip for small hands."],
  ["Which one to buy", "Beginners: a putter and a midrange. Then a fairway driver. Distance drivers last."],
]);
const THROW_STEPS = steps([
  ["What the backhand does", "The classic throw across your body. It gives most players their longest and straightest throws."],
  ["What the forehand does", "A flick from the side. It curves the other way to a backhand, which opens new lines."],
  ["Which to learn first", "Most people learn backhand first, then add a forehand for awkward holes."],
  ["Disc choice for forehand", "Forehands usually need more stable discs, because the wrist adds turn."],
  ["Shoulder and elbow", "Forehand can strain the elbow if you force it. Keep it smooth and build up slowly."],
  ["Use both", "Being able to throw both means fewer awkward stances and more ways around trees."],
]);
const ARM_STEPS = steps([
  ["Go understable", "Understable discs turn before they fade, which gives slower arms a straighter, longer flight."],
  ["Pick glide", "High glide numbers keep the disc in the air longer without needing more power."],
  ["Lighter weights", "A lighter disc is easier to get up to speed. Many slower arms gain distance at 150 to 165 g."],
  ["Slower drivers", "A speed 7 to 9 fairway driver often flies further than a speed 12 driver for slower arms."],
  ["Smooth form", "Clean timing adds more distance than effort. Film a throw to spot what is slowing you down."],
  ["Warm up", "Stretch and throw a few easy discs first. It protects your shoulder and elbow."],
]);

export const DG_GUIDES: GuideCopy[] = [
  {
    key: "racket", crumb: "Discs", title: "How to choose a disc", seoTitle: "How to choose a disc golf disc",
    description: "Pick the disc type first, then the stability for your arm speed. Beginners: putter and midrange first. Slow arm: understable.",
    tldrLead: "Pick the disc type first, then the stability for your arm speed. Most throwers do better with slower, more forgiving discs than they think.",
    tldr: ["Beginners: putter and midrange first.", "Slow arm: understable discs fly straighter.", "Windy course: add something overstable."],
    stepsTitle: "7 things to check, in order", steps: CHOOSE_STEPS, picksTitle: "Throwers' favourite in each type",
    commentsTitle: "Ask or share", composerPrompt: "What made you pick your disc? Or ask for advice", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: CHOOSE_STEPS.map(s => s.title),
  },
  {
    key: "beginner", crumb: "Beginners", title: "Beginner disc golf tips that actually help", seoTitle: "Beginner disc golf tips that actually help",
    description: "Beginner disc golf tips: start with a putter and a midrange, throw smooth instead of hard, and practise putting.",
    tldrLead: "Most new players throw drivers too early and too hard. Start with a putter and a midrange, focus on form, and play more rounds.",
    tldr: ["Start with a putter and a midrange, not a driver.", "Smooth form beats a hard throw.", "Practise putting, it saves the most strokes."],
    stepsTitle: "8 tips, most useful first", steps: BEGINNER_STEPS, picksTitle: "Discs beginners vote for",
    commentsTitle: "Add your tip", composerPrompt: "What helped you most when you started?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: BEGINNER_STEPS.map(s => s.title), extra: { highlightFirstSteps: 3 },
  },
  {
    key: "shape", crumb: "Discs", title: "Putter vs midrange vs driver", seoTitle: "Putter vs midrange vs driver: disc golf disc types",
    description: "Disc type decides speed, distance and control. Putters are the most accurate, drivers fly furthest, midranges sit in between.",
    tldrLead: "Disc type decides speed, distance and control. Putters are the most accurate, drivers fly furthest, midranges sit in between.",
    tldr: ["Putter: short throws and putting, most accurate.", "Midrange: control and approach shots.", "Driver: distance, but needs more arm speed."],
    stepsTitle: "6 things that change with disc type", steps: TYPES_STEPS, picksTitle: "Throwers' favourite in each type",
    commentsTitle: "Ask or share", composerPrompt: "Which disc type do you throw most, and why?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: TYPES_STEPS.map(s => s.title),
  },
  {
    key: "side", crumb: "Playing", title: "Backhand or forehand?", seoTitle: "Backhand or forehand in disc golf?",
    description: "Backhand is the most common throw and easiest to learn. Forehand adds shot shapes the backhand cannot reach.",
    tldrLead: "Backhand is the most common throw and easiest to learn. Forehand adds shot shapes the backhand cannot reach. Most good players use both.",
    tldr: ["Backhand: easiest to learn, most distance for most people.", "Forehand: great for curving around trees.", "Learn backhand first, add forehand later."],
    stepsTitle: "6 ways to think about your throw", steps: THROW_STEPS, picksTitle: "Throwers' picks for each throw", picksTitles: ["Backhand", "Forehand"],
    commentsTitle: "Ask or share", composerPrompt: "Backhand, forehand or both? Share why", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: THROW_STEPS.map(s => s.title),
  },
  {
    key: "elbow", crumb: "Discs", title: "Discs for slower arm speed", seoTitle: "Best disc golf discs for slower arm speed",
    description: "Understable, lighter and slower discs fly straight and far for slower arms. Fast, overstable drivers just fade early.",
    tldrLead: "Understable, lighter and slower discs fly straight and far for slower arms. Fast, overstable drivers just fade early.",
    tldr: ["Pick understable discs with lots of glide.", "Try lighter weights, around 150 to 165 g.", "Fairway drivers often beat distance drivers."],
    stepsTitle: "6 things that help a slower arm", steps: ARM_STEPS, picksTitle: "Discs throwers with slower arms vote for",
    commentsTitle: "Ask or share", composerPrompt: "Slower arm? Share what helped, or ask", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: ARM_STEPS.map(s => s.title),
  },
];

/** Padel's live words → disc golf's, for the info pages. Order matters (the site name and "padel players" first). */
const SWAPS: [RegExp, string][] = [[/PadelRecs/g, "DiscGolfRecs"], [/\bpadel players\b/g, "disc golfers"], [/\bpadel\b/g, "disc golf"], [/\bPadel\b/g, "Disc golf"],
  [/\brackets\b/g, "discs"], [/\bracket\b/g, "disc"], [/\bRackets\b/g, "Discs"], [/\bRacket\b/g, "Disc"],
  [/\bplayer score\b/g, "thrower score"], [/\bPlayer score\b/g, "Thrower score"], [/\bplayers\b/g, "throwers"], [/\bPlayers\b/g, "Throwers"],
  [/\bplayer\b/g, "thrower"], [/\bPlayer\b/g, "Thrower"], [/\bplayed\b/g, "threw"]];
export const toDiscGolf = (t: string) => SWAPS.reduce((s, [re, to]) => s.replace(re, to), t);
const swapDeep = <T,>(v: T): T => (typeof v === "string" ? toDiscGolf(v) : Array.isArray(v) ? v.map(swapDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [toDiscGolf(k), swapDeep(x)])) : v) as T;
export const discgolfInfo = (padel: InfoCopy[]): InfoCopy[] => swapDeep(padel);
