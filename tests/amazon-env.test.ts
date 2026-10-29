import { test } from "node:test";
import assert from "node:assert/strict";
import { AMAZON_KEYS, LINK_TAG_KEY, envBody, isAssociateTag, keyStates, planProject, tagFor, tagOverrideKey } from "../lib/amazon-env";

const all = (target: string[]) => [
  { id: "1", key: "AMAZON_CREATORS_API_CREDENTIAL_ID", target },
  { id: "2", key: "AMAZON_CREATORS_API_CREDENTIAL_SECRET", target },
  { id: "3", key: "AMAZON_PA_API_PARTNER_TAG", target },
];

test("a project without Amazon variables gets all three on Production and Preview", () => {
  const steps = planProject([{ id: "x", key: "DATABASE_URL", target: ["production"] }]);
  assert.deepEqual(steps.map(s => [s.kind, s.key, s.targets]), [
    ["create", "AMAZON_CREATORS_API_CREDENTIAL_ID", ["production", "preview"]],
    ["create", "AMAZON_CREATORS_API_CREDENTIAL_SECRET", ["production", "preview"]],
    ["create", "AMAZON_PA_API_PARTNER_TAG", ["production", "preview"]],
  ]);
});

test("running again changes nothing, and values already set are kept unless overwriting", () => {
  assert.deepEqual(planProject(all(["production", "preview"])), []);
  // SkinRecs-style: set for Production only, so only Preview is added.
  assert.deepEqual(planProject(all(["production"])).map(s => [s.kind, s.key, s.targets]), [
    ["create", "AMAZON_CREATORS_API_CREDENTIAL_ID", ["preview"]],
    ["create", "AMAZON_CREATORS_API_CREDENTIAL_SECRET", ["preview"]],
    ["create", "AMAZON_PA_API_PARTNER_TAG", ["preview"]],
  ]);
  // Split entries (one per target) count as covered; a single string target is understood too.
  assert.deepEqual(planProject([...all(["production"]), ...all(["preview"]).map(e => ({ ...e, id: `p${e.id}` }))]), []);
  assert.deepEqual(keyStates([{ id: "9", key: "AMAZON_PA_API_PARTNER_TAG", target: "production" }])[2], { key: "AMAZON_PA_API_PARTNER_TAG", has: ["production"], missing: ["preview"] });
  // Overwrite updates the existing entries in place and still adds the missing target.
  assert.deepEqual(planProject(all(["production", "development"]), true).map(s => [s.kind, s.key, s.targets]), [
    ["update", "AMAZON_CREATORS_API_CREDENTIAL_ID", ["production"]], ["create", "AMAZON_CREATORS_API_CREDENTIAL_ID", ["preview"]],
    ["update", "AMAZON_CREATORS_API_CREDENTIAL_SECRET", ["production"]], ["create", "AMAZON_CREATORS_API_CREDENTIAL_SECRET", ["preview"]],
    ["update", "AMAZON_PA_API_PARTNER_TAG", ["production"]], ["create", "AMAZON_PA_API_PARTNER_TAG", ["preview"]],
  ]);
});

test("each site gets its own tag when one is given, otherwise the shared one", () => {
  const settings = { AMAZON_PA_API_PARTNER_TAG: "lifetuner8-20", [tagOverrideKey("golf")]: "golfrecs-20" };
  assert.equal(tagOverrideKey("tabletennis"), "AMAZON_PARTNER_TAG_TABLETENNIS");
  assert.equal(tagFor("golf", settings), "golfrecs-20");
  assert.equal(tagFor("padel", settings), "lifetuner8-20");
  assert.equal(tagFor("padel", {}), "");
  assert.ok(isAssociateTag("lifetuner8-20"));
  assert.ok(!isAssociateTag("lifetuner8"));
  assert.ok(!isAssociateTag("bad tag-20"));
});

test("credentials are sent as sensitive variables, the public tag as encrypted", () => {
  assert.deepEqual(envBody({ kind: "create", key: "AMAZON_CREATORS_API_CREDENTIAL_SECRET", targets: ["production", "preview"] }, "s"),
    { key: "AMAZON_CREATORS_API_CREDENTIAL_SECRET", value: "s", type: "sensitive", target: ["production", "preview"] });
  assert.deepEqual(envBody({ kind: "update", key: "AMAZON_PA_API_PARTNER_TAG", envId: "3", targets: ["production"] }, "t-20"),
    { value: "t-20", type: "encrypted", target: ["production"] });
});

test("the link tag is added only when asked for, and on its own leaves the API variables alone", () => {
  const both = ["production", "preview"];
  assert.deepEqual(planProject(all(both)), []);
  assert.deepEqual(planProject(all(both), false, [...AMAZON_KEYS, LINK_TAG_KEY]).map(s => [s.kind, s.key, s.targets]),
    [["create", "AMAZON_AFFILIATE_TAG", ["production", "preview"]]]);
  const withLink = [...all(both), { id: "4", key: LINK_TAG_KEY, target: both }];
  assert.deepEqual(planProject(withLink, true, [LINK_TAG_KEY]).map(s => [s.kind, s.key, s.targets]),
    [["update", "AMAZON_AFFILIATE_TAG", ["production", "preview"]]]);
  assert.equal(envBody({ kind: "create", key: LINK_TAG_KEY, targets: ["production"] }, "recssite-20").type, "encrypted");
});
