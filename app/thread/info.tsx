// The Thread info pages (About, How the score works, Affiliate disclosure, Contact): title, light lime intro, numbered sections
// and the "More about PadelRecs" sidebar. Copy: lib/thread/copy.ts (no we/us, no em dashes, no prices).
import type { ReactNode } from "react";
import { Shell } from "./shell";
import { INFO, INFO_UI, type InfoCopy } from "../../lib/thread/copy";
import { SideBox, LinkList, NarrowLinks } from "./ui";
import { th } from "../../lib/thread/look";
import { amazonLinksOn } from "../../lib/amazon-offer";
import { niche } from "../../lib/niche";
import { infoV3 } from "../../lib/thread/info-v3";

const HREF: Record<InfoCopy["key"], string> = { about: "/about", score: "/how-we-make-these", affiliate: "/affiliate-disclosure", contact: "/contact" };
const MORE = INFO.map((x, i) => ({ label: INFO_UI.moreLinks[i] ?? x.title, href: HREF[x.key] }));
const more = () => MORE.filter(l => l.href !== "/affiliate-disclosure" || amazonLinksOn());
/** "{contactLink}" in the copy becomes a link to the contact form (no address is shown). */
const withLink = (t: string): ReactNode => t.includes("{contactLink}")
  ? <>{t.split("{contactLink}")[0].replace(/Email $/, "Write through ")}<a href={th("/contact")}>the contact form</a>{t.split("{contactLink}")[1]}</> : t;

export const infoCopy = (key: InfoCopy["key"]) => INFO.find(x => x.key === key)!;

export function InfoPage({ k, children }: { k: InfoCopy["key"]; children?: ReactNode }) {
  // PadelRecs v3 (owner design 2026-11-21): About, Affiliate and Contact. "How the score works" keeps this layout for now.
  if (niche.id === "padel" && k !== "score") return <InfoPageV3 k={k}>{children}</InfoPageV3>;
  const c = infoCopy(k), extra = (c.extra ?? {}) as { sectionLinks?: Record<string, { label: string; to: InfoCopy["key"] }>; sayHi?: { title: string; body: string }; amazon?: { title: string; body: string } };
  return <Shell>
    <main className="th-main">
      <div className="th-col">
        <article className="th-card th-hero">
          <h1 className="th-h1">{c.title}</h1>
          <div className="th-intro">{c.intro.map(p => <p key={p}>{withLink(p)}</p>)}</div>
          {extra.amazon && <div className="th-fit"><b>{extra.amazon.title}</b><p className="th-note" style={{ fontSize: 14.5 }}>{extra.amazon.body}</p></div>}
        </article>
        {c.sections.length > 0 && <section className="th-card th-steps">
          {c.sections.map((s, i) => { const link = extra.sectionLinks?.[s.title]; return <div key={s.title} id={`s-${i + 1}`} className="th-step">
            <span className="th-num">{i + 1}</span>
            <div><h3>{s.title}</h3>
              {s.body.some(b => b.startsWith("• ")) ? <ul>{s.body.map(b => <li key={b}>{withLink(b.replace(/^• /, ""))}</li>)}</ul> : s.body.map(b => <p key={b}>{withLink(b)}</p>)}
              {link && k !== "score" && <a className="th-link-b" href={th(HREF[link.to])}>{link.label}</a>}
            </div>
          </div>; })}
        </section>}
        {extra.sayHi && <section className="th-card th-sec"><h2 className="th-h3">{extra.sayHi.title}</h2><p className="th-lead">{withLink(extra.sayHi.body)}</p></section>}
        {children}
        <NarrowLinks title={INFO_UI.moreAbout} links={more()} current={HREF[k]}/>
      </div>
      <aside className="th-side"><SideBox title={INFO_UI.moreAbout}><LinkList links={more()} current={HREF[k]}/></SideBox></aside>
    </main>
  </Shell>;
}

/** PadelRecs info pages v3 (design_handoff_padelrecs_v3: About v3, Affiliate v3, Contact v3): a title card, then one reading
 *  card with plain H2 sections (today's copy, the score lines reworded: lib/thread/info-v3.ts), any form in its own card, and
 *  the "More about PadelRecs" links as a row of pills (the mock has no sidebar). */
function InfoPageV3({ k, children }: { k: InfoCopy["key"]; children?: ReactNode }) {
  const c = infoV3(infoCopy(k)), extra = (c.extra ?? {}) as { sectionLinks?: Record<string, { label: string; to: InfoCopy["key"] }>; sayHi?: { title: string; body: string }; amazon?: { title: string; body: string } };
  const body = (b: string[]) => b.some(x => x.startsWith("• ")) ? <ul>{b.map(x => <li key={x}>{withLink(x.replace(/^• /, ""))}</li>)}</ul> : b.map(x => <p key={x}>{withLink(x)}</p>);
  return <Shell>
    <main className="th-main thi3">
      <section className="th-card thi3-title"><h1 className="th-h1">{c.title}</h1>{c.intro.map(p => <p key={p}>{withLink(p)}</p>)}</section>
      {(c.sections.length > 0 || extra.amazon || extra.sayHi) && <article className="th-card thi3-read">
        {c.sections.map(s => { const link = extra.sectionLinks?.[s.title];
          return <section key={s.title}><h2>{s.title}</h2>{body(s.body)}{link && <a className="thi3-more" href={th(HREF[link.to])}>{link.label}</a>}</section>; })}
        {extra.amazon && <aside className="thi3-note"><b>{extra.amazon.title}</b><p>{extra.amazon.body}</p></aside>}
        {extra.sayHi && <section><h2>{extra.sayHi.title}</h2><p>{withLink(extra.sayHi.body)}</p></section>}
      </article>}
      {children}
      <nav className="thi3-links" aria-label={INFO_UI.moreAbout}><span>{INFO_UI.moreAbout}</span>
        {more().filter(l => l.href !== HREF[k]).map(l => <a key={l.href} href={th(l.href)}>{l.label}</a>)}</nav>
    </main>
  </Shell>;
}
