import { sound } from './audio.js';

export class RobotSimulator {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // Robot state
    this.robot = {
      x: 3.0,
      y: 2.2,
      heading: 0, // radians
      vLeft: 0,
      vRight: 0,
      targetV: 0.8,
      sCurveJerk: 2.5,
      leftTicks: 12480,
      rightTicks: 12480,
      path: [],
      waypoints: [
        { x: 1.5, y: 1.0 },
        { x: 4.8, y: 1.2 },
        { x: 4.5, y: 3.2 },
        { x: 1.8, y: 3.0 }
      ],
      currentWpIndex: 0,
      mode: 'PATROL', // 'PATROL' | 'MANUAL' | 'RTH' (Return to home)
    };

    this.home = { x: 3.0, y: 2.2 };
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="robot-sim">
        <header class="robot-sim__header">
          <div class="robot-sim__title">
            <b>BERRYBOT // TRACKED AUTONOMOUS ROBOTICS TELEMETRY</b>
            <span>WAVESHARE ESP32 &bull; ENCODER S-CURVE MOTION &bull; PATH TRACKING</span>
          </div>
          <div class="robot-sim__controls">
            <button class="robot-btn" id="botPatrolBtn" type="button">MODE: WAYPOINT TRACKING</button>
            <button class="robot-btn" id="botRthBtn" type="button">RETURN TO HOME (RTH)</button>
            <button class="robot-btn" id="botResetBtn" type="button">RESET ODOMETRY</button>
          </div>
        </header>

        <div class="robot-sim__workspace">
          <div class="robot-sim__viewport">
            <canvas id="robotCanvas"></canvas>
            <div class="robot-sim__hint">CLICK ON MAP TO SET WAYPOINT OR USE CONTROLS</div>
          </div>

          <aside class="robot-sim__telemetry">
            <div class="robot-card">
              <div class="robot-card__head">CLOSED-LOOP ODOMETRY</div>
              <div class="robot-card__body">
                <div class="robot-telemetry-row"><span>POSITION X</span><b id="botPosX">3.000 m</b></div>
                <div class="robot-telemetry-row"><span>POSITION Y</span><b id="botPosY">2.200 m</b></div>
                <div class="robot-telemetry-row"><span>HEADING (&theta;)</span><b id="botHeading">0.0&deg;</b></div>
                <div class="robot-telemetry-row"><span>LEFT ENCODER</span><b id="botEncL">12480 ticks</b></div>
                <div class="robot-telemetry-row"><span>RIGHT ENCODER</span><b id="botEncR">12480 ticks</b></div>
                <div class="robot-telemetry-row"><span>S-CURVE PROFILE</span><b class="status-active">TRAJECTORY ACTIVE</b></div>
              </div>
            </div>

            <div class="robot-card">
              <div class="robot-card__head">MOTOR CONTROLLER (ESP32)</div>
              <div class="robot-card__body">
                <div class="robot-telemetry-row"><span>PWM FREQUENCY</span><b>20.0 kHz</b></div>
                <div class="robot-telemetry-row"><span>LEFT TRACK PWM</span><b id="botPwmL">72%</b></div>
                <div class="robot-telemetry-row"><span>RIGHT TRACK PWM</span><b id="botPwmR">72%</b></div>
                <div class="robot-telemetry-row"><span>LOOP RATE</span><b>1000 Hz (1ms)</b></div>
                <div class="robot-telemetry-row"><span>STATUS</span><b class="status-active">CLOSED-LOOP PID</b></div>
              </div>
            </div>

            <div class="robot-card">
              <div class="robot-card__head">SYSTEM SPECIFICATIONS</div>
              <div class="robot-specs-list">
                <div>&bull; Controller: Waveshare ESP32 Multi-Channel Driver</div>
                <div>&bull; Drivetrain: Dual High-Torque Geared DC Motors</div>
                <div>&bull; Chassis: Custom SolidWorks Anodized Aluminum Base</div>
                <div>&bull; Integration: Planned Edge Vision &amp; WindSim Coupling</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#robotCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.bindEvents();
    this.resize();
    this.startLoop();
  }

  bindEvents() {
    const patrolBtn = this.container.querySelector('#botPatrolBtn');
    const rthBtn = this.container.querySelector('#botRthBtn');
    const resetBtn = this.container.querySelector('#botResetBtn');

    patrolBtn?.addEventListener('click', () => {
      this.robot.mode = this.robot.mode === 'PATROL' ? 'MANUAL' : 'PATROL';
      patrolBtn.textContent = this.robot.mode === 'PATROL' ? 'MODE: WAYPOINT TRACKING' : 'MODE: MANUAL';
      sound.click(620, 0.02);
    });

    rthBtn?.addEventListener('click', () => {
      this.robot.mode = 'RTH';
      patrolBtn.textContent = 'MODE: RETURN TO HOME';
      sound.sonarPing(950);
    });

    resetBtn?.addEventListener('click', () => {
      this.robot.x = this.home.x;
      this.robot.y = this.home.y;
      this.robot.heading = 0;
      this.robot.leftTicks = 0;
      this.robot.rightTicks = 0;
      this.robot.path = [];
      sound.click(420, 0.03);
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = 6.0 / rect.width;
      const scaleY = 4.0 / rect.height;
      const targetX = (e.clientX - rect.left) * scaleX;
      const targetY = (e.clientY - rect.top) * scaleY;

      this.robot.waypoints = [{ x: targetX, y: targetY }];
      this.robot.currentWpIndex = 0;
      this.robot.mode = 'PATROL';
      if (patrolBtn) patrolBtn.textContent = 'MODE: WAYPOINT TRACKING';
      sound.tick(1100);
    });

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
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
    let target = null;

    if (this.robot.mode === 'PATROL') {
      target = this.robot.waypoints[this.robot.currentWpIndex];
      const dist = Math.hypot(target.x - this.robot.x, target.y - this.robot.y);
      if (dist < 0.25) {
        this.robot.currentWpIndex = (this.robot.currentWpIndex + 1) % this.robot.waypoints.length;
      }
    } else if (this.robot.mode === 'RTH') {
      target = this.home;
      const dist = Math.hypot(target.x - this.robot.x, target.y - this.robot.y);
      if (dist < 0.15) {
        this.robot.mode = 'MANUAL';
        sound.chipJingle();
      }
    }

    if (target) {
      const dx = target.x - this.robot.x;
      const dy = target.y - this.robot.y;
      const desiredHeading = Math.atan2(dy, dx);
      let angleDiff = desiredHeading - this.robot.heading;

      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Differential steer S-curve rotation
      this.robot.heading += angleDiff * 0.06;

      const speed = 0.022;
      this.robot.x += Math.cos(this.robot.heading) * speed;
      this.robot.y += Math.sin(this.robot.heading) * speed;

      // Increment simulated encoder counts
      this.robot.leftTicks += Math.round(12 + Math.random() * 2);
      this.robot.rightTicks += Math.round(12 + Math.random() * 2);

      // Path trail
      if (!this.robot.path.length || Math.hypot(this.robot.x - this.robot.path[0].x, this.robot.y - this.robot.path[0].y) > 0.06) {
        this.robot.path.unshift({ x: this.robot.x, y: this.robot.y });
        if (this.robot.path.length > 70) this.robot.path.pop();
      }
    }

    // Update Telemetry HUD
    const xEl = this.container.querySelector('#botPosX');
    const yEl = this.container.querySelector('#botPosY');
    const headEl = this.container.querySelector('#botHeading');
    const encLEl = this.container.querySelector('#botEncL');
    const encREl = this.container.querySelector('#botEncR');

    if (xEl) xEl.textContent = `${this.robot.x.toFixed(3)} m`;
    if (yEl) yEl.textContent = `${this.robot.y.toFixed(3)} m`;
    if (headEl) headEl.textContent = `${((this.robot.heading * 180) / Math.PI).toFixed(1)}°`;
    if (encLEl) encLEl.textContent = `${this.robot.leftTicks} ticks`;
    if (encREl) encREl.textContent = `${this.robot.rightTicks} ticks`;
  }

  render(time) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const sx = w / 6.0;
    const sy = h / 4.0;

    ctx.clearRect(0, 0, w, h);

    // Floor grid
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

    // Arena boundary
    ctx.strokeStyle = 'rgba(183, 223, 91, 0.3)';
    ctx.strokeRect(0.2 * sx, 0.2 * sy, 5.6 * sx, 3.6 * sy);

    // Home Base Station
    const hx = this.home.x * sx;
    const hy = this.home.y * sy;
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
    ctx.strokeRect(hx - 16, hy - 16, 32, 32);
    ctx.fillStyle = '#00d2ff';
    ctx.font = '8px monospace';
    ctx.fillText('HOME BASE', hx - 22, hy - 20);

    // Waypoints
    this.robot.waypoints.forEach((wp, idx) => {
      const wx = wp.x * sx;
      const wy = wp.y * sy;
      const isTarget = idx === this.robot.currentWpIndex && this.robot.mode === 'PATROL';

      ctx.strokeStyle = isTarget ? '#b7df5b' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isTarget ? 2 : 1;
      ctx.beginPath();
      ctx.arc(wx, wy, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isTarget ? '#b7df5b' : '#888';
      ctx.font = '8px monospace';
      ctx.fillText(`WP_${idx + 1}`, wx - 12, wy + 18);
    });

    // Path history trail
    if (this.robot.path.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.robot.path[0].x * sx, this.robot.path[0].y * sy);
      for (let i = 1; i < this.robot.path.length; i++) {
        ctx.lineTo(this.robot.path[i].x * sx, this.robot.path[i].y * sy);
      }
      ctx.strokeStyle = 'rgba(183, 223, 91, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Render Tracked Robot
    const rx = this.robot.x * sx;
    const ry = this.robot.y * sy;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(this.robot.heading);

    // Main Chassis
    ctx.fillStyle = '#1c221e';
    ctx.fillRect(-22, -16, 44, 32);
    ctx.strokeStyle = '#b7df5b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-22, -16, 44, 32);

    // Left and Right Tracks
    ctx.fillStyle = '#0a0d0a';
    ctx.fillRect(-24, -20, 48, 6);
    ctx.fillRect(-24, 14, 48, 6);

    // Heading Arrow
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();

    ctx.restore();
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
