import { test } from "node:test";
import assert from "node:assert/strict";
import { publicCatalogItems } from "../db/data";

const brands = [{ id: "nox" }, { id: "newbrand" }, { id: "empty" }];
const rackets = [
  { id: "catalog", brandId: "nox", createdAt: "2026-10-01T00:00:00Z" },
  { id: "submitted", brandId: "newbrand", createdAt: "2026-10-17T10:00:00Z" },
  { id: "approved-later", brandId: "nox", createdAt: "2026-10-16T09:00:00Z" },
  { id: "quoted", brandId: "nox", createdAt: "2026-10-15T08:00:00Z" },
];

test("rackets created by a pending or rejected submission stay hidden, with their brand", () => {
  const unapproved = [
    { racketId: "submitted", createdAt: "2026-10-17T10:00:00Z" },
    { racketId: "approved-later", createdAt: "2026-10-16T09:00:00Z" },
    { racketId: "quoted", createdAt: "2026-10-15T08:00:00Z" },
  ];
  const visible = publicCatalogItems(brands, rackets, ["approved-later"], ["quoted"], unapproved);
  assert.deepEqual(visible.rackets.map(r => r.id), ["catalog", "approved-later", "quoted"]);
  assert.deepEqual(visible.brands.map(b => b.id), ["nox", "empty"]);
});

test("an existing catalog racket with only a pending review stays visible", () => {
  const visible = publicCatalogItems(brands, rackets, [], [], [{ racketId: "catalog", createdAt: "2026-10-17T12:00:00Z" }]);
  assert(visible.rackets.some(r => r.id === "catalog"));
});

test("approving the first review publishes the submitted racket", () => {
  const visible = publicCatalogItems(brands, rackets, ["submitted"], [], []);
  assert(visible.rackets.some(r => r.id === "submitted"));
  assert(visible.brands.some(b => b.id === "newbrand"));
});
