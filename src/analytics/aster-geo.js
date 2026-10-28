import { catalogKeys, commerceConfig } from "../aster/commerce.js";

const SOURCE_KEY = "aster.acquisition.source.v1";
const SOURCES = new Set([
  "direct", "organic_search", "paid_search", "social", "email", "referral", "campaign", "unknown",
]);
const EVENTS = new Set([
  "view_item_list", "view_item", "select_item", "add_to_cart", "view_cart",
]);
const SEARCH_HOSTS = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|baidu\.com|yandex\.[a-z.]+)$/i;
const SOCIAL_HOSTS = /(^|\.)(instagram\.com|facebook\.com|pinterest\.[a-z.]+|tiktok\.com|xiaohongshu\.com|x\.com|twitter\.com)$/i;

export function classifyAsterSource(location, referrer = "") {
  const query = new URLSearchParams(location.search || "");
  const medium = (query.get("utm_medium") || "").toLowerCase();
  if (/^(cpc|ppc|paidsearch|paid_search)$/.test(medium)) return "paid_search";
  if (/^(organic|seo)$/.test(medium)) return "organic_search";
  if (/^(email|newsletter)$/.test(medium)) return "email";
  if (/^(social|paid_social)$/.test(medium)) return "social";
  if (query.has("utm_source") || query.has("utm_campaign")) return "campaign";
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname;
    if (host === location.hostname || host === "www.asteredit.com") return "direct";
    if (SEARCH_HOSTS.test(host)) return "organic_search";
    if (SOCIAL_HOSTS.test(host)) return "social";
    return "referral";
  } catch {
    return "unknown";
  }
}

export function asterSource(browser = window) {
  try {
    const stored = browser.sessionStorage.getItem(SOURCE_KEY);
    if (SOURCES.has(stored)) return stored;
    const source = classifyAsterSource(browser.location, browser.document.referrer);
    browser.sessionStorage.setItem(SOURCE_KEY, source);
    return source;
  } catch {
    return classifyAsterSource(browser.location, browser.document?.referrer);
  }
}

export function asterEventPayload(event, product = null, quantity = 1, source = "unknown") {
  if (!EVENTS.has(event)) throw new Error(`Unsupported Aster event: ${event}`);
  const catalogKey = product ? catalogKeys[product.id] : undefined;
  return {
    event,
    source: SOURCES.has(source) ? source : "unknown",
    catalog_key: catalogKey || "",
    quantity: Number.isInteger(quantity) ? Math.min(20, Math.max(1, quantity)) : 1,
  };
}

export function trackAsterEvent(event, product = null, quantity = 1, browser = window) {
  const payload = asterEventPayload(event, product, quantity, asterSource(browser));
  browser.dataLayer = browser.dataLayer || [];
  browser.dataLayer.push({
    event: payload.event,
    aster_source: payload.source,
    ecommerce: {
      currency: "USD",
      items: payload.catalog_key ? [{
        item_id: payload.catalog_key,
        item_name: product.name,
        quantity: payload.quantity,
        ...(Number.isFinite(product.price) ? { price: product.price } : {}),
      }] : [],
    },
  });
  const commerce = commerceConfig(browser.location);
  if (commerce && browser.fetch) {
    // The endpoint saves only daily aggregate counts. It never receives a URL,
    // referrer, customer identifier, bag token, email or raw UTM value.
    browser.fetch(`${commerce.origin}/wp-json/aster/v1/geo-events`, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  return payload;
}
