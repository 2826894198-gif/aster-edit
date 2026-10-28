import test from "node:test";
import assert from "node:assert/strict";
import {
  asterEventPayload,
  asterSource,
  classifyAsterSource,
  trackAsterEvent,
} from "../src/analytics/aster-geo.js";

const location = { hostname: "asteredit.com", search: "" };

test("acquisition buckets use only a category, not a referrer or campaign value", () => {
  assert.equal(classifyAsterSource(location, "https://www.google.com/search?q=ceramics"), "organic_search");
  assert.equal(classifyAsterSource(location, "https://www.instagram.com/p/123"), "social");
  assert.equal(classifyAsterSource({ ...location, search: "?utm_source=private-partner&utm_medium=cpc" }), "paid_search");
  assert.equal(classifyAsterSource({ ...location, search: "?utm_source=private-partner" }), "campaign");
  assert.equal(classifyAsterSource(location, ""), "direct");
  const saved = new Map();
  const browser = {
    location: { ...location, search: "?utm_medium=organic" },
    document: { referrer: "" },
    sessionStorage: {
      getItem: (key) => saved.get(key),
      setItem: (key, value) => saved.set(key, value),
    },
    dataLayer: [],
  };
  assert.equal(asterSource(browser), "organic_search");
  browser.location.search = "";
  assert.equal(asterSource(browser), "organic_search");
  trackAsterEvent("add_to_cart", { id: "fangju-yellow-plate-8", name: "Sunfold · 8-inch Plate", price: 39 }, 2, browser);
  assert.equal(browser.dataLayer[0].ecommerce.items[0].item_id, "fangju-yellow-petal:05");
  assert.equal(JSON.stringify(browser.dataLayer).includes("private-partner"), false);
});

test("events only expose fixed catalog identifiers and bounded quantities", () => {
  assert.deepEqual(asterEventPayload("view_cart", null, 1, "invalid"), {
    event: "view_cart", source: "unknown", catalog_key: "", quantity: 1,
  });
  assert.deepEqual(asterEventPayload("add_to_cart", { id: "fangju-yellow-plate-8" }, 50, "direct"), {
    event: "add_to_cart", source: "direct", catalog_key: "fangju-yellow-petal:05", quantity: 20,
  });
  assert.throws(() => asterEventPayload("purchase", null, 1, "direct"));
});
