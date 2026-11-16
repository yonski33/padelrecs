"""Packs for the strength/acid pass: python3 build_pack.py snapshot.json ../../../db/catalogs/skin.json [size=40]
Writes packs/strength-NN.json (id, name, brand, category, maker_url). The snapshot comes from scripts/skin-snapshot.mts."""
import json, os, sys
snap = json.load(open(sys.argv[1]))
cat = json.load(open(sys.argv[2]))
size = int(sys.argv[3]) if len(sys.argv) > 3 else 40
brands = {b["id"]: b["name"] for b in cat["brands"]}
by_name = {p["name"]: p for p in cat["products"]}
rows = []
for x in snap:
    p = by_name.get(x["name"]) or {}
    rows.append({"id": x["id"], "name": x["name"], "brand": brands.get(p.get("brand"), p.get("brand")), "category": x["shape"],
                 "maker_url": (p.get("sources") or [None])[0]})
os.makedirs("packs", exist_ok=True)
for i in range(0, len(rows), size):
    n = i // size + 1
    json.dump(rows[i:i + size], open(f"packs/strength-{n:02d}.json", "w"), indent=1)
print(f"{len(rows)} products in {(len(rows) + size - 1) // size} packs")
