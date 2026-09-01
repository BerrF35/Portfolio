import { sound } from './audio.js';
import { WindSimulator } from './simWind.js';
import { AgentSimulator } from './simAgent.js';
import { RobotSimulator } from './simRobot.js';
import { PixelGameEngine } from './pixelGame.js';
import { TerminalEngine } from './terminal.js';
import { HARDWARE_DEFINITIONS } from './cadLoader.js';

export class DesktopManager {
  constructor(screenBody, onHardwareInspect, onExit) {
    this.container = screenBody;
    this.onHardwareInspect = onHardwareInspect;
    this.onExit = onExit;

    this.windows = new Map();
    this.activeWindowId = null;
    this.highestZ = 100;
    this.instances = new Map();

    this.apps = [
      { id: 'projects', icon: '▤', title: 'PROJECTS', detail: 'GITHUB ARCHIVE', category: 'DEV' },
      { id: 'windsim', icon: '≋', title: 'WINDSIM', detail: 'AERODYNAMICS CFD', category: 'SIM' },
      { id: 'berry', icon: '☍', title: 'BERRY AI', detail: 'DESKTOP ASSISTANT', category: 'AI' },
      { id: 'berrybot', icon: '◈', title: 'BERRYBOT', detail: 'TRACKED ROBOTICS', category: 'ROBOT' },
      { id: 'hardware', icon: '＋', title: 'HARDWARE 3D', detail: 'PI / ESP32 / CHASSIS', category: 'ENG' },
      { id: 'research', icon: '↗', title: 'RESEARCH', detail: '3 PAPERS IN PREP', category: 'SCI' },
      { id: 'about', icon: '◆', title: 'ABOUT', detail: 'PERSONNEL DOSSIER', category: 'BIO' },
      { id: 'terminal', icon: '_', title: 'TERMINAL', detail: 'COMMAND SHELL', category: 'SYS' },
      { id: 'timeline', icon: '▦', title: 'PIXEL WORLD', detail: 'PLAYABLE TIMELINE', category: 'GAME' },
      { id: 'contact', icon: '@', title: 'CONTACT', detail: 'DISPATCH CLIENT', category: 'NET' },
    ];

    this.init();
  }

  init() {
    this.renderDesktop();
    this.startClock();
  }

  renderDesktop() {
    this.container.innerHTML = `
      <div class="os-workspace">
        <header class="os-topbar">
          <div class="os-topbar__left">
            <button class="os-logo" id="osStartBtn" type="button" title="Open Command Shell">
              <span class="os-logo__mark">⬡</span>
              <b>JAIJITESH.OS</b>
              <span class="os-logo__ver">v2.6.4</span>
            </button>
            <div class="os-topbar__divider"></div>
            <nav class="os-topbar__nav">
              <button class="os-nav-link" data-app="projects" type="button">Projects</button>
              <button class="os-nav-link" data-app="windsim" type="button">WindSim</button>
              <button class="os-nav-link" data-app="berrybot" type="button">Robotics</button>
              <button class="os-nav-link" data-app="berry" type="button">Berry AI</button>
              <button class="os-nav-link" data-app="terminal" type="button">Terminal</button>
            </nav>
          </div>

          <div class="os-topbar__center">
            <div class="os-status-pill">
              <span class="os-status-pill__dot"></span>
              <span>HOST: WORKSTATION 16 // 7 HARDWARE NODES ONLINE</span>
            </div>
          </div>

          <div class="os-topbar__right">
            <button class="os-topbar__pill-btn" id="audioToggleBtn" type="button" title="Toggle Sound Synth">
              <span id="audioIcon">🔊 SOUND: ON</span>
            </button>
            <button class="os-topbar__pill-btn" id="themeToggleBtn" type="button" title="Toggle Color Theme">
              <span>◐ THEME</span>
            </button>
            <button class="os-topbar__exit-btn" id="osExitBtn" type="button" title="Return to 3D Workbench (ESC)">
              <span>EXIT TO BENCH</span>
              <i>&nearr;</i>
            </button>
          </div>
        </header>

        <main class="os-desktop-canvas" id="osDesktopGrid">
          <div class="os-dashboard-layout">
            
            <!-- Left Column: Engineer Profile & Node Stream -->
            <aside class="os-dash-sidebar">
              <div class="os-profile-card">
                <div class="os-profile-card__head">
                  <div class="os-avatar">JS</div>
                  <div>
                    <h3>Jaijitesh Suryaprakash</h3>
                    <p>B.Tech IT • VIT Vellore (2025–2029)</p>
                  </div>
                </div>
                <div class="os-profile-tags">
                  <span>CFD &amp; Aerodynamics</span>
                  <span>Autonomous Robotics</span>
                  <span>Local AI Agents</span>
                </div>
              </div>

              <div class="os-telemetry-widget">
                <div class="os-widget-head">
                  <span class="os-widget-title">HARDWARE TELEMETRY BUS</span>
                  <span class="os-widget-badge">LIVE</span>
                </div>
                <ul class="os-node-list">
                  <li data-app="hardware">
                    <span class="node-indicator node-ok"></span>
                    <span class="node-name">BerryBot Tracked Chassis</span>
                    <span class="node-meta">SolidWorks M4</span>
                  </li>
                  <li data-app="hardware">
                    <span class="node-indicator node-ok"></span>
                    <span class="node-name">Raspberry Pi 4 Model B</span>
                    <span class="node-meta">BCM2711 4GB</span>
                  </li>
                  <li data-app="hardware">
                    <span class="node-indicator node-ok"></span>
                    <span class="node-name">ESP32-WROOM Dual-Core</span>
                    <span class="node-meta">20kHz Motor PWM</span>
                  </li>
                  <li data-app="hardware">
                    <span class="node-indicator node-ok"></span>
                    <span class="node-name">Canon AT-1 Retro 35mm</span>
                    <span class="node-meta">Vision &amp; Optics</span>
                  </li>
                  <li data-app="hardware">
                    <span class="node-indicator node-ok"></span>
                    <span class="node-name">Refractor Telescope</span>
                    <span class="node-meta">Scientific Optics</span>
                  </li>
                  <li data-app="hardware">
                    <span class="node-indicator node-ok"></span>
                    <span class="node-name">Berry • Belgian Malinois</span>
                    <span class="node-meta">12yo Companion</span>
                  </li>
                  <li data-app="hardware">
                    <span class="node-indicator node-ok"></span>
                    <span class="node-name">Crispy • Companion Cat</span>
                    <span class="node-meta">10yo Supervisor</span>
                  </li>
                </ul>
              </div>
            </aside>

            <!-- Center Column: Application Bento Launchpad -->
            <section class="os-dash-main">
              <div class="os-section-header">
                <h2>Interactive Engineering Applications</h2>
                <span>10 RUNTIME MODULES READY</span>
              </div>

              <div class="os-app-bento">
                <!-- Featured App 1: WindSim -->
                <button class="os-bento-card os-bento-card--featured" data-app="windsim" type="button">
                  <div class="os-bento-card__badge">FEATURED // #1 BEST WORK</div>
                  <div class="os-bento-card__icon">≋</div>
                  <div class="os-bento-card__content">
                    <h4>WindSim &mdash; Aerodynamics CFD Lab</h4>
                    <p>Real-time Lattice Boltzmann Method aerodynamic wind sandbox with streamline generation and velocity field visualization.</p>
                  </div>
                  <span class="os-bento-card__launch">LAUNCH SIMULATOR &rarr;</span>
                </button>

                <!-- Featured App 2: Berry AI -->
                <button class="os-bento-card os-bento-card--featured" data-app="berry" type="button">
                  <div class="os-bento-card__badge">LOCAL AI AGENT</div>
                  <div class="os-bento-card__icon">☍</div>
                  <div class="os-bento-card__content">
                    <h4>Berry AI &mdash; Desktop Assistant</h4>
                    <p>Local-first autonomous desktop agent built in Python featuring CUA automation, Browser Relay, and Skill Codex.</p>
                  </div>
                  <span class="os-bento-card__launch">VIEW ARCHITECTURE &rarr;</span>
                </button>

                <!-- Regular Apps -->
                <button class="os-bento-card" data-app="berrybot" type="button">
                  <div class="os-bento-card__tag">ROBOTICS</div>
                  <div class="os-bento-card__icon">◈</div>
                  <h4>BerryBot Robotics</h4>
                  <p>Tracked kinematics, optical encoder telemetry, and S-curve motion profiling.</p>
                </button>

                <button class="os-bento-card" data-app="projects" type="button">
                  <div class="os-bento-card__tag">PORTFOLIO</div>
                  <div class="os-bento-card__icon">▤</div>
                  <h4>Projects Archive</h4>
                  <p>ImpactX 3.0 (3rd Place), FarmAssist AI, VinHack, and open-source systems.</p>
                </button>

                <button class="os-bento-card" data-app="terminal" type="button">
                  <div class="os-bento-card__tag">UNIX SHELL</div>
                  <div class="os-bento-card__icon">_</div>
                  <h4>Command Terminal</h4>
                  <p>Full interactive CLI with system commands, filesystem inspection, and logs.</p>
                </button>

                <button class="os-bento-card" data-app="timeline" type="button">
                  <div class="os-bento-card__tag">INTERACTIVE</div>
                  <div class="os-bento-card__icon">▦</div>
                  <h4>Pixel World</h4>
                  <p>High-DPI playable memory timeline featuring Berry &amp; Crispy pixel sprites.</p>
                </button>

                <button class="os-bento-card" data-app="research" type="button">
                  <div class="os-bento-card__tag">ACADEMIC</div>
                  <div class="os-bento-card__icon">↗</div>
                  <h4>Research Papers</h4>
                  <p>Synthetic data generation and spectral color-space analysis with faculty group.</p>
                </button>

                <button class="os-bento-card" data-app="hardware" type="button">
                  <div class="os-bento-card__tag">PHYSICAL 3D</div>
                  <div class="os-bento-card__icon">＋</div>
                  <h4>Hardware 3D CAD</h4>
                  <p>Inspect CAD nodes, single-board compute, and sensors directly in 3D.</p>
                </button>

                <button class="os-bento-card" data-app="about" type="button">
                  <div class="os-bento-card__tag">BIO</div>
                  <div class="os-bento-card__icon">◆</div>
                  <h4>About Dossier</h4>
                  <p>Academic record, background, companion history, and philosophy.</p>
                </button>

                <button class="os-bento-card" data-app="contact" type="button">
                  <div class="os-bento-card__tag">NETWORK</div>
                  <div class="os-bento-card__icon">@</div>
                  <h4>Contact Dispatch</h4>
                  <p>Direct communication channels, email dispatch, and social profiles.</p>
                </button>
              </div>
            </section>

            <!-- Right Column: System Status & Quick Shortcuts -->
            <aside class="os-dash-status">
              <div class="os-stat-card">
                <div class="os-stat-card__label">SYSTEM STATUS</div>
                <div class="os-stat-card__val">OPTIMAL</div>
                <div class="os-stat-card__sub">WebGL2 Hardware Accelerated</div>
              </div>

              <div class="os-stat-card">
                <div class="os-stat-card__label">ACADEMIC PROFILE</div>
                <div class="os-stat-card__val">VIT VELLORE</div>
                <div class="os-stat-card__sub">B.Tech IT • 2025–2029</div>
              </div>

              <div class="os-shortcuts-widget">
                <div class="os-widget-head">
                  <span class="os-widget-title">KEYBOARD SHORTCUTS</span>
                </div>
                <div class="os-shortcut-row"><kbd>ESC</kbd> <span>Return to 3D Bench</span></div>
                <div class="os-shortcut-row"><kbd>T</kbd> <span>Command Shell</span></div>
                <div class="os-shortcut-row"><kbd>W</kbd> <span>WindSim CFD Lab</span></div>
                <div class="os-shortcut-row"><kbd>B</kbd> <span>BerryBot Simulator</span></div>
              </div>

              <div class="os-bench-return-card">
                <button class="os-bench-return-btn" id="osSideBenchBtn" type="button">
                  <span>&larr; RETURN TO 3D BENCH</span>
                </button>
              </div>
            </aside>

          </div>
        </main>

        <div class="os-windows-layer" id="osWindowsLayer"></div>

        <footer class="os-taskbar">
          <div class="os-taskbar__left-controls">
            <button class="os-taskbar__back" id="osTaskbarBackBtn" type="button">
              &larr; 3D BENCH
            </button>
            <div class="os-taskbar__tasks" id="osTaskbarItems"></div>
          </div>
          <div class="os-taskbar__tray">
            <span class="taskbar-badge">VIT VELLORE</span>
            <span id="osClock">00:00:00</span>
            <span class="taskbar-zone">IST (+05:30)</span>
          </div>
        </footer>
      </div>
    `;

    this.bindDesktopEvents();
  }

  bindDesktopEvents() {
    this.container.querySelectorAll('[data-app]').forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.dataset.app;
        this.openApp(appId);
        sound.click(720, 0.02);
      });
    });

    this.container.querySelector('#audioToggleBtn')?.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      const icon = this.container.querySelector('#audioIcon');
      if (icon) icon.textContent = isMuted ? '🔇 SOUND: MUTED' : '🔊 SOUND: ON';
      sound.click(880, 0.02);
    });

    this.container.querySelector('#themeToggleBtn')?.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      sound.tick(1100);
    });

    const handleExit = () => {
      sound.click(380, 0.03);
      this.onExit?.();
    };

    this.container.querySelector('#osTopBackBtn')?.addEventListener('click', handleExit);
    this.container.querySelector('#osTaskbarBackBtn')?.addEventListener('click', handleExit);
    this.container.querySelector('#osExitBtn')?.addEventListener('click', handleExit);
    this.container.querySelector('#osSideBenchBtn')?.addEventListener('click', handleExit);

    this.container.querySelector('#osStartBtn')?.addEventListener('click', () => {
      this.openApp('terminal');
    });
  }

  startClock() {
    const clockEl = this.container.querySelector('#osClock');
    const update = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      }
    };
    update();
    setInterval(update, 1000);
  }

  openApp(id) {
    if (this.windows.has(id)) {
      const winEl = this.windows.get(id);
      winEl.classList.remove('is-minimized');
      this.focusWindow(id);
      return;
    }

    const appDef = this.apps.find(a => a.id === id);
    if (!appDef) return;

    this.highestZ++;
    const win = document.createElement('div');
    win.className = 'os-window is-maximized'; // Maximize inside the screen frame by default for seamless desktop interaction
    win.id = `win_${id}`;
    win.style.zIndex = this.highestZ;

    win.innerHTML = `
      <div class="os-win-titlebar">
        <div class="os-win-title">
          <span class="win-icon">${appDef.icon}</span>
          <b>${appDef.title}</b>
          <small>// ${appDef.detail}</small>
        </div>
        <div class="os-win-controls">
          <button class="win-btn win-min" data-win-action="min" type="button" title="Minimize">—</button>
          <button class="win-btn win-max" data-win-action="max" type="button" title="Toggle Fullscreen">□</button>
          <button class="win-btn win-close" data-win-action="close" type="button" title="Close">&times;</button>
        </div>
      </div>
      <div class="os-win-body" id="body_${id}"></div>
    `;

    const layer = this.container.querySelector('#osWindowsLayer');
    layer.appendChild(win);
    this.windows.set(id, win);
    this.focusWindow(id);
    this.updateTaskbar();

    this.setupWindowInteractions(win, id);
    this.mountAppContent(id, win.querySelector(`#body_${id}`));
  }

  setupWindowInteractions(win, id) {
    const titlebar = win.querySelector('.os-win-titlebar');

    win.addEventListener('mousedown', () => this.focusWindow(id));

    let isDragging = false;
    let startX, startY, origLeft, origTop;

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.os-win-controls') || win.classList.contains('is-maximized')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = win.getBoundingClientRect();
      const parentRect = this.container.getBoundingClientRect();
      origLeft = rect.left - parentRect.left;
      origTop = rect.top - parentRect.top;
      this.focusWindow(id);
      sound.tick(900);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.style.left = `${Math.max(0, origLeft + dx)}px`;
      win.style.top = `${Math.max(34, origTop + dy)}px`;
      win.style.transform = 'none';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) isDragging = false;
    });

    win.querySelector('.win-close').addEventListener('click', () => this.closeWindow(id));
    win.querySelector('.win-min').addEventListener('click', () => this.minimizeWindow(id));
    win.querySelector('.win-max').addEventListener('click', () => this.toggleMaximize(win));
  }

  focusWindow(id) {
    this.activeWindowId = id;
    this.highestZ++;
    const win = this.windows.get(id);
    if (win) {
      win.style.zIndex = this.highestZ;
      this.container.querySelectorAll('.os-window').forEach(w => w.classList.remove('is-focused'));
      win.classList.add('is-focused');
    }
    this.updateTaskbar();
  }

  minimizeWindow(id) {
    const win = this.windows.get(id);
    if (win) {
      win.classList.add('is-minimized');
      sound.click(420, 0.02);
      this.updateTaskbar();
    }
  }

  toggleMaximize(win) {
    win.classList.toggle('is-maximized');
    if (!win.classList.contains('is-maximized')) {
      win.style.top = '40px';
      win.style.left = '40px';
      win.style.width = 'calc(100% - 80px)';
      win.style.height = 'calc(100% - 80px)';
    } else {
      win.style.top = '0';
      win.style.left = '0';
      win.style.width = '100%';
      win.style.height = '100%';
    }
    sound.click(650, 0.02);
  }

  closeWindow(id) {
    const win = this.windows.get(id);
    if (win) {
      const inst = this.instances.get(id);
      if (inst?.destroy) inst.destroy();
      this.instances.delete(id);

      win.remove();
      this.windows.delete(id);
      sound.click(320, 0.03);
      this.updateTaskbar();
    }
  }

  updateTaskbar() {
    const taskbar = this.container.querySelector('#osTaskbarItems');
    if (!taskbar) return;

    taskbar.innerHTML = Array.from(this.windows.keys()).map(id => {
      const app = this.apps.find(a => a.id === id);
      const isFocused = this.activeWindowId === id;
      const isMin = this.windows.get(id)?.classList.contains('is-minimized');
      return `
        <button class="taskbar-item ${isFocused && !isMin ? 'is-active' : ''}" data-task-id="${id}" type="button">
          <span>${app.icon}</span>
          <b>${app.title}</b>
        </button>
      `;
    }).join('');

    taskbar.querySelectorAll('[data-task-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.taskId;
        const win = this.windows.get(id);
        if (win.classList.contains('is-minimized')) {
          win.classList.remove('is-minimized');
          this.focusWindow(id);
        } else if (this.activeWindowId === id) {
          this.minimizeWindow(id);
        } else {
          this.focusWindow(id);
        }
      });
    });
  }

  mountAppContent(id, body) {
    if (id === 'windsim') {
      const sim = new WindSimulator(body);
      this.instances.set(id, sim);
    } else if (id === 'berry') {
      const sim = new AgentSimulator(body);
      this.instances.set(id, sim);
    } else if (id === 'berrybot') {
      const sim = new RobotSimulator(body);
      this.instances.set(id, sim);
    } else if (id === 'timeline') {
      const game = new PixelGameEngine(body);
      this.instances.set(id, game);
    } else if (id === 'terminal') {
      const term = new TerminalEngine(
        body,
        (navId) => this.openApp(navId),
        (cadId) => this.onHardwareInspect?.(cadId),
        (simId) => this.openApp(simId)
      );
      this.instances.set(id, term);
    } else if (id === 'projects') {
      this.renderProjectsApp(body);
    } else if (id === 'hardware') {
      this.renderHardwareApp(body);
    } else if (id === 'about') {
      this.renderAboutApp(body);
    } else if (id === 'research') {
      this.renderResearchApp(body);
    } else if (id === 'contact') {
      this.renderContactApp(body);
    }
  }

  renderProjectsApp(body) {
    const list = [
      {
        id: 'windsim',
        num: '01',
        title: 'WINDSIM (BEST WORK)',
        detail: 'BROWSER-BASED AERODYNAMICS & CFD PLATFORM',
        meta: 'Reduced-order wind sandbox & deterministic CFD lab with LBM simulation, streamlines, slices, and surface visualization.',
        link: 'https://berrf35.github.io/Windsim/',
        repo: 'BerrF35/Windsim (JavaScript, MIT)',
        type: 'sim'
      },
      {
        id: 'berry',
        num: '02',
        title: 'BERRY (DESKTOP AI ASSISTANT)',
        detail: 'LOCAL-FIRST DESKTOP AGENT BRIDGING LLMS WITH OS',
        meta: 'Core Engine, Berry CUA (Computer Use Agent sidecar), Browser Relay (Chromium bridge), Skill Codex, and Berry Vault persistent memory.',
        repo: 'BerrF35/Berry (Python, AGPL-3.0)',
        type: 'sim'
      },
      {
        id: 'berrybot',
        num: '03',
        title: 'BERRYBOT',
        detail: 'TRACKED AUTONOMOUS ROBOTICS PLATFORM',
        meta: 'Built entirely around Waveshare ESP32 controller. Encoder-based motion control, S-curve trajectories, path tracking, return-to-home.',
        repo: 'BerrF35/BerryBot (SolidWorks CAD + ESP32 C++)',
        type: 'sim'
      },
      {
        id: 'farmassist',
        num: '04',
        title: 'FARMASSIST AI',
        detail: 'AI-ASSISTED AGRICULTURE & EDGE COMPUTER VISION',
        meta: 'Yantra 26 Central Hack. Lead & Primary Developer. Edge computer vision crop diagnostics.',
        repo: 'BerrF35/FarmAssist',
        type: 'info'
      },
      {
        id: 'research',
        num: '05',
        title: 'RESEARCH (3 PAPERS IN PREPARATION)',
        detail: '5-PERSON RESEARCH GROUP WITH PROFESSOR',
        meta: 'Synthetic data generation pipelines (synthetic-data-generator), spectral color-space image analysis (color-splitter), vision systems.',
        repo: 'BerrF35/synthetic-data-generator & color-splitter',
        type: 'page'
      },
      {
        id: 'impactx',
        num: '06',
        title: 'IMPACTX 3.0 (3RD PLACE OVERALL)',
        detail: 'HYPERLOCAL SERVICE MARKETPLACE',
        meta: 'Hackathon Lead & Primary Coder. Architected core dispatch and real-time backend.',
        type: 'info'
      },
      {
        id: 'other_repos',
        num: '07',
        title: 'OTHER GITHUB REPOSITORIES',
        detail: 'BROAD TECHNICAL EXPERIMENTS & SOFTWARE',
        meta: 'gesturecontrolpc, speaksafe, imagegen, Agrichain, AI property damage detection & cost estimation, Performance Monitor.',
        repo: 'github.com/BerrF35',
        type: 'info'
      }
    ];

    body.innerHTML = `
      <div class="projects-app">
        <aside class="projects-sidebar">
          <div class="sidebar-head">JAIJITESH // GITHUB ARCHIVE</div>
          <div class="sidebar-tree">
            <div>&boxur;&boxh; 01_WINDSIM (CFD Lab)</div>
            <div>&boxur;&boxh; 02_BERRY (Desktop AI)</div>
            <div>&boxur;&boxh; 03_BERRYBOT (Tracked Robot)</div>
            <div>&boxur;&boxh; 04_FARMASSIST (AI Ag)</div>
            <div>&boxur;&boxh; 05_RESEARCH (3 Papers)</div>
            <div>&boxur;&boxh; 06_IMPACTX (3rd Place)</div>
            <div>&boxur;&boxh; 07_OTHER_REPOS</div>
          </div>
          <div class="sidebar-note">
            Each entry opens an interactive simulation, 3D model, or repository inspector.
          </div>
        </aside>

        <div class="projects-content">
          <div class="projects-head">
            <span>REPOSITORY DIRECTORY (GITHUB.COM/BERRF35)</span>
            <span>07 ARCHIVES</span>
          </div>

          <div class="projects-list">
            ${list.map(p => `
              <button class="project-entry" data-p-id="${p.id}" data-p-type="${p.type}" type="button">
                <span class="entry-num">${p.num}</span>
                <div class="entry-info">
                  <b>${p.title}</b>
                  <p>${p.detail}</p>
                  <small>${p.meta}</small>
                  ${p.repo ? `<div class="entry-repo-tag">${p.repo}</div>` : ''}
                </div>
                <span class="entry-launch">${p.link ? 'OPEN LIVE ↗' : 'LAUNCH ↗'}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    body.querySelectorAll('.project-entry').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.pId;
        const ptype = btn.dataset.pType;

        if (pid === 'windsim') {
          this.openApp('windsim');
        } else if (pid === 'berry') {
          this.openApp('berry');
        } else if (pid === 'berrybot') {
          this.openApp('berrybot');
        } else if (pid === 'research') {
          this.openApp('research');
        } else if (pid === 'farmassist' || pid === 'impactx' || pid === 'other_repos') {
          this.openApp('about');
        }
        sound.click(800, 0.02);
      });
    });
  }

  renderHardwareApp(body) {
    body.innerHTML = `
      <div class="lab-app">
        <div class="lab-app__intro">
          <div class="lab-badge">PHYSICAL COMPUTING, SENSING &amp; LAB COMPANIONS</div>
          <h2>Hardware Systems, Optics &amp; Companions</h2>
          <p>Explore the physical systems and companions in the 3D studio. Click any card to fly the camera directly to the 3D model and inspect its telemetry.</p>
        </div>

        <div class="lab-app__grid">
          <button class="lab-card" data-hw="robot" type="button">
            <span class="lab-card__num">01</span>
            <div class="lab-card__info">
              <b>BERRYBOT // TRACKED ROBOTICS PLATFORM</b>
              <p>Differential drive tracked chassis built around Waveshare ESP32 controller, dual DC motors, and optical encoders.</p>
            </div>
            <span class="lab-card__action">INSPECT 3D ON BENCH ↗</span>
          </button>

          <button class="lab-card" data-hw="raspberry" type="button">
            <span class="lab-card__num">02</span>
            <div class="lab-card__info">
              <b>RASPBERRY PI 4 // MODEL B</b>
              <p>Broadcom BCM2711 quad-core SoC, USB 3.0, Gigabit Ethernet, and 40-Pin GPIO edge processing node.</p>
            </div>
            <span class="lab-card__action">INSPECT 3D ON BENCH ↗</span>
          </button>

          <button class="lab-card" data-hw="esp32" type="button">
            <span class="lab-card__num">03</span>
            <div class="lab-card__info">
              <b>ESP32-WROOM // DUAL-CORE MCU</b>
              <p>240MHz Xtensa dual-core processor driving motor PWM generation, optical encoder counts, and sensor telemetry.</p>
            </div>
            <span class="lab-card__action">INSPECT 3D ON BENCH ↗</span>
          </button>

          <button class="lab-card" data-hw="dog" type="button">
            <span class="lab-card__num">04</span>
            <div class="lab-card__info">
              <b>BERRY // 12-YEAR-OLD BELGIAN MALINOIS</b>
              <p>Loyal companion dog and namesake/inspiration behind both the Berry AI Agent and BerryBot Tracked Robotics.</p>
            </div>
            <span class="lab-card__action">INSPECT 3D IN ROOM ↗</span>
          </button>

          <button class="lab-card" data-hw="cat" type="button">
            <span class="lab-card__num">05</span>
            <div class="lab-card__info">
              <b>CRISPY // 10-YEAR-OLD COMPANION CAT</b>
              <p>Faithful companion cat resting on the workbench, supervising firmware updates and research experiments.</p>
            </div>
            <span class="lab-card__action">INSPECT 3D ON BENCH ↗</span>
          </button>

          <button class="lab-card" data-hw="camera" type="button">
            <span class="lab-card__num">06</span>
            <div class="lab-card__info">
              <b>CANON AT-1 // 35MM RETRO OPTICS</b>
              <p>Classic SLR camera body representing computer vision, photogrammetry data pipelines, and spectral image analysis.</p>
            </div>
            <span class="lab-card__action">INSPECT 3D ON BENCH ↗</span>
          </button>

          <button class="lab-card" data-hw="telescope" type="button">
            <span class="lab-card__num">07</span>
            <div class="lab-card__info">
              <b>REFRACTOR TELESCOPE // SCIENTIFIC OPTICS</b>
              <p>Precision astronomical refractor telescope standing in the studio corner, representing mathematical modeling and observation.</p>
            </div>
            <span class="lab-card__action">INSPECT 3D IN ROOM ↗</span>
          </button>
        </div>
      </div>
    `;

    body.querySelectorAll('[data-hw]').forEach(btn => {
      btn.addEventListener('click', () => {
        const hwKey = btn.dataset.hw;
        this.onHardwareInspect?.(hwKey);
        sound.click(850, 0.02);
      });
    });
  }

  renderAboutApp(body) {
    body.innerHTML = `
      <div class="about-app">
        <header class="about-head">
          <div class="about-dossier-badge">PERSONNEL DOSSIER // JAIJITESH SURYAPRAKASH</div>
          <h1>Jaijitesh<br/><em>Suryaprakash</em></h1>
          <p class="about-sub">B.Tech Information Technology &bull; Vellore Institute of Technology (VIT), Vellore (2025–2029)</p>
        </header>

        <div class="about-columns">
          <div class="about-col">
            <h3>PROFILE &amp; BACKGROUND</h3>
            <p>Information Technology undergraduate at VIT Vellore (current 1st year). Schooling at SCTS (10th: 93.4%, 12th: 76.4%), current CGPA: 5.89.</p>
            <p>Hands-on builder and technical lead working across software development, AI agents, scientific computing, computer vision, data synthesis, and physical autonomous robotics.</p>
            
            <h3 style="margin-top: 18px;">HACKATHON LEADERSHIP</h3>
            <p>&bull; <b>ImpactX 3.0:</b> 3rd Place Overall (Hyperlocal service marketplace) &mdash; Lead &amp; Primary Coder.</p>
            <p>&bull; <b>Yantra '26 Central Hack:</b> FarmAssist AI (AI-assisted agriculture) &mdash; Lead &amp; Primary Developer.</p>
            <p>&bull; <b>Vinhack 25:</b> P2P book exchange platform &mdash; Lead &amp; Primary Coder.</p>
          </div>

          <div class="about-col">
            <h3>VERIFIED TECHNICAL SKILLS</h3>
            <div class="skill-group-title">LANGUAGES</div>
            <div class="skill-tags">
              <span class="tag">Python</span>
              <span class="tag">Java</span>
              <span class="tag">C</span>
              <span class="tag">C++</span>
              <span class="tag">JavaScript</span>
              <span class="tag">HTML</span>
              <span class="tag">CSS</span>
              <span class="tag">SQL</span>
            </div>

            <div class="skill-group-title">FRAMEWORKS &amp; TOOLS</div>
            <div class="skill-tags">
              <span class="tag">React</span>
              <span class="tag">Node.js</span>
              <span class="tag">Flask</span>
              <span class="tag">FastAPI</span>
              <span class="tag">REST APIs</span>
              <span class="tag">Three.js</span>
              <span class="tag">GSAP</span>
              <span class="tag">SolidWorks CAD</span>
            </div>

            <div class="skill-group-title">HARDWARE &amp; ROBOTICS</div>
            <div class="skill-tags">
              <span class="tag">Arduino</span>
              <span class="tag">Raspberry Pi</span>
              <span class="tag">ESP32 (Waveshare)</span>
              <span class="tag">Motor Control</span>
              <span class="tag">Optical Encoders</span>
              <span class="tag">S-Curve Motion</span>
              <span class="tag">Path Tracking</span>
              <span class="tag">Return-to-Home</span>
            </div>

            <div class="skill-group-title">AI &amp; COMPUTATION</div>
            <div class="skill-tags">
              <span class="tag">LLMs</span>
              <span class="tag">AI Agents</span>
              <span class="tag">Computer Vision</span>
              <span class="tag">Image Processing</span>
              <span class="tag">Data Synthesis</span>
              <span class="tag">CFD / LBM</span>
              <span class="tag">Browser Automation</span>
            </div>
          </div>
        </div>

        <div class="about-metrics-row">
          <div class="about-metric"><span>EDUCATION</span><b>VIT Vellore (2025–2029)</b></div>
          <div class="about-metric"><span>SCHOOL (SCTS)</span><b>10th: 93.4% &bull; 12th: 76.4%</b></div>
          <div class="about-metric"><span>PHONE</span><b>+91 9940970749</b></div>
          <div class="about-metric"><span>GITHUB</span><b>@BerrF35</b></div>
        </div>
      </div>
    `;
  }

  renderResearchApp(body) {
    body.innerHTML = `
      <div class="research-app">
        <header class="research-head">
          <div class="research-badge">ACTIVE RESEARCH // 5-PERSON GROUP &amp; PROFESSOR</div>
          <h2>3 Research Papers in Preparation</h2>
          <p>Current active investigations exploring data synthesis pipelines, spectral color-space image analysis, and autonomous machine vision.</p>
        </header>

        <div class="research-papers">
          <article class="paper-card">
            <div class="paper-num">PAPER 01 // IN PREPARATION</div>
            <h3>Synthetic Data Generation Pipelines</h3>
            <p>Associated repository: <b>BerrF35/synthetic-data-generator</b>. Investigating procedural data synthesis and domain randomization for training robust perception networks.</p>
            <div class="paper-tags"><span>DATA SYNTHESIS</span><span>GENERATIVE PIPELINES</span><span>ML ROBUSTNESS</span></div>
          </article>

          <article class="paper-card">
            <div class="paper-num">PAPER 02 // IN PREPARATION</div>
            <h3>Spectral Color-Space Image Processing &amp; Analysis</h3>
            <p>Associated repository: <b>BerrF35/color-splitter</b>. Formulating mathematical chromaticity transformations and color-based image analysis algorithms.</p>
            <div class="paper-tags"><span>COLOR MANIFOLDS</span><span>IMAGE PROCESSING</span><span>SPECTRAL ANALYSIS</span></div>
          </article>

          <article class="paper-card">
            <div class="paper-num">PAPER 03 // IN PREPARATION</div>
            <h3>Autonomous Vision &amp; Spatial Robotics Systems</h3>
            <p>Collaborative research with university professor and 5-person group focusing on edge sensor integration and real-time control.</p>
            <div class="paper-tags"><span>ROBOTICS</span><span>EDGE VISION</span><span>CONTROL SYSTEMS</span></div>
          </article>
        </div>
      </div>
    `;
  }

  renderContactApp(body) {
    body.innerHTML = `
      <div class="contact-app">
        <div class="contact-head">
          <div class="contact-badge">DIRECT TELEMETRY &amp; CONTACT</div>
          <h2>Jaijitesh Suryaprakash</h2>
          <p>Open for engineering roles, technical architecture collaborations, autonomous systems development, and research discussions.</p>
        </div>

        <div class="contact-grid">
          <a class="contact-card" href="mailto:jaijitesh.2025@vitstudent.ac.in">
            <span class="contact-label">EMAIL ADDRESS</span>
            <b>jaijitesh.2025@vitstudent.ac.in</b>
            <span class="contact-action">SEND DISPATCH ↗</span>
          </a>

          <a class="contact-card" href="tel:+919940970749">
            <span class="contact-label">PHONE / DIRECT LINE</span>
            <b>+91 9940970749</b>
            <span class="contact-action">CALL TELEMETRY ↗</span>
          </a>

          <a class="contact-card" href="https://www.linkedin.com/in/jaijitesh-suryaprakash-j" target="_blank" rel="noreferrer">
            <span class="contact-label">LINKEDIN PROFILE</span>
            <b>linkedin.com/in/jaijitesh-suryaprakash-j</b>
            <span class="contact-action">CONNECT ↗</span>
          </a>

          <a class="contact-card" href="https://github.com/BerrF35" target="_blank" rel="noreferrer">
            <span class="contact-label">GITHUB CODE ARCHIVE</span>
            <b>github.com/BerrF35</b>
            <span class="contact-action">INSPECT REPOSITORIES ↗</span>
          </a>

          <a class="contact-card" href="https://berrf35.github.io/Windsim/" target="_blank" rel="noreferrer" style="grid-column: 1 / -1;">
            <span class="contact-label">WINDSIM LIVE DEPLOYMENT</span>
            <b>https://berrf35.github.io/Windsim/</b>
            <span class="contact-action">LAUNCH AERODYNAMICS PLATFORM ↗</span>
          </a>
        </div>
      </div>
    `;
  }
}
