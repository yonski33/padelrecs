// /questions (PadelRecs, owner OK 2026-11-21): "Questions from the community", every racket page's questions in one place,
// with the ask box and instant filters. Thread only, on lib/thread/sites.ts postTypeSite (PadelRecs, SkinRecs).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../shell";
import { niche } from "../../../lib/niche";
import { postTypeSite } from "../../../lib/thread/sites";
import { W } from "../../../lib/thread/words";
import { threadQuestions } from "../questions-data";
import { askRackets } from "../latest-questions";
import { AskQuestion } from "../live/ask-question";
import { QuestionList } from "../live/question-list";

export const revalidate = 3600;
/** What the questions are about, in the site's words (SkinRecs: "skincare", v3 rollout 2026-11-21). */
const ABOUT: Record<string, string> = { padel: "padel rackets", skin: "skincare" };
const TITLE = "Questions from the community", INTRO = `Anyone can ask, ${W.people} answer. Questions about ${ABOUT[niche.id] ?? niche.words.many} from every ${W.item} page.`;
export const metadata: Metadata = { title: { absolute: `${TITLE} | ${niche.site.name}` }, description: INTRO, alternates: { canonical: "/questions" },
  openGraph: { title: TITLE, description: INTRO, url: "/questions", type: "website" } };

export default async function ThreadQuestions() {
  if (!postTypeSite(niche.id)) notFound();
  const [qs, rackets] = await Promise.all([threadQuestions(), askRackets()]);
  return <Shell>
    <main className="th-main thq-page">
      <div className="thq-hero"><h1 className="th-h1">{TITLE}</h1><p className="th-sub">{INTRO}</p></div>
      <section className="th-card thq-sec"><AskQuestion rackets={rackets}/><QuestionList qs={qs} now={Date.now()}/></section>
    </main>
  </Shell>;
}
