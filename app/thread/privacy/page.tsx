// /privacy (PadelRecs Thread): what the site keeps and how to remove it, in plain words. Written for the optional accounts
// (drizzle/0028); covers posting, the device cookie, the contact form and analytics too. No "we", no em dashes.
import type { Metadata } from "next";
import { Shell } from "../shell";
import { th } from "../../../lib/thread/look";

export const metadata: Metadata = { title: "Privacy", description: "What PadelRecs keeps when you post or sign in, and how to delete it.", alternates: { canonical: "/privacy" } };

const SECTIONS: { title: string; body: string[] }[] = [
  { title: "Posting without an account", body: [
    "A review or comment keeps the name you typed, your words, and the level and side if you gave them.",
    "A random device cookie, stored only as a keyed hash, lets one device have one vote per racket and links your earlier posts if you sign in later. A hash of your network and browser limits floods. Your IP address is never stored as it is.",
  ] },
  { title: "With an account", body: [
    "An account is optional. Signing in stores your email address with the sign-in service (Supabase Auth, hosted in Frankfurt, EU). It's used only to send sign-in links: never shown on the site, never sold, no newsletters.",
    "The site keeps your reserved name, your level and side if you set them, and which reviews and comments are yours. A sign-in cookie keeps you signed in on that browser until you sign out.",
  ] },
  { title: "Deleting your account", body: [
    "On your account page, Delete account removes your email and sign-in straight away and frees your name. Your posts stay under the name, without the member mark, unless you choose to delete them too.",
    "Can't sign in any more? Ask through {contact} and the account will be removed by hand.",
  ] },
  { title: "Contact form and analytics", body: [
    "A message sent through the contact form keeps your name and email so a person can reply.",
    "Google Analytics counts page visits on the public pages. It doesn't run on the account page.",
  ] },
];

export default function ThreadPrivacy() {
  const text = (t: string) => t.includes("{contact}") ? <>{t.split("{contact}")[0]}<a href={th("/contact")}>the contact form</a>{t.split("{contact}")[1]}</> : t;
  return <Shell>
    <main className="th-main">
      <div className="th-col">
        <article className="th-card th-hero"><h1 className="th-h1">Privacy</h1>
          <div className="th-intro"><p>What PadelRecs keeps when you post or sign in, and how to remove it.</p></div></article>
        <section className="th-card th-steps">{SECTIONS.map((s, i) => <div key={s.title} className="th-step"><span className="th-num">{i + 1}</span>
          <div><h3>{s.title}</h3>{s.body.map(b => <p key={b}>{text(b)}</p>)}</div></div>)}</section>
      </div>
    </main>
  </Shell>;
}
