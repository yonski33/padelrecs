// Add a review in the Thread look (owner 2026-11-20): the live page's fields and API (app/add-review/add-v2.tsx), in each
// site's Thread tokens. ?racket= and ?from= pick the product, as on the live page (proxy.ts keeps the query here); ?classic=1
// (a product that isn't listed yet) keeps the live full form.
import { Shell } from "../shell";
import { catalog } from "../../../db/data";
import { addV2Props, type AddV2Props } from "../../add-review/v2-props";
import { ThreadAddReview } from "../live/add-review";
import { niche } from "../../../lib/niche";
export { metadata } from "../../add-review/page";
export const dynamic = "force-dynamic";

/** DiscGolfRecs' own words for the form (it has no v2 rating words, so the live form falls back to padel's): its five rating
 *  categories (lib/niche/discgolf.ts), its throws by name ("right-hand backhand", not "rhbh side") and disc prompts. */
const DG_WORDS: Record<string, readonly [string, string]> = {
  powerRating: ["short", "huge"], controlRating: ["all over", "on the line"], forgivenessRating: ["punishing", "very forgiving"],
  comfortRating: ["slippery", "great grip"], maneuverabilityRating: ["one shot", "every shot"],
};
function discgolf(p: AddV2Props): AddV2Props {
  const throws = niche.profile.playingSide?.options ?? [];
  return { ...p, traits: niche.categories.map(c => [c.label, c.column, ...(DG_WORDS[c.column] ?? ["poor", "great"])] as const),
    sides: throws.map(o => ({ value: o.value, label: (o as { hint?: string }).hint ?? o.value })),
    prompts: ["what surprised you", "what you threw before", "the plastic and weight", "who should skip it"],
    labels: { level: "my level", side: "I throw", how: "How does it fly?", who: "" } };
}

export default async function ThreadAddReviewPage({ searchParams }: { searchParams: Promise<{ racket?: string; from?: string }> }) {
  const [data, { racket, from }] = await Promise.all([catalog(), searchParams]);
  const props = addV2Props(data, racket, from);
  return <Shell>
    <main className="th-main"><div className="th-col"><ThreadAddReview {...(niche.id === "discgolf" ? discgolf(props) : props)}/></div></main>
  </Shell>;
}
