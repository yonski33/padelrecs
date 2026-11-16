import type { Metadata } from "next";
import { niche, catalogPath } from "../lib/niche";
export const metadata: Metadata = { title: "Page not found", robots: { index: false } };
import { V2Footer } from "./v2-footer";
// The soft look (SkinRecs): a calm, centred page in the v2 frame; other sites keep theirs.
export default function NotFound(){if(niche.v2copy?.look==="soft")return <><main className="sk-nf"><h1>We couldn&apos;t find that page</h1><p>{niche.copy.notFound}</p><p><a className="button" href={catalogPath}>{`Browse all ${niche.words.many}`}</a><a className="alt" href="/">or find your match on the home page →</a></p></main><V2Footer/></>;
 return <main className="narrow prose"><h1>Out of bounds</h1><p>{niche.copy.notFound}</p><p><a className="button" href={catalogPath}>{`Browse ${niche.words.many}`}</a></p></main>}
