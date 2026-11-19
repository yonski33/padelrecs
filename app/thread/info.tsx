// The Thread info pages (About, How the score works, Affiliate disclosure, Contact): title, light lime intro, numbered sections
// and the "More about PadelRecs" sidebar. Copy: lib/thread/copy.ts (no we/us, no em dashes, no prices).
import type { ReactNode } from "react";
import { Shell } from "./shell";
import { INFO, INFO_UI, type InfoCopy } from "../../lib/thread/copy";
import { SideBox, LinkList, NarrowLinks } from "./ui";
import { th } from "../../lib/thread/look";
import { amazonLinksOn } from "../../lib/amazon-offer";

const HREF: Record<InfoCopy["key"], string> = { about: "/about", score: "/how-we-make-these", affiliate: "/affiliate-disclosure", contact: "/contact" };
const MORE = INFO.map((x, i) => ({ label: INFO_UI.moreLinks[i] ?? x.title, href: HREF[x.key] }));
const more = () => MORE.filter(l => l.href !== "/affiliate-disclosure" || amazonLinksOn());
/** "{contactLink}" in the copy becomes a link to the contact form (no address is shown). */
const withLink = (t: string): ReactNode => t.includes("{contactLink}")
  ? <>{t.split("{contactLink}")[0].replace(/Email $/, "Write through ")}<a href={th("/contact")}>the contact form</a>{t.split("{contactLink}")[1]}</> : t;

export const infoCopy = (key: InfoCopy["key"]) => INFO.find(x => x.key === key)!;

export function InfoPage({ k, children }: { k: InfoCopy["key"]; children?: ReactNode }) {
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
