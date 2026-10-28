import cutoutManifest from "../../public/assets/product/cutouts/demo-tableware/manifest.json" with { type: "json" };

const PUBLIC_ROOT = "/assets/product/cutouts/demo-tableware";
const FILE_ROOT = "public/assets/product/cutouts/demo-tableware";

// Legacy export names retained for the historical prototype. This public demo
// contains selected derivatives, not source archives or an authorization ledger.
export const authorizedProductAssets = Object.freeze(cutoutManifest.assets.map((cutout) => Object.freeze({
  id: cutout.id,
  label: cutout.label,
  alt: cutout.label,
  url: `${PUBLIC_ROOT}/${cutout.file}`,
  assetPath: `${FILE_ROOT}/${cutout.file}`,
  width: cutout.width,
  height: cutout.height,
  sourceUrl: "https://source.example.test/demo-product",
  rightsStatus: "review-required",
  provenance: Object.freeze({
    sourcePlatform: "demo",
    sourceNoteId: "demo-source",
    cutoutSha256: cutout.sha256,
    sourceCrop: Object.freeze([...cutout.sourceCrop]),
    extractionMethod: cutout.method,
    cutoutManifestPath: `${FILE_ROOT}/manifest.json`,
  }),
})));

export const authorizedSourceImages = Object.freeze(authorizedProductAssets.map((asset, index) => Object.freeze({
  id: `demo-image-${index + 1}`,
  alt: `Tableware demonstration ${index + 1}`,
  url: asset.url,
  assetPath: asset.assetPath,
  sourceUrl: asset.sourceUrl,
  rightsStatus: asset.rightsStatus,
  sha256: asset.provenance.cutoutSha256,
})));

export const productAssetLibrary = Object.freeze({
  sourceNoteId: "demo-source",
  sourceUrl: "https://source.example.test/demo-product",
  rightsStatus: "review-required",
  assets: authorizedProductAssets,
});
export function getAuthorizedProductAsset(id) {
  return authorizedProductAssets.find((asset) => asset.id === id) ?? null;
}
