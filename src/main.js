import * as THREE from 'three';
window.THREE = THREE;
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { sound } from './js/audio.js';
import { HARDWARE_DEFINITIONS } from './js/portfolioData.js?v=3';
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

// Phone / Mobile Touch Controls DOM
const mobileControls = $('#mobileControls');
const touchJoystick = $('#touchJoystick');
const touchKnob = $('#touchKnob');
const touchInteractBtn = $('#touchInteractBtn');
const touchInteractLabel = $('#touchInteractLabel');
const touchUpBtn = $('#touchUpBtn');
const touchDownBtn = $('#touchDownBtn');

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

// First Person POV Controller State - 100% PURE USER INPUT, NO SNAPPING
const fpov = {
  yaw: -0.35,
  pitch: 0.0,
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  moveUp: false,
  moveDown: false,
  touchMoveX: 0,
  touchMoveZ: 0,
  speed: 2.8,
  verticalSpeed: 2.2,
  lookSensitivity: 0.0022,
  activeInteractable: null
};

// Three.js Scene Setup with WebGL Safety Check
let renderer, scene, camera, controls;
let isWebGLAvailable = true;

try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    precision: 'mediump',
    stencil: false,
    depth: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Realistic Image-Based Lighting (IBL) via RoomEnvironment (eliminates plastic look)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#04070a');
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

  // Camera far plane set to 3000m so the entire Cyberpunk City outside the circular window is rendered
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 3000);
  camera.rotation.order = 'YXZ';

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.enabled = false; // FPOV mode active by default
} catch (e) {
  console.warn('WebGL Initialization failed. Activating graceful 2D fallback.', e);
  isWebGLAvailable = false;
  if (webglFallback) webglFallback.hidden = false;
}

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0); // Screen center crosshair raycast
const stage = new THREE.Group();
if (scene) scene.add(stage);

const world = {
  room: null,
  roomMixer: null,
  fanAction: null,
  screenMesh: null,
  screenCanvas: null,
  screenCtx: null,
  screenTexture: null,
  desktopManager: null,
  clickable: [],
  interactables: [],
  hardwareObjects: new Map(),
  switchboard: null,
  doorNode: null,
  lights: {
    ambient: null,
    hemi: null,
    ceiling: null,
    upperCeiling: null,
    desk: null,
    bed: null,
    window: null,
    door: null,
    backWall: null
  },
  switchStates: {
    ceiling: true,
    fan: true,
    ambient: true
  }
};

window.camera = camera;
window.scene = scene;
window.world = world;
window.fpov = fpov;
window.state = state;

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
    scene.background.set('#04070a');
    if (renderer) renderer.toneMappingExposure = 0.92;
  }
}
window.set3DTheme = set3DTheme;

function setLoading(percent) {
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  if (loadingBar) loadingBar.style.width = `${p}%`;
  if (loadingDetail) loadingDetail.textContent = `${p}%`;
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
// SUBTLE REALISTIC LIGHTING SYSTEM (ALL WALLS, CORNERS & FIXTURES VISIBLE)
// =============================================================================
function createStudioLighting() {
  // Clear any existing lights in world.lights
  Object.keys(world.lights).forEach((k) => {
    if (world.lights[k] && world.lights[k].isObject3D) scene.remove(world.lights[k]);
  });

  // 1. Broad ambient fill for base visibility
  world.lights.ambient = new THREE.AmbientLight(0x5a6d80, 0.45);
  scene.add(world.lights.ambient);

  // 2. Dual-tone Hemisphere light for realistic ground/ceiling bounce
  world.lights.hemi = new THREE.HemisphereLight(0x607890, 0x1e2733, 0.35);
  world.lights.hemi.position.set(0, 3.2, 0);
  scene.add(world.lights.hemi);

  // 3. Central Ceiling Light: soft warm-white room fill
  world.lights.ceiling = new THREE.PointLight(0xe2e8f0, 1.2, 8.0, 1.4);
  world.lights.ceiling.position.set(-1.6, 2.4, -0.8);
  scene.add(world.lights.ceiling);

  // 4. Circular Window City Inflow: subtle atmospheric neon glow
  world.lights.window = new THREE.PointLight(0x818cf8, 1.2, 5.5, 1.4);
  world.lights.window.position.set(-3.5, 1.5, 0.4);
  scene.add(world.lights.window);
}

// =============================================================================
// LOAD AUTHORITATIVE SINGLE 3D SCENE: /assets/jaijitesh_room.glb
// =============================================================================
async function loadAuthoritativeScene() {
  if (!stage) return;
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      'assets/jaijitesh_room.glb',
      (gltf) => {
        const root = gltf.scene;

        // Fan animation: Fan|FanAction
        if (gltf.animations && gltf.animations.length > 0) {
          world.roomMixer = new THREE.AnimationMixer(root);
          gltf.animations.forEach((clip) => {
            const action = world.roomMixer.clipAction(clip);
            action.play();
            if (/fan/i.test(clip.name)) {
              world.fanAction = action;
            }
          });
          if (!world.fanAction && gltf.animations.length > 0) {
            world.fanAction = world.roomMixer.clipAction(gltf.animations[0]);
            world.fanAction.play();
          }
        }

        // Traverse hierarchy: preserve all transforms, materials, and hook up interactables
        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;

            // Static mesh transform optimization (saves CPU/GPU recalculations)
            if (!/fan/i.test(child.name) && !/fan/i.test(child.parent?.name || '')) {
              child.matrixAutoUpdate = false;
              child.updateMatrix();
            }

            // Material quality & realism tuning
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((mat) => {
                if (!mat) return;

                // Ensure fan housing, airlock, vents and structural boxes are 100% solid
                if (/airlock|vent|ammo|wall|floor|ceiling/i.test(mat.name) || /airlock|vent/i.test(child.name)) {
                  mat.transparent = false;
                  mat.depthWrite = true;
                  mat.depthTest = true;
                  mat.opacity = 1.0;
                }

                if (mat.emissiveMap) {
                  mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                }

                // If a material has a texture map but its color tint was exported as black [0,0,0],
                // restore its color multiplier to pure white so the underlying texture is visible
                if (mat.map && mat.color && mat.color.r < 0.1 && mat.color.g < 0.1 && mat.color.b < 0.1) {
                  mat.color.setHex(0xffffff);
                  mat.needsUpdate = true;
                }
                if (/walls/i.test(mat.name) || /walls/i.test(child.name)) {
                  mat.color.setHex(0xffffff);
                  mat.roughness = 0.85;
                  mat.metalness = 0.0;
                  mat.needsUpdate = true;
                }

                // PBR Realism: eliminate cheap plastic look via proper roughness & IBL response
                if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                  mat.envMapIntensity = 0.8;
                  if (/wall|floor|ceiling|bed|pillow|sheet|sofa|chair|cloth|fabric|paper|notes|wood/i.test(mat.name)) {
                    mat.roughness = Math.max(mat.roughness, 0.75);
                    mat.metalness = 0.0;
                  } else if (/metal|pipe|duct|roller|track|chassis|iron|steel/i.test(mat.name)) {
                    mat.metalness = Math.max(mat.metalness, 0.75);
                    mat.roughness = Math.min(mat.roughness, 0.35);
                  } else if (mat.metalness === 0 && mat.roughness < 0.45) {
                    mat.roughness = 0.65; // eliminate unnatural plastic sheen
                  }
                  mat.needsUpdate = true;
                }
              });
            }
          }

          const name = child.name || '';

          // Laptop screen node
          if (child.isMesh && child.material && child.material.name === 'screen') {
            world.screenMesh = child;
            child.material.map = world.screenTexture;
            child.material.emissiveMap = world.screenTexture;
            child.material.emissive = new THREE.Color(0xffffff);
            child.material.emissiveIntensity = 0.95;
            child.material.roughness = 1.0;
            child.material.metalness = 0.0;
            child.material.needsUpdate = true;
            child.userData.isLaptop = true;
            child.userData.actionPrompt = 'BOOT JAIJITESH.OS';
            world.interactables.push(child);
            world.clickable.push(child);
          }

          // Laptop PC body
          if (/pc_0|omen|laptop/i.test(name)) {
            child.userData.isLaptop = true;
            child.userData.actionPrompt = 'OPEN JAIJITESH.OS WORKSTATION';
            world.interactables.push(child);
            world.clickable.push(child);
          }

          // Three-button switchboard on wall near bed ladder
          if (/Sketchfab_model\.005|propmaker/i.test(name) || (child.isMesh && /material_0\.001/i.test(child.material?.name) && child.position.z < -2.0)) {
            child.userData.isSwitchboard = true;
            child.userData.actionPrompt = 'TOGGLE ROOM SYSTEMS';
            world.switchboard = child;
            world.interactables.push(child);
            world.clickable.push(child);
          }

          // Yellow Vault Door
          if (/door_low|door/i.test(name)) {
            child.userData.isYellowDoor = true;
            child.userData.actionPrompt = 'OPEN VAULT AIRLOCK';
            world.interactables.push(child);
            world.clickable.push(child);
          }

          // Canon AT-1 Camera on sofa
          if (/cam0001|canon/i.test(name)) {
            child.userData.isHardware = 'camera';
            child.userData.actionPrompt = 'INSPECT CANON AT-1 RETRO CAMERA';
            world.hardwareObjects.set('camera', child);
            world.interactables.push(child);
            world.clickable.push(child);
          }

          // Raspberry Pi on table
          if (/rpi_L/i.test(name)) {
            child.userData.isHardware = 'rpi';
            child.userData.actionPrompt = 'INSPECT RASPBERRY PI 4 EDGE COMPUTE';
            world.hardwareObjects.set('rpi', child);
            world.interactables.push(child);
            world.clickable.push(child);
          }

          // BerryBot Tracked Chassis
          if (/d1_454_block|sm_track_placeholder/i.test(name)) {
            child.userData.isHardware = 'robot';
            child.userData.actionPrompt = 'INSPECT BERRYBOT CHASSIS';
            world.hardwareObjects.set('robot', child);
            world.interactables.push(child);
            world.clickable.push(child);
          }

          // Canine unit next to table
          if (/shepherd_dog/i.test(name)) {
            child.userData.actionPrompt = 'PATROL CANINE UNIT';
            world.interactables.push(child);
            world.clickable.push(child);
          }

          // Cat on the bed
          if (name === 'world' || /object_7\.001|shd_frip/i.test(name)) {
            child.userData.actionPrompt = 'PET QUANTUM COMPANION';
            world.interactables.push(child);
            world.clickable.push(child);
          }
        });

        // Add authoritatively finalized scene directly to stage
        stage.add(root);
        world.room = root;

        resolve();
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          setLoading(Math.min(99, Math.max(10, pct)));
        } else {
          setLoading(Math.min(95, 10 + Math.round((xhr.loaded / 128140208) * 85)));
        }
      },
      (err) => {
        console.error('Failed to load jaijitesh_room.glb:', err);
        reject(err);
      }
    );
  });
}

// =============================================================================
// HP OMEN LAPTOP SCREEN RENDERER
// =============================================================================
function createScreenCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  world.screenCanvas = canvas;
  world.screenCtx = ctx;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;

  // Correct inverted/mirrored Blender screen UV mapping
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI;

  world.screenTexture = texture;

  drawLaptopScreen();
}

function drawLaptopScreen() {
  const ctx = world.screenCtx;
  if (!ctx) return;

  ctx.fillStyle = '#060a0f';
  ctx.fillRect(0, 0, 1024, 640);

  // Grid scanlines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 640; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Header Banner
  ctx.fillStyle = '#0c131d';
  ctx.fillRect(0, 0, 1024, 52);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
  ctx.strokeRect(0, 0, 1024, 52);

  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('JAIJITESH.OS // SYSTEM WORKBENCH v3.8.4', 28, 34);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '14px monospace';
  ctx.fillText('STATUS: ONLINE • AIR-GAPPED CORE', 720, 34);

  // Standby terminal box
  ctx.fillStyle = 'rgba(10, 18, 28, 0.85)';
  ctx.fillRect(64, 96, 896, 480);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(64, 96, 896, 480);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('JAIJITESH SURYAPRAKASH', 100, 160);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px monospace';
  ctx.fillText('Robotics Engineer • Autonomous Systems • Embedded Firmware', 100, 200);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '16px monospace';
  ctx.fillText('> SYSTEM TELEMETRY ACTIVE', 100, 260);
  ctx.fillText('> SENSORS CONNECTED: ESP32 [ONLINE], RPi-4 [ACTIVE], BOT [READY]', 100, 295);
  ctx.fillText('> PRESS [E] OR CLICK WORKSTATION TO LAUNCH FULL OS', 100, 350);

  // Glowing prompt pill
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(100, 410, 320, 52);
  ctx.fillStyle = '#05080c';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('[E] BOOT DESKTOP', 140, 442);

  if (world.screenTexture) {
    world.screenTexture.needsUpdate = true;
  }
}

// =============================================================================
// INTERACTIVE THREE-BUTTON SWITCHBOARD TOGGLES
// =============================================================================
function pulseSwitchEmissive(colorHex = 0x38bdf8) {
  if (!world.switchboard) return;
  world.switchboard.traverse((c) => {
    if (c.isMesh && c.material) {
      const mat = c.material;
      const origColor = mat.emissive ? mat.emissive.getHex() : 0x000000;
      if (mat.emissive) {
        mat.emissive.setHex(colorHex);
        mat.emissiveIntensity = 2.5;
        setTimeout(() => {
          mat.emissive.setHex(origColor);
          mat.emissiveIntensity = 1.0;
        }, 300);
      }
    }
  });
}

function toggleSwitchButton(id) {
  sound.click(750, 0.04);
  pulseSwitchEmissive(0x38bdf8);

  if (id === 1) {
    // Button 1: Toggle Ventilation Fan
    if (world.fanAction) {
      world.fanAction.paused = !world.fanAction.paused;
      showToast(world.fanAction.paused ? 'VENTILATION FAN: PAUSED' : 'VENTILATION FAN: SPINNING');
    }
  } else if (id === 2) {
    // Button 2: Toggle Ceiling / Main Lights
    world.switchStates.ceiling = !world.switchStates.ceiling;
    const ceilInt = world.switchStates.ceiling ? 2.2 : 0.5;
    const upInt = world.switchStates.ceiling ? 1.5 : 0.3;
    if (world.lights.ceiling) world.lights.ceiling.intensity = ceilInt;
    if (world.lights.upperCeiling) world.lights.upperCeiling.intensity = upInt;
    showToast(world.switchStates.ceiling ? 'CEILING ILLUMINATION: FULL' : 'CEILING ILLUMINATION: DIM');
  } else if (id === 3) {
    // Button 3: Toggle Ambient / Accent Lights (Desk, Bed, Window)
    world.switchStates.ambient = !world.switchStates.ambient;
    const deskInt = world.switchStates.ambient ? 2.0 : 0.4;
    const bedInt = world.switchStates.ambient ? 1.8 : 0.4;
    const winInt = world.switchStates.ambient ? 1.8 : 0.5;
    if (world.lights.desk) world.lights.desk.intensity = deskInt;
    if (world.lights.bed) world.lights.bed.intensity = bedInt;
    if (world.lights.window) world.lights.window.intensity = winInt;
    showToast(world.switchStates.ambient ? 'AMBIENT ACCENTS: ACTIVE' : 'AMBIENT ACCENTS: MINIMAL');
  } else {
    toggleRoomSystems();
  }
}

function toggleRoomSystems() {
  sound.click(750, 0.04);
  pulseSwitchEmissive(0x38bdf8);
  if (world.fanAction) world.fanAction.paused = !world.fanAction.paused;
  world.switchStates.ceiling = !world.switchStates.ceiling;
  const ceilInt = world.switchStates.ceiling ? 2.2 : 0.5;
  const upInt = world.switchStates.ceiling ? 1.5 : 0.3;
  if (world.lights.ceiling) world.lights.ceiling.intensity = ceilInt;
  if (world.lights.upperCeiling) world.lights.upperCeiling.intensity = upInt;
  showToast(world.switchStates.ceiling ? 'ROOM SYSTEMS // POWER: ACTIVE' : 'ROOM SYSTEMS // POWER: ECO-STANDBY');
}

// =============================================================================
// YELLOW DOOR ACCESS RESTRICTED ALERT
// =============================================================================
function triggerDoorAccessDenied() {
  sound.sonarPing(320);
  if (doorAlert) {
    doorAlert.hidden = false;
    clearTimeout(doorAlert._timer);
    doorAlert._timer = setTimeout(() => {
      doorAlert.hidden = true;
    }, 3200);
  }
}

// =============================================================================
// BUILD WORLD & ASSET LOADING SEQUENCE
// =============================================================================
async function buildWorld() {
  if (!isWebGLAvailable) return;
  setLoading(5);
  createStudioLighting();

  setLoading(10);
  createScreenCanvas();

  setLoading(15);
  await loadAuthoritativeScene();

  camera.position.set(-1.5, 1.45, -0.5);
  camera.rotation.set(0, -0.35, 0);

  setLoading(100);
  setTimeout(() => {
    state.ready = true;
    sound.powerOn();
  }, 300);
}

// =============================================================================
// FIRST-PERSON POV CONTROLS & POINTER LOCK
// =============================================================================
function enterLab() {
  if (state.entered) return;
  state.entered = true;
  sound.click(520, 0.03);

  if (window.tubesCursorInstance) {
    window.tubesCursorInstance.hide();
  }

  if (loading) {
    loading.classList.remove('is-vaporizing');
    loading.classList.add('is-visible');
  }

  const checkReadyInterval = setInterval(() => {
    if (state.ready) {
      clearInterval(checkReadyInterval);
      setLoading(100);

      setTimeout(() => {
        if (loading) loading.classList.add('is-vaporizing');

        intro.classList.add('is-exiting');
        intro.style.display = 'none';
        intro.style.visibility = 'hidden';
        intro.style.opacity = '0';
        intro.style.pointerEvents = 'none';

        worldUi.classList.add('is-visible');

        if (!world.desktopManager) {
          world.desktopManager = new DesktopManager(
            screenBody,
            (key) => inspectHardware(key),
            () => exitLaptop()
          );
        }

        activateFPOV();
        showToast('WASD: MOVE • MOUSE: LOOK • E: INTERACT');

        setTimeout(() => {
          if (loading) loading.style.display = 'none';
        }, 750);
      }, 500);
    }
  }, 60);
}
window.enterLab = enterLab;

// =============================================================================
// PHONE & TOUCH SCREEN FIRST-PERSON CONTROLLER
// =============================================================================
let touchLookId = null;
let touchLookStartX = 0;
let touchLookStartY = 0;
let touchLookStartTime = 0;
let touchJoystickId = null;
let mobileControlsInitialized = false;

function initMobileTouchControls() {
  if (mobileControlsInitialized || !mobileControls || !touchJoystick || !touchKnob) return;
  mobileControlsInitialized = true;

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);
  if (!isTouch) return;

  mobileControls.hidden = false;

  // 1. Virtual Joystick Touch Handler
  const handleJoystickMove = (touch) => {
    const rect = touchJoystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const maxRadius = 42;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    touchKnob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    fpov.touchMoveX = dx / maxRadius;
    fpov.touchMoveZ = -dy / maxRadius;
  };

  const resetJoystick = () => {
    touchJoystickId = null;
    touchKnob.style.transform = 'translate3d(0, 0, 0)';
    fpov.touchMoveX = 0;
    fpov.touchMoveZ = 0;
  };

  touchJoystick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.changedTouches[0];
    touchJoystickId = touch.identifier;
    handleJoystickMove(touch);
  }, { passive: false });

  touchJoystick.addEventListener('touchmove', (e) => {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchJoystickId) {
        handleJoystickMove(e.changedTouches[i]);
        break;
      }
    }
  }, { passive: false });

  touchJoystick.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchJoystickId) {
        resetJoystick();
        break;
      }
    }
  }, { passive: false });

  touchJoystick.addEventListener('touchcancel', (e) => {
    resetJoystick();
  }, { passive: false });

  // 2. Action Buttons (Interact, Up, Down)
  touchInteractBtn?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFPOVInteract();
  }, { passive: false });

  touchUpBtn?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fpov.moveUp = true;
  }, { passive: false });
  touchUpBtn?.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fpov.moveUp = false;
  }, { passive: false });
  touchUpBtn?.addEventListener('touchcancel', () => { fpov.moveUp = false; });

  touchDownBtn?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fpov.moveDown = true;
  }, { passive: false });
  touchDownBtn?.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fpov.moveDown = false;
  }, { passive: false });
  touchDownBtn?.addEventListener('touchcancel', () => { fpov.moveDown = false; });

  // 3. Screen Touch Drag for Camera Look (outside joystick & buttons)
  window.addEventListener('touchstart', (e) => {
    if (!state.fpovMode) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const target = touch.target;
      if (target.closest && (target.closest('#touchJoystick') || target.closest('.mobile-controls__actions') || target.closest('header'))) {
        continue;
      }
      if (touchLookId === null) {
        touchLookId = touch.identifier;
        touchLookStartX = touch.clientX;
        touchLookStartY = touch.clientY;
        touchLookStartTime = performance.now();
      }
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!state.fpovMode || touchLookId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchLookId) {
        const dx = touch.clientX - touchLookStartX;
        const dy = touch.clientY - touchLookStartY;
        touchLookStartX = touch.clientX;
        touchLookStartY = touch.clientY;

        // Smooth look rotation, 1:1 user touch control
        fpov.yaw -= dx * 0.0045;
        fpov.pitch = Math.max(-1.45, Math.min(1.45, fpov.pitch - dy * 0.0045));
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!state.fpovMode || touchLookId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchLookId) {
        const dt = performance.now() - touchLookStartTime;
        if (dt < 250 && fpov.activeInteractable) {
          handleFPOVInteract();
        }
        touchLookId = null;
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    touchLookId = null;
  }, { passive: true });
}

function activateFPOV() {
  state.fpovMode = true;
  if (controls) controls.enabled = false;
  if (fpovHud) fpovHud.hidden = false;

  camera.rotation.order = 'YXZ';
  camera.position.set(-1.5, 1.45, -0.5);
  fpov.yaw = -0.35;
  fpov.pitch = 0.0;
  camera.rotation.y = fpov.yaw;
  camera.rotation.x = fpov.pitch;
  camera.rotation.z = 0;

  window.addEventListener('keydown', onFPOVKeyDown);
  window.addEventListener('keyup', onFPOVKeyUp);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onFPOVMouseMove);

  // Initialize Phone & Mobile touch navigation
  initMobileTouchControls();

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);
  if (isTouch) {
    if (mobileControls) mobileControls.hidden = false;
    showToast('JOYSTICK: MOVE • SWIPE: LOOK • [E]: ACTION');
  } else {
    requestPointerLock();
  }
}

function deactivateFPOV() {
  state.fpovMode = false;
  if (fpovHud) fpovHud.hidden = true;
  window.removeEventListener('keydown', onFPOVKeyDown);
  window.removeEventListener('keyup', onFPOVKeyUp);
  document.removeEventListener('pointerlockchange', onPointerLockChange);
  document.removeEventListener('mousemove', onFPOVMouseMove);
  exitPointerLock();
}

function requestPointerLock() {
  if (canvas && !document.pointerLockElement) {
    try {
      canvas.requestPointerLock();
    } catch (e) {
      console.warn('Pointer lock request ignored:', e);
    }
  }
}

function exitPointerLock() {
  if (document.pointerLockElement) {
    try {
      document.exitPointerLock();
    } catch (e) {
      console.warn('Pointer lock exit ignored:', e);
    }
  }
}

function onPointerLockChange() {
  state.pointerLocked = document.pointerLockElement === canvas;
}

function onFPOVMouseMove(e) {
  if (!state.pointerLocked) return;

  const dx = e.movementX || e.mozMovementX || 0;
  const dy = e.movementY || e.mozMovementY || 0;

  // Filter out mouse-wrap glitch spikes
  if (Math.abs(dx) > 200 || Math.abs(dy) > 200) return;

  // 1:1 Raw input, ABSOLUTELY NO SNAPPING
  fpov.yaw -= dx * fpov.lookSensitivity;
  fpov.pitch = Math.max(-1.45, Math.min(1.45, fpov.pitch - dy * fpov.lookSensitivity));
}

function onFPOVKeyDown(e) {
  if (e.repeat) return;
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      fpov.moveForward = true;
      break;
    case 'KeyS':
    case 'ArrowDown':
      fpov.moveBackward = true;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      fpov.moveLeft = true;
      break;
    case 'KeyD':
    case 'ArrowRight':
      fpov.moveRight = true;
      break;
    case 'Space':
      fpov.moveUp = true;
      e.preventDefault();
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      fpov.moveDown = true;
      e.preventDefault();
      break;
    case 'KeyE':
    case 'KeyF':
      handleFPOVInteract();
      break;
  }
}

function onFPOVKeyUp(e) {
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      fpov.moveForward = false;
      break;
    case 'KeyS':
    case 'ArrowDown':
      fpov.moveBackward = false;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      fpov.moveLeft = false;
      break;
    case 'KeyD':
    case 'ArrowRight':
      fpov.moveRight = false;
      break;
    case 'Space':
      fpov.moveUp = false;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      fpov.moveDown = false;
      break;
  }
}

// Pre-allocated vectors for garbage-collection-free movement loop
const fpovForward = new THREE.Vector3();
const fpovRight = new THREE.Vector3();
const fpovMoveDir = new THREE.Vector3();
const fpovNextPos = new THREE.Vector3();
let lastRaycastTime = 0;

function updateFPOVMovement(delta) {
  if (!state.fpovMode) return;

  let moveX = (fpov.moveRight ? 1 : 0) - (fpov.moveLeft ? 1 : 0) + (fpov.touchMoveX || 0);
  let moveZ = (fpov.moveForward ? 1 : 0) - (fpov.moveBackward ? 1 : 0) + (fpov.touchMoveZ || 0);
  let moveY = (fpov.moveUp ? 1 : 0) - (fpov.moveDown ? 1 : 0);

  const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (len > 1) {
    moveX /= len;
    moveZ /= len;
  }

  if (moveX !== 0 || moveZ !== 0 || moveY !== 0) {
    fpovForward.set(-Math.sin(fpov.yaw), 0, -Math.cos(fpov.yaw));
    fpovRight.set(Math.cos(fpov.yaw), 0, -Math.sin(fpov.yaw));

    fpovMoveDir.set(0, 0, 0)
      .addScaledVector(fpovForward, moveZ)
      .addScaledVector(fpovRight, moveX)
      .normalize();

    const speed = fpov.speed * delta;
    fpovNextPos.copy(camera.position);
    fpovNextPos.x += fpovMoveDir.x * speed;
    fpovNextPos.z += fpovMoveDir.z * speed;
    fpovNextPos.y += moveY * fpov.verticalSpeed * delta;

    clampRoomCollision(fpovNextPos, camera.position);
    camera.position.copy(fpovNextPos);
  }

  camera.rotation.y = fpov.yaw;
  camera.rotation.x = fpov.pitch;
  camera.rotation.z = 0;

  // Throttled raycasting: 80ms interval saves up to 85% CPU/GPU overhead
  const now = performance.now();
  if (now - lastRaycastTime > 80) {
    lastRaycastTime = now;
    raycastCrosshair();
  }
}

function clampRoomCollision(nextPos, prevPos) {
  // Eye height limit
  nextPos.y = Math.max(0.75, Math.min(2.55, nextPos.y));

  // Overall room perimeter bounds
  nextPos.x = Math.max(-4.40, nextPos.x);
  nextPos.z = Math.max(-2.95, Math.min(2.35, nextPos.z));

  // Solid wall behind laptop and bed:
  // For any position along the bed/desk area (z < 0.65), x must NEVER exceed -0.38
  // preventing walking through the desk or phasing into the wall behind the laptop.
  if (nextPos.z < 0.65) {
    nextPos.x = Math.min(-0.38, nextPos.x);
  } else {
    nextPos.x = Math.min(2.40, nextPos.x);
  }

  // Bed box obstacle [-1.55, 0.45] x [-3.10, -1.25]
  if (nextPos.x > -1.55 && nextPos.z > -3.10 && nextPos.z < -1.25) {
    if (prevPos.x <= -1.55) nextPos.x = -1.55;
    else if (prevPos.z >= -1.25) nextPos.z = -1.25;
    else if (prevPos.z <= -3.10) nextPos.z = -3.10;
    else nextPos.x = -1.55;
  }
}

// =============================================================================
// CROSSHAIR RAYCASTING & CONTEXTUAL INTERACTION
// =============================================================================
function raycastCrosshair() {
  if (!state.fpovMode || !camera || world.interactables.length === 0) {
    fpov.activeInteractable = null;
    if (fpovPrompt) fpovPrompt.hidden = true;
    return;
  }

  raycaster.setFromCamera(pointer, camera);
  raycaster.far = 2.4;

  const hits = raycaster.intersectObjects(world.interactables, true);
  if (hits.length > 0) {
    let hitObj = hits[0].object;
    while (hitObj && !hitObj.userData.actionPrompt && hitObj.parent && hitObj.parent !== stage) {
      hitObj = hitObj.parent;
    }

    if (hitObj && hitObj.userData.actionPrompt) {
      if (hitObj.userData.isSwitchboard && hits[0].point) {
        const hy = hits[0].point.y;
        if (hy >= 1.565) {
          hitObj.userData.actionPrompt = 'SWITCH 1: TOGGLE FAN';
          hitObj.userData.switchButtonId = 1;
        } else if (hy >= 1.475) {
          hitObj.userData.actionPrompt = 'SWITCH 2: TOGGLE CEILING LIGHTS';
          hitObj.userData.switchButtonId = 2;
        } else {
          hitObj.userData.actionPrompt = 'SWITCH 3: TOGGLE AMBIENT GLOW';
          hitObj.userData.switchButtonId = 3;
        }
      }
      fpov.activeInteractable = hitObj;
      if (fpovPrompt) {
        fpovPrompt.hidden = false;
        if (fpovPromptText) fpovPromptText.textContent = hitObj.userData.actionPrompt;
      }
      if (touchInteractBtn) {
        touchInteractBtn.classList.add('is-active');
        if (touchInteractLabel) {
          if (hitObj.userData.isLaptop) touchInteractLabel.textContent = 'BOOT';
          else if (hitObj.userData.isSwitchboard) touchInteractLabel.textContent = 'SWITCH';
          else if (hitObj.userData.isYellowDoor) touchInteractLabel.textContent = 'OPEN';
          else touchInteractLabel.textContent = 'INSPECT';
        }
      }
      return;
    }
  }

  fpov.activeInteractable = null;
  if (fpovPrompt) fpovPrompt.hidden = true;
  if (touchInteractBtn) {
    touchInteractBtn.classList.remove('is-active');
    if (touchInteractLabel) touchInteractLabel.textContent = 'ACTION';
  }
}

function handleFPOVInteract() {
  if (!fpov.activeInteractable) return;
  const target = fpov.activeInteractable;

  if (target.userData.isLaptop) {
    focusLaptop();
  } else if (target.userData.isSwitchboard) {
    toggleSwitchButton(target.userData.switchButtonId || 0);
  } else if (target.userData.isYellowDoor) {
    triggerDoorAccessDenied();
  } else if (target.userData.isHardware) {
    inspectHardware(target.userData.isHardware);
  } else {
    sound.click(650, 0.03);
    showToast(target.userData.actionPrompt || 'INTERACTION EXECUTED');
  }
}

// =============================================================================
// LAPTOP FOCUS & WORKSTATION OS
// =============================================================================
function focusLaptop(targetApp = null) {
  if (state.busy) return;
  state.busy = true;
  state.focused = true;
  deactivateFPOV();

  try { sound.keyPress?.(); } catch (_) {}

  // Position camera directly facing the HP Omen Laptop screen
  const laptopPos = new THREE.Vector3(0.112, 0.898, -0.299);
  const camPos = new THREE.Vector3(-0.45, 1.15, -0.299);

  easeCamera(camPos, laptopPos, 0.85, () => {
    state.busy = false;
    if (controls) controls.enabled = false;
    bootSystem();
    if (targetApp && world.desktopManager) {
      setTimeout(() => world.desktopManager.launchApp(targetApp), 300);
    }
  });
}
window.focusLaptop = focusLaptop;

function bootSystem() {
  if (state.screenState === 'desktop') return;
  state.screenState = 'boot';
  try { sound.bootChime?.(); } catch (_) {}
  setTimeout(() => {
    state.screenState = 'desktop';
    openScreen();
  }, 400);
}

function openScreen() {
  screenUi.classList.add('is-open');
  try {
    world.desktopManager?.open?.();
  } catch (err) {
    console.warn('Desktop manager open error:', err);
  }
}

function exitLaptop() {
  state.busy = false;
  state.focused = false;
  state.screenState = 'sleep';

  screenUi.classList.remove('is-open');

  try {
    world.desktopManager?.close?.();
  } catch (err) {
    console.warn('Desktop manager close error:', err);
  }

  try {
    sound.powerDown?.();
  } catch (_) {}

  // Smoothly ease camera back from the laptop to standing room perspective
  const standingPos = new THREE.Vector3(-1.5, 1.45, -0.5);
  const lookTarget = new THREE.Vector3(-0.35, 1.15, -0.3);

  easeCamera(standingPos, lookTarget, 0.75, () => {
    state.busy = false;
    fpov.yaw = -0.35;
    fpov.pitch = 0.0;
    activateFPOV();
    showToast('WASD: MOVE • MOUSE: LOOK • E: INTERACT');
  });
}
window.exitLaptop = exitLaptop;

// =============================================================================
// HARDWARE TELEMETRY INSPECTOR
// =============================================================================
function inspectHardware(key) {
  const def = HARDWARE_DEFINITIONS[key];
  if (!def) return;

  state.busy = true;
  state.inspecting = key;
  deactivateFPOV();

  screenUi.classList.remove('is-open');

  const model = world.hardwareObjects.get(key);
  if (model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.y, size.z, 0.3);

    const camPos = center.clone().add(new THREE.Vector3(span * 1.2, span * 0.8, span * 1.4));
    sound.sonarPing(880);
    easeCamera(camPos, center, 0.85, () => {
      state.busy = false;
      if (controls) controls.enabled = true;
    });
  } else {
    state.busy = false;
  }

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

// =============================================================================
// EVENT BINDINGS & APP INITIALIZATION
// =============================================================================
function bindEvents() {
  $('#enter').addEventListener('click', enterLab);
  $('#homeBtn')?.addEventListener('click', exitLaptop);
  $('#screenExitBtn')?.addEventListener('click', exitLaptop);
  $('#inspectClose')?.addEventListener('click', () => {
    hideInspectorOverlay();
    exitLaptop();
  });
  $('#inspectBack')?.addEventListener('click', () => {
    hideInspectorOverlay();
    exitLaptop();
  });

  // Global Escape Key to return from Workstation or Inspector to 3D room
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.inspecting) {
        hideInspectorOverlay();
        exitLaptop();
      } else if (state.focused || screenUi.classList.contains('is-open')) {
        exitLaptop();
      }
    }
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

  canvas.addEventListener('click', () => {
    if (!state.fpovMode) return;
    if (!document.pointerLockElement) {
      requestPointerLock();
      return;
    }
    if (fpov.activeInteractable) {
      handleFPOVInteract();
    }
  });

  window.addEventListener('resize', () => {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (state.is3DOffloaded || !renderer || !scene || !camera) return;

  const delta = clock.getDelta();

  // Fan animation continuous playback
  if (world.roomMixer) {
    world.roomMixer.update(delta);
  }

  // First Person POV Movement & Collision
  updateFPOVMovement(delta);

  if (controls && controls.enabled) {
    controls.update();
  }

  renderer.render(scene, camera);
}

async function start() {
  bindEvents();
  animate();
  try {
    setLoading(5);
    await buildWorld();
  } catch (err) {
    console.error('Initialization error:', err);
    if (loadingDetail) loadingDetail.textContent = 'ERR';
    showToast('ASSET LOAD FAILED');
  }
}

// Initialize 3D Glowing Tubes Cursor on the Landing Screen
let tubesCursorInstance = null;
try {
  tubesCursorInstance = new HomeTubesCursor('tubesCanvas');
  window.tubesCursorInstance = tubesCursorInstance;
} catch (e) {
  console.warn('HomeTubesCursor initialization error:', e);
}

start();
