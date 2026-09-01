import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

export const motion = {
  to(...args) { return (window.gsap || fallbackMotion).to(...args); },
  killTweensOf(...args) { return window.gsap?.killTweensOf?.(...args); }
};

export function setupScene(canvas) {
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
  controls.minPolarAngle = Math.PI * 0.22;    // Prevents looking straight down from above
  controls.maxPolarAngle = Math.PI * 0.46;    // Prevents going below desk/floor level
  controls.minDistance = 1.15;
  controls.maxDistance = 4.2;                 // Prevents zooming past room perimeter

  const stage = new THREE.Group();
  scene.add(stage);

  return { renderer, scene, camera, controls, stage };
}

export function buildBenchRoom(scene) {
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

export function easeCamera(camera, controls, position, target, duration = 1.2, onComplete) {
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
