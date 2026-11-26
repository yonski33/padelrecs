import { test } from "node:test";
import assert from "node:assert/strict";
import { isSiblingListing, matchesProduct, matchesProductLoose } from "../lib/amazon";
import { looksLikeOtherProduct } from "../lib/amazon-match";

// The forgiving fallback (owner 2026-11-26, SkinRecs): Amazon titles that are the product but word it differently.
const ok = (name: string, brand: string, title: string, listingBrand = brand) => {
  const p = { name, brand }, r = { title, brand: listingBrand };
  return !looksLikeOtherProduct(p, title) && !isSiblingListing(p, title) && (matchesProduct(p, r) || matchesProductLoose(p, r));
};

test("a loose match accepts the product when Amazon words it differently (sizes, Face for Facial, marketing words)", () => {
  assert.ok(ok("CeraVe Hydrating Facial Cleanser", "CeraVe", "CeraVe Hydrating Cleanser with Hyaluronic Acid, Gentle Face Cleanser,19oz | Daily Face Wash & Makeup Remover"));
  assert.ok(ok("EltaMD UV Clear Broad-Spectrum SPF 46", "EltaMD", "EltaMD UV Clear Untinted Face Sunscreen with Zinc Oxide, SPF 46, 1.7 oz | Calms and Protects Acne-Prone Skin"));
  assert.ok(ok("Torriden DIVE-IN Low Molecular Hyaluronic Acid Serum", "Torriden", "Torriden DIVE IN Hyaluronic Acid Serum for Deep Hydration | Korean K-Beauty Glass Skin"));
  assert.ok(ok("Beauty of Joseon Relief Sun: Rice + Probiotics SPF 50+", "Beauty of Joseon", "Relief Sun Organic Korean sunscreen SPF50+ Organic Korean sunscreen SPF50+, PA++++ Riceand Probiotics | Korean Skin Care"));
});

test("a loose match still rejects another formula, SPF, tint or a bundle", () => {
  assert.ok(!ok("CeraVe Hydrating Facial Cleanser", "CeraVe", "CeraVe Foaming Facial Cleanser, Daily Face Wash for Oily Skin, 16 oz"));
  assert.ok(!ok("CeraVe Hydrating Facial Cleanser", "CeraVe", "CeraVe Hydrating Cream-to-Foam Cleanser, Makeup Remover"));
  assert.ok(!ok("EltaMD UV Clear Broad-Spectrum SPF 46", "EltaMD", "EltaMD UV Clear Tinted Face Sunscreen, SPF 46"));
  assert.ok(!ok("Supergoop! Unseen Sunscreen SPF 50", "Supergoop!", "Supergoop! Unseen Sunscreen SPF 40, 1.7 fl oz"));
  assert.ok(!ok("Beauty of Joseon Relief Sun: Rice + Probiotics SPF 50+", "Beauty of Joseon", "Beauty of Joseon Relief Sun Aqua-Fresh Rice + B5 SPF 50+"));
  assert.ok(!ok("COSRX Advanced Snail 96 Mucin Power Essence", "COSRX", "COSRX Snail 96% Mucin Essence 2ea & Retinol 0.1% Cream Mini Sample 1ea | Glass Skin Starter Set"));
  assert.ok(!ok("COSRX Acne Pimple Master Patch", "COSRX", "COSRX Acne Pimple Patches Absorbing Hydrocolloid Spot, 3 Size (240 Count)"));
  assert.ok(!ok("EltaMD UV Restore Broad-Spectrum SPF 40", "EltaMD", "EltaMD UV Daily Untinted Face Sunscreen Moisturizer, SPF 40, 1.7 oz | Hydrates Dry Skin"));
  assert.ok(!ok("CeraVe Hydrating Facial Cleanser", "La Roche-Posay", "CeraVe Hydrating Cleanser, Gentle Face Cleanser", "CeraVe"));
});

test("pickleball variants: generation, shape and thickness must match both ways; a parent listing is doubtful", async () => {
  const { variantCheck } = await import("../lib/amazon");
  assert.ok(variantCheck({ name: "JOOLA Perseus Pro IV 16mm", brand: "JOOLA" }, "JOOLA Perseus Pro V 16mm Pickleball Paddle").reject);
  assert.ok(variantCheck({ name: "Bread & Butter Loco Hybrid", brand: "Bread & Butter" }, "Bread & Butter Loco 2 Hybrid Pickleball Paddle").reject);
  assert.ok(variantCheck({ name: "CRBN TruFoam Genesis 14mm Elongated", brand: "CRBN" }, "CRBN TruFoam Genesis 16mm Elongated Paddle").reject);
  assert.ok(variantCheck({ name: "Friday Aura Elongated", brand: "Friday" }, "Friday Aura Hybrid Pickleball Paddle").reject);
  assert.ok(!variantCheck({ name: "JOOLA Perseus Pro V 16mm", brand: "JOOLA" }, "JOOLA Perseus Pro V 16mm Pickleball Paddle, Carbon Friction Surface").reject);
  assert.ok(variantCheck({ name: "Friday Aura Elongated", brand: "Friday" }, "Friday Aura Pickleball Paddle | Available in Elongated, Hybrid and Widebody").doubt);
  assert.ok(variantCheck({ name: "11SIX24 Hurache X Power", brand: "11SIX24" }, "11SIX24 Pickleball Paddles | Jelly Bean Model | Carbon Fiber").reject);
  assert.ok(variantCheck({ name: "Six Zero Coral Pro 16mm", brand: "Six Zero" }, "Six Zero Coral Pickleball Paddle, 16mm Raw Carbon, Black, Widebody").reject);
  assert.ok(variantCheck({ name: "Ronbus Quanta R1 16", brand: "Ronbus" }, "Ronbus R1.16/R2.16/R3.16 Raw Toray T700 Carbon Fiber Pickleball Paddle").doubt);
});
