const homeImage = (name) => `/images/aster/home-prototype/${name}`;
const seriesEntry = (name) => `/images/aster/series-entry/generated/${name}`;

export const homeCampaignAssets = {
  hero: homeImage("hero-source-grounded-v2.png"),
  suhuoStory: homeImage("story-suhuo-v2.png"),
  fangjuStory: homeImage("story-fangju-v2.png"),
};

export const homeCollections = [
  {
    id: "suhuo",
    path: "/products/pale-ground-ivory-ceramics",
    name: "Pale Ground",
    shortName: "Ivory Ceramics",
    count: 20,
    kind: "Collection",
    description:
      "A broad family of quiet ivory forms, from smallware to serving pieces.",
    image: seriesEntry("suhuo-matte-ivory-v1.png"),
    imagePosition: "center",
  },
  {
    id: "fangju",
    path: "/products/sunfold-fluted-ceramics",
    name: "Sunfold",
    shortName: "Fluted Ceramics",
    count: 7,
    kind: "Collection",
    description:
      "Fluted bowls, plates and a breakfast cup with a warm outlined edge.",
    image: seriesEntry("fangju-yellow-petal-v1.png"),
    imagePosition: "center",
  },
  {
    id: "monet",
    path: "/products/garden-shift-green-ceramics",
    name: "Garden Shift",
    shortName: "Mottled Green",
    count: 3,
    kind: "Compact edit",
    description:
      "Three independent forms connected by a shifting mottled green surface.",
    image: seriesEntry("mood-monet-green-v1.png"),
    imagePosition: "center",
  },
  {
    id: "mist-blue",
    path: "/products/petal-haze-blue-ceramics",
    name: "Petal Haze",
    shortName: "Blue-Grey Petal",
    count: 4,
    kind: "Compact edit",
    description:
      "Soft blue-grey vessels with a repeated petal edge and varied depth.",
    image: seriesEntry("mood-mist-blue-petal-v1.png"),
    imagePosition: "center",
  },
  {
    id: "ocean-blue",
    path: "/products/open-tide-blue-plates",
    name: "Open Tide",
    shortName: "Speckled Blue Plates",
    count: 3,
    kind: "Plate edit",
    description:
      "One oval and two round plate formats in a fine-grain ocean blue.",
    image: seriesEntry("mood-ocean-blue-v3.png"),
    imagePosition: "center",
  },
  {
    id: "orange",
    path: "/products/citrus-note-oval-plate",
    name: "Citrus Note",
    shortName: "Orange-Speckled Oval",
    count: 1,
    kind: "Object study",
    description:
      "One compact oval form, selected for its warm colour and dense speckle.",
    image: seriesEntry("orange-peel-oval-v1.png"),
    imagePosition: "center",
  },
];

export const shopCollections = [
  ...homeCollections,
  {
    id: "wanxiang",
    path: "/products/waterline-blue-ceramics",
    name: "Waterline",
    shortName: "Water-Duck Blue",
    count: 8,
    kind: "Catalog series",
    description:
      "Eight mapped bowls, plates and one mug in the water-duck-blue archive.",
    image: "/images/aster/wanxiang/series-entry-v1.png",
    imagePosition: "center",
  },
];

export const homeForms = [
  { id: "all", label: "All forms" },
  { id: "bowls", label: "Bowls" },
  { id: "plates", label: "Plates" },
  { id: "cups", label: "Cups" },
  { id: "serving", label: "Serving pieces" },
  { id: "smallware", label: "Smallware" },
];

export const homeObjects = [
  {
    id: "suhuo-dip",
    collectionId: "suhuo",
    collection: "Pale Ground",
    name: "Complimentary Handled Dip Dish",
    form: "smallware",
    meta: "Gift with any full set",
    image: homeImage("object-suhuo-dip-v2.png"),
    imagePosition: "center",
    imageScale: 1,
  },
  {
    id: "suhuo-cup",
    collectionId: "suhuo",
    collection: "Pale Ground",
    name: "200 ml Tumbler",
    form: "cups",
    meta: "Cup · archived SKU",
    image: homeImage("object-suhuo-cup-v2.png"),
    imagePosition: "center",
    imageScale: 1,
  },
  {
    id: "fangju-bowl",
    collectionId: "fangju",
    collection: "Sunfold",
    name: "7.5-inch Serving Bowl",
    form: "serving",
    meta: "Serving bowl · archived SKU",
    image: homeImage("object-fangju-bowl.jpg"),
    imagePosition: "center 76%",
    imageScale: 1.16,
  },
  {
    id: "monet-bowl",
    collectionId: "monet",
    collection: "Garden Shift",
    name: "7-inch Bowl",
    form: "bowls",
    meta: "Bowl · archived SKU",
    image: homeImage("object-monet-bowl.png"),
    imagePosition: "center",
    imageScale: 1.08,
  },
  {
    id: "mist-blue-plate",
    collectionId: "mist-blue",
    collection: "Petal Haze",
    name: "8-inch Soup Plate",
    form: "plates",
    meta: "Soup plate · archived SKU",
    image: homeImage("object-mist-blue.png"),
    imagePosition: "center",
    imageScale: 1.06,
  },
  {
    id: "ocean-oval",
    collectionId: "ocean-blue",
    collection: "Open Tide",
    name: "14.5-inch Large Oval Plate",
    form: "plates",
    meta: "Serving plate · archived SKU",
    image: homeImage("object-ocean-oval.jpg"),
    imagePosition: "center",
    imageScale: 1.03,
  },
  {
    id: "orange-oval",
    collectionId: "orange",
    collection: "Citrus Note",
    name: "8.3-inch Oval Plate",
    form: "plates",
    meta: "Object study · archived SKU",
    image: homeImage("collection-orange.jpg"),
    imagePosition: "center",
    imageScale: 1,
  },
  {
    id: "wanxiang-deep-plate",
    collectionId: "wanxiang",
    collection: "Waterline",
    name: "8-inch Deep Plate",
    form: "plates",
    meta: "Deep plate · archived SKU",
    image: "/images/aster/wanxiang/deep-plate-8-v1.png",
    imagePosition: "center",
    imageScale: 1,
    path: "/products/waterline-blue-ceramics",
  },
];

export const homeSearchEntries = [
  ...shopCollections.map((entry) => ({
    id: `collection-${entry.id}`,
    label: entry.name,
    href: entry.path,
    type: entry.kind,
  })),
  ...homeObjects.map((entry) => ({
    id: `object-${entry.id}`,
    label: entry.name,
    href:
      entry.path ||
      shopCollections.find((collection) => collection.id === entry.collectionId)
        ?.path ||
      "/#objects",
    type: entry.collection,
  })),
];
