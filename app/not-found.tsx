import type { Metadata } from "next";
import { niche, catalogPath } from "../lib/niche";
import { PadelNotFound } from "./thread/not-found-v3";
export const metadata: Metadata = { title: "Page not found", robots: { index: false } };
// PadelRecs: the v3 404 in the Thread look (owner design 2026-11-21); every other site keeps this one.
export default function NotFound(){if(niche.id==="padel")return <PadelNotFound/>;return <main className="narrow prose"><h1>Out of bounds</h1><p>{niche.copy.notFound}</p><p><a className="button" href={catalogPath}>{`Browse ${niche.words.many}`}</a></p></main>}
