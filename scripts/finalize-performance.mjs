import fs from "node:fs/promises";
import path from "node:path";

// Discover Vite's versioned filenames rather than hardcoding font hashes.
const directory = path.resolve("dist/client");
const assets = await fs.readdir(path.join(directory,"assets"));
const fonts = ["inter-latin-400-normal-", "cormorant-garamond-latin-600-normal-"]
  .map(prefix => assets.find(name => name.startsWith(prefix) && name.endsWith(".woff2")))
  .filter(Boolean);
async function walk(dir) {
  for (const file of await fs.readdir(dir,{withFileTypes:true})) {
    const target=path.join(dir,file.name);
    if(file.isDirectory()) { await walk(target); continue; }
    if(!file.name.endsWith(".html")) continue;
    const html=await fs.readFile(target,"utf8");
    if(!html.includes('class="aster-site"')) continue;
    const preload=fonts.map(font=>`<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin>`).join("");
    await fs.writeFile(target,html.replace("</head>",preload+"</head>"));
  }
}
await walk(directory);
