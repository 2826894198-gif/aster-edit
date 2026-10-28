import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { existsSync } from "node:fs";
import { homeObjects, shopCollections } from "../src/data/aster-home.js";
import { archivedSeries } from "../src/data/aster-series.js";
import { filterSearchEntries, searchEntries } from "../src/aster/search-index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const headingText = (html) => html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]
  .replace(/<br\s*\/?\s*>/g, " ").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

test("Aster catalogue keeps six launch series and Waterline as a separate archive", () => {
  assert.equal(shopCollections.length, 7);
  assert.equal(
    shopCollections.reduce((total, series) => total + series.count, 0),
    46,
  );
  for (const series of archivedSeries) {
    const collection = shopCollections.find((entry) => entry.path === `/products/${series.slug}`);
    assert.equal(collection?.count, series.items.length, `${series.slug} count must match its mapped pieces`);
  }
  assert.ok(shopCollections.some((series) => series.id === "wanxiang"));
  assert.equal(homeObjects.length, 8);
  assert.ok(homeObjects.some((item) => item.id === "wanxiang-deep-plate"));
});

test("search covers collections and exact piece links without including standalone gifts", () => {
  assert.equal(searchEntries.filter((entry) => entry.kind === "Collection").length, 7);
  assert.ok(searchEntries.some((entry) => entry.href === "/products/open-tide-blue-plates?piece=plate-10-5"));
  assert.ok(filterSearchEntries("blue plate").some((entry) => entry.href.endsWith("?piece=plate-10-5")));
  assert.ok(filterSearchEntries("Mood Ocean").some((entry) => entry.href.startsWith("/products/open-tide-blue-plates")));
  assert.ok(!searchEntries.some((entry) => /Complimentary Handled Dip Dish|Spoon/.test(entry.title)));
});

test("Aster concept routes prerender with distinct metadata and no commerce schema", async () => {
  const home = await readFile(
    new URL("../dist/client/index.html", import.meta.url),
    "utf8",
  );
  const detail = await readFile(
    new URL(
      "../dist/client/products/the-gathering-set/index.html",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(home, /<title>Curated Ceramic Tableware &amp; Fidget Mug \| Aster Edit<\/title>/);
  assert.equal(headingText(home), "A little pause, in your hands.");
  assert.doesNotMatch(home, /Mystery Tableware Box/);
  assert.match(detail, /<title>The Gathering Set \| Aster Edit<\/title>/);
  assert.match(detail, /<h1>The Gathering Set<\/h1>/);
  assert.match(detail, /content="noindex,nofollow"/);
  assert.doesNotMatch(detail, /"@type":"(?:Product|Offer)"/);
});

test("source-backed Aster archive lines retain exact SKU provenance and prerender safely", {skip: !existsSync("素材库") && "Private original source library is intentionally excluded from the public demo."}, async () => {
  assert.equal(archivedSeries.length, 6);
  assert.equal(
    archivedSeries.reduce((total, series) => total + series.items.length, 0),
    38,
  );

  for (const series of archivedSeries) {
    assert.match(series.sourceUrl, /^https:\/\//);
    assert.ok(series.sourceArchive.endsWith("/商品档案.json"));
    assert.ok(series.items.length > 0);

    const html = await readFile(
      path.join(root, "dist", "client", "products", series.slug, "index.html"),
      "utf8",
    );

    assert.equal(headingText(html), series.name);
    assert.match(html, /content="(?:index,follow|noindex,nofollow)"/);
    assert.match(html, /Choose your piece/);
    assert.match(html, new RegExp(series.items.find((item) => !item.isComplimentaryGift).name));
    assert.doesNotMatch(html, /"@type":"(?:Product|Offer)"/);

    const oldHtml = await readFile(
      path.join(root, "dist", "client", "products", series.legacySlug, "index.html"),
      "utf8",
    );
    assert.match(oldHtml, /content="noindex,follow"/);
    assert.match(oldHtml, new RegExp(`/products/${series.slug}`));

    const browserAssetUrls = [
      series.image,
      series.story.hero,
      series.story.morning,
      series.story.midday,
      series.story.gathering,
      series.story.texture,
      series.story.approach,
      ...series.items.flatMap((item) =>
        [item.image, item.detailImage].filter(Boolean),
      ),
    ];
    for (const assetUrl of browserAssetUrls) {
      assert.doesNotMatch(assetUrl, /%2B/i);
    }

    for (const item of series.items) {
      assert.match(item.purchaseUrl, /^https:\/\//);
      assert.ok(item.sourceSpecification);
      assert.ok(item.sourceImagePath);
      assert.ok(item.dimensions);
      await access(path.join(root, "素材库", item.sourceImagePath));
      await access(
        path.join(
          root,
          "public",
          "images",
          "aster",
          "source-archive",
          item.sourceImagePath,
        ),
      );
    }
  }
});
