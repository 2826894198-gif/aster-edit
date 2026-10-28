import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { prepareSitesBuild } from "../scripts/prepare-sites-build.mjs";
import test from "node:test";
import worker from "../worker/index.js";

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("returns a noindex 404 shell for an unknown route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html"
            ? '<meta name="robots" content="index,follow"><link rel="canonical" href="https://site-origin.invalid/" data-canonical-path="/">'
            : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
            headers: { "content-type": "text/html" },
          });
        },
      },
    },
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
  assert.match(await response.text(), /noindex,follow/);
  assert.deepEqual(calls, [
    "/flow/step-two?source=share",
    "/flow/step-two/index.html",
    "/index.html",
  ]);
});

test("serves a prerendered route and personalizes its canonical origin", async () => {
  const html = [
    '<meta name="robots" content="index,follow">',
    '<link rel="canonical" href="https://site-origin.invalid/products/example" data-canonical-path="/products/example">',
    '<meta property="og:url" content="https://site-origin.invalid/products/example">',
  ].join("");

  const response = await worker.fetch(
    new Request("https://shop.example/products/example?utm_source=test", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => new Response(
          new URL(request.url).pathname === "/products/example/index.html" ? html : "missing",
          {
            status: new URL(request.url).pathname === "/products/example/index.html" ? 200 : 404,
            headers: { "content-type": "text/html" },
          },
        ),
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-robots-tag"), null);
  assert.match(await response.text(), /https:\/\/shop\.example\/products\/example/);
});

test("keeps collection filters stable but out of the index", async () => {
  const html = [
    '<meta name="robots" content="index,follow">',
    '<link rel="canonical" href="https://site-origin.invalid/collections/mystery-tableware-box" data-canonical-path="/collections/mystery-tableware-box">',
    '<meta property="og:url" content="https://site-origin.invalid/collections/mystery-tableware-box">',
  ].join("");

  const response = await worker.fetch(
    new Request("https://shop.example/collections/mystery-tableware-box?piece_count=6&sort=price", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => new Response(
          new URL(request.url).pathname.endsWith("/index.html") ? html : "missing",
          {
            status: new URL(request.url).pathname.endsWith("/index.html") ? 200 : 404,
            headers: { "content-type": "text/html" },
          },
        ),
      },
    },
  );

  assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
  const body = await response.text();
  assert.match(body, /content="noindex,follow"/);
  assert.match(body, /href="https:\/\/shop\.example\/collections\/mystery-tableware-box"/);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("static packaging works without private platform configuration", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "storefront-static-demo-"));
  try {
    await mkdir(path.join(root, "dist/client"), { recursive: true });
    await mkdir(path.join(root, "worker"), { recursive: true });
    await writeFile(path.join(root, "dist/client/index.html"), "<h1>Demo</h1>");
    await writeFile(path.join(root, "worker/index.js"), "export default {};\n");
    assert.equal(prepareSitesBuild(root).platformPackaged, false);
    assert.equal(await readFile(path.join(root, "dist/server/index.js"), "utf8"), "export default {};\n");
    await assert.rejects(access(path.join(root, "dist/.openai/hosting.json")), { code: "ENOENT" });
    await mkdir(path.join(root, ".openai"), { recursive: true });
    await writeFile(path.join(root, ".openai/hosting.json"), '{"demo":true}');
    assert.equal(prepareSitesBuild(root).platformPackaged, true);
    assert.equal(await readFile(path.join(root, "dist/.openai/hosting.json"), "utf8"), '{"demo":true}');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

