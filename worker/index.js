const SITE_ORIGIN_TOKEN = "https://site-origin.invalid";
const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "ttclid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);
const FILTER_PARAMS = new Set(["category", "piece_count", "sort"]);

function queryPolicy(url) {
  let page = null;
  let shouldNoindex = false;

  for (const [key, value] of url.searchParams) {
    if (TRACKING_PARAMS.has(key)) continue;
    if (FILTER_PARAMS.has(key)) {
      shouldNoindex = true;
      continue;
    }
    if (key === "page" && /^\d+$/.test(value) && Number(value) > 1) {
      page = Number(value);
      continue;
    }
    shouldNoindex = true;
  }

  const normalizedPath = url.pathname !== "/" ? url.pathname.replace(/\/+$/, "") : "/";
  const canonical = new URL(normalizedPath, url.origin);
  if (page && !shouldNoindex) canonical.searchParams.set("page", String(page));
  return { canonical: canonical.href, shouldNoindex };
}

function copyHeaders(response) {
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return headers;
}

async function personalizeTextResponse(response, request, status = response.status) {
  const headers = copyHeaders(response);
  const contentType = headers.get("content-type") ?? "";
  const isText = /text\/html|text\/plain|text\/csv|application\/xml|text\/xml/.test(contentType);

  if (!isText || request.method === "HEAD") {
    return new Response(request.method === "HEAD" ? null : response.body, { status, headers });
  }

  const url = new URL(request.url);
  let body = (await response.text()).replaceAll(SITE_ORIGIN_TOKEN, url.origin);

  if (contentType.includes("text/html")) {
    const policy = queryPolicy(url);
    body = body.replace(
      /<link rel="canonical" href="[^"]*" data-canonical-path="[^"]*">/,
      `<link rel="canonical" href="${policy.canonical}">`,
    );
    body = body.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${policy.canonical}">`);

    if (policy.shouldNoindex || status === 404) {
      body = body.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex,follow">');
      headers.set("x-robots-tag", "noindex, follow");
    }
  }

  return new Response(body, { status, headers });
}

function isHtmlNavigation(request) {
  return ["GET", "HEAD"].includes(request.method)
    && request.headers.get("accept")?.includes("text/html");
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return personalizeTextResponse(response, request);
    if (!isHtmlNavigation(request)) return response;

    const url = new URL(request.url);
    const hasExtension = /\/[^/]+\.[^/]+$/.test(url.pathname);

    if (!hasExtension) {
      const routeIndexUrl = new URL(request.url);
      routeIndexUrl.pathname = `${url.pathname.replace(/\/$/, "") || ""}/index.html`;
      routeIndexUrl.search = "";
      const routeResponse = await env.ASSETS.fetch(new Request(routeIndexUrl, request));
      if (routeResponse.status !== 404) return personalizeTextResponse(routeResponse, request);
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    const fallback = await env.ASSETS.fetch(new Request(indexUrl, request));
    return personalizeTextResponse(fallback, request, 404);
  },
};
