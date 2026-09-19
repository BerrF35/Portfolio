export class WebGLBackgroundEngine {
  constructor(canvasId = 'webglBackgroundCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.gyroGroup = null;
    this.coreMesh = null;
    this.wireMesh = null;
    this.ringX = null;
    this.ringY = null;
    this.ringZ = null;
    this.satellites = null;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, isDragging: false, prevX: 0, prevY: 0 };
    this.rotationInertia = { x: 0, y: 0 };
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.clock = null;
    this.rafId = null;
    this.isVisible = true;

    this.themeColors = {
      primary: new THREE.Color(0xd84536),
      secondary: new THREE.Color(0xe0a82e),
      accent: new THREE.Color(0xffffff),
      core: new THREE.Color(0x701b12)
    };

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 2000);
    this.camera.position.set(0, 0, 420);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(1);

    this.clock = new THREE.Clock();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xe0a82e, 1.6, 800);
    pointLight.position.set(120, 160, 200);
    this.scene.add(pointLight);

    const rimLight = new THREE.PointLight(0xd84536, 1.8, 700);
    rimLight.position.set(-140, -100, 150);
    this.scene.add(rimLight);

    this.buildGyroscope();
    this.bindEvents();
    this.animate();
  }

  buildGyroscope() {
    this.gyroGroup = new THREE.Group();

    const coreGeo = new THREE.DodecahedronGeometry(82, 0);
    const coreMat = new THREE.MeshPhongMaterial({
      color: this.themeColors.core,
      emissive: 0x5a150e,
      shininess: 45,
      flatShading: true,
      transparent: true,
      opacity: 0.15
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.gyroGroup.add(this.coreMesh);

    const wireGeo = new THREE.DodecahedronGeometry(85, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.24
    });
    this.wireMesh = new THREE.Mesh(wireGeo, wireMat);
    this.gyroGroup.add(this.wireMesh);

    const ringGeoX = new THREE.TorusGeometry(195, 1.3, 8, 54);
    const ringMatX = new THREE.MeshStandardMaterial({
      color: this.themeColors.primary,
      metalness: 0.5,
      roughness: 0.35,
      transparent: true,
      opacity: 0.22
    });
    this.ringX = new THREE.Mesh(ringGeoX, ringMatX);
    this.gyroGroup.add(this.ringX);

    const ringGeoY = new THREE.TorusGeometry(245, 1.8, 12, 64);
    const ringMatY = new THREE.MeshStandardMaterial({
      color: this.themeColors.secondary,
      metalness: 0.6,
      roughness: 0.25,
      transparent: true,
      opacity: 0.32
    });
    this.ringY = new THREE.Mesh(ringGeoY, ringMatY);
    this.ringY.rotation.x = Math.PI / 2;
    this.gyroGroup.add(this.ringY);

    const ringGeoZ = new THREE.TorusGeometry(295, 1.3, 8, 64);
    const ringMatZ = new THREE.MeshStandardMaterial({
      color: this.themeColors.accent,
      metalness: 0.5,
      roughness: 0.35,
      transparent: true,
      opacity: 0.22
    });
    this.ringZ = new THREE.Mesh(ringGeoZ, ringMatZ);
    this.ringZ.rotation.y = Math.PI / 2;
    this.gyroGroup.add(this.ringZ);

    const satCount = 48;
    const satGeo = new THREE.BufferGeometry();
    const satPos = new Float32Array(satCount * 3);
    for (let i = 0; i < satCount; i++) {
      const radius = 245 + (i % 3 - 1) * 6;
      const angle = (i / satCount) * Math.PI * 2;
      satPos[i * 3] = Math.cos(angle) * radius;
      satPos[i * 3 + 1] = (Math.sin(angle * 4)) * 14;
      satPos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    satGeo.setAttribute('position', new THREE.BufferAttribute(satPos, 3));

    const satTexture = this.createDotTexture();
    const satMat = new THREE.PointsMaterial({
      size: 6,
      map: satTexture,
      transparent: true,
      opacity: 0.28,
      color: 0xf5c242,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.satellites = new THREE.Points(satGeo, satMat);
    this.gyroGroup.add(this.satellites);

    const isDesktop = window.innerWidth > 900;
    this.gyroGroup.position.set(isDesktop ? 20 : 0, isDesktop ? 0 : -20, 0);
    this.gyroGroup.rotation.set(0.2, 0.3, 0);

    this.scene.add(this.gyroGroup);
  }

  createDotTexture() {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, 'rgba(245, 194, 66, 0.9)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);

    const texture = new THREE.CanvasTexture(c);
    texture.needsUpdate = true;
    return texture;
  }

  bindEvents() {
    window.addEventListener('pointermove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.mouse.isDragging) {
        const deltaX = e.clientX - this.mouse.prevX;
        const deltaY = e.clientY - this.mouse.prevY;
        this.rotationInertia.y += deltaX * 0.003;
        this.rotationInertia.x += deltaY * 0.003;
        this.mouse.prevX = e.clientX;
        this.mouse.prevY = e.clientY;
      }
    }, { passive: true });

    window.addEventListener('pointerdown', (e) => {
      if (e.target && e.target.closest && e.target.closest('a, button, input, textarea, select')) return;
      this.mouse.isDragging = true;
      this.mouse.prevX = e.clientX;
      this.mouse.prevY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.mouse.isDragging = false;
    });

    window.addEventListener('resize', () => this.onResize(), { passive: true });

    window.addEventListener('tubesPaletteChange', (e) => {
      if (e.detail && e.detail.lights && e.detail.lights.length > 0) {
        this.updatePalette(e.detail.lights);
      }
    });
  }

  updatePalette(hexColors) {
    if (!hexColors || hexColors.length === 0) return;
    try {
      const c1 = new THREE.Color(hexColors[0]);
      const c2 = new THREE.Color(hexColors[1 % hexColors.length]);
      const c3 = new THREE.Color(hexColors[2 % hexColors.length]);

      if (this.wireMesh) this.wireMesh.material.color = c1;
      if (this.ringX) this.ringX.material.color = c1;
      if (this.ringY) this.ringY.material.color = c2;
      if (this.ringZ) this.ringZ.material.color = c3;
      if (this.satellites) this.satellites.material.color = c2;
    } catch (err) {
      console.warn(err);
    }
  }

  setScrollProgress(progress) {
    this.targetScrollProgress = progress;
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(1);

    const isDesktop = w > 900;
    if (this.gyroGroup) {
      this.gyroGroup.position.x = isDesktop ? 20 : 0;
      this.gyroGroup.position.y = isDesktop ? 0 : -20;
    }
  }

  animate() {
    this.rafId = requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.07;

    this.rotationInertia.x *= 0.92;
    this.rotationInertia.y *= 0.92;

    const p = Math.min(1, Math.max(0, this.scrollProgress));
    const isMobile = window.innerWidth < 768;
    const distScale = isMobile ? 1.25 : 1.0;

    if (this.gyroGroup) {
      this.gyroGroup.rotation.x += this.rotationInertia.x + 0.0015;
      this.gyroGroup.rotation.y += this.rotationInertia.y + 0.002;

      this.gyroGroup.rotation.x += (this.mouse.y * 0.2 - this.gyroGroup.rotation.x * 0.08) * 0.02;
      this.gyroGroup.rotation.y += (this.mouse.x * 0.2 - this.gyroGroup.rotation.y * 0.08) * 0.02;

      if (this.ringX) {
        this.ringX.rotation.x = time * 0.4 + p * 2.2;
        this.ringX.rotation.y = Math.sin(time * 0.25) * 0.2;
      }
      if (this.ringY) {
        this.ringY.rotation.y = time * 0.45 + p * 2.8;
        this.ringY.rotation.z = Math.cos(time * 0.3) * 0.18;
      }
      if (this.ringZ) {
        this.ringZ.rotation.z = time * 0.35 + p * 3.2;
        this.ringZ.rotation.x = Math.sin(time * 0.35) * 0.22;
      }

      if (this.coreMesh) {
        const pulse = 1 + Math.sin(time * 1.5) * 0.025;
        this.coreMesh.scale.set(pulse, pulse, pulse);
        this.coreMesh.rotation.y = -time * 0.25 + p * 1.6;
        this.coreMesh.rotation.x = time * 0.18 + p * 1.1;
      }
      if (this.wireMesh) {
        this.wireMesh.rotation.y = -time * 0.25 + p * 1.6;
        this.wireMesh.rotation.x = time * 0.18 + p * 1.1;
      }

      if (this.satellites) {
        this.satellites.rotation.y = time * 0.3 + p * 2.5;
        this.satellites.rotation.z = Math.sin(time * 0.2) * 0.15;
      }

      if (this.camera) {
        let targetCamX = 20;
        let targetCamY = 0;
        let targetCamZ = 420;
        let targetLookX = 0;
        let targetLookY = 0;
        let targetLookZ = 0;

        if (p < 0.32) {
          const t = p / 0.32;
          const easeT = t * t * (3 - 2 * t);
          targetCamX = 20 + easeT * 170;
          targetCamY = easeT * 42;
          targetCamZ = 420 - easeT * 185;
          targetLookX = easeT * 20;
          targetLookY = easeT * 10;
          targetLookZ = 0;
        } else if (p < 0.62) {
          const u = (p - 0.32) / 0.30;
          const easeU = u * u * (3 - 2 * u);
          const orbitR = (235 - easeU * 118) * distScale;
          const theta = easeU * 2.6 + 0.6;
          targetCamX = Math.cos(theta) * orbitR;
          targetCamY = 42 - easeU * 28 + Math.sin(easeU * Math.PI) * 24;
          targetCamZ = Math.sin(theta) * orbitR;
          targetLookX = Math.cos(theta + 0.7) * 45;
          targetLookY = Math.sin(easeU * Math.PI) * 12;
          targetLookZ = Math.sin(theta + 0.7) * 45;
        } else {
          const w = (p - 0.62) / 0.38;
          const easeW = w * w * (3 - 2 * w);
          const alpha = 3.2 + easeW * 3.6;
          const surfDist = (117 + Math.sin(easeW * Math.PI) * 12) * distScale;
          targetCamX = Math.cos(alpha) * surfDist;
          targetCamY = 14 + Math.sin(alpha * 1.5) * 36;
          targetCamZ = Math.sin(alpha) * surfDist;
          targetLookX = Math.cos(alpha + 0.65) * 38;
          targetLookY = Math.sin(alpha * 1.5) * 15;
          targetLookZ = Math.sin(alpha + 0.65) * 38;
        }

        this.camera.position.x += (targetCamX + this.mouse.x * 20 - this.camera.position.x) * 0.08;
        this.camera.position.y += (targetCamY + this.mouse.y * 16 - this.camera.position.y) * 0.08;
        this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;

        const currentTarget = new THREE.Vector3(targetLookX, targetLookY, targetLookZ);
        this.camera.lookAt(currentTarget);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
