import assert from "node:assert/strict";
import test from "node:test";
import { access } from "node:fs/promises";
import { Texture } from "three";
import { cupPhoto } from "../src/data/cup.js";
import { applyCupPhotoColour, createCupPhotoModel, cupPhotoModelSources } from "../src/aster/cup-photo-model.js";

test("the Wanxiang-style cup has one complete vessel mesh, including recessed underside and inner floor", () => {
  const model = createCupPhotoModel(), vessel = model.getObjectByName("CeramicVessel_ContinuousProfile");
  assert(vessel); assert.equal(model.getObjectByName("UnglazedFoot"), undefined);
  const profile = vessel.geometry.userData.profile;
  assert.equal(profile[0].r, 0); assert.equal(profile.at(-1).r, 0);
  assert(profile.some(p => p.zone === "base" && p.y < .1));
  assert(profile.some(p => p.zone === "interior" && p.y < .3));
  assert(profile.some(p => p.zone === "rim" && p.y > 3));
  assert.equal(vessel.geometry.groups.length, 2, "keep the shared geometry to two material draws");
  assert.equal(model.userData.bumpMaps, false);
  assert.equal(model.userData.commercialSku, "pending");
});

test("every cup colour uses its own untouched front/base photos without changing geometry or putting photo backgrounds in UV space", async () => {
  const model = createCupPhotoModel(), vessel = model.getObjectByName("CeramicVessel_ContinuousProfile"), positions = vessel.geometry.attributes.position.array.slice();
  for (const [id, source] of Object.entries(cupPhotoModelSources)) {
    await Promise.all([source.front, source.base].map(frame => access(new URL(`../public${cupPhoto(frame)}`, import.meta.url))));
    const front = new Texture(), base = new Texture();
    applyCupPhotoColour(model, id, { front, base });
    assert.equal(vessel.material[0].map, front); assert.equal(vessel.material[1].map, base);
    assert.deepEqual(vessel.geometry.attributes.position.array, positions);
    model.traverse(mesh => {
      if (!mesh.isMesh) return;
      for (const attribute of Object.values(mesh.geometry.attributes)) assert(Array.from(attribute.array).every(Number.isFinite), mesh.name);
      if (mesh.geometry.attributes.uv) assert(Array.from(mesh.geometry.attributes.uv.array).every(value => value >= 0 && value <= 1), mesh.name);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) assert.equal(material.bumpMap, null);
    });
    front.dispose(); base.dispose();
  }
});
