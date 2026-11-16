// Run with NICHE=<id> (tests/isr-routes.test.ts): prints where proxy.ts sends the site's key addresses, as JSON.
import { NextRequest } from "next/server";
import { proxy, skinView } from "../../proxy";
import { niche, catalogPath } from "../../lib/niche";
import { attrProfileFor } from "../../lib/attr-profile";
import { withModelYears } from "../../lib/top-lists";

const list = withModelYears(niche.topLists ?? [])[0]?.slug;
const type = niche.typePages?.[0]?.slug;
const paths: Record<string, string> = {
  home: "/", catalog: catalogPath, ...(list ? { ranking: `/rankings/${list}` } : {}),
  product: niche.categoryPaths && type ? `/${type}/some-product` : `${catalogPath}/some-product`,
};
const out: Record<string, string | null> = {};
for (const [name, path] of Object.entries(paths)) {
  const req = new NextRequest(new URL(path, `https://www.${niche.site.domain}`));
  // SkinRecs' product addresses would look the product up in the database first (productMove); its views are skinView's.
  const res = attrProfileFor(niche) ? skinView(req) : await proxy(req);
  const to = res?.headers.get("x-middleware-rewrite");
  out[name] = to ? new URL(to).pathname : null;
}
console.log(JSON.stringify(out));
