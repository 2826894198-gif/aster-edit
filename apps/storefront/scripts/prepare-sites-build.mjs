#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function prepareSitesBuild(root) {
  const dist = path.join(root, "dist");
  const index = path.join(dist, "client", "index.html");
  const worker = path.join(root, "worker", "index.js");
  const hosting = path.join(root, ".openai", "hosting.json");
  for (const file of [index, worker]) {
    if (!existsSync(file)) throw new Error("Missing static build input: " + path.relative(root, file));
  }
  mkdirSync(path.join(dist, "server"), { recursive: true });
  copyFileSync(worker, path.join(dist, "server", "index.js"));
  if (!existsSync(hosting)) {
    console.log("Static build ready. Sites packaging skipped: no local .openai/hosting.json configuration.");
    return { platformPackaged: false };
  }
  mkdirSync(path.join(dist, ".openai"), { recursive: true });
  copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));
  console.log("Prepared optional Sites worker and explicitly supplied local hosting configuration.");
  return { platformPackaged: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareSitesBuild(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
}
