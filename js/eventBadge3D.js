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

    this.cardPos = { x: 0, y: -0.2, z: 0 };
    this.cardVel = { x: 0, y: 0, z: 0 };
    this.cardRot = { x: 0, y: 0, z: 0 };
    this.cardRotVel = { x: 0, y: 0, z: 0 };

    this.anchor = { x: 0, y: 2.8, z: 0 };
    this.restLength = 3.0;

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

    const width = this.canvas.clientWidth || 380;
    const height = this.canvas.clientHeight || 440;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    this.camera.position.set(0, 0.4, 7.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.raycaster = new THREE.Raycaster();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.setupLighting();
    this.buildBadge();

    window.addEventListener('resize', this.boundResize);
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);

    this.animate();
  }

  setupLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(amb);

    const dir1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dir1.position.set(4, 5, 4);
    this.scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xd84536, 1.8);
    dir2.position.set(-4, -2, 2);
    this.scene.add(dir2);

    const dir3 = new THREE.DirectionalLight(0xf59e0b, 1.2);
    dir3.position.set(0, -4, 3);
    this.scene.add(dir3);
  }

  createBadgeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1536;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 1024, 1536);
    grad.addColorStop(0, '#161922');
    grad.addColorStop(0.5, '#0c0f15');
    grad.addColorStop(1, '#1b1214');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1536);

    ctx.strokeStyle = 'rgba(216, 69, 54, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 40; x < 1024; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1536);
      ctx.stroke();
    }
    for (let y = 40; y < 1536; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    const holo = ctx.createLinearGradient(0, 0, 1024, 0);
    holo.addColorStop(0, '#d84536');
    holo.addColorStop(0.35, '#f59e0b');
    holo.addColorStop(0.7, '#9c261b');
    holo.addColorStop(1, '#ffc837');
    ctx.fillStyle = holo;
    ctx.fillRect(40, 40, 944, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('[ ACCESS CREDENTIAL - 2026 ]', 70, 100);

    ctx.fillStyle = '#d84536';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('SECURITY STATUS: AUTHORIZED', 70, 190);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('JAIJITESH', 70, 270);
    ctx.fillText('SURYAPRAKASH', 70, 340);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('SYSTEMS & AUTONOMOUS ENGINEERING', 70, 400);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 430);
    ctx.lineTo(954, 430);
    ctx.stroke();

    ctx.fillStyle = '#1e2430';
    ctx.fillRect(70, 470, 440, 520);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'assets/images/profile/portrait_full_body.jpg';
    img.onload = () => {
      ctx.drawImage(img, 72, 472, 436, 516);
      this.badgeTexture.needsUpdate = true;
    };

    ctx.fillStyle = '#e0a82e';
    ctx.fillRect(550, 470, 140, 110);
    ctx.fillStyle = '#8a6514';
    ctx.fillRect(560, 480, 120, 90);
    ctx.strokeStyle = '#ffe394';
    ctx.lineWidth = 2;
    ctx.strokeRect(580, 500, 80, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px monospace';
    ctx.fillText('AFFILIATION:', 550, 640);
    ctx.fillStyle = '#d84536';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('VIT VELLORE', 550, 680);

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px monospace';
    ctx.fillText('SPECIALIZATION:', 550, 750);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('AUTONOMOUS ROBOTICS', 550, 790);

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px monospace';
    ctx.fillText('FIRMWARE & KERNELS:', 550, 860);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('ROS 2, GLSL, RTOS', 550, 900);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText('TELEMETRY ID: JIT-8849-AUTH-9', 70, 1050);

    ctx.fillStyle = '#ffffff';
    for (let bx = 70; bx < 954; bx += 8) {
      const w = (bx % 16 === 0) ? 5 : (bx % 24 === 0) ? 2 : 4;
      ctx.fillRect(bx, 1090, w, 90);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '18px monospace';
    ctx.fillText('* JAIJITESH.OS - CERTIFIED CREDENTIAL HARDWARE *', 70, 1220);

    this.badgeTexture = new THREE.CanvasTexture(canvas);
    this.badgeTexture.generateMipmaps = true;
    this.badgeTexture.minFilter = THREE.LinearMipmapLinearFilter;
    return this.badgeTexture;
  }

  buildBadge() {
    this.cardGroup = new THREE.Group();

    const cardTex = this.createBadgeTexture();

    const cardGeo = new THREE.BoxGeometry(2.0, 3.0, 0.04);
    const matFront = new THREE.MeshPhysicalMaterial({
      map: cardTex,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15
    });

    const matBack = new THREE.MeshStandardMaterial({
      color: 0x12141a,
      roughness: 0.4,
      metalness: 0.2
    });

    const matSides = new THREE.MeshStandardMaterial({
      color: 0x242832,
      roughness: 0.5,
      metalness: 0.6
    });

    const cardMesh = new THREE.Mesh(cardGeo, [
      matSides, matSides, matSides, matSides, matFront, matBack
    ]);
    this.cardGroup.add(cardMesh);

    const clipGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 16);
    const clipMat = new THREE.MeshStandardMaterial({
      color: 0xd84536,
      roughness: 0.3,
      metalness: 0.8
    });
    const clipMesh = new THREE.Mesh(clipGeo, clipMat);
    clipMesh.rotation.z = Math.PI / 2;
    clipMesh.position.set(0, 1.55, 0);
    this.cardGroup.add(clipMesh);

    const ringGeo = new THREE.TorusGeometry(0.14, 0.03, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 1.7, 0);
    this.cardGroup.add(ringMesh);

    this.cardGroup.position.set(this.cardPos.x, this.cardPos.y, this.cardPos.z);
    this.scene.add(this.cardGroup);

    const curvePoints = [
      new THREE.Vector3(this.anchor.x, this.anchor.y, this.anchor.z),
      new THREE.Vector3(0, 2.2, 0.1),
      new THREE.Vector3(0, 1.8, 0),
      new THREE.Vector3(this.cardPos.x, this.cardPos.y + 1.7, this.cardPos.z)
    ];
    this.lanyardCurve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(this.lanyardCurve, 32, 0.035, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x9c261b,
      roughness: 0.6,
      metalness: 0.1
    });
    this.lanyardLine = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(this.lanyardLine);
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
      this.dragOffset.z = 0;
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
    const topAttachmentY = this.cardPos.y + 1.7;
    const dx = this.cardPos.x - this.anchor.x;
    const dy = topAttachmentY - this.anchor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!this.isDragging) {
      const gravity = -14.0;
      this.cardVel.y += gravity * delta;

      if (dist > this.restLength) {
        const tension = (dist - this.restLength) * 38.0;
        const nx = dx / dist;
        const ny = dy / dist;
        this.cardVel.x -= nx * tension * delta;
        this.cardVel.y -= ny * tension * delta;
      }

      this.cardVel.x *= 0.96;
      this.cardVel.y *= 0.96;
      this.cardVel.z *= 0.96;

      this.cardPos.x += this.cardVel.x * delta;
      this.cardPos.y += this.cardVel.y * delta;
      this.cardPos.z += this.cardVel.z * delta;

      const mouseInfluenceX = this.mouse.x * 0.4;
      this.cardVel.x += (mouseInfluenceX - this.cardPos.x) * 1.5 * delta;
    }

    const angleTarget = -Math.atan2(dx, this.anchor.y - topAttachmentY);
    const rotTargetY = Math.sin(Date.now() * 0.001) * 0.15 + (this.mouse.x * 0.35);
    const rotTargetX = -(this.cardVel.y * 0.08) + (this.mouse.y * 0.2);

    this.cardRotVel.z += (angleTarget - this.cardRot.z) * 18.0 * delta;
    this.cardRotVel.y += (rotTargetY - this.cardRot.y) * 12.0 * delta;
    this.cardRotVel.x += (rotTargetX - this.cardRot.x) * 12.0 * delta;

    this.cardRotVel.z *= 0.92;
    this.cardRotVel.y *= 0.92;
    this.cardRotVel.x *= 0.92;

    this.cardRot.z += this.cardRotVel.z * delta;
    this.cardRot.y += this.cardRotVel.y * delta;
    this.cardRot.x += this.cardRotVel.x * delta;

    this.cardGroup.position.set(this.cardPos.x, this.cardPos.y, this.cardPos.z);
    this.cardGroup.rotation.set(this.cardRot.x, this.cardRot.y, this.cardRot.z);

    if (this.lanyardLine) {
      const p0 = new THREE.Vector3(this.anchor.x, this.anchor.y, this.anchor.z);
      const p3 = new THREE.Vector3(this.cardPos.x, this.cardPos.y + 1.7, this.cardPos.z);
      const midY = (p0.y + p3.y) / 2;
      const sagX = (p0.x + p3.x) / 2 + (dx * 0.1);
      const p1 = new THREE.Vector3(sagX - 0.1, midY + 0.2, 0.05);
      const p2 = new THREE.Vector3(sagX + 0.1, midY - 0.2, 0.02);

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
      const newGeo = new THREE.TubeGeometry(curve, 28, 0.035, 8, false);
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
