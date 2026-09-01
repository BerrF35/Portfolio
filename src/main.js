import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sound } from './core/audio.js';
import { state, DESK_TOP_HEIGHT } from './core/state.js';
import { setupScene, buildBenchRoom, easeCamera, motion } from './core/scene.js';
import { buildLuxuryDesk, buildEngineeringMouse } from './core/desk.js';
import { modelManager, HARDWARE_DEFINITIONS } from './hardware/cadLoader.js';
import { DesktopManager } from './os/desktop.js';

// DOM Selectors
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

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

// Initialize 3D Scene
const { renderer, scene, camera, controls, stage } = setupScene(canvas);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const loader = new GLTFLoader();

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
  buildBenchRoom(scene);
  const { deskGroup, deskMat } = buildLuxuryDesk(stage, renderer);
  world.desk = deskGroup;
  world.deskMat = deskMat;

  world.mouse = buildEngineeringMouse(stage);
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
  if (!world.laptop) return;
  state.busy = true;
  state.focused = true;
  state.inspecting = null;
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

  easeCamera(camera, controls, approachPos, screenTarget, 0.75, () => {
    easeCamera(camera, controls, deepFillPos, screenTarget, 0.65, () => {
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
  }, 900);
}

function openScreen() {
  if (state.screenState !== 'sleep') {
    screenUi.classList.add('is-open');
    setTimeout(() => {
      if (screenUi.classList.contains('is-open')) {
        state.is3DOffloaded = true;
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
  controls.enabled = true;

  motion.to(world.laptop.rotation, {
    x: 0,
    duration: 0.9,
    ease: 'power3.inOut'
  });

  sound.click(320, 0.03);
  easeCamera(camera, controls, world.overview.position, world.overview.target, 0.95, () => {
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

  controls.enabled = true;
  state.focused = false;

  const camPos = center.clone().add(new THREE.Vector3(span * 1.3, span * 0.9, span * 1.5));
  sound.sonarPing(880);
  easeCamera(camera, controls, camPos, center, 0.95, () => {
    state.busy = false;
  });

  showInspectorOverlay(def);
}

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
    cat.position.y = cat.userData.baseY + Math.sin(time * 1.9 + 0.8) * 0.0018;
  }

  // Blinking hardware status LEDs
  if (world.leds.piGreen) {
    const pulse = Math.sin(time * 8.5) > 0.15;
    world.leds.piGreen.visible = pulse;
  }
  if (world.leds.espBlue) {
    const pulse = Math.sin(time * 11.2 + 2.0) > 0.05;
    world.leds.espBlue.visible = pulse;
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
