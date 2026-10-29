import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ArrowCounterClockwise, ArrowsClockwise } from "@phosphor-icons/react";
import { applyCupPhotoColour, createCupPhotoModel, cupPhotoModelSources } from "./cup-photo-model.js";
import { cupPhoto } from "../data/cup.js";
import "../styles/cup-model.css";

function disposeModel(model) {
  model.traverse(object => {
    object.geometry?.dispose();
    for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) material.dispose();
  });
}

export default function CupModelViewer({ colourId, colourName, poster }) {
  const mountRef = useRef(null), modelRef = useRef(null), currentColour = useRef(colourId);
  const resetRef = useRef(null), rollRef = useRef(null), drawRef = useRef(null), colourRef = useRef(null);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [rolling, setRolling] = useState(false);
  currentColour.current = colourId;

  useEffect(() => {
    colourRef.current?.(colourId);
  }, [colourId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" }); }
    catch { setFailed(true); return; }
    let disposed = false, visible = true, frameId = 0, spin = null, colourRequest = 0, contextLost = false;
    const textures = new Map();
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(31, 1, .1, 40);
    camera.position.set(3.3, 4.35, 6.7);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.06;
    // The Wanxiang photo-mapped view does not add a second layer of hard
    // self-shadow on top of the source photograph's light information.
    renderer.shadowMap.enabled = false;
    renderer.domElement.setAttribute("aria-hidden", "true"); mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(.45, 1.45, 0); controls.enableDamping = true; controls.dampingFactor = .065;
    controls.enablePan = false; controls.minDistance = 5.6; controls.maxDistance = 13;
    controls.minPolarAngle = .18; controls.maxPolarAngle = Math.PI - .18; controls.update(); controls.saveState();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    controls.autoRotate = !media.matches; controls.autoRotateSpeed = .38;
    controls.addEventListener("start", () => { controls.autoRotate = false; });

    scene.add(new THREE.HemisphereLight(0xfdfbf7, 0x716b63, 2.25));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xb8d3e0, 1.1); fill.position.set(5, 3, -4); scene.add(fill);
    const underside = new THREE.DirectionalLight(0xffffff, 2.2); underside.position.set(-3, -6, 4); scene.add(underside);

    const draw = () => { if (!frameId && !disposed && visible && !document.hidden) frameId = window.requestAnimationFrame(render); };
    function render(now) {
      if (disposed || !visible || document.hidden) { frameId = 0; return; }
      const changed = controls.update();
      if (spin) {
        const progress = Math.min(1, (now - spin.start) / 1000);
        spin.bead.rotation.z = spin.from + (1 - Math.pow(1 - progress, 3)) * Math.PI * 2;
        if (progress === 1) { spin = null; setRolling(false); }
      }
      renderer.render(scene, camera);
      frameId = changed || spin || controls.autoRotate ? window.requestAnimationFrame(render) : 0;
    }
    drawRef.current = draw; controls.addEventListener("change", draw);
    resetRef.current = () => {
      controls.autoRotate = false;
      // Clear the damped gesture before restoring the saved camera, so a
      // recent underside orbit cannot continue pulling the reset view down.
      controls.enableDamping = false; controls.update(); controls.reset(); controls.enableDamping = true;
      spin = null; setRolling(false); const bead = modelRef.current?.getObjectByName("RollingBead"); if (bead) bead.rotation.set(0, 0, 0); draw();
    };
    rollRef.current = () => {
      const bead = modelRef.current?.getObjectByName("RollingBead"); if (!bead) return;
      if (media.matches) { bead.rotation.z += Math.PI * .5; draw(); return; }
      spin = { bead, from: bead.rotation.z, start: performance.now() }; setRolling(true); draw();
    };
    const resize = () => {
      const { width, height } = mount.getBoundingClientRect(); if (!width || !height) return;
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); draw();
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) draw(); }); visibilityObserver.observe(mount);
    const resume = () => draw(); document.addEventListener("visibilitychange", resume);
    const motionChanged = () => { if (media.matches) controls.autoRotate = false; if (media.matches && spin) { spin.bead.rotation.z = spin.from + Math.PI * .5; spin = null; setRolling(false); draw(); } };
    media.addEventListener("change", motionChanged);
    const lost = event => { event.preventDefault(); contextLost = true; controls.autoRotate = false; setReady(false); setFailed(true); spin = null; };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const model = createCupPhotoModel(); modelRef.current = model; scene.add(model);
    const loader = new THREE.TextureLoader();
    const loadTexture = frame => {
      if (!textures.has(frame)) textures.set(frame, loader.loadAsync(cupPhoto(frame)).then(texture => {
        if (disposed) { texture.dispose(); return texture; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        return texture;
      }));
      return textures.get(frame);
    };
    colourRef.current = async id => {
      if (contextLost) { setReady(false); setFailed(true); return; }
      const request = ++colourRequest, source = cupPhotoModelSources[id];
      setReady(false); setFailed(false);
      try {
        const [front, base] = await Promise.all([loadTexture(source.front), loadTexture(source.base)]);
        if (disposed || request !== colourRequest) return;
        applyCupPhotoColour(model, id, { front, base }); setReady(true); draw();
      } catch { if (!disposed && request === colourRequest) { controls.autoRotate = false; setFailed(true); } }
    };
    colourRef.current(currentColour.current);
    return () => {
      disposed = true; window.cancelAnimationFrame(frameId); observer.disconnect(); visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", resume); media.removeEventListener("change", motionChanged);
      renderer.domElement.removeEventListener("webglcontextlost", lost); controls.dispose();
      drawRef.current = null; resetRef.current = null; rollRef.current = null; colourRef.current = null;
      for (const pending of textures.values()) pending.then(texture => texture.dispose()).catch(() => {});
      if (modelRef.current) disposeModel(modelRef.current); modelRef.current = null;
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);

  return <div className={`cup-model-viewer${ready && !failed ? " is-ready" : ""}`} role="group" aria-label={`Interactive ${colourName} ceramic cup model`}>
    <img className="cup-model-poster" src={poster} alt={`${colourName} cup photograph`} width="1800" height="1350" />
    <div className="cup-model-canvas" ref={mountRef} />
    <p className="cup-model-hint" role="status">{failed ? "3D is unavailable. Explore the product photographs." : ready ? <><span className="cup-model-hint-long">Drag to rotate · Pinch to zoom</span><span className="cup-model-hint-short">Drag · Zoom</span></> : "Loading 3D view…"}</p>
    {ready && !failed && <div className="cup-model-controls">
      <button type="button" aria-label={rolling ? "Rolling the bead" : "Roll the bead"} title="Roll the bead" disabled={rolling} onClick={() => rollRef.current?.()}><ArrowsClockwise size={17} /></button>
      <button type="button" onClick={() => resetRef.current?.()} aria-label="Reset cup 3D view" title="Reset view"><ArrowCounterClockwise size={17} /></button>
    </div>}
  </div>;
}
