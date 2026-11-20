// Each site's own voice (owner 2026-11-18): one friend talking, a dad-joke padel regular, a dry tennis coach, a garage nerd, a
// laid-back disc golfer, a kind skincare friend, a home barista. Copy by Grok, edited by the owner and PM (AFTER-RESET.md item
// 8; guides in grok/padel-voice/PADEL-VOICE.md and grok/site-voices/VOICES.md). Jokes live only here (and in the per-product
// taglines, lib/voice-taglines.ts): never in verdicts, Why yes / Why not, scores, prices, buttons, or pain and skin-reaction
// lines. Lines ≤105 characters, no em dashes, no "we/us" service phrasing, no testing claims (tests/site-voice.test.ts).
// Client-safe: no product data here, so the review form and filters can import it.
import { niche } from "./niche";

export type VoiceFaq = { q: string; a: string };
export type SiteVoice = {
  /** Home "Questions" (lib/niche/*-home.ts keep their site questions; these replace "Is anything sponsored?" and follow). */
  faq: VoiceFaq[];
  /** Filters leave nothing; the search finds nothing; a product has no reviews yet. */
  empty: { filters: string; search: string; reviews: string };
  /** After a written review is sent (it waits for a quick check). One is picked per send. */
  thanks: string[];
  /** Shape / spec / type card lines, by the card's label (the guide uses the ones it has a card for). */
  cards: Record<string, string>;
};

// The shared facts (VOICES.md "FAQ facts"), in the owner's words (2026-11-18).
const PRICE = "Prices change by the day and by the shop, so the \"check price\" button takes you to today's real one.";
const ORDER = (people: string) => "Each pick starts with a hand-picked top 10, then the rest sort by how well they fit what you told it, "
  + `using ${people} reviews and specs. Nobody can pay to move up.`;
const FEW = "With only a few reviews, the score can swing, so read the reviews too.";
const MONEY = "Some \"check price\" links may earn a small commission. It costs you nothing and never changes the order.";

const VOICES: Record<string, SiteVoice> = {
  padel: {
    faq: [
      { q: "Is anything sponsored?", a: "Nope. Brands can't buy their way in, not for a higher place, a nicer summary or a bad review "
        + "quietly removed. Some \"check price\" links earn a small commission. They help pay for hosting, you pay the same price "
        + "either way, and they never change the order." },
      { q: "How is the order picked?", a: ORDER("player") },
      { q: "Where do the reviews come from?", a: "Three places: players who leave a review right here (each gets a quick check "
        + "before it's published), YouTube reviewers whose conclusions get summarised and linked back, and padel forums where "
        + "players report after months of use. Reviewers know the specs. Players know how it feels after month three." },
      { q: "Why no exact prices?", a: PRICE },
      { q: "Can I trust a racket with few reviews?", a: `${FEW} A handful of glowing reviews might just be one happy club.` },
    ],
    empty: {
      filters: "No racket ticks every box you picked. Loosen a filter or two and they'll come out of hiding.",
      search: "That search came back empty. Check the spelling, or try just the brand or model name.",
      reviews: "No reviews yet. Own this racket? Yours could be the first review on the board.",
    },
    thanks: [
      "Thanks! Your review is in, and the next player picking a racket just got a better answer.",
      "Review received. Once it's published, it counts toward this racket's player score.",
      "Thanks for sharing. Somewhere, a beginner just dodged the wrong diamond.",
    ],
    cards: {
      Round: "The biggest sweet spot, so even your off days stay on the court.",
      Teardrop: "The all-rounder, with a bit of power and a bit of control.",
      Hybrid: "It sits between round and teardrop, with a forgiving feel.",
      Diamond: "Most power, smallest sweet spot. For advanced attackers (and the ones who've watched a lot of YouTube).",
      Soft: "Comfy and kind to the arm, with easy power at slow speeds.",
      Hard: "Precise volleys for clean, hard hitters. Swing gently and it just shrugs.",
    },
  },
  pickleball: {
    faq: [
      { q: "Is anything sponsored?", a: `Nope, there's no pay-to-play here. Nobody can pay to move up. ${MONEY}` },
      { q: "How is the order picked?", a: ORDER("player") },
      { q: "Where do the reviews come from?", a: "Three places. Players leave a review right here on the site, and each review "
        + "gets a quick check before it's published. YouTube reviews get summarized and linked. Forum reports come from players "
        + "after months of use." },
      { q: "Why no exact prices?", a: PRICE },
      { q: "Can I trust a paddle with few reviews?", a: `Think of it like a new open play partner: promising, but early days. ${FEW}` },
    ],
    empty: {
      filters: "No paddle ticks every box you picked. Loosen a filter or two and the paddle stack will fill back up.",
      search: "Nothing came up for that search. Check the spelling, or try just the brand or paddle name.",
      reviews: "No reviews yet. Played with this one? Be the first to spill the dill.",
    },
    thanks: [
      "Thanks for the review! It gets a quick check, then it goes live for everyone.",
      "Big thanks. Your review just helped someone at open play pick their next paddle.",
      "Review in the books. That's a winner, and it didn't even need a third shot drop.",
    ],
    cards: {
      Elongated: "More reach and power on drives. Balls you used to wave goodbye to come back into play.",
      Widebody: "The biggest sweet spot around. More face, fewer \"oops\" moments at the kitchen.",
      Hybrid: "A middle ground, with a bit of extra reach and not much forgiveness given up.",
      Thermoformed: "Extra pop and stability from a molded, one-piece build, for fans of a lively paddle.",
      Carbon: "Crisper, with more control and spin. The grit grabs the ball, right up until it retires.",
      Fiberglass: "Easy pop, more forgiving and cheaper, with less bite on the ball than carbon.",
    },
  },
  tennis: {
    faq: [
      { q: "Is anything sponsored?", a: `No. Nobody pays to move up, and the order isn't for sale. ${MONEY}` },
      { q: "How is the order picked?", a: `${ORDER("player")} Think of it as seeding without the politics.` },
      { q: "Where do the reviews come from?", a: "Visitors leave a review on the site, and each one gets a quick check before "
        + "it's published. YouTube reviews are summarised and linked. Forum reports come from people after real use, shanks and all." },
      { q: "Why no exact prices?", a: PRICE },
      { q: "Can I trust a racket with few reviews?", a: "With only a few reviews the score can swing, like a toss in a stiff "
        + "breeze. Read the reviews too." },
    ],
    empty: {
      filters: "Nothing fits all those filters. Ease one off, like string tension, and try again.",
      search: "Search came up empty. Try a shorter name, or the model without the year.",
      reviews: "No reviews yet. Played with this one? The first review is yours to serve.",
    },
    thanks: [
      "Thanks for the review. It goes live after a quick check.",
      "Thanks for telling it straight. The next player choosing a frame owes you one.",
      "Noted, with thanks. Honest reviews help more players than any new string bed.",
    ],
    cards: {
      "Oversize head": "Biggest sweet spot and plenty of free power. Suits players who like the racket to help out.",
      "Midplus head": "The all-rounder size, mixing power, spin and forgiveness. Suits most club players.",
      "Mid head": "More control and feel for clean, full swingers. The sweet spot keeps a strict guest list.",
      "Open string pattern": "More spin and pop for topspin hitters. Strings wear out faster, so plan for restrings.",
      "Dense string pattern": "Flatter, more controlled shots and longer string life. Suits flat hitters.",
      "Heavy frame": "Stability and plough-through for full swings. Late in the third set, it gets heavier.",
    },
  },
  simracing: {
    faq: [
      { q: "Is anything sponsored?", a: `No. Nobody pays to move up, so there's no buying a spot on the front row. ${MONEY}` },
      { q: "How is the order picked?", a: ORDER("racer") },
      { q: "Where do the reviews come from?", a: "Visitors leave a review on the site, and each one gets a quick check before "
        + "it's published. YouTube reviews are summarised and linked. Forum reports come from people after real use, laps and all." },
      { q: "Why no exact prices?", a: PRICE },
      { q: "Can I trust a product with few reviews?", a: FEW },
    ],
    empty: {
      filters: "No gear ticks every box. Ease off a filter or two, like lifting before a tight corner.",
      search: "Search came up empty. Check the spelling or try the brand or model name.",
      reviews: "No reviews yet. Raced with this one? Be the first to say how it feels.",
    },
    thanks: [
      "Thanks for the review. It gets a quick check, then it's live for other racers.",
      "Cheers! Real laps make the best reviews, and yours just helped the next buyer.",
      "Thanks for sharing. That's worth more than a tenth to someone choosing their next upgrade.",
    ],
    cards: {
      Gear: "Affordable, proven and made for a first wheel. A little chatty, but it gets you on track.",
      Belt: "Smoother than gears and still kind to the budget. Suits racers ready to move past a first wheel.",
      "Direct drive": "The wheel sits right on the motor for the most detail. Suits anyone chasing the next tenth.",
      "Load cell": "You brake by pressure, not travel, for more consistent stops. Suits racers working on braking.",
      "Aluminium profile rigs": "Bolt on anything, flex on nothing. Suits racers already deep in the upgrade rabbit hole.",
      "Folding stands and rigs": "Roll out for a session, tuck away after. Suits small rooms and lighter bases.",
    },
  },
  discgolf: {
    faq: [
      { q: "Is anything sponsored?", a: `Nope. Nobody pays to move up the list. ${MONEY}` },
      { q: "How is the order picked?", a: ORDER("thrower") },
      { q: "Where do the reviews come from?", a: "Visitors leave a review on the site, and each one gets a quick check before "
        + "it's published. YouTube reviews are summarized and linked. Forum reports come from people after real use, tree hits included." },
      { q: "Why no exact prices?", a: PRICE },
      { q: "Can I trust a disc with few reviews?", a: FEW },
    ],
    empty: {
      filters: "No discs match all that. Loosen a filter, the way a disc loosens as it beats in.",
      search: "Nothing turned up, not even in the lost-and-found bin. Try another name or spelling.",
      reviews: "No reviews yet. Thrown this one? Tell everyone how it flew, trees and all.",
    },
    thanks: [
      "Thanks for the review. It gets a quick check, then it's live for every thrower.",
      "Appreciate it. Honest reviews save other throwers a whole lot of disc hunting.",
      "Thanks for sharing. That's good karma for your next round in the woods.",
    ],
    cards: {
      Putter: "Slow and straight, for putts and short approaches. Most bags hold more than they need.",
      Midrange: "Straight and predictable, the easiest disc to learn on. Fewer trips into the rough.",
      "Fairway driver": "Extra reach with more control than a bomber. Distance without needing a search party.",
      "Distance driver": "Max distance, but they need real arm speed to fly as rated. Suits power on open holes.",
      Understable: "Turns before it fades, great for hyzer flips and turnovers. Suits slower arms and shot shapers.",
      Overstable: "Fades hard and fights the wind. Suits forehands, headwinds and anyone who wants a sure finish.",
    },
  },
  skin: {
    faq: [
      { q: "Is anything sponsored?", a: `No. Nobody pays to move up the list. ${MONEY}` },
      { q: "How is the order picked?", a: "Each pick starts with a hand-picked top 10, then the rest sort by how well they fit "
        + "what you told it, using reviews and product details. Nobody can pay to move up." },
      { q: "Where do the reviews come from?", a: "Visitors leave a review on the site, and each one gets a quick check before "
        + "it is published. YouTube reviews are summarized and linked. Forum reports come from people after real use." },
      { q: "Why no exact prices?", a: PRICE },
      { q: "Can I trust a product with few reviews?", a: `You can, just read the reviews too. ${FEW.replace(", so read the reviews too", "")}` },
    ],
    empty: {
      filters: "Nothing fits all those filters yet. Loosen one and see what turns up.",
      search: "Nothing found for that. Check the spelling or try a simpler product name.",
      reviews: "No reviews yet. Tried this one? Yours could be the first on the shelf.",
    },
    thanks: [
      "Thanks for sharing. Your review gets a quick check, then it goes live.",
      "Thank you! Honest reviews like yours make choosing skincare a lot less guesswork.",
      "Thanks! Someone standing in the skincare aisle just got a little help.",
    ],
    cards: {
      Cleanser: "Step one for every routine. Creamy types suit dry skin, foaming types suit oily skin.",
      Serum: "For one clear goal, like hydration or brightening. The \"one more serum\" habit is optional.",
      Moisturizer: "For every skin type. Gel creams suit oily skin and warm weather, rich creams suit dry.",
      SPF: "For every morning routine. The sunscreen you enjoy wearing is the one that leaves the shelf.",
      Exfoliant: "For smoother texture and clogged pores. Many users keep it to a few times a week.",
      Retinoid: "For smoother texture and more even tone over time. Start slowly, a few nights a week.",
    },
  },
  coffee: {
    faq: [
      { q: "Is anything sponsored?", a: `No. Nobody pays to move up. ${MONEY}` },
      { q: "How is the order picked?", a: ORDER("owner") },
      { q: "Where do the reviews come from?", a: "Visitors leave reviews on the site, and each gets a quick check before "
        + "it's published. YouTube reviews are summarised and linked. Forum reports come from people after real use." },
      { q: "Why no exact prices?", a: PRICE },
      { q: "Can I trust a product with few reviews?", a: FEW },
    ],
    empty: {
      filters: "Nothing matches these filters. Loosen one or two and try again.",
      search: "Search came up empty. Check the spelling, or try a broader term like \"grinder\".",
      reviews: "No reviews yet. Brewed with this one? Pour out your review.",
    },
    thanks: [
      "Thanks! Your review gets a quick check, then it's live for the next caffeine seeker.",
      "Cheers for sharing. Real use beats any spec sheet.",
      "Thanks for spilling the beans. Your review helps someone pick their next brew.",
    ],
    cards: {
      "Espresso machine": "For milk drink lovers and shot pullers happy to spend a while dialling in.",
      "Flat burr grinder": "For clarity chasers who want every tasting note to get its own seat.",
      "Conical burr grinder": "For fans of rich, full-bodied espresso and medium to dark roasts.",
      "Pour-over dripper": "For people who enjoy the pour itself and a little morning meditation.",
      "French press": "For low-fuss mornings and heavy, full-bodied cups with zero gadgets to charge.",
      "Single-dose grinder": "For bean swappers who weigh each dose and like to keep retention low.",
    },
  },
};

/** Every site's voice (tests). */
export const ALL_VOICES = VOICES;

/** This site's voice, or null on a site without one yet. */
export function siteVoice(site = niche.id): SiteVoice | null {
  return VOICES[site] ?? null;
}

/** A site's card line by label, else `fallback` (the guide's own text). */
export const voiceCard = (label: string, fallback: string, site = niche.id) => VOICES[site]?.cards[label] ?? fallback;

/** The home Questions: the site's own questions with "Is anything sponsored?" dropped, then the voice FAQ after them. */
export function withVoiceFaq<T extends { q: string }>(own: T[], toItem: (f: VoiceFaq) => T, site = niche.id): T[] {
  const v = VOICES[site];
  if (!v) return own;
  const mine = new Set(v.faq.map(f => f.q.toLowerCase()));
  return [...own.filter(f => !mine.has(f.q.toLowerCase())), ...v.faq.map(toItem)];
}

/** One of the site's thank-yous (random per send), else `fallback`. */
export function voiceThanks(fallback: string, site = niche.id): string {
  const t = VOICES[site]?.thanks;
  return t?.length ? t[Math.floor(Math.random() * t.length)] : fallback;
}
