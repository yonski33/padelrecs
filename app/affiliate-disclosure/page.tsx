import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche } from "../../lib/niche";
import { amazonLinksOn } from "../../lib/amazon-offer";

// Only sites showing Amazon links (amazonLinksOn: niche config plus the associate tag) have affiliate links to disclose;
// elsewhere this address is a 404.
const site = niche.site.name;
export function generateMetadata(): Metadata {
  return amazonLinksOn()
    ? { title: "Affiliate Disclosure", description: `How ${site} uses affiliate links, and what they never change.`, alternates: { canonical: "/affiliate-disclosure" } }
    : { robots: { index: false } };
}

const UPDATED = "October 25, 2026";

export default function AffiliateDisclosure() {
  if (!amazonLinksOn()) notFound();
  return <main className="narrow prose">
    <p className="eyebrow">Affiliate disclosure</p>
    <h1>How {site} makes money</h1>
    <p>{`Last updated: ${UPDATED}`}</p>
    <p>{`Some links on ${site} are affiliate links. If you follow one and buy something, ${site} may earn a small commission. You pay the same price either way.`}</p>

    <h2>How it works</h2>
    <p>{`Each ${niche.words.one} page has a "View price on Amazon" button, and each ranking list has a "See on Amazon" link under every ${niche.words.one}. They go to that ${niche.words.one} on Amazon when we can find it there, or to an Amazon search for its name when we can't. Those links carry our Amazon Associates tag, so Amazon can tell the visit came from ${site}. Commissions help pay for hosting and for keeping the catalog up to date.`}</p>

    <h2>What affiliate links never change</h2>
    <p>{`Ratings come only from ${niche.people.one} reviews, and quotes from around the web are kept separate from them. Rankings are worked out from those reviews. No brand or retailer pays to be listed, rated or ranked, and every ${niche.words.one} gets the same Amazon button whether its reviews are glowing or harsh.`}</p>

    <h2>Amazon Associates Program</h2>
    <p>{`${site} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, ${site} earns from qualifying purchases.`}</p>

    <h2>Questions</h2>
    <p>{`${site} only links to retailers; it doesn't sell anything or show prices, and we don't control Amazon's pages, prices or policies. Read more about the project on the `}<a href="/about">About page</a>.</p>
  </main>;
}
