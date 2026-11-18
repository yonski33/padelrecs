# CoffeeRecs: Grok's maker spec check (coffeerecs-data-check.md + the 5 *_checked.csv, 2026-11-18) into
#   db/specs/coffee.json                 structured facts per product slug (the match engine's filters, the spec chips)
#   db/fixes/coffee-2026-11-18.json      visible-column corrections for scripts/coffee-data-fix.mts (dry run first)
#   db/fixes/coffee-2026-11-18-checks.json  items left for the owner to decide
# Usage: python3 scripts/grok-coffee/build_specs.py "<grok results dir>" .local/catalog.json
# The catalogue dump gives name → slug (NICHE=coffee). Grok's correct_value columns win; "unknown" stays null.
import csv, json, re, sys
src, catf = sys.argv[1], sys.argv[2]
cat = {c["name"]: c for c in json.load(open(catf))}
rows = lambda f: list(csv.DictReader(open(f"{src}/{f}")))
yes = lambda v: None if not v or v.startswith(("unknown", "check", "n/a")) else v.lower().startswith("yes")
def tier(v):
    m = re.match(r"(\$+)", v or "")
    return (m.group(1), "est" in v) if m else (None, False)
def gone(v):
    v = (v or "").strip()
    return v if v.lower().startswith("replaced") else None
def mm(v):
    m = re.search(r"(\d+)\s*mm", v or "")
    return int(m.group(1)) if m else None

specs, fixes, checks = {}, [], []
def add(name, cat_, d, r):
    c = cat[name]
    t, est = tier(r["price_tier"])
    e = {"name": name, "cat": cat_, "tier": t, **({"tierEst": True} if est else {}), **d, "source": r["source"]}
    g = gone(r["discontinued"])
    if g: e["gone"] = g
    if r["discontinued"].startswith("check"): checks.append({"name": name, "item": "discontinued?", "note": r["discontinued"], "source": r["source"]})
    specs[c["slug"]] = e
    return c

# ---- Espresso machines: the heater type is the Type column; features become facts.
HEAT = [("dual boiler", "Dual boiler"), ("heat exchanger", "Heat exchanger"), ("single boiler", "Single boiler"), ("thermocoil", "Thermocoil"),
        ("thermoblock", "Thermoblock"), ("manual lever", "Manual lever"), ("hand pump", "Manual pump")]
# Level tiers (profile 3.1; rule of thumb: beginner only if clearly simplified, enthusiast only if it needs practice to beat a
# middle-tier machine). Everything else is the middle tier.
E_BEGIN = {"Breville Bambino", "Breville Barista Express", "Breville Barista Express Impress", "Breville Barista Pro", "Breville Barista Touch",
           "Breville Barista Touch Impress", "Breville Oracle Jet", "Breville Oracle Touch", "De'Longhi Dedica Duo", "De'Longhi Dedica Maestro",
           "De'Longhi La Specialista Arte Evo", "De'Longhi La Specialista Opera"}
E_ENTH = {"Decent DE1", "Decent Bengle", "Lelit Bianca V3", "Flair 58 Plus 2", "Profitec Drive", "Fellow Espresso Series 1"}
for r in rows("espresso_checked.csv"):
    n, tc = r["name"], r["type_correct_value"].lower()
    heat = next((v for k, v in HEAT if k in tc), None)
    st = r["steam_power_correct_value"].lower()
    steam = "none" if st.startswith("none") else "auto" if re.search(r"automatic|auto milq|hands-free", st) else "wand"
    pp = r["pressure_profiling_correct_value"].lower()
    d = {"type": heat, "heat": heat, "pid": yes(r["pid_correct_value"]),
         "profiling": pp.startswith("yes") and "manual" not in pp, "flowControl": bool(re.search(r"flow control|pagaia|flow profile|paddle flow|pressure and flow|flow and t", pp + tc)),
         "preinfusion": yes(r["pre_infusion_correct_value"]), "steam": steam, "builtInGrinder": bool(yes(r["built_in_grinder_correct_value"])),
         "group": mm(r["group_size_correct_value"]), "e61": "e61" in tc, "portable": "portable" in tc or n in ("Flair 2GO",),
         "level": "beginner" if n in E_BEGIN else "enthusiast" if n in E_ENTH else "middle"}
    c = add(n, "espresso", d, r)
    if heat and c["balance"] != heat: fixes.append({"name": n, "set": {"balance": heat}, "source": r["source"], "why": f"type: {r['type_correct_value']}"})
    if not heat: checks.append({"name": n, "item": "type", "note": r["type_correct_value"], "source": r["source"]})

# ---- Grinders
G_BEGIN = {"Baratza Encore", "Baratza Encore ESP", "Breville Smart Grinder Pro", "Timemore Chestnut C3", "Timemore Chestnut C3s", "1Zpresso Q Air",
           "1Zpresso Q2 S", "Hario Skerton Pro", "AeroPress Manual Coffee Grinder", "Baratza Virtuoso+"}
G_ENTH = {"Weber Workshops EG-1", "Weber Workshops Key Mk.2", "Niche Duo", "Turin DF83V", "Timemore Sculptor 078SSP", "Comandante C60 Baracuda"}
for r in rows("grinders_checked.csv"):
    n, tc, use = r["name"], r["type_correct_value"].lower(), r["use_correct_value"].lower()
    power = "hand" if tc.startswith("hand") else "electric"
    burr = "flat" if "flat" in tc else "conical" if "conical" in tc else None
    bm = r["burr_material_correct_value"].lower()
    esp = None if use.startswith("unknown") else False if "filter" in use else "limited" if "espresso limited" in use else True
    d = {"type": "Hand grinder" if power == "hand" else ("Flat burr electric" if burr == "flat" else "Conical burr electric"),
         "power": power, "burr": burr, "burrMm": mm(r["burr_size_correct_value"]), "burrMaterial": "ceramic" if bm.startswith("ceramic") else "steel" if bm and not bm.startswith("unknown") else None,
         "adjust": "stepless" if r["adjustment_correct_value"].lower().startswith("stepless") else "stepped",
         "singleDose": power == "hand" or bool(yes(r["single_dose_correct_value"])) or "single dose" in tc, "espresso": esp, "filter": "espresso-focused" not in use or True,
         "gbw": "grind-by-weight" in tc, "variableSpeed": "variable speed" in tc,
         "level": "beginner" if n in G_BEGIN else "enthusiast" if n in G_ENTH else "middle"}
    c = add(n, "grinder", d, r)
    if c["balance"] != d["type"]: fixes.append({"name": n, "set": {"balance": d["type"]}, "source": r["source"], "why": f"type: {r['type_correct_value']}"})

# ---- Brewers
CUPS = {"AeroPress Clear XL": ["few"], "AeroPress XL": ["few"], "Chemex Classic": ["few", "pot"], "Chemex Glass Handle": ["few"], "Chemex Ottomatic 2.0": ["pot"],
        "Fellow Aiden": ["one", "few", "pot"], "Fellow Clara": ["few"], "Fellow Stagg [XF]": ["one", "few"], "Hario Switch": ["one", "few"], "Hario V60": ["one", "few"],
        "Hario V60 MUGEN": ["one"], "Kalita Wave 185": ["one", "few"], "Moccamaster KBGT": ["few", "pot"], "Moccamaster KBGV": ["few", "pot"],
        "Ratio Eight Series 2": ["few", "pot"], "Ratio Six Series 2": ["few", "pot"], "Ratio Four": ["one", "few"], "Breville Precision Brewer Thermal": ["few", "pot"],
        "Timemore Crystal Eye Dripper 02": ["one", "few"]}
B_BEGIN = {"AeroPress Original", "AeroPress Clear", "AeroPress XL", "AeroPress Clear XL", "AeroPress Go", "AeroPress Go Plus", "AeroPress Premium", "AeroPress Steel",
           "Fellow Clara", "Hario Switch"}
B_ENTH = {"Timemore Crystal Eye B75", "Fellow Stagg [X]"}
for r in rows("brewers_checked.csv"):
    n, tc = r["name"], r["type_correct_value"].lower()
    method = "drip" if tc.startswith("auto drip") else "hybrid" if "immersion +" in tc else "french press" if "french press" in tc else "immersion" if "aeropress" in tc else "pour-over"
    typ = {"drip": "Drip coffee maker", "hybrid": "Immersion and pour-over dripper", "french press": "French press", "immersion": "Immersion press", "pour-over": "Pour-over dripper"}[method]
    ft = r["filter_type_correct_value"].lower()
    d = {"type": typ, "method": method, "cups": CUPS.get(n, ["one"]), "filter": "metal" if re.search(r"mesh|metal", ft) and "paper" not in ft else "paper",
         "sca": yes(r["sca_certified_correct_value"]), "level": "beginner" if n in B_BEGIN else "enthusiast" if n in B_ENTH else "middle"}
    c = add(n, "brewer", d, r)
    if c["balance"] != typ: fixes.append({"name": n, "set": {"balance": typ}, "source": r["source"], "why": f"type: {r['type_correct_value']}"})

# ---- Kettles
for r in rows("kettles_checked.csv"):
    n = r["name"]; goose, power = yes(r["gooseneck_correct_value"]), r["power_correct_value"].lower()
    typ = ("Electric" if power == "electric" else "Stovetop") + (" gooseneck kettle" if goose else " kettle")
    d = {"type": typ, "gooseneck": goose, "power": power, "temp": bool(yes(r["temp_control_correct_value"])), "hold": bool(yes(r["hold_mode_correct_value"])),
         "level": "beginner" if not yes(r["temp_control_correct_value"]) else "enthusiast" if n in ("Fellow Stagg EKG Pro", "Timemore Fish Pro X") else "middle"}
    c = add(n, "kettle", d, r)
    if c["balance"] != typ: fixes.append({"name": n, "set": {"balance": typ}, "source": r["source"], "why": "type"})

# ---- Scales
for r in rows("scales_checked.csv"):
    n = r["name"]; fit = yes(r["espresso_size_correct_value"])
    af = r["auto_start_flow_correct_value"].lower()
    mx = re.search(r"([\d,]+)\s*g", r["max_weight_correct_value"]); maxg = int(mx.group(1).replace(",", "")) if mx else None
    d = {"type": "Espresso scale" if fit else "Brew scale" if fit is False else None, "res": 0.01 if r["resolution_correct_value"].startswith("0.01") else 0.1,
         "maxG": maxg, "timer": bool(yes(r["timer_correct_value"])), "autoStart": "auto-start yes" in af or "auto-start in" in af, "flow": "flow rate yes" in af,
         "espressoFit": fit, "water": yes(r["water_resistant_correct_value"]), "app": bool(yes(r["app_correct_value"])),
         "level": "enthusiast" if n in ("Acaia Lunar", "Acaia Pyxis") else "beginner" if not yes(r["app_correct_value"]) and not ("flow rate yes" in af) else "middle"}
    c = add(n, "scale", d, r)
    if d["type"] and c["balance"] != d["type"]: fixes.append({"name": n, "set": {"balance": d["type"]}, "source": r["source"], "why": f"espresso fit: {r['espresso_size_correct_value']}"})
    if not d["type"]: checks.append({"name": n, "item": "fits a drip tray?", "note": r["espresso_size_correct_value"], "source": r["source"]})

# ---- Grok's other errors (data check section 2), as column fixes with the maker page.
def extra(name, col, val, why, source=None):
    f = next((x for x in fixes if x["name"] == name), None)
    s = source or specs[cat[name]["slug"]]["source"]
    if f: f["set"][col] = val; f["why"] += f"; {why}"
    else: fixes.append({"name": name, "set": {col: val}, "source": s, "why": why})
extra("Baratza Vario+", "surface", "54 mm flat ceramic burrs, timer", "burrs: the Vario+ ships with ceramic burrs (steel is the Vario-W+ option)")
extra("Timemore Basic 3.0", "surface", "2,000 g max, 0.1 g", "max weight: maker says 2,000 g")
extra("Varia EVO", "weight", "800 g", "weight: maker says 0.8 kg")
extra("Timemore Sculptor 064S", "surface", "64 mm flat burrs", "key specs: burr size, not the motor figure")
extra("Comandante C40 MK4", "core", "Steel body, glass and polymer bean jars", "material: the body, not the burrs (Nitro Blade per the key specs)")
extra("De'Longhi La Specialista Arte Evo", "surface", "51 mm portafilter, conical burr grinder (8 settings), 2 L tank, cold brew function", "key specs: specs, not just a feature")
extra("Breville Barista Touch Impress", "surface", "54 mm portafilter, Baratza European precision burrs (30 settings), 67.6 fl oz tank", "key specs: the 54 mm portafilter")
extra("Breville Oracle Jet", "surface", "58 mm portafilter, Baratza European precision burrs (45 settings), 2.3 L tank", "key specs: the 58 mm portafilter")
extra("Lelit Mara X3", "surface", "58 mm portafilter, Pagaia flow control, vibration pump", "flow control: Pagaia ships as standard")
extra("Baratza Sette 30", "balance", "Conical burr electric", "use: maker markets it for espresso and manual brew")
for n, note in [("Decent Bengle", "Not shipping yet (maker: first units Dec 2026). Its page shows pre-release impressions with a label, and it stays out of the match."),
                ("Weber Workshops EG-1", "Mk.3, out of production since the Oct 2026 redesign: marked discontinued (out of the match). Add the new EG-1 as its own product?"),
                ("Profitec GO", "Replaced by the GO 2.0 (already listed): marked discontinued (out of the match). Merge its 90 reports into the GO 2.0 instead?"),
                ("Moccamaster KBGV", "Maker / SCA name is 'KBGV Select'. Rename (changes the URL; a redirect is kept)?"),
                ("Timemore Crystal Eye B75", "Key specs hold a dose ('up to ~15 g'), not a capacity; Grok found no capacity. Leave as is?"),
                ("Lelit Mara X", "Weight 18.5 kg vs 18.4 kg at retailers (no maker page). Leave as is?")]:
    checks.append({"name": n, "item": "owner call", "note": note, "source": specs[cat[n]["slug"]]["source"]})
specs[cat["Decent Bengle"]["slug"]]["preRelease"] = "First units ship in December 2026 (maker)."

json.dump(dict(sorted(specs.items())), open("db/specs/coffee.json", "w"), indent=1, ensure_ascii=False)
open("db/specs/coffee.json", "a").write("\n")
json.dump(fixes, open("db/fixes/coffee-2026-11-18.json", "w"), indent=1, ensure_ascii=False)
json.dump(checks, open("db/fixes/coffee-2026-11-18-checks.json", "w"), indent=1, ensure_ascii=False)
from collections import Counter
print(len(specs), "specs;", len(fixes), "fixes;", len(checks), "checks")
for k in ("espresso", "grinder", "brewer", "kettle", "scale"):
    print(k, Counter(v["level"] for v in specs.values() if v["cat"] == k), Counter(v["tier"] for v in specs.values() if v["cat"] == k))
