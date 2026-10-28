export const shippingPolicy = Object.freeze({
  currency: "USD",
  freeShippingThreshold: 150,
  standardInternationalShipping: 30,
});

export const shippingSummary = `Free international shipping on orders ${new Intl.NumberFormat(
  "en-US",
  {
    style: "currency",
    currency: shippingPolicy.currency,
    maximumFractionDigits: 0,
  },
).format(
  shippingPolicy.freeShippingThreshold,
)} or more. ${new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: shippingPolicy.currency,
  maximumFractionDigits: 0,
}).format(
  shippingPolicy.standardInternationalShipping,
)} international shipping below that amount.`;

const prices = Object.freeze({
  "mood-monet-green:bowl-7": 69,
  "mood-monet-green:plate-8": 69,
  "mood-monet-green:sauce-bowl-4-5": 36,
  "mood-mist-blue-petal:soup-plate-8": 49,
  "mood-mist-blue-petal:bowl-6": 36,
  "mood-mist-blue-petal:plate-8-5": 42,
  "mood-mist-blue-petal:plate-10-3": 62,
  "mood-ocean-blue:oval-14-5": 90,
  "mood-ocean-blue:plate-8-5": 60,
  "mood-ocean-blue:plate-10-5": 70,
  "fangju-yellow:rice-bowl-4-5": 29,
  "fangju-yellow:noodle-bowl-6-5": 39,
  "fangju-yellow:serving-bowl-7-5": 45,
  "fangju-yellow:dip-dish-4": 29,
  "fangju-yellow:plate-8": 39,
  "fangju-yellow:deep-plate-10": 49,
  "fangju-yellow:breakfast-cup-430": 39,
  "suhuo-ivory:tumbler-200": 50,
  "suhuo-ivory:bowl-4-7": 40,
  "suhuo-ivory:pedestal-bowl-4-25": 120,
  "suhuo-ivory:noodle-bowl-8-25": 80,
  "suhuo-ivory:flat-plate-8": 60,
  "suhuo-ivory:flat-plate-10-5": 90,
  "suhuo-ivory:oval-shallow-9-25": 60,
  "suhuo-ivory:oval-deep-9-5": 70,
  "suhuo-ivory:fish-plate-11-5": 100,
  "suhuo-ivory:fish-plate-15": 130,
  "suhuo-ivory:octagonal-dish-5-5": 40,
  "suhuo-ivory:octagonal-bowl-7-8": 80,
  "suhuo-ivory:hat-bowl-small": 80,
  "suhuo-ivory:hat-bowl-large": 100,
  "suhuo-ivory:olive-bowl-small": 80,
  "suhuo-ivory:olive-bowl-large": 100,
  "suhuo-ivory:handled-soup-bowl-7-6": 80,
  "suhuo-ivory:ingot-bowl-9-8": 100,
  "orange-peel-oval:oval-plate-8-3": 60,
});

const complimentaryGiftKeys = new Set([
  "suhuo-ivory:handled-dip-2-5",
  "suhuo-ivory:spoon",
]);

const setOffers = Object.freeze({
  "mood-monet-green": Object.freeze({
    id: "full-set",
    name: "Full Set",
    price: 160,
    contents: "3 pieces · one of every form",
    includedGroups: [
      { label: "1 Bowl", detail: "7 inch" },
      { label: "1 Plate", detail: "8 inch" },
      { label: "1 Sauce Bowl", detail: "4.5 inch" },
    ],
    includesComplimentaryGift: true,
  }),
  "mood-mist-blue-petal": Object.freeze({
    id: "full-set",
    name: "Full Set",
    price: 170,
    contents: "4 pieces · one of every form",
    includedGroups: [],
    includesComplimentaryGift: true,
    availability: "out-of-stock-at-capture",
  }),
  "mood-ocean-blue": Object.freeze({
    id: "full-set",
    name: "Full Set",
    price: 200,
    contents: "3 plates · one of every form",
    includedGroups: [],
    includesComplimentaryGift: true,
    availability: "out-of-stock-at-capture",
  }),
  "fangju-yellow": Object.freeze({
    id: "full-set",
    name: "Full Set",
    price: 229,
    contents: "7 pieces · one of every form",
    includedGroups: [],
    includesComplimentaryGift: true,
  }),
});

export const getSeriesPrice = (seriesId, itemId) =>
  prices[`${seriesId}:${itemId}`] ?? null;

export const isComplimentaryGift = (seriesId, itemId) =>
  complimentaryGiftKeys.has(`${seriesId}:${itemId}`);

export const isComplimentaryGiftProductId = (productId) =>
  productId === "suhuo-ivory-handled-dip-2-5" ||
  productId === "suhuo-ivory-spoon";

export const getSeriesSetOffer = (seriesId) => setOffers[seriesId] ?? null;

export const calculateInternationalShipping = (subtotal) => {
  if (!Number.isFinite(subtotal) || subtotal < 0) return null;
  return subtotal >= shippingPolicy.freeShippingThreshold
    ? 0
    : shippingPolicy.standardInternationalShipping;
};

export const amountUntilFreeShipping = (subtotal) =>
  Math.max(0, shippingPolicy.freeShippingThreshold - subtotal);

export const calculateBagShipping = (items) => {
  if (!items.length || items.some((item) => !Number.isFinite(item.product.price))) return null;
  if (items.every((item) => item.product.freeShipping === true)) return 0;
  return calculateInternationalShipping(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
};
