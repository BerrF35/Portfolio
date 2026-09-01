import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sound } from './js/audio.js';
import { modelManager, HARDWARE_DEFINITIONS } from './js/cadLoader.js';
import { DesktopManager } from './js/desktop.js';

// DOM Selectors
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

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
  to(...args) { return (window.gsap || fallbackMotion).to(...args); },
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
const cursor = $('#cursor');
const cursorGlyph = $('#cursorGlyph');

// Application State
const state = {
  entered: false,
  ready: false,
  focused: false,
  inspecting: null,
  screenState: 'sleep', // 'sleep' | 'boot' | 'desktop'
  is3DOffloaded: false,
  busy: false,
};

// Three.js Scene Setup
const renderer = new THREE.WebGLRenderer({
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

const scene = new THREE.Scene();
scene.background = new THREE.Color('#07090b');
scene.fog = new THREE.Fog('#07090b', 8, 22);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.01, 100);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;

// Strict Orbit Constraints to prevent seeing behind the scenes or under floor
controls.minAzimuthAngle = -Math.PI * 0.36; // -65 degrees
controls.maxAzimuthAngle = Math.PI * 0.36;  // +65 degrees
controls.minPolarAngle = Math.PI * 0.22;    // Prevents looking straight from above
controls.maxPolarAngle = Math.PI * 0.46;    // Prevents going below desk/floor level
controls.minDistance = 1.15;
controls.maxDistance = 4.2;                 // Prevents zooming past room perimeter

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const loader = new GLTFLoader();
const stage = new THREE.Group();
scene.add(stage);

const DESK_TOP_HEIGHT = 0.85; // Fixed physical tabletop height in world units

const world = {
  desk: null,
  deskMat: null,
  mouse: null,
  laptop: null,
  screenMesh: null,
  screenCanvas: null,
  screenTexture: null,
  deskTop: DESK_TOP_HEIGHT,
  laptopCenter: new THREE.Vector3(0, DESK_TOP_HEIGHT + 0.25, 0.05),
  screenCenter: new THREE.Vector3(0, DESK_TOP_HEIGHT + 0.42, 0.05),
  clickable: [],
  leds: {
    piGreen: null,
    espBlue: null,
  },
  overview: {
    position: new THREE.Vector3(0.06, DESK_TOP_HEIGHT + 1.25, 2.75),
    target: new THREE.Vector3(-0.15, DESK_TOP_HEIGHT + 0.12, 0.08)
  },
  desktopManager: null,
};

camera.position.copy(world.overview.position);
controls.target.copy(world.overview.target);

function showToast(message, duration = 2600) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), duration);
}

function setLoading(percent, text) {
  loading.classList.add('is-visible');
  loadingText.textContent = text;
  loadingDetail.textContent = `${Math.round(percent)}%`;
  loadingBar.style.width = `${percent}%`;
}

function easeCamera(position, target, duration = 1.2, onComplete) {
  motion.killTweensOf(camera.position);
  motion.killTweensOf(controls.target);
  motion.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration,
    ease: 'power3.inOut'
  });
  motion.to(controls.target, {
    x: target.x,
    y: target.y,
    z: target.z,
    duration,
    ease: 'power3.inOut',
    onComplete
  });
}

// Generate black & white topographic contour elevation desk mat texture
function createTopographicTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Deep matte black surface
  ctx.fillStyle = '#0a0d10';
  ctx.fillRect(0, 0, c.width, c.height);

  // Subtle coordinate grid dots
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let x = 64; x < c.width; x += 64) {
    for (let y = 64; y < c.height; y += 64) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  // Draw smooth topographic elevation contour curves
  const centers = [
    { x: 500, y: 350, rMax: 480 },
    { x: 1450, y: 650, rMax: 540 },
    { x: 1024, y: 480, rMax: 420 },
    { x: 300, y: 750, rMax: 360 }
  ];

  ctx.lineWidth = 1.8;
  centers.forEach((ctr, cIdx) => {
    const steps = 18;
    for (let i = 2; i <= steps; i++) {
      const radius = (i / steps) * ctr.rMax;
      const isIndexLine = i % 5 === 0;

      ctx.strokeStyle = isIndexLine ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = isIndexLine ? 2.2 : 1.4;

      ctx.beginPath();
      const points = 72;
      for (let p = 0; p <= points; p++) {
        const angle = (p / points) * Math.PI * 2;
        const noise = Math.sin(angle * 3 + cIdx) * 22 + Math.cos(angle * 5 + i) * 16 + Math.sin(angle * 7) * 8;
        const r = radius + noise;
        const px = ctr.x + Math.cos(angle) * r * 1.35;
        const py = ctr.y + Math.sin(angle) * r;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Elevation labels along index contours
      if (isIndexLine) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.font = '11px monospace';
        ctx.fillText(`+${i * 40}m`, ctr.x + radius * 1.15, ctr.y - 12);
      }
    }
  });

  // Perimeter Stitched Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, c.width - 36, c.height - 36);

  // Technical crosshairs in corners
  const crosshairs = [[48, 48], [c.width - 48, 48], [48, c.height - 48], [c.width - 48, c.height - 48]];
  crosshairs.forEach(([cx, cy]) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12);
    ctx.stroke();
  });

  // Technical Mat Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '14px "Space Mono", monospace';
  ctx.fillText('TOPOGRAPHIC ELEVATION SPEC // 01-SYS', 54, c.height - 44);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function makeBenchRoom() {
  // Atmospheric Floor
  const floorGeo = new THREE.PlaneGeometry(32, 32);
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#090b0d',
    roughness: 0.85,
    metalness: 0.12
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Continuous Seamless Architectural Slat Walls across Back, Left, and Right
  const wallGroup = new THREE.Group();
  const slatMat = new THREE.MeshStandardMaterial({
    color: '#13171c',
    roughness: 0.75,
    metalness: 0.28
  });
  const wallBackMat = new THREE.MeshStandardMaterial({
    color: '#080a0c',
    roughness: 0.95
  });

  // 1. Back Wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), wallBackMat);
  backWall.position.set(0, 5.0, -4.5);
  backWall.receiveShadow = true;
  wallGroup.add(backWall);

  for (let x = -10.0; x <= 10.0; x += 0.42) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.038, 9.0, 0.07), slatMat);
    slat.position.set(x, 4.5, -4.45);
    slat.castShadow = true;
    slat.receiveShadow = true;
    wallGroup.add(slat);
  }

  // 2. Left Wall
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), wallBackMat);
  leftWall.position.set(-8.5, 5.0, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  wallGroup.add(leftWall);

  for (let z = -6.0; z <= 8.0; z += 0.42) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 9.0, 0.038), slatMat);
    slat.position.set(-8.45, 4.5, z);
    slat.castShadow = true;
    slat.receiveShadow = true;
    wallGroup.add(slat);
  }

  // 3. Right Wall
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), wallBackMat);
  rightWall.position.set(8.5, 5.0, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  wallGroup.add(rightWall);

  for (let z = -6.0; z <= 8.0; z += 0.42) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 9.0, 0.038), slatMat);
    slat.position.set(8.45, 4.5, z);
    slat.castShadow = true;
    slat.receiveShadow = true;
    wallGroup.add(slat);
  }

  scene.add(wallGroup);

  // Crisp Studio Key Directional Light
  const keyDirLight = new THREE.DirectionalLight('#ffffff', 2.8);
  keyDirLight.position.set(2.5, 6.0, 3.5);
  keyDirLight.castShadow = true;
  keyDirLight.shadow.mapSize.set(2048, 2048);
  keyDirLight.shadow.bias = -0.0001;
  keyDirLight.shadow.camera.near = 0.5;
  keyDirLight.shadow.camera.far = 18;
  keyDirLight.shadow.camera.left = -4;
  keyDirLight.shadow.camera.right = 4;
  keyDirLight.shadow.camera.top = 4;
  keyDirLight.shadow.camera.bottom = -4;
  scene.add(keyDirLight);

  // High-Ceiling Studio Point Light
  const keyLight = new THREE.PointLight('#f8fafc', 45, 14, 1.6);
  keyLight.position.set(0, 3.8, 1.2);
  scene.add(keyLight);

  // Subtle Warm Amber Studio Rim Light (Left)
  const rimLightLeft = new THREE.PointLight('#f3ba4b', 14, 10, 1.8);
  rimLightLeft.position.set(-3.8, 2.6, -1.5);
  scene.add(rimLightLeft);

  // Subtle Electric Ice Blue Studio Rim Light (Right)
  const rimLightRight = new THREE.PointLight('#38bdf8', 12, 10, 1.8);
  rimLightRight.position.set(3.8, 2.6, -1.5);
  scene.add(rimLightRight);

  // Soft Front Fill
  const fillLight = new THREE.DirectionalLight('#64748b', 1.2);
  fillLight.position.set(-1.5, 4.0, 4.0);
  scene.add(fillLight);

  // Ambient & Hemisphere Fill
  scene.add(new THREE.HemisphereLight('#f1f5f9', '#0b0e12', 2.4));
  scene.add(new THREE.AmbientLight('#18202a', 1.4));

  // Floor Grid
  const grid = new THREE.GridHelper(16, 32, '#1a2027', '#0e1216');
  grid.position.y = 0.005;
  grid.material.opacity = 0.3;
  grid.material.transparent = true;
  scene.add(grid);
}

function buildLuxuryDesk() {
  const deskGroup = new THREE.Group();

  // Chamfered Tabletop Slab
  const topGeo = new THREE.BoxGeometry(3.6, 0.06, 1.8);
  const topMat = new THREE.MeshStandardMaterial({
    color: '#14171a',
    roughness: 0.7,
    metalness: 0.15
  });
  const tabletop = new THREE.Mesh(topGeo, topMat);
  tabletop.position.y = DESK_TOP_HEIGHT - 0.03;
  tabletop.castShadow = true;
  tabletop.receiveShadow = true;
  deskGroup.add(tabletop);

  // 4 Brushed Titanium Steel Legs
  const legGeo = new THREE.CylinderGeometry(0.042, 0.042, DESK_TOP_HEIGHT - 0.06, 16);
  const legMat = new THREE.MeshStandardMaterial({
    color: '#2a2f35',
    roughness: 0.4,
    metalness: 0.85
  });

  const legPositions = [
    [-1.68, (DESK_TOP_HEIGHT - 0.06) / 2, -0.78],
    [1.68, (DESK_TOP_HEIGHT - 0.06) / 2, -0.78],
    [-1.68, (DESK_TOP_HEIGHT - 0.06) / 2, 0.78],
    [1.68, (DESK_TOP_HEIGHT - 0.06) / 2, 0.78]
  ];

  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    deskGroup.add(leg);
  });

  // Black & White Topographic Contour Line Table Mat (Ultra-Thin 3mm)
  const topoTexture = createTopographicTexture();
  const matGeo = new THREE.BoxGeometry(2.3, 0.003, 0.98);
  const matMaterial = new THREE.MeshStandardMaterial({
    map: topoTexture,
    roughness: 0.88,
    metalness: 0.08
  });
  const deskMat = new THREE.Mesh(matGeo, matMaterial);
  deskMat.position.set(0.06, DESK_TOP_HEIGHT + 0.0015, 0.12);
  deskMat.receiveShadow = true;
  deskMat.castShadow = true;
  deskGroup.add(deskMat);
  world.deskMat = deskMat;

  stage.add(deskGroup);
  world.desk = deskGroup;
}

// Precision Smooth High-Poly Ergonomic Engineering Mouse (Zero light sources)
function buildEngineeringMouse() {
  const mouseGroup = new THREE.Group();

  // Smooth Sculpted Palm Body
  const palmGeo = new THREE.SphereGeometry(0.048, 48, 32);
  palmGeo.scale(0.9, 0.45, 1.45);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#181b1f',
    roughness: 0.52,
    metalness: 0.18
  });
  const palm = new THREE.Mesh(palmGeo, bodyMat);
  palm.position.set(0, 0.018, 0.01);
  palm.castShadow = true;
  palm.receiveShadow = true;
  mouseGroup.add(palm);

  // Left & Right Click Chamfered Buttons
  const clickGeo = new THREE.BoxGeometry(0.034, 0.008, 0.065);
  const clickMat = new THREE.MeshStandardMaterial({
    color: '#131518',
    roughness: 0.38,
    metalness: 0.28
  });
  const leftClick = new THREE.Mesh(clickGeo, clickMat);
  leftClick.position.set(-0.019, 0.031, -0.038);
  leftClick.rotation.x = -0.15;
  mouseGroup.add(leftClick);

  const rightClick = new THREE.Mesh(clickGeo, clickMat);
  rightClick.position.set(0.019, 0.031, -0.038);
  rightClick.rotation.x = -0.15;
  mouseGroup.add(rightClick);

  // Precision Metallic Knurled Scroll Wheel (48 segments)
  const wheelGeo = new THREE.CylinderGeometry(0.0095, 0.0095, 0.007, 48);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: '#8b949e',
    roughness: 0.22,
    metalness: 0.95
  });
  const scrollWheel = new THREE.Mesh(wheelGeo, wheelMat);
  scrollWheel.rotation.z = Math.PI / 2;
  scrollWheel.position.set(0, 0.033, -0.036);
  mouseGroup.add(scrollWheel);

  // Ergonomic Sculpted Thumb Wing Flare on Left
  const thumbGeo = new THREE.CylinderGeometry(0.018, 0.024, 0.075, 32);
  thumbGeo.scale(1.2, 0.4, 1.0);
  const thumbFlare = new THREE.Mesh(thumbGeo, bodyMat);
  thumbFlare.position.set(-0.042, 0.01, 0.01);
  thumbFlare.rotation.y = 0.2;
  mouseGroup.add(thumbFlare);

  // Thumb Scroll Wheel
  const thumbWheel = new THREE.Mesh(wheelGeo, wheelMat);
  thumbWheel.scale.set(0.75, 0.75, 0.75);
  thumbWheel.position.set(-0.044, 0.024, -0.01);
  thumbWheel.rotation.x = Math.PI / 2;
  mouseGroup.add(thumbWheel);

  // Position mouse naturally on the right side of the topographic desk mat (Zero light emitters)
  mouseGroup.position.set(0.68, DESK_TOP_HEIGHT + 0.003, 0.16);
  mouseGroup.rotation.y = -0.12;

  stage.add(mouseGroup);
  return mouseGroup;
}

function loadGlb(path) {
  return new Promise((resolve, reject) => loader.load(path, resolve, undefined, reject));
}

function makeScreenTexture() {
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1280;
  screenCanvas.height = 800;
  const texture = new THREE.CanvasTexture(screenCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  
  world.screenCanvas = screenCanvas;
  world.screenTexture = texture;
  drawLaptopScreen();
}

function drawLaptopScreen() {
  if (!world.screenCanvas) return;
  const c = world.screenCanvas;
  const ctx = c.getContext('2d');
  const w = c.width;
  const h = c.height;

  ctx.clearRect(0, 0, w, h);

  if (state.screenState === 'sleep') {
    ctx.fillStyle = '#0a0d10';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.strokeRect(40, 40, w - 80, h - 80);

    ctx.fillStyle = '#f3f4f6';
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.fillText('JAIJITESH SURYAPRAKASH // WORKSTATION', 70, 110);

    ctx.fillStyle = '#8b949e';
    ctx.font = '20px "Space Mono", monospace';
    ctx.fillText('B.TECH INFORMATION TECHNOLOGY • VIT VELLORE (2025-2029)', 70, 160);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '24px "Space Mono", monospace';
    ctx.fillText('CLICK WORKSTATION TO POWER ON', 70, h - 90);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, h - 65);
    ctx.lineTo(440, h - 65);
    ctx.stroke();

  } else if (state.screenState === 'boot') {
    ctx.fillStyle = '#080a0c';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '26px "Space Mono", monospace';
    ctx.fillText('STARTING JAIJITESH.OS // KERNEL v2.6.4', 70, 110);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px "Space Mono", monospace';
    const lines = [
      'SYSTEM MEMORY .................... 32768 MB DDR5 OK',
      'GRAPHICS PIPELINE ................ VULKAN / WEBGL2 OK',
      'HARDWARE TELEMETRY BUS ........... CONNECTED',
      'WINDSIM LBM ENGINE ............... READY',
      'BERRY LOCAL AGENT CORE ........... LOADED',
      'BERRYBOT TELEMETRY LOOP .......... SYNCHRONIZED',
      'INITIALIZING WORKSTATION DESKTOP .'
    ];
    lines.forEach((line, idx) => {
      ctx.fillText(line, 70, 185 + idx * 42);
    });

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(70, h - 110, w - 140, 14);

  } else {
    ctx.fillStyle = '#0e1115';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 38px "Space Grotesk", sans-serif';
    ctx.fillText('JAIJITESH.OS', 60, 100);

    ctx.fillStyle = '#8b949e';
    ctx.font = '18px "Space Mono", monospace';
    ctx.fillText('PERSONAL OPERATING ENVIRONMENT // ACTIVE SESSION', 60, 140);
  }

  world.screenTexture.needsUpdate = true;
}

function applyScreenTexture(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    if (child.material?.name === 'screen') {
      world.screenMesh = child;
      const mat = child.material.clone();
      mat.map = world.screenTexture;
      mat.emissive = new THREE.Color('#94a3b8');
      mat.emissiveMap = world.screenTexture;
      mat.emissiveIntensity = 0.9;
      mat.roughness = 0.3;
      mat.metalness = 0.04;
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
      child.material = mat;
    }
  });
}

async function buildWorld() {
  makeBenchRoom();
  buildLuxuryDesk();
  buildEngineeringMouse();
  makeScreenTexture();
  setLoading(12, 'LOADING WORKSTATION');

  const laptopRes = await loadGlb('assets/hp_omen_laptop.glb');

  setLoading(40, 'PLACING WORKSTATION ON TOPOGRAPHIC MAT');
  world.laptop = laptopRes.scene;
  world.laptop.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      if (c.material) {
        c.material = c.material.clone();
        c.material.envMapIntensity = 0.85;
      }
    }
  });
  stage.add(world.laptop);

  // Normalize laptop scale (width ~1.05m)
  world.laptop.updateMatrixWorld(true);
  const lapBoxRaw = new THREE.Box3().setFromObject(world.laptop);
  const lapSizeRaw = lapBoxRaw.getSize(new THREE.Vector3());
  const lapScale = 1.05 / Math.max(lapSizeRaw.x, lapSizeRaw.z);
  world.laptop.scale.set(lapScale, lapScale, lapScale);
  
  // Rotate laptop to face front towards camera
  world.laptop.rotation.y = 0;
  world.laptop.updateMatrixWorld(true);

  // Place laptop centered on the topographic desk mat (3mm above tabletop)
  const lapBoxScaled = new THREE.Box3().setFromObject(world.laptop);
  world.laptop.position.set(0, DESK_TOP_HEIGHT - lapBoxScaled.min.y + 0.003, 0.05);
  world.laptop.updateMatrixWorld(true);

  applyScreenTexture(world.laptop);

  const finalLapBox = new THREE.Box3().setFromObject(world.laptop);
  finalLapBox.getCenter(world.laptopCenter);
  world.screenCenter.set(world.laptopCenter.x, DESK_TOP_HEIGHT + 0.38, world.laptopCenter.z);

  world.clickable.push(world.laptop);

  setLoading(60, 'LOADING 3D HARDWARE, COMPANIONS & OPTICS');
  // Load real GLB models (Pi, ESP32, BerryBot, Berry Dog, Crispy Cat, Camera, Telescope, Books, Studio)
  const hardwareClickables = await modelManager.loadAllHardware(stage, DESK_TOP_HEIGHT, (p, msg) => {
    setLoading(p, msg);
  });
  world.clickable.push(...hardwareClickables);

  // Blinking LEDs on Pi and ESP32
  const ledGeo = new THREE.SphereGeometry(0.008, 8, 8);
  const piLedMat = new THREE.MeshBasicMaterial({ color: '#38ef7d' });
  const espLedMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });

  const piLed = new THREE.Mesh(ledGeo, piLedMat);
  piLed.position.set(0.92, DESK_TOP_HEIGHT + 0.035, 0.22);
  stage.add(piLed);
  world.leds.piGreen = piLed;

  const espLed = new THREE.Mesh(ledGeo, espLedMat);
  espLed.position.set(1.22, DESK_TOP_HEIGHT + 0.025, 0.22);
  stage.add(espLed);
  world.leds.espBlue = espLed;

  setLoading(92, 'INITIALIZING JAIJITESH.OS');
  world.desktopManager = new DesktopManager(
    screenBody,
    (hwKey) => inspectHardware(hwKey),
    () => exitLaptop()
  );

  state.ready = true;
  setLoading(100, 'ENGINEERING WORKBENCH READY');
  setTimeout(() => loading.classList.add('is-done'), 450);
}

function enterLab() {
  if (state.entered) return;
  state.entered = true;
  sound.powerOn();

  const introEl = document.getElementById('intro');
  const worldUiEl = document.getElementById('worldUi');

  if (introEl) {
    introEl.classList.add('is-exiting');
    introEl.style.transform = 'translateY(-100%)';
    introEl.style.opacity = '0';
    introEl.style.pointerEvents = 'none';
    setTimeout(() => {
      introEl.hidden = true;
      introEl.style.display = 'none';
    }, 850);
  }

  if (worldUiEl) {
    worldUiEl.classList.add('is-visible');
    worldUiEl.style.opacity = '1';
    worldUiEl.style.pointerEvents = 'none';
  }
}

window.enterLab = enterLab;

function focusLaptop() {
  if (!world.laptop || state.busy) return;
  state.focused = true;
  state.busy = true;
  worldInstruction.classList.add('is-hidden');
  inspect.classList.remove('is-open');
  controls.enabled = false;

  sound.click(450, 0.04);

  // Stage 1: Laptop lid hinges upright while camera approaches
  motion.to(world.laptop.rotation, {
    x: 0.34, // Sits upright perpendicular to ground
    duration: 1.0,
    ease: 'power2.inOut'
  });

  const screenTarget = new THREE.Vector3(0, DESK_TOP_HEIGHT + 0.38, 0.05);
  const approachPos = new THREE.Vector3(0, DESK_TOP_HEIGHT + 0.38, 0.95);
  const deepFillPos = new THREE.Vector3(0, DESK_TOP_HEIGHT + 0.38, 0.36); // Deep zoom where screen fills viewport

  easeCamera(approachPos, screenTarget, 0.95, () => {
    // Stage 2: After upright, zoom in deep until the screen fills the user's screen
    easeCamera(deepFillPos, screenTarget, 0.85, () => {
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
  showToast('INITIALIZING JAIJITESH.OS v2.6');

  setTimeout(() => {
    state.screenState = 'desktop';
    drawLaptopScreen();
    openScreen();
    sound.click(850, 0.03);
  }, 1100);
}

function openScreen() {
  if (state.screenState !== 'sleep') {
    screenUi.classList.add('is-open');
    // GPU Offloading: Pause heavy 3D rendering loop once full-screen OS is active
    setTimeout(() => {
      if (screenUi.classList.contains('is-open')) {
        state.is3DOffloaded = true;
      }
    }, 500);
  }
}

function exitLaptop() {
  if (state.busy) return;
  state.busy = true;
  state.is3DOffloaded = false; // Re-enable 3D rendering loop
  screenUi.classList.remove('is-open');
  inspect.classList.remove('is-open');
  state.focused = false;
  state.inspecting = null;
  controls.enabled = true;

  // Restore laptop tilt to resting angle
  motion.to(world.laptop.rotation, {
    x: 0,
    duration: 1.2,
    ease: 'power3.inOut'
  });

  sound.click(320, 0.03);
  easeCamera(world.overview.position, world.overview.target, 1.2, () => {
    state.busy = false;
  });
}

function inspectHardware(key) {
  const def = HARDWARE_DEFINITIONS[key];
  if (!def || state.busy) return;

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

  controls.enabled = true;
  state.focused = false;

  const camPos = center.clone().add(new THREE.Vector3(span * 1.3, span * 0.9, span * 1.5));
  sound.sonarPing(880);
  easeCamera(camPos, center, 1.15, () => {
    state.busy = false;
  });

  showInspectorOverlay(def);
}

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
  inspect.classList.add('is-open');
}

function hideInspectorOverlay() {
  inspect.classList.remove('is-open');
  state.inspecting = null;
}

function pick3DObject(e) {
  if (!state.ready || state.busy || screenUi.classList.contains('is-open')) return;

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(world.clickable, true);
  if (!hits.length) return;

  let obj = hits[0].object;
  while (obj && !obj.userData.hardwareKey && obj !== world.laptop) {
    obj = obj.parent;
  }

  if (obj?.userData?.hardwareKey) {
    inspectHardware(obj.userData.hardwareKey);
  } else {
    focusLaptop();
  }
}

function updateCursor(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (hudCursor) {
    hudCursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  }

  // Check interactive elements under cursor
  const target = e.target;
  const isButton = target && target.closest && target.closest('button, a, [role="button"], input, select, .win-btn, .dock__item, .proj-card, .hw-card, .lab-card, .enter, .top-dock__item');
  const isInput = target && target.closest && target.closest('input, textarea, .cli-input');

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

  // If in 3D workbench view and not inside full-screen OS
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

  // Default state
  if (hudCursor) {
    hudCursor.className = isMouseDown ? 'hud-cursor is-active' : 'hud-cursor';
  }
}

function updateIdleAnimations(time) {
  // Idle micro-movement on Raspberry Pi
  const rpi = modelManager.benchMeshes.get('raspberry');
  if (rpi && rpi.userData.baseY) {
    rpi.position.y = rpi.userData.baseY + Math.sin(time * 2.2) * 0.0016;
  }

  // Idle micro-movement on ESP32
  const esp = modelManager.benchMeshes.get('esp32');
  if (esp && esp.userData.baseY) {
    esp.position.y = esp.userData.baseY + Math.sin(time * 2.6 + 1.2) * 0.0016;
  }

  // Idle micro-movement on BerryBot Tracked Chassis
  const bot = modelManager.benchMeshes.get('robot');
  if (bot && bot.userData.baseY) {
    bot.position.y = bot.userData.baseY + Math.sin(time * 1.5) * 0.0012;
  }

  // Idle breathing on Berry Dog (Belgian Malinois)
  const dog = modelManager.benchMeshes.get('dog');
  if (dog && dog.userData.baseY) {
    dog.position.y = dog.userData.baseY + Math.sin(time * 1.8) * 0.002;
  }

  // Idle breathing on Crispy Cat
  const cat = modelManager.benchMeshes.get('cat');
  if (cat && cat.userData.baseY) {
    cat.position.y = cat.userData.baseY + Math.sin(time * 2.0 + 0.8) * 0.0015;
  }

  // Blinking hardware status LEDs
  if (world.leds.piGreen) {
    world.leds.piGreen.visible = Math.sin(time * 8.0) > -0.2;
  }
  if (world.leds.espBlue) {
    world.leds.espBlue.visible = Math.sin(time * 5.5 + 2.0) > 0.0;
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

  $$('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'focus-laptop') focusLaptop();
      if (btn.dataset.action === 'overview') exitLaptop();
    });
  });

  canvas.addEventListener('click', pick3DObject);
  window.addEventListener('pointermove', updateCursor);

  document.addEventListener('mouseleave', () => {
    if (hudCursor) hudCursor.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    if (hudCursor) hudCursor.style.opacity = '1';
  });

  window.addEventListener('mousedown', () => {
    isMouseDown = true;
    hudCursor?.classList.add('is-active');
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
    hudCursor?.classList.remove('is-active');
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (inspect.classList.contains('is-open')) {
        hideInspectorOverlay();
      } else if (screenUi.classList.contains('is-open')) {
        exitLaptop();
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
  if (state.is3DOffloaded) return;

  const time = clock.getElapsedTime();
  updateIdleAnimations(time);
  controls.update();
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
    loadingDetail.textContent = 'Check console logs and model files.';
    showToast('ASSET LOAD FAILED');
  }
}

start();
