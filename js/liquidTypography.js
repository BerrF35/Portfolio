/**
 * WebGL Liquid Distortion Typography Effect for JAIJITESH SURYAPRAKASH
 * Fluid Flowmap simulation with high-contrast monochrome ink/marble blotches
 * and chromatic aberration (RGB velocity displacement) interacting with mouse.
 */

export class LiquidTypography {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('introTitleContainer');
    this.canvas = options.canvas || document.getElementById('introLiquidCanvas');
    this.enabled = true;
    this.isRunning = false;
    this.rafId = null;

    // Mouse and velocity tracking
    this.mouse = null;
    this.velocity = null;
    this.lastMouse = null;
    this.lastTime = 0;
    this.aspect = 1;
    this.ambientTime = 0;

    this.onResize = this.resize.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerTouch = this.handlePointerTouch.bind(this);

    this.init();
  }

  async init() {
    if (!this.canvas) return;

    // Wait for OGL if loading from CDN or global
    const ogl = window.ogl;
    if (!ogl) {
      setTimeout(() => this.init(), 100);
      return;
    }

    try {
      this.renderer = new ogl.Renderer({
        canvas: this.canvas,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });

      this.gl = this.renderer.gl;
      this.gl.clearColor(0, 0, 0, 0);

      this.mouse = new ogl.Vec2(-1, -1);
      this.velocity = new ogl.Vec2(0, 0);
      this.lastMouse = new ogl.Vec2(-1, -1);

      // Initialize Flowmap for fluid simulation
      this.flowmap = new ogl.Flowmap(this.gl, {
        falloff: 0.38,
        dissipation: 0.94,
        alpha: 0.65
      });

      // Fullscreen Triangle Geometry
      this.geometry = new ogl.Geometry(this.gl, {
        position: {
          size: 2,
          data: new Float32Array([-1, -1, 3, -1, -1, 3])
        },
        uv: {
          size: 2,
          data: new Float32Array([0, 0, 2, 0, 0, 2])
        }
      });

      // Generate High-Contrast Monochrome Fluid Marble / Ink Blotch Texture
      this.texture = new ogl.Texture(this.gl, {
        minFilter: this.gl.LINEAR,
        magFilter: this.gl.LINEAR,
        wrapS: this.gl.REPEAT,
        wrapT: this.gl.REPEAT
      });

      this.generateMonochromeTexture();

      // Liquid Distortion Shaders
      const vertex = /* glsl */ `
        attribute vec2 uv;
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fragment = /* glsl */ `
        precision highp float;
        precision highp int;
        uniform sampler2D tWater;
        uniform sampler2D tFlow;
        uniform float uTime;
        varying vec2 vUv;
        uniform vec4 res;

        void main() {
          // R and G values are velocity in x and y; B is length
          vec3 flow = texture2D(tFlow, vUv).rgb;

          vec2 uv = gl_FragCoord.xy / res.xy;
          vec2 centered = (uv - vec2(0.5)) * res.zw + vec2(0.5);

          // Triple chromatic displacement
          vec2 myUV1 = centered - flow.xy * (0.16 * 1.3);
          vec2 myUV2 = centered - flow.xy * (0.13 * 1.3);
          vec2 myUV3 = centered - flow.xy * (0.10 * 1.5);

          // Subtle ambient liquid swirl
          vec2 drift = vec2(
            sin(uTime * 0.4 + centered.y * 3.0),
            cos(uTime * 0.35 + centered.x * 3.0)
          ) * 0.012;

          myUV1 += drift;
          myUV2 += drift * 0.9;
          myUV3 += drift * 0.8;

          vec3 tex1 = texture2D(tWater, myUV1).rgb;
          vec3 tex2 = texture2D(tWater, myUV2).rgb;
          vec3 tex3 = texture2D(tWater, myUV3).rgb;

          vec3 col = vec3(tex1.r, tex2.g, tex3.b);

          // Subtle velocity shear highlight on rapid pointer moves
          float vel = length(flow.xy);
          col += vel * 0.55 * vec3(0.28, 0.78, 0.98);

          gl_FragColor = vec4(col, 1.0);
        }
      `;

      this.program = new ogl.Program(this.gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
          tWater: { value: this.texture },
          res: { value: new ogl.Vec4(1, 1, 1, 1) },
          tFlow: this.flowmap.uniform
        }
      });

      this.mesh = new ogl.Mesh(this.gl, {
        geometry: this.geometry,
        program: this.program
      });

      this.bindEvents();
      this.resize();
      this.start();

      // Trigger initial welcoming fluid ripple across the name
      setTimeout(() => {
        this.injectImpulse(0.4, 0.5, 0.45, -0.3);
      }, 250);
    } catch (err) {
      console.error('Failed to initialize LiquidTypography:', err);
    }
  }

  generateMonochromeTexture() {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base crisp white & silver-gray fluid background
    ctx.fillStyle = '#f5f7fa';
    ctx.fillRect(0, 0, size, size);

    // Multi-octave organic blotches and marble ink veins
    const numBlotches = 64;
    for (let i = 0; i < numBlotches; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 50 + Math.random() * 260;
      
      const grad = ctx.createRadialGradient(x, y, radius * 0.05, x, y, radius);
      const isBlack = Math.random() > 0.45;
      
      if (isBlack) {
        // Deep velvety black fluid ink swirl
        const alpha = 0.88 + Math.random() * 0.12;
        grad.addColorStop(0, `rgba(5, 8, 12, ${alpha})`);
        grad.addColorStop(0.4, `rgba(22, 28, 38, ${alpha * 0.75})`);
        grad.addColorStop(0.75, `rgba(80, 95, 115, ${alpha * 0.3})`);
        grad.addColorStop(1, 'rgba(245, 247, 250, 0)');
      } else {
        // Pure crisp white highlights
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.5, 'rgba(235, 242, 255, 0.9)');
        grad.addColorStop(1, 'rgba(245, 247, 250, 0)');
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI * 2);
      ctx.scale(1 + Math.random() * 2.0, 0.35 + Math.random() * 0.8);
      ctx.translate(-x, -y);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // High-frequency tactile noise overlay
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    this.texture.image = canvas;
  }

  resize() {
    if (!this.renderer || !this.gl || !this.canvas) return;

    const container = this.container || this.canvas.parentElement;
    const rect = container ? container.getBoundingClientRect() : this.canvas.getBoundingClientRect();
    const width = Math.max(300, Math.round(rect.width) || 1050);
    const height = Math.max(100, Math.round(rect.height) || 280);

    this.renderer.setSize(width, height);
    this.aspect = width / height;

    const imgAspect = 1.0;
    let a1 = 1, a2 = 1;
    if (height / width < imgAspect) {
      a1 = 1;
      a2 = (height / width) / imgAspect;
    } else {
      a1 = (width / height) * imgAspect;
      a2 = 1;
    }

    if (this.program?.uniforms?.res) {
      this.program.uniforms.res.value.set(width, height, a1, a2);
    }
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('touchmove', this.onPointerTouch, { passive: true });
  }

  handlePointerMove(e) {
    if (!this.enabled || !this.gl) return;
    this.updateMouseCoords(e.clientX, e.clientY);
  }

  handlePointerTouch(e) {
    if (!this.enabled || !this.gl || !e.touches || !e.touches[0]) return;
    this.updateMouseCoords(e.touches[0].clientX, e.touches[0].clientY);
  }

  updateMouseCoords(clientX, clientY) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Normalized coordinates (0 to 1, y flipped) relative to the typography canvas
    const normX = Math.max(0, Math.min(1, relX / rect.width));
    const normY = Math.max(0, Math.min(1, 1.0 - (relY / rect.height)));

    this.mouse.set(normX, normY);

    const time = performance.now();
    if (!this.lastTime || this.lastMouse.x < 0) {
      this.lastTime = time;
      this.lastMouse.set(relX, relY);
      return;
    }

    const deltaX = (relX - this.lastMouse.x) / rect.width;
    const deltaY = (relY - this.lastMouse.y) / rect.height;
    this.lastMouse.set(relX, relY);

    const delta = Math.max(10.0, time - this.lastTime);
    this.lastTime = time;

    this.velocity.x = (deltaX / delta) * 16.0;
    this.velocity.y = (deltaY / delta) * 16.0;
    this.velocity.needsUpdate = true;
  }

  injectImpulse(x, y, vx, vy) {
    if (!this.flowmap || !this.mouse) return;
    this.mouse.set(x, y);
    this.velocity.set(vx, vy);
    this.velocity.needsUpdate = true;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate(this.lastTime);
  }

  pause() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  animate(time) {
    if (!this.isRunning) return;
    this.rafId = requestAnimationFrame(this.animate.bind(this));

    // Ambient swirl pulse if idle
    this.ambientTime += 0.016;
    if (!this.velocity.needsUpdate) {
      // Gentle ambient drift across typography
      const autoX = 0.45 + Math.sin(this.ambientTime * 0.7) * 0.35;
      const autoY = 0.5 + Math.cos(this.ambientTime * 0.6) * 0.25;
      this.mouse.set(autoX, autoY);
      this.velocity.set(
        Math.cos(this.ambientTime * 0.9) * 0.025,
        Math.sin(this.ambientTime * 0.8) * 0.025
      );
    } else {
      this.velocity.needsUpdate = false;
    }

    // Update flowmap
    this.flowmap.aspect = this.aspect;
    this.flowmap.mouse.copy(this.mouse);
    this.flowmap.velocity.lerp(this.velocity, this.velocity.len ? 0.18 : 0.09);
    this.flowmap.update();

    this.program.uniforms.uTime.value = time * 0.001;
    this.renderer.render({ scene: this.mesh });
  }

  destroy() {
    this.pause();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('touchmove', this.onPointerTouch);
  }
}
