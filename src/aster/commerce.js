import { archivedSeries } from "../data/aster-series.js";
import {
  products,
  accessories,
  edits,
  wanxiangProduct,
} from "../data/aster.js";
import { isComplimentaryGiftProductId } from "../data/aster-pricing.js";
import { cupProducts } from "../data/cup.js";
import { crystalProducts, legacyCrystalProducts } from "../data/crystal.js";
import { vertexProducts } from "../data/vertex-crystal.js";

// Contract v1: explicit immutable mapping, never derive a Woo key from array order.
const seriesKeys = [
  [
    "mood-monet-green",
    "mood-monet-garden-green",
    { "bowl-7": "01", "plate-8": "02", "sauce-bowl-4-5": "03" },
  ],
  [
    "mood-mist-blue-petal",
    "mood-mist-blue-petal",
    {
      "soup-plate-8": "01",
      "bowl-6": "02",
      "plate-8-5": "03",
      "plate-10-3": "04",
    },
  ],
  [
    "mood-ocean-blue",
    "mood-ocean-blue-plates",
    { "oval-14-5": "01", "plate-8-5": "02", "plate-10-5": "03" },
  ],
  [
    "fangju-yellow",
    "fangju-yellow-petal",
    {
      "rice-bowl-4-5": "01",
      "noodle-bowl-6-5": "02",
      "serving-bowl-7-5": "03",
      "dip-dish-4": "04",
      "plate-8": "05",
      "deep-plate-10": "06",
      "breakfast-cup-430": "07",
    },
  ],
  [
    "suhuo-ivory",
    "suhuo-matte-ivory",
    {
      "handled-dip-2-5": "01",
      spoon: "02",
      "tumbler-200": "03",
      "bowl-4-7": "04",
      "pedestal-bowl-4-25": "05",
      "noodle-bowl-8-25": "06",
      "flat-plate-8": "07",
      "flat-plate-10-5": "08",
      "oval-shallow-9-25": "09",
      "oval-deep-9-5": "10",
      "fish-plate-11-5": "11",
      "fish-plate-15": "12",
      "octagonal-dish-5-5": "13",
      "octagonal-bowl-7-8": "14",
      "hat-bowl-small": "15",
      "hat-bowl-large": "16",
      "olive-bowl-small": "17",
      "olive-bowl-large": "18",
      "handled-soup-bowl-7-6": "19",
      "ingot-bowl-9-8": "20",
    },
  ],
  ["orange-peel-oval", "orange-peel-oval-plate", { "oval-plate-8-3": "01" }],
];
export const catalogKeys = Object.freeze(
  Object.fromEntries(
    seriesKeys.flatMap(([front, back, pieces]) => [
      ...Object.entries(pieces).map(([id, suffix]) => [
        `${front}-${id}`,
        `${back}:${suffix}`,
      ]),
      ...([
        "mood-monet-green",
        "mood-mist-blue-petal",
        "mood-ocean-blue",
        "fangju-yellow",
      ].includes(front)
        ? [[`${front}-full-set`, `${back}:full-set`]]
        : []),
    ]).concat([...cupProducts, ...crystalProducts, ...vertexProducts].map((product) => [product.id, product.catalogKey])),
  ),
);

// Production connection is an explicit build-time opt-in, never inferred from the page host.
export function commerceConfig(
  location,
  development = import.meta.env?.DEV,
  configuredOrigin = typeof import.meta.env === "undefined" ? undefined : import.meta.env.VITE_ASTER_COMMERCE_ORIGIN,
) {
  const local =
    development &&
    ["localhost", "127.0.0.1"].includes(location.hostname) &&
    ["5173", "5188"].includes(location.port);
  const production =
    !development &&
    location.protocol === "https:" &&
    location.hostname === "asteredit.com" &&
    configuredOrigin === "https://commerce.example.test";
  if (!local && !production) return null;
  const origin = local
    ? "http://127.0.0.1:8088"
    : "https://commerce.example.test";
  return {
    origin,
    handoffEndpoint: local
      ? `${origin}/wp-json/aster/v1/checkout-handoffs`
      : "/aster-commerce/checkout-handoffs",
    account: `${origin}/my-account/`,
    orders: `${origin}/order-status/`,
    cart: `${origin}/cart/`,
  };
}

// Customer account pages are useful before checkout opens. Keep their links
// independent of the explicit payment handoff build flag above.
export function commerceLinks(location, development = import.meta.env?.DEV) {
  const local = development && ["localhost", "127.0.0.1"].includes(location.hostname);
  const publicStore =
    location.protocol === "https:" &&
    ["asteredit.com", "www.asteredit.com"].includes(location.hostname);
  if (!local && !publicStore) return null;
  const origin = local ? "http://127.0.0.1:8088" : "https://commerce.example.test";
  return {
    account: `${origin}/my-account/`,
    register: `${origin}/my-account/?view=register`,
    orders: `${origin}/order-status/`,
    cart: `${origin}/cart/`,
  };
}

const knownProducts = new Map(
  [
    ...products,
    ...accessories,
    ...cupProducts,
    ...crystalProducts,
    ...legacyCrystalProducts,
    ...vertexProducts,
    ...[wanxiangProduct, ...archivedSeries].flatMap((series) =>
      [...(series.fullSet ? [series.fullSet] : []), ...series.items].map(
        (piece) => ({
          ...piece,
          id: `${series.id}-${piece.id}`,
          name: `${series.name} · ${piece.name}`,
          price: piece.price ?? null,
        }),
      ),
    ),
  ].map((product) => [product.id, product]),
);
export const BAG_STORAGE_KEY = "aster.selection.v1";

export function restoreBag(raw) {
  try {
    const saved = JSON.parse(raw);
    if (
      saved?.version !== 1 ||
      !Array.isArray(saved.items) ||
      saved.items.length > 100
    )
      return [];
    const seen = new Set();
    return saved.items.flatMap((row) => {
      const product = knownProducts.get(row?.productId);
      const edit =
        row?.editId === null
          ? null
          : edits.find((candidate) => candidate.id === row?.editId);
      if (
        !product ||
        isComplimentaryGiftProductId(product.id) ||
        product.availability === "out-of-stock-at-capture" ||
        edit === undefined ||
        !Number.isInteger(row.quantity) ||
        row.quantity < 1 ||
        row.quantity > 20
      )
        return [];
      const key = `${product.id}:${edit?.id ?? "none"}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ key, product, edit, quantity: row.quantity }];
    });
  } catch {
    return [];
  }
}
export function serializeBag(items) {
  // Store selection identifiers only: no prices, customer data, auth or handoff tokens.
  return JSON.stringify({
    version: 1,
    items: items.map((item) => ({
      productId: item.product.id,
      editId: item.edit?.id ?? null,
      quantity: item.quantity,
    })),
  });
}
export function handoffItems(items) {
  const rows = new Map();
  if (!items.length) throw new Error("Choose a piece first.");
  for (const item of items) {
    if (isComplimentaryGiftProductId(item.product.id))
      throw new Error("Complimentary gifts cannot be purchased separately.");
    if (item.product.availability === "out-of-stock-at-capture")
      throw new Error(
        "Remove out-of-stock pieces before checking availability.",
      );
    if (item.product.retired) throw new Error("An earlier Prism selection needs a zodiac sign. Remove that line and choose one of the twelve signs on the product page.");
    const key = catalogKeys[item.product.id];
    if (!key)
      throw new Error(
        "This selection includes preview-only pieces. Remove them before checking availability.",
      );
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    )
      throw new Error("Choose between 1 and 20 of each piece.");
    rows.set(key, (rows.get(key) || 0) + item.quantity);
  }
  if (
    rows.size > 20 ||
    [...rows.values()].some((q) => q > 20) ||
    [...rows.values()].reduce((a, b) => a + b, 0) > 100
  )
    throw new Error(
      "Choose up to 20 different pieces and 100 pieces in total.",
    );
  return [...rows].map(([catalog_key, quantity]) => ({
    catalog_key,
    quantity,
  }));
}
export async function requestCheckout(items, config, fetcher = fetch, signal, source) {
  if (!config) throw new Error("Checkout is not open yet.");
  const response = await fetcher(
    config.handoffEndpoint || `${config.origin}/wp-json/aster/v1/checkout-handoffs`,
    {
      method: "POST",
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: handoffItems(items),
        ...(["direct", "organic_search", "paid_search", "social", "email", "referral", "campaign", "unknown"].includes(source)
          ? { source }
          : {}),
        entry: "checkout",
      }),
    },
  );
  if (response.status !== 201) {
    throw new Error(
      response.status === 409
        ? "These pieces are not ready for checkout yet. Your selection has been kept."
        : response.status === 429
          ? "Please wait a few minutes before trying again. Your selection has been kept."
          : "Checkout is temporarily unavailable. Your selection has been kept.",
    );
  }
  let destination;
  try {
    const result = await response.json();
    destination = new URL(result.handoff_url);
  } catch {
    throw new Error("The checkout link could not be verified. Your selection has been kept.");
  }
  // Accept the reviewed direct checkout entry and the previous service route
  // during a backend-first rollout. Neither URL carries customer information.
  const selectionEntry =
    (destination.pathname === "/checkout/" && destination.search === "?aster_handoff=1") ||
    (destination.pathname === "/checkout-handoff/" && !destination.search);
  if (
    destination.origin !== config.origin ||
    !selectionEntry ||
    destination.username ||
    destination.password ||
    !/^#handoff=[a-f0-9]{64}$/.test(destination.hash)
  )
    throw new Error(
      "The checkout link could not be verified. Your selection has been kept.",
    );
  return destination.href;
}
