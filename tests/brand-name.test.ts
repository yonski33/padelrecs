import { test } from "node:test";
import assert from "node:assert/strict";
import { repeatsBrand } from "../lib/brand-name";

test("a name repeats its brand when it is the brand or starts with it, ignoring case and punctuation", () => {
  assert(repeatsBrand("Monarch", "Monarch"));
  assert(repeatsBrand("YNAB", "ynab"));
  assert(repeatsBrand("Mullvad VPN", "Mullvad"));
  assert(repeatsBrand("Wise", "Wise."));
  assert(repeatsBrand("1Password 8", "1Password"));
  assert(repeatsBrand("Bells-of-Steel Rack", "Bells of Steel"));
  assert(!repeatsBrand("Sapphire Preferred", "Chase"));
  assert(!repeatsBrand("Monarchy App", "Monarch"), "a longer word is not the brand");
  assert(!repeatsBrand("Lumix G9", ""));
});
