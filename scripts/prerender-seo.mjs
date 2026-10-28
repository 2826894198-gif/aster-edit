#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCommerceReadiness, productTiers } from "../src/domain/catalog.js";
import { authorizedProductAssets } from "../src/domain/product-assets.js";
import { editorialTopics, getPageCopy } from "../src/content/site-copy.js";
import {
  getPageMetadata,
  getStructuredData,
  isRouteReadyForIndexing,
} from "../src/seo/metadata.js";
import { seoRoutes } from "../src/seo/routes.js";
import { SITE_ORIGIN_TOKEN, siteConfig } from "../src/seo/site-config.js";
import { getProductBySlug as getAsterProduct } from "../src/data/aster.js";
import { homeCollections, shopCollections } from "../src/data/aster-home.js";
import { routeRedirects } from "../src/seo/redirects.js";
import { createServer } from "vite";

const launchShopCollections = shopCollections.filter((collection) => collection.id !== "wanxiang");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "dist", "client");
const shell = await readFile(path.join(clientDir, "index.html"), "utf8");
const publicationMode =
  process.env.PUBLICATION_MODE === "production" ? "production" : "prototype";

// Vite transforms JSX only during this build step; production stays static.
const renderer = await createServer({
  server: { middlewareMode: true, watch: null, hmr: false },
  // This short-lived server only renders HTML; no browser dependency scan is
  // needed. Avoid racing/cancelling a client prebundle during renderer.close().
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
});
let fullAsterPages;
try {
  const { renderAsterPage } = await renderer.ssrLoadModule("/src/seo/aster-prerender.jsx");
  fullAsterPages = new Map(
    seoRoutes.filter((route) => route.group === "aster" && (isRouteReadyForIndexing(route) || ["aster-cup", "aster-crystal", "aster-vertex"].includes(route.type)))
      .map((route) => [route.path, renderAsterPage(route)]),
  );
} finally {
  await renderer.close();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSections(copy) {
  return copy.sections
    .map((section) =>
      [
        "<section>",
        `<h2>${escapeHtml(section.heading)}</h2>`,
        ...section.paragraphs.map(
          (paragraph) => `<p>${escapeHtml(paragraph)}</p>`,
        ),
        "</section>",
      ].join(""),
    )
    .join("");
}

function renderLinks(links, heading = "Useful next steps") {
  if (!links?.length) return "";

  return [
    '<nav aria-label="Related pages">',
    `<h2>${escapeHtml(heading)}</h2>`,
    "<ul>",
    ...links.map(
      (link) =>
        `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`,
    ),
    "</ul>",
    "</nav>",
  ].join("");
}

function renderRouteSupplement(route) {
  if (route.type === "collection") {
    return [
      "<section>",
      "<h2>Compare by piece count</h2>",
      "<ul>",
      ...productTiers.map(
        (product) =>
          `<li><a href="${product.url}">${escapeHtml(product.title)}</a> — Draft format only; exact contents and purchase terms are not published.</li>`,
      ),
      "</ul>",
      "</section>",
    ].join("");
  }

  if (route.path === "/pages/what-could-be-inside") {
    return [
      "<section>",
      "<h2>Authorized category examples</h2>",
      "<ul>",
      ...authorizedProductAssets.map(
        (asset) =>
          `<li><img src="${escapeHtml(asset.url)}" width="${asset.width}" height="${asset.height}" alt="${escapeHtml(asset.alt)}"><p>${escapeHtml(asset.label)}</p></li>`,
      ),
      "</ul>",
      "<p>These are authorized source examples for category exploration. They are not product-listing images or promised box contents.</p>",
      "</section>",
    ].join("");
  }

  if (route.type === "blog") {
    return [
      "<section>",
      "<h2>Planned topics</h2>",
      "<p>These are editorial briefs, not published articles.</p>",
      "<ul>",
      ...editorialTopics.map((topic) => `<li>${escapeHtml(topic)}</li>`),
      "</ul>",
      "</section>",
    ].join("");
  }

  return "";
}

function renderVerifiedOffer(product) {
  const readiness = getCommerceReadiness(product);
  if (!readiness.ready) return "";

  return [
    "<section>",
    "<h2>Verified purchase terms</h2>",
    `<p>${escapeHtml(new Intl.NumberFormat(siteConfig.defaultLocale, { style: "currency", currency: product.pricing.currency }).format(product.pricing.priceMinor / 100))}</p>`,
    `<p>${escapeHtml(product.inventory.availability)}</p>`,
    `<p>Ships to ${escapeHtml(product.shipping.markets.join(", "))} in ${product.shipping.handlingWindow.minDays + product.shipping.transitWindow.minDays}-${product.shipping.handlingWindow.maxDays + product.shipping.transitWindow.maxDays} days.</p>`,
    `<p><a href="${escapeHtml(product.returns.policyUrl)}">Returns within ${product.returns.windowDays} days</a></p>`,
    "</section>",
  ].join("");
}

function renderAsterCollections(collections) {
  return [
    "<ul>",
    ...collections.map((collection) =>
      `<li><a href="${escapeHtml(collection.path)}">${escapeHtml(collection.name)}</a> — ${escapeHtml(collection.description)} ${collection.count} mapped ${collection.count === 1 ? "form" : "forms"}.</li>`,
    ),
    "</ul>",
  ].join("");
}

function renderAsterFallback(route) {
  const wrap = (sections) => `<main data-prerendered-content>${sections.join("")}</main>`;
  if (route.path === "/") return wrap([
    "<h1>A table shaped by texture and form.</h1>",
    "<p>Aster Edit selects individual ceramic bowls, plates, cups and serving pieces by silhouette, surface and scale. Distinct forms can live together without requiring a fixed matching set.</p>",
    "<h2>Explore the collections</h2>",
    renderAsterCollections(homeCollections),
    '<p><a href="/shop">Shop all ceramic tableware</a> · <a href="/about">How Aster Edit chooses</a></p>',
  ]);
  if (route.path === "/shop") return wrap([
    "<h1>Shop the Archive</h1>",
    "<p>Explore ceramic bowls, plates, cups and serving pieces by collection, form and size. Each product page shows the mapped options and dimensions beside the purchase decision.</p>",
    renderAsterCollections(launchShopCollections),
    '<p><a href="/collections">Compare the six launch edits</a></p>',
  ]);
  if (route.path === "/collections") return wrap([
    "<h1>Collections</h1>",
    "<p>Compare six Aster Edit ceramic edits by form, colour and surface. Pale Ground offers an ivory base; Sunfold follows a fluted edge; Garden Shift, Petal Haze and Open Tide each give colour a different role; Citrus Note is one oval-plate study.</p>",
    renderAsterCollections(homeCollections),
    '<p>Waterline is an <a href="/products/waterline-blue-ceramics">additional blue ceramic archive</a>.</p>',
  ]);
  if (route.path === "/about") return wrap([
    "<h1>A table assembled by relationship, not sameness.</h1>",
    "<p>Aster Edit is a curator of ceramic tableware. We begin with the rim, depth, footprint and scale of an individual object, then consider how its form and surface can sit beside other pieces.</p>",
    "<p>Explore collections by their forms and dimensions, and choose one piece at a time. Aster Edit brings distinct objects together through proportion and surface.</p>",
    '<p><a href="/collections">Explore collections</a> · <a href="/shop">Shop by form</a></p>',
  ]);
  if (route.path === "/shipping-returns") return wrap([
    "<h1>Shipping &amp; Returns</h1>",
    "<h2>Shipping</h2><p>International shipping is $30 for a merchandise subtotal below $150. At $150 or more, shipping is free. Import duties, VAT, customs-processing charges or carrier fees may apply by destination and may be collected by the carrier or customs.</p>",
    '<h2>Returns and help</h2><p>Local statutory cancellation and faulty-item rights apply. For cancellation requests or an incorrect or damaged item, email <a href="mailto:support@example.test">support@example.test</a>.</p>',
    '<p><a href="/shop">Browse products</a></p>',
  ]);
  if (route.type === "aster-series") {
    const series = getAsterProduct(route.path.split("/")[2]);
    return wrap([
      `<p>${escapeHtml(series.eyebrow)}</p>`,
      `<h1>${escapeHtml(series.name)}</h1>`,
      `<p>${escapeHtml(series.description)}</p>`,
      series.story ? `<section><h2>${escapeHtml(series.story.title)}</h2><p>${escapeHtml(series.story.intro)}</p></section>` : "",
      "<section><h2>Choose a form and size</h2><ul>",
      ...series.items.map((item) => `<li>${escapeHtml(item.name)} — ${escapeHtml(item.dimensions)}${item.isComplimentaryGift ? " · Gift with a full set; not sold separately" : ""}${item.availability === "out-of-stock-at-capture" ? " · Archived as out of stock; current availability must be checked" : ""}</li>`),
      "</ul></section>",
      '<nav aria-label="Related pages"><a href="/collections">Compare collections</a> · <a href="/shipping-returns">Shipping and returns</a></nav>',
    ]);
  }
  if (route.type === "aster-concept") return wrap([
    `<h1>${escapeHtml(route.title.replace(/ \| Aster Edit$/, ""))}</h1>`,
    `<p>${escapeHtml(route.description)}</p>`,
    "<p>This is an unverified concept page. Browse the current mapped ceramic archive for available product choices.</p>",
    '<p><a href="/shop">Shop the archive</a></p>',
  ]);
  return wrap([
    `<h1>${escapeHtml(route.title.replace(/ \| Aster Edit$/, ""))}</h1>`,
    `<p>${escapeHtml(route.description)}</p>`,
    '<p><a href="/collections">Explore collections</a></p>',
  ]);
}

function renderFallback(route) {
  if (fullAsterPages.has(route.path)) return fullAsterPages.get(route.path);
  if (route.group === "aster") return renderAsterFallback(route);
  const product =
    route.type === "product"
      ? (productTiers.find((item) => item.id === route.productId) ?? null)
      : null;
  const copy = getPageCopy(route.path, product);

  if (!copy)
    return `<main data-prerendered-content><h1>${escapeHtml(route.title)}</h1><p>${escapeHtml(route.description)}</p></main>`;

  return [
    "<main data-prerendered-content>",
    `<p>${escapeHtml(copy.eyebrow)}</p>`,
    `<h1>${escapeHtml(copy.h1)}</h1>`,
    `<p>${escapeHtml(copy.intro)}</p>`,
    `<p><a href="${escapeHtml(copy.primaryAction.href)}">${escapeHtml(copy.primaryAction.label)}</a></p>`,
    product
      ? `<p>${product.pieceCount} pieces — draft format, not available for checkout.</p>`
      : "",
    renderSections(copy),
    renderRouteSupplement(route),
    product ? renderVerifiedOffer(product) : "",
    renderLinks(copy.relatedLinks),
    "</main>",
  ].join("");
}

function renderRoute(route) {
  const metadata = getPageMetadata(route.path, { publicationMode });
  const isAster = route.group === "aster";
  const title = isAster ? route.title : `${metadata.title} | surprise.`;
  const description = metadata.description;
  const graph = JSON.stringify(
    getStructuredData(route),
  ).replaceAll("<", "\\u003c");
  const head = [
    route.path === "/" && publicationMode === "production"
      ? '<meta name="google-site-verification" content="IQozvVjQaZPKaXarDLwkVQ09p83Y6en2ljZitIy3ubE">'
      : "",
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta name="robots" content="${metadata.robots}">`,
    `<link rel="canonical" href="${metadata.canonicalUrl}" data-canonical-path="${route.path}">`,
    `<meta property="og:type" content="${isAster ? "website" : metadata.openGraph.type}">`,
    `<meta property="og:title" content="${escapeHtml(isAster ? title : metadata.openGraph.title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${metadata.openGraph.url}">`,
    `<meta property="og:locale" content="${metadata.openGraph.locale}">`,
    `<meta property="og:site_name" content="${escapeHtml(isAster ? "Aster Edit" : metadata.openGraph.siteName)}">`,
    metadata.openGraph.image ? `<meta property="og:image" content="${escapeHtml(metadata.openGraph.image)}">` : "",
    metadata.openGraph.imageAlt ? `<meta property="og:image:alt" content="${escapeHtml(metadata.openGraph.imageAlt)}"><meta property="og:image:width" content="${metadata.openGraph.imageWidth}"><meta property="og:image:height" content="${metadata.openGraph.imageHeight}"><meta property="og:image:type" content="${metadata.openGraph.imageType}">` : "",
    `<meta name="twitter:card" content="${metadata.openGraph.twitterCard || "summary"}">`,
    `<meta name="twitter:title" content="${escapeHtml(isAster ? title : metadata.openGraph.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    metadata.openGraph.image ? `<meta name="twitter:image" content="${escapeHtml(metadata.openGraph.image)}">` : "",
    metadata.openGraph.imageAlt ? `<meta name="twitter:image:alt" content="${escapeHtml(metadata.openGraph.imageAlt)}">` : "",
    `<script type="application/ld+json">${graph}</script>`,
  ].join("\n    ");

  return shell
    .replace(/<html\b[^>]*>/i, `<html lang="${siteConfig.defaultLocale}">`)
    .replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${escapeHtml(title)}</title>\n    ${head}`,
    )
    .replace(
      /<div\s+id=["']root["']\s*><\/div>/i,
      `<div id="root">${renderFallback(route)}</div>`,
    );
}

for (const route of seoRoutes) {
  const relative =
    route.path === "/"
      ? "index.html"
      : path.join(route.path.slice(1), "index.html");
  const destination = path.join(clientDir, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, renderRoute(route));
}

for (const [oldPath, newPath] of Object.entries(routeRedirects)) {
  const destination = path.join(clientDir, oldPath.slice(1), "index.html");
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, [
    '<!doctype html><html lang="en"><head><meta charset="UTF-8">',
    '<meta name="robots" content="noindex,follow">',
    `<link rel="canonical" href="${SITE_ORIGIN_TOKEN}${newPath}">`,
    `<meta http-equiv="refresh" content="0;url=${newPath}">`,
    `<title>Moved | Aster Edit</title></head><body><p>This page moved to <a href="${newPath}">${newPath}</a>.</p></body></html>`,
  ].join(""));
}

const indexableRoutes =
  publicationMode === "production"
    ? seoRoutes.filter(isRouteReadyForIndexing)
    : [];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...indexableRoutes.map(
    (route) => `  <url><loc>${SITE_ORIGIN_TOKEN}${route.path}</loc>${route.lastModified ? `<lastmod>${route.lastModified}</lastmod>` : ""}${(route.imageUrls || []).map((image) => `<image:image><image:loc>${escapeHtml(new URL(image, SITE_ORIGIN_TOKEN).href)}</image:loc></image:image>`).join("")}</url>`,
  ),
  "</urlset>",
  "",
].join("\n");
await writeFile(path.join(clientDir, "sitemap.xml"), sitemap);

const robots =
  publicationMode === "production"
    ? `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN_TOKEN}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
await writeFile(path.join(clientDir, "robots.txt"), robots);

const productReadiness = productTiers.map((product) => ({
  id: product.id,
  url: product.url,
  ...getCommerceReadiness(product),
}));
await writeFile(
  path.join(clientDir, "seo-readiness.json"),
  `${JSON.stringify({ publicationMode, products: productReadiness }, null, 2)}\n`,
);
await writeFile(
  path.join(clientDir, "route-manifest.json"),
  `${JSON.stringify(
    seoRoutes.map(({ path: routePath, type, primaryIntent, intentStatus }) => ({
      path: routePath,
      type,
      primaryIntent,
      intentStatus,
    })),
    null,
    2,
  )}\n`,
);

const readyProducts =
  publicationMode === "production"
    ? productTiers.filter((product) => getCommerceReadiness(product).ready)
    : [];
const csvRows = [
  "id,title,description,link,image_link,availability,price",
  ...readyProducts.map((product) =>
    [
      product.id,
      product.title,
      product.description,
      `${SITE_ORIGIN_TOKEN}${product.url}`,
      new URL(product.images[0].url, SITE_ORIGIN_TOKEN).href,
      product.inventory.availability,
      `${(product.pricing.priceMinor / 100).toFixed(2)} ${product.pricing.currency}`,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  ),
];
await writeFile(
  path.join(clientDir, "merchant-feed.csv"),
  `${csvRows.join("\n")}\n`,
);

console.log(
  `Prerendered ${seoRoutes.length} routes in ${publicationMode} mode; ${readyProducts.length} products eligible for Merchant feed.`,
);
