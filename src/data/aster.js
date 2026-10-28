import { archivedSeries, getArchivedSeriesBySlug } from "./aster-series.js";
import { shippingPolicy, shippingSummary } from "./aster-pricing.js";

export const asterConfig = {
  brand: "Aster Edit",
  strapline: "Collected, not matched.",
  freeShippingThreshold: shippingPolicy.freeShippingThreshold,
  standardInternationalShipping: shippingPolicy.standardInternationalShipping,
  shippingNote: shippingSummary,
  shippingShortNote: "Free shipping $150+ · $30 below",
  setGiftNote: "A complimentary gift is included with every full set.",
  setGiftShortNote: "Gift included · Free international shipping",
  returnsNote: "Statutory cancellation and faulty-item rights apply. See Shipping & Returns.",
  breakageNote: "If an item arrives damaged, contact us for help.",
  prototype: true,
};

export const asterImages = {
  hero: "/images/aster/hero-table.jpg",
  lifestyle: "/images/aster/lifestyle-banner.jpg",
  earth: "/images/aster/edit-earth.jpg",
  blue: "/images/aster/edit-blue.jpg",
  garden: "/images/aster/edit-garden.jpg",
  everyday: "/images/aster/set-everyday.jpg",
  gathering: "/images/aster/product-gathering.jpg",
  gatheringAlt: "/images/aster/product-gathering-alt.jpg",
  complete: "/images/aster/set-complete.jpg",
  serving: "/images/aster/product-serving-bowl.jpg",
  linen: "/images/aster/accessory-linen.jpg",
  glass: "/images/aster/accessory-glass.jpg",
};

export const wanxiangImages = {
  series: "/images/aster/wanxiang/series-entry-v1.png",
  bowl46: "/images/aster/wanxiang/bowl-4-6-v1.png",
  bowl61: "/images/aster/wanxiang/bowl-6-1-v1.png",
  soupBowl81: "/images/aster/wanxiang/soup-bowl-8-1-v1.png",
  plate105: "/images/aster/wanxiang/plate-10-5-v1.png",
  deepPlate8: "/images/aster/wanxiang/deep-plate-8-v1.png",
  deepPlate9: "/images/aster/wanxiang/deep-plate-9-v1.png",
  shallowPlate82: "/images/aster/wanxiang/shallow-plate-8-2-v1.png",
  mug320: "/images/aster/wanxiang/mug-320-v1.png",
};

export const edits = [
  {
    id: "quiet-earth",
    name: "Quiet Earth",
    description: "Warm, grounded, and timeless.",
    color: "#a38e78",
    image: asterImages.earth,
  },
  {
    id: "blue-story",
    name: "Waterline Blue",
    description: "Eight forms in water-duck blue.",
    color: "#45596c",
    image: wanxiangImages.series,
    path: "/products/waterline-blue-ceramics",
  },
  {
    id: "garden-archive",
    name: "Garden Archive",
    description: "A modern take on vintage charm.",
    color: "#ded4c6",
    image: asterImages.garden,
  },
];

export const products = [
  {
    id: "everyday",
    slug: "the-everyday-set",
    name: "The Everyday Set",
    eyebrow: "THE EVERYDAY SET",
    price: 129,
    includesComplimentaryGift: true,
    currency: "USD",
    pieces: 4,
    serves: 2,
    image: asterImages.everyday,
    description:
      "An easy starting point for a table that feels collected over time.",
    includes: [
      { quantity: 2, name: "Dinner Plates" },
      { quantity: 2, name: "Bowls" },
    ],
    dimensions: [
      {
        name: "Dimensions",
        value: "To be confirmed with the final assortment",
      },
    ],
    material: "Stoneware concept",
    care: { dishwasherSafe: null, microwaveSafe: null },
    compliance: { foodContactVerified: false },
    relatedProductIds: ["gathering", "complete"],
  },
  {
    id: "gathering",
    slug: "the-gathering-set",
    name: "The Gathering Set",
    eyebrow: "THE GATHERING SET",
    price: 159,
    includesComplimentaryGift: true,
    currency: "USD",
    pieces: 12,
    serves: 4,
    image: asterImages.gathering,
    description:
      "A versatile tableware set designed for everyday meals and slower gatherings alike. Each piece is selected to feel individual, yet at home together.",
    includes: [
      { quantity: 4, name: "Dinner Plates" },
      { quantity: 4, name: "Side Plates" },
      { quantity: 4, name: "Bowls" },
    ],
    dimensions: [
      { name: "Dinner plate", value: "Size to be confirmed" },
      { name: "Side plate", value: "Size to be confirmed" },
      { name: "Bowl", value: "Size to be confirmed" },
    ],
    material: "Stoneware concept",
    care: { dishwasherSafe: null, microwaveSafe: null },
    compliance: { foodContactVerified: false },
    relatedProductIds: ["everyday", "complete"],
  },
  {
    id: "complete",
    slug: "the-complete-table",
    name: "The Complete Table",
    eyebrow: "THE COMPLETE TABLE",
    price: 229,
    includesComplimentaryGift: true,
    currency: "USD",
    pieces: 16,
    serves: 6,
    image: asterImages.complete,
    description:
      "A fuller edit for long lunches, open doors, and everyday rituals.",
    includes: [
      { quantity: 6, name: "Dinner Plates" },
      { quantity: 6, name: "Side Plates" },
      { quantity: 4, name: "Bowls" },
    ],
    dimensions: [
      {
        name: "Dimensions",
        value: "To be confirmed with the final assortment",
      },
    ],
    material: "Stoneware concept",
    care: { dishwasherSafe: null, microwaveSafe: null },
    compliance: { foodContactVerified: false },
    relatedProductIds: ["gathering", "everyday"],
  },
];

export const wanxiangProduct = {
  id: "wanxiang",
  slug: "waterline-blue-ceramics",
  legacySlug: "wanxiang-water-duck-blue",
  legacyName: "Wanxiang Water-Duck Blue",
  name: "Waterline",
  eyebrow: "WATERLINE · WATER-DUCK-BLUE CERAMICS",
  image: wanxiangImages.series,
  description:
    "Eight individually purchasable ceramic forms and one complete set in a quiet water-duck blue glaze.",
  sourceUrl: "https://e.tb.cn/h.8H4YDCGGGACePBd?tk=gFrqT8AxfsG",
  fullSet: {
    id: "full-set",
    name: "Full Set",
    image: wanxiangImages.series,
    price: 600,
    contents: "10 pieces · all 9 product options",
    includesComplimentaryGift: true,
    includedGroups: [
      { label: "3 Bowls", detail: "4.6″ / 6.1″ / 8.1″" },
      { label: "4 Plates", detail: "8″ / 8.2″ / 9″ / 10.5″" },
      { label: "1 Mug", detail: "320 ml" },
      { label: "1 Cup & Saucer", detail: "220 ml · 2 pieces" },
    ],
  },
  items: [
    {
      id: "bowl-4-6",
      name: "4.6-inch Bowl",
      image: wanxiangImages.bowl46,
      dimensions: "Ø 11.7 × H 5.6 cm",
      capacity: "Approx. 300 ml",
      price: 40,
    },
    {
      id: "bowl-6-1",
      name: "6.1-inch Bowl",
      image: wanxiangImages.bowl61,
      dimensions: "Ø 15.5 × H 6.9 cm",
      capacity: "Approx. 400 ml",
      price: 60,
    },
    {
      id: "soup-bowl-8-1",
      name: "8.1-inch Soup Bowl",
      image: wanxiangImages.soupBowl81,
      dimensions: "Ø 20.8 × H 8 cm",
      capacity: "Approx. 1,300 ml",
      price: 90,
    },
    {
      id: "plate-10-5",
      name: "10.5-inch Large Plate",
      image: wanxiangImages.plate105,
      dimensions: "Ø 26.7 × H 3 cm",
      price: 90,
    },
    {
      id: "deep-plate-8",
      name: "8-inch Deep Plate",
      image: wanxiangImages.deepPlate8,
      dimensions: "Ø 20.5 × H 4 cm",
      price: 80,
    },
    {
      id: "deep-plate-9",
      name: "9-inch Deep Plate",
      image: wanxiangImages.deepPlate9,
      dimensions: "Ø 23 × H 4.3 cm",
      price: 100,
    },
    {
      id: "shallow-plate-8-2",
      name: "8.2-inch Shallow Plate",
      image: wanxiangImages.shallowPlate82,
      dimensions: "Ø 21 × H 2.5 cm",
      price: 80,
    },
    {
      id: "mug-320",
      name: "320 ml Mug",
      image: wanxiangImages.mug320,
      dimensions: "Mouth Ø 9.2 × H 11.8 cm",
      capacity: "Approx. 320 ml",
      price: 60,
    },
  ],
};

export const productPath = (product) => `/products/${product.slug}`;
export const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
export const getProductBySlug = (slug) =>
  slug === wanxiangProduct.slug || slug === wanxiangProduct.legacySlug
    ? wanxiangProduct
    : getArchivedSeriesBySlug(slug) ||
      products.find((product) => product.slug === slug);

export const sourceBackedSeries = [wanxiangProduct, ...archivedSeries];
export const allAsterProducts = [...products, ...sourceBackedSeries];

export const accessories = [
  {
    id: "serving-bowl",
    name: "Serving Bowl",
    price: 48,
    currency: "USD",
    image: asterImages.serving,
    description: "A quiet companion for the table.",
  },
  {
    id: "linen-runner",
    name: "Linen Table Runner",
    price: 39,
    currency: "USD",
    image: asterImages.linen,
    description: "Soft texture for everyday settings.",
  },
  {
    id: "glass-tumblers",
    name: "Glass Tumbler Set",
    price: 52,
    currency: "USD",
    image: asterImages.glass,
    description: "Easy glassware for a considered table.",
  },
];
