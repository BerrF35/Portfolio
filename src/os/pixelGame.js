import { sound } from '../core/audio.js';

export class PixelGameEngine {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // Viewport dimensions (High-DPI internal coordinate space)
    this.vw = 640;
    this.vh = 400;

    this.player = {
      x: 320,
      y: 260,
      targetX: 320,
      targetY: 260,
      speed: 2.8,
      walkFrame: 0,
      isMoving: false,
    };

    // Berry (12yo Belgian Malinois Dog companion)
    this.dog = {
      x: 280,
      y: 280,
      targetX: 280,
      targetY: 280,
      tailFrame: 0,
      name: 'BERRY (12yo MALINOIS)'
    };

    // Crispy (10yo Cat companion)
    this.cat = {
      x: 380,
      y: 130,
      tailFrame: 0,
      name: 'CRISPY (10yo CAT)'
    };

    this.keys = {};

    this.stations = [
      {
        id: 'windsim',
        name: 'WINDSIM AERODYNAMICS LAB',
        year: '2026',
        x: 60,
        y: 60,
        w: 90,
        h: 64,
        color: '#38bdf8',
        title: '01 // WINDSIM PLATFORM (#1 WORK)',
        badge: 'SCIENTIFIC COMPUTING / CFD',
        copy: 'Browser-based aerodynamics platform featuring a real-time reduced-order wind sandbox and a deterministic CFD lab with LBM (Lattice Boltzmann Method) simulation, streamlines, slices, and surface visualization. Live on GitHub Pages (berrf35.github.io/Windsim).',
      },
      {
        id: 'berry',
        name: 'BERRY DESKTOP AI AGENT',
        year: '2026',
        x: 275,
        y: 60,
        w: 90,
        h: 64,
        color: '#38bdf8',
        title: '02 // BERRY DESKTOP AI ASSISTANT',
        badge: 'LOCAL-FIRST AGENTIC AI',
        copy: 'High-performance, local-first desktop agent bridging LLMs with the OS. Built in Python (AGPL-3.0) with Core Engine, Berry CUA (Computer Use Agent sidecar), Browser Relay (Chromium bridge), Skill Codex, and Berry Vault persistent memory.',
      },
      {
        id: 'berrybot',
        name: 'BERRYBOT ROBOTICS BENCH',
        year: '2026',
        x: 480,
        y: 60,
        w: 100,
        h: 64,
        color: '#e2b340',
        title: '03 // BERRYBOT TRACKED ROBOT',
        badge: 'AUTONOMOUS ROBOTICS',
        copy: 'Tracked autonomous robotics platform built entirely by Jaijitesh around a Waveshare ESP32 controller. Features optical encoder feedback, S-curve trajectory profiling, telemetry, path tracking, and return-to-home capabilities.',
      },
      {
        id: 'hackathons',
        name: 'HACKATHON LEAD TROPHIES',
        year: '2025 - 2026',
        x: 60,
        y: 230,
        w: 90,
        h: 64,
        color: '#e2e8f0',
        title: '04 // HACKATHON LEADERSHIP',
        badge: 'IMPACTX 3.0 (3RD OVERALL)',
        copy: 'Technical Lead & Primary Coder across multiple hackathons: ImpactX 3.0 (3rd Place Overall - Hyperlocal service marketplace), Yantra 26 Central Hack (FarmAssist AI), and Vinhack 25 (P2P Book Exchange).',
      },
      {
        id: 'research',
        name: 'RESEARCH ARCHIVE',
        year: '2026',
        x: 275,
        y: 230,
        w: 90,
        h: 64,
        color: '#a78bfa',
        title: '05 // 3 PAPERS IN PREPARATION',
        badge: 'RESEARCH GROUP & PROFESSOR',
        copy: 'Collaborating in a 5-person group with a professor on 3 research papers in preparation: Paper 1: Synthetic Data Generation Pipelines (synthetic-data-generator), Paper 2: Spectral Color-Space Image Analysis (color-splitter), Paper 3: Vision Systems.',
      },
      {
        id: 'education',
        name: 'VIT VELLORE & HORIZON',
        year: '2025 - 2029',
        x: 480,
        y: 230,
        w: 100,
        h: 74,
        color: '#38bdf8',
        title: '06 // VIT VELLORE (B.TECH IT)',
        badge: 'UNDERGRADUATE / SCTS',
        copy: 'B.Tech Information Technology, Vellore Institute of Technology (VIT), Vellore (2025-2029, current 1st year). Schooling at SCTS (10th: 93.4%, 12th: 76.4%). Building at the boundary of software, AI, and physical hardware.',
      },
      {
        id: 'dog_berry',
        name: 'BERRY (BELGIAN MALINOIS)',
        year: '12 YEARS OLD',
        x: 240,
        y: 330,
        w: 60,
        h: 40,
        color: '#d97706',
        title: 'BERRY // 12yo BELGIAN MALINOIS',
        badge: 'ROBOT & AGENT NAMESAKE',
        copy: 'Berry is Jaijitesh\'s 12-year-old Belgian Malinois. The loyal spirit, guardian, and namesake behind both the Berry AI Agent and the BerryBot autonomous robot.',
      },
      {
        id: 'cat_crispy',
        name: 'CRISPY (COMPANION CAT)',
        year: '10 YEARS OLD',
        x: 390,
        y: 120,
        w: 60,
        h: 40,
        color: '#fbbf24',
        title: 'CRISPY // 10yo COMPANION CAT',
        badge: 'CHIEF SUPERVISOR',
        copy: 'Crispy is Jaijitesh\'s 10-year-old companion cat, comfortably supervising workbench testing, electronics debugging, and code sessions.',
      }
    ];

    this.activeStation = null;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="pixel-game">
        <header class="pixel-game__header">
          <div class="pixel-game__title">
            <b>MEMORY WORLD // RETRO WORKBENCH &amp; TIMELINE</b>
            <span>MOVE CHARACTER WITH [W, A, S, D] OR CLICK TO WALK &bull; [E] TO INSPECT</span>
          </div>
          <div class="pixel-game__status" id="pixelStatus">EXPLORING STUDIO</div>
        </header>

        <div class="pixel-game__stage">
          <canvas id="pixelCanvas" width="640" height="400"></canvas>

          <aside class="pixel-modal" id="pixelModal" hidden>
            <button class="pixel-modal__close" id="pixelModalClose" type="button">&times;</button>
            <div class="pixel-modal__badge" id="pmBadge">ACHIEVEMENT</div>
            <h3 id="pmTitle">WINDSIM</h3>
            <div class="pixel-modal__year" id="pmYear">2026</div>
            <p id="pmCopy">Summary copy</p>
          </aside>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#pixelCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.bindEvents();
    this.startLoop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.dpr = dpr;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    this.resize();

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'e' && this.activeStation) {
        this.openModal(this.activeStation);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * this.vw;
      const clickY = ((e.clientY - rect.top) / rect.height) * this.vh;

      const clicked = this.stations.find(st => 
        clickX >= st.x && clickX <= st.x + st.w &&
        clickY >= st.y && clickY <= st.y + st.h
      );

      if (clicked) {
        this.player.targetX = clicked.x + clicked.w / 2;
        this.player.targetY = clicked.y + clicked.h + 16;
      } else {
        this.player.targetX = Math.max(40, Math.min(600, clickX));
        this.player.targetY = Math.max(50, Math.min(360, clickY));
      }
      sound.tick(900);
    });

    this.container.querySelector('#pixelModalClose')?.addEventListener('click', () => {
      this.closeModal();
    });
  }

  openModal(station) {
    const modal = this.container.querySelector('#pixelModal');
    if (!modal) return;

    this.container.querySelector('#pmBadge').textContent = station.badge;
    this.container.querySelector('#pmTitle').textContent = station.title;
    this.container.querySelector('#pmYear').textContent = station.year;
    this.container.querySelector('#pmCopy').textContent = station.copy;

    modal.hidden = false;
    sound.chipJingle();
  }

  closeModal() {
    const modal = this.container.querySelector('#pixelModal');
    if (modal) modal.hidden = true;
    sound.click(480, 0.02);
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
    let dx = 0;
    let dy = 0;

    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this.player.x += (dx / len) * this.player.speed;
      this.player.y += (dy / len) * this.player.speed;
      this.player.targetX = this.player.x;
      this.player.targetY = this.player.y;
      this.player.isMoving = true;
    } else if (Math.hypot(this.player.targetX - this.player.x, this.player.targetY - this.player.y) > 3) {
      const tdx = this.player.targetX - this.player.x;
      const tdy = this.player.targetY - this.player.y;
      const dist = Math.hypot(tdx, tdy);
      this.player.x += (tdx / dist) * this.player.speed;
      this.player.y += (tdy / dist) * this.player.speed;
      this.player.isMoving = true;
    } else {
      this.player.isMoving = false;
    }

    this.player.x = Math.max(40, Math.min(600, this.player.x));
    this.player.y = Math.max(50, Math.min(360, this.player.y));

    if (this.player.isMoving) {
      this.player.walkFrame += 0.22;
    }

    // Berry Dog gently follows player
    const dogTargetX = this.player.x - 36;
    const dogTargetY = this.player.y + 14;
    const dogDist = Math.hypot(dogTargetX - this.dog.x, dogTargetY - this.dog.y);
    if (dogDist > 8) {
      this.dog.x += (dogTargetX - this.dog.x) * 0.05;
      this.dog.y += (dogTargetY - this.dog.y) * 0.05;
    }
    this.dog.tailFrame += 0.15;
    this.cat.tailFrame += 0.08;

    // Check proximity to stations or companions
    let nearStation = null;
    this.stations.forEach(st => {
      const cx = st.x + st.w / 2;
      const cy = st.y + st.h / 2;
      if (Math.hypot(this.player.x - cx, this.player.y - cy) < 55) {
        nearStation = st;
      }
    });

    const statusEl = this.container.querySelector('#pixelStatus');
    if (nearStation !== this.activeStation) {
      this.activeStation = nearStation;
      if (statusEl) {
        statusEl.textContent = nearStation ? `NEAR: ${nearStation.name} [PRESS E / CLICK]` : 'EXPLORING STUDIO';
      }
      if (nearStation) sound.tick(1200);
    }
  }

  render(time) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    
    ctx.save();
    const scaleX = this.canvas.width / this.vw;
    const scaleY = this.canvas.height / this.vh;
    ctx.scale(scaleX, scaleY);
    ctx.imageSmoothingEnabled = false;

    // Studio Floor Grid
    for (let tx = 0; tx < 20; tx++) {
      for (let ty = 0; ty < 13; ty++) {
        const isAlternate = (tx + ty) % 2 === 0;
        ctx.fillStyle = isAlternate ? '#0f1317' : '#14181f';
        ctx.fillRect(tx * 32, ty * 32, 32, 32);
      }
    }

    // Studio Outer Walls
    ctx.fillStyle = '#080a0c';
    ctx.fillRect(0, 0, this.vw, 24);
    ctx.fillRect(0, 0, 24, this.vh);
    ctx.fillRect(this.vw - 24, 0, 24, this.vh);
    ctx.fillRect(0, this.vh - 24, this.vw, 24);

    ctx.strokeStyle = '#252d38';
    ctx.lineWidth = 2;
    ctx.strokeRect(23, 23, this.vw - 46, this.vh - 46);

    // Render Stations
    this.stations.forEach(st => {
      const isNear = (st === this.activeStation);

      // Station Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(st.x + 3, st.y + 3, st.w, st.h);

      // Base Structure
      ctx.fillStyle = isNear ? '#1a222c' : '#131820';
      ctx.fillRect(st.x, st.y, st.w, st.h);

      ctx.strokeStyle = isNear ? st.color : '#2d3744';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(st.x + 0.5, st.y + 0.5, st.w - 1, st.h - 1);

      // Station Pixel Art Contents
      if (st.id === 'windsim') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(st.x + 12, st.y + 14, 38, 20);
        ctx.fillStyle = '#080a0c';
        ctx.fillRect(st.x + 16, st.y + 18, 30, 12);
      } else if (st.id === 'berry') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(st.x + 16, st.y + 14, 28, 28);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(st.x + 24, st.y + 22, 12, 12);
      } else if (st.id === 'berrybot') {
        ctx.fillStyle = '#e2b340';
        ctx.fillRect(st.x + 14, st.y + 16, 52, 24);
        ctx.fillStyle = '#080a0c';
        ctx.fillRect(st.x + 10, st.y + 12, 60, 6);
        ctx.fillRect(st.x + 10, st.y + 38, 60, 6);
      } else if (st.id === 'hackathons') {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(st.x + 20, st.y + 12, 24, 18);
        ctx.fillRect(st.x + 28, st.y + 30, 8, 14);
      } else if (st.id === 'research') {
        ctx.fillStyle = '#a78bfa';
        ctx.fillRect(st.x + 12, st.y + 14, 12, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(st.x + 28, st.y + 14, 12, 28);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(st.x + 44, st.y + 14, 12, 28);
      } else if (st.id === 'education') {
        ctx.fillStyle = isNear ? '#38bdf8' : '#2b3644';
        ctx.fillRect(st.x + 18, st.y + 14, 32, 46);
      } else if (st.id === 'dog_berry') {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(st.x + 12, st.y + 12, 24, 14);
      } else if (st.id === 'cat_crispy') {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(st.x + 14, st.y + 12, 20, 14);
      }

      // Crisp Label Below Station
      ctx.fillStyle = isNear ? '#ffffff' : '#8b949e';
      ctx.font = '10px "Space Mono", monospace';
      ctx.fillText(st.name.split('//')[0].trim(), st.x, st.y + st.h + 14);

      if (isNear) {
        const bounce = Math.sin(time * 0.008) * 3;
        ctx.fillStyle = st.color;
        ctx.fillRect(st.x + st.w / 2 - 24, st.y - 18 + bounce, 48, 12);
        ctx.fillStyle = '#080a0c';
        ctx.font = 'bold 9px "Space Mono", monospace';
        ctx.fillText('[E] OPEN', st.x + st.w / 2 - 20, st.y - 9 + bounce);
      }
    });

    // Render Crispy Cat Sprite
    const cx = Math.round(this.cat.x);
    const cy = Math.round(this.cat.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(cx - 8, cy + 6, 16, 4);

    ctx.fillStyle = '#fbbf24'; // Orange tabby
    ctx.fillRect(cx - 7, cy - 6, 14, 10);
    ctx.fillRect(cx + 4, cy - 10, 8, 8); // Head
    ctx.fillStyle = '#fef3c7'; // Snout
    ctx.fillRect(cx + 8, cy - 6, 4, 3);
    ctx.fillStyle = '#d97706'; // Ears
    ctx.fillRect(cx + 5, cy - 13, 2, 3);
    ctx.fillRect(cx + 9, cy - 13, 2, 3);
    // Wagging tail
    const catTail = Math.sin(this.cat.tailFrame) * 3;
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 10, cy - 8 + catTail, 4, 4);

    // Render Berry Belgian Malinois Dog Sprite
    const dx = Math.round(this.dog.x);
    const dy = Math.round(this.dog.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(dx - 12, dy + 8, 24, 6);

    ctx.fillStyle = '#b45309'; // Rich fawn coat
    ctx.fillRect(dx - 10, dy - 8, 20, 14);
    ctx.fillRect(dx + 7, dy - 14, 10, 11); // Head
    ctx.fillStyle = '#1c1917'; // Black mask & muzzle
    ctx.fillRect(dx + 12, dy - 10, 6, 5);
    ctx.fillStyle = '#1c1917'; // Pointed Malinois ears
    ctx.fillRect(dx + 7, dy - 18, 3, 5);
    ctx.fillRect(dx + 12, dy - 18, 3, 5);
    // Legs
    ctx.fillStyle = '#78350f';
    ctx.fillRect(dx - 8, dy + 6, 4, 6);
    ctx.fillRect(dx + 4, dy + 6, 4, 6);
    // Wagging tail
    const dogTail = Math.sin(this.dog.tailFrame) * 4;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(dx - 14, dy - 10 + dogTail, 5, 4);

    // Render Player Character (Crisp Pixel Hero)
    const px = Math.round(this.player.x);
    const py = Math.round(this.player.y);
    const walkOffset = this.player.isMoving ? Math.sin(this.player.walkFrame) * 3 : 0;

    // Player Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px, py + 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Coat
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(px - 7, py - 6, 14, 14);

    // Head
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(px - 5, py - 18, 10, 10);

    // Dark Hair / Cap
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 6, py - 20, 12, 5);

    // Eyes
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(px - 2, py - 14, 3, 3);
    ctx.fillRect(px + 2, py - 14, 3, 3);

    // Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 5, py + 8, 4, 6 + walkOffset);
    ctx.fillRect(px + 1, py + 8, 4, 6 - walkOffset);

    ctx.restore();
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
