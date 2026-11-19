import type { Metadata } from "next";
import { InfoPage, infoCopy } from "../info";

const c = infoCopy("affiliate");
export const metadata: Metadata = { title: { absolute: `${c.seoTitle} | PadelRecs` }, description: c.description };
export default function ThreadAffiliate() { return <InfoPage k="affiliate"/>; }
