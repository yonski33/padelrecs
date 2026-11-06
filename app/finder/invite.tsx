import { niche } from "../../lib/niche";

/** A quiet link to the quiz for visitors still deciding. Renders nothing on sites without a finder. */
export function FinderInvite() {
  if (!niche.finder) return null;
  return <a className="finder-invite" href="/finder">
    <span>{niche.finder.invite}</span>
    <b>Take the 1-minute quiz <span aria-hidden="true">→</span></b>
  </a>;
}
