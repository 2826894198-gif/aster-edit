import { getPageMetadata, getQueryPolicy, getStructuredData } from "./metadata.js";
import { getRoute } from "./routes.js";
import { siteConfig } from "./site-config.js";

const MANAGED_ATTRIBUTE = "data-client-seo";

export function getClientHeadState(input, { publicationMode = "prototype" } = {}) {
  const url = input instanceof URL ? input : new URL(input, siteConfig.origin);
  const route = getRoute(url.pathname);

  if (!route) {
    return Object.freeze({
      route: null,
      title: "Page not found",
      description: "The requested page could not be found.",
      robots: "noindex,follow",
      canonicalUrl: new URL(url.pathname, url.origin).href,
      openGraph: null,
      structuredData: null,
    });
  }

  const metadata = getPageMetadata(route.path, { publicationMode });
  const queryPolicy = getQueryPolicy(url);
  const canonicalUrl = new URL(queryPolicy.canonicalPath, url.origin).href;
  const robots = queryPolicy.indexable ? metadata.robots : "noindex,follow";
  const structuredData = JSON.parse(
    JSON.stringify(getStructuredData(route)).replaceAll(siteConfig.origin, url.origin),
  );

  return Object.freeze({
    route,
    title: route.group === "cute" ? `${metadata.title} | surprise.` : metadata.title,
    description: metadata.description,
    robots,
    canonicalUrl,
    openGraph: Object.freeze({ ...metadata.openGraph, url: canonicalUrl,
      image: metadata.openGraph.image?.replaceAll(siteConfig.origin, url.origin) || null }),
    structuredData,
  });
}

function upsertMeta(document, selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(MANAGED_ATTRIBUTE, "");
    document.head.append(element);
  }
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
}

function upsertCanonical(document, href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    element.setAttribute(MANAGED_ATTRIBUTE, "");
    document.head.append(element);
  }
  element.setAttribute("href", href);
}

export function applyClientHead(document, input, options) {
  const state = getClientHeadState(input, options);
  document.title = state.title;
  upsertMeta(document, 'meta[name="description"]', { name: "description", content: state.description });
  upsertMeta(document, 'meta[name="robots"]', { name: "robots", content: state.robots });
  upsertCanonical(document, state.canonicalUrl);

  if (state.openGraph) {
    const fields = {
      "og:type": state.openGraph.type,
      "og:title": state.openGraph.title,
      "og:description": state.openGraph.description,
      "og:url": state.openGraph.url,
      "og:locale": state.openGraph.locale,
      "og:site_name": state.openGraph.siteName,
      ...(state.openGraph.image ? { "og:image": state.openGraph.image } : {}),
      ...(state.openGraph.imageAlt ? { "og:image:alt": state.openGraph.imageAlt, "og:image:width": state.openGraph.imageWidth, "og:image:height": state.openGraph.imageHeight, "og:image:type": state.openGraph.imageType } : {}),
    };
    for (const [property, content] of Object.entries(fields)) {
      upsertMeta(document, `meta[property="${property}"]`, { property, content });
    }
    for (const property of ["og:image:alt", "og:image:width", "og:image:height", "og:image:type"]) {
      if (!(property in fields)) document.head.querySelectorAll(`meta[property="${property}"]`).forEach((element) => element.remove());
    }
    const twitterFields = {
      "twitter:card": state.openGraph.twitterCard || "summary",
      "twitter:title": state.openGraph.title,
      "twitter:description": state.openGraph.description,
      ...(state.openGraph.image ? { "twitter:image": state.openGraph.image } : {}),
      ...(state.openGraph.imageAlt ? { "twitter:image:alt": state.openGraph.imageAlt } : {}),
    };
    for (const [name, content] of Object.entries(twitterFields)) {
      upsertMeta(document, `meta[name="${name}"]`, { name, content });
    }
    if (!state.openGraph.imageAlt) document.head.querySelectorAll('meta[name="twitter:image:alt"]').forEach((element) => element.remove());
    if (!state.openGraph.image) document.head.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((element) => element.remove());
  } else {
    document.head.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach((element) => element.remove());
  }

  const scripts = [...document.head.querySelectorAll('script[type="application/ld+json"]')];
  let script = scripts.shift();
  scripts.forEach((element) => element.remove());
  if (state.structuredData) {
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(MANAGED_ATTRIBUTE, "");
      document.head.append(script);
    }
    script.setAttribute(MANAGED_ATTRIBUTE, "");
    script.textContent = JSON.stringify(state.structuredData);
  } else {
    script?.remove();
  }

  return state;
}
