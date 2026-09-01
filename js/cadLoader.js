import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const HARDWARE_DEFINITIONS = {
  robot: {
    id: 'robot',
    file: 'assets/chassis.glb',
    title: 'BERRYBOT // TRACKED ROBOTICS PLATFORM',
    eyebrow: 'PHYSICAL 3D MODEL // SOLIDWORKS ASSEMBLY',
    category: 'AUTONOMOUS ROBOTICS',
    summary: 'A tracked autonomous robotics platform designed and built entirely by Jaijitesh around a Waveshare ESP32 controller. Features encoder-based motion control, S-curve trajectory profiling, telemetry, path tracking, and return-to-home capabilities.',
    specs: [
      ['CONTROLLER', 'Waveshare ESP32 Multi-Channel Driver'],
      ['KINEMATICS', 'Differential Track Drive w/ S-Curve Smoothing'],
      ['FEEDBACK', 'Optical Quadrature Encoders + Telemetry Loop'],
      ['CAPABILITIES', 'Path Tracking, Return-To-Home, Closed-Loop PID'],
      ['EXPANSION', 'Engineered to integrate Vision, Navigation, & WindSim'],
      ['SOURCE', 'SolidWorks CAD Assembly (TV_ensemble / M4)'],
    ],
    scale: 0.88,
    isGroundedOnFloor: false,
    benchPosition: new THREE.Vector3(-1.38, 0.85, 0.05),
    benchRotation: new THREE.Euler(0, 0.32, 0),
  },
  camera: {
    id: 'camera',
    file: 'assets/canon_at-1_retro_camera.glb',
    title: 'CANON AT-1 // 35MM RETRO OPTICS',
    eyebrow: 'PHYSICAL 3D MODEL // COMPUTER VISION & SENSING',
    category: 'OPTICAL SENSING',
    summary: 'Retro 35mm SLR optical camera body representing computer vision, photogrammetry data synthesis pipelines, and spectral chromaticity research.',
    specs: [
      ['MOUNT', 'Canon FD Bayonet System'],
      ['ROLE', 'Optical Perception & Image Processing Asset'],
      ['SHUTTER', 'Focal-Plane Electronic Shutter'],
      ['RESEARCH LINK', 'Spectral Color-Space & Data Generation'],
    ],
    scale: 0.42,
    isGroundedOnFloor: false,
    benchPosition: new THREE.Vector3(-0.82, 0.85, 0.22),
    benchRotation: new THREE.Euler(0, 0.45, 0),
  },
  raspberry: {
    id: 'raspberry',
    file: 'assets/raspberry.glb',
    title: 'RASPBERRY PI 4 // MODEL B',
    eyebrow: 'PHYSICAL 3D MODEL // SINGLE-BOARD COMPUTER',
    category: 'EDGE COMPUTE NODE',
    summary: 'High-performance edge computational node for on-board autonomous robot processing, local vision pipeline orchestration, and system telemetry logging.',
    specs: [
      ['SOC', 'Broadcom BCM2711 Quad-core Cortex-A72 @ 1.5GHz'],
      ['MEMORY', '4GB LPDDR4-3200 SDRAM'],
      ['IO PORTS', '2x USB 3.0, 2x USB 2.0, Gigabit Ethernet, Dual Micro-HDMI'],
      ['GPIO', 'Standard 40-Pin Header (I2C, SPI, UART, PWM)'],
      ['ROLE', 'Edge Vision & High-Level Autonomy Coordinator'],
    ],
    scale: 0.36,
    isGroundedOnFloor: false,
    benchPosition: new THREE.Vector3(0.92, 0.85, 0.22),
    benchRotation: new THREE.Euler(0, -0.22, 0),
  },
  esp32: {
    id: 'esp32',
    file: 'assets/esp32.glb',
    title: 'ESP32-WROOM // DUAL-CORE MICROCONTROLLER',
    eyebrow: 'PHYSICAL 3D MODEL // EMBEDDED HARDWARE',
    category: 'MICROCONTROLLER & MOTOR CONTROL',
    summary: 'High-speed 240MHz dual-core embedded processor driving low-latency motor control loops, real-time optical encoder counting, and hardware sensor telemetry.',
    specs: [
      ['MCU', 'ESP-WROOM-32 (Tensilica Xtensa Dual-Core 240MHz)'],
      ['TIMING', 'Hardware Timers for 20kHz Motor PWM Generation'],
      ['PULSE COUNT', 'Hardware PCNT Peripheral for Encoder Ranging'],
      ['CONNECTIVITY', '2.4 GHz Wi-Fi & Bluetooth v4.2 BR/EDR/BLE'],
      ['ROLE', 'Low-Level Real-Time Motor & Sensor Controller'],
    ],
    scale: 0.16,
    isGroundedOnFloor: false,
    benchPosition: new THREE.Vector3(1.22, 0.85, 0.22),
    benchRotation: new THREE.Euler(0, -0.32, 0),
  },
  cat: {
    id: 'cat',
    file: 'assets/3d_modelling_my_cat_fripouille.glb',
    title: 'CRISPY // PET CAT',
    eyebrow: 'EASTER EGG // CRISPY',
    category: 'PET',
    summary: 'Crispy the pet cat resting on the workbench.',
    specs: [
      ['SPECIES', 'Domestic Cat'],
      ['NAME', 'Crispy'],
    ],
    scale: 0.72,
    isGroundedOnFloor: false,
    benchPosition: new THREE.Vector3(1.42, 0.85, -0.32),
    benchRotation: new THREE.Euler(0, -0.65, 0),
  },
  dog: {
    id: 'dog',
    file: 'assets/full_body_shepherd_dog_meshy.glb',
    title: 'BERRY // PET DOG',
    eyebrow: 'EASTER EGG // BERRY',
    category: 'PET',
    summary: 'Berry the pet dog beside the workbench.',
    specs: [
      ['BREED', 'Belgian Malinois'],
      ['NAME', 'Berry'],
    ],
    scale: 0.92,
    isGroundedOnFloor: true,
    benchPosition: new THREE.Vector3(-1.62, 0, 1.05),
    benchRotation: new THREE.Euler(0, 0.45, 0),
  },
  telescope: {
    id: 'telescope',
    file: 'assets/telescope.glb',
    title: 'REFRACTOR TELESCOPE // ASTRONOMICAL OPTICS',
    eyebrow: 'PHYSICAL 3D MODEL // SCIENTIFIC INSTRUMENT',
    category: 'SCIENTIFIC COMPUTING',
    summary: 'Precision equatorial refractor telescope standing right beside the workbench, symbolizing celestial observation, mathematical modeling, and scientific computing.',
    specs: [
      ['OPTICS', 'Achromatic Refractor Objective'],
      ['MOUNT', 'Heavy-Duty Equatorial Tripod'],
      ['ROLE', 'Scientific Instrumentation & Horizon Exploration'],
    ],
    scale: 1.85,
    isGroundedOnFloor: true,
    benchPosition: new THREE.Vector3(2.08, 0, 0.38), // Right next to the table
    benchRotation: new THREE.Euler(0, -0.65, 0),
  }
};

class ModelManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.models = new Map();
    this.benchMeshes = new Map();
  }

  loadGlb(path) {
    return new Promise((resolve, reject) => {
      this.loader.load(path, resolve, undefined, reject);
    });
  }

  async loadAllHardware(stage, deskTopHeight, onProgress) {
    const keys = Object.keys(HARDWARE_DEFINITIONS);
    const clickables = [];

    // Custom PBR materials for BerryBot tracked chassis
    const trackMat = new THREE.MeshStandardMaterial({
      color: '#131517',
      roughness: 0.88,
      metalness: 0.15,
      name: 'robot_tracks'
    });

    const wheelMat = new THREE.MeshStandardMaterial({
      color: '#343a42',
      roughness: 0.35,
      metalness: 0.85,
      name: 'robot_wheels'
    });

    const hullMat = new THREE.MeshStandardMaterial({
      color: '#21262d',
      roughness: 0.42,
      metalness: 0.78,
      name: 'robot_hull'
    });

    const detailMat = new THREE.MeshStandardMaterial({
      color: '#485260',
      roughness: 0.3,
      metalness: 0.9,
      name: 'robot_detail'
    });

    // Custom PBR materials for ESP32 microcontroller
    const espPcbMat = new THREE.MeshStandardMaterial({
      color: '#141815',
      roughness: 0.75,
      metalness: 0.12,
      name: 'esp32_pcb'
    });

    const espShieldMat = new THREE.MeshStandardMaterial({
      color: '#909aa4',
      roughness: 0.28,
      metalness: 0.92,
      name: 'esp32_shield'
    });

    const espGoldMat = new THREE.MeshStandardMaterial({
      color: '#d4af37',
      roughness: 0.22,
      metalness: 0.95,
      name: 'esp32_gold'
    });

    // Dark studio matte metal material
    const studioMetalMat = new THREE.MeshStandardMaterial({
      color: '#181c22',
      roughness: 0.6,
      metalness: 0.82,
      name: 'studio_metal'
    });

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const def = HARDWARE_DEFINITIONS[key];
      onProgress?.(45 + Math.round((i / keys.length) * 45), `LOADING ${def.title.split('//')[0].trim()}`);

      try {
        const gltf = await this.loadGlb(def.file);
        const root = gltf.scene;

        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (key === 'robot') {
              const name = child.name || '';
              if (/Track/i.test(name)) {
                child.material = trackMat.clone();
              } else if (/Wheel|Roller|Circle/i.test(name)) {
                child.material = wheelMat.clone();
              } else if (/Block|Manifold|Shaft/i.test(name)) {
                child.material = detailMat.clone();
              } else {
                child.material = hullMat.clone();
              }
            } else if (key === 'esp32') {
              if (Array.isArray(child.material)) {
                child.material = child.material.map((m, idx) => {
                  if (idx % 3 === 0) return espPcbMat.clone();
                  if (idx % 3 === 1) return espShieldMat.clone();
                  return espGoldMat.clone();
                });
              } else {
                child.material = espShieldMat.clone();
              }
            } else if (key === 'studio') {
              const name = child.name || '';
              // Completely remove roof, ceiling, giant shader ball, and white curtain sheets
              if (/Shader Ball|Ball|Ceiling|Roof|Curtain|Floor|Backdrop/i.test(name)) {
                child.visible = false;
                child.geometry?.dispose?.();
              } else if (child.material) {
                child.material = studioMetalMat.clone();
              }
            } else if (child.material) {
              child.material = child.material.clone();
              child.material.envMapIntensity = 0.95;
              if (child.material.map) child.material.map.colorSpace = THREE.SRGBColorSpace;
            }
          }
        });

        // Flip cat model upright so legs/paws point downwards onto table surface
        if (key === 'cat') {
          root.rotation.x = Math.PI;
          root.updateMatrixWorld(true);
        }

        // Compute natural bounding box before centering
        root.updateMatrixWorld(true);
        const boxBefore = new THREE.Box3().setFromObject(root);
        const centerBefore = boxBefore.getCenter(new THREE.Vector3());
        const sizeBefore = boxBefore.getSize(new THREE.Vector3());
        const maxDim = Math.max(sizeBefore.x, sizeBefore.y, sizeBefore.z);

        // Center inner geometry around local origin (0, 0, 0)
        root.position.sub(centerBefore);

        // Wrap in parent anchor group for reliable transformation and animations
        const wrapper = new THREE.Group();
        wrapper.add(root);

        // Scale wrapper to target real-world dimension
        const targetScale = def.scale / maxDim;
        wrapper.scale.set(targetScale, targetScale, targetScale);
        wrapper.updateMatrixWorld(true);

        // Calculate bottom offset so model sits flush on either floor or tabletop
        const boxAfter = new THREE.Box3().setFromObject(wrapper);
        const yOffset = -boxAfter.min.y;
        const groundLevel = def.isGroundedOnFloor ? 0 : deskTopHeight;

        wrapper.position.set(
          def.benchPosition.x,
          groundLevel + yOffset + 0.002,
          def.benchPosition.z
        );

        if (def.benchRotation) {
          wrapper.rotation.copy(def.benchRotation);
        }

        if (def.isInteractive !== false) {
          wrapper.userData.hardwareKey = key;
          wrapper.userData.isHardwareNode = true;
          clickables.push(wrapper);
        }

        wrapper.userData.baseY = wrapper.position.y;
        wrapper.userData.baseRotY = wrapper.rotation.y;

        stage.add(wrapper);
        this.benchMeshes.set(key, wrapper);
      } catch (err) {
        console.error(`Error loading model ${def.file}:`, err);
      }
    }

    return clickables;
  }
}

export const modelManager = new ModelManager();
