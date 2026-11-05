import { test } from "node:test";
import assert from "node:assert/strict";
import { displayName, repeatsBrand } from "../lib/brand-name";

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

test("a name also repeats its brand through one of the brand's words, a short form or its initials", () => {
  assert(repeatsBrand("Schwab One Brokerage Account", "Charles Schwab"));
  assert(repeatsBrand("Otter", "Otter.ai"));
  assert(repeatsBrand("REP PR-4000", "REP Fitness"));
  assert(repeatsBrand("TEMPUR-Adapt", "Tempur-Pedic"));
  assert(repeatsBrand("WinkBed Plus", "WinkBeds"));
  assert(repeatsBrand("T&N Mint", "Tuft & Needle"));
  assert(repeatsBrand("AWS Amplify", "Amazon Web Services"));
  assert(!repeatsBrand("United Explorer Card", "Chase"));
  assert(!repeatsBrand("Blue Cash Preferred Card", "American Express"));
  assert(!repeatsBrand("Chilipad Cube", "Sleepme"));
});

test("products with a name of their own drop the parent company from the title", () => {
  assert.equal(displayName("Cloudways", "DigitalOcean"), "Cloudways");
  assert.equal(displayName("ChatGPT", "OpenAI"), "ChatGPT");
  assert.equal(displayName("Firebase Hosting", "Google"), "Google Firebase Hosting");
  assert.equal(displayName("Nail Polish", "ILNP"), "ILNP Nail Polish");
});
