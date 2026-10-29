import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { seoRoutes } from "../src/seo/routes.js";
import { cupGestureImage } from "../src/data/cup-content.js";
import { cupColours, cupProducts, cupPath, cupPhoto, cupGallery, cupDetailImage } from "../src/data/cup.js";
import { catalogKeys } from "../src/aster/commerce.js";

const client = new URL("../dist/client/", import.meta.url);
const indexable = seoRoutes.filter((route) => route.group === "aster" && route.readyForIndexing);

test("every public Aster page serves the complete visible layout and crawlable navigation without JavaScript", async () => {
  assert.equal(indexable.length, 12);
  for (const route of indexable) {
    const html = await readFile(new URL(route.path === "/" ? "index.html" : `${route.path.slice(1)}/index.html`, client), "utf8");
    assert.match(html, /data-prerendered-content="full-page"/, route.path);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, route.path);
    assert.match(html, /<header class="aster-header"/, route.path);
    assert.match(html, /<footer class="aster-footer"/, route.path);
    assert.match(html, /https:\/\/commerce\.example\.test\/order-status\//, route.path);
    for (const next of indexable.filter((candidate) => candidate.path !== route.path && !candidate.path.startsWith("/products/"))) {
      assert.ok(html.includes(`href="${next.path}"`) || html.includes(`href="${next.path}#`), `${route.path} links to ${next.path}`);
    }
    assert.doesNotMatch(html, /"@type":"(?:Review|AggregateRating)"/);
    if (route.type !== "aster-crystal") assert.doesNotMatch(html, /"@type":"(?:Product|Offer)"/);
    else assert.match(html, /"price":"129.00"/);
    const images = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
    if (route.path !== "/shipping-returns") assert.ok(images.length > 0, route.path);
    for (const image of images) await access(new URL(image.slice(1), client));
    if (route.type === "aster-series") {
      assert.match(html, /aster-purchase-price/);
      assert.match(html, route.productId === "orange-peel-oval" ? /The Single Form/ : /The Complete(?:<br\/>|\s+)Series/i);
      assert.match(html, /series-page/);
    }
  }
});

test("sitemap uses stable content-change dates only for the intended public pages", async () => {
  const sitemap = await readFile(new URL("sitemap.xml", client), "utf8");
  // A default prototype build deliberately has an empty sitemap.
  if (!sitemap.includes("<url>")) return;
  assert.equal((sitemap.match(/<url>/g) || []).length, indexable.length);
  for (const route of indexable) {
    assert.ok(sitemap.includes(`<loc>https://site-origin.invalid${route.path}</loc><lastmod>${route.lastModified}</lastmod>`));
    assert.match(route.lastModified, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.doesNotMatch(sitemap, /cute|waterline|the-gathering-set|\/search</);
});

test("the cup exposes purchase actions with colour-specific catalogue records and preserves its image and index boundaries", async () => {
  const html = await readFile(new URL(`${cupPath.slice(1)}/index.html`, client), "utf8");
  assert.match(html, /data-prerendered-content="full-page"/);
  assert.match(html, /content="noindex,nofollow"/);
  assert.match(html, /Add to bag/);
  assert.match(html, /Buy now/);
  assert.match(html, /Free shipping/);
  assert.match(html, /Choose a colour to continue/);
  assert.doesNotMatch(html, /Not available to order yet/);
  assert.doesNotMatch(html, /Choose photographs or 3D view|3D STUDY|cup-model-viewer|<canvas/);
  assert.match(html, /\$75/);
  assert.doesNotMatch(html, /src="[^" ]*cup-photo-\d+\.jpg"/);
  const responsiveImages = JSON.parse(await readFile(new URL("../src/generated/responsive-images.json", import.meta.url), "utf8"));
  for (const source of [cupDetailImage, cupGestureImage]) {
    const image = responsiveImages[source];
    assert.ok(image, `Approved source retained: ${source}`);
    assert.ok(html.includes(image.variants.at(-1)[1]));
    for (const [, variant] of image.variants) await access(new URL(variant.slice(1), client));
  }
  await access(new URL(cupGestureImage.slice(1), client));
  assert.match(html, /Approximately 400ml/);
  assert.match(html, /Dishwasher suitable/);
  assert.match(html, /Microwave use is not recommended/);
  for (const chapter of ["cup-gesture", "cup-form", "cup-palette", "cup-care", "cup-questions"]) {
    assert.ok(html.includes(`id="${chapter}"`));
    assert.ok(html.includes(`href="#${chapter}"`));
  }
  assert.ok(html.includes('id="cup-bead"'), "Existing bead deep link remains available");
  for (const photo of cupGallery) await access(new URL(photo.src.slice(1), client));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.doesNotMatch(html, /"@type":"(?:Product|Offer|Review|AggregateRating)"/);
  for (const product of cupProducts) assert.equal(catalogKeys[product.id], product.catalogKey);
  assert.deepEqual(cupColours.map((colour) => colour.name), ["Purple-grey", "Olive", "Deep green"]);
  for (const colour of cupColours) {
    assert.ok(html.includes(colour.name));
    for (const frame of colour.frames) await access(new URL(cupPhoto(frame).slice(1), client));
  }
  const home = await readFile(new URL("index.html", client), "utf8");
  assert.ok(home.includes(`href="${cupPath}"`));
  assert.match(home, /aria-roledescription="carousel"/);
  const sitemap = await readFile(new URL("sitemap.xml", client), "utf8");
  assert.ok(!sitemap.includes(cupPath));
});
