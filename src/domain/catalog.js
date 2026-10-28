import { productAssetLibrary } from "./product-assets.js";
import { getDraftProductCopy } from "../content/site-copy.js";

const POSSIBLE_CATEGORIES = Object.freeze([
  "plates",
  "bowls",
  "mugs",
  "cups",
  "serveware",
]);
const AVAILABILITY_VALUES = new Set(["InStock", "OutOfStock", "PreOrder", "BackOrder"]);
const CONDITION_VALUES = new Set(["NewCondition", "UsedCondition", "RefurbishedCondition"]);
const RETURN_POLICY_VALUES = new Set([
  "MerchantReturnFiniteReturnWindow",
  "MerchantReturnNotPermitted",
  "MerchantReturnUnlimitedWindow",
]);
const RETURN_METHOD_VALUES = new Set(["ReturnByMail", "ReturnInStore", "ReturnAtKiosk"]);
const RETURN_FEE_VALUES = new Set(["FreeReturn", "ReturnFeesCustomerResponsibility", "ReturnShippingFees"]);

function isDayWindow(value) {
  return value
    && Number.isInteger(value.minDays)
    && Number.isInteger(value.maxDays)
    && value.minDays >= 0
    && value.maxDays >= value.minDays;
}

function createDraftTier(pieceCount) {
  const handle = `${pieceCount}-piece-mystery-tableware-box`;
  const copy = getDraftProductCopy(pieceCount);

  return Object.freeze({
    id: `mystery-box-${pieceCount}`,
    handle,
    url: `/products/${handle}`,
    title: copy.title,
    pieceCount,
    status: "draft",
    contentVerifiedAt: null,
    description: copy.description,
    possibleCategories: POSSIBLE_CATEGORIES,
    specifications: Object.freeze({
      materials: Object.freeze([]),
      condition: null,
      dimensions: null,
    }),
    pricing: Object.freeze({
      currency: null,
      priceMinor: null,
      originalValueMinor: null,
      verifiedAt: null,
    }),
    images: Object.freeze([]),
    inventory: Object.freeze({
      availability: "unknown",
      quantity: null,
      verifiedAt: null,
    }),
    shipping: Object.freeze({
      markets: Object.freeze([]),
      handlingWindow: null,
      transitWindow: null,
      costMinor: null,
      verifiedAt: null,
    }),
    returns: Object.freeze({
      policyUrl: null,
      applicableCountries: Object.freeze([]),
      policyCategory: null,
      windowDays: null,
      method: null,
      fees: null,
      verifiedAt: null,
    }),
  });
}

export const productTiers = Object.freeze([3, 6, 12].map(createDraftTier));

export const catalogEvidence = productAssetLibrary;

export function getProductByHandle(handle) {
  return productTiers.find((product) => product.handle === handle) ?? null;
}

export function getCommerceReadiness(product) {
  const issues = [];

  if (product.status !== "active") issues.push("product status is not active");
  if (!product.contentVerifiedAt) issues.push("product copy is not verified");
  if (!/^[A-Z]{3}$/.test(product.pricing.currency ?? "")) issues.push("currency is missing or invalid");
  if (!Number.isInteger(product.pricing.priceMinor) || product.pricing.priceMinor <= 0) issues.push("price is missing or invalid");
  if (!Number.isInteger(product.pricing.originalValueMinor) || product.pricing.originalValueMinor <= 0) issues.push("original value is missing or invalid");
  if (!product.pricing.verifiedAt) issues.push("price is not verified");
  if (!product.images.length) issues.push("authorized product image is missing");
  if (product.images.some((image) => (
    !image.url
    || !image.assetPath
    || !image.sourceUrl
    || image.rightsStatus !== "authorized"
    || !image.provenance
    || !image.alt
    || !image.width
    || !image.height
  ))) {
    issues.push("image metadata is incomplete");
  }
  if (!AVAILABILITY_VALUES.has(product.inventory.availability)) issues.push("availability is missing or invalid");
  if (!product.inventory.verifiedAt) issues.push("inventory is not verified");
  if (!CONDITION_VALUES.has(product.specifications.condition)) issues.push("item condition is missing or invalid");
  if (!product.shipping.markets.length || product.shipping.markets.some((country) => !/^[A-Z]{2}$/.test(country))) issues.push("shipping markets are missing or invalid");
  if (!isDayWindow(product.shipping.handlingWindow)) issues.push("handling window is missing or invalid");
  if (!isDayWindow(product.shipping.transitWindow)) issues.push("transit window is missing or invalid");
  if (!Number.isInteger(product.shipping.costMinor) || product.shipping.costMinor < 0) issues.push("shipping cost is missing or invalid");
  if (!product.shipping.verifiedAt) issues.push("shipping terms are not verified");
  if (!product.returns.policyUrl) issues.push("return policy URL is missing");
  if (!product.returns.applicableCountries.length || product.returns.applicableCountries.some((country) => !/^[A-Z]{2}$/.test(country))) issues.push("return countries are missing or invalid");
  if (!RETURN_POLICY_VALUES.has(product.returns.policyCategory)) issues.push("return policy category is missing or invalid");
  if (product.returns.policyCategory === "MerchantReturnFiniteReturnWindow"
    && (!Number.isInteger(product.returns.windowDays) || product.returns.windowDays < 0)) {
    issues.push("return window is missing or invalid");
  }
  if (!RETURN_METHOD_VALUES.has(product.returns.method)) issues.push("return method is missing or invalid");
  if (!RETURN_FEE_VALUES.has(product.returns.fees)) issues.push("return fees are missing or invalid");
  if (!product.returns.verifiedAt) issues.push("return terms are not verified");

  return Object.freeze({ ready: issues.length === 0, issues: Object.freeze(issues) });
}
