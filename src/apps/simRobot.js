import { sound } from '../core/audio.js';

export class BerryBotSimulator {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // Simulation & Telemetry State
    this.state = {
      x: 0,
      y: 0,
      heading: 0, // radians
      targetHeading: 0,
      velocity: 0, // mm/s
      targetVelocity: 0,
      angularVelocity: 0,
      leftTicks: 0,
      rightTicks: 0,
      battery: 12.4, // Volts
      batteryPct: 98,
      espTemp: 38.5, // Celsius
      wifiRssi: -42, // dBm
      mode: 'TELEOP_STANDBY',
      loopHz: 200, // 200Hz low-level PID
      path: [],
      waypoints: [
        { x: 80, y: 60, reached: false },
        { x: 160, y: -40, reached: false },
        { x: 60, y: -120, reached: false },
        { x: -80, y: -60, reached: false },
        { x: 0, y: 0, reached: false }
      ],
      currentWpIndex: 0,
      isAutoNav: false,
      sCurveProfile: {
        maxAcc: 450, // mm/s^2
        maxJerk: 1200, // mm/s^3
        currentAcc: 0
      }
    };

    this.keys = {};
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="robot-sim">
        <header class="robot-sim__header">
          <div class="robot-sim__title">
            <b>BERRYBOT // AUTONOMOUS TELEMETRY SANDBOX</b>
            <span>WAVESHARE ESP32 &bull; DIFFERENTIAL DRIVE &bull; OPTICAL ENCODER FEEDBACK</span>
          </div>
          <div class="robot-sim__badges">
            <span class="robot-badge robot-badge--active" id="rbLoopRate">200 Hz PID</span>
            <span class="robot-badge" id="rbBattery">12.4V (98%)</span>
            <span class="robot-badge" id="rbMode">TELEOP STANDBY</span>
          </div>
        </header>

        <div class="robot-sim__body">
          <div class="robot-sim__viewport">
            <canvas id="robotCanvas" width="640" height="420"></canvas>
            
            <div class="robot-hud">
              <div class="robot-hud__controls">
                <button class="robot-btn robot-btn--primary" id="btnRth" type="button">RETURN TO HOME (RTH)</button>
                <button class="robot-btn" id="btnAutoNav" type="button">EXECUTE WAYPOINT PATH</button>
                <button class="robot-btn" id="btnClearPath" type="button">CLEAR ODOMETRY</button>
                <button class="robot-btn" id="btnEstop" type="button">E-STOP</button>
              </div>
              <div class="robot-hud__hint">
                [W, A, S, D] MANUAL DRIVE &bull; [SPACE] BRAKE &bull; CLICK ARENA TO SET WAYPOINT
              </div>
            </div>
          </div>

          <aside class="robot-sim__sidebar">
            <div class="robot-panel">
              <h4>OPTICAL ENCODER ODOMETRY</h4>
              <div class="robot-telemetry-grid">
                <div><span>POS X</span><b id="valPosX">0.0 mm</b></div>
                <div><span>POS Y</span><b id="valPosY">0.0 mm</b></div>
                <div><span>HEADING</span><b id="valHeading">0.0&deg;</b></div>
                <div><span>VELOCITY</span><b id="valVelocity">0 mm/s</b></div>
                <div><span>LEFT ENCODER</span><b id="valEncL">0 ticks</b></div>
                <div><span>RIGHT ENCODER</span><b id="valEncR">0 ticks</b></div>
              </div>
            </div>

            <div class="robot-panel">
              <h4>S-CURVE MOTION PROFILE</h4>
              <div class="robot-telemetry-grid">
                <div><span>ACCELERATION</span><b id="valAcc">0.0 mm/s&sup2;</b></div>
                <div><span>JERK LIMIT</span><b>1200 mm/s&sup3;</b></div>
                <div><span>ESP32 TEMP</span><b id="valTemp">38.5 &deg;C</b></div>
                <div><span>WIFI TELEMETRY</span><b id="valRssi">-42 dBm</b></div>
              </div>
            </div>

            <div class="robot-panel">
              <h4>SYSTEM STATUS &amp; ARCHITECTURE</h4>
              <p class="robot-panel__desc">
                Built by <b>Jaijitesh Suryaprakash</b> on a Waveshare ESP32 controller. Coordinates closed-loop PID track velocity, S-curve trajectory smoothing, hardware optical encoder counters, and high-level autonomous navigation.
              </p>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#robotCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.bindEvents();
    this.startLoop();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.container.querySelector('#btnRth')?.addEventListener('click', () => {
      this.triggerRth();
    });

    this.container.querySelector('#btnAutoNav')?.addEventListener('click', () => {
      this.toggleAutoNav();
    });

    this.container.querySelector('#btnClearPath')?.addEventListener('click', () => {
      this.state.path = [];
      this.state.leftTicks = 0;
      this.state.rightTicks = 0;
      this.state.x = 0;
      this.state.y = 0;
      this.state.heading = 0;
      sound.tick(1200);
    });

    this.container.querySelector('#btnEstop')?.addEventListener('click', () => {
      this.state.targetVelocity = 0;
      this.state.velocity = 0;
      this.state.isAutoNav = false;
      this.state.mode = 'EMERGENCY_STOP';
      sound.sonarPing(300);
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      const clickX = e.clientX - rect.left - cx;
      const clickY = -(e.clientY - rect.top - cy);

      this.state.waypoints.push({ x: clickX, y: clickY, reached: false });
      this.state.isAutoNav = true;
      this.state.mode = 'WAYPOINT_NAVIGATION';
      sound.click(750, 0.02);
    });
  }

  triggerRth() {
    this.state.waypoints = [{ x: 0, y: 0, reached: false }];
    this.state.currentWpIndex = 0;
    this.state.isAutoNav = true;
    this.state.mode = 'RETURN_TO_HOME (RTH)';
    sound.sonarPing(880);
  }

  toggleAutoNav() {
    this.state.isAutoNav = !this.state.isAutoNav;
    this.state.mode = this.state.isAutoNav ? 'WAYPOINT_NAVIGATION' : 'TELEOP_MANUAL';
    if (this.state.isAutoNav) sound.chipJingle();
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      this.update(dt);
      this.render();
      this.updateTelemetryDOM();

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  update(dt) {
    const s = this.state;

    // Manual Keyboard Teleop
    if (!s.isAutoNav) {
      let forward = 0;
      let turn = 0;

      if (this.keys['w'] || this.keys['arrowup']) forward += 220;
      if (this.keys['s'] || this.keys['arrowdown']) forward -= 180;
      if (this.keys['a'] || this.keys['arrowleft']) turn += 2.2;
      if (this.keys['d'] || this.keys['arrowright']) turn -= 2.2;
      if (this.keys[' ']) { forward = 0; turn = 0; }

      s.targetVelocity = forward;
      s.targetHeading += turn * dt;
      if (forward !== 0 || turn !== 0) {
        s.mode = 'MANUAL_TELEOP';
      }
    } else {
      // Autonomous Waypoint Navigation
      if (s.waypoints.length > 0) {
        const wp = s.waypoints[s.currentWpIndex % s.waypoints.length];
        const dx = wp.x - s.x;
        const dy = wp.y - s.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 12) {
          wp.reached = true;
          s.currentWpIndex = (s.currentWpIndex + 1) % s.waypoints.length;
          sound.tick(1400);
        } else {
          s.targetHeading = Math.atan2(dy, dx);
          s.targetVelocity = Math.min(200, dist * 2.5);
        }
      }
    }

    // S-Curve Velocity Profiling
    const vDiff = s.targetVelocity - s.velocity;
    const maxDeltaV = s.sCurveProfile.maxAcc * dt;
    s.sCurveProfile.currentAcc = Math.max(-s.sCurveProfile.maxAcc, Math.min(s.sCurveProfile.maxAcc, vDiff / dt));
    s.velocity += Math.max(-maxDeltaV, Math.min(maxDeltaV, vDiff));

    // Heading Interpolation
    let hDiff = s.targetHeading - s.heading;
    while (hDiff > Math.PI) hDiff -= Math.PI * 2;
    while (hDiff < -Math.PI) hDiff += Math.PI * 2;
    s.heading += hDiff * Math.min(1.0, 5.0 * dt);

    // Differential Kinematics
    const vx = Math.cos(s.heading) * s.velocity;
    const vy = Math.sin(s.heading) * s.velocity;

    s.x += vx * dt;
    s.y += vy * dt;

    // Optical Encoder Ticks
    const trackDist = s.velocity * dt;
    const tickRate = 4.2; // ticks per mm
    s.leftTicks += Math.round((trackDist + hDiff * 35) * tickRate);
    s.rightTicks += Math.round((trackDist - hDiff * 35) * tickRate);

    // Breadcrumb Trail
    if (s.path.length === 0 || Math.hypot(s.path[s.path.length - 1].x - s.x, s.path[s.path.length - 1].y - s.y) > 6) {
      s.path.push({ x: s.x, y: s.y });
      if (s.path.length > 250) s.path.shift();
    }

    // Battery / Temp simulation
    s.battery -= dt * 0.0002;
    s.batteryPct = Math.max(0, Math.round((s.battery / 12.6) * 100));
    s.espTemp = 38.0 + Math.abs(s.velocity / 200) * 4.5 + Math.sin(performance.now() * 0.001) * 0.5;
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = '#0a0d10';
    ctx.fillRect(0, 0, w, h);

    // Coordinate Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;

    for (let x = (cx % gridSpacing); x < w; x += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = (cy % gridSpacing); y < h; y += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Origin Crosshair
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy);
    ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15);
    ctx.stroke();

    // Render Waypoints
    this.state.waypoints.forEach((wp, idx) => {
      const wx = cx + wp.x;
      const wy = cy - wp.y;

      ctx.strokeStyle = (idx === this.state.currentWpIndex) ? '#e2b340' : '#475569';
      ctx.fillStyle = (idx === this.state.currentWpIndex) ? 'rgba(226, 179, 64, 0.2)' : 'transparent';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(wx, wy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#8b949e';
      ctx.font = '10px monospace';
      ctx.fillText(`WP_${idx + 1}`, wx + 12, wy + 4);
    });

    // Render Trajectory Path
    if (this.state.path.length > 1) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      this.state.path.forEach((p, idx) => {
        const px = cx + p.x;
        const py = cy - p.y;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // Render BerryBot Chassis
    const rx = cx + this.state.x;
    const ry = cy - this.state.y;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-this.state.heading);

    // Rubber Tracks Left & Right
    ctx.fillStyle = '#1e2329';
    ctx.fillRect(-22, -18, 44, 8);
    ctx.fillRect(-22, 10, 44, 8);

    // Track Tread Grooves
    ctx.fillStyle = '#111417';
    for (let i = -20; i <= 18; i += 6) {
      ctx.fillRect(i, -18, 2, 8);
      ctx.fillRect(i, 10, 2, 8);
    }

    // Main Chassis Hull (Anodized Gunmetal)
    ctx.fillStyle = '#2d333b';
    ctx.fillRect(-18, -10, 36, 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-18, -10, 36, 20);

    // Electronics & ESP32 Plate
    ctx.fillStyle = '#1b1f24';
    ctx.fillRect(-8, -6, 16, 12);

    // Heading Forward Arrow
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(6, -5);
    ctx.lineTo(6, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  updateTelemetryDOM() {
    const s = this.state;
    const $ = (id) => this.container.querySelector(id);

    if ($('#valPosX')) $('#valPosX').textContent = `${s.x.toFixed(1)} mm`;
    if ($('#valPosY')) $('#valPosY').textContent = `${s.y.toFixed(1)} mm`;
    if ($('#valHeading')) $('#valHeading').textContent = `${((s.heading * 180 / Math.PI) % 360).toFixed(1)}°`;
    if ($('#valVelocity')) $('#valVelocity').textContent = `${Math.round(s.velocity)} mm/s`;
    if ($('#valEncL')) $('#valEncL').textContent = `${s.leftTicks} ticks`;
    if ($('#valEncR')) $('#valEncR').textContent = `${s.rightTicks} ticks`;
    if ($('#valAcc')) $('#valAcc').textContent = `${s.sCurveProfile.currentAcc.toFixed(1)} mm/s²`;
    if ($('#valTemp')) $('#valTemp').textContent = `${s.espTemp.toFixed(1)} °C`;
    if ($('#valRssi')) $('#valRssi').textContent = `${s.wifiRssi} dBm`;
    if ($('#rbBattery')) $('#rbBattery').textContent = `${s.battery.toFixed(1)}V (${s.batteryPct}%)`;
    if ($('#rbMode')) $('#rbMode').textContent = s.mode;
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
