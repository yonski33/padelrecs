import type { Metadata } from "next";
import { InfoPage, infoCopy } from "../info";

const c = infoCopy("score");
export const metadata: Metadata = { title: { absolute: `${c.seoTitle} | PadelRecs` }, description: c.description };
export default function ThreadScore() { return <InfoPage k="score"/>; }
