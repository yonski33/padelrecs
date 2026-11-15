import type { Metadata } from "next";
import { catalog } from "../db/data";
import { isDefault, choiceHref, matchSeoTitle, type QuickChoice } from "../lib/quick-match";
import { niche, isV2, v2copy } from "../lib/niche";

const homeTitle = niche.seo.homeTitle;
/** "Real Reviews of Nail Polish, Gel Polish, Top Coats and Press-On Nails": the title without the site name, the page's H1. */
const headline = homeTitle.split(" – ").slice(1).join(" – ") || homeTitle;

/** The home's title and search snippet (app/page.tsx, and app/quick/[key] for the quick-match home): what the site covers and
 *  how big it is, short enough that Google shows it whole (~155 characters). */
export async function homeMetadata(choice: QuickChoice, older: boolean): Promise<Metadata> {
  const data = await catalog();
  // Quick match (PadelRecs): each combination is its own indexable page, "Best control padel rackets for beginners".
  if (isV2 && niche.finder && !isDefault(choice)) {
    const title = `${matchSeoTitle(choice, `${v2copy.sport ? `${v2copy.sport} ` : ""}${niche.words.many}`)} | ${niche.site.name}`;
    const description = `${(v2copy.sport ? `${v2copy.sport} ${niche.words.many}` : niche.words.Many).replace(/^./, c => c.toUpperCase())} ranked for you from ${(data.reviews.length + data.external.length).toLocaleString("en-US")} player reports: what ${niche.people.many} say about control, power, level and arm comfort. No sponsored picks.`;
    // Only style, level and sore arm make an indexable page (24 of them, all in the sitemap). Fine-tune picks and "show older
    // models" are views of that page: canonical to it and noindex (audit 2026-11-15, #8).
    const url = choiceHref({ style: choice.style, level: choice.level, arm: choice.arm }, "");
    const extra = !!choice.fine || older;
    return { title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website" },
      ...(extra ? { robots: { index: false, follow: true } } : {}) };
  }
  const total = data.reviews.length + data.external.length;
  const short = `${headline}: ${total.toLocaleString("en-US")} reviews, ranked by what people actually say.`;
  const description = short.length <= 160 ? short : niche.seo.homeDescription;
  return { title: { absolute: homeTitle }, description, alternates: { canonical: "/" }, openGraph: { title: homeTitle, description, url: "/", type: "website" } };
}
