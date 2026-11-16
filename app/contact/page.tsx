import type { Metadata } from "next";
import { niche, isV2 } from "../../lib/niche";
import ContactForm from "./contact-form";
import ContactV2 from "./contact-v2";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
export const metadata: Metadata = { title: "Contact", description: `Get in touch with ${niche.site.name}: questions, corrections, missing ${niche.words.many} or partnerships.`, alternates: { canonical: "/contact" } };
export default async function Contact({ searchParams }: { searchParams: Promise<{ look?: string }> }){
 if(isV2&&(await searchParams).look!=="classic")return <main className={`pg2 ${qtFontVars}`}><div className="pg2-wrap contact"><ContactV2/></div><V2Footer/></main>;
 return <main className="narrow"><ContactForm siteName={niche.site.name}/></main>}
