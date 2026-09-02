import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { sound } from './js/audio.js';
import { modelManager, HARDWARE_DEFINITIONS } from './js/cadLoader.js?v=3';
import { PROJECTS } from './js/portfolioData.js?v=3';
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
const fpovHud = $('#fpovHud');
const crosshair = $('#crosshair');
const fpovPrompt = $('#fpovPrompt');
const fpovPromptText = $('#fpovPromptText');
const doorAlert = $('#doorAlert');
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
  currentTheme: 'dark',
  fpovMode: false,
  pointerLocked: false
};

// First Person POV Controller State
const fpov = {
  yaw: -0.35,
  pitch: 0.0,
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  moveUp: false,
  moveDown: false,
  speed: 3.2,
  verticalSpeed: 2.4,
  lookSensitivity: 0.0022,
  velocity: new THREE.Vector3(),
  bounds: {
    minX: -4.50, maxX: 2.50,
    minY: 0.65,  maxY: 2.40,
    minZ: -2.60, maxZ: 2.10
  },
  activeInteractable: null,
  magneticTarget: null
};

// Three.js Scene Setup with WebGL Safety Check
let renderer, scene, camera, controls, pmremGenerator;
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
  renderer.toneMappingExposure = 1.15;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#07090b');

  // Realistic PBR Environment Map eliminating flat plastic look
  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

  camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.01, 100);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.enabled = false; // Orbit disabled in favor of FPOV game navigation
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  // Strict Orbit Constraints if toggled back
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
const pointer = new THREE.Vector2(0, 0); // Screen center for FPOV
const stage = new THREE.Group();
if (scene) scene.add(stage);

const DESK_TOP_HEIGHT = 0.850;

const world = {
  room: null,
  roomMixer: null,
  fanAction: null,
  desk: null,
  mouse: null,
  laptop: null,
  screenMesh: null,
  screenCanvas: null,
  screenCtx: null,
  screenTexture: null,
  desktopManager: null,
  clickable: [],
  interactables: [],
  switchboard: null,
  switches: {},
  carouselPanels: [],
  doorNode: null,
  lights: {
    bedLed: null,
    tube1: null,
    tube2: null,
    deskHud: null,
    ambient: null
  },
  switchStates: {
    bedLed: true,
    tubes: true,
    deskHud: true,
    fan: true
  },
  overview: {
    position: new THREE.Vector3(-1.80, 1.45, 1.80),
    target: new THREE.Vector3(-0.95, 1.05, -0.45)
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
    if (renderer) renderer.toneMappingExposure = 1.15;
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

// =============================================================================
// AUTHENTIC ROOM LIGHTING (REMOVING GENERIC BULBS, MATCHING SKETCHFAB PALETTE)
// =============================================================================
function createStudioLighting() {
  if (!scene) return;

  // 1. Atmospheric Ambient Fill
  world.lights.ambient = new THREE.AmbientLight('#0f172a', 0.85);
  scene.add(world.lights.ambient);

  // 2. Bed Overhead Giant Rectangular LED Light Panel
  // Placed right on the underside of the upper bunk structure
  world.lights.bedLed = new THREE.SpotLight('#e0f2fe', 3.4, 5.5, Math.PI * 0.45, 0.35, 1.2);
  world.lights.bedLed.position.set(-0.85, 1.62, -2.15);
  world.lights.bedLed.target.position.set(-0.85, 0.4, -2.15);
  world.lights.bedLed.castShadow = true;
  world.lights.bedLed.shadow.mapSize.width = 1024;
  world.lights.bedLed.shadow.mapSize.height = 1024;
  world.lights.bedLed.shadow.bias = -0.0001;
  scene.add(world.lights.bedLed);
  scene.add(world.lights.bedLed.target);

  // 3. Fluorescent Ceiling Tubelight 1 (Above Sofa / Coffee Table)
  world.lights.tube1 = new THREE.PointLight('#ffeedb', 2.4, 6.5, 1.2);
  world.lights.tube1.position.set(-3.27, 2.75, -2.15);
  world.lights.tube1.castShadow = true;
  world.lights.tube1.shadow.mapSize.width = 1024;
  world.lights.tube1.shadow.mapSize.height = 1024;
  scene.add(world.lights.tube1);

  // 4. Fluorescent Ceiling Tubelight 2 (Overhead Hallway Center)
  world.lights.tube2 = new THREE.PointLight('#e2e8f0', 2.1, 6.0, 1.2);
  world.lights.tube2.position.set(-0.5, 2.75, 0.2);
  scene.add(world.lights.tube2);

  // 5. Desk HUD Monitors Cyan Emission Glow
  world.lights.deskHud = new THREE.PointLight('#00f0ff', 2.5, 3.5, 1.4);
  world.lights.deskHud.position.set(0.10, 1.05, -0.35);
  scene.add(world.lights.deskHud);
}

// =============================================================================
// FUTURISTIC ROOM GLB LOADER WITH TRANSLUCENCY FIX & OPACITY ENFORCEMENT
// =============================================================================
async function loadFuturisticRoom() {
  if (!stage) return;
  try {
    const gltf = await modelManager.loadGlb('assets/futuristic_room.glb');
    const roomRoot = gltf.scene;

    roomRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Fix Upper Bunk, Walls, and Ventilation Translucency:
        // Enforce solid opacity and depth writing on all room geometry
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!mat) return;
            const isPlant = /plant|leaf|foliage/i.test(mat.name) || /plant|leaf/i.test(child.name);
            mat.transparent = isPlant;
            mat.depthWrite = true;
            mat.depthTest = true;
            if ('transmission' in mat) mat.transmission = 0;
            mat.opacity = 1.0;

            // Fix baseColor multiplying black on walls
            if (mat.color && (mat.color.r < 0.1 && mat.color.g < 0.1 && mat.color.b < 0.1) && mat.map) {
              mat.color.set(0xffffff);
            }

            // Emissive radiance for glowing panels, HUDs, and ceiling lamps
            if (mat.emissiveMap) {
              mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
              mat.emissive.set(0xffffff);
              mat.emissiveIntensity = 2.0;
            }
          });
        }

        // Hide handcuffs & bottle from the coffee table
        if (/handcuff|bottle/i.test(child.name) || /handcuff|bottle/i.test(child.parent?.name)) {
          child.visible = false;
        }

        // Hide middle monitor on desk (Monitor.001) so our HP OMEN laptop takes center stage
        if (/Monitor\.001/i.test(child.name) || /Monitor\.001/i.test(child.parent?.name)) {
          child.visible = false;
        }

        // Hide decorative slatted panels to provide wide view
        if (/decorativepanel|slat/i.test(child.name) || /decorativepanel|slat/i.test(child.parent?.name)) {
          child.visible = false;
        }
      }
    });

    const handcuffsNode = roomRoot.getObjectByName('Handcuffs&Bottle');
    if (handcuffsNode) handcuffsNode.visible = false;
    const monitor1Node = roomRoot.getObjectByName('Monitor.001');
    if (monitor1Node) monitor1Node.visible = false;

    // Identify Yellow Vault Airlock Door for interaction & pushback
    const door = roomRoot.getObjectByName('Door') || roomRoot.getObjectByName('Airlock');
    if (door) {
      door.userData.isYellowDoor = true;
      door.userData.actionPrompt = 'OPEN VAULT AIRLOCK';
      world.doorNode = door;
      world.interactables.push(door);
      world.clickable.push(door);
    }

    // Initialize animation mixer for fan spinning animation
    if (gltf.animations && gltf.animations.length > 0) {
      world.roomMixer = new THREE.AnimationMixer(roomRoot);
      gltf.animations.forEach((clip) => {
        const action = world.roomMixer.clipAction(clip);
        action.play();
        if (/fan/i.test(clip.name)) {
          world.fanAction = action;
        }
      });
      if (!world.fanAction && gltf.animations.length > 0) {
        world.fanAction = world.roomMixer.clipAction(gltf.animations[0]);
      }
    }

    // Directing Chevrons on Surrounding Desk Monitors pointing to Laptop
    createMonitorDirectingChevrons(roomRoot);

    stage.add(roomRoot);
    world.room = roomRoot;
  } catch (err) {
    console.error('Failed to load futuristic room GLB:', err);
  }
}

// Holographic arrows on surrounding desk monitors pointing to center workstation
function createMonitorDirectingChevrons(roomRoot) {
  const chevronCanvas = document.createElement('canvas');
  chevronCanvas.width = 512;
  chevronCanvas.height = 256;
  const ctx = chevronCanvas.getContext('2d');

  function drawChevrons(t) {
    ctx.clearRect(0, 0, 512, 256);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 496, 240);

    const pulse = 0.6 + Math.sin(t * 4.0) * 0.4;
    ctx.fillStyle = `rgba(0, 240, 255, ${pulse})`;
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▶ WORKSTATION TERMINAL ◀', 256, 120);

    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.fillText('CLICK CENTER CONSOLE TO BOOT OS', 256, 165);
  }

  drawChevrons(0);
  const chevronTex = new THREE.CanvasTexture(chevronCanvas);
  chevronTex.colorSpace = THREE.SRGBColorSpace;

  const arrowPlaneGeo = new THREE.PlaneGeometry(0.38, 0.19);
  const arrowPlaneMat = new THREE.MeshBasicMaterial({
    map: chevronTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // Attach guidance prompt directly above center laptop slot
  const arrowMesh = new THREE.Mesh(arrowPlaneGeo, arrowPlaneMat);
  arrowMesh.position.set(0.095, 1.48, -0.42);
  arrowMesh.rotation.set(0, 0, 0);
  stage.add(arrowMesh);

  world.chevronTexture = chevronTex;
  world.chevronDraw = drawChevrons;
}

// =============================================================================
// INTERACTIVE WALL SWITCHBOARD (BED LED, TUBES, DESK HUD, FAN)
// =============================================================================
function createInteractiveSwitchboard() {
  const switchGroup = new THREE.Group();
  switchGroup.position.set(-1.75, 1.25, -2.62); // Mounted on wall near bed
  switchGroup.rotation.set(0, 0, 0);

  // Brushed steel mounting plate
  const plateGeo = new THREE.BoxGeometry(0.36, 0.48, 0.02);
  const plateMat = new THREE.MeshStandardMaterial({
    color: '#1a222d',
    roughness: 0.35,
    metalness: 0.85,
    name: 'switch_panel_plate'
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  switchGroup.add(plate);

  const configs = [
    { key: 'bedLed',  label: 'BED LED',   y: 0.15, action: toggleBedLed },
    { key: 'tubes',   label: 'TUBELIGHTS',y: 0.05, action: toggleTubes },
    { key: 'deskHud', label: 'DESK HUDS', y: -0.05, action: toggleDeskHud },
    { key: 'fan',     label: 'VENT FAN',  y: -0.15, action: toggleFan }
  ];

  configs.forEach(cfg => {
    const btnGeo = new THREE.BoxGeometry(0.24, 0.055, 0.025);
    const btnMat = new THREE.MeshStandardMaterial({
      color: '#0d131a',
      roughness: 0.5,
      metalness: 0.7
    });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.position.set(0, cfg.y, 0.015);

    // Glowing LED status indicator
    const ledGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.015, 16);
    ledGeo.rotateX(Math.PI / 2);
    const ledMat = new THREE.MeshStandardMaterial({
      color: '#10b981',
      emissive: '#10b981',
      emissiveIntensity: 2.2,
      roughness: 0.2
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.085, 0, 0.012);
    btn.add(led);

    btn.userData.isSwitch = true;
    btn.userData.switchKey = cfg.key;
    btn.userData.actionPrompt = `TOGGLE ${cfg.label}`;
    btn.userData.toggleFn = cfg.action;
    btn.userData.ledMesh = led;

    switchGroup.add(btn);
    world.switches[cfg.key] = { btn, led, ledMat, action: cfg.action };
    world.interactables.push(btn);
    world.clickable.push(btn);
  });

  stage.add(switchGroup);
  world.switchboard = switchGroup;
}

function toggleBedLed() {
  world.switchStates.bedLed = !world.switchStates.bedLed;
  const active = world.switchStates.bedLed;
  if (world.lights.bedLed) world.lights.bedLed.visible = active;
  updateSwitchLed('bedLed', active);
  sound.click(active ? 720 : 380, 0.03);
  showToast(active ? 'BED LED PANEL // ACTIVATED' : 'BED LED PANEL // DEACTIVATED');
}

function toggleTubes() {
  world.switchStates.tubes = !world.switchStates.tubes;
  const active = world.switchStates.tubes;
  if (world.lights.tube1) world.lights.tube1.visible = active;
  if (world.lights.tube2) world.lights.tube2.visible = active;
  updateSwitchLed('tubes', active);
  sound.click(active ? 720 : 380, 0.03);
  showToast(active ? 'CEILING TUBELIGHTS // ACTIVATED' : 'CEILING TUBELIGHTS // DEACTIVATED');
}

function toggleDeskHud() {
  world.switchStates.deskHud = !world.switchStates.deskHud;
  const active = world.switchStates.deskHud;
  if (world.lights.deskHud) world.lights.deskHud.visible = active;
  updateSwitchLed('deskHud', active);
  sound.click(active ? 720 : 380, 0.03);
  showToast(active ? 'DESK HUD MONITORS // ON' : 'DESK HUD MONITORS // SLEEP');
}

function toggleFan() {
  world.switchStates.fan = !world.switchStates.fan;
  const active = world.switchStates.fan;
  if (world.fanAction) {
    if (active) {
      world.fanAction.paused = false;
      world.fanAction.play();
    } else {
      world.fanAction.paused = true;
    }
  }
  updateSwitchLed('fan', active);
  sound.click(active ? 720 : 380, 0.03);
  showToast(active ? 'VENTILATION FAN // RUNNING' : 'VENTILATION FAN // STOPPED');
}

function updateSwitchLed(key, isActive) {
  const sw = world.switches[key];
  if (!sw || !sw.ledMat) return;
  if (isActive) {
    sw.ledMat.color.set('#10b981');
    sw.ledMat.emissive.set('#10b981');
    sw.ledMat.emissiveIntensity = 2.2;
  } else {
    sw.ledMat.color.set('#ef4444');
    sw.ledMat.emissive.set('#ef4444');
    sw.ledMat.emissiveIntensity = 1.8;
  }
}

// =============================================================================
// 3D PROJECT MEDIA CAROUSEL ON RIGHT PARTITION WALL
// =============================================================================
function createPanoramicMediaWall() {
  const projectList = Object.values(PROJECTS);
  if (!projectList.length) return;

  const carouselGroup = new THREE.Group();
  carouselGroup.position.set(2.45, 1.40, -0.2);
  carouselGroup.rotation.set(0, -Math.PI / 2, 0); // Mounted facing into room

  const cardWidth = 0.55;
  const cardHeight = 0.38;
  const spacing = 0.08;
  const totalCount = projectList.length;

  world.carouselPanels = [];

  projectList.forEach((proj, idx) => {
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 512;
    cardCanvas.height = 360;
    const ctx = cardCanvas.getContext('2d');

    // Cyberpunk Glass Card Canvas
    ctx.fillStyle = '#080d14';
    ctx.fillRect(0, 0, 512, 360);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 500, 348);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`PROJ // 0${idx + 1} • ${proj.badge || 'SYSTEM'}`, 24, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(proj.title, 24, 78);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText(proj.category || 'Engineering', 24, 106);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '13px sans-serif';
    const words = proj.summary.split(' ');
    let line = '';
    let y = 145;
    for (let i = 0; i < words.length && y < 270; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > 460) {
        ctx.fillText(line, 24, y);
        line = words[i] + ' ';
        y += 20;
      } else {
        line = test;
      }
    }
    if (line && y < 270) ctx.fillText(line, 24, y);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('[CLICK TO OPEN CASE FILE ↗]', 24, 320);

    const tex = new THREE.CanvasTexture(cardCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((idx - totalCount / 2) * (cardWidth + spacing), 0, 0);

    mesh.userData.isCarouselCard = true;
    mesh.userData.projectId = proj.id;
    mesh.userData.actionPrompt = `VIEW ${proj.title.toUpperCase()} CASE FILE`;

    carouselGroup.add(mesh);
    world.carouselPanels.push(mesh);
    world.interactables.push(mesh);
    world.clickable.push(mesh);
  });

  stage.add(carouselGroup);
  world.carouselGroup = carouselGroup;
}

// =============================================================================
// HP OMEN LAPTOP STAGING & DESK SCREEN PORTAL
// =============================================================================
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

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(w / 2 - 160, h / 2 - 50, 320, 100);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('JAIJITESH.OS // STANDBY', w / 2, h / 2 - 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('PRESS [E] OR CLICK TO BOOT', w / 2, h / 2 + 24);
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
          child.material.roughness = 0.35;
          child.material.metalness = 0.85;
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
    
    // Rotate slightly towards the office chair
    laptopRoot.rotation.set(0, 0.18, 0);
    laptopRoot.updateMatrixWorld(true);

    const boxScaled = new THREE.Box3().setFromObject(laptopRoot);
    const yOffset = -boxScaled.min.y;

    // Positioned directly at center desk monitor slot
    laptopRoot.position.set(0.095, 0.850 + yOffset + 0.001, -0.28);

    laptopRoot.userData.isLaptop = true;
    laptopRoot.userData.actionPrompt = 'BOOT JAIJITESH.OS WORKSTATION';

    stage.add(laptopRoot);
    world.laptop = laptopRoot;
    world.interactables.push(laptopRoot);
    world.clickable.push(laptopRoot);
  } catch (err) {
    console.error('Failed to load HP Omen laptop GLB:', err);
  }
}

// =============================================================================
// BUILD WORLD & ASSET LOADING SEQUENCE
// =============================================================================
async function buildWorld() {
  if (!isWebGLAvailable) return;
  setLoading(10, 'CALIBRATING PBR ATMOSPHERE & LIGHTING');
  createStudioLighting();

  setLoading(25, 'LOADING FUTURISTIC ROOM ENVIRONMENT');
  await loadFuturisticRoom();

  setLoading(50, 'INITIALIZING OMEN WORKSTATION PORTAL');
  await loadLaptopModel();

  setLoading(70, 'MOUNTING WALL SWITCHBOARD & CAROUSEL');
  createInteractiveSwitchboard();
  createPanoramicMediaWall();

  setLoading(85, 'STAGING PHYSICAL HARDWARE TELEMETRY NODES');
  const clickables = await modelManager.loadAllHardware(stage, 0.850, (p, txt) => {
    setLoading(85 + Math.round((p / 100) * 12), txt);
  });
  world.clickable.push(...clickables);
  world.interactables.push(...clickables);

  camera.position.copy(world.overview.position);
  controls.target.copy(world.overview.target);
  controls.update();

  setLoading(100, 'ROOM CALIBRATED');
  setTimeout(() => {
    state.ready = true;
    sound.powerOn();
  }, 400);
}

// =============================================================================
// FIRST-PERSON POV GAME CONTROLLER & POINTER LOCK
// =============================================================================
function enterLab() {
  if (state.entered) return;
  state.entered = true;
  sound.click(520, 0.03);

  // Smoothly hide intro 3D tubes cursor
  if (window.tubesCursorInstance) {
    window.tubesCursorInstance.hide();
  }

  // Display full-screen minimalist loading overlay
  if (loading) {
    loading.classList.remove('is-vaporizing');
    loading.classList.add('is-visible');
  }

  // Wait until room rendering and all assets are 100% complete
  const checkReadyInterval = setInterval(() => {
    if (state.ready) {
      clearInterval(checkReadyInterval);
      setLoading(100, 'ROOM CALIBRATED // REVEALING FPOV');

      setTimeout(() => {
        // Vaporize loading overlay and intro
        if (loading) loading.classList.add('is-vaporizing');

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

        // Camera smoothly positions at room entrance looking inside
        camera.position.set(-1.80, 1.45, 1.80);
        activateFPOV();
        showToast('FPOV ACTIVE • [WASD] MOVE • [MOUSE] LOOK • [E] INTERACT');

        setTimeout(() => {
          if (loading) loading.style.display = 'none';
        }, 750);
      }, 500);
    }
  }, 80);
}
window.enterLab = enterLab;

function activateFPOV() {
  state.fpovMode = true;
  if (controls) controls.enabled = false;
  if (fpovHud) fpovHud.hidden = false;

  // Initialize orientation from current camera position
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  fpov.yaw = Math.atan2(-dir.x, -dir.z);
  fpov.pitch = Math.asin(dir.y);

  // Request pointer lock
  requestPointerLock();
}

function deactivateFPOV() {
  state.fpovMode = false;
  if (fpovHud) fpovHud.hidden = true;
  if (controls) controls.enabled = true;
  exitPointerLock();
}

function requestPointerLock() {
  if (document.pointerLockElement !== canvas && !state.focused && !state.inspecting) {
    canvas.requestPointerLock?.();
  }
}

function exitPointerLock() {
  if (document.pointerLockElement) {
    document.exitPointerLock?.();
  }
}

document.addEventListener('pointerlockchange', () => {
  state.pointerLocked = (document.pointerLockElement === canvas);
});

// Mouse Look Handling
window.addEventListener('mousemove', (e) => {
  if (!state.fpovMode || !state.pointerLocked || state.focused || state.inspecting) return;

  const dx = e.movementX || 0;
  const dy = e.movementY || 0;

  fpov.yaw -= dx * fpov.lookSensitivity;
  fpov.pitch -= dy * fpov.lookSensitivity;

  // Clamp vertical look to -85° and +85°
  fpov.pitch = THREE.MathUtils.clamp(fpov.pitch, -1.48, 1.48);
});

// Keyboard Movement Handling (WASD + Space + Shift)
window.addEventListener('keydown', (e) => {
  if (!state.fpovMode || state.focused || state.inspecting) return;

  if (e.code === 'KeyW') fpov.moveForward = true;
  if (e.code === 'KeyS') fpov.moveBackward = true;
  if (e.code === 'KeyA') fpov.moveLeft = true;
  if (e.code === 'KeyD') fpov.moveRight = true;
  if (e.code === 'Space') fpov.moveUp = true;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') fpov.moveDown = true;

  // Interaction Key (E or F)
  if (e.code === 'KeyE' || e.code === 'KeyF') {
    e.preventDefault();
    handleFPOVInteract();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') fpov.moveForward = false;
  if (e.code === 'KeyS') fpov.moveBackward = false;
  if (e.code === 'KeyA') fpov.moveLeft = false;
  if (e.code === 'KeyD') fpov.moveRight = false;
  if (e.code === 'Space') fpov.moveUp = false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') fpov.moveDown = false;
});

// =============================================================================
// FPOV RAYCASTING, MAGNETIC SNAPPING, & CONTEXTUAL INTERACTION
// =============================================================================
function updateFPOVMovement(delta) {
  if (!state.fpovMode || state.focused || state.inspecting) return;

  // 1. Calculate camera rotation from yaw & pitch
  const euler = new THREE.Euler(fpov.pitch, fpov.yaw, 0, 'YXZ');
  camera.quaternion.setFromEuler(euler);

  // 2. Calculate movement direction relative to camera yaw
  const forward = new THREE.Vector3(-Math.sin(fpov.yaw), 0, -Math.cos(fpov.yaw)).normalize();
  const right = new THREE.Vector3(Math.cos(fpov.yaw), 0, -Math.sin(fpov.yaw)).normalize();

  const moveDir = new THREE.Vector3();
  if (fpov.moveForward) moveDir.add(forward);
  if (fpov.moveBackward) moveDir.sub(forward);
  if (fpov.moveRight) moveDir.add(right);
  if (fpov.moveLeft) moveDir.sub(right);

  if (moveDir.lengthSq() > 0) {
    moveDir.normalize();
    camera.position.addScaledVector(moveDir, fpov.speed * delta);
  }

  // Vertical movement (Space = Fly Up, Shift = Crouch)
  if (fpov.moveUp) camera.position.y += fpov.verticalSpeed * delta;
  if (fpov.moveDown) camera.position.y -= fpov.verticalSpeed * delta;

  // 3. Strict Room Boundary Collision Box (Zero escaping room)
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, fpov.bounds.minX, fpov.bounds.maxX);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, fpov.bounds.minY, fpov.bounds.maxY);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, fpov.bounds.minZ, fpov.bounds.maxZ);

  // 4. Raycast from center crosshair
  raycastCrosshair();
}

function raycastCrosshair() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(world.clickable, true);

  if (!hits.length || hits[0].distance > 3.8) {
    fpov.activeInteractable = null;
    if (crosshair) crosshair.classList.remove('is-hovering');
    if (fpovPrompt) fpovPrompt.hidden = true;
    return;
  }

  let obj = hits[0].object;
  while (obj && !obj.userData?.isHardwareNode && !obj.userData?.isLaptop && !obj.userData?.isSwitch && !obj.userData?.isYellowDoor && !obj.userData?.isCarouselCard && obj !== world.laptop) {
    obj = obj.parent;
  }

  if (obj) {
    fpov.activeInteractable = obj;
    if (crosshair) crosshair.classList.add('is-hovering');
    if (fpovPrompt && fpovPromptText) {
      fpovPrompt.hidden = false;
      const label = obj.userData?.actionPrompt 
        || (obj.userData?.hardwareKey ? `INSPECT ${HARDWARE_DEFINITIONS[obj.userData.hardwareKey]?.title || 'HARDWARE'}` : 'INTERACT');
      fpovPromptText.textContent = label;
    }

    // Subtle Magnetic Aim Snapping towards key targets
    applyMagneticSnapping(obj);
  } else {
    fpov.activeInteractable = null;
    if (crosshair) crosshair.classList.remove('is-hovering');
    if (fpovPrompt) fpovPrompt.hidden = true;
  }
}

function applyMagneticSnapping(obj) {
  const targetPos = new THREE.Vector3();
  obj.getWorldPosition(targetPos);

  const camToObj = targetPos.clone().sub(camera.position).normalize();
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);

  const angle = camDir.angleTo(camToObj);
  // Only magnetically snap if within ~12 degrees cone
  if (angle > 0.02 && angle < 0.22) {
    const targetYaw = Math.atan2(-camToObj.x, -camToObj.z);
    const targetPitch = Math.asin(camToObj.y);
    fpov.yaw = THREE.MathUtils.lerp(fpov.yaw, targetYaw, 0.04);
    fpov.pitch = THREE.MathUtils.lerp(fpov.pitch, targetPitch, 0.04);
  }
}

function handleFPOVInteract() {
  if (!fpov.activeInteractable) return;
  const obj = fpov.activeInteractable;

  if (obj.userData?.isSwitch && obj.userData?.toggleFn) {
    obj.userData.toggleFn();
    return;
  }

  if (obj.userData?.isYellowDoor) {
    triggerDoorAccessDenied();
    return;
  }

  if (obj.userData?.isCarouselCard && obj.userData?.projectId) {
    focusLaptop(obj.userData.projectId);
    return;
  }

  if (obj.userData?.isHardwareNode || obj.userData?.hardwareKey) {
    inspectHardware(obj.userData.hardwareKey);
    return;
  }

  if (obj.userData?.isLaptop || obj === world.laptop) {
    focusLaptop();
    return;
  }
}

// =============================================================================
// CYBERPUNK DOOR ACCESS DENIED & PUSHBACK IMPULSE
// =============================================================================
function triggerDoorAccessDenied() {
  sound.click(240, 0.08);
  if (doorAlert) {
    doorAlert.hidden = false;
    clearTimeout(triggerDoorAccessDenied.timer);
    triggerDoorAccessDenied.timer = setTimeout(() => {
      doorAlert.hidden = true;
    }, 3200);
  }

  // Physical pushback impulse away from the vault door
  const pushBack = new THREE.Vector3(0, 0, 0.65);
  motion.to(camera.position, {
    z: camera.position.z + 0.65,
    duration: 0.45,
    ease: 'power2.out'
  });
  showToast('ACCESS DENIED // CLEARANCE INSUFFICIENT');
}

// =============================================================================
// WORKSTATION LAPTOP FOCUS & OS BOOT
// =============================================================================
let pendingAppToOpen = null;

function focusLaptop(targetApp = null) {
  if (!world.laptop) {
    bootSystem();
    return;
  }
  state.busy = true;
  state.focused = true;
  state.inspecting = null;
  deactivateFPOV();

  if (targetApp) pendingAppToOpen = targetApp;
  worldInstruction.classList.add('is-hidden');
  hideInspectorOverlay();

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

  sound.click(320, 0.03);
  easeCamera(world.overview.position, world.overview.target, 0.95, () => {
    state.busy = false;
    activateFPOV();
  });
}

// =============================================================================
// 3D HARDWARE TELEMETRY INSPECTOR
// =============================================================================
function inspectHardware(key) {
  const def = HARDWARE_DEFINITIONS[key];
  if (!def) return;

  state.busy = true;
  state.inspecting = key;
  state.is3DOffloaded = false;
  deactivateFPOV();

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

  const camPos = center.clone().add(new THREE.Vector3(span * 1.3, span * 0.9, span * 1.5));
  sound.sonarPing(880);
  easeCamera(camPos, center, 0.95, () => {
    state.busy = false;
    if (controls) controls.enabled = true;
  });

  showInspectorOverlay(def);
}
window.inspectHardware = inspectHardware;

function showInspectorOverlay(def) {
  $('#inspectTitle').textContent = def.title;
  $('#inspectCopy').textContent = def.summary;
  $('#inspectEyebrow').textContent = def.eyebrow || 'PHYSICAL 3D MODEL';

  const dataList = $('#inspectData');
  dataList.innerHTML = '';
  def.specs?.forEach(([label, val]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = val;
    dataList.appendChild(dt);
    dataList.appendChild(dd);
  });

  const projectBtn = $('#inspectOpenProject');
  if (projectBtn) {
    if (def.projectId) {
      projectBtn.style.display = 'block';
      projectBtn.onclick = () => {
        hideInspectorOverlay();
        focusLaptop(def.projectId);
      };
    } else {
      projectBtn.style.display = 'none';
    }
  }

  inspect.classList.add('is-open');
}

function hideInspectorOverlay() {
  inspect.classList.remove('is-open');
  state.inspecting = null;
}

// Canvas Click handler for FPOV activation and interaction
canvas.addEventListener('click', () => {
  if (state.entered && !state.focused && !state.inspecting && !state.pointerLocked) {
    requestPointerLock();
  }
  if (state.fpovMode && state.pointerLocked) {
    handleFPOVInteract();
  }
});

// Idle animations for ambient alive feel
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

  // Update pulsing guidance chevrons on surrounding monitors
  if (world.chevronDraw && world.chevronTexture) {
    world.chevronDraw(time);
    world.chevronTexture.needsUpdate = true;
  }

  // Animate 3D project carousel cards
  if (world.carouselGroup && !state.is3DOffloaded) {
    world.carouselGroup.children.forEach((panel) => {
      panel.position.x += 0.0012;
      if (panel.position.x > 2.1) panel.position.x -= 3.8;
    });
  }
}

function bindEvents() {
  $('#enter').addEventListener('click', enterLab);
  $('#homeBtn').addEventListener('click', exitLaptop);
  $('#inspectClose').addEventListener('click', () => {
    hideInspectorOverlay();
    exitLaptop();
  });
  $('#inspectBack').addEventListener('click', () => {
    hideInspectorOverlay();
    exitLaptop();
  });

  const benchSound = $('#benchSoundBtn');
  benchSound?.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    benchSound.textContent = isMuted ? '🔇' : '🔊';
    sound.click(600, 0.02);
  });

  const benchTheme = $('#benchThemeBtn');
  benchTheme?.addEventListener('click', () => {
    const nextTheme = state.currentTheme === 'dark' ? 'matrix' : state.currentTheme === 'matrix' ? 'light' : 'dark';
    set3DTheme(nextTheme);
    sound.click(800, 0.02);
  });

  // Camera action shortcuts
  $$('.world-ui__actions button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'focus-laptop') focusLaptop();
      else if (action === 'overview') exitLaptop();
    });
  });

  window.addEventListener('resize', () => {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (state.is3DOffloaded || !renderer || !scene || !camera) return;

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Fan animation update
  if (world.roomMixer) {
    world.roomMixer.update(delta);
  }

  // First Person POV Movement & Collision
  updateFPOVMovement(delta);

  updateIdleAnimations(time);

  if (controls && controls.enabled) {
    controls.update();
  }

  renderer.render(scene, camera);
}

async function start() {
  bindEvents();
  animate();
  try {
    setLoading(5, 'PREPARING WORKBENCH & CYBERPUNK LAB ENVIRONMENT');
    await buildWorld();
  } catch (err) {
    console.error('Initialization error:', err);
    loadingText.textContent = 'INITIALIZATION FAILED';
    loadingDetail.textContent = 'Check console logs.';
    showToast('ASSET LOAD FAILED');
  }
}

start();
