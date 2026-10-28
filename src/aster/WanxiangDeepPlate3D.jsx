import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, ArrowsClockwise } from "@phosphor-icons/react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const TOP_TEXTURE =
  "/images/aster/wanxiang/source-derived/deep-plate-8-top-v2.png";
const BOTTOM_TEXTURE =
  "/images/aster/wanxiang/source-derived/deep-plate-8-bottom-approved-v3.png";

function createRadialSurface({
  radius,
  heightAt,
  underside = false,
  uvScale = 1,
  startProgress = 0,
  endProgress = 1,
  uvRadiusAt,
}) {
  const radialSegments = 128;
  const angularSegments = 176;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let ring = 0; ring <= radialSegments; ring += 1) {
    const progress =
      startProgress +
      (ring / radialSegments) * (endProgress - startProgress);
    const ringRadius = progress * radius;
    const y = heightAt(progress);

    for (let segment = 0; segment <= angularSegments; segment += 1) {
      const angle = (segment / angularSegments) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;
      const textureRadius = uvRadiusAt ? uvRadiusAt(progress) : progress;
      positions.push(x, y, z);
      uvs.push(
        0.5 + Math.cos(angle) * textureRadius * 0.5 * uvScale,
        0.5 - Math.sin(angle) * textureRadius * 0.5 * uvScale,
      );
    }
  }

  const stride = angularSegments + 1;
  for (let ring = 0; ring < radialSegments; ring += 1) {
    for (let segment = 0; segment < angularSegments; segment += 1) {
      const a = ring * stride + segment;
      const b = (ring + 1) * stride + segment;
      const c = (ring + 1) * stride + segment + 1;
      const d = ring * stride + segment + 1;
      if (underside) indices.push(a, b, d, d, b, c);
      else indices.push(a, d, b, d, c, b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createProfileGeometry(profile, uvForVertex) {
  const angularSegments = 176;
  const positions = [];
  const uvs = [];
  const indices = [];

  profile.forEach((profilePoint, profileIndex) => {
    const { x: ringRadius, y } = profilePoint;
    for (let segment = 0; segment <= angularSegments; segment += 1) {
      const angle = (segment / angularSegments) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;
      positions.push(x, y, z);
      uvs.push(...uvForVertex({
        angle,
        profileIndex,
        profileLength: profile.length,
        ringRadius,
        segment,
        angularSegments,
        profilePoint,
        x,
        z,
      }));
    }
  });

  const stride = angularSegments + 1;
  for (let ring = 0; ring < profile.length - 1; ring += 1) {
    for (let segment = 0; segment < angularSegments; segment += 1) {
      const a = ring * stride + segment;
      const b = (ring + 1) * stride + segment;
      const c = (ring + 1) * stride + segment + 1;
      const d = ring * stride + segment + 1;
      indices.push(a, b, d, d, b, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createRimBand(bottomTexture, radius) {
  const profile = [
    new THREE.Vector2(radius - 0.08, 1.5),
    new THREE.Vector2(radius, 1.47),
    new THREE.Vector2(radius, 1.41),
    new THREE.Vector2(radius - 0.07, 1.39),
    new THREE.Vector2(radius - 0.08, 1.5),
  ];
  const geometry = createProfileGeometry(profile, ({ x, z }) => [
    0.5 + (x / (radius * 2)) * 0.85,
    0.5 - (z / (radius * 2)) * 0.85,
  ]);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x789aaa,
    roughness: 0.38,
    metalness: 0,
    clearcoat: 0.48,
    clearcoatRoughness: 0.16,
    side: THREE.DoubleSide,
  });
  const rim = new THREE.Mesh(geometry, material);
  rim.castShadow = true;
  rim.receiveShadow = true;
  return rim;
}

function createTopRimGlaze(topTexture, radius) {
  const material = new THREE.MeshPhysicalMaterial({
    map: topTexture,
    color: 0xc4d9e1,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.14,
    side: THREE.FrontSide,
  });
  const glaze = new THREE.Mesh(
    createRadialSurface({
      radius,
      startProgress: 0.72,
      endProgress: 1,
      uvScale: 0.97,
      heightAt: (progress) =>
        0.058 + Math.pow(progress, 3.05) * 1.45,
    }),
    material,
  );
  glaze.castShadow = true;
  glaze.receiveShadow = true;
  return glaze;
}

function createBottomSurface(bottomTexture, radius) {
  const profile = [];

  // The accepted underside reference has a broad, nearly flat center and a
  // foot whose outer radius is about half the plate radius. Keep geometry and
  // UV radius in lockstep so the clay foot ring and blue glaze transition stay
  // attached while the plate rotates.
  for (let step = 0; step <= 28; step += 1) {
    const progress = (step / 28) * 0.42;
    profile.push({
      x: progress * radius,
      y: -0.17 + Math.pow(progress / 0.42, 2) * 0.015,
      textureRadius: progress * 0.445,
    });
  }

  profile.push(
    { x: 2.18, y: -0.16, textureRadius: 0.191 },
    { x: 2.22, y: -0.23, textureRadius: 0.195 },
    { x: 2.28, y: -0.31, textureRadius: 0.2 },
    { x: 2.38, y: -0.35, textureRadius: 0.209 },
    { x: 2.5, y: -0.35, textureRadius: 0.219 },
    { x: 2.58, y: -0.29, textureRadius: 0.226 },
    { x: 2.64, y: -0.18, textureRadius: 0.231 },
    { x: 2.7, y: -0.1, textureRadius: 0.236 },
  );

  const outerStart = 2.7 / radius;
  for (let step = 1; step <= 48; step += 1) {
    const progress = outerStart + (step / 48) * (1 - outerStart);
    const outerProgress = (progress - outerStart) / (1 - outerStart);
    profile.push({
      x: progress * radius,
      y: -0.1 + Math.pow(outerProgress, 1.55) * 1.52,
      textureRadius: progress * 0.445,
    });
  }

  const geometry = createProfileGeometry(
    profile,
    ({ angle, profilePoint }) => [
      0.5 + Math.cos(angle) * profilePoint.textureRadius,
      0.5 - Math.sin(angle) * profilePoint.textureRadius,
    ],
  );
  const material = new THREE.MeshPhysicalMaterial({
    map: bottomTexture,
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0,
    clearcoat: 0.03,
    side: THREE.DoubleSide,
  });
  const bottom = new THREE.Mesh(geometry, material);
  bottom.castShadow = true;
  bottom.receiveShadow = true;
  return bottom;
}

function createPlate(topTexture, bottomTexture) {
  const radius = 5.08;
  const group = new THREE.Group();

  const topMaterial = new THREE.MeshPhysicalMaterial({
    map: topTexture,
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.22,
    side: THREE.FrontSide,
  });
  const top = new THREE.Mesh(
    createRadialSurface({
      radius,
      uvScale: 0.97,
      heightAt: (progress) => 0.05 + Math.pow(progress, 3.05) * 1.45,
    }),
    topMaterial,
  );

  top.castShadow = true;
  top.receiveShadow = true;

  group.add(
    createBottomSurface(bottomTexture, radius),
    top,
    createTopRimGlaze(topTexture, radius),
    createRimBand(bottomTexture, radius),
  );
  group.rotation.y = -0.16;
  return group;
}

export function WanxiangDeepPlate3D({ poster }) {
  const mountRef = useRef(null);
  const resetRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let frameId = 0;
    let visible = true;
    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(6.8, 9.8, 15.8);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = false;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 12.5;
    controls.maxDistance = 24;
    controls.minPolarAngle = Math.PI * 0.035;
    controls.maxPolarAngle = Math.PI * 0.965;
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    controls.autoRotateSpeed = 0.38;
    controls.saveState();
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
    });
    resetRef.current = () => {
      controls.reset();
      controls.autoRotate = false;
    };

    scene.add(new THREE.HemisphereLight(0xfdfbf7, 0x716b63, 2.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.4);
    keyLight.position.set(-5, 9, 7);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xb8d3e0, 1.25);
    fillLight.position.set(7, 3, -5);
    scene.add(fillLight);
    const undersideLight = new THREE.DirectionalLight(0xffffff, 4.4);
    undersideLight.position.set(-3, -6, 4);
    scene.add(undersideLight);

    const loader = new THREE.TextureLoader();
    Promise.all([
      loader.loadAsync(TOP_TEXTURE),
      loader.loadAsync(BOTTOM_TEXTURE),
    ])
      .then(([topTexture, bottomTexture]) => {
        if (disposed) {
          topTexture.dispose();
          bottomTexture.dispose();
          return;
        }
        [topTexture, bottomTexture].forEach((texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            8,
            renderer.capabilities.getMaxAnisotropy(),
          );
        });
        scene.add(createPlate(topTexture, bottomTexture));
        setReady(true);
      })
      .catch(() => setFailed(true));

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersectionObserver.observe(mount);

    const render = () => {
      frameId = window.requestAnimationFrame(render);
      if (!visible) return;
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    const loseContext = (event) => {
      event.preventDefault();
      setFailed(true);
      setReady(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", loseContext);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      controls.dispose();
      resetRef.current = null;
      renderer.domElement.removeEventListener("webglcontextlost", loseContext);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            material.map?.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      className={`wanxiang-3d-viewer${ready && !failed ? " is-ready" : ""}`}
      role="img"
      aria-label="Interactive three-dimensional reconstruction of the Waterline 8-inch Deep Plate. Drag to rotate and scroll or pinch to zoom."
    >
      <img
        className="wanxiang-3d-poster"
        src={poster}
        alt="Waterline 8-inch Deep Plate"
        width="1586"
        height="992"
      />
      {!failed && <div className="wanxiang-3d-canvas" ref={mountRef} />}
      {!failed && (
        <div className="wanxiang-3d-instructions" aria-hidden="true">
          <ArrowsClockwise size={17} weight="light" />
          <span className="wanxiang-3d-instructions-long">
            {ready ? "Drag to rotate · Pinch to zoom" : "Preparing 3D view"}
          </span>
          <span className="wanxiang-3d-instructions-short">
            {ready ? "Drag · Zoom" : "Loading 3D"}
          </span>
        </div>
      )}
      {ready && !failed && (
        <button
          className="wanxiang-3d-reset"
          type="button"
          aria-label="Reset 3D view"
          onClick={() => resetRef.current?.()}
        >
          <ArrowCounterClockwise size={17} />
        </button>
      )}
    </div>
  );
}
