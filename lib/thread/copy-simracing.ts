/*
 * SimRacingRecs' Thread copy (owner 2026-11-20), the same shape as lib/thread/copy.ts (padel), which picks this file on
 * NICHE=simracing.
 *
 * Guides: from the owner's sim racing mocks (design_handoff_simracingrecs 3: Choose, Beginner, Drive, Pedals and Rig Guide),
 * word for word apart from the mock's padel leftovers:
 * - Drive guide prompt "Which shape do you play, and would you switch?" → about the drive type.
 * - Rig guide prompt "Which side do you play, and why?" → about desk, stand or rig; its breadcrumb "Playing" → "Gear".
 * - The mock's "Kept by [your names]" footer and "How we score" link are not used (padel's footer pattern).
 * Info pages (About, Score, Affiliate, Contact): padel's live text (with the owner's fixes) with sim racing's words swapped in.
 */
import type { GuideCopy, GuideStep, InfoCopy } from "./copy";

const steps = (list: [string, string][]): GuideStep[] => list.map(([title, body]) => ({ title, body }));
const COMPOSER_PLACEHOLDER = "Share a tip or ask a question";

export const SR_GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = {
  racket: "How to choose your first setup",
  beginner: "Beginner sim racing tips",
  shape: "Direct drive vs belt vs gear",
  side: "Why load cell pedals matter",
  elbow: "Desk mount or a rig?",
};

const CHOOSE_STEPS = steps([
  ["Set a budget for the whole setup", "Wheelbase, rim, pedals and mount all add up. Most racers are happier splitting the budget evenly than buying a top wheelbase with cheap pedals."],
  ["Direct drive, belt or gear", "Direct drive gives the most detail and the smoothest feel. Belt drive is a solid budget step. Gear driven wheels are fine to start but feel notchy."],
  ["Torque you can actually use", "5 to 8 Nm is plenty on a desk. More torque needs a rig, or the desk shakes before the wheel runs out of strength."],
  ["Pedals before a bigger wheelbase", "A load cell brake measures pressure, not travel, like a real car. Most racers find more lap time here than in extra torque."],
  ["Mount: desk, wheel stand or rig", "Desk clamps work for low torque. A wheel stand folds away. A rig is the only option that stays solid with a strong direct drive."],
  ["Check platform and ecosystem", "Not every wheelbase works on console. Rims and pedals often lock you into one brand, so check what you can add later."],
]);
const BEGINNER_STEPS = steps([
  ["Pick one car and one track", "Changing cars every session means relearning everything. Stay with one combo for a week and your lap times will drop fast."],
  ["Brake earlier than you think", "Most beginners brake late and miss the apex. Brake a little earlier, carry speed through the corner and get on the throttle sooner."],
  ["Turn the force feedback down", "Max strength feels exciting but hides detail and tires your arms. Around 60 to 80 percent lets you feel the tyres start to slip."],
  ["Look further ahead", "Look at the next apex, not the car in front. Your hands follow your eyes, so looking early gives smoother lines."],
  ["Set your field of view", "A correct field of view makes distance and speed feel real. Use a FOV calculator with your screen size and seat distance."],
  ["Race clean, not fast", "Finishing every race teaches more than crashing out of first. Safety rating systems reward clean laps too."],
  ["Use the racing line, then turn it off", "The line helps you learn braking points. Once you know them, turn it off and use track markers instead."],
  ["Start with entry gear", "An entry direct drive or belt wheel is enough to learn. Upgrade the pedals before chasing a stronger wheelbase."],
]);
const DRIVE_STEPS = steps([
  ["Detail", "Direct drive sends every bump and slip straight to your hands. Belt smooths some of it out. Gear driven wheels lose the finest detail."],
  ["Smoothness", "Direct drive and belt feel smooth when turning. Gear wheels can feel notchy, especially at low speed."],
  ["Torque", "Direct drive ranges from about 5 to 25 Nm. Belt and gear wheels usually sit between 2 and 4 Nm."],
  ["Noise", "Gear wheels rattle and click. Belt wheels hum. Direct drive is mostly quiet, apart from fans on some models."],
  ["Price", "Gear wheels are the cheapest way to start. Entry direct drive now costs about the same as a good belt wheel."],
  ["Mounting", "Gear and belt wheels clamp to almost any desk. Strong direct drive needs a rig to stop the flex."],
]);
const PEDALS_STEPS = steps([
  ["Pressure beats travel", "Your leg remembers force better than distance. A load cell brake turns that muscle memory into repeatable braking points."],
  ["Set the max brake force", "Set 100% brake to a firm but comfortable push. Too high and you never reach it, too low and you lock up every corner."],
  ["Mount them solidly", "If the pedals or chair move, every brake feels different. Bolt them to a rig or a pedal plate."],
  ["Trail braking gets easier", "Easing off the brake while turning in is much easier when you feel pressure drop, not pedal position."],
  ["Throttle matters less", "A smooth throttle helps, but the brake is where most lap time hides. Spend the money there first."],
  ["Check the clutch only if you need it", "A clutch pedal helps for H-pattern cars and rally. For GT and formula cars, two pedals are enough."],
]);
const RIG_STEPS = steps([
  ["How much torque you run", "Up to about 8 Nm, a sturdy desk copes. Past that, the desk shakes and you lose the detail you paid for."],
  ["Load cell pedals", "A load cell brake needs a firm push. On a desk chair, you push yourself backwards instead of pressing the pedal."],
  ["Room space", "A rig takes a permanent corner of the room. Foldable stands pack away under a bed or behind a door."],
  ["Seat position", "A rig keeps the seat, wheel and pedals at the same spot every time. That makes braking points easier to repeat."],
  ["Build time and upgrades", "Aluminium rigs take a weekend to build, but every part can move or upgrade later. Desk clamps take minutes."],
  ["Budget", "A good rig costs about as much as an entry wheelbase. Many racers buy it second hand."],
]);

export const SR_GUIDES: GuideCopy[] = [
  {
    key: "racket", crumb: "Gear", title: "How to choose your first sim racing setup", seoTitle: "How to choose your first sim racing setup",
    description: "Set a budget first, then spend most of it on the wheelbase and pedals. A solid mount matters more than fancy extras.",
    tldrLead: "Set a budget first, then spend most of it on the wheelbase and pedals. A solid mount matters more than fancy extras.",
    tldr: ["Beginners: an entry direct drive on a desk or wheel stand.", "Pedals: a load cell brake is the best upgrade per dollar.", "Strong wheelbase? Plan for a rig, desks flex."],
    stepsTitle: "6 things to check, in order", steps: CHOOSE_STEPS, picksTitle: "Racers' favourite in each category",
    commentsTitle: "Ask or share", composerPrompt: "What made you pick your gear? Or ask for advice", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: CHOOSE_STEPS.map(s => s.title),
  },
  {
    key: "beginner", crumb: "Beginners", title: "Beginner sim racing tips that actually help", seoTitle: "Beginner sim racing tips that actually help",
    description: "Beginner sim racing tips: learn one car on one track, brake in a straight line, and turn the force feedback down.",
    tldrLead: "Most new racers lose time by braking too late and turning too much. Slow down, learn one car and one track, and let consistency come first.",
    tldr: ["Learn one car on one track before switching.", "Brake in a straight line, then turn in.", "Turn force feedback down until it feels detailed, not strong."],
    stepsTitle: "8 tips, most useful first", steps: BEGINNER_STEPS, picksTitle: "Gear beginners vote for",
    commentsTitle: "Add your tip", composerPrompt: "What helped you most as a beginner?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: BEGINNER_STEPS.map(s => s.title), extra: { highlightFirstSteps: 3 },
  },
  {
    key: "shape", crumb: "Gear", title: "Direct drive, belt or gear: which wheelbase?", seoTitle: "Direct drive, belt or gear: which sim racing wheelbase?",
    description: "The drive type decides how much detail reaches your hands. Direct drive feels the most real, belt is a solid middle ground.",
    tldrLead: "The drive type decides how much detail reaches your hands. Direct drive feels the most real, belt is a solid middle ground, gear is the cheapest way in.",
    tldr: ["Direct drive: most detail and torque, best long term.", "Belt: smooth and affordable, a good first wheel.", "Gear: cheap and simple, but notchy and loud."],
    stepsTitle: "6 things that change with the drive type", steps: DRIVE_STEPS, picksTitle: "Racers' favourite in each type",
    commentsTitle: "Ask or share", composerPrompt: "Which drive type do you race with, and would you switch?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: DRIVE_STEPS.map(s => s.title),
  },
  {
    key: "side", crumb: "Gear", title: "Why load cell pedals matter", seoTitle: "Why load cell pedals matter in sim racing",
    description: "A load cell brake measures how hard you press, not how far. That matches real cars and makes braking far more consistent.",
    tldrLead: "A load cell brake measures how hard you press, not how far. That matches real cars and makes braking far more consistent lap after lap.",
    tldr: ["Upgrade the brake before anything else.", "Mount pedals solidly, a sliding chair ruins load cells.", "Set brake force so 100% needs a firm push, not a stomp."],
    stepsTitle: "6 things that help your braking", steps: PEDALS_STEPS, picksTitle: "Pedals racers vote for",
    commentsTitle: "Ask or share", composerPrompt: "Upgraded your pedals? Share what helped, or ask", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: PEDALS_STEPS.map(s => s.title),
  },
  {
    key: "elbow", crumb: "Gear", title: "Desk mount or a rig?", seoTitle: "Sim racing desk mount or a rig?",
    description: "A desk is fine for low torque and small rooms. Past about 8 Nm or with load cell pedals, a rig stops the flex.",
    tldrLead: "A desk is fine for low torque and small rooms. Once you pass about 8 Nm or add load cell pedals, a rig stops the flex and keeps your seat in place.",
    tldr: ["Desk: up to about 8 Nm, quick to set up.", "Foldable stand: packs away, good for shared rooms.", "Rig: the only option for strong direct drive and load cells."],
    stepsTitle: "6 ways to decide", steps: RIG_STEPS, picksTitle: "Racers' picks for each setup",
    commentsTitle: "Ask or share", composerPrompt: "Desk, stand or rig? Share what works for you", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: RIG_STEPS.map(s => s.title),
  },
];

/** Padel's live words → sim racing's, for the info pages. Order matters (the site name and "padel players" first). */
const SWAPS: [RegExp, string][] = [[/PadelRecs/g, "SimRacingRecs"], [/\bpadel players\b/g, "sim racers"], [/r\/padel\b/g, "r/simracing"],
  [/\bpadel\b/g, "sim racing"], [/\bPadel\b/g, "Sim racing"],
  [/\brackets\b/g, "products"], [/\bracket\b/g, "product"], [/\bRackets\b/g, "Products"], [/\bRacket\b/g, "Product"],
  [/\bplayer score\b/g, "racer score"], [/\bPlayer score\b/g, "Racer score"], [/\bplayers\b/g, "racers"], [/\bPlayers\b/g, "Racers"],
  [/\bplayer\b/g, "racer"], [/\bPlayer\b/g, "Racer"], [/\bplayed\b/g, "raced with"]];
export const toSimRacing = (t: string) => SWAPS.reduce((s, [re, to]) => s.replace(re, to), t);
const swapDeep = <T,>(v: T): T => (typeof v === "string" ? toSimRacing(v) : Array.isArray(v) ? v.map(swapDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [toSimRacing(k), swapDeep(x)])) : v) as T;
export const simracingInfo = (padel: InfoCopy[]): InfoCopy[] => swapDeep(padel);
