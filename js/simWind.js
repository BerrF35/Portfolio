import { sound } from './audio.js';

export class WindSimulator {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.aoa = 5.5; // Angle of attack in degrees
    this.speed = 50; // m/s
    this.particles = [];
    this.particleCount = 200;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="wind-sim">
        <header class="wind-sim__header">
          <div class="wind-sim__title">
            <b>WINDSIM // BROWSER-BASED AERODYNAMICS &amp; CFD PLATFORM</b>
            <span>REDUCED-ORDER WIND SANDBOX &bull; LBM DETERMINISTIC LAB &bull; STREAMLINES &bull; SLICES</span>
          </div>
          <div class="wind-sim__actions">
            <a class="wind-live-btn" href="https://berrf35.github.io/Windsim/" target="_blank" rel="noreferrer">
              LAUNCH LIVE DEPLOYMENT (GITHUB PAGES) ↗
            </a>
          </div>
        </header>

        <div class="wind-sim__body">
          <div class="wind-sim__viewport">
            <canvas id="windCanvas"></canvas>
            <div class="wind-sim__stall" id="windStallNotice" hidden>BOUNDARY LAYER SEPARATION // STALL DETECTED</div>
          </div>

          <aside class="wind-sim__controls">
            <div class="wind-control-group">
              <label>ANGLE OF ATTACK (&alpha;): <b id="windAoaVal">+5.5&deg;</b></label>
              <input type="range" id="windAoaSlider" min="-12" max="22" step="0.5" value="5.5" />
            </div>

            <div class="wind-control-group">
              <label>FREE-STREAM VELOCITY (U&infin;): <b id="windSpeedVal">50 m/s</b></label>
              <input type="range" id="windSpeedSlider" min="10" max="120" step="1" value="50" />
            </div>

            <div class="wind-metrics">
              <div class="wind-metric-row"><span>REYNOLDS NUMBER (Re)</span><b>1.64 &times; 10<sup>6</sup></b></div>
              <div class="wind-metric-row"><span>LIFT COEFF (C<sub>L</sub>)</span><b id="windCl">0.628</b></div>
              <div class="wind-metric-row"><span>DRAG COEFF (C<sub>D</sub>)</span><b id="windCd">0.017</b></div>
              <div class="wind-metric-row"><span>L/D EFFICIENCY</span><b id="windLd">36.94</b></div>
              <div class="wind-metric-row"><span>DYNAMIC PRESSURE</span><b id="windPress">1.53 kPa</b></div>
            </div>

            <div class="wind-repo-meta">
              <div>&bull; Repository: <b>BerrF35/Windsim</b></div>
              <div>&bull; Primary Language: <b>JavaScript</b></div>
              <div>&bull; License: <b>MIT License</b></div>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#windCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.initParticles();
    this.bindEvents();
    this.resize();
    this.startLoop();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        speedMult: 0.85 + Math.random() * 0.35,
        life: Math.random() * 120,
        trail: [],
      });
    }
  }

  bindEvents() {
    const aoaSlider = this.container.querySelector('#windAoaSlider');
    const speedSlider = this.container.querySelector('#windSpeedSlider');

    aoaSlider?.addEventListener('input', (e) => {
      this.aoa = parseFloat(e.target.value);
      this.container.querySelector('#windAoaVal').textContent = `${this.aoa > 0 ? '+' : ''}${this.aoa.toFixed(1)}°`;
      this.updateMetrics();
      sound.tick(800 + this.aoa * 20);
    });

    speedSlider?.addEventListener('input', (e) => {
      this.speed = parseFloat(e.target.value);
      this.container.querySelector('#windSpeedVal').textContent = `${this.speed} m/s`;
      this.updateMetrics();
      sound.tick(600 + this.speed * 4);
    });

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
  }

  updateMetrics() {
    const rad = (this.aoa * Math.PI) / 180;
    const isStalled = this.aoa > 15 || this.aoa < -12;
    
    let cl = Math.sin(rad * 2) * 3.1;
    if (isStalled) cl *= 0.45;
    
    let cd = 0.008 + 0.04 * Math.pow(Math.sin(rad), 2);
    if (isStalled) cd += 0.12;

    const ld = cd > 0 ? Math.abs(cl / cd) : 0;
    const press = 0.5 * 1.225 * Math.pow(this.speed, 2) / 1000;

    const clEl = this.container.querySelector('#windCl');
    const cdEl = this.container.querySelector('#windCd');
    const ldEl = this.container.querySelector('#windLd');
    const pressEl = this.container.querySelector('#windPress');
    const stallNotice = this.container.querySelector('#windStallNotice');

    if (clEl) clEl.textContent = cl.toFixed(3);
    if (cdEl) cdEl.textContent = cd.toFixed(3);
    if (ldEl) ldEl.textContent = ld.toFixed(2);
    if (pressEl) pressEl.textContent = `${press.toFixed(2)} kPa`;

    if (stallNotice) {
      stallNotice.hidden = !isStalled;
    }
  }

  startLoop() {
    const loop = () => {
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w * 0.45;
    const cy = h * 0.5;
    const chord = w * 0.35;
    const aoaRad = (-this.aoa * Math.PI) / 180;
    const isStalled = this.aoa > 15 || this.aoa < -12;

    ctx.fillStyle = '#0a0d0b';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const simSpeed = (this.speed / 50) * 0.0065;

    this.particles.forEach((p) => {
      p.x += simSpeed * p.speedMult;
      p.life++;

      const px = p.x * w;
      const py = p.y * h;
      const dx = (px - cx) / chord;
      const dy = (py - cy) / chord;

      const distToAirfoil = Math.hypot(dx, dy);
      let vy = 0;
      let vx = 1;

      if (distToAirfoil < 0.65 && dx > -0.5 && dx < 0.8) {
        vy = Math.sin(aoaRad) * (0.8 - Math.abs(dx)) * 0.004;
        if (dy < 0) {
          vx = 1.35 + Math.abs(Math.sin(aoaRad));
        } else {
          vx = 0.85;
        }

        if (isStalled && dx > 0.1 && dy < 0.1) {
          vy += (Math.random() - 0.5) * 0.01;
          vx *= 0.3;
        }
      }

      p.y += vy;
      p.x += (vx - 1) * 0.003;

      if (p.x > 1.05 || p.y < -0.1 || p.y > 1.1 || p.life > 180) {
        p.x = -0.05;
        p.y = Math.random();
        p.life = 0;
        p.trail = [];
      }

      p.trail.unshift({ x: p.x * w, y: p.y * h });
      if (p.trail.length > 8) p.trail.pop();

      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }

        const color = vx > 1.2 ? '#00d2ff' : (vx < 0.8 ? '#ffd200' : '#b7df5b');
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    });

    // Render Airfoil Profile
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(aoaRad);

    ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const x = i / steps;
      const yt = 5 * 0.12 * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
      const px = (x - 0.3) * chord;
      const py = -yt * chord;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = steps; i >= 0; i--) {
      const x = i / steps;
      const yt = 5 * 0.12 * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
      const px = (x - 0.3) * chord;
      const py = yt * chord;
      ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fillStyle = '#1c201e';
    ctx.fill();
    ctx.strokeStyle = isStalled ? '#ff3344' : '#e8eae0';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
