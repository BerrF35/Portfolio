import { sound } from '../core/audio.js';
import { WindSimulator } from '../apps/simWind.js';
import { BerryBotSimulator } from '../apps/simRobot.js';
import { BerryAgentVisualizer } from '../apps/simAgent.js';
import { TerminalApp } from './terminal.js';
import { PixelGameEngine } from './pixelGame.js';

export class DesktopManager {
  constructor(rootContainer, onInspect3D, onExitLaptop) {
    this.root = rootContainer;
    this.onInspect3D = onInspect3D;
    this.onExitLaptop = onExitLaptop;

    this.windows = new Map();
    this.activeAppInstances = new Map();
    this.topZIndex = 100;
    this.theme = 'dark'; // 'dark' | 'matrix' | 'light'

    this.init();
  }

  init() {
    this.root.innerHTML = `
      <div class="os-desktop" id="osDesktop">
        <!-- Top Menu Bar -->
        <header class="os-menubar">
          <div class="os-menubar__left">
            <button class="os-apple-btn" id="osMenuBtn" type="button">
              <b>JAIJITESH.OS</b><span>v2.6.4</span>
            </button>
            <div class="os-menubar__items">
              <button class="os-menu-item" data-open="about" type="button">DOSSIER</button>
              <button class="os-menu-item" data-open="projects" type="button">PROJECTS</button>
              <button class="os-menu-item" data-open="hardware" type="button">HARDWARE</button>
              <button class="os-menu-item" data-open="terminal" type="button">TERMINAL</button>
            </div>
          </div>

          <div class="os-menubar__right">
            <button class="os-pill-btn" id="themeToggle" type="button" title="Toggle Theme">
              <span id="themeLabel">THEME: OBSIDIAN</span>
            </button>
            <button class="os-pill-btn" id="audioToggle" type="button" title="Toggle Audio Synthesizer">
              <span id="audioLabel">AUDIO: ON</span>
            </button>
            <span class="os-clock" id="osClock">11:48:00 IST</span>
            <button class="os-exit-btn" id="osExitBtn" type="button">
              &larr; BACK TO BENCH
            </button>
          </div>
        </header>

        <!-- Desktop Surface & App Canvas -->
        <main class="os-workspace" id="osWorkspace">
          <!-- Desktop Quick Icons Grid -->
          <div class="os-desktop-icons">
            <button class="os-desktop-icon" data-open="windsim" type="button">
              <span class="os-desktop-icon__glyph">🌪</span>
              <span class="os-desktop-icon__label">WindSim.app</span>
            </button>

            <button class="os-desktop-icon" data-open="berrybot" type="button">
              <span class="os-desktop-icon__glyph">🤖</span>
              <span class="os-desktop-icon__label">BerryBot.app</span>
            </button>

            <button class="os-desktop-icon" data-open="berry" type="button">
              <span class="os-desktop-icon__glyph">🧠</span>
              <span class="os-desktop-icon__label">BerryAgent.app</span>
            </button>

            <button class="os-desktop-icon" data-open="pixel" type="button">
              <span class="os-desktop-icon__glyph">🕹</span>
              <span class="os-desktop-icon__label">MemoryWorld.bin</span>
            </button>

            <button class="os-desktop-icon" data-open="terminal" type="button">
              <span class="os-desktop-icon__glyph">&gt;_</span>
              <span class="os-desktop-icon__label">Terminal.sh</span>
            </button>

            <button class="os-desktop-icon" data-open="about" type="button">
              <span class="os-desktop-icon__glyph">📄</span>
              <span class="os-desktop-icon__label">Dossier.pdf</span>
            </button>
          </div>

          <!-- Windows Container -->
          <div class="os-windows" id="osWindows"></div>
        </main>

        <!-- Bottom macOS/NextStyle Glass Dock -->
        <footer class="os-dock">
          <button class="os-dock__item" data-open="about" title="Engineering Dossier & Bio" type="button">
            <span class="os-dock__icon">📄</span>
            <span class="os-dock__dot"></span>
          </button>
          <button class="os-dock__item" data-open="windsim" title="WindSim Aerodynamics CFD" type="button">
            <span class="os-dock__icon">🌪</span>
            <span class="os-dock__dot"></span>
          </button>
          <button class="os-dock__item" data-open="berrybot" title="BerryBot Autonomous Robotics Platform" type="button">
            <span class="os-dock__icon">🤖</span>
            <span class="os-dock__dot"></span>
          </button>
          <button class="os-dock__item" data-open="berry" title="Berry Desktop AI Agent (Python)" type="button">
            <span class="os-dock__icon">🧠</span>
            <span class="os-dock__dot"></span>
          </button>
          <button class="os-dock__item" data-open="projects" title="Engineering Projects & Hackathons" type="button">
            <span class="os-dock__icon">⚡</span>
            <span class="os-dock__dot"></span>
          </button>
          <button class="os-dock__item" data-open="hardware" title="3D Hardware Telemetry Inspector" type="button">
            <span class="os-dock__icon">📐</span>
            <span class="os-dock__dot"></span>
          </button>
          <button class="os-dock__item" data-open="pixel" title="Playable Retro Memory World" type="button">
            <span class="os-dock__icon">🕹</span>
            <span class="os-dock__dot"></span>
          </button>
          <button class="os-dock__item" data-open="terminal" title="Interactive CLI Terminal" type="button">
            <span class="os-dock__icon">&gt;_</span>
            <span class="os-dock__dot"></span>
          </button>
        </footer>
      </div>
    `;

    this.windowsContainer = this.root.querySelector('#osWindows');
    this.bindEvents();
    this.startClock();

    // Open default Dossier & Terminal windows on boot
    this.openWindow('about');
  }

  bindEvents() {
    // Dock & Menu & Icon clicks
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open]');
      if (btn) {
        const appKey = btn.dataset.open;
        this.openWindow(appKey);
        sound.click(650, 0.03);
      }
    });

    this.root.querySelector('#osExitBtn')?.addEventListener('click', () => {
      this.onExitLaptop?.();
    });

    this.root.querySelector('#themeToggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    this.root.querySelector('#audioToggle')?.addEventListener('click', () => {
      const isAudible = sound.toggleMute();
      this.root.querySelector('#audioLabel').textContent = isAudible ? 'AUDIO: ON' : 'AUDIO: MUTED';
    });
  }

  toggleTheme() {
    const desktop = this.root.querySelector('#osDesktop');
    const label = this.root.querySelector('#themeLabel');

    if (this.theme === 'dark') {
      this.theme = 'matrix';
      desktop.dataset.theme = 'matrix';
      label.textContent = 'THEME: MATRIX';
    } else if (this.theme === 'matrix') {
      this.theme = 'light';
      desktop.dataset.theme = 'light';
      label.textContent = 'THEME: SOLAR';
    } else {
      this.theme = 'dark';
      desktop.dataset.theme = 'dark';
      label.textContent = 'THEME: OBSIDIAN';
    }
    sound.tick(1200);
  }

  startClock() {
    const clockEl = this.root.querySelector('#osClock');
    const update = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false }) + ' IST';
    };
    setInterval(update, 1000);
    update();
  }

  openWindow(appKey) {
    if (this.windows.has(appKey)) {
      const win = this.windows.get(appKey);
      this.bringToFront(win);
      return;
    }

    const winEl = document.createElement('article');
    winEl.className = 'os-window';
    winEl.dataset.app = appKey;
    winEl.style.zIndex = ++this.topZIndex;

    const def = this.getAppDefinition(appKey);
    winEl.innerHTML = `
      <header class="os-window__titlebar">
        <div class="os-window__traffic-lights">
          <button class="tl tl--close" data-win-action="close" type="button" aria-label="Close"></button>
          <button class="tl tl--min" data-win-action="minimize" type="button" aria-label="Minimize"></button>
          <button class="tl tl--max" data-win-action="maximize" type="button" aria-label="Maximize"></button>
        </div>
        <span class="os-window__title">${def.title}</span>
        <span class="os-window__tag">${def.category || 'SYSTEM'}</span>
      </header>
      <div class="os-window__content" id="winContent_${appKey}"></div>
    `;

    // Position window with cascading offset
    const offset = (this.windows.size % 6) * 28;
    winEl.style.top = `${60 + offset}px`;
    winEl.style.left = `${Math.max(40, Math.min(window.innerWidth - 780, 80 + offset))}px`;
    if (def.width) winEl.style.width = `${def.width}px`;
    if (def.height) winEl.style.height = `${def.height}px`;

    this.windowsContainer.appendChild(winEl);
    this.windows.set(appKey, winEl);

    const contentEl = winEl.querySelector(`#winContent_${appKey}`);
    this.mountAppContent(appKey, contentEl);
    this.makeDraggable(winEl);

    winEl.addEventListener('mousedown', () => this.bringToFront(winEl));

    // Window controls
    winEl.querySelector('[data-win-action="close"]').addEventListener('click', () => {
      this.closeWindow(appKey);
    });

    winEl.querySelector('[data-win-action="maximize"]').addEventListener('click', () => {
      winEl.classList.toggle('is-maximized');
      sound.click(750, 0.02);
    });

    // Update Dock active indicators
    const dockItem = this.root.querySelector(`.os-dock__item[data-open="${appKey}"]`);
    if (dockItem) dockItem.classList.add('is-running');
  }

  bringToFront(winEl) {
    winEl.style.zIndex = ++this.topZIndex;
  }

  closeWindow(appKey) {
    if (!this.windows.has(appKey)) return;
    const winEl = this.windows.get(appKey);

    if (this.activeAppInstances.has(appKey)) {
      this.activeAppInstances.get(appKey).destroy?.();
      this.activeAppInstances.delete(appKey);
    }

    winEl.remove();
    this.windows.delete(appKey);

    const dockItem = this.root.querySelector(`.os-dock__item[data-open="${appKey}"]`);
    if (dockItem) dockItem.classList.remove('is-running');

    sound.click(420, 0.02);
  }

  makeDraggable(winEl) {
    const titlebar = winEl.querySelector('.os-window__titlebar');
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initX = 0;
    let initY = 0;

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.tl') || winEl.classList.contains('is-maximized')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initX = winEl.offsetLeft;
      initY = winEl.offsetTop;
      this.bringToFront(winEl);

      const onMove = (ev) => {
        if (!isDragging) return;
        winEl.style.left = `${initX + (ev.clientX - startX)}px`;
        winEl.style.top = `${Math.max(42, initY + (ev.clientY - startY))}px`;
      };

      const onUp = () => {
        isDragging = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  getAppDefinition(key) {
    const defs = {
      about: {
        title: 'JAIJITESH SURYAPRAKASH // DOSSIER',
        category: 'BIOGRAPHY & RESEARCH',
        width: 780,
        height: 520
      },
      windsim: {
        title: 'WINDSIM // AERODYNAMICS PLATFORM',
        category: 'CFD SIMULATOR',
        width: 820,
        height: 520
      },
      berrybot: {
        title: 'BERRYBOT // TRACKED ROBOTICS TELEMETRY',
        category: 'ESP32 HARDWARE',
        width: 840,
        height: 540
      },
      berry: {
        title: 'BERRY // LOCAL-FIRST DESKTOP AI AGENT',
        category: 'AGENT ARCHITECTURE',
        width: 800,
        height: 500
      },
      projects: {
        title: 'PROJECTS & HACKATHON ARCHIVE',
        category: 'ENGINEERING LAB',
        width: 780,
        height: 520
      },
      hardware: {
        title: '3D BENCH HARDWARE & OPTICS TELEMETRY',
        category: '3D LAB CAD',
        width: 780,
        height: 500
      },
      pixel: {
        title: 'MEMORY WORLD // RETRO WORKBENCH & TIMELINE',
        category: 'RETRO SIMULATOR',
        width: 780,
        height: 510
      },
      terminal: {
        title: 'JAIJITESH.OS UNIX TERMINAL',
        category: 'CLI SHELL',
        width: 760,
        height: 480
      }
    };
    return defs[key] || { title: key.toUpperCase(), category: 'APP', width: 700, height: 480 };
  }

  mountAppContent(key, container) {
    if (key === 'about') {
      container.innerHTML = this.renderAboutHtml();
    } else if (key === 'projects') {
      container.innerHTML = this.renderProjectsHtml();
    } else if (key === 'hardware') {
      container.innerHTML = this.renderHardwareHtml();
      this.bindHardwareInspectButtons(container);
    } else if (key === 'windsim') {
      const app = new WindSimulator(container);
      this.activeAppInstances.set(key, app);
    } else if (key === 'berrybot') {
      const app = new BerryBotSimulator(container);
      this.activeAppInstances.set(key, app);
    } else if (key === 'berry') {
      const app = new BerryAgentVisualizer(container);
      this.activeAppInstances.set(key, app);
    } else if (key === 'pixel') {
      const app = new PixelGameEngine(container);
      this.activeAppInstances.set(key, app);
    } else if (key === 'terminal') {
      const app = new TerminalApp(container, (hwKey) => {
        this.onInspect3D?.(hwKey);
      });
      this.activeAppInstances.set(key, app);
    }
  }

  renderAboutHtml() {
    return `
      <div class="dossier">
        <div class="dossier__sidebar">
          <div class="dossier__avatar">
            <span>JS</span>
          </div>
          <h2 class="dossier__name">Jaijitesh Suryaprakash</h2>
          <p class="dossier__role">Undergraduate Engineer &bull; AI / CFD / Robotics</p>

          <div class="dossier__contacts">
            <div><span>PHONE</span><b>+91 9940970749</b></div>
            <div><span>EMAIL</span><b>jaijitesh.2025@vitstudent.ac.in</b></div>
            <div><span>GITHUB</span><a href="https://github.com/BerrF35" target="_blank">github.com/BerrF35</a></div>
            <div><span>LINKEDIN</span><a href="https://linkedin.com/in/jaijitesh-suryaprakash-j" target="_blank">in/jaijitesh-suryaprakash-j</a></div>
          </div>
        </div>

        <div class="dossier__main">
          <section class="dossier__sec">
            <h3>01 // ACADEMIC PROFILE</h3>
            <div class="dossier__grid">
              <div>
                <span>INSTITUTION</span>
                <b>Vellore Institute of Technology (VIT), Vellore</b>
              </div>
              <div>
                <span>DEGREE</span>
                <b>B.Tech Information Technology (2025 &ndash; 2029)</b>
              </div>
              <div>
                <span>CURRENT YEAR / CGPA</span>
                <b>1st Year &bull; CGPA: 5.89</b>
              </div>
              <div>
                <span>SCHOOLING (SCTS)</span>
                <b>10th: 93.4% &bull; 12th: 76.4%</b>
              </div>
            </div>
          </section>

          <section class="dossier__sec">
            <h3>02 // RESEARCH PAPERS IN PREPARATION (Group of 5 + Professor)</h3>
            <ul class="dossier__list">
              <li>
                <b>Synthetic Data Generation Pipelines (<code>synthetic-data-generator</code>):</b> Automated photogrammetric dataset synthesis and augmentation for deep neural vision models.
              </li>
              <li>
                <b>Spectral Color-Space Image Analysis (<code>color-splitter</code>):</b> Multi-channel chromatic decomposition algorithms for enhanced optical perception in unstructured environments.
              </li>
              <li>
                <b>Autonomous Vision &amp; Robotics Systems:</b> Sensor fusion combining optical flow, encoder feedback, and edge AI inference.
              </li>
            </ul>
          </section>

          <section class="dossier__sec">
            <h3>03 // COMPANIONS</h3>
            <div class="dossier__grid">
              <div>
                <span>BERRY (BELGIAN MALINOIS, 12yo)</span>
                <p>Namesake and spirit behind both the Berry Desktop AI Assistant and BerryBot Tracked Autonomous Robotics.</p>
              </div>
              <div>
                <span>CRISPY (COMPANION CAT, 10yo)</span>
                <p>Chief Workbench Supervisor keeping watch over late-night firmware compiles and simulation runs.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  renderProjectsHtml() {
    return `
      <div class="projects-hub">
        <article class="proj-card proj-card--featured">
          <div class="proj-card__header">
            <span class="proj-card__tag">FLAGSHIP // #1 WORK</span>
            <a class="proj-card__link" href="https://berrf35.github.io/Windsim/" target="_blank">LIVE DEPLOYMENT ↗</a>
          </div>
          <h3>WindSim &mdash; Real-Time Aerodynamics &amp; CFD Sandbox</h3>
          <p>
            A high-performance browser aerodynamics simulation platform featuring a real-time reduced-order wind sandbox and a deterministic CFD lab with LBM (Lattice Boltzmann Method) simulation, streamlines, pressure slices, and 3D surface visualization.
          </p>
          <div class="proj-card__meta">
            <span>JavaScript</span><span>LBM CFD</span><span>Three.js</span><span>Web Workers</span>
          </div>
        </article>

        <div class="projects-grid">
          <article class="proj-card">
            <div class="proj-card__header">
              <span class="proj-card__tag">DESKTOP AI AGENT</span>
              <a class="proj-card__link" href="https://github.com/BerrF35/Berry" target="_blank">GITHUB ↗</a>
            </div>
            <h3>Berry &mdash; Local-First AI Assistant</h3>
            <p>
              Desktop AI agent in Python (AGPL-3.0) bridging LLMs with OS. Features Core Engine, Berry CUA sidecar, Browser Relay, Skill Codex, and Berry Vault persistent memory.
            </p>
            <div class="proj-card__meta">
              <span>Python</span><span>AGPL-3.0</span><span>FastAPI</span><span>CDP</span>
            </div>
          </article>

          <article class="proj-card">
            <div class="proj-card__header">
              <span class="proj-card__tag">AUTONOMOUS ROBOTICS</span>
              <span class="proj-card__status">SOLIDWORKS CAD</span>
            </div>
            <h3>BerryBot &mdash; Tracked Robotics Platform</h3>
            <p>
              Custom-engineered tracked robot platform built around a Waveshare ESP32 controller. Features optical encoder feedback, S-curve trajectory profiling, telemetry, path tracking, and RTH.
            </p>
            <div class="proj-card__meta">
              <span>ESP32</span><span>C++</span><span>SolidWorks</span><span>PID</span>
            </div>
          </article>

          <article class="proj-card">
            <div class="proj-card__header">
              <span class="proj-card__tag">HACKATHON WIN</span>
              <span class="proj-card__status">3RD PLACE OVERALL</span>
            </div>
            <h3>ImpactX 3.0 &mdash; Hyperlocal Marketplace</h3>
            <p>
              Technical Lead &amp; Primary Coder: Built real-time matching engine, localized geolocation caching, and secure transaction workflows under strict competition deadlines.
            </p>
            <div class="proj-card__meta">
              <span>Lead Coder</span><span>React</span><span>Node.js</span><span>MongoDB</span>
            </div>
          </article>

          <article class="proj-card">
            <div class="proj-card__header">
              <span class="proj-card__tag">YANTRA '26 CENTRAL HACK</span>
              <span class="proj-card__status">PRIMARY DEV</span>
            </div>
            <h3>FarmAssist AI &mdash; Edge Vision for Agriculture</h3>
            <p>
              Technical Lead &amp; Developer: Real-time crop pest recognition and edge disease triage system leveraging lightweight vision models and multilingual voice assistance.
            </p>
            <div class="proj-card__meta">
              <span>Python</span><span>TensorFlow Lite</span><span>Edge Vision</span>
            </div>
          </article>
        </div>
      </div>
    `;
  }

  renderHardwareHtml() {
    return `
      <div class="hardware-hub">
        <header class="hardware-hub__header">
          <p>PHYSICAL 3D MODELS LOADED IN THE LAB BENCH SCENE. CLICK TO INSPECT WITH DYNAMIC 3D CAMERA.</p>
        </header>

        <div class="hardware-cards">
          <div class="hw-card" data-inspect="robot">
            <div class="hw-card__badge">SOLIDWORKS CAD ASSEMBLY</div>
            <h4>BerryBot Tracked Chassis</h4>
            <p>Autonomous tracked differential robot with optical encoders and S-curve motion profiling.</p>
            <button class="hw-card__btn" type="button">INSPECT 3D MODEL &rarr;</button>
          </div>

          <div class="hw-card" data-inspect="raspberry">
            <div class="hw-card__badge">EDGE COMPUTE NODE</div>
            <h4>Raspberry Pi 4 Model B</h4>
            <p>Broadcom BCM2711 quad-core processor coordinating high-level vision and telemetry.</p>
            <button class="hw-card__btn" type="button">INSPECT 3D MODEL &rarr;</button>
          </div>

          <div class="hw-card" data-inspect="esp32">
            <div class="hw-card__badge">MICROCONTROLLER</div>
            <h4>ESP32-WROOM Dual-Core</h4>
            <p>240MHz embedded processor driving 20kHz motor PWM and hardware encoder counters.</p>
            <button class="hw-card__btn" type="button">INSPECT 3D MODEL &rarr;</button>
          </div>

          <div class="hw-card" data-inspect="camera">
            <div class="hw-card__badge">OPTICAL SENSING</div>
            <h4>Canon AT-1 35mm Retro Camera</h4>
            <p>35mm SLR body representing synthetic data generation pipelines and spectral color-space analysis.</p>
            <button class="hw-card__btn" type="button">INSPECT 3D MODEL &rarr;</button>
          </div>

          <div class="hw-card" data-inspect="cat">
            <div class="hw-card__badge">WORKBENCH SUPERVISOR</div>
            <h4>Crispy &bull; 10yo Companion Cat</h4>
            <p>Faithfully supervising workbench hardware development and late-night research sessions.</p>
            <button class="hw-card__btn" type="button">INSPECT 3D MODEL &rarr;</button>
          </div>

          <div class="hw-card" data-inspect="dog">
            <div class="hw-card__badge">INSPIRATION &amp; NAMESAKE</div>
            <h4>Berry &bull; 12yo Belgian Malinois</h4>
            <p>Beloved companion dog and namesake behind both Berry AI Agent and BerryBot Tracked Robotics.</p>
            <button class="hw-card__btn" type="button">INSPECT 3D MODEL &rarr;</button>
          </div>

          <div class="hw-card" data-inspect="telescope">
            <div class="hw-card__badge">SCIENTIFIC INSTRUMENT</div>
            <h4>Refractor Telescope</h4>
            <p>Equatorial refractor telescope symbolizing celestial observation and mathematical computing.</p>
            <button class="hw-card__btn" type="button">INSPECT 3D MODEL &rarr;</button>
          </div>
        </div>
      </div>
    `;
  }

  bindHardwareInspectButtons(container) {
    container.querySelectorAll('[data-inspect]').forEach((card) => {
      card.addEventListener('click', () => {
        const key = card.dataset.inspect;
        sound.sonarPing(880);
        this.onInspect3D?.(key);
      });
    });
  }
}
