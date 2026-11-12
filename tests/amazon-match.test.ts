import {test} from "node:test";
import assert from "node:assert/strict";
import {isOtherType, looksLikeOtherProduct} from "../lib/amazon-match";

const ointment={name:"CeraVe Healing Ointment",brand:"CeraVe"};
test("a listing for another kind of product with the full name in it is rejected (owner, 2026-11-12)",()=>{
 assert.ok(isOtherType(ointment,"CeraVe Healing Ointment Lip Balm, Twin Pack, Petrolatum Lip Repair"));
 assert.ok(looksLikeOtherProduct(ointment,"CeraVe Healing Ointment 2 Pack"));
 assert.ok(!looksLikeOtherProduct(ointment,"CeraVe Healing Ointment | Moisturizing Petrolatum Skin Protectant for Dry Skin | 12 Ounce"));
});
test("words the product's own name uses are fine",()=>{
 assert.ok(!isOtherType({name:"Burt's Bees Lip Balm"},"Burt's Bees Moisturizing Lip Balm, Original Beeswax"));
 assert.ok(!isOtherType({name:"CeraVe Hydrating Facial Cleanser"},"CeraVe Hydrating Facial Cleanser | Moisturizing Non-Foaming Face Wash"));
});
