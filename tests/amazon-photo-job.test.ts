import { test } from "node:test";
import assert from "node:assert/strict";
import { getTableName } from "drizzle-orm";
import { refreshAmazonPhotos } from "../lib/amazon-photo-job";
import { resetAmazonToken } from "../lib/amazon";

const credentials = { id: "id", secret: "secret", partnerTag: "skinrecs-20" }, settings = { searchIndex: "Beauty" };
const now = Date.parse("2026-11-05T12:00:00Z"), hoursAgo = (n: number) => new Date(now - n * 3_600_000).toISOString();
const asin = "B00TTD9BRC", other = "B01N7T7JKJ";

/** Just enough of the database: each table's rows, and every update in order. */
function fakeDb(products: object[]) {
  const updates: Record<string, unknown>[] = [];
  const rows: Record<string, object[]> = { brands: [{ id: 1, name: "CeraVe" }], rackets: products, reviews: [{ id: 1 }, { id: 2 }], external_reviews: [] };
  const db = {
    select: () => ({ from: (table: never) => { const found = Promise.resolve(rows[getTableName(table)] ?? []); return Object.assign(found, { where: () => found }); } }),
    update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => { updates.push(values); } }) }),
  };
  return { db: db as never, updates };
}

function fakeAmazon(handle: (path: string, body: { itemIds?: string[] }) => Response) {
  const calls: string[] = [];
  const fetcher = (async (url: string, init?: RequestInit) => {
    if (url.startsWith("https://api.amazon.com/auth/o2/token")) return Response.json({ access_token: "t", expires_in: 3600 });
    const path = new URL(url).pathname;
    calls.push(path);
    return handle(path, JSON.parse(String(init?.body)));
  }) as typeof fetch;
  return { fetcher, calls };
}
const options = (fetcher: typeof fetch) => ({ now: () => now, fetcher, sleep: async () => {} });
const imageReply = (ids: string[] = []) => Response.json({ itemsResult: { items: ids.map(id => ({ asin: id, images: { primary: { large: { url: `https://m.media-amazon.com/${id}.jpg` } } } })) } });

test("a matched product gets its ASIN and its image in the same run; a miss waits two weeks", async () => {
  resetAmazonToken();
  const { db, updates } = fakeDb([{ id: 1, name: "CeraVe Hydrating Facial Cleanser", brandId: 1, asin: null, checkedAt: null }, { id: 2, name: "Nothing Like It", brandId: 1, asin: null, checkedAt: null }]);
  const { fetcher } = fakeAmazon((path, body) => path.endsWith("getItems") ? imageReply(body.itemIds)
    : Response.json({ searchResult: { items: [{ asin, itemInfo: { title: { displayValue: "CeraVe Hydrating Facial Cleanser 16 oz" }, byLineInfo: { brand: { displayValue: "CeraVe" } } } }] } }));
  const done = await refreshAmazonPhotos(db, settings, credentials, options(fetcher));
  assert.deepEqual(done, { searched: 2, matched: 1, refreshed: 1, stopped: null });
  assert.equal(updates[0].amazonAsin, asin);
  assert.equal(updates[1].amazonAsin, null);
  assert.equal(updates[1].amazonCheckedAt, new Date(now).toISOString());
  assert.equal(updates[2].amazonImage, `https://m.media-amazon.com/${asin}.jpg`);
});

test("only links past 11 hours are refreshed, ten to a call, and nothing recent or recently missed is touched", async () => {
  resetAmazonToken();
  const stale = Array.from({ length: 12 }, (_, i) => ({ id: 1, name: `P${i}`, brandId: 1, asin, checkedAt: hoursAgo(12) }));
  const { db } = fakeDb([...stale, { id: 1, name: "Fresh", brandId: 1, asin: other, checkedAt: hoursAgo(2) }, { id: 2, name: "Missed", brandId: 1, asin: null, checkedAt: hoursAgo(24) }]);
  const { fetcher, calls } = fakeAmazon((_, body) => imageReply(body.itemIds));
  const done = await refreshAmazonPhotos(db, settings, credentials, options(fetcher));
  assert.equal(done.refreshed, 12);
  assert.equal(done.searched, 0);
  assert.equal(calls.length, 2);
});

test("an item Amazon no longer returns loses its image; throttling ends the run without throwing", async () => {
  resetAmazonToken();
  const gone = fakeDb([{ id: 1, name: "P", brandId: 1, asin, checkedAt: hoursAgo(12) }]);
  await refreshAmazonPhotos(gone.db, settings, credentials, options(fakeAmazon(() => imageReply()).fetcher));
  assert.equal(gone.updates[0].amazonImage, null);
  resetAmazonToken();
  const throttled = fakeDb([{ id: 1, name: "P", brandId: 1, asin, checkedAt: hoursAgo(12) }]);
  const done = await refreshAmazonPhotos(throttled.db, settings, credentials, options(fakeAmazon(() => new Response("{}", { status: 429 })).fetcher));
  assert.match(done.stopped ?? "", /429/);
  assert.equal(throttled.updates.length, 0);
});

test("a throttled call waits and tries again, so one 429 doesn't end the run", async () => {
  resetAmazonToken();
  const { db, updates } = fakeDb([{ id: 1, name: "P", brandId: 1, asin, checkedAt: hoursAgo(12) }]);
  let tries = 0;
  const { fetcher } = fakeAmazon((_, body) => ++tries === 1 ? new Response("{}", { status: 429 }) : imageReply(body.itemIds));
  const done = await refreshAmazonPhotos(db, settings, credentials, options(fetcher));
  assert.equal(done.stopped, null);
  assert.equal(done.refreshed, 1);
  assert.equal(tries, 2);
  assert.equal(updates[0].amazonImage, `https://m.media-amazon.com/${asin}.jpg`);
});
