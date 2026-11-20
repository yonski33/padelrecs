// Add a review in the Thread look (owner 2026-11-20): the live page's fields and API (app/add-review/add-v2.tsx), in each
// site's Thread tokens. ?racket= and ?from= pick the product, as on the live page (proxy.ts keeps the query here); ?classic=1
// (a product that isn't listed yet) keeps the live full form.
import { Shell } from "../shell";
import { catalog } from "../../../db/data";
import { addV2Props } from "../../add-review/v2-props";
import { ThreadAddReview } from "../live/add-review";
export { metadata } from "../../add-review/page";
export const dynamic = "force-dynamic";

export default async function ThreadAddReviewPage({ searchParams }: { searchParams: Promise<{ racket?: string; from?: string }> }) {
  const [data, { racket, from }] = await Promise.all([catalog(), searchParams]);
  return <Shell>
    <main className="th-main"><div className="th-col"><ThreadAddReview {...addV2Props(data, racket, from)}/></div></main>
  </Shell>;
}
