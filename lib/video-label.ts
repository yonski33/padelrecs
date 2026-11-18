// The label under a YouTube summary card (owner 2026-11-18): whose video we summarised and when.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Summary of Padel Coach's video, 14 Oct 2026" (owner 2026-11-18); no date stored, "Summary of Padel Coach's video". */
export function videoLabel(channel: string, date?: string | null) {
  const m = date?.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  const when = m ? [m[3] ? String(Number(m[3])) : null, MONTHS[Number(m[2]) - 1], m[1]].filter(Boolean).join(" ") : null;
  const own = /s$/i.test(channel.trim()) ? `${channel.trim()}'` : `${channel.trim()}'s`;
  return `Summary of ${own} video${when ? `, ${when}` : ""}`;
}
