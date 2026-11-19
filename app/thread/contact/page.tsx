import { InfoPage, infoCopy } from "../info";
import { ContactForm } from "../live/contact";

const c = infoCopy("contact");
const x = (c.extra ?? {}) as { topicsLabel: string; topics: { label: string; placeholder: string }[]; emailLabel: string; emailPlaceholder: string; messageLabel: string; sendLabel: string; sent: { title: string; body: string }; sendAnotherLabel: string };
// The live page's metadata (title, description, canonical).
export { metadata } from "../../contact/page";
export default function ThreadContact() {
  return <InfoPage k="contact"><section className="th-card th-sec">
    <ContactForm topics={x.topics} labels={{ topics: x.topicsLabel, email: x.emailLabel, emailPh: x.emailPlaceholder, message: x.messageLabel, send: x.sendLabel, sentTitle: x.sent.title, sentBody: x.sent.body, again: x.sendAnotherLabel }}/>
  </section></InfoPage>;
}
