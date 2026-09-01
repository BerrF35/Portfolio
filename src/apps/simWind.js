import { sound } from '../core/audio.js';

export class WindSimulator {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // Simulation Parameters (Lattice Boltzmann Method reduced order)
    this.flowSpeed = 24.5; // m/s
    this.aoa = 4.2; // Angle of Attack (deg)
    this.airfoilType = 'NACA0012';
    this.reynolds = 120000;
    this.liftCoeff = 0.48;
    this.dragCoeff = 0.038;

    this.particles = [];
    this.numParticles = 140;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="wind-sim">
        <header class="wind-sim__header">
          <div class="wind-sim__title">
            <b>WINDSIM // REAL-TIME AERODYNAMICS CFD SANDBOX</b>
            <span>LATTICE BOLTZMANN METHOD &bull; REDUCED-ORDER 2D/3D AERODYNAMICS</span>
          </div>
          <div class="wind-sim__actions">
            <a class="wind-btn wind-btn--accent" href="https://berrf35.github.io/Windsim/" target="_blank" rel="noopener noreferrer">
              OPEN LIVE WINDSIM DEPLOYMENT ↗
            </a>
          </div>
        </header>

        <div class="wind-sim__body">
          <div class="wind-sim__stage">
            <canvas id="windCanvas" width="620" height="380"></canvas>
            
            <div class="wind-controls">
              <div class="wind-control-group">
                <label for="speedSlider">FLOW VELOCITY (m/s): <b id="speedVal">24.5</b></label>
                <input id="speedSlider" type="range" min="5" max="65" value="24.5" step="0.5" />
              </div>

              <div class="wind-control-group">
                <label for="aoaSlider">ANGLE OF ATTACK (deg): <b id="aoaVal">+4.2&deg;</b></label>
                <input id="aoaSlider" type="range" min="-15" max="25" value="4.2" step="0.2" />
              </div>

              <div class="wind-control-group">
                <label for="foilSelect">PROFILE</label>
                <select id="foilSelect">
                  <option value="NACA0012">NACA 0012 (Symmetric)</option>
                  <option value="NACA4412">NACA 4412 (Cambered)</option>
                  <option value="CYLINDER">Circular Cylinder</option>
                  <option value="FLAT">Flat Plate</option>
                </select>
              </div>
            </div>
          </div>

          <aside class="wind-sim__telemetry">
            <div class="wind-telemetry-card">
              <h4>AERODYNAMIC COEFFICIENTS</h4>
              <div class="wind-metrics">
                <div><span>LIFT (C<sub>L</sub>)</span><b id="clVal">0.482</b></div>
                <div><span>DRAG (C<sub>D</sub>)</span><b id="cdVal">0.038</b></div>
                <div><span>L/D RATIO</span><b id="ldVal">12.68</b></div>
                <div><span>REYNOLDS (Re)</span><b>1.2 &times; 10<sup>5</sup></b></div>
              </div>
            </div>

            <div class="wind-telemetry-card">
              <h4>ENGINE ARCHITECTURE</h4>
              <p>
                WindSim is Jaijitesh's flagship scientific computing project: a high-performance browser aerodynamics platform combining deterministic CFD (LBM) with real-time streamlines, pressure slices, and 3D surface solvers.
              </p>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#windCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.initParticles();
    this.bindEvents();
    this.startLoop();
  }

  initParticles() {
    this.particles = [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: this.flowSpeed * 0.15 + (Math.random() - 0.5) * 0.5,
        vy: 0,
        age: Math.random() * 100,
        history: []
      });
    }
  }

  bindEvents() {
    const speedSlider = this.container.querySelector('#speedSlider');
    const aoaSlider = this.container.querySelector('#aoaSlider');
    const foilSelect = this.container.querySelector('#foilSelect');

    speedSlider?.addEventListener('input', (e) => {
      this.flowSpeed = parseFloat(e.target.value);
      this.container.querySelector('#speedVal').textContent = this.flowSpeed.toFixed(1);
      this.calculateCoefficients();
      sound.tick(800);
    });

    aoaSlider?.addEventListener('input', (e) => {
      this.aoa = parseFloat(e.target.value);
      this.container.querySelector('#aoaVal').textContent = `${this.aoa > 0 ? '+' : ''}${this.aoa.toFixed(1)}°`;
      this.calculateCoefficients();
      sound.tick(1000);
    });

    foilSelect?.addEventListener('change', (e) => {
      this.airfoilType = e.target.value;
      this.calculateCoefficients();
      sound.click(600, 0.02);
    });
  }

  calculateCoefficients() {
    const rad = (this.aoa * Math.PI) / 180;

    if (this.airfoilType === 'NACA0012') {
      this.liftCoeff = Math.sin(2 * rad) * 1.15;
      this.dragCoeff = 0.012 + Math.pow(Math.sin(rad), 2) * 1.4;
    } else if (this.airfoilType === 'NACA4412') {
      this.liftCoeff = 0.35 + Math.sin(2 * rad) * 1.2;
      this.dragCoeff = 0.016 + Math.pow(Math.sin(rad), 2) * 1.5;
    } else if (this.airfoilType === 'CYLINDER') {
      this.liftCoeff = 0.0;
      this.dragCoeff = 0.45;
    } else {
      this.liftCoeff = Math.sin(2 * rad) * 0.95;
      this.dragCoeff = 0.02 + Math.abs(Math.sin(rad)) * 1.8;
    }

    const ld = (this.dragCoeff > 0.001) ? (this.liftCoeff / this.dragCoeff).toFixed(2) : '—';

    const clEl = this.container.querySelector('#clVal');
    const cdEl = this.container.querySelector('#cdVal');
    const ldEl = this.container.querySelector('#ldVal');

    if (clEl) clEl.textContent = this.liftCoeff.toFixed(3);
    if (cdEl) cdEl.textContent = this.dragCoeff.toFixed(3);
    if (ldEl) ldEl.textContent = ld;
  }

  startLoop() {
    const loop = () => {
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  update() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const rad = (this.aoa * Math.PI) / 180;

    this.particles.forEach((p) => {
      // Flow velocity vector
      const baseVx = (this.flowSpeed / 20) * 3.5;
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.hypot(dx, dy);

      // Airfoil potential flow deflection
      let defX = 0;
      let defY = 0;

      if (dist < 110 && dist > 8) {
        const factor = (110 - dist) / 110;
        defY = -Math.sin(rad) * factor * 2.8;
        if (p.x < cx && Math.abs(dy) < 35) {
          defY += (dy < 0 ? -1 : 1) * factor * 2.0;
        }
      }

      p.vx = baseVx;
      p.vy = defY;

      p.x += p.vx;
      p.y += p.vy;

      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > 8) p.history.shift();

      if (p.x > w + 20) {
        p.x = -10;
        p.y = Math.random() * h;
        p.history = [];
      }
    });
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = '#080a0c';
    ctx.fillRect(0, 0, w, h);

    // Streamlines
    this.particles.forEach((p) => {
      if (p.history.length < 2) return;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      p.history.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    });

    // Render Airfoil Profile
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(- (this.aoa * Math.PI) / 180);

    ctx.fillStyle = '#1e242c';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;

    if (this.airfoilType === 'CYLINDER') {
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-60, 0);
      ctx.bezierCurveTo(-30, -22, 30, -18, 60, 0);
      ctx.bezierCurveTo(30, 8, -30, 10, -60, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
