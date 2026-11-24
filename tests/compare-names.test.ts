import { test } from "node:test";
import assert from "node:assert/strict";
import { refName, repeatsTrait, specValue } from "../lib/compare-names";

test("different brands: brand only", () => {
  const all = [{ brand: "Nox", model: "AT10 Genius 12K Alum XTREM" }, { brand: "Adidas", model: "Metalbone CTRL 3.5" }];
  assert.equal(refName(0, all), "Nox");
  assert.equal(refName(1, all), "Adidas");
});

test("same brand: shortest model word that differs", () => {
  const all = [{ brand: "Nox", model: "AT10 Genius 18K" }, { brand: "Nox", model: "AT10 Genius 12K Alum" }];
  assert.equal(refName(0, all), "18K");
  assert.equal(refName(1, all), "12K");
  const ad = [{ brand: "Adidas", model: "Metalbone CTRL 3.5" }, { brand: "Adidas", model: "Metalbone 3.5" }];
  assert.equal(refName(0, ad), "CTRL");
});

test("mixed: shared brand gets model word, unique brand gets brand", () => {
  const all = [{ brand: "Nox", model: "AT10 18K" }, { brand: "Nox", model: "AT10 12K" }, { brand: "Bullpadel", model: "Vertex 04" }];
  assert.equal(refName(0, all), "18K");
  assert.equal(refName(2, all), "Bullpadel");
});

test("no distinct word or no brand: short model name", () => {
  assert.equal(refName(0, [{ brand: "Nox", model: "AT10" }, { brand: "Nox", model: "AT10 Pro" }]), "AT10");
  assert.equal(refName(0, [{ brand: "Nox", model: "AT10 Genius 12K Alum XTREM" }, { brand: "Nox", model: "AT10 Genius 12K Alum XTREM Lite" }]), "XTREM");
  assert.equal(refName(0, [{ brand: "Adidas", model: "Metalbone 3.5" }, { brand: "Adidas", model: "Metalbone CTRL 3.5" }]), "3.5");
  assert.equal(refName(0, [{ brand: "", model: "Cream" }, { brand: "CeraVe", model: "Moisturizing Cream" }]), "Cream");
  assert.equal(refName(1, [{ brand: "Tatcha", model: "The Dewy Skin Cream" }, { brand: "CeraVe", model: "Moisturizing Cream" }]), "CeraVe");
});

test("a name sharing no word with its sibling stays whole", () => {
  const all = [{ brand: "Six Zero", model: "Coral 16mm" }, { brand: "Six Zero", model: "Double Black Diamond Control" }];
  assert.equal(refName(1, all), "Double Black Diamond Control");
  assert.equal(refName(0, all), "Coral 16mm");
});

test("own line that repeats a lead trait", () => {
  assert.equal(repeatsTrait("Fast handling at the net and in defence", ["speed"]), true);
  assert.equal(repeatsTrait("Big power on smashes", ["speed", "forgiveness"]), false);
  assert.equal(repeatsTrait("Easy on the elbow", ["arm"]), true);
});

test("spec values: one range and unit style", () => {
  assert.equal(specValue("360 – 375g"), "360–375 g");
  assert.equal(specValue("345-360g"), "360–375 g".replace("360–375", "345–360"));
  assert.equal(specValue("16mm"), "16 mm");
  assert.equal(specValue("7.8 - 8.2 oz"), "7.8–8.2 oz");
  assert.equal(specValue("Carbon 12K"), "Carbon 12K");
  assert.equal(specValue("2026"), "2026");
});

test("short names: a two-word brand (or one another name starts with) gives way to the model words", () => {
  const vs = [{ brand: "Vatic Pro", model: "Prism Flash" }, { brand: "Six Zero", model: "Ruby" }];
  assert.equal(refName(0, vs), "Prism Flash");
  assert.equal(refName(1, vs), "Ruby");
  assert.equal(refName(0, [{ brand: "Nox", model: "AT10 Genius 12K" }, { brand: "Oxdog", model: "Hyper Pro 2.0" }]), "Nox");
  // "Head" is the start of another brand's name here ("Head Hunter …"): the model, not "the Head".
  assert.equal(refName(0, [{ brand: "Head", model: "Speed Motion" }, { brand: "Head Hunter", model: "X1" }]), "Speed Motion");
});
