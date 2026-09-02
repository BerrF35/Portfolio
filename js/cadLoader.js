import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HARDWARE_DEFINITIONS as RAW_DEFS } from './portfolioData.js?v=3';

export const HARDWARE_DEFINITIONS = Object.fromEntries(
  Object.entries(RAW_DEFS).map(([k, v]) => [
    k,
    {
      ...v,
      benchPosition: new THREE.Vector3(v.benchPosition.x, v.benchPosition.y, v.benchPosition.z),
      benchRotation: new THREE.Euler(v.benchRotation.x, v.benchRotation.y, v.benchRotation.z)
    }
  ])
);

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

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const def = HARDWARE_DEFINITIONS[key];
      onProgress?.(45 + Math.round((i / keys.length) * 45), `CALIBRATING ${def.title.split('//')[0].trim()}`);

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
            } else if (child.material) {
              child.material = child.material.clone();
              child.material.envMapIntensity = 0.95;
              if (child.material.map) child.material.map.colorSpace = THREE.SRGBColorSpace;
            }
          }
        });

        if (key === 'cat') {
          root.rotation.x = Math.PI;
          root.updateMatrixWorld(true);
        }

        // Center inner geometry around local origin
        root.updateMatrixWorld(true);
        const boxBefore = new THREE.Box3().setFromObject(root);
        const centerBefore = boxBefore.getCenter(new THREE.Vector3());
        const sizeBefore = boxBefore.getSize(new THREE.Vector3());
        const maxDim = Math.max(sizeBefore.x, sizeBefore.y, sizeBefore.z);

        root.position.sub(centerBefore);

        // Wrap in anchor group for reliable transformations
        const wrapper = new THREE.Group();
        wrapper.add(root);

        const targetScale = def.scale / maxDim;
        wrapper.scale.set(targetScale, targetScale, targetScale);

        if (def.benchRotation) {
          wrapper.rotation.copy(def.benchRotation);
        }
        wrapper.updateMatrixWorld(true);

        const boxAfter = new THREE.Box3().setFromObject(wrapper);
        const yOffset = -boxAfter.min.y;
        const baseSurfaceY = (typeof def.benchPosition.y === 'number') 
          ? def.benchPosition.y 
          : (def.isGroundedOnFloor ? 0 : deskTopHeight);

        wrapper.position.set(
          def.benchPosition.x,
          baseSurfaceY + yOffset + 0.001,
          def.benchPosition.z
        );

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
