import type { Metadata } from "next";
import { InfoPage, infoCopy } from "../info";

const c = infoCopy("about");
export const metadata: Metadata = { title: { absolute: `${c.seoTitle} | PadelRecs` }, description: c.description };
export default function ThreadAbout() { return <InfoPage k="about"/>; }
