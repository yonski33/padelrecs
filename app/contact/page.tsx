import type { Metadata } from "next";
import { niche } from "../../lib/niche";
import ContactForm from "./contact-form";
export const metadata: Metadata = { title: "Contact", description: `Get in touch with ${niche.site.name}: questions, corrections, missing ${niche.words.many} or partnerships.`, alternates: { canonical: "/contact" } };
export default function Contact(){return <main className="narrow"><ContactForm siteName={niche.site.name}/></main>}
