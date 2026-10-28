import * as THREE from "three";
import { cupPhoto } from "../data/cup.js";

// Same approach as the Waterline/Wanxiang deep-plate pilot: physical ceramic
// materials with colour-only photographic maps, a continuous vessel profile,
// and a complete underside. Never use photographed shading as a bump map.
// UV rectangles select ceramic pixels from the untouched user photographs.
export const cupPhotoModelSources = {
  "purple-grey": { front: 5137, base: 5140, grooveV: .554, body: [.46, .57, .56, .575], interior: [.39, .53, .255, .31], handle: [.794, .804, .594, .609], bead: [.747, .446, .048, .031], bottom: [.484, .427, .174, .234], foot: [.6744, .4267], roughness: .62 },
  olive: { front: 5142, base: 5145, grooveV: .48, body: [.50, .61, .515, .534], interior: [.45, .58, .235, .267], handle: [.288, .298, .507, .522], bead: [.338, .264, .027, .018], bottom: [.516, .434, .17, .232], foot: [.7, .4341], roughness: .68 },
  "deep-green": { front: 5146, base: 5149, grooveV: .486, body: [.53, .62, .539, .558], interior: [.465, .585, .223, .26], handle: [.284, .294, .650, .666], bead: [.328, .387, .043, .029], bottom: [.637, .486, .161, .19], foot: [.8033, .4867], roughness: .6 },
};
export const cupPhotoModelEvidence = {
  method: "Wanxiang-style photographic colour maps and continuous vessel profile",
  sources: Object.fromEntries(Object.entries(cupPhotoModelSources).map(([id, source]) => [id, { front: cupPhoto(source.front), underside: cupPhoto(source.base) }])),
  geometry: "relative proportions estimated from user photographs; no measured dimensions",
  surface: "real ceramic colour and texture sampled from source photos; unseen regions reconstructed",
  bumpMaps: false,
  commercialSku: "pending",
};

const mirror = t => 1 - Math.abs(((t % 1 + 1) % 1) * 2 - 1);
const patch = (rect, u, v) => [rect[0] + u * (rect[1] - rect[0]), 1 - (rect[2] + v * (rect[3] - rect[2]))];
function vesselGeometry() {
  const profile = [];
  const point = (r, y, zone) => profile.push({ r, y, zone });
  // Recessed base -> clay contact foot -> outer body -> rounded lip -> inner
  // wall -> interior floor, in one continuous mesh. No detached torus foot.
  point(0, .135, "base"); point(.67, .135, "base"); point(.79, .125, "base");
  point(.805, .078, "base"); point(.833, .06, "base"); point(.914, .06, "base");
  point(.938, .087, "base"); point(.947, .16, "base"); point(.947, .22, "base"); point(.947, .22, "body");
  for (let i = 1; i <= 224; i++) {
    const t = i / 224;
    // Broad rounded horizontal ribs, rather than the sharply shaded pipes
    // of the rejected plain-colour reconstruction.
    point(.947 + .11 * t + .024 * Math.sin(t * Math.PI * 14), .22 + 2.56 * t, "body");
  }
  point(1.069, 2.84, "rim"); point(1.085, 2.945, "rim"); point(1.079, 2.989, "rim");
  point(1.064, 3.011, "rim"); point(1.034, 3.006, "rim"); point(1.017, 2.982, "interior");
  for (let i = 1; i <= 96; i++) { const t = i / 96; point(1.017 - .139 * t, 2.982 - 2.60 * t, "interior"); }
  point(.85, .318, "interior"); point(.79, .277, "interior"); point(.65, .255, "interior"); point(.35, .25, "interior"); point(0, .25, "interior");
  const geometry = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p.r, p.y)), 144);
  geometry.userData.profile = profile;
  geometry.userData.stride = profile.length;
  const glazeIndices = [], baseIndices = [], indices = geometry.index.array;
  for (let segment = 0; segment < 144; segment++) {
    for (let row = 0; row < profile.length - 1; row++) {
      const zone = profile[row].zone;
      const start = (segment * (profile.length - 1) + row) * 6;
      (zone === "base" ? baseIndices : glazeIndices).push(...indices.slice(start, start + 6));
    }
  }
  geometry.setIndex([...glazeIndices, ...baseIndices]);
  geometry.clearGroups(); geometry.addGroup(0, glazeIndices.length, 0); geometry.addGroup(glazeIndices.length, baseIndices.length, 1);
  return geometry;
}

function handleGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    [1, 2.615, 0], [1.39, 2.625, 0], [1.68, 2.625, 0], [1.99, 2.405, 0], [2.12, 2.16, 0],
    [2.19, 1.68, 0], [2.10, 1.19, 0], [1.81, .80, 0], [1.01, .64, 0],
  ].map(p => new THREE.Vector3(...p)));
  const geometry = new THREE.TubeGeometry(curve, 128, .235, 48, false), positions = geometry.attributes.position;
  for (let row = 0; row <= 128; row++) {
    const p = curve.getPointAt(row / 128), tangent = curve.getTangentAt(row / 128), normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    for (let segment = 0; segment <= 48; segment++) {
      const angle = segment / 48 * Math.PI * 2, c = Math.cos(angle), s = Math.sin(angle);
      const offset = Math.sign(c) * Math.pow(Math.abs(c), .62) * .23;
      positions.setXYZ(row * 49 + segment, p.x + normal.x * offset, p.y + normal.y * offset, Math.sign(s) * Math.pow(Math.abs(s), .62) * .30);
    }
  }
  const aperture = vertex => {
    const x = positions.getX(vertex) - 1.64, z = positions.getZ(vertex);
    return x * x + z * z < .232 ** 2 && positions.getY(vertex) > 2.73;
  };
  const original = geometry.index.array, kept = [];
  for (let i = 0; i < original.length; i += 3) if (![original[i], original[i + 1], original[i + 2]].some(aperture)) kept.push(original[i], original[i + 1], original[i + 2]);
  geometry.setIndex(kept); geometry.computeVertexNormals();
  return geometry;
}

export function applyCupPhotoColour(model, colourId, textures) {
  const source = cupPhotoModelSources[colourId] || cupPhotoModelSources["deep-green"];
  model.traverse(mesh => {
    if (!mesh.isMesh || !mesh.userData.photoSurface) return;
    const position = mesh.geometry.attributes.position, uv = mesh.geometry.attributes.uv;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
      let coords;
      if (mesh.userData.photoSurface === "vessel") {
        const profile = mesh.geometry.userData.profile, p = profile[i % profile.length], phase = Math.floor(i / profile.length) / 144;
        if (p.zone === "base") coords = p.r > .803 && p.y < .1
          ? [source.foot[0] + .003 * mirror(phase * 2), 1 - source.foot[1] - .006 * mirror(phase)]
          : [source.bottom[0] + x / .96 * source.bottom[2] * .65, 1 - source.bottom[1] + z / .96 * source.bottom[3] * .65];
        else if (p.zone === "interior") coords = patch(source.interior, mirror(phase), mirror((y / 3) * 2));
        else if (p.zone === "rim") coords = patch(source.handle, mirror(phase * 4), Math.max(0, Math.min(1, (y - 2.84) / .18)));
        else {
          const ribPhase = (y - .22) / 2.56 * 7;
          coords = patch(source.body, mirror(phase * 2 + Math.floor(ribPhase) * .13), mirror(ribPhase));
          const groove = Math.pow((1 - Math.sin(ribPhase * Math.PI * 2)) / 2, 8) * .65;
          coords[1] = coords[1] * (1 - groove) + (1 - source.grooveV) * groove;
        }
      } else if (mesh.userData.photoSurface === "bead") {
        coords = [source.bead[0] + x / .235 * source.bead[2] * .85, 1 - source.bead[1] - z / .235 * source.bead[3] * .85];
      } else coords = patch(source.handle, mirror(i % 49 / 48 * 2), mirror(Math.floor(i / 49) / 128 * 8));
      uv.setXY(i, ...coords);
    }
    uv.needsUpdate = true;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material, index) => {
      material.map = index === 1 ? textures.base : textures.front;
      material.color.set(0xffffff); material.roughness = mesh.userData.photoSurface === "bead" ? .32 : source.roughness;
      material.needsUpdate = true;
    });
  });
  model.userData.colourId = colourId;
}

export function createCupPhotoModel() {
  const model = new THREE.Group(); model.name = "Cup_WanxiangPhotoReconstruction"; model.userData = { ...cupPhotoModelEvidence };
  const ceramic = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .62, metalness: 0, clearcoat: .12, clearcoatRoughness: .3, side: THREE.DoubleSide });
  const add = (name, geometry, material, surface) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.userData.photoSurface = surface;
    mesh.castShadow = true; mesh.receiveShadow = true; model.add(mesh); return mesh;
  };
  add("CeramicVessel_ContinuousProfile", vesselGeometry(), [ceramic(), ceramic()], "vessel");
  add("CeramicHandle", handleGeometry(), ceramic(), "handle");
  const bead = add("RollingBead", new THREE.SphereGeometry(.235, 72, 48), ceramic(), "bead"); bead.position.set(1.64, 2.735, 0);
  const socket = add("RecessedBeadSocket", new THREE.CylinderGeometry(.237, .237, .14, 72, 1, true), new THREE.MeshStandardMaterial({ color: 0x353128, roughness: .9, side: THREE.DoubleSide }));
  socket.position.set(1.64, 2.752, 0);
  return model;
}
