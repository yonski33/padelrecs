import type { Metadata } from "next";
import { niche, isV2, mockLook } from "../../lib/niche";
import { attrProfileFor } from "../../lib/attr-profile";
import ContactForm from "./contact-form";
import ContactV2 from "./contact-v2";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
export const metadata: Metadata = { title: "Contact", description: `Get in touch with ${niche.site.name}: questions, corrections, missing ${niche.words.many} or partnerships.`, alternates: { canonical: "/contact" } };
export default async function Contact({ searchParams }: { searchParams: Promise<{ look?: string }> }){
 // SkinRecs: the owner's beauty design (app/skin/contact-page.tsx), loaded only there.
 if(attrProfileFor(niche)&&isV2&&(await searchParams).look!=="classic"){const{default:ContactPage}=await import("../skin/contact-page");return <ContactPage/>;}
 if((niche.id==="padel"||mockLook)&&(await searchParams).look!=="classic")return <main className={`pg2 ${qtFontVars}`}><div className="pg2-wrap contact"><ContactV2/></div><V2Footer/></main>;
 return <main className="narrow"><ContactForm siteName={niche.site.name}/></main>}
