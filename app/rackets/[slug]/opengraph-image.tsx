import { catalog, score } from "../../../db/data";
import { racketParts } from "../../components";
import { ogCard, ogSize } from "../../og-card";

export const alt = "Padel racket player reviews on PadelRecs";
export const size = ogSize;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, data] = await Promise.all([params, catalog()]);
  const racket = data.rackets.find(r => r.slug === slug);
  if (!racket) return ogCard({ eyebrow: "PadelRecs", title: "Padel racket reviews", detail: "Real player experiences" });
  const { brand, model } = racketParts(racket, data);
  const s = score(data, racket.id);
  const notes = data.reviews.filter(r => r.racketId === racket.id).length + data.external.filter(e => e.racketId === racket.id).length;
  const detail = s.average
    ? `${s.count} player ${s.count === 1 ? "rating" : "ratings"} · ${notes} ${notes === 1 ? "note" : "notes"}`
    : notes ? `${notes} ${notes === 1 ? "note" : "notes"} from around the web` : "Be the first to review it";
  return ogCard({ eyebrow: brand || "Padel racket", title: model, rating: s.average ? Number(s.average) : null, detail });
}
