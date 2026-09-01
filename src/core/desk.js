import * as THREE from 'three';
import { DESK_TOP_HEIGHT } from './state.js';

// Procedural Topographic Elevation Contour Line Canvas Texture Generator
export function createTopographicTexture(renderer) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Deep matte black surface
  ctx.fillStyle = '#0a0d10';
  ctx.fillRect(0, 0, c.width, c.height);

  // Coordinate grid markings
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

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '14px "Space Mono", monospace';
  ctx.fillText('TOPOGRAPHIC ELEVATION SPEC // 01-SYS', 54, c.height - 44);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;
  return texture;
}

// Build Chamfered Luxury Dark Oak Workbench & Topographic Mat
export function buildLuxuryDesk(stage, renderer) {
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
  const topoTexture = createTopographicTexture(renderer);
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

  stage.add(deskGroup);
  return { deskGroup, deskMat };
}

// Precision Smooth High-Poly Ergonomic Engineering Mouse (Zero light sources)
export function buildEngineeringMouse(stage) {
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
