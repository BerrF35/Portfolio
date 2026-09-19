export class WebGLBackgroundEngine {
  constructor(canvasId = 'webglBackgroundCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.gyroGroup = null;
    this.gridBase = null;
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

    this.buildGridBase();
    this.buildGyroscope();
    this.bindEvents();
    this.animate();
  }

  buildGridBase() {
    this.gridBase = new THREE.GridHelper(900, 24, 0xe0a82e, 0x822216);
    this.gridBase.position.set(0, -210, 0);
    if (this.gridBase.material) {
      this.gridBase.material.transparent = true;
      this.gridBase.material.opacity = 0.18;
    }
    this.scene.add(this.gridBase);
  }

  buildGyroscope() {
    this.gyroGroup = new THREE.Group();

    const coreGeo = new THREE.IcosahedronGeometry(75, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: this.themeColors.core,
      emissive: 0x1f0604,
      shininess: 35,
      flatShading: true,
      transparent: true,
      opacity: 0.08
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.gyroGroup.add(this.coreMesh);

    const wireGeo = new THREE.IcosahedronGeometry(80, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.16
    });
    this.wireMesh = new THREE.Mesh(wireGeo, wireMat);
    this.gyroGroup.add(this.wireMesh);

    const ringGeoX = new THREE.TorusGeometry(200, 1.3, 8, 54);
    const ringMatX = new THREE.MeshStandardMaterial({
      color: this.themeColors.primary,
      metalness: 0.5,
      roughness: 0.35,
      transparent: true,
      opacity: 0.22
    });
    this.ringX = new THREE.Mesh(ringGeoX, ringMatX);
    this.gyroGroup.add(this.ringX);

    const ringGeoY = new THREE.TorusGeometry(245, 1.3, 8, 60);
    const ringMatY = new THREE.MeshStandardMaterial({
      color: this.themeColors.secondary,
      metalness: 0.5,
      roughness: 0.35,
      transparent: true,
      opacity: 0.25
    });
    this.ringY = new THREE.Mesh(ringGeoY, ringMatY);
    this.ringY.rotation.x = Math.PI / 2;
    this.gyroGroup.add(this.ringY);

    const ringGeoZ = new THREE.TorusGeometry(290, 1.3, 8, 64);
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

    const satCount = 36;
    const satGeo = new THREE.BufferGeometry();
    const satPos = new Float32Array(satCount * 3);
    for (let i = 0; i < satCount; i++) {
      const radius = 240 + (i % 4) * 20;
      const angle = (i / satCount) * Math.PI * 2;
      satPos[i * 3] = Math.cos(angle) * radius;
      satPos[i * 3 + 1] = Math.sin(angle) * radius;
      satPos[i * 3 + 2] = (Math.sin(angle * 3)) * 35;
    }
    satGeo.setAttribute('position', new THREE.BufferAttribute(satPos, 3));

    const satTexture = this.createDotTexture();
    const satMat = new THREE.PointsMaterial({
      size: 5,
      map: satTexture,
      transparent: true,
      opacity: 0.22,
      color: 0xe0a82e,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.satellites = new THREE.Points(satGeo, satMat);
    this.gyroGroup.add(this.satellites);

    const isDesktop = window.innerWidth > 900;
    this.gyroGroup.position.set(isDesktop ? 30 : 0, isDesktop ? 0 : -20, 0);
    this.gyroGroup.rotation.set(0.25, 0.35, 0);

    this.scene.add(this.gyroGroup);
  }

  createDotTexture() {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, 'rgba(224, 168, 46, 0.9)');
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
      this.gyroGroup.position.x = isDesktop ? 30 : 0;
      this.gyroGroup.position.y = isDesktop ? 0 : -20;
    }
  }

  animate() {
    this.rafId = requestAnimationFrame(() => this.animate());

    if (this.targetScrollProgress > 0.45) {
      if (this.isVisible) {
        this.canvas.style.opacity = '0';
        this.isVisible = false;
      }
      return;
    } else {
      if (!this.isVisible) {
        this.canvas.style.opacity = '1';
        this.isVisible = true;
      }
    }

    const time = this.clock.getElapsedTime();

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.06;

    this.rotationInertia.x *= 0.92;
    this.rotationInertia.y *= 0.92;

    if (this.gyroGroup) {
      this.gyroGroup.rotation.x += this.rotationInertia.x + 0.002;
      this.gyroGroup.rotation.y += this.rotationInertia.y + 0.003;

      this.gyroGroup.rotation.x += (this.mouse.y * 0.3 - this.gyroGroup.rotation.x * 0.1) * 0.025;
      this.gyroGroup.rotation.y += (this.mouse.x * 0.3 - this.gyroGroup.rotation.y * 0.1) * 0.025;

      if (this.ringX) {
        this.ringX.rotation.x = time * 0.5 + this.scrollProgress * 3.0;
        this.ringX.rotation.y = Math.sin(time * 0.3) * 0.25;
      }
      if (this.ringY) {
        this.ringY.rotation.y = time * 0.6 + this.scrollProgress * 4.0;
        this.ringY.rotation.z = Math.cos(time * 0.4) * 0.2;
      }
      if (this.ringZ) {
        this.ringZ.rotation.z = time * 0.4 + this.scrollProgress * 5.0;
        this.ringZ.rotation.x = Math.sin(time * 0.5) * 0.28;
      }

      if (this.coreMesh) {
        const pulse = 1 + Math.sin(time * 1.5) * 0.03;
        this.coreMesh.scale.set(pulse, pulse, pulse);
        this.coreMesh.rotation.y = -time * 0.4;
      }
      if (this.wireMesh) {
        this.wireMesh.rotation.y = time * 0.25;
        this.wireMesh.rotation.x = time * 0.15;
      }

      if (this.satellites) {
        this.satellites.rotation.z = time * 0.5;
        this.satellites.rotation.y = time * 0.3;
      }

      if (this.camera) {
        this.camera.position.z = 420 + this.scrollProgress * 120;
        this.camera.position.y = -this.scrollProgress * 60;
        this.camera.lookAt(this.gyroGroup.position);
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
