import type { Metadata } from "next";
import { niche, catalogPath } from "../lib/niche";
export const metadata: Metadata = { title: "Page not found", robots: { index: false } };
export default function NotFound(){return <main className="narrow prose"><h1>Out of bounds</h1><p>{niche.copy.notFound}</p><p><a className="button" href={catalogPath}>{`Browse ${niche.words.many}`}</a></p></main>}
