import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { Box3 } from "three";
import { createCupModel, applyCupColour } from "../src/aster/cup-model.js";
import { cupPrice, cupProduct, cupModelPath } from "../src/data/cup.js";
import { filterSearchEntries } from "../src/aster/search-index.js";

test("the photo reconstruction has a hollow interior and an independently movable bead", () => {
  const model = createCupModel();
  const body = model.getObjectByName("Glaze_Body"), interior = model.getObjectByName("Glaze_Interior"), bead = model.getObjectByName("RollingBead");
  assert(body && interior && bead);
  const exteriorBounds = new Box3().setFromObject(body), interiorBounds = new Box3().setFromObject(interior);
  assert(interiorBounds.min.y > exteriorBounds.min.y);
  assert(interiorBounds.max.x < exteriorBounds.max.x);
  const bodyMatrix = body.matrix.clone(); bead.rotation.z += Math.PI / 2; model.updateMatrixWorld(true);
  assert(body.matrix.equals(bodyMatrix));
  assert.equal(model.userData.commercialSku, "pending");
  for (const mesh of model.children) {
    for (const attribute of Object.values(mesh.geometry.attributes)) assert(Array.from(attribute.array).every(Number.isFinite), mesh.name);
  }
  const positions = body.geometry.attributes.position.array.slice(), original = body.geometry.attributes.color.array.slice();
  applyCupColour(model, "purple-grey");
  assert.deepEqual(body.geometry.attributes.position.array, positions);
  assert.notDeepEqual(body.geometry.attributes.color.array, original);
});

test("the deployed GLB has a valid binary payload and the photo-study nodes", async () => {
  const glb = await readFile(new URL(`../dist/client${cupModelPath}`, import.meta.url));
  assert.equal(glb.toString("ascii", 0, 4), "glTF");
  assert.equal(glb.readUInt32LE(4), 2);
  assert.equal(glb.readUInt32LE(8), glb.length);
  assert.equal(glb.readUInt32LE(16), 0x4e4f534a);
  const jsonLength = glb.readUInt32LE(12), manifest = JSON.parse(glb.toString("utf8", 20, 20 + jsonLength));
  for (const name of ["Glaze_Body", "Glaze_Interior", "Glaze_Handle", "RollingBead"]) assert(manifest.nodes.some(node => node.name === name));
  assert.equal(glb.readUInt32LE(24 + jsonLength), 0x004e4942);
  assert.equal(manifest.asset.version, "2.0");
});

test("the $75 cup is discoverable in Shop and search with the approved free-shipping purchase status", async () => {
  assert.equal(cupPrice, 75); assert.equal(cupProduct.price, cupPrice); assert.equal(cupProduct.ordering, "available");
  const found = filterSearchEntries("rolling bead");
  assert.equal(found.length, 1); assert.equal(found[0].href, cupProduct.path); assert.match(found[0].detail, /\$75 USD/);
  const html = await readFile(new URL("../dist/client/shop/index.html", import.meta.url), "utf8");
  assert(html.includes(`href="${cupProduct.path}"`)); assert.match(html, /three colours, \$75 USD/); assert.match(html, /Free shipping/);
});
