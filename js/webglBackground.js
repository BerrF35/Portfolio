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
    this.innerCore = null;
    this.innerWire = null;
    this.ringX = null;
    this.ringY = null;
    this.ringZ = null;
    this.ringTicks = null;
    this.satellites = null;

    this.planetsGroup = null;
    this.planet1Orbit = null;
    this.planet1 = null;
    this.planet1Wire = null;
    this.planet1Core = null;
    this.planet1Moon = null;
    this.planet2Orbit = null;
    this.planet2 = null;
    this.planet2Wire = null;
    this.planet2Core = null;
    this.planet3Orbit = null;
    this.planet3 = null;
    this.planet3Wire = null;
    this.planet4Orbit = null;
    this.planet4 = null;
    this.planet4Wire = null;
    this.planet4Core = null;

    this.camPath = null;
    this.lookPath = null;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, isDragging: false, prevX: 0, prevY: 0 };
    this.rotationInertia = { x: 0, y: 0 };
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.clock = null;
    this.rafId = null;

    this.themeColors = {
      primary: new THREE.Color(0xd84536),
      secondary: new THREE.Color(0xe0a82e),
      accent: new THREE.Color(0xffffff),
      core: new THREE.Color(0x6e1a12)
    };

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 2500);
    this.camera.position.set(20, 0, 440);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(1);

    this.clock = new THREE.Clock();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xe0a82e, 1.8, 900);
    pointLight.position.set(140, 180, 220);
    this.scene.add(pointLight);

    const rimLight = new THREE.PointLight(0xd84536, 1.9, 850);
    rimLight.position.set(-160, -120, 160);
    this.scene.add(rimLight);

    this.buildCameraRails();
    this.buildGyroscope();
    this.buildPlanetarySystem();
    this.bindEvents();
    this.animate();
  }

  buildCameraRails() {
    this.camPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(20, 0, 440),
      new THREE.Vector3(65, 14, 385),
      new THREE.Vector3(135, 28, 310),
      new THREE.Vector3(190, 24, 230),
      new THREE.Vector3(150, 10, 145),
      new THREE.Vector3(60, -14, 118),
      new THREE.Vector3(-45, 18, 122),
      new THREE.Vector3(-85, -6, 135)
    ]);

    this.lookPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(6, 2, 0),
      new THREE.Vector3(16, 6, -5),
      new THREE.Vector3(20, 8, -12),
      new THREE.Vector3(12, 4, -8),
      new THREE.Vector3(2, -2, 0),
      new THREE.Vector3(-6, 4, 4),
      new THREE.Vector3(-4, 0, 0)
    ]);
  }

  buildGyroscope() {
    this.gyroGroup = new THREE.Group();

    const coreGeo = new THREE.DodecahedronGeometry(82, 0);
    const coreMat = new THREE.MeshPhongMaterial({
      color: this.themeColors.core,
      emissive: 0x48100a,
      shininess: 45,
      flatShading: true,
      transparent: true,
      opacity: 0.12
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.gyroGroup.add(this.coreMesh);

    const wireGeo = new THREE.DodecahedronGeometry(85, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    this.wireMesh = new THREE.Mesh(wireGeo, wireMat);
    this.gyroGroup.add(this.wireMesh);

    const innerGeo = new THREE.DodecahedronGeometry(50, 0);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0xd84536,
      emissive: 0x3a0d08,
      flatShading: true,
      transparent: true,
      opacity: 0.10
    });
    this.innerCore = new THREE.Mesh(innerGeo, innerMat);
    this.gyroGroup.add(this.innerCore);

    const innerWireGeo = new THREE.DodecahedronGeometry(52, 0);
    const innerWireMat = new THREE.MeshBasicMaterial({
      color: 0xf5c242,
      wireframe: true,
      transparent: true,
      opacity: 0.32
    });
    this.innerWire = new THREE.Mesh(innerWireGeo, innerWireMat);
    this.gyroGroup.add(this.innerWire);

    const centerLight = new THREE.PointLight(0xffbe42, 1.8, 400);
    this.gyroGroup.add(centerLight);

    const ringGeoX = new THREE.TorusGeometry(195, 1.4, 8, 64);
    const ringMatX = new THREE.MeshStandardMaterial({
      color: this.themeColors.primary,
      metalness: 0.5,
      roughness: 0.35,
      transparent: true,
      opacity: 0.24
    });
    this.ringX = new THREE.Mesh(ringGeoX, ringMatX);
    this.gyroGroup.add(this.ringX);

    const ringGeoY = new THREE.TorusGeometry(245, 2.2, 16, 80);
    const ringMatY = new THREE.MeshStandardMaterial({
      color: 0xf5c242,
      metalness: 0.7,
      roughness: 0.25,
      transparent: true,
      opacity: 0.35
    });
    this.ringY = new THREE.Mesh(ringGeoY, ringMatY);
    this.ringY.rotation.x = Math.PI / 2;

    const tickCount = 72;
    const tickPositions = new Float32Array(tickCount * 2 * 3);
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      const rInner = 245 - (isMajor ? 8 : 4);
      const rOuter = 245 + (isMajor ? 8 : 4);
      tickPositions[i * 6 + 0] = Math.cos(angle) * rInner;
      tickPositions[i * 6 + 1] = 0;
      tickPositions[i * 6 + 2] = Math.sin(angle) * rInner;
      tickPositions[i * 6 + 3] = Math.cos(angle) * rOuter;
      tickPositions[i * 6 + 4] = 0;
      tickPositions[i * 6 + 5] = Math.sin(angle) * rOuter;
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute('position', new THREE.BufferAttribute(tickPositions, 3));
    const tickMat = new THREE.LineBasicMaterial({
      color: 0xf5c242,
      transparent: true,
      opacity: 0.32
    });
    this.ringTicks = new THREE.LineSegments(tickGeo, tickMat);
    this.ringY.add(this.ringTicks);

    this.gyroGroup.add(this.ringY);

    const ringGeoZ = new THREE.TorusGeometry(295, 1.4, 8, 64);
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

    const satCount = 56;
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
      opacity: 0.3,
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

  buildPlanetarySystem() {
    this.planetsGroup = new THREE.Group();

    this.planet1Orbit = new THREE.Group();
    this.planet1Orbit.rotation.x = 0.32;
    this.planet1Orbit.rotation.z = 0.15;

    const r1 = 510;
    const orbit1Geo = new THREE.BufferGeometry();
    const orbit1Pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      orbit1Pts.push(Math.cos(a) * r1, 0, Math.sin(a) * r1);
    }
    orbit1Geo.setAttribute('position', new THREE.Float32BufferAttribute(orbit1Pts, 3));
    const orbitLineMat1 = new THREE.LineBasicMaterial({
      color: 0xd84536,
      transparent: true,
      opacity: 0.14
    });
    const orbit1Line = new THREE.Line(orbit1Geo, orbitLineMat1);
    this.planet1Orbit.add(orbit1Line);

    this.planet1 = new THREE.Group();
    const p1WireGeo = new THREE.DodecahedronGeometry(26, 0);
    const p1WireMat = new THREE.MeshBasicMaterial({
      color: 0xe0a82e,
      wireframe: true,
      transparent: true,
      opacity: 0.38
    });
    this.planet1Wire = new THREE.Mesh(p1WireGeo, p1WireMat);
    this.planet1.add(this.planet1Wire);

    const p1CoreGeo = new THREE.DodecahedronGeometry(25, 0);
    const p1CoreMat = new THREE.MeshPhongMaterial({
      color: 0xd84536,
      flatShading: true,
      transparent: true,
      opacity: 0.08
    });
    this.planet1Core = new THREE.Mesh(p1CoreGeo, p1CoreMat);
    this.planet1.add(this.planet1Core);

    const p1RingGeo = new THREE.TorusGeometry(38, 0.8, 6, 44);
    const p1RingMat = new THREE.MeshBasicMaterial({
      color: 0xe0a82e,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    const p1RingMesh = new THREE.Mesh(p1RingGeo, p1RingMat);
    p1RingMesh.rotation.x = Math.PI * 0.42;
    this.planet1.add(p1RingMesh);

    const p1MoonGeo = new THREE.DodecahedronGeometry(7, 0);
    const p1MoonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    this.planet1Moon = new THREE.Mesh(p1MoonGeo, p1MoonMat);
    this.planet1.add(this.planet1Moon);

    this.planet1.position.set(r1, 0, 0);
    this.planet1Orbit.add(this.planet1);
    this.planetsGroup.add(this.planet1Orbit);

    this.planet2Orbit = new THREE.Group();
    this.planet2Orbit.rotation.x = -0.45;
    this.planet2Orbit.rotation.y = 0.25;

    const r2 = 660;
    const orbit2Geo = new THREE.BufferGeometry();
    const orbit2Pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      orbit2Pts.push(Math.cos(a) * r2, 0, Math.sin(a) * r2);
    }
    orbit2Geo.setAttribute('position', new THREE.Float32BufferAttribute(orbit2Pts, 3));
    const orbit2LineMat = new THREE.LineBasicMaterial({
      color: 0x6e8ca8,
      transparent: true,
      opacity: 0.12
    });
    const orbit2Line = new THREE.Line(orbit2Geo, orbit2LineMat);
    this.planet2Orbit.add(orbit2Line);

    this.planet2 = new THREE.Group();
    const p2WireGeo = new THREE.DodecahedronGeometry(20, 0);
    const p2WireMat = new THREE.MeshBasicMaterial({
      color: 0x8da4be,
      wireframe: true,
      transparent: true,
      opacity: 0.32
    });
    this.planet2Wire = new THREE.Mesh(p2WireGeo, p2WireMat);
    this.planet2.add(this.planet2Wire);

    const p2CoreGeo = new THREE.DodecahedronGeometry(19, 0);
    const p2CoreMat = new THREE.MeshPhongMaterial({
      color: 0x6e8ca8,
      flatShading: true,
      transparent: true,
      opacity: 0.06
    });
    this.planet2Core = new THREE.Mesh(p2CoreGeo, p2CoreMat);
    this.planet2.add(this.planet2Core);

    this.planet2.position.set(r2, 0, 0);
    this.planet2Orbit.add(this.planet2);
    this.planetsGroup.add(this.planet2Orbit);

    this.planet3Orbit = new THREE.Group();
    this.planet3Orbit.rotation.x = 0.58;
    this.planet3Orbit.rotation.y = -0.35;

    const r3 = 390;
    const orbit3Geo = new THREE.BufferGeometry();
    const orbit3Pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      orbit3Pts.push(Math.cos(a) * r3, 0, Math.sin(a) * r3);
    }
    orbit3Geo.setAttribute('position', new THREE.Float32BufferAttribute(orbit3Pts, 3));
    const orbit3Line = new THREE.Line(orbit3Geo, new THREE.LineBasicMaterial({
      color: 0xf5c242,
      transparent: true,
      opacity: 0.14
    }));
    this.planet3Orbit.add(orbit3Line);

    this.planet3 = new THREE.Group();
    const p3WireGeo = new THREE.DodecahedronGeometry(14, 0);
    const p3WireMat = new THREE.MeshBasicMaterial({
      color: 0xf5c242,
      wireframe: true,
      transparent: true,
      opacity: 0.42
    });
    this.planet3Wire = new THREE.Mesh(p3WireGeo, p3WireMat);
    this.planet3.add(this.planet3Wire);

    const p3HaloGeo = new THREE.TorusGeometry(22, 0.6, 6, 36);
    const p3HaloMat = new THREE.MeshBasicMaterial({
      color: 0xffe072,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    const p3Halo = new THREE.Mesh(p3HaloGeo, p3HaloMat);
    p3Halo.rotation.x = Math.PI / 2;
    this.planet3.add(p3Halo);

    this.planet3.position.set(r3, 0, 0);
    this.planet3Orbit.add(this.planet3);
    this.planetsGroup.add(this.planet3Orbit);

    this.planet4Orbit = new THREE.Group();
    this.planet4Orbit.rotation.x = -0.22;
    this.planet4Orbit.rotation.z = -0.40;

    const r4 = 820;
    this.planet4 = new THREE.Group();
    const p4WireGeo = new THREE.DodecahedronGeometry(18, 0);
    const p4WireMat = new THREE.MeshBasicMaterial({
      color: 0xd84536,
      wireframe: true,
      transparent: true,
      opacity: 0.34
    });
    this.planet4Wire = new THREE.Mesh(p4WireGeo, p4WireMat);
    this.planet4.add(this.planet4Wire);

    const p4CoreGeo = new THREE.DodecahedronGeometry(17, 0);
    const p4CoreMat = new THREE.MeshPhongMaterial({
      color: 0x8a2418,
      flatShading: true,
      transparent: true,
      opacity: 0.06
    });
    this.planet4Core = new THREE.Mesh(p4CoreGeo, p4CoreMat);
    this.planet4.add(this.planet4Core);

    this.planet4.position.set(r4, 0, 0);
    this.planet4Orbit.add(this.planet4);
    this.planetsGroup.add(this.planet4Orbit);

    this.scene.add(this.planetsGroup);
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

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    this.targetScrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

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
      if (this.innerCore) {
        this.innerCore.rotation.y = time * 0.35 - p * 1.2;
        this.innerCore.rotation.z = -time * 0.22;
      }
      if (this.innerWire) {
        this.innerWire.rotation.y = time * 0.35 - p * 1.2;
        this.innerWire.rotation.z = -time * 0.22;
      }

      if (this.satellites) {
        this.satellites.rotation.y = time * 0.3 + p * 2.5;
        this.satellites.rotation.z = Math.sin(time * 0.2) * 0.15;
      }
    }

    if (this.planetsGroup) {
      if (this.planet1Orbit) this.planet1Orbit.rotation.y = time * 0.045 + p * 0.4;
      if (this.planet1Wire) {
        this.planet1Wire.rotation.x = time * 0.3;
        this.planet1Wire.rotation.y = time * 0.25;
      }
      if (this.planet1Core) {
        this.planet1Core.rotation.x = time * 0.3;
        this.planet1Core.rotation.y = time * 0.25;
      }
      if (this.planet1Moon) {
        const ma = time * 1.6;
        this.planet1Moon.position.set(Math.cos(ma) * 52, Math.sin(ma * 0.8) * 12, Math.sin(ma) * 52);
        this.planet1Moon.rotation.y = time * 0.6;
      }
      if (this.planet2Orbit) this.planet2Orbit.rotation.y = -time * 0.032 - p * 0.35;
      if (this.planet2Wire) {
        this.planet2Wire.rotation.y = -time * 0.28;
        this.planet2Wire.rotation.z = time * 0.2;
      }
      if (this.planet3Orbit) this.planet3Orbit.rotation.y = time * 0.075 + p * 0.55;
      if (this.planet3Wire) {
        this.planet3Wire.rotation.x = time * 0.4;
        this.planet3Wire.rotation.y = time * 0.35;
      }
      if (this.planet4Orbit) this.planet4Orbit.rotation.y = time * 0.018 + p * 0.2;
      if (this.planet4Wire) {
        this.planet4Wire.rotation.y = time * 0.22;
        this.planet4Wire.rotation.x = time * 0.15;
      }
    }

    if (this.camera && this.camPath && this.lookPath) {
      const baseCam = this.camPath.getPoint(p);
      const baseLook = this.lookPath.getPoint(p);

      const targetCamX = baseCam.x * distScale;
      const targetCamY = baseCam.y * distScale;
      const targetCamZ = baseCam.z * distScale;

      this.camera.position.x += (targetCamX + this.mouse.x * 20 - this.camera.position.x) * 0.08;
      this.camera.position.y += (targetCamY + this.mouse.y * 16 - this.camera.position.y) * 0.08;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;

      this.camera.lookAt(baseLook);
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
