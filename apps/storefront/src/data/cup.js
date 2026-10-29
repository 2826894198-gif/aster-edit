import responsiveImages from "../generated/responsive-images.json" with { type: "json" };
export const cupPath = "/products/rolling-bead-ceramic-cup";
export const cupPrice = 75;
// Historical model export retained for rollback. Cup 3D is held off the
// storefront in the approved local integration preview, 2026-10-13.
export const cupModelPath = "/models/aster/rolling-bead-cup-v1.glb";
export const cupProduct = {
  id: "rolling-bead-cup",
  name: "Rolling-bead ceramic cup",
  path: cupPath,
  price: cupPrice,
  currency: "USD",
  ordering: "available",
  image: "/images/aster/cup-preview/catalogue/three-colours-staggered-white-v2.png",
};
export const cupPhoto = (frame) => {
  const source = `/images/aster/cup-preview/cup-photo-${frame}.jpg`;
  return responsiveImages[source]?.variants.at(-1)[1] ?? source;
};

// Owner updated all three colours to $75 per cup on 2026-10-27.
// The existing free shipping and stable commerce colour IDs are retained.
export const cupColours = [
  { id: "purple-grey", name: "Purple-grey", colour: "#594653", frames: [5137, 5138, 5139, 5140] },
  { id: "olive", name: "Olive", colour: "#626441", frames: [5141, 5142, 5143, 5144, 5145] },
  { id: "deep-green", name: "Deep green", colour: "#355045", frames: [5146, 5147, 5148, 5149] },
];

// Frontend imagery is source-grounded creative photography; original frames remain archived.
export const cupCatalogueImages = Object.freeze({
  "purple-grey": "/images/aster/cup-preview/catalogue/purple-grey-white-v1.png",
  olive: "/images/aster/cup-preview/catalogue/olive-white-v1.png",
  "deep-green": "/images/aster/cup-preview/catalogue/deep-green-white-v1.png",
});
export const cupProducts = Object.freeze(cupColours.map((colour) => Object.freeze({
  id: `rolling-bead-cup-${colour.id}`,
  name: `${cupProduct.name} · ${colour.name}`,
  colour: colour.name,
  catalogKey: `rolling-bead-cup:${colour.id}`,
  price: cupPrice,
  currency: "USD",
  image: cupCatalogueImages[colour.id],
  path: cupPath,
  freeShipping: true,
})));
export const cupDetailImage = "/images/aster/cup-preview/catalogue/rolling-bead-detail-white-v1.png";
// Colour-specific, source-grounded views approved in the 2026-10-14 review.
const flagshipImage = (name) => `/images/aster/cup-preview/${name === "purple-grey-gesture" ? "upright-20261015" : "flagship-20261014"}/${name}.webp`;
export const cupViews = Object.freeze(Object.fromEntries(cupColours.map((colour) => [colour.id, {
  front: cupCatalogueImages[colour.id],
  gesture: flagshipImage(`${colour.id}-gesture`),
  bead: colour.id === "purple-grey" ? cupDetailImage : flagshipImage(`${colour.id}-bead`),
  base: flagshipImage(`${colour.id}-interior-base`),
}])));
export const cupGallery = [
  { id: "group", src: cupProduct.image, label: "Three colours", scale: 1, width: 1536, height: 1024 },
  ...cupColours.map((colour, index) => ({ id: colour.id, src: cupCatalogueImages[colour.id], label: colour.name, scale: [.94, .85, 1][index], width: 1254, height: 1254 })),
  { id: "bead", src: cupDetailImage, label: "The thumb-roll bead", scale: 1, width: 1536, height: 1024 },
];
