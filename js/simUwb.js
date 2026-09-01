import { sound } from './audio.js';

export class UwbSimulator {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // 4 Fixed UWB Anchors (in meters, room size 6m x 4m)
    this.anchors = [
      { id: 'ANCHOR_01', x: 0.8, y: 0.6, z: 2.1, color: '#38ef7d', name: 'NORTH-WEST' },
      { id: 'ANCHOR_02', x: 5.2, y: 0.6, z: 2.1, color: '#11998e', name: 'NORTH-EAST' },
      { id: 'ANCHOR_03', x: 5.2, y: 3.4, z: 2.1, color: '#00d2ff', name: 'SOUTH-EAST' },
      { id: 'ANCHOR_04', x: 0.8, y: 3.4, z: 2.1, color: '#3a7bd5', name: 'SOUTH-WEST' },
    ];

    // Tracked Mobile Luggage Tag
    this.tag = {
      x: 3.0,
      y: 2.0,
      z: 0.45,
      vx: 0,
      vy: 0,
      targetX: 3.0,
      targetY: 2.0,
      dragging: false,
      history: [],
    };

    this.selectedAnchor = null;
    this.filterMode = 'EKF'; // 'RAW' | 'EKF'
    this.noiseLevel = 0.04; // 4cm standard deviation
    this.autoPatrol = true;
    this.patrolAngle = 0;
    this.selectedNode = null;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="uwb-sim">
        <header class="uwb-sim__header">
          <div class="uwb-sim__title">
            <b>UWB RTLS // INDOOR LOCALIZATION ENGINE</b>
            <span>DECISION MATRIX & TRILATERATION TELEMETRY</span>
          </div>
          <div class="uwb-sim__controls">
            <button class="uwb-btn" id="uwbFilterBtn" type="button">FILTER: EKF (ACTIVE)</button>
            <button class="uwb-btn" id="uwbPatrolBtn" type="button">MODE: AUTO-PATROL</button>
            <button class="uwb-btn" id="uwbResetBtn" type="button">RESET COORDS</button>
          </div>
        </header>

        <div class="uwb-sim__workspace">
          <div class="uwb-sim__viewport">
            <canvas id="uwbCanvas"></canvas>
            <div class="uwb-sim__hint">DRAG SUITCASE OR CLICK ANCHORS TO INSPECT TELEMETRY</div>
          </div>

          <aside class="uwb-sim__telemetry">
            <div class="uwb-card">
              <div class="uwb-card__head">TAG ESTIMATION [REAL-TIME]</div>
              <div class="uwb-card__body">
                <div class="uwb-coord-row"><span>ESTIMATED X</span><b id="uwbTagX">3.000 m</b></div>
                <div class="uwb-coord-row"><span>ESTIMATED Y</span><b id="uwbTagY">2.000 m</b></div>
                <div class="uwb-coord-row"><span>ESTIMATED Z</span><b id="uwbTagZ">0.450 m</b></div>
                <div class="uwb-coord-row"><span>RESIDUAL RMS</span><b id="uwbTagErr">0.012 m</b></div>
                <div class="uwb-coord-row"><span>UPDATE RATE</span><b>100 Hz (10ms)</b></div>
              </div>
            </div>

            <div class="uwb-card" id="uwbAnchorCard">
              <div class="uwb-card__head" id="uwbAnchorTitle">ANCHOR_01 // TELEMETRY</div>
              <div class="uwb-card__body" id="uwbAnchorBody">
                <div class="uwb-coord-row"><span>RANGE (TOF)</span><b id="uwbRange0">2.651 m</b></div>
                <div class="uwb-coord-row"><span>FLIGHT TIME</span><b id="uwbTof0">8.84 ns</b></div>
                <div class="uwb-coord-row"><span>RSSI</span><b id="uwbRssi0">-74.2 dBm</b></div>
                <div class="uwb-coord-row"><span>CHANNEL</span><b>CH2 (3993.6 MHz)</b></div>
                <div class="uwb-coord-row"><span>STATUS</span><b class="status-locked">LOCKED // 98%</b></div>
              </div>
            </div>

            <div class="uwb-card">
              <div class="uwb-card__head">ALGORITHM PIPELINE</div>
              <div class="uwb-pipeline">
                <div class="pipeline-step">1. Double-Sided Two-Way Ranging (DS-TWR)</div>
                <div class="pipeline-step">2. Outlier Rejection & NLOS Detection</div>
                <div class="pipeline-step">3. Gauss-Newton Non-Linear Multilateration</div>
                <div class="pipeline-step">4. 6-DOF Extended Kalman Filter (EKF)</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#uwbCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.bindEvents();
    this.resize();
    this.startLoop();
  }

  bindEvents() {
    const filterBtn = this.container.querySelector('#uwbFilterBtn');
    const patrolBtn = this.container.querySelector('#uwbPatrolBtn');
    const resetBtn = this.container.querySelector('#uwbResetBtn');

    filterBtn?.addEventListener('click', () => {
      this.filterMode = this.filterMode === 'EKF' ? 'RAW' : 'EKF';
      filterBtn.textContent = `FILTER: ${this.filterMode}`;
      sound.click(750, 0.02);
    });

    patrolBtn?.addEventListener('click', () => {
      this.autoPatrol = !this.autoPatrol;
      patrolBtn.textContent = this.autoPatrol ? 'MODE: AUTO-PATROL' : 'MODE: MANUAL';
      sound.click(580, 0.02);
    });

    resetBtn?.addEventListener('click', () => {
      this.tag.targetX = 3.0;
      this.tag.targetY = 2.0;
      this.tag.history = [];
      sound.click(420, 0.03);
    });

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = 6.0 / rect.width;
      const scaleY = 4.0 / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const p = getPos(e);
      // Check if clicked anchor
      const clickedAnchor = this.anchors.find(a => Math.hypot(a.x - p.x, a.y - p.y) < 0.4);
      if (clickedAnchor) {
        this.selectedAnchor = clickedAnchor;
        this.updateAnchorCard(clickedAnchor);
        sound.sonarPing(920);
        return;
      }

      // Check if clicked tag
      if (Math.hypot(this.tag.x - p.x, this.tag.y - p.y) < 0.6) {
        this.tag.dragging = true;
        this.autoPatrol = false;
        if (patrolBtn) patrolBtn.textContent = 'MODE: MANUAL';
        sound.click(800, 0.025);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.tag.dragging) return;
      const p = getPos(e);
      this.tag.targetX = Math.max(0.4, Math.min(5.6, p.x));
      this.tag.targetY = Math.max(0.4, Math.min(3.6, p.y));
    });

    window.addEventListener('mouseup', () => {
      if (this.tag.dragging) {
        this.tag.dragging = false;
      }
    });

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
  }

  updateAnchorCard(anchor) {
    const title = this.container.querySelector('#uwbAnchorTitle');
    const dist = Math.hypot(this.tag.x - anchor.x, this.tag.y - anchor.y, this.tag.z - anchor.z);
    const tof = (dist / 299792458) * 1e9;
    const rssi = -68 - dist * 3.5;

    if (title) title.textContent = `${anchor.id} // ${anchor.name}`;
    const body = this.container.querySelector('#uwbAnchorBody');
    if (body) {
      body.innerHTML = `
        <div class="uwb-coord-row"><span>POSITION</span><b>X:${anchor.x}m Y:${anchor.y}m Z:${anchor.z}m</b></div>
        <div class="uwb-coord-row"><span>RANGE (TOF)</span><b>${dist.toFixed(3)} m</b></div>
        <div class="uwb-coord-row"><span>FLIGHT TIME</span><b>${tof.toFixed(2)} ns</b></div>
        <div class="uwb-coord-row"><span>RSSI</span><b>${rssi.toFixed(1)} dBm</b></div>
        <div class="uwb-coord-row"><span>ANTENNA DELAY</span><b>514.2 ps (Calibrated)</b></div>
        <div class="uwb-coord-row"><span>STATUS</span><b class="status-locked" style="color:${anchor.color}">RANGING OK // 99.4%</b></div>
      `;
    }
  }

  startLoop() {
    const loop = (time) => {
      this.update(time);
      this.render(time);
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  update(time) {
    if (this.autoPatrol && !this.tag.dragging) {
      this.patrolAngle += 0.012;
      this.tag.targetX = 3.0 + Math.sin(this.patrolAngle) * 1.8 + Math.sin(this.patrolAngle * 2.3) * 0.4;
      this.tag.targetY = 2.0 + Math.cos(this.patrolAngle * 1.4) * 1.1;
    }

    // Smooth movement towards target
    this.tag.x += (this.tag.targetX - this.tag.x) * 0.15;
    this.tag.y += (this.tag.targetY - this.tag.y) * 0.15;

    // Track history
    if (!this.tag.history.length || Math.hypot(this.tag.x - this.tag.history[0].x, this.tag.y - this.tag.history[0].y) > 0.05) {
      this.tag.history.unshift({ x: this.tag.x, y: this.tag.y });
      if (this.tag.history.length > 50) this.tag.history.pop();
    }

    // Calculate trilateration readouts
    let rmsError = 0;
    this.anchors.forEach((a, i) => {
      const trueDist = Math.hypot(this.tag.x - a.x, this.tag.y - a.y, this.tag.z - a.z);
      const measuredDist = trueDist + (this.filterMode === 'RAW' ? (Math.random() - 0.5) * this.noiseLevel * 3 : (Math.random() - 0.5) * 0.005);
      rmsError += Math.pow(measuredDist - trueDist, 2);
    });
    rmsError = Math.sqrt(rmsError / this.anchors.length);

    // Update HUD
    const xEl = this.container.querySelector('#uwbTagX');
    const yEl = this.container.querySelector('#uwbTagY');
    const zEl = this.container.querySelector('#uwbTagZ');
    const errEl = this.container.querySelector('#uwbTagErr');

    if (xEl) xEl.textContent = `${this.tag.x.toFixed(3)} m`;
    if (yEl) yEl.textContent = `${this.tag.y.toFixed(3)} m`;
    if (zEl) zEl.textContent = `${this.tag.z.toFixed(3)} m`;
    if (errEl) errEl.textContent = `${rmsError.toFixed(3)} m`;

    if (!this.selectedAnchor) {
      this.updateAnchorCard(this.anchors[0]);
    }
  }

  render(time) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const sx = w / 6.0;
    const sy = h / 4.0;

    ctx.clearRect(0, 0, w, h);

    // Room Floor Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 6.0; x += 0.5) {
      ctx.beginPath();
      ctx.moveTo(x * sx, 0);
      ctx.lineTo(x * sx, h);
      ctx.stroke();
    }
    for (let y = 0; y <= 4.0; y += 0.5) {
      ctx.beginPath();
      ctx.moveTo(0, y * sy);
      ctx.lineTo(w, y * sy);
      ctx.stroke();
    }

    // Room Boundary Wall
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.strokeRect(0.3 * sx, 0.3 * sy, 5.4 * sx, 3.4 * sy);

    // Breadcrumb Trail
    if (this.tag.history.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.tag.history[0].x * sx, this.tag.history[0].y * sy);
      for (let i = 1; i < this.tag.history.length; i++) {
        ctx.lineTo(this.tag.history[i].x * sx, this.tag.history[i].y * sy);
      }
      ctx.strokeStyle = 'rgba(183, 223, 91, 0.28)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Ranging Waves from Anchors to Tag
    const pulseOffset = (time * 0.003) % 1;
    this.anchors.forEach((a) => {
      const ax = a.x * sx;
      const ay = a.y * sy;
      const tx = this.tag.x * sx;
      const ty = this.tag.y * sy;

      // Distance Line
      ctx.strokeStyle = `${a.color}33`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Pulsing Wave Ring
      const dist = Math.hypot(tx - ax, ty - ay);
      const ringRadius = (dist * pulseOffset);
      ctx.beginPath();
      ctx.arc(ax, ay, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${a.color}44`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Anchor Icon / Box
      ctx.fillStyle = '#0f1210';
      ctx.fillRect(ax - 14, ay - 14, 28, 28);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(ax - 14, ay - 14, 28, 28);

      // Anchor Label
      ctx.fillStyle = '#e8ece2';
      ctx.font = '10px monospace';
      ctx.fillText(a.id, ax - 24, ay - 18);
    });

    // Draw Tag (Suitcase / Mobile Base)
    const tx = this.tag.x * sx;
    const ty = this.tag.y * sy;

    // Glowing coordinate halo
    const grad = ctx.createRadialGradient(tx, ty, 4, tx, ty, 32);
    grad.addColorStop(0, 'rgba(183, 223, 91, 0.6)');
    grad.addColorStop(1, 'rgba(183, 223, 91, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(tx, ty, 32, 0, Math.PI * 2);
    ctx.fill();

    // Suitcase Body
    ctx.fillStyle = '#161916';
    ctx.fillRect(tx - 20, ty - 14, 40, 28);
    ctx.strokeStyle = '#b7df5b';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx - 20, ty - 14, 40, 28);

    // Suitcase Handle & Wheels
    ctx.strokeStyle = '#e8ece2';
    ctx.strokeRect(tx - 6, ty - 20, 12, 6);
    ctx.fillStyle = '#777';
    ctx.fillRect(tx - 18, ty + 14, 6, 3);
    ctx.fillRect(tx + 12, ty + 14, 6, 3);

    // Tag Label
    ctx.fillStyle = '#b7df5b';
    ctx.font = '11px monospace';
    ctx.fillText('TAG // LUGGAGE', tx - 38, ty + 32);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
