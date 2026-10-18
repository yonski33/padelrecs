import { ogCard, ogSize } from "./og-card";

export const alt = "PadelRecs – real player reviews of padel rackets";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ eyebrow: "Player notes on padel rackets", title: "Real player reviews of padel rackets", detail: "From players, Reddit, YouTube, shops and forums" });
}
