export class EventBadge3D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cardGroup = null;
    this.lanyardLine = null;
    this.lanyardCurve = null;

    this.cardPos = { x: 0, y: -0.1, z: 0 };
    this.cardVel = { x: 0, y: 0, z: 0 };
    this.cardRot = { x: 0, y: 0, z: 0 };
    this.cardRotVel = { x: 0, y: 0, z: 0 };

    this.anchor = { x: 0, y: 2.8, z: 0 };
    this.restLength = 1.3;

    this.isDragging = false;
    this.dragPlane = null;
    this.raycaster = null;
    this.mouse = { x: 0, y: 0 };
    this.dragOffset = { x: 0, y: 0, z: 0 };

    this.animId = null;
    this.boundAnimate = this.animate.bind(this);
    this.boundResize = this.onResize.bind(this);
    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') return;

    const width = this.canvas.clientWidth || 800;
    const height = this.canvas.clientHeight || 520;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    this.camera.position.set(0, 0, 6.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.raycaster = new THREE.Raycaster();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.setupLighting();
    this.buildLanyard();
    this.loadModel();

    window.addEventListener('resize', this.boundResize);
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);

    this.animate();
  }

  setupLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 2.0);
    this.scene.add(amb);

    const dir1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dir1.position.set(5, 6, 5);
    this.scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xd84536, 1.2);
    dir2.position.set(-5, -2, 3);
    this.scene.add(dir2);

    const dir3 = new THREE.DirectionalLight(0xf59e0b, 1.0);
    dir3.position.set(0, 4, 4);
    this.scene.add(dir3);
  }

  buildLanyard() {
    this.cardGroup = new THREE.Group();
    this.cardGroup.position.set(this.cardPos.x, this.cardPos.y, this.cardPos.z);
    this.scene.add(this.cardGroup);

    const bandTexture = new THREE.TextureLoader().load('assets/models/band.jpg');
    bandTexture.wrapS = THREE.RepeatWrapping;
    bandTexture.wrapT = THREE.RepeatWrapping;
    bandTexture.repeat.set(1, 2);

    const p0 = new THREE.Vector3(this.anchor.x, this.anchor.y, this.anchor.z);
    const p3 = new THREE.Vector3(this.cardPos.x, this.cardPos.y + 1.6, this.cardPos.z);
    const curve = new THREE.CatmullRomCurve3([
      p0,
      new THREE.Vector3(0, 2.3, 0.05),
      new THREE.Vector3(0, 1.9, 0),
      p3
    ]);
    this.lanyardCurve = curve;

    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.045, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      map: bandTexture,
      roughness: 0.5,
      metalness: 0.1
    });
    this.lanyardLine = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(this.lanyardLine);
  }

  loadModel() {
    if (typeof THREE.GLTFLoader === 'undefined') return;
    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/tag.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(2.4, 2.4, 2.4);
      model.position.set(0, -1.35, -0.05);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = 0.25;
            child.material.metalness = 0.2;
            if (child.name === 'clip' || child.name === 'clamp') {
              child.material.metalness = 0.85;
              child.material.roughness = 0.15;
            }
          }
        }
      });

      this.cardGroup.add(model);
    });
  }

  onResize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  onPointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cardGroup.children, true);

    if (intersects.length > 0) {
      this.isDragging = true;
      const targetPoint = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, targetPoint);
      this.dragOffset.x = this.cardPos.x - targetPoint.x;
      this.dragOffset.y = this.cardPos.y - targetPoint.y;
      this.canvas.setPointerCapture(e.pointerId);
    }
  }

  onPointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isDragging) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const targetPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.dragPlane, targetPoint)) {
        const destX = targetPoint.x + this.dragOffset.x;
        const destY = targetPoint.y + this.dragOffset.y;
        this.cardVel.x = (destX - this.cardPos.x) * 0.45;
        this.cardVel.y = (destY - this.cardPos.y) * 0.45;
        this.cardPos.x = destX;
        this.cardPos.y = destY;
      }
    }
  }

  onPointerUp(e) {
    if (this.isDragging) {
      this.isDragging = false;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  }

  updatePhysics(delta) {
    const topAttachmentY = this.cardPos.y + 1.6;
    const dx = this.cardPos.x - this.anchor.x;
    const dy = topAttachmentY - this.anchor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!this.isDragging) {
      const gravity = -14.0;
      this.cardVel.y += gravity * delta;

      if (dist > this.restLength) {
        const tension = (dist - this.restLength) * 42.0;
        const nx = dx / dist;
        const ny = dy / dist;
        this.cardVel.x -= nx * tension * delta;
        this.cardVel.y -= ny * tension * delta;
      }

      this.cardVel.x *= 0.95;
      this.cardVel.y *= 0.95;
      this.cardVel.z *= 0.95;

      this.cardPos.x += this.cardVel.x * delta;
      this.cardPos.y += this.cardVel.y * delta;
      this.cardPos.z += this.cardVel.z * delta;

      const mouseInfluenceX = this.mouse.x * 0.35;
      this.cardVel.x += (mouseInfluenceX - this.cardPos.x) * 1.2 * delta;
    }

    const angleTarget = -Math.atan2(dx, this.anchor.y - topAttachmentY);
    const rotTargetY = Math.sin(Date.now() * 0.0012) * 0.18 + (this.mouse.x * 0.3);
    const rotTargetX = -(this.cardVel.y * 0.08) + (this.mouse.y * 0.15);

    this.cardRotVel.z += (angleTarget - this.cardRot.z) * 18.0 * delta;
    this.cardRotVel.y += (rotTargetY - this.cardRot.y) * 12.0 * delta;
    this.cardRotVel.x += (rotTargetX - this.cardRot.x) * 12.0 * delta;

    this.cardRotVel.z *= 0.91;
    this.cardRotVel.y *= 0.91;
    this.cardRotVel.x *= 0.91;

    this.cardRot.z += this.cardRotVel.z * delta;
    this.cardRot.y += this.cardRotVel.y * delta;
    this.cardRot.x += this.cardRotVel.x * delta;

    this.cardGroup.position.set(this.cardPos.x, this.cardPos.y, this.cardPos.z);
    this.cardGroup.rotation.set(this.cardRot.x, this.cardRot.y, this.cardRot.z);

    if (this.lanyardLine) {
      const p0 = new THREE.Vector3(this.anchor.x, this.anchor.y, this.anchor.z);
      const p3 = new THREE.Vector3(this.cardPos.x, this.cardPos.y + 1.6, this.cardPos.z);
      const midY = (p0.y + p3.y) / 2;
      const sagX = (p0.x + p3.x) / 2 + (dx * 0.08);
      const p1 = new THREE.Vector3(sagX - 0.08, midY + 0.15, 0.04);
      const p2 = new THREE.Vector3(sagX + 0.08, midY - 0.15, 0.02);

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
      const newGeo = new THREE.TubeGeometry(curve, 28, 0.045, 8, false);
      this.lanyardLine.geometry.dispose();
      this.lanyardLine.geometry = newGeo;
    }
  }

  animate() {
    this.animId = requestAnimationFrame(this.boundAnimate);
    this.updatePhysics(0.016);
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.boundResize);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    }
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    if (this.renderer) this.renderer.dispose();
  }
}
