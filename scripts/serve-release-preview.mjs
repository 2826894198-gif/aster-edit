// Loopback only. Serve the real built HTML with the same origin substitution as hosting.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routeRedirects } from "../src/seo/redirects.js";
const root = fileURLToPath(new URL("../dist/client/", import.meta.url));
const origin = "http://127.0.0.1:5191";
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff": "font/woff", ".woff2": "font/woff2" };
createServer(async (req, res) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const url = new URL(req.url, origin);
    const pathname = decodeURIComponent(url.pathname);
    const target = routeRedirects[pathname.replace(/\/$/, "")];
    if (target) { res.writeHead(301, { Location: target + url.search }); res.end(); return; }
    const relative = path.extname(pathname) ? pathname : path.join(pathname, "index.html");
    const file = path.resolve(root, "." + (relative.startsWith("/") ? relative : "/" + relative));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const ext = path.extname(file);
    let body = await readFile(file);
    if ([".html", ".xml", ".txt", ".json"].includes(ext)) body = Buffer.from(body.toString("utf8")
      .replaceAll("https://site-origin.invalid", origin)
      .replaceAll("https://commerce.example.test", "http://127.0.0.1:8088"));
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Local preview page not found."); }
}).listen(5191, "127.0.0.1", () => console.log(`Built SEO preview: ${origin}`));
