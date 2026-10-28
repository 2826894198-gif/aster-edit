import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { vertexProducts } from "../src/data/vertex-crystal.js";
import { crystalProducts } from "../src/data/crystal.js";
import { restoreBag, serializeBag, handoffItems } from "../src/aster/commerce.js";

test("each photographed Vertex variant restores to its exact SKU, price and image", () => {
  assert.equal(vertexProducts.length, 8);
  assert.equal(new Set(vertexProducts.map(p => p.catalogKey)).size, 8);
  for (const p of vertexProducts) {
    assert.equal(p.sku, "ASTER-" + createHash("sha256").update(p.catalogKey).digest("hex").slice(0,24).toUpperCase());
    const bag=restoreBag(serializeBag([{product:p,edit:null,quantity:2}]));
    assert.equal(bag[0].product.id,p.id);
    assert.equal(bag[0].product.price*bag[0].quantity,198);
    assert.equal(bag[0].product.image,p.image);
    assert.ok(p.image.endsWith("front-white-v2.webp"));
    assert.deepEqual(handoffItems(bag),[{catalog_key:p.catalogKey,quantity:2}]);
  }
});

test("Vertex and existing Prism bag quantities survive independently", () => {
 const rows=[{product:vertexProducts[0],edit:null,quantity:1},{product:vertexProducts[7],edit:null,quantity:2},{product:crystalProducts[0],edit:null,quantity:1}];
 const bag=restoreBag(serializeBag(rows));
 assert.deepEqual(bag.map(r=>r.quantity),[1,2,1]);
 assert.equal(bag.reduce((s,r)=>s+r.product.price*r.quantity,0),426);
 assert.equal(handoffItems(bag).length,3);
 assert.ok(bag.every(r=>r.product.freeShipping));
});

test("restored Vertex selections reject invalid quantity and unknown combinations", () => {
 assert.deepEqual(restoreBag(JSON.stringify({version:1,items:[{productId:vertexProducts[0].id,editId:null,quantity:21}]})),[]);
 assert.deepEqual(restoreBag(JSON.stringify({version:1,items:[{productId:"vertex-crystal-glass-low-red",editId:null,quantity:1}]})),[]);
});
