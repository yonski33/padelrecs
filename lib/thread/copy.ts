/*
 * Score page sections rewritten by the main session (2026-11-19) to describe the live volume-weighted Player score
 * (lib/signal.ts), not the mock rule: owner reverted #430 via #431.
 *
 * Thread redesign page copy, extracted from the design mocks in
 * design/thread-redesign-v1/ (Racket Guide, Guide, Shape Guide, Side Guide,
 * Elbow Guide, About, Score, Affiliate and Contact "Thread.dc.html").
 *
 * Left out on purpose (mock data that comes from the database): racket names,
 * verdicts and scores in the picks lists, review counts, comments, comment
 * votes, the per-step "N players say ..." lines and vote counts, and the
 * unrendered poll arrays ("Yes, very" / "A bit" / "Not really" with counts;
 * the mocks never render a poll question, so no poll copy is included).
 *
 * Changes made to the mock copy to follow the owner's copy rules:
 * - Contact: the topic placeholder for "Something else" was "Tell us anything."
 *   in one array and "Write anything." in the rendered one; kept "Write anything."
 *   (rule 2, no "us").
 * - About "Say hi" and Contact footer line: the mock email address is
 *   replaced with the token {contactLink}; the page must render the real contact
 *   link there.
 * - Score "Turned into one number": dropped the whole section. Its rule ("Loved it
 *   counts fully, mixed counts half and not for me counts nothing") does not match
 *   the real volume-weighted score (rule 6). A human needs to write the real rule.
 * - Score "When a score shows": dropped "A racket needs at least 5 opinions to get
 *   a score, and 20 to appear in rankings." (ranking threshold claim, rule 6) and
 *   replaced it with a neutral "A racket needs enough opinions before it gets a
 *   score." A human should add the real thresholds if they want numbers here.
 * - Side guide: the "Our middle is a wall." line is a mock comment (data), so it is
 *   not copied at all; nothing to reword in the page copy itself.
 * - No em/en dashes, prices or "How we score" wording were found in the copy that
 *   was kept, so no other edits were needed.
 *
 * Needs a human check against the real scoring (kept as in the mock):
 * - Score "Player reviews count the most" (on-site reviews weigh more than web
 *   summaries), "What the colours mean" (85+ green, 70 to 84 yellow, under 70 white)
 *   and "It keeps updating" ("change the score every day").
 * - TL;DR lead paragraphs are treated as body text; several are 110 to 140 chars.
 */

import { niche } from "../niche";
import { PB_GUIDES, PB_GUIDE_LINK_LABELS, pickleballInfo } from "./copy-pickleball";
import { SKIN_GUIDES, SKIN_GUIDE_LINK_LABELS, skinInfo } from "./copy-skin";
import { DG_GUIDES, DG_GUIDE_LINK_LABELS, discgolfInfo } from "./copy-discgolf";
import { AUDIO_GUIDES, AUDIO_GUIDE_LINK_LABELS, audioInfo } from "./copy-audio";
import { SR_GUIDES, SR_GUIDE_LINK_LABELS, simracingInfo } from "./copy-simracing";
const PICKLEBALL = niche.id === "pickleball", SKIN = niche.id === "skin", DG = niche.id === "discgolf", AUDIO = niche.id === "audio", SR = niche.id === "simracing";

export type GuideStep = { title: string; body: string };
export type GuideCopy = {
  key: "racket" | "beginner" | "shape" | "side" | "elbow";
  crumb: string;
  title: string;
  seoTitle: string;
  description: string;
  tldrLead: string | null;
  tldr: string[];
  stepsTitle: string;
  steps: GuideStep[];
  picksTitle: string;
  picksTitles?: string[];
  commentsTitle: string;
  composerPrompt: string;
  composerPlaceholder: string;
  onThisPage: string[];
  extra?: Record<string, unknown>;
};

/** Shared UI labels used by every guide mock (static markup in each template). */
export const GUIDE_UI = {
  crumbRoot: "Guides",
  tldrLabel: "TL;DR",
  fullRanking: "Full ranking",
  seeReviews: "See reviews ›",
  reviewsSuffix: "reviews", // rendered as "{n} reviews"
  scoreLabel: "player score",
  newestFirst: "Newest first",
  postingAs: "Posting as",
  newName: "New name",
  cancel: "Cancel",
  post: "Post",
  reply: "Reply",
  onThisPage: "On this page",
  moreGuides: "More guides",
  footerTagline: niche.id === "skin" ? "a free, ad-light side project · built by people who love skincare"
    : niche.id === "discgolf" ? "a free, ad-light side project · built by disc golfers" : niche.id === "audio" ? "a free, ad-light side project · built by listeners"
    : niche.id === "simracing" ? "a free, ad-light side project · built by sim racers" : `a free, ad-light side project · built by ${niche.id} players`, // padel, pickleball
  footerLinks: ["About", "How the score works", "Affiliate disclosure", "Contact"],
} as const;

/** "More guides" link labels, from the `guides` arrays in each guide mock. */
const PADEL_GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = {
  racket: "How to choose a padel racket",
  beginner: "Beginner padel tips",
  shape: "Round vs teardrop vs diamond",
  side: "Right side or left side?",
  elbow: "Rackets for tennis elbow",
};

function steps(list: [string, string][]): GuideStep[] {
  return list.map(([title, body]) => ({ title, body }));
}

const RACKET_STEPS = steps([
  [
    "Shape: round, teardrop or diamond",
    "Round rackets have the sweet spot low and central, so they forgive mishits. Teardrop is the all-rounder. Diamond puts weight at the top for big smashes, but punishes late hits.",
  ],
  [
    "Feel: soft, medium or hard",
    "A soft core is comfortable and gives easy depth from the back. A hard core gives more control and pop at the net, but needs more effort and is harder on the arm.",
  ],
  [
    "Weight: lighter is often better",
    "Most rackets weigh 345 to 375 g. Lighter rackets are quicker at the net and easier on the arm over a long match. Heavier ones add power but tire you faster.",
  ],
  [
    "Balance: where the weight sits",
    "Low balance feels quick and easy to control. High balance adds power to smashes but feels slower in fast exchanges. Shape usually sets the balance for you.",
  ],
  [
    "Your level, honestly",
    "Beginners do best with a round, soft racket. Intermediate players can try a teardrop. Diamonds suit advanced players with clean technique who attack a lot.",
  ],
  [
    "Your side of the court",
    "Right-side players defend and build points, so control rackets fit well. Left-side players finish more points with smashes, so power rackets make more sense.",
  ],
  [
    "Sore arm? Put comfort first",
    "If you have tennis elbow or a sore wrist, pick a soft core, low balance and a lighter weight. Add an overgrip and hold the racket loosely.",
  ],
]);

const BEGINNER_STEPS = steps([
  [
    "Let the ball come off the glass",
    "New players rush to hit the ball before it reaches the back wall. Wait for it. The glass slows the ball down and gives you time to set up a calm return.",
  ],
  [
    "Hold the racket loosely",
    "A tight grip tires your arm and sends blocks flying long. Squeeze only at contact, and keep your wrist firm but relaxed between shots.",
  ],
  [
    "Lob more than you think",
    "The lob is the most useful shot in padel. A deep lob pushes the other pair back from the net and gives your team time to move forward.",
  ],
  [
    "Move with your partner",
    "Stay side by side, like you are joined by a rope. When one moves forward or back, the other follows. Gaps between you are where points are lost.",
  ],
  [
    "Keep volleys short",
    "At the net, think block, not swing. Hold the racket in front of you and push the ball deep with a short movement.",
  ],
  [
    "Serve low and deep",
    "The serve is underhand and starts the point, not wins it. Aim deep towards the glass and focus on getting it in every time.",
  ],
  [
    "Do not smash every high ball",
    "Most smashes from beginners land in the glass and bounce back as an easy ball. Use a bandeja, a controlled overhead, to keep your spot at the net.",
  ],
  [
    "Start with a forgiving racket",
    "A round racket with a soft core and big sweet spot hides mishits while you learn. Save diamond rackets for when your technique is steady.",
  ],
]);

const SHAPE_STEPS = steps([
  [
    "Where the sweet spot sits",
    "On a round racket it sits low and central, close to your hand. On a diamond it moves up towards the tip, where the ball travels faster but is harder to find.",
  ],
  [
    "How the racket swings",
    "Round rackets keep the weight near the handle, so they feel quick. Diamonds carry weight at the top, which adds power but feels slower at the net.",
  ],
  [
    "Control from the back",
    "Round rackets make lobs and deep balls from the glass easier to place. Diamonds tend to send defensive shots longer than you meant.",
  ],
  [
    "Power on smashes",
    "Diamonds win here. The weight at the top turns a good swing into a smash that reaches the fence. Teardrops give some of that with less risk.",
  ],
  [
    "How forgiving it is",
    "Hit off centre with a round racket and the ball still goes over. With a diamond the same hit often dies in the net or flies out.",
  ],
  [
    "Which one to buy",
    "Learning or defending: round. Playing a bit of everything: teardrop. Attacking from the left with solid technique: diamond.",
  ],
]);

const SIDE_STEPS = steps([
  [
    "What the right side does",
    "The right player keeps rallies going, returns deep and sets up the point. Patience and consistency matter more than power here.",
  ],
  [
    "What the left side does",
    "The left player takes most overheads and smashes, and is expected to finish points. It needs confidence and a strong overhead.",
  ],
  [
    "Who takes the middle",
    "With two right-handers, the left player has the forehand in the middle, so they take most balls there. Agree on this before the match.",
  ],
  [
    "Left-handers",
    "A left-hander often plays the right side, so both forehands cover the middle. It can also work on the left for players with a big overhead.",
  ],
  [
    "Your racket for each side",
    "Right-side players usually prefer a control racket for steady returns. Left-side players often pick a teardrop or diamond for more smash power.",
  ],
  [
    "Try both",
    "Play a few weeks on each side before you decide. Many players find their side surprises them, especially if they came from tennis.",
  ],
]);

const ELBOW_STEPS = steps([
  [
    "Go for a soft core",
    "Soft EVA or foam cores take in more of the shock at contact. Hard cores send more vibration into your elbow on every hit.",
  ],
  [
    "Keep the weight low",
    "A lighter racket is easier to swing late in a match, when tired muscles let more strain reach the elbow. Look at 345 to 360 g.",
  ],
  [
    "Choose low balance",
    "Weight near the handle means less leverage on your forearm. Round rackets usually have the lowest balance.",
  ],
  [
    "Hold it loosely",
    "Gripping hard is one of the main causes of elbow pain. Squeeze only at contact and relax between shots.",
  ],
  [
    "Add an overgrip",
    "A thicker, softer grip means you do not have to squeeze as hard. One or two overgrips is enough for most hands.",
  ],
  [
    "Rest and see a physio",
    "If the pain lasts more than a few weeks, take a break and get it checked. A racket helps, but it does not replace treatment.",
  ],
]);

const COMPOSER_PLACEHOLDER = "Share a tip or ask a question";

const PADEL_GUIDES: GuideCopy[] = [
  {
    key: "racket",
    crumb: "Rackets",
    title: "How to choose a padel racket",
    seoTitle: "How to choose a padel racket",
    description:
      "Pick the padel racket shape first, then the feel. Beginners: round, soft and light. Intermediate: try a teardrop. Sore arm: comfort first.",
    tldrLead:
      "Pick the shape first, then the feel. Most players are happier with a racket that is easier than they think they need.",
    tldr: [
      "Beginners: round shape, soft core, lighter weight.",
      "Intermediate: try a teardrop for more all-round play.",
      "Sore arm: comfort first, power can come later.",
    ],
    stepsTitle: "7 things to check, in order",
    steps: RACKET_STEPS,
    picksTitle: "Players' favourite in each shape",
    commentsTitle: "Ask or share",
    composerPrompt: "What made you pick your racket? Or ask for advice",
    composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: RACKET_STEPS.map((s) => s.title), // sidebar reuses the step titles
  },
  {
    key: "beginner",
    crumb: "Beginners",
    title: "Beginner padel tips that actually help",
    seoTitle: "Beginner padel tips that actually help",
    description:
      "Beginner padel tips that help: wait for the ball off the back glass, grip loosely, keep volleys short, lob often and move with your partner.",
    tldrLead:
      "Most new players lose points by hitting too hard and too early. Slow down, use the glass and keep the ball in play.",
    tldr: [
      "Wait for the ball to come off the back glass.",
      "Grip loosely and keep volleys short.",
      "Lob often, and move as one with your partner.",
    ],
    stepsTitle: "8 tips, most useful first",
    steps: BEGINNER_STEPS,
    picksTitle: "Rackets beginners vote for",
    commentsTitle: "Add your tip",
    composerPrompt: "What helped you most as a beginner?",
    composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: BEGINNER_STEPS.map((s) => s.title),
    // Guide Thread.dc.html: the first 3 step numbers get the lime badge, the rest white.
    extra: { highlightFirstSteps: 3 },
  },
  {
    key: "shape",
    crumb: "Rackets",
    title: "Round vs teardrop vs diamond",
    seoTitle: "Round vs teardrop vs diamond",
    description:
      "Round vs teardrop vs diamond padel rackets: round forgives and gives the most control, diamond hits hardest, teardrop sits in between.",
    tldrLead:
      "Shape decides where the sweet spot sits and how the racket swings. Round forgives, diamond hits hardest, teardrop sits in between.",
    tldr: [
      "Round: big sweet spot, most control, best to learn with.",
      "Teardrop: balanced, a good second racket for most players.",
      "Diamond: most power, smallest sweet spot, for clean technique.",
    ],
    stepsTitle: "6 things that change with shape",
    steps: SHAPE_STEPS,
    picksTitle: "Players' favourite in each shape",
    commentsTitle: "Ask or share",
    composerPrompt: "Which shape do you play, and would you switch?",
    composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: SHAPE_STEPS.map((s) => s.title),
  },
  {
    key: "side",
    crumb: "Playing",
    title: "Right side or left side?",
    seoTitle: "Right side or left side?",
    description:
      "Right or left side in padel? The right side builds the point, the left finishes it with overheads. Pick the side that suits how you play.",
    tldrLead:
      "The right side builds the point and the left side finishes it. Pick the side that suits how you like to play, not just your forehand.",
    tldr: [
      "Right side: steady, patient, plays most balls from the middle.",
      "Left side: takes the overheads and finishes points.",
      "Right-handers on the left get the forehand in the middle.",
    ],
    stepsTitle: "6 ways to pick your side",
    steps: SIDE_STEPS,
    picksTitle: "Players' picks for each side",
    // Side Guide Thread.dc.html: each pick row carries a "Right side" / "Left side" tag.
    picksTitles: ["Right side", "Left side"],
    commentsTitle: "Ask or share",
    composerPrompt: "Which side do you play, and why?",
    composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: SIDE_STEPS.map((s) => s.title),
  },
  {
    key: "elbow",
    crumb: "Rackets",
    title: "Rackets for tennis elbow",
    seoTitle: "Rackets for tennis elbow",
    description:
      "Padel rackets for tennis elbow: a soft core, low balance and lighter weight. Hold it loosely, add an overgrip and see a physio if pain lasts.",
    tldrLead:
      "A soft, light racket with low balance takes most of the shock away from your arm. How you hold it matters just as much.",
    tldr: [
      "Pick a soft core, low balance and a lighter weight.",
      "Hold the racket loosely and use an overgrip.",
      "See a physio if the pain lasts more than a few weeks.",
    ],
    stepsTitle: "6 things that help a sore arm",
    steps: ELBOW_STEPS,
    picksTitle: "Rackets players with sore arms vote for",
    commentsTitle: "Ask or share",
    composerPrompt: "Got elbow pain? Share what helped, or ask",
    composerPlaceholder: COMPOSER_PLACEHOLDER,
    onThisPage: ELBOW_STEPS.map((s) => s.title),
  },
];

export type InfoSection = { title: string; body: string[] };
export type InfoCopy = {
  key: "about" | "score" | "affiliate" | "contact";
  title: string;
  seoTitle: string;
  description: string;
  intro: string[];
  sections: InfoSection[];
  extra?: Record<string, unknown>;
};

/** Shared labels from the info page mocks (sidebar and footer). */
export const INFO_UI = {
  tldrLabel: "TL;DR",
  onThisPage: "On this page",
  moreAbout: `More about ${niche.site.name}`,
  moreLinks: [`About ${niche.site.name}`, "How the score works", "Affiliate disclosure", "Contact"],
} as const;

const PADEL_INFO: InfoCopy[] = [
  {
    key: "about",
    title: "About PadelRecs",
    seoTitle: "About",
    description:
      "PadelRecs is a free, ad-light side project where padel players share what they really think of their rackets. Brands cannot pay to be listed.",
    intro: [
      "A free, ad-light side project where padel players share what they really think of their rackets. Built and kept by padel players.",
    ],
    sections: [
      {
        title: "What this is",
        body: [
          "PadelRecs collects what real players think of their rackets. Votes and reviews left on the site, plus summaries of Reddit threads, forum posts, YouTube reviews and blogs.",
          "Every racket gets one player score, so you can see at a glance what people actually think.",
        ],
      },
      {
        title: "Who runs it",
        body: [
          "Kept by padel players who got tired of racket reviews that read like adverts. It started as a spreadsheet of what friends said about their rackets.",
        ],
      },
      {
        title: "How it stays honest",
        body: [
          "Brands cannot pay to be listed, ranked or reviewed. Scores come only from players, and every review on the site is checked by a real person before it counts.",
          "If a racket is bad, the score says so.",
        ],
      },
      {
        title: "How it pays for itself",
        body: [
          "Some links to shops are affiliate links. If you buy through one, the shop pays a small commission. It never changes a score or a ranking.",
        ],
      },
      {
        title: "How the score works",
        body: ["One number from 0 to 100, built from votes and reviews here and from around the web."],
      },
    ],
    extra: {
      // About Thread.dc.html: link under a section, keyed by section title.
      sectionLinks: {
        "How it pays for itself": { label: "Read the affiliate disclosure", to: "affiliate" },
        "How the score works": { label: "See how the score works", to: "score" },
      },
      // About Thread.dc.html: unnumbered "Say hi" block after the sections.
      // {contactLink} replaces the mock email address.
      sayHi: {
        title: "Say hi",
        body: "Spotted a mistake, want a racket added, or just want to talk padel? Email {contactLink}. A real person reads every message.",
      },
    },
  },
  {
    key: "score",
    title: "How the score works",
    seoTitle: "How the score works",
    description:
      "Every padel racket on PadelRecs gets one player score from 0 to 100, built only from what players say, here and around the web. Brands cannot buy it.",
    intro: [
      "Every racket gets one player score from 0 to 100. It comes only from what players say, here and around the web. Brands cannot buy it.",
    ],
    sections: [
      {
        title: "Where the opinions come from",
        body: [
          "Reviews left on PadelRecs, plus Reddit threads, padel forums, YouTube reviews and blog posts about each racket.",
        ],
      },
      {
        title: "Web reviews are read and summarised",
        body: [
          "Each video, thread and post is summarised and read as loved it, mixed or not for them. Posts without a clear opinion still show, but do not move the score.",
        ],
      },
      {
        title: "Turned into one number",
        body: [
          "Loved it counts for the racket, mixed counts a little against it and not for me counts more.",
          "Volume matters too: a racket with many reviews can reach the high 80s and 90s. With only a few, the score stays modest until more players weigh in.",
        ],
      },
      {
        title: "What the colours mean",
        body: [
          "Green means 85 or more: players love it. Yellow means 70 to 84: good, with some trade-offs. White means under 70: mixed opinions.",
        ],
      },
      {
        title: "When a score shows",
        body: [
          'A racket needs at least 5 reviews with a clear opinion before it gets a score. Until then it shows "Not enough votes yet".',
        ],
      },
      {
        title: "It keeps updating",
        body: ["New reviews change the score as they come in, so rackets can move up or down over time. Quick votes on racket pages show beside the score, not inside it."],
      },
    ],
    extra: {},
  },
  {
    key: "affiliate",
    title: "Affiliate disclosure",
    seoTitle: "Affiliate disclosure",
    description:
      "Some PadelRecs links to shops earn a small commission. It costs nothing extra and never changes a score, a ranking or a review.",
    intro: [
      "Some links to shops earn a small commission. It costs you nothing extra and never changes a score, a ranking or a review.",
    ],
    sections: [
      {
        title: "What an affiliate link is",
        body: [
          "A link to a shop that tells the shop you came from PadelRecs. If you buy something, the shop pays a small commission.",
        ],
      },
      {
        title: "Which links are affiliate links",
        body: [
          'Only "check price" links that go to shops, including Amazon. Links to Reddit, YouTube, blogs and other pages on PadelRecs are never affiliate links.',
        ],
      },
      {
        title: "What it never changes",
        body: [
          "Scores, rankings and reviews come only from players. A racket that earns more does not rank higher, and brands cannot pay to be listed.",
        ],
      },
      {
        title: "Where the money goes",
        body: [
          "It pays for hosting and the time spent reading and summarising reviews. It keeps the site free and ad-light.",
        ],
      },
      {
        title: "Questions",
        body: ["If something looks off, or you think a link is not marked clearly, get in touch."],
      },
    ],
    extra: {
      // Affiliate Thread.dc.html: boxed statement under the TL;DR. Legal text, keep word for word.
      amazon: {
        title: "Amazon Associates Program",
        body: "PadelRecs is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, PadelRecs earns from qualifying purchases.",
      },
      // Affiliate Thread.dc.html: link under the "Questions" section.
      sectionLinks: {
        Questions: { label: "Contact PadelRecs", to: "contact" },
      },
    },
  },
  {
    key: "contact",
    title: "Contact",
    seoTitle: "Contact",
    description:
      "Contact PadelRecs about a mistake, a racket to add or a question. A real person reads every message, usually within a few days.",
    intro: [
      "Questions, mistakes or a racket you want added? Send a message. A real person reads every one, usually within a few days.",
    ],
    sections: [],
    extra: {
      // Contact Thread.dc.html: form copy.
      topicsLabel: "What is it about?",
      topics: [
        { label: "Fix a mistake", placeholder: "Which page, and what looks wrong?" },
        { label: "Add a racket", placeholder: "Which racket, and where can it be bought?" },
        { label: "Question", placeholder: "What would you like to know?" },
        // Rendered mock placeholder kept (see top comment).
        { label: "Something else", placeholder: "Write anything." },
      ],
      emailLabel: "Your email",
      emailPlaceholder: "you@example.com",
      messageLabel: "Message",
      sendLabel: "Send message",
      // {contactLink} replaces the mock email address.
      directLine: "Or email {contactLink} directly.",
      sent: {
        title: "Thanks, message sent.",
        body: "A real person will read it and reply by email, usually within a few days.",
      },
      sendAnotherLabel: "Send another",
    },
  },
];

/** The running site's guides, "More guides" labels and info pages (PickleballRecs: lib/thread/copy-pickleball.ts). */
export const GUIDES: GuideCopy[] = PICKLEBALL ? PB_GUIDES : SKIN ? SKIN_GUIDES : DG ? DG_GUIDES : AUDIO ? AUDIO_GUIDES : SR ? SR_GUIDES : PADEL_GUIDES;
export const GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = PICKLEBALL ? PB_GUIDE_LINK_LABELS : SKIN ? SKIN_GUIDE_LINK_LABELS
  : DG ? DG_GUIDE_LINK_LABELS : AUDIO ? AUDIO_GUIDE_LINK_LABELS : SR ? SR_GUIDE_LINK_LABELS : PADEL_GUIDE_LINK_LABELS;
export const INFO: InfoCopy[] = PICKLEBALL ? pickleballInfo(PADEL_INFO) : SKIN ? skinInfo(PADEL_INFO) : DG ? discgolfInfo(PADEL_INFO) : AUDIO ? audioInfo(PADEL_INFO) : SR ? simracingInfo(PADEL_INFO) : PADEL_INFO;
/** Padel's own copy, for tests. */
export const PADEL_COPY = { GUIDES: PADEL_GUIDES, GUIDE_LINK_LABELS: PADEL_GUIDE_LINK_LABELS, INFO: PADEL_INFO };
