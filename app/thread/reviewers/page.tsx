// The creators index (owner 2026-11-27), served for /creators: every creator with a page (5+ live reviews), most reviews
// first, with their platform, subscribers, review count and takes bar. No scores.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../shell";
import { JsonLd, crumbs } from "../seo";
import { th } from "../../../lib/thread/look";
import { niche } from "../../../lib/niche";
import { REVIEWER_MIN, subsShort } from "../../../lib/thread/reviewers";
import { reviewerPagesOn } from "../../../lib/thread/sites";
import { reviewersData, profileOf } from "../reviewers-data";
import { Avatar } from "../live/creator-reviews";
import "./reviewers.css";

export const revalidate = 21600;
const PLATFORM = { youtube: "YouTube", blog: "Blog", tiktok: "TikTok" } as const;
const LEAD = `The YouTubers, bloggers and TikTokers whose ${niche.words.one} reviews ${niche.site.name} sums up, with what each one loved and how often they agree with the others.`;
export const metadata: Metadata = { title: { absolute: `${niche.words.One} reviewers and creators | ${niche.site.name}` }, description: LEAD, alternates: { canonical: "/creators" } };

export default async function ReviewersIndex() {
  if (!reviewerPagesOn(niche.id)) notFound();
  const { list } = await reviewersData();
  return <Shell active="creators">
    <JsonLd data={{ "@context": "https://schema.org", "@graph": [crumbs([{ name: "Creators", path: "/creators" }])] }}/>
    <main className="th-main rvp">
      <section className="rvp-ix-h"><h1>Creators</h1><p>{LEAD}</p><small>{`${list.length} creators with ${REVIEWER_MIN} or more reviews.`}</small></section>
      <div className="rvp-ix">{list.map(r => { const subs = r.kind === "youtube" ? subsShort(profileOf(r.slug)?.subs) : null;
        return <a key={r.slug} className="rvp-ix-c" href={th(`/creators/${r.slug}`)}>
          <Avatar name={r.name} kind={r.kind} src={profileOf(r.slug)?.avatar ?? null}/>
          <span className="b"><strong>{r.name}</strong>
            <span className="m">{[PLATFORM[r.kind], subs ? `${subs} subscribers` : null, `${r.n} reviews`].filter(Boolean).join(" · ")}</span>
            <span className="rvp-bar sm" aria-hidden="true"><i className="p" style={{ flex: r.pos }}/><i className="m" style={{ flex: r.mix }}/><i className="n" style={{ flex: r.neg }}/></span>
            <span className="t">{`${r.pos} loved · ${r.mix} mixed · ${r.neg} not for them`}</span></span>
        </a>; })}</div>
    </main>
  </Shell>;
}
