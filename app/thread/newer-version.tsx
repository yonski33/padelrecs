// "Newer version: X" on an older laptop's page (owner 2026-11-24): a quiet link to the newest model of the same line
// (lib/thread/laptop-lines.ts). Older models keep their pages; nothing shows on the newest one or on other sites.
import { threadRows, laptopOf } from "./data";
import { th } from "../../lib/thread/look";

export async function NewerVersion({ slug, className = "th-newer" }: { slug: string; className?: string }) {
  const { ctx, bySlug } = await threadRows();
  const to = ctx ? laptopOf(ctx)?.newer.get(slug) : undefined, r = to ? bySlug.get(to) : undefined;
  if (!r) return null;
  return <p className={className}>{"Newer version: "}<a href={th(r.href)}>{r.name}</a></p>;
}
