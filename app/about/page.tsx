import { Fragment } from "react";
import type { Metadata } from "next";
import { niche } from "../../lib/niche";
export const metadata: Metadata = { ...niche.seo.about, alternates: { canonical: "/about" } };
const { heading, paragraphs, sections } = niche.copy.about;
export default function About(){return <main className="narrow prose"><p className="eyebrow">About the project</p><h1>{heading}</h1>{paragraphs.map(p=><p key={p}>{p}</p>)}{sections.map(s=><Fragment key={s.heading}><h2>{s.heading}</h2><p>{s.body}</p></Fragment>)}<p><a href="/add-review">Add a review →</a></p></main>}
