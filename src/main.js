import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sound } from './js/audio.js';
import { modelManager, HARDWARE_DEFINITIONS } from './js/cadLoader.js';
import { DesktopManager } from './js/desktop.js';

// DOM Selectors
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

// Prefers-reduced-motion check
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fallback GSAP motion
const fallbackMotion = {
  to(target, options) {
    ['x', 'y', 'z', 'rotationX', 'rotationY'].forEach((k) => { 
      if (typeof options[k] === 'number') target[k] = options[k]; 
    });
    options.onComplete?.();
    return { kill() {} };
  }
};

const motion = {
  to(...args) {
    if (prefersReducedMotion && args[1]) {
      args[1].duration = 0.001;
    }
    return (window.gsap || fallbackMotion).to(...args);
  },
  killTweensOf(...args) { return window.gsap?.killTweensOf?.(...args); }
};

// UI Elements
const canvas = $('#scene');
const intro = $('#intro');
const loading = $('#loading');
const loadingText = $('#loadingText');
const loadingDetail = $('#loadingDetail');
const loadingBar = $('#loadingBar');
const worldUi = $('#worldUi');
const worldInstruction = $('#worldInstruction');
const screenUi = $('#screenUi');
const screenBody = $('#screenBody');
const inspect = $('#inspect');
const toast = $('#toast');
const webglFallback = $('#webglFallback');
const webglFallbackBtn = $('#webglFallbackBtn');

// Application State
const state = {
  entered: false,
  ready: false,
  focused: false,
  inspecting: null,
  screenState: 'sleep', // 'sleep' | 'boot' | 'desktop'
  is3DOffloaded: false,
  busy: false,
  currentTheme: 'dark'
};

// Three.js Scene Setup with WebGL Safety Check
let renderer, scene, camera, controls;
let isWebGLAvailable = true;

try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#07090b');
  scene.fog = new THREE.Fog('#07090b', 8, 22);

  camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.01, 100);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  // Strict Orbit Constraints
  controls.minAzimuthAngle = -Math.PI * 0.36; // -65 degrees
  controls.maxAzimuthAngle = Math.PI * 0.36;  // +65 degrees
  controls.minPolarAngle = Math.PI * 0.22;    // Prevents looking straight from above
  controls.maxPolarAngle = Math.PI * 0.46;    // Prevents going below desk level
  controls.minDistance = 1.15;
  controls.maxDistance = 4.2;
} catch (e) {
  console.warn('WebGL Initialization failed. Activating graceful 2D fallback.', e);
  isWebGLAvailable = false;
  if (webglFallback) webglFallback.hidden = false;
}

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const loader = new GLTFLoader();
const stage = new THREE.Group();
if (scene) scene.add(stage);

const DESK_TOP_HEIGHT = 0.85; // Tabletop height in world units

const world = {
  desk: null,
  deskMat: null,
  mouse: null,
  laptop: null,
  screenMesh: null,
  screenCanvas: null,
  screenCtx: null,
  screenTexture: null,
  desktopManager: null,
  clickable: [],
  leds: {},
  overview: {
    position: new THREE.Vector3(0, DESK_TOP_HEIGHT + 1.05, 2.75),
    target: new THREE.Vector3(0, DESK_TOP_HEIGHT + 0.34, 0)
  }
};

export function set3DTheme(themeName) {
  state.currentTheme = themeName;
  if (!scene) return;

  if (themeName === 'light') {
    scene.background.set('#d8e1e8');
    scene.fog.color.set('#d8e1e8');
    if (renderer) renderer.toneMappingExposure = 1.05;
  } else if (themeName === 'matrix') {
    scene.background.set('#030706');
    scene.fog.color.set('#030706');
    if (renderer) renderer.toneMappingExposure = 1.25;
  } else {
    scene.background.set('#07090b');
    scene.fog.color.set('#07090b');
    if (renderer) renderer.toneMappingExposure = 1.18;
  }
}
window.set3DTheme = set3DTheme;

function setLoading(percent, text) {
  if (loadingBar) loadingBar.style.width = `${percent}%`;
  if (loadingText) loadingText.textContent = text;
  if (loadingDetail) loadingDetail.textContent = `${percent}%`;
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function easeCamera(toPos, toTarget, duration = 0.95, onComplete) {
  if (prefersReducedMotion) duration = 0.001;
  const t = {
    px: camera.position.x, py: camera.position.y, pz: camera.position.z,
    tx: controls.target.x, ty: controls.target.y, tz: controls.target.z
  };

  motion.killTweensOf(t);
  motion.to(t, {
    px: toPos.x, py: toPos.y, pz: toPos.z,
    tx: toTarget.x, ty: toTarget.y, tz: toTarget.z,
    duration,
    ease: 'power3.inOut',
    onUpdate: () => {
      camera.position.set(t.px, t.py, t.pz);
      controls.target.set(t.tx, t.ty, t.tz);
      controls.update();
    },
    onComplete: () => {
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      controls.update();
      onComplete?.();
    }
  });
}

function createStudioLighting() {
  if (!scene) return;
  const ambient = new THREE.AmbientLight('#c8d3df', 0.85);
  scene.add(ambient);

  const overheadKey = new THREE.DirectionalLight('#ffffff', 2.8);
  overheadKey.position.set(2.5, 5.5, 3.2);
  overheadKey.castShadow = true;
  overheadKey.shadow.mapSize.width = 2048;
  overheadKey.shadow.mapSize.height = 2048;
  overheadKey.shadow.bias = -0.00008;
  overheadKey.shadow.camera.near = 0.5;
  overheadKey.shadow.camera.far = 12;
  overheadKey.shadow.camera.left = -2.8;
  overheadKey.shadow.camera.right = 2.8;
  overheadKey.shadow.camera.top = 2.8;
  overheadKey.shadow.camera.bottom = -2.8;
  overheadKey.shadow.radius = 1.8;
  scene.add(overheadKey);

  const rimLight = new THREE.DirectionalLight('#38bdf8', 1.6);
  rimLight.position.set(-3.5, 2.5, -2.5);
  scene.add(rimLight);

  const fillWarm = new THREE.DirectionalLight('#ffd8a8', 0.9);
  fillWarm.position.set(0, 1.8, 4.0);
  scene.add(fillWarm);

  const screenBounce = new THREE.PointLight('#38bdf8', 0.65, 2.2);
  screenBounce.position.set(0, DESK_TOP_HEIGHT + 0.45, 0.4);
  scene.add(screenBounce);
}

function createLuxuryDesk() {
  if (!stage) return;
  const deskGroup = new THREE.Group();

  const topMat = new THREE.MeshStandardMaterial({
    color: '#0d0f12',
    roughness: 0.72,
    metalness: 0.18,
    name: 'desk_matte_linoleum'
  });
  world.deskMat = topMat;

  const topGeo = new THREE.BoxGeometry(2.6, 0.045, 1.4);
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.y = DESK_TOP_HEIGHT - 0.0225;
  topMesh.receiveShadow = true;
  topMesh.castShadow = true;
  deskGroup.add(topMesh);

  const padMat = new THREE.MeshStandardMaterial({
    color: '#15191e',
    roughness: 0.92,
    metalness: 0.05,
    name: 'felt_desk_pad'
  });
  const padGeo = new THREE.BoxGeometry(1.6, 0.005, 0.75);
  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.position.set(0, DESK_TOP_HEIGHT + 0.0025, 0.05);
  padMesh.receiveShadow = true;
  deskGroup.add(padMesh);

  const legMat = new THREE.MeshStandardMaterial({
    color: '#1a1e24',
    roughness: 0.38,
    metalness: 0.85,
    name: 'steel_legs'
  });

  const legPositions = [
    [-1.2, (DESK_TOP_HEIGHT - 0.045) / 2, -0.6],
    [1.2, (DESK_TOP_HEIGHT - 0.045) / 2, -0.6],
    [-1.2, (DESK_TOP_HEIGHT - 0.045) / 2, 0.6],
    [1.2, (DESK_TOP_HEIGHT - 0.045) / 2, 0.6]
  ];

  legPositions.forEach(([x, y, z]) => {
    const legGeo = new THREE.CylinderGeometry(0.028, 0.028, DESK_TOP_HEIGHT - 0.045, 16);
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    deskGroup.add(leg);
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: '#080a0c',
    roughness: 0.85,
    metalness: 0.1
  });
  const floorGeo = new THREE.PlaneGeometry(16, 16);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  deskGroup.add(floor);

  stage.add(deskGroup);
  world.desk = deskGroup;
}

function createMouse() {
  if (!stage) return;
  const mouseGroup = new THREE.Group();

  const mouseBodyMat = new THREE.MeshStandardMaterial({
    color: '#1a1d22',
    roughness: 0.35,
    metalness: 0.65,
    name: 'mouse_body'
  });

  const mouseBodyGeo = new THREE.BoxGeometry(0.065, 0.025, 0.115);
  const mouseBody = new THREE.Mesh(mouseBodyGeo, mouseBodyMat);
  mouseBody.position.y = 0.0125;
  mouseBody.castShadow = true;
  mouseBody.receiveShadow = true;
  mouseGroup.add(mouseBody);

  const wheelMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    roughness: 0.2,
    metalness: 0.8,
    emissive: '#0284c7',
    emissiveIntensity: 0.4
  });
  const wheelGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.012, 12);
  const wheel = new THREE.Mesh(wheelGeo, wheelMat);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.025, -0.025);
  mouseGroup.add(wheel);

  mouseGroup.position.set(0.48, DESK_TOP_HEIGHT + 0.005, 0.12);
  mouseGroup.rotation.y = -0.12;

  stage.add(mouseGroup);
  world.mouse = mouseGroup;
}

function createScreenCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  world.screenCanvas = canvas;
  world.screenCtx = ctx;
  world.screenTexture = texture;
  drawLaptopScreen();
}

function drawLaptopScreen() {
  const ctx = world.screenCtx;
  if (!ctx) return;

  const w = 1024;
  const h = 640;

  if (state.screenState === 'sleep') {
    ctx.fillStyle = '#050708';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(w / 2 - 140, h / 2 - 45, 280, 90);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('JAIJITESH.OS // SLEEP', w / 2, h / 2 - 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('CLICK WORKSTATION TO BOOT', w / 2, h / 2 + 22);
  } else if (state.screenState === 'boot') {
    ctx.fillStyle = '#080a0c';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INITIALIZING JAIJITESH.OS v2.6.4...', w / 2, h / 2 - 15);

    ctx.fillStyle = '#1c222b';
    ctx.fillRect(w / 2 - 180, h / 2 + 15, 360, 10);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(w / 2 - 180, h / 2 + 15, 280, 10);
  } else {
    ctx.fillStyle = '#090b0d';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#111418';
    ctx.fillRect(0, h - 42, w, 42);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⊞ START', 16, h - 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace';
    ctx.fillText('JAIJITESH.OS ACTIVE', 120, h - 16);

    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), w - 20, h - 16);
  }

  world.screenTexture.needsUpdate = true;
}

async function loadLaptopModel() {
  createScreenCanvas();
  try {
    const gltf = await modelManager.loadGlb('assets/gaming_laptop.glb');
    const laptopRoot = gltf.scene;

    laptopRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (/screen|display|monitor|lcd|glass/i.test(child.name)) {
          child.material = new THREE.MeshBasicMaterial({
            map: world.screenTexture,
            toneMapped: false
          });
          world.screenMesh = child;
        } else if (child.material) {
          child.material = child.material.clone();
          child.material.roughness = 0.45;
          child.material.metalness = 0.75;
          if (child.material.map) child.material.map.colorSpace = THREE.SRGBColorSpace;
        }
      }
    });

    laptopRoot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(laptopRoot);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = 0.54 / maxDim;

    laptopRoot.scale.set(targetScale, targetScale, targetScale);
    laptopRoot.updateMatrixWorld(true);

    const boxScaled = new THREE.Box3().setFromObject(laptopRoot);
    const yOffset = -boxScaled.min.y;

    laptopRoot.position.set(0, DESK_TOP_HEIGHT + yOffset + 0.002, 0.05);

    stage.add(laptopRoot);
    world.laptop = laptopRoot;
    world.clickable.push(laptopRoot);
  } catch (err) {
    console.error('Failed to load laptop GLB:', err);
  }
}

async function buildWorld() {
  if (!isWebGLAvailable) return;
  setLoading(15, 'CREATING STUDIO LIGHTING & RIGGING');
  createStudioLighting();

  setLoading(30, 'CONSTRUCTING LUXURY WORKBENCH');
  createLuxuryDesk();
  createMouse();

  setLoading(45, 'INITIALIZING OMEN WORKSTATION PORTAL');
  await loadLaptopModel();

  setLoading(60, 'LOADING 3D HARDWARE TELEMETRY NODES');
  const clickables = await modelManager.loadAllHardware(stage, DESK_TOP_HEIGHT, (p, txt) => {
    setLoading(60 + Math.round((p / 100) * 35), txt);
  });
  world.clickable.push(...clickables);

  camera.position.copy(world.overview.position);
  controls.target.copy(world.overview.target);
  controls.update();

  setLoading(100, 'LAB BENCH CALIBRATED');
  setTimeout(() => {
    loading.classList.add('is-hidden');
    state.ready = true;
    sound.powerOn();
  }, 400);
}

function enterLab() {
  if (state.entered) return;
  state.entered = true;
  sound.click(520, 0.03);

  intro.style.transform = 'translateY(-100%)';
  intro.style.opacity = '0';
  worldUi.classList.add('is-visible');

  // Initialize DesktopManager early in background
  if (!world.desktopManager) {
    world.desktopManager = new DesktopManager(
      screenBody,
      (key) => inspectHardware(key),
      () => exitLaptop()
    );
  }

  easeCamera(world.overview.position, world.overview.target, 1.2, () => {
    showToast('WORKBENCH READY • CLICK HARDWARE OR LAPTOP TO INSPECT');
  });
}
window.enterLab = enterLab;

let pendingAppToOpen = null;

function focusLaptop(targetApp = null) {
  if (!world.laptop) {
    bootSystem();
    return;
  }
  state.busy = true;
  state.focused = true;
  state.inspecting = null;
  if (targetApp) pendingAppToOpen = targetApp;
  worldInstruction.classList.add('is-hidden');
  hideInspectorOverlay();
  controls.enabled = false;

  sound.click(450, 0.04);

  motion.to(world.laptop.rotation, {
    x: 0.34,
    duration: 0.85,
    ease: 'power2.inOut'
  });

  const screenTarget = new THREE.Vector3(0, DESK_TOP_HEIGHT + 0.38, 0.05);
  const approachPos = new THREE.Vector3(0, DESK_TOP_HEIGHT + 0.38, 0.95);
  const deepFillPos = new THREE.Vector3(0, DESK_TOP_HEIGHT + 0.38, 0.36);

  easeCamera(approachPos, screenTarget, 0.75, () => {
    easeCamera(deepFillPos, screenTarget, 0.65, () => {
      state.busy = false;
      if (state.screenState === 'sleep') {
        bootSystem();
      } else {
        openScreen();
      }
    });
  });
}

function bootSystem() {
  state.screenState = 'boot';
  drawLaptopScreen();
  sound.bootChime();
  showToast('INITIALIZING JAIJITESH.OS v2.6.4');

  setTimeout(() => {
    state.screenState = 'desktop';
    drawLaptopScreen();
    openScreen();
    sound.click(850, 0.03);
  }, 900);
}

function openScreen() {
  if (state.screenState !== 'sleep') {
    screenUi.classList.add('is-open');
    setTimeout(() => {
      if (screenUi.classList.contains('is-open')) {
        state.is3DOffloaded = true;
      }
      if (pendingAppToOpen) {
        if (world.desktopManager) {
          if (pendingAppToOpen.startsWith('res_') || pendingAppToOpen === 'about') {
            world.desktopManager.openDocument(pendingAppToOpen);
          } else {
            world.desktopManager.openApp(pendingAppToOpen);
          }
        }
        pendingAppToOpen = null;
      }
    }, 400);
  }
}

function exitLaptop() {
  state.busy = true;
  state.is3DOffloaded = false;
  screenUi.classList.remove('is-open');
  hideInspectorOverlay();
  state.focused = false;
  state.inspecting = null;
  if (controls) controls.enabled = true;

  if (world.laptop) {
    motion.to(world.laptop.rotation, {
      x: 0,
      duration: 0.9,
      ease: 'power3.inOut'
    });
  }

  sound.click(320, 0.03);
  easeCamera(world.overview.position, world.overview.target, 0.95, () => {
    state.busy = false;
  });
}

function inspectHardware(key) {
  const def = HARDWARE_DEFINITIONS[key];
  if (!def) return;

  state.busy = true;
  state.inspecting = key;
  state.is3DOffloaded = false;
  screenUi.classList.remove('is-open');
  worldInstruction.classList.add('is-hidden');

  const model = modelManager.benchMeshes.get(key);
  if (!model) {
    state.busy = false;
    return;
  }

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z);

  if (controls) controls.enabled = true;
  state.focused = false;

  const camPos = center.clone().add(new THREE.Vector3(span * 1.3, span * 0.9, span * 1.5));
  sound.sonarPing(880);
  easeCamera(camPos, center, 0.95, () => {
    state.busy = false;
  });

  showInspectorOverlay(def);
}
window.inspectHardware = inspectHardware;

// High-Precision Tactical HUD Cursor Elements
const hudCursor = $('#hudCursor');
const cursorDot = $('#cursorDot');
const cursorRing = $('#cursorRing');
const cursorTag = $('#cursorTag');
const cursorMode = $('#cursorMode');
const cursorLabel = $('#cursorLabel');

let mouseX = -100, mouseY = -100;
let ringX = -100, ringY = -100;
let isMouseDown = false;

function showInspectorOverlay(def) {
  $('#inspectEyebrow').textContent = def.eyebrow;
  $('#inspectTitle').textContent = def.title;
  $('#inspectCopy').textContent = def.summary;
  $('#inspectData').innerHTML = def.specs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

  const openProjBtn = $('#inspectOpenProject');
  if (openProjBtn) {
    if (def.projectId) {
      openProjBtn.style.display = 'block';
      openProjBtn.textContent = `EXPLORE ${def.projectId.toUpperCase()} CASE FILE ↗`;
      openProjBtn.onclick = () => {
        focusLaptop(def.projectId);
      };
    } else if (def.id === 'camera') {
      openProjBtn.style.display = 'block';
      openProjBtn.textContent = 'EXPLORE RESEARCH CASE FILE: COLOR SPLITTER ↗';
      openProjBtn.onclick = () => {
        focusLaptop('res_color');
      };
    } else {
      openProjBtn.style.display = 'none';
      openProjBtn.onclick = null;
    }
  }

  inspect.classList.add('is-open');
}

function hideInspectorOverlay() {
  inspect.classList.remove('is-open');
  state.inspecting = null;
}

// Touch / Pointer Tracking to distinguish click/tap from drag/orbit
let pointerDownPos = { x: 0, y: 0 };
let pointerDownTime = 0;

function handlePointerDown(e) {
  pointerDownPos = { x: e.clientX, y: e.clientY };
  pointerDownTime = Date.now();
  isMouseDown = true;
  hudCursor?.classList.add('is-active');
}

function handlePointerUp(e) {
  isMouseDown = false;
  hudCursor?.classList.remove('is-active');

  const dx = e.clientX - pointerDownPos.x;
  const dy = e.clientY - pointerDownPos.y;
  const dist = Math.hypot(dx, dy);
  const dt = Date.now() - pointerDownTime;

  // Only trigger 3D object pick if tap/click was within small travel distance and short duration
  if (dist < 10 && dt < 400) {
    pick3DObject(e);
  }
}

function pick3DObject(e) {
  if (!state.ready || screenUi.classList.contains('is-open')) return;

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(world.clickable, true);
  if (!hits.length) {
    if (state.inspecting) {
      hideInspectorOverlay();
    }
    return;
  }

  let obj = hits[0].object;
  while (obj && !obj.userData.hardwareKey && obj !== world.laptop) {
    obj = obj.parent;
  }

  if (obj?.userData?.hardwareKey) {
    inspectHardware(obj.userData.hardwareKey);
  } else {
    hideInspectorOverlay();
    focusLaptop();
  }
}

function updateCursor(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (hudCursor) {
    hudCursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  }

  const target = e.target;
  const isButton = target && target.closest && target.closest('button, a, [role="button"], input, select, .enter');
  const isInput = target && target.closest && target.closest('input, textarea');

  if (isInput) {
    if (hudCursor) hudCursor.className = 'hud-cursor is-text';
    if (cursorMode) cursorMode.textContent = 'CLI';
    if (cursorLabel) cursorLabel.textContent = 'INPUT';
    return;
  }

  if (isButton) {
    if (hudCursor) hudCursor.className = 'hud-cursor is-action';
    if (cursorMode) cursorMode.textContent = 'ACT';
    const label = target.getAttribute('aria-label') || target.textContent || 'SELECT';
    if (cursorLabel) cursorLabel.textContent = label.trim().slice(0, 14).toUpperCase();
    return;
  }

  if (state.ready && !screenUi.classList.contains('is-open')) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(world.clickable, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !obj.userData.hardwareKey && obj !== world.laptop) {
        obj = obj.parent;
      }
      const hwKey = obj?.userData?.hardwareKey;
      if (hudCursor) hudCursor.className = 'hud-cursor is-locked';
      if (hwKey) {
        const def = HARDWARE_DEFINITIONS[hwKey];
        if (cursorMode) cursorMode.textContent = 'CAD';
        if (cursorLabel) cursorLabel.textContent = def ? def.title.split('//')[0].trim() : 'HARDWARE';
      } else {
        if (cursorMode) cursorMode.textContent = 'HOST';
        if (cursorLabel) cursorLabel.textContent = 'WORKSTATION';
      }
      return;
    }
  }

  if (hudCursor) {
    hudCursor.className = isMouseDown ? 'hud-cursor is-active' : 'hud-cursor';
  }
}

function updateIdleAnimations(time) {
  const rpi = modelManager.benchMeshes.get('raspberry');
  if (rpi && rpi.userData.baseY) {
    rpi.position.y = rpi.userData.baseY + Math.sin(time * 2.2) * 0.0016;
  }

  const esp = modelManager.benchMeshes.get('esp32');
  if (esp && esp.userData.baseY) {
    esp.position.y = esp.userData.baseY + Math.sin(time * 2.6 + 1.2) * 0.0016;
  }

  const bot = modelManager.benchMeshes.get('robot');
  if (bot && bot.userData.baseY) {
    bot.position.y = bot.userData.baseY + Math.sin(time * 1.5) * 0.0012;
  }

  const dog = modelManager.benchMeshes.get('dog');
  if (dog && dog.userData.baseY) {
    dog.position.y = dog.userData.baseY + Math.sin(time * 1.8) * 0.002;
  }

  const cat = modelManager.benchMeshes.get('cat');
  if (cat && cat.userData.baseY) {
    cat.position.y = cat.userData.baseY + Math.sin(time * 2.0 + 0.8) * 0.0015;
  }
}

function bindEvents() {
  $('#enter').addEventListener('click', enterLab);
  $('#homeBtn').addEventListener('click', exitLaptop);
  $('#inspectClose').addEventListener('click', hideInspectorOverlay);
  $('#inspectBack').addEventListener('click', () => {
    hideInspectorOverlay();
    exitLaptop();
  });

  // Bench Audio and Theme Controls
  const benchSound = $('#benchSoundBtn');
  benchSound?.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    benchSound.textContent = isMuted ? '🔇' : '🔊';
    sound.click(600, 0.02);
  });

  const benchTheme = $('#benchThemeBtn');
  benchTheme?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'matrix' : (cur === 'matrix' ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', next);
    set3DTheme(next);
    sound.click(750, 0.02);
  });

  // Fallback direct entrance
  webglFallbackBtn?.addEventListener('click', () => {
    webglFallback.hidden = true;
    enterLab();
    bootSystem();
  });

  $$('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'focus-laptop') focusLaptop();
      if (btn.dataset.action === 'overview') exitLaptop();
    });
  });

  window.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointermove', updateCursor);

  document.addEventListener('mouseleave', () => {
    if (hudCursor) hudCursor.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    if (hudCursor) hudCursor.style.opacity = '1';
  });

  window.addEventListener('resize', () => {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Global Keyboard Accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const lightbox = $('#winLightbox');
      const startMenu = $('#winStartMenu');

      if (lightbox && !lightbox.hidden) {
        lightbox.hidden = true;
        lightbox.classList.remove('is-open');
      } else if (inspect.classList.contains('is-open')) {
        hideInspectorOverlay();
      } else if (startMenu && startMenu.classList.contains('is-open')) {
        world.desktopManager?.closeStartMenu();
      } else if (screenUi.classList.contains('is-open')) {
        exitLaptop();
      }
    } else if (e.key === 'Enter') {
      if (!state.entered && intro.style.opacity !== '0') {
        enterLab();
      }
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  
  // Smooth tactical HUD cursor follower
  ringX += (mouseX - ringX) * 0.28;
  ringY += (mouseY - ringY) * 0.28;
  if (cursorRing) {
    cursorRing.style.transform = `translate3d(${ringX - mouseX}px, ${ringY - mouseY}px, 0)`;
  }

  // Skip 3D frame rendering when OS is maximized full-screen to save GPU
  if (state.is3DOffloaded || !renderer || !scene || !camera) return;

  const time = clock.getElapsedTime();
  updateIdleAnimations(time);
  controls?.update();
  renderer.render(scene, camera);
}

async function start() {
  bindEvents();
  animate();
  try {
    setLoading(5, 'PREPARING WORKBENCH & STUDIO SETUP');
    await buildWorld();
  } catch (err) {
    console.error('Initialization error:', err);
    loadingText.textContent = 'INITIALIZATION FAILED';
    loadingDetail.textContent = 'Check console logs.';
    showToast('ASSET LOAD FAILED');
  }
}

start();
