import { Fragment } from "react";
import type { Metadata } from "next";
import { niche } from "../../lib/niche";
import { MIN_SIGNAL_REVIEWS } from "../../lib/signal";
export const metadata: Metadata = { ...niche.seo.about, alternates: { canonical: "/about" } };
const { heading, paragraphs, sections } = niche.copy.about;
export default function About(){return <main className="narrow prose"><p className="eyebrow">About the project</p><h1>{heading}</h1>{paragraphs.map(p=><p key={p}>{p}</p>)}{sections.map(s=><Fragment key={s.heading}><h2>{s.heading}</h2><p>{s.body}</p></Fragment>)}
{/* The signal score explained once for every site (owner, 2026-11-12), right after how rankings are counted. */}
<h2>The signal score</h2><p>{`Every ${niche.words.one} with at least ${MIN_SIGNAL_REVIEWS} reviews gets a signal score out of 100. Negative and mixed reviews take points off, and with only a few reviews the score stays modest until more people weigh in, so a handful of glowing reviews can't beat a product many people like. Rankings follow it, and it moves as new reviews come in.`}</p><p><a href="/add-review">Add a review →</a></p></main>}
