import { cupSeo } from "../data/cup-content.js";
import { vertexPath, vertexSeo, vertexImageAssets } from "../data/vertex-crystal.js";
import { crystalPath, crystalSeo, crystalImageAssets } from "../data/crystal.js";
import { productTiers } from "../domain/catalog.js";
import {
  allAsterProducts as asterProducts,
  productPath,
} from "../data/aster.js";
import { getStaticPageCopy } from "../content/site-copy.js";

const seriesSearchIntent = {
  "suhuo-ivory": ["Pale Ground Ivory Ceramic Bowls, Plates & Serveware", "ivory ceramic bowls plates and serveware"],
  "fangju-yellow": ["Sunfold Fluted Ceramic Bowls & Plates", "fluted ceramic bowls and plates"],
  "mood-monet-green": ["Garden Shift Mottled Green Ceramic Bowls & Plate", "mottled green ceramic bowls and plate"],
  "mood-mist-blue-petal": ["Petal Haze Blue-Grey Petal-Rim Bowls & Plates", "blue grey scalloped ceramic bowls and plates"],
  "mood-ocean-blue": ["Open Tide Speckled Blue Ceramic Plates & Platter", "blue ceramic plates and oval platter"],
  "orange-peel-oval": ["Citrus Note Orange-Speckled Oval Ceramic Plate", "orange speckled oval ceramic plate"],
  wanxiang: ["Waterline Water-Duck-Blue Ceramic Tableware", "water duck blue ceramic tableware"],
};

const asterRoutes = [
  {
    path: vertexPath,
    type: "aster-vertex",
    ...vertexSeo,
    imageUrls: vertexImageAssets.map((image) => image.src),
    readyForIndexing: false,
  },
  {
    path: crystalPath,
    type: "aster-crystal",
    ...crystalSeo,
    imageUrls: crystalImageAssets.map((image) => image.src),
    readyForIndexing: true,
  },
  {
    path: "/products/rolling-bead-ceramic-cup",
    type: "aster-cup",
    title: cupSeo.title,
    description: cupSeo.description,
    primaryIntent: cupSeo.primaryIntent,
    readyForIndexing: false,
  },
  {
    path: "/",
    type: "home",
    title: "Curated Ceramic Tableware & Fidget Mug | Aster Edit",
    description: "Explore Aster Edit’s rolling-bead ceramic cup in three colours, alongside six ceramic tableware edits chosen for form, colour and everyday use.",
    primaryIntent: "curated ceramic tableware",
    readyForIndexing: true,
  },
  {
    path: "/shop",
    type: "aster-shop",
    title: "Shop Ceramics & Crystal Glassware | Aster Edit",
    description: "Explore six ceramic collections, the rolling-bead cup, Prism tumblers and Vertex crystal glasses. Discover the individual forms and photographed details.",
    primaryIntent: "shop ceramic tableware by form",
    readyForIndexing: true,
  },
  {
    path: "/collections",
    type: "aster-collections",
    title: "Ceramic Tableware Collections | Aster Edit",
    description: "Compare six curated ceramic collections by silhouette, surface and colour, from ivory forms to fluted bowls and blue serving plates.",
    primaryIntent: "Aster Edit ceramic collections",
    readyForIndexing: true,
  },
  {
    path: "/search",
    type: "aster-search",
    title: "Search Ceramic Tableware | Aster Edit",
    description: "Find a collection or individual ceramic form in the Aster Edit archive.",
    primaryIntent: "Aster Edit product search",
    readyForIndexing: false,
  },
  {
    path: "/about",
    type: "aster-about",
    title: "Our Approach to Curated Ceramics | Aster Edit",
    description: "Learn how Aster Edit chooses individual ceramic forms by proportion, surface and use, then brings them together as a considered table.",
    primaryIntent: "Aster Edit brand approach and tableware curation",
    readyForIndexing: true,
  },
  {
    path: "/shipping-returns",
    type: "aster-policy",
    title: "Shipping & Returns | Aster Edit",
    description: "International shipping charges and customer return rights for Aster Edit.",
    primaryIntent: "Aster Edit shipping and returns policy",
    readyForIndexing: true,
  },
];

const cuteRoutes = [
  {
    path: "/cute",
    type: "cute-preview",
    ...getStaticPageCopy("/cute"),
    primaryIntent: "tableware mystery box visual prototype",
    readyForIndexing: false,
  },
  {
    path: "/collections/mystery-tableware-box",
    type: "collection",
    ...getStaticPageCopy("/collections/mystery-tableware-box"),
    primaryIntent: "mystery tableware box collection",
    readyForIndexing: false,
  },
  {
    path: "/pages/how-it-works",
    type: "page",
    ...getStaticPageCopy("/pages/how-it-works"),
    primaryIntent: "how tableware mystery boxes work",
    readyForIndexing: false,
  },
  {
    path: "/pages/what-could-be-inside",
    type: "page",
    ...getStaticPageCopy("/pages/what-could-be-inside"),
    primaryIntent: "what is inside a tableware mystery box",
    readyForIndexing: false,
  },
  {
    path: "/pages/shipping-returns",
    type: "page",
    ...getStaticPageCopy("/pages/shipping-returns"),
    primaryIntent: "mystery tableware box shipping and returns",
    readyForIndexing: false,
  },
  {
    path: "/blogs/table-stories",
    type: "blog",
    ...getStaticPageCopy("/blogs/table-stories"),
    primaryIntent: "tableware mystery box guides",
    readyForIndexing: false,
  },
];

const cuteProductRoutes = productTiers.map((product) => ({
  path: product.url,
  type: "product",
  productId: product.id,
  title: product.title,
  description: product.description,
  primaryIntent: `${product.pieceCount} piece mystery tableware box`,
  readyForIndexing: false,
}));

export const seoRoutes = Object.freeze(
  [
    // Full visible HTML, imagery and navigation added on this date.
    // Keep this content date stable across builds; update only on real changes.
    ...asterRoutes.map((route) => ({ ...route, group: "aster", lastModified: ["/shop", crystalPath].includes(route.path) ? "2026-10-23" : route.path === vertexPath ? "2026-10-22" : route.path === "/" ? "2026-10-16" : route.readyForIndexing ? "2026-10-09" : null })),
    ...cuteRoutes.map((route) => ({ ...route, group: "cute" })),
    ...cuteProductRoutes.map((route) => ({ ...route, group: "cute" })),
    ...asterProducts.map((product) => ({
      path: productPath(product),
      type: product.sourceUrl ? "aster-series" : "aster-concept",
      group: "aster",
      productId: product.sourceUrl ? product.id : null,
      title: product.sourceUrl
        ? `${seriesSearchIntent[product.id][0]} | Aster Edit`
        : `${product.name} | Aster Edit`,
      description: product.description,
      primaryIntent: product.sourceUrl
        ? seriesSearchIntent[product.id][1]
        : `concept tableware ${product.name.toLowerCase()}`,
      readyForIndexing: Boolean(product.sourceUrl && product.id !== "wanxiang"),
      lastModified: product.sourceUrl && product.id !== "wanxiang" ? "2026-10-09" : null,
    })),
  ].map((route) =>
    Object.freeze({
      ...route,
      intentStatus: "unvalidated",
    }),
  ),
);

export function getRoute(pathname) {
  const normalized = pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;
  return seoRoutes.find((route) => route.path === normalized) ?? null;
}
