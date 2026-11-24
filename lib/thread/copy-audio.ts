/*
 * AudioRecs' Thread copy (owner design handoff 2026-11-21), the same shape as lib/thread/copy.ts (padel), which picks this
 * file on NICHE=audio.
 *
 * Guides: from the owner's audio mocks (design_handoff_audiorecs: Choose, Beginner, Type, Fit and ANC Guide), word for
 * word apart from these mock leftovers from padel:
 * - The Type guide's prompt "Which shape do you play, and would you switch?" asks "Which do you use, and would you switch?".
 * - The Fit guide's prompt "Which side do you play, and why?" asks "Which do you use, and why?", its crumb "Playing" is
 *   "Buying", and its pick groups are "For long sessions" and "For pockets and the gym" (the mock's "Rig" and "Foldable"
 *   labels are dropped).
 * - The Choose guide's prompt "What made you pick your product?" says "your pair".
 * - Picks titles say what the lists rank on: no beginner or gaming data exists, so the beginner guide lists the pairs
 *   listeners call good value.
 * Info pages (About, Score, Affiliate, Contact): padel's live text (with the owner's fixes, the real score rule) with audio's
 * words swapped in, as the audio mocks do.
 */
import type { GuideCopy, GuideStep, InfoCopy } from "./copy";

const steps = (list: [string, string][]): GuideStep[] => list.map(([title, body]) => ({ title, body }));
const COMPOSER_PLACEHOLDER = "Share a tip or ask a question";

export const AUDIO_GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = {
  racket: "How to choose your first good headphones",
  beginner: "Listening tips that actually help",
  shape: "Open-back or closed-back?",
  side: "Earbuds or over-ear?",
  elbow: "Noise cancelling, explained",
};

const CHOOSE_STEPS = steps([
  ["Where you will use them", "Noise cancelling earns its price on trains and planes. At home, open-back headphones sound more natural and cost less for the same quality."],
  ["Fit and comfort", "Clamp force, weight and ear cup depth decide whether you wear them for one hour or eight. Glasses wearers should look for soft, deep pads."],
  ["Sound signature", "Warm headphones boost bass, bright ones boost treble, balanced ones do neither. Most people are happiest with balanced and a little extra bass."],
  ["Wireless or wired", "Wireless is easier every day. Wired sounds better per dollar and never needs charging, but some models want a small amp."],
  ["Microphone and calls", "If you take calls, check reviews for the mic. Many great-sounding headphones have average call quality."],
  ["Ecosystem and app", "AirPods work best with iPhones. Many others have apps with an EQ, which can fix a tuning you do not quite like."],
]);
const BEGINNER_STEPS = steps([
  ["Get the fit right", "A poor seal loses most of the bass. Try every tip size on earbuds, and adjust the headband on over-ears until the cups sit flat."],
  ["Turn the volume down", "Loud listening hides detail and damages hearing. Most good headphones sound fuller than you expect at a moderate level."],
  ["Use a better source", "Low-quality streams and old Bluetooth codecs limit even great headphones. Check your streaming quality settings first."],
  ["Try the EQ", "A few small EQ changes can fix a tuning you do not like. Start by lowering, not boosting."],
  ["Give them a week", "Your ears adjust to a new sound. Judge new headphones after a week of normal listening, not the first hour."],
  ["Rest your ears", "Take short breaks on long sessions. Fatigue makes everything sound duller."],
  ["Clean your tips and pads", "Earwax and dust block sound. Clean tips weekly and replace worn pads."],
  ["Do not chase specs", "Frequency range and driver size tell you little. Listener reviews and your own ears are better guides."],
]);
const TYPE_STEPS = steps([
  ["Sound stage", "Open-back headphones sound like the music is around you. Closed-back sound more inside your head."],
  ["Noise in", "Closed-back block some outside noise. Open-back block almost none, so a loud room drowns them out."],
  ["Noise out", "Open-back leak sound. People nearby will hear your music clearly."],
  ["Bass", "Closed-back usually have more bass impact. Open-back bass is cleaner but lighter."],
  ["Comfort and heat", "Open-back let air through, so ears stay cooler on long sessions."],
  ["Price", "Open-back headphones often sound better for the same money, as long as you have a quiet room."],
]);
const FIT_STEPS = steps([
  ["How long you listen", "For sessions over two hours, most people find over-ears more comfortable than anything in the ear."],
  ["Where you listen", "Earbuds fit in a pocket and suit the gym. Over-ears are better on planes and at a desk."],
  ["Fit", "Earbud fit depends on your ear shape. Over-ear fit depends on head size and clamp force."],
  ["Noise cancelling", "The best over-ears still cancel more noise than the best earbuds."],
  ["Battery", "Over-ears often last 30 hours or more. Earbuds last 6 to 8 hours per charge."],
  ["Heat and sweat", "Over-ears get warm in summer. Earbuds stay cool and many are sweat resistant."],
]);
const ANC_STEPS = steps([
  ["What it blocks", "ANC is great at engine hum and fans. It does less for voices, babies and keyboard clicks."],
  ["Fit comes first", "A poor seal lets noise in no matter how good the ANC is. Check tip size and pad fit."],
  ["Pressure feeling", "Some people feel a slight pressure with strong ANC. Many models let you lower the level."],
  ["Transparency mode", "Good transparency lets you hear announcements without taking them off. Quality varies a lot."],
  ["Battery cost", "ANC uses battery. Expect 10 to 20 percent less playtime with it on."],
  ["Sound changes", "ANC can change the tuning slightly. Some headphones sound warmer with it on."],
]);

export const AUDIO_GUIDES: GuideCopy[] = [
  {
    key: "racket", crumb: "Buying", title: "How to choose your first good headphones", seoTitle: "How to choose your first good headphones",
    description: "Decide where you will use them first. Commute or travel: noise cancelling. Home: open-back. Comfort and fit matter more than specs.",
    tldrLead: "Decide where you will use them first. Commuting, the office and quiet listening at home each point to a very different pair.",
    tldr: ["Commute or travel: closed over-ear or earbuds with noise cancelling.", "Home and quiet rooms: open-back for the most natural sound.",
      "Comfort and fit matter more than specs. Try them on if you can."],
    stepsTitle: "6 things to check, in order", steps: CHOOSE_STEPS, picksTitle: "Listeners' favourite in each type",
    commentsTitle: "Ask or share", composerPrompt: "What made you pick your pair? Or ask for advice", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: CHOOSE_STEPS.map(s => s.title),
  },
  {
    key: "beginner", crumb: "Beginners", title: "Listening tips that actually help", seoTitle: "Headphone listening tips that actually help",
    description: "Small changes to fit, volume and source make a bigger difference than a new pair. Get a proper seal, listen lower, use better sources.",
    tldrLead: "Most people never hear what their headphones can do. Small changes to fit, volume and source make a bigger difference than a new pair.",
    tldr: ["Get a proper seal first. Bad fit loses the bass.", "Listen at lower volume. You will hear more detail and protect your ears.",
      "Use better sources before buying better headphones."],
    stepsTitle: "8 tips, most useful first", steps: BEGINNER_STEPS, picksTitle: "Good-value pairs listeners vote for",
    commentsTitle: "Add your tip", composerPrompt: "What helped you most as a beginner?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: BEGINNER_STEPS.map(s => s.title), extra: { highlightFirstSteps: 3 },
  },
  {
    key: "shape", crumb: "Buying", title: "Open-back or closed-back?", seoTitle: "Open-back or closed-back headphones?",
    description: "Open-back headphones sound more spacious but leak sound both ways. Closed-back block noise and keep your music private.",
    tldrLead: "Open-back headphones sound more spacious and natural but leak sound both ways. Closed-back headphones block noise and keep your music private.",
    tldr: ["Open-back: best sound for the price, only for quiet rooms.", "Closed-back: for offices, travel and anywhere others are near.",
      "Not sure? Closed-back with good comfort is the safer first pair."],
    stepsTitle: "6 things that change with the design", steps: TYPE_STEPS, picksTitle: "Listeners' favourite in each type",
    commentsTitle: "Ask or share", composerPrompt: "Which do you use, and would you switch?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: TYPE_STEPS.map(s => s.title),
  },
  {
    key: "side", crumb: "Buying", title: "Earbuds or over-ear?", seoTitle: "Earbuds or over-ear headphones?",
    description: "Earbuds win on size and the gym. Over-ear headphones win on comfort over long sessions and usually on sound and battery.",
    tldrLead: "Earbuds win on size and the gym. Over-ear headphones win on comfort over long sessions and usually on sound and battery.",
    tldr: ["Earbuds: pocketable, great for the gym and short trips.", "Over-ear: more comfortable for hours, better battery and sound.",
      "Glasses wearers: try over-ears with soft, deep pads."],
    stepsTitle: "6 ways to decide", steps: FIT_STEPS, picksTitle: "Listeners' picks for each type", picksTitles: ["For long sessions", "For pockets and the gym"],
    commentsTitle: "Ask or share", composerPrompt: "Which do you use, and why?", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: FIT_STEPS.map(s => s.title),
  },
  {
    key: "elbow", crumb: "Buying", title: "Noise cancelling, explained", seoTitle: "Noise cancelling headphones, explained",
    description: "Active noise cancelling cancels steady, low sounds like engines and air conditioning. It is less effective on voices and sudden noises.",
    tldrLead: "Active noise cancelling uses microphones to cancel steady, low sounds like engines and air conditioning. It is less effective on voices and sudden noises.",
    tldr: ["Best on steady low noise: planes, trains, air conditioning.", "Weaker on voices and sudden sounds.", "A good seal matters as much as the ANC itself."],
    stepsTitle: "6 things to know", steps: ANC_STEPS, picksTitle: "Noise cancelling headphones listeners vote for",
    commentsTitle: "Ask or share", composerPrompt: "Using noise cancelling? Share what helped, or ask", composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: ANC_STEPS.map(s => s.title),
  },
];

/** Padel's live words → audio's, for the info pages. Order matters (the site name and the longer phrases first). */
const SWAPS: [RegExp, string][] = [[/PadelRecs/g, "AudioRecs"], [/\bpadel players\b/g, "listeners"], [/\bpadel forums\b/g, "headphone forums"],
  [/\btalk padel\b/g, "talk headphones"], [/\bEvery padel racket\b/g, "Every product"], [/\btheir rackets\b/g, "their headphones"],
  [/\bracket reviews\b/g, "product reviews"], [/\bpadel\b/g, "headphone"], [/\bPadel\b/g, "Headphone"],
  [/\brackets\b/g, "products"], [/\bracket\b/g, "product"], [/\bRackets\b/g, "Products"], [/\bRacket\b/g, "Product"],
  [/\bplayer score\b/g, "listener score"], [/\bPlayer score\b/g, "Listener score"], [/\bplayers\b/g, "listeners"], [/\bPlayers\b/g, "Listeners"],
  [/\bplayer\b/g, "listener"], [/\bPlayer\b/g, "Listener"], [/\bplayed\b/g, "listened to"]];
export const toAudio = (t: string) => SWAPS.reduce((s, [re, to]) => s.replace(re, to), t);
const swapDeep = <T,>(v: T): T => (typeof v === "string" ? toAudio(v) : Array.isArray(v) ? v.map(swapDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [toAudio(k), swapDeep(x)])) : v) as T;
export const audioInfo = (padel: InfoCopy[]): InfoCopy[] => swapDeep(padel);
