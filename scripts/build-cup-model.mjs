import fs from "node:fs/promises";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { createCupModel, cupModelEvidence } from "../src/aster/cup-model.js";

// Three's exporter uses FileReader; Node's Blob already exposes arrayBuffer.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
};
const model = createCupModel();
const data = await new GLTFExporter().parseAsync(model, { binary: true });
await fs.mkdir("public/models/aster", { recursive: true });
await fs.writeFile("public/models/aster/rolling-bead-cup-v1.glb", new Uint8Array(data));
await fs.writeFile("public/models/aster/rolling-bead-cup-v1-provenance.json", JSON.stringify({ ...cupModelEvidence, model: "rolling-bead-cup-v1.glb", sourceFolder: "User ceramic cup photographs, 2026-10-09", description: "Approximate exterior, hollow interior, rounded handle and rolling bead reconstructed from photographs. Not measured geometry or a scan. Colour and unseen pattern regions are illustrative." }, null, 2));
console.log(`Saved cup GLB (${data.byteLength} bytes)`);
