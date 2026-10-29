import * as THREE from "three";

// Normalized proportions estimated from the user's front, top and base photos.
// This is a visual reconstruction, not a measured manufacturing/AR model.
export const cupModelEvidence = {
  sources: [5137, 5138, 5139, 5140, 5141, 5142, 5143, 5144, 5145, 5146, 5147, 5148, 5149],
  units: "normalized, not real-world dimensions",
  bodyHeight: 3,
  rimRadius: 1.085,
  ribs: 7,
  beadCenter: [1.64, 2.745, 0],
  beadRadius: 0.235,
};

const palettes = {
  "purple-grey": { body: "#635967", groove: "#654d52", inside: "#4e4756" },
  olive: { body: "#64664c", groove: "#79755a", inside: "#4f543e" },
  "deep-green": { body: "#43594e", groove: "#4e5a4b", inside: "#34493f" },
};
const grain = (x, y, z) => {
  const n = Math.sin(x * 147.13 + y * 321.7 + z * 278.31) * 43758.5453;
  return n - Math.floor(n);
};

export function applyCupColour(group, colourId) {
  const palette = palettes[colourId] || palettes["deep-green"];
  const base = new THREE.Color(palette.body), groove = new THREE.Color(palette.groove);
  group.traverse(mesh => {
    if (!mesh.isMesh || !mesh.name.startsWith("Glaze_")) return;
    const positions = mesh.geometry.getAttribute("position"), colours = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const isBody = mesh.name === "Glaze_Body";
      const band = isBody && y > .22 && y < 2.78 ? Math.pow((1 + Math.cos(((y - .22) / 2.56) * Math.PI * 14)) / 2, 7) : 0;
      const shade = new THREE.Color(mesh.name === "Glaze_Interior" ? palette.inside : palette.body);
      if (isBody) shade.copy(base).lerp(groove, band * .65);
      shade.multiplyScalar(.92 + grain(x, y, z) * .16);
      colours.set([shade.r, shade.g, shade.b], i * 3);
    }
    mesh.geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    mesh.material.vertexColors = true;
    mesh.material.color.set(0xffffff);
    mesh.material.needsUpdate = true;
  });
}

function lathe(points) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), 128);
}

function outerBody() {
  const points = [[0, .11], [.82, .11], [.9, .08], [.94, .15], [.946, .22]];
  for (let i = 1; i <= 144; i++) {
    const t = i / 144, y = .22 + t * 2.56;
    const radius = .945 + .114 * t + .032 * Math.sin(t * Math.PI * 14);
    points.push([radius, y]);
  }
  points.push([1.07, 2.85], [1.09, 2.94], [1.085, 3], [1.055, 3.015], [1.023, 2.995]);
  return lathe(points);
}

function innerBody() {
  // Smooth hollow interior closes at its own floor, below the rim.
  const points = [[1.023, 2.995]];
  for (let i = 0; i <= 72; i++) {
    const t = i / 72;
    points.push([1.021 - .145 * t, 2.97 - 2.6 * t]);
  }
  points.push([.85, .31], [.79, .27], [.66, .25], [.4, .245], [0, .245]);
  return lathe(points);
}

function handleGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    [1, 2.645, 0], [1.40, 2.645, 0], [1.70, 2.645, 0], [2.02, 2.40, 0], [2.13, 2.17, 0],
    [2.20, 1.66, 0], [2.09, 1.14, 0], [1.78, .76, 0], [1.015, .61, 0],
  ].map(point => new THREE.Vector3(...point)));
  const geometry = new THREE.TubeGeometry(curve, 112, .235, 32, false);
  const positions = geometry.getAttribute("position"), index = geometry.index.array, kept = [];
  // Rounded, broad cross-section seen in the real handle. A circular pipe
  // would leave the socket perched on top rather than recessed in the grip.
  for (let ring = 0; ring <= 112; ring++) {
    const point = curve.getPointAt(ring / 112), tangent = curve.getTangentAt(ring / 112);
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    for (let segment = 0; segment <= 32; segment++) {
      const angle = segment / 32 * Math.PI * 2, c = Math.cos(angle), s = Math.sin(angle);
      const normalOffset = Math.sign(c) * Math.sqrt(Math.abs(c)) * .235;
      const zOffset = Math.sign(s) * Math.sqrt(Math.abs(s)) * .30;
      positions.setXYZ(ring * 33 + segment, point.x + normal.x * normalOffset, point.y + normal.y * normalOffset, zOffset);
    }
  }
  const aperture = vertex => {
    const x = positions.getX(vertex) - 1.64, z = positions.getZ(vertex);
    return x * x + z * z < .245 ** 2 && positions.getY(vertex) > 2.72;
  };
  for (let i = 0; i < index.length; i += 3) {
    if (![index[i], index[i + 1], index[i + 2]].some(aperture)) kept.push(index[i], index[i + 1], index[i + 2]);
  }
  geometry.setIndex(kept);
  geometry.computeVertexNormals();
  return geometry;
}

function beadGeometry() {
  const geometry = new THREE.SphereGeometry(cupModelEvidence.beadRadius, 72, 48);
  const position = geometry.getAttribute("position"), colours = new Float32Array(position.count * 3);
  const black = new THREE.Color("#171717"), white = new THREE.Color("#eeece7");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i) / .235, y = position.getY(i) / .235, z = position.getZ(i) / .235;
    // The photos show broad irregular white swirls on a black bead. Unseen
    // parts of the pattern are illustrative; the page labels the model so.
    const swirl = Math.sin(x * 5.2 + Math.sin(y * 4 + z * 2.4) * 1.1 + z * 1.8);
    const shade = swirl > .24 ? white : black;
    colours.set([shade.r, shade.g, shade.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  return geometry;
}

export function createCupModel(colourId = "deep-green") {
  const group = new THREE.Group();
  group.name = "RollingBeadCup_PhotoStudy";
  group.userData = { ...cupModelEvidence, accuracy: "photo-based approximation", commercialSku: "pending" };
  const glaze = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: .7, metalness: 0, clearcoat: .12, clearcoatRoughness: .55, side: THREE.DoubleSide });
  const add = (name, geometry, material) => {
    const normals = geometry.getAttribute("normal");
    // Closed lathe endpoints and the removed socket faces leave unused
    // vertices. Give those a finite unit normal for a clean glTF export.
    const normal = new THREE.Vector3();
    for (let i = 0; i < normals.count; i++) {
      normal.fromBufferAttribute(normals, i);
      if (normal.lengthSq() < 1e-12) normal.set(0, 1, 0);
      else normal.normalize();
      normals.setXYZ(i, normal.x, normal.y, normal.z);
    }
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name;
    mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  };
  add("Glaze_Body", outerBody(), glaze());
  add("Glaze_Interior", innerBody(), glaze());
  add("Glaze_Handle", handleGeometry(), glaze());
  const clay = new THREE.MeshStandardMaterial({ color: "#97795f", roughness: .92 });
  const foot = add("UnglazedFoot", new THREE.TorusGeometry(.887, .025, 12, 128), clay);
  foot.rotation.x = Math.PI / 2; foot.position.y = .085;
  const rim = add("BeadSocket_Rim", new THREE.TorusGeometry(.245, .017, 12, 72), clay.clone());
  rim.rotation.x = Math.PI / 2; rim.position.set(1.64, 2.862, 0);
  const well = add("BeadSocket_Well", new THREE.CylinderGeometry(.245, .245, .13, 72, 1, true), new THREE.MeshStandardMaterial({ color: "#26241f", roughness: .95, side: THREE.DoubleSide }));
  well.position.set(1.64, 2.745, 0);
  const bead = add("RollingBead", beadGeometry(), new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .3, metalness: 0, clearcoat: .3, clearcoatRoughness: .28 }));
  bead.position.set(...cupModelEvidence.beadCenter);
  applyCupColour(group, colourId);
  return group;
}
