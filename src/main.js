import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sound } from './js/audio.js';
import { modelManager, HARDWARE_DEFINITIONS } from './js/cadLoader.js?v=3';
import { DesktopManager } from './js/desktop.js';
import { HomeTubesCursor } from './js/tubesCursor.js';

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

  camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.01, 100);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  // Orbit Constraints allowing rich exploration of the room
  controls.minAzimuthAngle = -Math.PI * 0.45;
  controls.maxAzimuthAngle = Math.PI * 0.45;
  controls.minPolarAngle = Math.PI * 0.15;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 0.6;
  controls.maxDistance = 7.5;
} catch (e) {
  console.warn('WebGL Initialization failed. Activating graceful 2D fallback.', e);
  isWebGLAvailable = false;
  if (webglFallback) webglFallback.hidden = false;
}

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const stage = new THREE.Group();
if (scene) scene.add(stage);

const DESK_TOP_HEIGHT = 0.850; // Tabletop height in world units

const world = {
  room: null,
  roomMixer: null,
  desk: null,
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
    position: new THREE.Vector3(-1.85, 1.85, 3.2),
    target: new THREE.Vector3(-1.60, 0.95, -0.6)
  }
};

export function set3DTheme(themeName) {
  state.currentTheme = themeName;
  if (!scene) return;

  if (themeName === 'light') {
    scene.background.set('#d8e1e8');
    if (renderer) renderer.toneMappingExposure = 1.05;
  } else if (themeName === 'matrix') {
    scene.background.set('#030706');
    if (renderer) renderer.toneMappingExposure = 1.25;
  } else {
    scene.background.set('#07090b');
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
  const ambient = new THREE.AmbientLight('#ffffff', 1.8);
  scene.add(ambient);

  // Key directional light illuminating the room
  const keyLight = new THREE.DirectionalLight('#ffffff', 2.0);
  keyLight.position.set(-1.5, 4.5, 2.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);

  // Fill directional light from side
  const fillLight = new THREE.DirectionalLight('#93c5fd', 1.2);
  fillLight.position.set(3.0, 3.0, -1.0);
  scene.add(fillLight);

  // Main overhead ceiling lamp point light
  const lampLight = new THREE.PointLight('#ffeedb', 3.5, 9.0, 1.1);
  lampLight.position.set(-3.27, 2.70, -2.15);
  lampLight.castShadow = true;
  lampLight.shadow.bias = -0.0001;
  lampLight.shadow.mapSize.width = 1024;
  lampLight.shadow.mapSize.height = 1024;
  scene.add(lampLight);

  // Monitor array cyan glow point light on the computer desk
  const monitorGlow = new THREE.PointLight('#00f0ff', 3.0, 5.0, 1.2);
  monitorGlow.position.set(0.095, 1.15, -0.45);
  scene.add(monitorGlow);

  // Bed area soft blue ambient light
  const bedLight = new THREE.PointLight('#7dd3fc', 2.0, 5.0, 1.4);
  bedLight.position.set(-0.65, 1.25, -1.85);
  scene.add(bedLight);

  // Airlock / entrance warm accent light
  const airlockLight = new THREE.PointLight('#ffaa22', 2.2, 7.0, 1.2);
  airlockLight.position.set(3.5, 1.6, 1.5);
  scene.add(airlockLight);
}

async function loadFuturisticRoom() {
  if (!stage) return;
  try {
    const gltf = await modelManager.loadGlb('assets/futuristic_room.glb');
    const roomRoot = gltf.scene;

    roomRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Hide handcuffs and bottle from the sofa coffee table
        if (/handcuff|bottle/i.test(child.name) || /handcuff|bottle/i.test(child.parent?.name)) {
          child.visible = false;
        }

        // Hide middle monitor on desk (Monitor.001) so our HP OMEN laptop takes center stage
        if (/Monitor\.001/i.test(child.name) || /Monitor\.001/i.test(child.parent?.name)) {
          child.visible = false;
        }

        // Hide decorative slatted panels to provide wide unobstructed view of the room
        if (/decorativepanel|slat/i.test(child.name) || /decorativepanel|slat/i.test(child.parent?.name)) {
          child.visible = false;
        }
      }
    });

    const handcuffsNode = roomRoot.getObjectByName('Handcuffs&Bottle');
    if (handcuffsNode) handcuffsNode.visible = false;
    const monitor1Node = roomRoot.getObjectByName('Monitor.001');
    if (monitor1Node) monitor1Node.visible = false;

    // Initialize animation mixer for fan spinning animation
    if (gltf.animations && gltf.animations.length > 0) {
      world.roomMixer = new THREE.AnimationMixer(roomRoot);
      gltf.animations.forEach((clip) => {
        const action = world.roomMixer.clipAction(clip);
        action.play();
      });
    }

    stage.add(roomRoot);
    world.room = roomRoot;
  } catch (err) {
    console.error('Failed to load futuristic room GLB:', err);
  }
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
  texture.flipY = false;

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
    const gltf = await modelManager.loadGlb('assets/hp_omen_laptop.glb');
    const laptopRoot = gltf.scene;

    laptopRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material?.name === 'screen' || /screen|display|monitor|lcd|glass/i.test(child.name)) {
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
    const targetScale = 0.48 / maxDim;

    laptopRoot.scale.set(targetScale, targetScale, targetScale);
    laptopRoot.rotation.set(0, 0, 0);
    laptopRoot.updateMatrixWorld(true);

    const boxScaled = new THREE.Box3().setFromObject(laptopRoot);
    const yOffset = -boxScaled.min.y;

    // Positioned directly at center desk monitor slot
    laptopRoot.position.set(0.095, 0.850 + yOffset + 0.001, -0.28);

    stage.add(laptopRoot);
    world.laptop = laptopRoot;
    world.clickable.push(laptopRoot);
  } catch (err) {
    console.error('Failed to load HP Omen laptop GLB:', err);
  }
}

async function buildWorld() {
  if (!isWebGLAvailable) return;
  setLoading(15, 'CREATING CYBERPUNK STUDIO LIGHTING');
  createStudioLighting();

  setLoading(30, 'LOADING FUTURISTIC ROOM ENVIRONMENT');
  await loadFuturisticRoom();

  setLoading(60, 'INITIALIZING OMEN WORKSTATION PORTAL');
  await loadLaptopModel();

  setLoading(75, 'PLACING 3D HARDWARE TELEMETRY NODES');
  const clickables = await modelManager.loadAllHardware(stage, 0.850, (p, txt) => {
    setLoading(75 + Math.round((p / 100) * 20), txt);
  });
  world.clickable.push(...clickables);

  camera.position.copy(world.overview.position);
  controls.target.copy(world.overview.target);
  controls.update();

  setLoading(100, 'ROOM CALIBRATED');
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

  // Smoothly hide intro 3D tubes cursor to free GPU resources
  if (window.tubesCursorInstance) {
    window.tubesCursorInstance.hide();
  }

  intro.classList.add('is-exiting');
  intro.style.display = 'none';
  intro.style.visibility = 'hidden';
  intro.style.opacity = '0';
  intro.style.pointerEvents = 'none';

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

  const screenTarget = new THREE.Vector3(0.095, 1.05, -0.28);
  const approachPos = new THREE.Vector3(0.095, 1.15, 0.55);
  const deepFillPos = new THREE.Vector3(0.095, 1.05, 0.10);

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

// Initialize 3D Tubes Cursor on the Landing Screen
let tubesCursorInstance = null;
try {
  tubesCursorInstance = new HomeTubesCursor('tubesCanvas');
  window.tubesCursorInstance = tubesCursorInstance;
} catch (e) {
  console.warn('HomeTubesCursor initialization deferred:', e);
}

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
  if (canvas) canvas.style.cursor = 'grabbing';
}

function handlePointerUp(e) {
  isMouseDown = false;
  if (canvas) canvas.style.cursor = 'grab';

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
  if (state.ready && !screenUi.classList.contains('is-open')) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(world.clickable, true);
    if (canvas) {
      if (hits.length > 0) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = isMouseDown ? 'grabbing' : 'grab';
      }
    }
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
  window.addEventListener('pointermove', updateCursor, { passive: true });

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

  // Skip 3D frame rendering when OS is maximized full-screen to save GPU
  if (state.is3DOffloaded || !renderer || !scene || !camera) return;

  const delta = clock.getDelta();
  if (world.roomMixer) {
    world.roomMixer.update(delta);
  }

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
