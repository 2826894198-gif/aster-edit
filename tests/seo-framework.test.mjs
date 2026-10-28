import assert from "node:assert/strict";
import test from "node:test";
import { getCommerceReadiness, productTiers } from "../src/domain/catalog.js";
import { getClientHeadState } from "../src/seo/client-head.js";
import { getPageMetadata, getProductStructuredData, getQueryPolicy, getStructuredData } from "../src/seo/metadata.js";
import { seoRoutes } from "../src/seo/routes.js";

test("every planned route has one unique canonical path and primary intent", () => {
  assert.equal(new Set(seoRoutes.map((route) => route.path)).size, seoRoutes.length);
  assert.equal(new Set(seoRoutes.map((route) => route.primaryIntent)).size, seoRoutes.length);

  for (const route of seoRoutes) {
    const metadata = getPageMetadata(route.path);
    assert.ok(metadata.title);
    assert.ok(metadata.description);
    assert.equal(route.intentStatus, "unvalidated");
    assert.match(metadata.canonicalUrl, /^https:\/\/site-origin\.invalid\//);
  }
});

test("prototype pages are noindex by default", () => {
  for (const route of seoRoutes) {
    assert.equal(getPageMetadata(route.path).robots, "noindex,nofollow");
  }
});

test("production indexing includes the editorial paths, six ceramic series and approved crystal product", () => {
  const indexable = seoRoutes
    .filter((route) => getPageMetadata(route.path, { publicationMode: "production" }).robots === "index,follow")
    .map((route) => route.path);
  assert.ok(indexable.includes("/"));
  assert.ok(indexable.includes("/collections"));
  assert.ok(indexable.includes("/products/pale-ground-ivory-ceramics"));
  assert.equal(indexable.filter((path) => path.startsWith("/products/")).length, 7);
  assert.ok(indexable.includes("/products/prism-crystal-tumbler"));
  assert.ok(!indexable.includes("/cute"));
  assert.ok(!indexable.includes("/search"));
  assert.ok(!indexable.includes("/products/waterline-blue-ceramics"));
  assert.ok(!indexable.includes("/products/the-gathering-set"));
});

test("filter URLs canonicalize to the collection and pagination remains addressable", () => {
  const filtered = getQueryPolicy("https://shop.example/collections/mystery-tableware-box?piece_count=6&sort=price");
  assert.equal(filtered.indexable, false);
  assert.equal(filtered.canonicalPath, "/collections/mystery-tableware-box");

  const page = getQueryPolicy("https://shop.example/collections/mystery-tableware-box?page=2&utm_source=email");
  assert.equal(page.indexable, true);
  assert.equal(page.canonicalPath, "/collections/mystery-tableware-box?page=2");
});

test("client navigation keeps route metadata current and filtered pages out of the index", () => {
  const state = getClientHeadState(
    "https://shop.example/collections/mystery-tableware-box?piece_count=6&utm_source=email",
    { publicationMode: "production" },
  );

  assert.equal(state.route.type, "collection");
  assert.equal(state.robots, "noindex,follow");
  assert.equal(state.canonicalUrl, "https://shop.example/collections/mystery-tableware-box");
  assert.equal(state.openGraph.url, state.canonicalUrl);
  assert.match(JSON.stringify(state.structuredData), /https:\/\/shop\.example/);
});

test("draft products cannot leak Offer schema or Merchant data", () => {
  for (const product of productTiers) {
    assert.equal(getCommerceReadiness(product).ready, false);
    const route = seoRoutes.find((item) => item.productId === product.id);
    const schema = getStructuredData(route);
    assert.equal(schema["@graph"].some((node) => node["@type"] === "Product"), false);
  }
});

test("a fully verified product produces complete offer, shipping, and return data", () => {
  const product = {
    ...productTiers[0],
    status: "active",
    contentVerifiedAt: "2026-09-09T00:00:00Z",
    description: "Verified description",
    specifications: { ...productTiers[0].specifications, condition: "NewCondition" },
    pricing: { currency: "USD", priceMinor: 4900, originalValueMinor: 8000, verifiedAt: "2026-09-09T00:00:00Z" },
    images: [{
      url: "https://images.example/product.webp",
      assetPath: "/images/products/product.webp",
      sourceUrl: "https://source.example/post",
      rightsStatus: "authorized",
      provenance: { sourceNoteId: "verified-test-source" },
      alt: "Three tableware pieces",
      width: 1200,
      height: 1200,
    }],
    inventory: { availability: "InStock", quantity: 20, verifiedAt: "2026-09-09T00:00:00Z" },
    shipping: {
      markets: ["US"],
      handlingWindow: { minDays: 1, maxDays: 2 },
      transitWindow: { minDays: 3, maxDays: 5 },
      costMinor: 500,
      verifiedAt: "2026-09-09T00:00:00Z",
    },
    returns: {
      policyUrl: "/pages/shipping-returns",
      applicableCountries: ["US"],
      policyCategory: "MerchantReturnFiniteReturnWindow",
      windowDays: 30,
      method: "ReturnByMail",
      fees: "ReturnFeesCustomerResponsibility",
      verifiedAt: "2026-09-09T00:00:00Z",
    },
  };

  const schema = getProductStructuredData(product);
  assert.equal(schema.offers.price, "49.00");
  assert.equal(schema.offers.shippingDetails[0].shippingRate.value, "5.00");
  assert.equal(schema.offers.shippingDetails[0].deliveryTime.transitTime.maxValue, 5);
  assert.deepEqual(schema.offers.hasMerchantReturnPolicy.applicableCountry, ["US"]);
});
