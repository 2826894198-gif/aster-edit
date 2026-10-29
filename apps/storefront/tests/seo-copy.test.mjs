import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getPageCopy } from "../src/content/site-copy.js";
import { productTiers } from "../src/domain/catalog.js";
import { seoRoutes } from "../src/seo/routes.js";

const root = fileURLToPath(new URL("../", import.meta.url));

function routeCopy(route) {
  const product = route.type === "product"
    ? productTiers.find((item) => item.id === route.productId)
    : null;
  return getPageCopy(route.path, product);
}

test("SEO copy gives every planned route its own useful title, H1, description, and body", () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const route of seoRoutes) {
    const copy = routeCopy(route);
    assert.ok(copy, `copy missing for ${route.path}`);
    assert.ok(copy.h1, `H1 missing for ${route.path}`);
    assert.ok(copy.intro, `intro missing for ${route.path}`);
    assert.ok(copy.sections.length, `body sections missing for ${route.path}`);
    assert.ok(copy.description.length >= 90 && copy.description.length <= 180, `description length is unsuitable for ${route.path}`);
    titles.add(copy.title);
    descriptions.add(copy.description);
  }

  assert.equal(titles.size, seoRoutes.length);
  assert.equal(descriptions.size, seoRoutes.length);
});

test("draft product copy is intent-specific without inventing an offer", () => {
  for (const product of productTiers) {
    const copy = getPageCopy(product.url, product);
    assert.match(copy.title, new RegExp(`${product.pieceCount}-Piece Mystery Tableware Box`));
    assert.match(copy.description, /Possible categories include plates, bowls, mugs, cups, or serveware/);
    assert.match(copy.description, /Exact contents and terms await verification/);
    assert.doesNotMatch(copy.description, /\b(?:price|shipping|returns|in stock|handmade|guaranteed|discount)\b/i);
  }
});

test("prerendered support pages retain meaningful crawlable copy while the prototype stays noindex", async () => {
  const route = seoRoutes.find((item) => item.path === "/pages/what-could-be-inside");
  const copy = routeCopy(route);
  const outputPath = path.join(root, "dist/client/pages/what-could-be-inside/index.html");
  const html = await readFile(outputPath, "utf8");

  assert.match(html, new RegExp(`<h1>${copy.h1.replaceAll("?", "\\?")}</h1>`));
  assert.match(html, /Authorized category examples/);
  assert.match(html, /content="noindex,nofollow"/);
  assert.doesNotMatch(html, /"@type":"Product"/);
});
