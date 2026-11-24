"""Check a Grok reply: python3 validate.py packs/strength-NN.json strength-NN.out.json
Schema, every pack id answered once, enums, https sources with inci_url among them, acid ↔ acid_ingredients, rinse-off
ceiling, and disagreements with the name stand-in (lib/skin-safety.ts) listed for review. Then a 1-in-5 spot-check list:
open each inci_url and confirm first5 and the call by hand before importing."""
import json, random, re, sys
pack = json.load(open(sys.argv[1])); out = json.load(open(sys.argv[2]))
ids = [p["id"] for p in pack]; by = {p["id"]: p for p in pack}
STR = {"strong", "moderate", "gentle"}; ACID = {"none", "aha", "bha", "pha", "aha+bha", "aha+pha", "bha+pha"}
STRONG_NAME = re.compile(r"\b(retinol|retinal|retinaldehyde|retinoid|retinyl|tretinoin|adapalene|granactive)\b|aha\s*30|peeling solution|glycolic acid (7|8|9|1\d)\b|2% bha|bha liquid|liquid exfoliant|drying lotion|u\.?\s?f\.?\s?o\b|good genes", re.I)
bad, seen, notes = [], set(), []
for r in out:
    i = r.get("id")
    if i not in by: bad.append(f"unknown id {i}"); continue
    if i in seen: bad.append(f"{i}: answered twice")
    seen.add(i)
    if r.get("unsure"):
        if r.get("strength") is not None or r.get("acid") is not None: bad.append(f"{i}: unsure but has values")
        notes.append(f"UNSURE {by[i]['name']}: {r.get('note')}"); continue
    if r.get("strength") not in STR: bad.append(f"{i}: strength {r.get('strength')}")
    if r.get("acid") not in ACID: bad.append(f"{i}: acid {r.get('acid')}")
    if (r.get("acid") != "none") != bool(r.get("acid_ingredients")): bad.append(f"{i}: acid vs acid_ingredients")
    src = r.get("sources") or []
    if not src or any(not str(u).startswith("https://") for u in src) or r.get("inci_url") not in src: bad.append(f"{i}: sources/inci_url")
    # A product with fewer than 5 ingredients in all lists them all (say so in note).
    if not isinstance(r.get("first5"), list) or not 1 <= len(r["first5"]) <= 5 or (len(r["first5"]) < 5 and not r.get("note")): bad.append(f"{i}: first5")
    if not r.get("reason"): bad.append(f"{i}: no reason")
    if r.get("leave_on") is False and r.get("strength") == "strong" and not re.search(r"benzoyl|salicylic", " ".join(r.get("acid_ingredients", [])) + r.get("reason", ""), re.I):
        bad.append(f"{i}: rinse-off rated strong")
    standin = bool(STRONG_NAME.search(by[i]["name"])) or by[i]["category"] == "Exfoliant"
    if standin != (r.get("strength") == "strong"): notes.append(f"DIFFERS from name rule: {by[i]['name']} → {r.get('strength')} ({r.get('reason')})")
missing = [i for i in ids if i not in seen]
if missing: bad.append(f"missing {len(missing)}: {', '.join(missing[:5])}…")
print("\n".join(notes))
print(f"{len(bad)} problems" + (":\n  " + "\n  ".join(bad) if bad else ""))
answered = [r for r in out if r.get("id") in by and not r.get("unsure")]
random.seed(sys.argv[2]); spot = random.sample(answered, max(1, len(answered) // 5)) if answered else []
print("\nSpot-check (1 in 5): open the INCI page and confirm first5 and the call:")
for r in spot: print(f"  {by[r['id']]['name']}: {r['strength']} / {r['acid']} — {r['inci_url']}")
sys.exit(1 if bad else 0)
