import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { authorizedProductAssets, productAssetLibrary, authorizedSourceImages } from "../src/domain/product-assets.js";
const root = new URL("../", import.meta.url);

test("public product derivatives retain their exact hashes and dimensions", async () => {
  assert.equal(productAssetLibrary.sourceNoteId, "demo-source");
  assert.equal(authorizedProductAssets.length, 6);
  for (const asset of authorizedProductAssets) {
    const image = await readFile(new URL(asset.assetPath, root));
    assert.equal(createHash("sha256").update(image).digest("hex"), asset.provenance.cutoutSha256);
    assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(image.readUInt32BE(16), asset.width);
    assert.equal(image.readUInt32BE(20), asset.height);
  }
});

test("the public demo does not claim source rights or expose private supplier archives", async () => {
  assert.equal(productAssetLibrary.rightsStatus, "review-required");
  for (const asset of [...authorizedProductAssets, ...authorizedSourceImages]) {
    assert.equal(new URL(asset.sourceUrl).hostname, "source.example.test");
    assert.equal(asset.rightsStatus, "review-required");
    assert.doesNotMatch(asset.assetPath, /source-archive|xhs-/);
    assert.equal(asset.provenance?.originalAssetPath, undefined);
  }
  const source = await readFile(new URL("../src/domain/product-assets.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /sourceProvenance|originalSha256|sellerProfileId/);
  await assert.rejects(access(new URL("../public/assets/product/source", import.meta.url)), { code: "ENOENT" });
});
