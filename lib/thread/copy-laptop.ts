/*
 * LaptopRecs' Thread copy (owner 2026-11-24: PickleballRecs is the default copy for every site), the same shape as
 * lib/thread/copy.ts, which picks this file on NICHE=laptop.
 *
 * Guides in the same five slots: choosing a laptop (/guide), buying mistakes ("beginner"), laptop types ("shape"), Mac,
 * Windows or Chromebook ("side") and battery life ("elbow"). General buying advice only: no test results and no claims that
 * anything was tried here. Info pages: padel's live text with the site's words swapped in, as on PickleballRecs.
 */
import type { GuideCopy, GuideStep, InfoCopy } from "./copy";

const steps = (list: [string, string][]): GuideStep[] => list.map(([title, body]) => ({ title, body }));
const COMPOSER_PLACEHOLDER = "Share a tip or ask a question";

export const LT_GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = {
  racket: "How to choose a laptop",
  beginner: "Laptop buying mistakes to avoid",
  shape: "Ultrabook, gaming, business or 2-in-1?",
  side: "Mac, Windows or Chromebook?",
  elbow: "Laptops with all-day battery",
};

const CHOOSE_STEPS = steps([
  ["Start with what you will do on it",
    "Email, documents and browsing run on almost anything. Games, video editing and 3D need a strong graphics chip. Decide this first, because it rules out most of the list."],
  ["Pick the operating system",
    "macOS, Windows and ChromeOS each run different apps. Check that the software you need for work, school or games runs on it before anything else."],
  ["Size and weight",
    "13 and 14 inch laptops are easy to carry every day. 16 inch and larger give more screen and cooling, but often weigh over 2 kg. Carry it daily? Stay near 1.5 kg."],
  ["Battery life, from owners",
    "Maker battery numbers are best cases. Owner reports tell you more: look for people who say it lasts a full work day with their own use."],
  ["The screen you will stare at",
    "A brighter screen helps near windows. OLED has deep blacks but can flicker at low brightness for some people. A higher refresh rate feels smoother for games and scrolling."],
  ["Memory and storage",
    "16 GB of memory is a good floor for most people today. Many thin laptops have memory soldered on, so buy what you need now. Storage is often easier to add later."],
  ["Keyboard, trackpad and ports",
    "You touch these all day. Check what owners say about the keyboard and trackpad, and that the ports match what you plug in."],
]);
const MISTAKE_STEPS = steps([
  ["Buying more power than you use",
    "A gaming graphics chip adds weight, heat, fan noise and cost. If you never play games or edit video, a thin laptop will feel better every day."],
  ["Trusting the battery number on the box",
    "Maker figures come from light tests. Read what owners say about a normal day of their own use."],
  ["Too little memory",
    "8 GB fills up fast with a browser and a few apps. On a laptop with soldered memory you cannot add more later."],
  ["Ignoring the weight",
    "A laptop that is a pain to carry stays on the desk. If you carry it every day, the weight matters more than a bit more speed."],
  ["Skipping the keyboard and trackpad",
    "Spec sheets don't show a mushy keyboard or a jumpy trackpad. Owner reviews do."],
  ["Mixing up generations",
    "Makers reuse names year after year. Check the generation or chip, because last year's model can be a very different laptop."],
  ["Forgetting the warranty",
    "Repairs on thin laptops are costly. Check how long the warranty is and what owners say about the maker's support."],
  ["Buying on launch day",
    "Early owners find the issues: flickering screens, loud fans, driver bugs. Waiting a few weeks for reviews to come in costs nothing."],
]);
const TYPE_STEPS = steps([
  ["Ultrabooks and everyday laptops",
    "Thin, light and quiet, with long battery life. Best for work, school and travel. Not for serious games."],
  ["Gaming laptops",
    "A strong graphics chip and a fast screen. Heavier, louder and shorter on battery. Great on a desk, less fun in a bag."],
  ["Business laptops",
    "Good keyboards, plenty of ports, long warranties and easy repairs. ThinkPad, Dell Pro and EliteBook live here."],
  ["Creator laptops and workstations",
    "Colour-accurate screens and strong chips for photo, video and 3D work. Usually heavier and more expensive."],
  ["2-in-1 laptops",
    "Touch screens that fold or detach, often with a pen. Handy for notes and drawing. The keyboard can be a compromise."],
  ["Chromebooks",
    "Simple, fast to start and cheap to own. They run web apps and Android apps, not most Windows or Mac software."],
]);
const OS_STEPS = steps([
  ["Check your apps first",
    "The apps you need decide most of this. Some work software is Windows only, some creative tools run best on a Mac, and most games need Windows."],
  ["macOS",
    "MacBooks have long battery life, quiet running and great trackpads. Fewer games run on them, and memory and storage cannot be upgraded later."],
  ["Windows",
    "The widest choice of laptops, prices and games. Quality varies a lot between models, so owner reviews matter more here."],
  ["ChromeOS",
    "Simple, secure and cheap. Fine for browsing, documents and school. Not for most desktop apps or games."],
  ["Linux",
    "Runs well on many ThinkPads, Dell and Framework laptops. Check what owners say about drivers for your exact model."],
  ["If you are not sure",
    "Use what you already know for work or school. Switching takes a few weeks to get used to, and some apps may need replacing."],
]);
const BATTERY_STEPS = steps([
  ["Read owner reports, not the box",
    "Owners say how long it lasts with their own use. That is closer to your day than the maker's best case."],
  ["Chip matters most",
    "Apple's M chips and some newer Arm and low-power chips last longest. Gaming chips and graphics cards drain the battery fastest."],
  ["Screen brightness and refresh rate",
    "A bright, high refresh screen uses more power. Turning the refresh rate down on battery can add hours."],
  ["Battery size",
    "Bigger batteries help, but a laptop that sips power with a smaller battery can still last longer."],
  ["Background apps",
    "Browsers with many tabs, video calls and sync tools use more than you think. Check what is running when the battery drops fast."],
  ["Look after the battery",
    "Many laptops let you cap charging at 80% when plugged in most of the day. It helps the battery last more years."],
]);

export const LT_GUIDES: GuideCopy[] = [
  {
    key: "racket", crumb: "Laptops", title: "How to choose a laptop", seoTitle: "How to choose a laptop",
    description: "Choose a laptop by what you will do on it, then the operating system, size and weight. Check owner reports on battery life, keyboard and screen.",
    tldrLead: "Decide what you will do on it first. That sets the chip, the weight and the price, and rules out most of the list.",
    tldr: ["Work and school: a light ultrabook or MacBook with 16 GB of memory.", "Games: a gaming laptop, and accept the weight and fan noise.", "Read owner reports on battery, keyboard and screen before you buy."],
    stepsTitle: "7 things to check, in order", steps: CHOOSE_STEPS, picksTitle: "Owners' favourite in each category",
    commentsTitle: "Ask or share", composerPrompt: "What made you pick your laptop? Or ask for advice", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: CHOOSE_STEPS.map(s => s.title),
  },
  {
    key: "beginner", crumb: "Buying", title: "Laptop buying mistakes to avoid", seoTitle: "Laptop buying mistakes to avoid",
    description: "Laptop buying mistakes to avoid: more power than you need, trusting battery claims, too little memory, ignoring weight and mixing up generations.",
    tldrLead: "Most regrets come from buying for a spec sheet instead of an ordinary day. Think about how you carry it, how long you are away from a plug and what you run.",
    tldr: ["Don't pay for gaming power you won't use.", "Get 16 GB of memory if it is soldered on.", "Check the generation: names repeat every year."],
    stepsTitle: "8 mistakes, most common first", steps: MISTAKE_STEPS, picksTitle: "Laptops owners are happiest with",
    commentsTitle: "Add your tip", composerPrompt: "What do you wish you had known before buying?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: MISTAKE_STEPS.map(s => s.title), extra: { highlightFirstSteps: 3 },
  },
  {
    key: "shape", crumb: "Laptops", title: "Ultrabook, gaming, business or 2-in-1?", seoTitle: "Ultrabook vs gaming vs business vs 2-in-1 laptops",
    description: "Ultrabook, gaming, business, creator, 2-in-1 or Chromebook: what each kind of laptop is good at, and who each suits.",
    tldrLead: "Each kind of laptop trades weight, battery life and power differently. Pick the kind first, then the model.",
    tldr: ["Ultrabook: light, quiet and long battery life.", "Gaming: the most power, heavier and louder.", "Business and Chromebook: work-ready or simple and cheap."],
    stepsTitle: "6 kinds of laptop, and who they suit", steps: TYPE_STEPS, picksTitle: "Owners' favourite in each category",
    commentsTitle: "Ask or share", composerPrompt: "Which kind do you use, and would you switch?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: TYPE_STEPS.map(s => s.title),
  },
  {
    key: "side", crumb: "Buying", title: "Mac, Windows or Chromebook?", seoTitle: "Mac, Windows or Chromebook: which laptop?",
    description: "Mac, Windows or Chromebook? Start with the apps you need. Macs last long on battery, Windows has the widest choice, Chromebooks are simple and cheap.",
    tldrLead: "The apps you need decide most of it. After that it comes down to battery life, choice and price.",
    tldr: ["Mac: long battery life and quiet, fewer games.", "Windows: the widest choice of laptops and games.", "Chromebook: simple and cheap, web apps only."],
    stepsTitle: "6 ways to choose", steps: OS_STEPS, picksTitle: "Owners' top-rated laptops",
    commentsTitle: "Ask or share", composerPrompt: "Which did you pick, and why? Or ask", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: OS_STEPS.map(s => s.title),
  },
  {
    key: "elbow", crumb: "Laptops", title: "Laptops with all-day battery", seoTitle: "Laptops with all-day battery life",
    description: "Laptops with all-day battery: read owner reports, pick an efficient chip, turn down brightness and refresh rate, and cap charging at 80%.",
    tldrLead: "The chip and the screen decide battery life more than anything else. Owner reports tell you what a real day looks like.",
    tldr: ["Check what owners say about a normal day.", "Efficient chips last longest; gaming graphics drain fastest.", "Lower the refresh rate and brightness on battery."],
    stepsTitle: "6 things that decide battery life", steps: BATTERY_STEPS, picksTitle: "Laptops owners praise for battery life",
    commentsTitle: "Ask or share", composerPrompt: "How long does yours last? Share, or ask", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: BATTERY_STEPS.map(s => s.title),
  },
];

/** Padel's live words → laptop's, for the info pages. Order matters (the site name and longer phrases first). */
const SWAPS: [RegExp, string][] = [[/PadelRecs/g, "LaptopRecs"], [/\bpadel rackets\b/g, "laptops"], [/\bpadel racket\b/g, "laptop"], [/\bPadel rackets\b/g, "Laptops"],
  [/\bpadel\b/g, "laptop"], [/\bPadel\b/g, "Laptop"], [/\brackets\b/g, "laptops"], [/\bracket\b/g, "laptop"], [/\bRackets\b/g, "Laptops"], [/\bRacket\b/g, "Laptop"],
  [/\bplayers\b/g, "owners"], [/\bplayer\b/g, "owner"], [/\bPlayers\b/g, "Owners"], [/\bPlayer\b/g, "Owner"], [/\bplayed\b/g, "used"], [/\bplay\b/g, "use"]];
export const toLaptop = (t: string) => SWAPS.reduce((s, [re, to]) => s.replace(re, to), t);
const swapDeep = <T,>(v: T): T => (typeof v === "string" ? toLaptop(v) : Array.isArray(v) ? v.map(swapDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [toLaptop(k), swapDeep(x)])) : v) as T;
export const laptopInfo = (padel: InfoCopy[]): InfoCopy[] => swapDeep(padel);
