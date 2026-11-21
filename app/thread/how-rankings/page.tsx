// PadelRecs "How rankings work" (How Rankings Work v3 mock, owner handoff 2026-11-21), served at /how-rankings-work
// (lib/thread/look.ts). Padel only: other sites have no such address and 404 here.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../shell";
import { HowV3 } from "../rankings/hub-v3";
import { niche } from "../../../lib/niche";
import { HOW_INTRO, AUDIO_HOW, SKIN_HOW } from "../../../lib/thread/rankings-hub";
import { v3Site } from "../../../lib/thread/sites";

export const revalidate = 21600;
export const metadata: Metadata = v3Site(niche.id) ? {
  title: { absolute: `How rankings work | ${niche.site.name}` }, description: `${HOW_INTRO} How ${niche.site.name} picks and orders its ${niche.id === "audio" ? "headphone" : niche.id === "skin" ? "skincare" : "padel racket"} rankings.`,
  alternates: { canonical: "/how-rankings-work" },
} : { robots: { index: false } };

export default function HowRankings() {
  if (!v3Site(niche.id)) notFound();
  return <Shell active="rankings"><HowV3 {...(niche.id === "audio" ? { how: AUDIO_HOW } : niche.id === "skin" ? { how: SKIN_HOW } : {})}/></Shell>;
}
