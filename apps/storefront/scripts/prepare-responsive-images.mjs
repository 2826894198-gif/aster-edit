import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

// Original photographs remain untouched. A content digest gives every derivative
// an immutable URL, so replacing a photograph cannot leave a stale browser copy.
const root = process.cwd();
const input = path.join(root, "public/images/aster");
const output = path.join(root, "public/images/aster/optimized");
const manifest = {};
const widths = [480, 800, 1280, 1920];
const excluded = new Set(["optimized", "source-archive"]);
let originals = 0, derivatives = 0;
async function walk(directory) {
  for (const file of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, file.name);
    if (file.isDirectory()) {
      if (!excluded.has(file.name)) await walk(full);
      continue;
    }
    if (!file.isFile() || !/\.(png|jpe?g|webp)$/i.test(file.name)) continue;
    const source = await fs.readFile(full);
    const meta = await sharp(source).metadata();
    if (!meta.width || !meta.height || meta.pages > 1) continue;
    const digest = createHash("sha256").update(source).update("webp-q86-v1").digest("hex").slice(0, 16);
    const sizes = [...new Set(widths.map(w => Math.min(w, meta.width)))];
    const variants = [];
    for (const width of sizes) {
      const filename = `${digest}-${width}.webp`;
      const target = path.join(output, filename);
      try { await fs.access(target); } catch {
        await sharp(source).rotate().resize({width,withoutEnlargement:true}).webp({quality:86,effort:5,smartSubsample:true}).toFile(target);
      }
      variants.push([width, `/images/aster/optimized/${filename}`]);
      derivatives += (await fs.stat(target)).size;
    }
    manifest["/" + path.relative(path.join(root, "public"), full).split(path.sep).join("/")] = {width:meta.width,height:meta.height,variants};
    originals += source.length;
  }
}
await fs.mkdir(output, {recursive:true});
await walk(input);
await fs.mkdir(path.join(root,"src/generated"), {recursive:true});
await fs.writeFile(path.join(root,"src/generated/responsive-images.json"), JSON.stringify(manifest) + "\n");
console.log(JSON.stringify({images:Object.keys(manifest).length,originalBytes:originals,allVariantBytes:derivatives}));
