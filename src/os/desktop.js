import { sound } from '../core/audio.js';
import { WindSimulator } from '../apps/simWind.js';
import { AgentSimulator } from '../apps/simAgent.js';
import { RobotSimulator } from '../apps/simRobot.js';
import { PixelGameEngine } from './pixelGame.js';
import { TerminalEngine } from './terminal.js';
import { HARDWARE_DEFINITIONS } from '../hardware/definitions.js';

export class DesktopManager {
  constructor(screenBody, onHardwareInspect, onExit) {
    this.container = screenBody;
    this.onHardwareInspect = onHardwareInspect;
    this.onExit = onExit;

    this.windows = new Map();
    this.activeWindowId = null;
    this.highestZ = 100;
    this.instances = new Map();
    this.isStartOpen = false;

    // Windows Desktop Items Definition
    this.desktopItems = [
      { id: 'projects', name: 'Projects', type: 'folder', target: 'Projects', iconType: 'folder' },
      { id: 'research', name: 'Research', type: 'folder', target: 'Research', iconType: 'folder' },
      { id: 'hardware', name: 'Hardware 3D', type: 'folder', target: 'Hardware', iconType: 'folder' },
      { id: 'about', name: 'About_Dossier.txt', type: 'file', target: 'about', iconType: 'txt' },
      { id: 'windsim', name: 'WindSim.exe', type: 'app', target: 'windsim', iconType: 'wind' },
      { id: 'berry', name: 'BerryAI.exe', type: 'app', target: 'berry', iconType: 'ai' },
      { id: 'berrybot', name: 'BerryBot.exe', type: 'app', target: 'berrybot', iconType: 'robot' },
      { id: 'terminal', name: 'Command_Prompt.cmd', type: 'app', target: 'terminal', iconType: 'cmd' },
      { id: 'timeline', name: 'PixelWorld.exe', type: 'app', target: 'timeline', iconType: 'game' },
      { id: 'contact', name: 'Contact_Dispatch.exe', type: 'app', target: 'contact', iconType: 'mail' },
      { id: 'recycle', name: 'Recycle Bin', type: 'folder', target: 'RecycleBin', iconType: 'trash' },
    ];

    // Virtual File System for Windows File Explorer
    this.fileSystem = {
      'Projects': {
        title: 'Projects',
        path: 'C:\\Users\\Jaijitesh\\Desktop\\Projects',
        items: [
          { id: 'windsim', name: 'WindSim_CFD.exe', type: 'app', target: 'windsim', iconType: 'wind', desc: 'Browser Aerodynamics Platform (LBM CFD - Best Work)', size: '4.2 MB' },
          { id: 'berry', name: 'Berry_AI_Assistant.exe', type: 'app', target: 'berry', iconType: 'ai', desc: 'Local Desktop Agent (Python AGPL-3.0)', size: '12.8 MB' },
          { id: 'berrybot', name: 'BerryBot_Robotics.exe', type: 'app', target: 'berrybot', iconType: 'robot', desc: 'Tracked Autonomous Robotics Controller', size: '6.1 MB' },
          { id: 'impactx', name: 'ImpactX_3.0_Winner.txt', type: 'doc', target: 'impactx', iconType: 'txt', desc: 'Hackathon 3rd Place Overall (Lead Developer)', size: '2 KB' },
          { id: 'farmassist', name: 'FarmAssist_AI.txt', type: 'doc', target: 'farmassist', iconType: 'txt', desc: 'Yantra 26 Central Hack - Lead Dev', size: '3 KB' },
          { id: 'vinhack', name: 'VinHack_25_Exchange.txt', type: 'doc', target: 'vinhack', iconType: 'txt', desc: 'P2P Book Exchange - Lead Coder', size: '2 KB' },
        ]
      },
      'Research': {
        title: 'Research',
        path: 'C:\\Users\\Jaijitesh\\Desktop\\Research',
        items: [
          { id: 'res_synth', name: 'Synthetic_Data_Generator.pdf', type: 'doc', target: 'res_synth', iconType: 'pdf', desc: 'Pipeline for robust synthetic training data (with faculty)', size: '1.4 MB' },
          { id: 'res_color', name: 'Spectral_Color_Splitter.pdf', type: 'doc', target: 'res_color', iconType: 'pdf', desc: 'Spectral color-space image analysis algorithms', size: '920 KB' },
          { id: 'res_vision', name: 'Edge_Vision_Systems.pdf', type: 'doc', target: 'res_vision', iconType: 'pdf', desc: 'Edge computer vision robotics integration', size: '2.1 MB' },
        ]
      },
      'Hardware': {
        title: 'Hardware 3D',
        path: 'C:\\Users\\Jaijitesh\\Desktop\\Hardware 3D',
        items: [
          { id: 'cad_chassis', name: 'BerryBot_Chassis.step', type: 'cad', target: 'chassis', iconType: 'cad', desc: 'SolidWorks M4 High-Speed Tractor Chassis', size: '3.8 MB' },
          { id: 'cad_rpi', name: 'Raspberry_Pi_4_Model_B.step', type: 'cad', target: 'raspberry', iconType: 'cad', desc: 'BCM2711 4-Core Quad 64-bit Compute Board', size: '5.9 MB' },
          { id: 'cad_esp', name: 'ESP32_WROOM_38Pin.step', type: 'cad', target: 'esp32', iconType: 'cad', desc: 'Dual-Core Controller with 20kHz Motor PWM', size: '6.2 MB' },
          { id: 'cad_camera', name: 'Canon_AT1_Retro.cad', type: 'cad', target: 'camera', iconType: 'cad', desc: 'Canon AT-1 35mm Vintage SLR & Optics', size: '19.5 MB' },
          { id: 'cad_telescope', name: 'Refractor_Telescope.cad', type: 'cad', target: 'telescope', iconType: 'cad', desc: 'Scientific Observation Tube & Glass', size: '6.6 MB' },
          { id: 'cad_dog', name: 'Berry_Belgian_Malinois.3d', type: 'cad', target: 'dog', iconType: 'cad', desc: '12yo Companion Malinois Dog', size: '2.8 MB' },
          { id: 'cad_cat', name: 'Crispy_Companion_Cat.3d', type: 'cad', target: 'cat', iconType: 'cad', desc: '10yo Companion Supervisor Cat', size: '7.5 MB' },
        ]
      },
      'RecycleBin': {
        title: 'Recycle Bin',
        path: 'Recycle Bin',
        items: [
          { id: 'junk_logs', name: 'previous_build_logs.log', type: 'doc', target: 'junk_logs', iconType: 'trash', desc: '14 KB (Deleted)', size: '14 KB' },
          { id: 'junk_temp', name: 'temp_debug_dump.tmp', type: 'doc', target: 'junk_temp', iconType: 'trash', desc: '28 KB (Deleted)', size: '28 KB' }
        ]
      }
    };

    this.init();
  }

  init() {
    this.renderDesktop();
    this.startClock();
  }

  getIconHtml(type) {
    switch (type) {
      case 'folder':
        return `<div class="win-icon-folder"><span class="win-icon-folder__tab"></span><span class="win-icon-folder__body"></span></div>`;
      case 'txt':
        return `<div class="win-icon-doc win-icon-doc--txt"><span class="win-icon-doc__corner"></span><span class="win-icon-doc__lines"></span></div>`;
      case 'pdf':
        return `<div class="win-icon-doc win-icon-doc--pdf"><span class="win-icon-doc__corner"></span><span class="win-icon-doc__badge">PDF</span></div>`;
      case 'cad':
        return `<div class="win-icon-app win-icon-app--cad"><span>CAD</span></div>`;
      case 'wind':
        return `<div class="win-icon-app win-icon-app--wind"><span>CFD</span></div>`;
      case 'ai':
        return `<div class="win-icon-app win-icon-app--ai"><span>AI</span></div>`;
      case 'robot':
        return `<div class="win-icon-app win-icon-app--robot"><span>BOT</span></div>`;
      case 'cmd':
        return `<div class="win-icon-app win-icon-app--cmd"><span>&gt;_</span></div>`;
      case 'game':
        return `<div class="win-icon-app win-icon-app--game"><span>8b</span></div>`;
      case 'mail':
        return `<div class="win-icon-app win-icon-app--mail"><span>@</span></div>`;
      case 'trash':
        return `<div class="win-icon-trash"><span class="win-icon-trash__lid"></span><span class="win-icon-trash__can"></span></div>`;
      default:
        return `<div class="win-icon-doc"><span class="win-icon-doc__corner"></span></div>`;
    }
  }

  renderDesktop() {
    this.container.innerHTML = `
      <div class="win-desktop-environment">
        <!-- Windows Desktop Surface -->
        <main class="win-desktop-surface" id="winDesktopSurface">
          
          <!-- Desktop Grid of Icons -->
          <div class="win-icons-grid" id="winIconsGrid">
            ${this.desktopItems.map(item => `
              <button class="win-desktop-icon" data-id="${item.id}" data-type="${item.type}" data-target="${item.target}" type="button">
                <div class="win-desktop-icon__graphic">
                  ${this.getIconHtml(item.iconType)}
                </div>
                <span class="win-desktop-icon__name">${item.name}</span>
              </button>
            `).join('')}
          </div>

          <!-- Windows Start Menu Popup -->
          <div class="win-start-menu" id="winStartMenu">
            <div class="win-start-menu__header">
              <div class="win-start-avatar">JS</div>
              <div class="win-start-user">
                <b>Jaijitesh Suryaprakash</b>
                <small>B.Tech IT • VIT Vellore</small>
              </div>
            </div>

            <div class="win-start-search">
              <span class="win-search-glyph">🔍</span>
              <input type="text" id="winStartSearchInput" placeholder="Type here to search..." autocomplete="off" />
            </div>

            <div class="win-start-section-title">Pinned Applications</div>
            <div class="win-start-apps-grid">
              <button class="win-start-app-item" data-action="app" data-target="windsim" type="button">
                ${this.getIconHtml('wind')}
                <span>WindSim CFD</span>
              </button>
              <button class="win-start-app-item" data-action="app" data-target="berrybot" type="button">
                ${this.getIconHtml('robot')}
                <span>BerryBot</span>
              </button>
              <button class="win-start-app-item" data-action="app" data-target="berry" type="button">
                ${this.getIconHtml('ai')}
                <span>Berry AI</span>
              </button>
              <button class="win-start-app-item" data-action="app" data-target="terminal" type="button">
                ${this.getIconHtml('cmd')}
                <span>Command Prompt</span>
              </button>
              <button class="win-start-app-item" data-action="app" data-target="timeline" type="button">
                ${this.getIconHtml('game')}
                <span>Pixel World</span>
              </button>
              <button class="win-start-app-item" data-action="folder" data-target="Projects" type="button">
                ${this.getIconHtml('folder')}
                <span>Projects</span>
              </button>
            </div>

            <div class="win-start-section-title">Recommended / Recent</div>
            <div class="win-start-recent-list">
              <button class="win-start-recent-item" data-action="folder" data-target="Research" type="button">
                ${this.getIconHtml('folder')}
                <div>
                  <b>Research Papers Folder</b>
                  <small>Synthetic Data &amp; Spectral Analysis</small>
                </div>
              </button>
              <button class="win-start-recent-item" data-action="folder" data-target="Hardware" type="button">
                ${this.getIconHtml('cad')}
                <div>
                  <b>Hardware 3D CAD Models</b>
                  <small>Chassis, Pi4, ESP32, Camera, Telescope</small>
                </div>
              </button>
              <button class="win-start-recent-item" data-action="file" data-target="about" type="button">
                ${this.getIconHtml('txt')}
                <div>
                  <b>About_Dossier.txt</b>
                  <small>Academic Background &amp; Bio</small>
                </div>
              </button>
            </div>

            <div class="win-start-menu__footer">
              <button class="win-start-power-btn" id="winPowerExitBtn" type="button" title="Return to 3D Bench (ESC)">
                <span class="win-power-glyph">⏻</span>
                <span>Exit to 3D Bench</span>
              </button>
            </div>
          </div>

          <!-- Windows Layer for open windows -->
          <div class="win-windows-layer" id="winWindowsLayer"></div>
        </main>

        <!-- Windows Taskbar -->
        <footer class="win-taskbar">
          <div class="win-taskbar__start-group">
            <button class="win-start-btn" id="winStartBtn" type="button" title="Start Menu">
              <span class="win-logo-quadrant">
                <i></i><i></i><i></i><i></i>
              </span>
              <span>Start</span>
            </button>
            <div class="win-taskbar-search">
              <span>🔍</span>
              <input type="text" id="winTaskbarSearchInput" placeholder="Type here to search" autocomplete="off" />
            </div>
          </div>

          <div class="win-taskbar__tasks" id="winTaskbarItems"></div>

          <div class="win-taskbar__tray">
            <button class="win-tray-btn" id="winAudioToggle" type="button" title="Toggle Sound">
              <span id="winAudioIcon">🔊</span>
            </button>
            <button class="win-tray-btn" id="winThemeToggle" type="button" title="Toggle Theme">
              <span>◐</span>
            </button>
            <div class="win-tray-clock" id="winTrayClock">
              <span class="win-clock-time" id="winClockTime">12:00:00</span>
              <span class="win-clock-date" id="winClockDate">01-09-2026</span>
            </div>
            <button class="win-bench-exit-tray" id="winBenchExitTray" type="button" title="Return to 3D Bench">
              &larr; 3D BENCH
            </button>
            <div class="win-show-desktop-bar" id="winShowDesktop" title="Show Desktop"></div>
          </div>
        </footer>
      </div>
    `;

    this.bindDesktopEvents();
  }

  bindDesktopEvents() {
    // Desktop Icons Single/Double Click
    this.container.querySelectorAll('.win-desktop-icon').forEach(icon => {
      icon.addEventListener('click', (e) => {
        this.container.querySelectorAll('.win-desktop-icon').forEach(i => i.classList.remove('is-selected'));
        icon.classList.add('is-selected');
        sound.click(650, 0.02);

        const type = icon.dataset.type;
        const target = icon.dataset.target;
        this.handleLaunch(type, target);
      });
    });

    // Start Button Toggle
    const startBtn = this.container.querySelector('#winStartBtn');
    const startMenu = this.container.querySelector('#winStartMenu');

    startBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isStartOpen = !this.isStartOpen;
      startMenu?.classList.toggle('is-open', this.isStartOpen);
      startBtn?.classList.toggle('is-active', this.isStartOpen);
      sound.click(800, 0.02);
    });

    // Close Start menu on clicking outside
    this.container.querySelector('#winDesktopSurface')?.addEventListener('click', (e) => {
      if (this.isStartOpen && !e.target.closest('#winStartMenu') && !e.target.closest('#winStartBtn')) {
        this.isStartOpen = false;
        startMenu?.classList.remove('is-open');
        startBtn?.classList.remove('is-active');
      }
    });

    // Start Menu Items Launch
    this.container.querySelectorAll('#winStartMenu button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const target = btn.dataset.target;
        this.isStartOpen = false;
        startMenu?.classList.remove('is-open');
        startBtn?.classList.remove('is-active');
        this.handleLaunch(action, target);
        sound.click(720, 0.02);
      });
    });

    // Exit to Bench
    const handleExit = () => {
      sound.click(380, 0.03);
      this.onExit?.();
    };

    this.container.querySelector('#winPowerExitBtn')?.addEventListener('click', handleExit);
    this.container.querySelector('#winBenchExitTray')?.addEventListener('click', handleExit);

    // Audio & Theme Toggles
    this.container.querySelector('#winAudioToggle')?.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      const icon = this.container.querySelector('#winAudioIcon');
      if (icon) icon.textContent = isMuted ? '🔇' : '🔊';
      sound.click(880, 0.02);
    });

    this.container.querySelector('#winThemeToggle')?.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      sound.tick(1100);
    });

    // Show Desktop peek
    this.container.querySelector('#winShowDesktop')?.addEventListener('click', () => {
      this.windows.forEach(win => win.classList.add('is-minimized'));
      this.updateTaskbar();
      sound.click(500, 0.02);
    });

    // Search bar functionality
    const searchInputs = [
      this.container.querySelector('#winTaskbarSearchInput'),
      this.container.querySelector('#winStartSearchInput')
    ];

    searchInputs.forEach(input => {
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = input.value.trim().toLowerCase();
          if (!q) return;
          if (q.includes('wind') || q.includes('cfd')) this.openApp('windsim');
          else if (q.includes('bot') || q.includes('robot')) this.openApp('berrybot');
          else if (q.includes('berry') || q.includes('ai') || q.includes('agent')) this.openApp('berry');
          else if (q.includes('term') || q.includes('cmd') || q.includes('shell')) this.openApp('terminal');
          else if (q.includes('pixel') || q.includes('game')) this.openApp('timeline');
          else if (q.includes('res') || q.includes('paper')) this.openExplorer('Research');
          else if (q.includes('cad') || q.includes('hard')) this.openExplorer('Hardware');
          else if (q.includes('proj')) this.openExplorer('Projects');
          else if (q.includes('about') || q.includes('bio')) this.openFile('about');
          else this.openApp('terminal');
          input.value = '';
          if (this.isStartOpen) {
            this.isStartOpen = false;
            startMenu?.classList.remove('is-open');
            startBtn?.classList.remove('is-active');
          }
        }
      });
    });
  }

  handleLaunch(type, target) {
    if (type === 'folder') {
      this.openExplorer(target);
    } else if (type === 'app') {
      this.openApp(target);
    } else if (type === 'file' || type === 'doc') {
      this.openFile(target);
    } else if (type === 'cad') {
      this.onHardwareInspect?.(target);
    }
  }

  startClock() {
    const timeEl = this.container.querySelector('#winClockTime');
    const dateEl = this.container.querySelector('#winClockDate');

    const update = () => {
      const now = new Date();
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    };
    update();
    setInterval(update, 1000);
  }

  openExplorer(folderKey) {
    const folderDef = this.fileSystem[folderKey] || this.fileSystem['Projects'];
    const windowId = `explorer_${folderKey}`;

    if (this.windows.has(windowId)) {
      const winEl = this.windows.get(windowId);
      winEl.classList.remove('is-minimized');
      this.focusWindow(windowId);
      return;
    }

    this.highestZ++;
    const win = document.createElement('div');
    win.className = 'win-window';
    win.id = `win_${windowId}`;
    win.style.zIndex = this.highestZ;
    win.style.top = '50px';
    win.style.left = '80px';
    win.style.width = '740px';
    win.style.height = '480px';

    win.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title">
          <div class="win-icon-folder" style="width: 14px; height: 12px; margin-right: 6px;"><span class="win-icon-folder__tab"></span><span class="win-icon-folder__body"></span></div>
          <span>${folderDef.title} - File Explorer</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn win-ctrl-min" data-action="min" type="button" title="Minimize">—</button>
          <button class="win-ctrl-btn win-ctrl-max" data-action="max" type="button" title="Maximize">□</button>
          <button class="win-ctrl-btn win-ctrl-close" data-action="close" type="button" title="Close">&times;</button>
        </div>
      </div>

      <!-- File Explorer Toolbar & Address Bar -->
      <div class="win-explorer-toolbar">
        <div class="win-nav-buttons">
          <button class="win-tool-btn" data-action="back" type="button" title="Back">&larr;</button>
          <button class="win-tool-btn" data-action="forward" type="button" title="Forward">&rarr;</button>
          <button class="win-tool-btn" data-action="up" type="button" title="Up">&uarr;</button>
        </div>
        <div class="win-address-bar">
          <span class="win-address-icon">📁</span>
          <span class="win-address-path">${folderDef.path}</span>
        </div>
        <div class="win-explorer-search">
          <span>🔍</span>
          <input type="text" placeholder="Search ${folderDef.title}" />
        </div>
      </div>

      <!-- File Explorer Body: Sidebar + File Grid -->
      <div class="win-explorer-body">
        <aside class="win-explorer-sidebar">
          <div class="win-side-section">Quick Access</div>
          <button class="win-side-item ${folderKey === 'Projects' ? 'is-active' : ''}" data-folder="Projects" type="button">
            📁 Projects
          </button>
          <button class="win-side-item ${folderKey === 'Research' ? 'is-active' : ''}" data-folder="Research" type="button">
            📁 Research
          </button>
          <button class="win-side-item ${folderKey === 'Hardware' ? 'is-active' : ''}" data-folder="Hardware" type="button">
            📁 Hardware 3D
          </button>
          <button class="win-side-item ${folderKey === 'RecycleBin' ? 'is-active' : ''}" data-folder="RecycleBin" type="button">
            🗑️ Recycle Bin
          </button>
          
          <div class="win-side-section" style="margin-top: 12px;">This PC</div>
          <div class="win-side-drive">💻 Windows (C:) &mdash; 482 GB free</div>
        </aside>

        <div class="win-explorer-files" id="explorerFiles_${windowId}">
          ${folderDef.items.map(item => `
            <button class="win-file-item" data-item-id="${item.id}" data-item-type="${item.type}" data-item-target="${item.target}" type="button">
              <div class="win-file-graphic">
                ${this.getIconHtml(item.iconType)}
              </div>
              <div class="win-file-info">
                <span class="win-file-name">${item.name}</span>
                <span class="win-file-desc">${item.desc || ''}</span>
              </div>
              <span class="win-file-size">${item.size || ''}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="win-explorer-statusbar">
        <span>${folderDef.items.length} items</span>
        <span>Ready</span>
      </div>
    `;

    const layer = this.container.querySelector('#winWindowsLayer');
    layer.appendChild(win);
    this.windows.set(windowId, win);
    this.focusWindow(windowId);
    this.updateTaskbar();

    this.setupWindowInteractions(win, windowId);

    // Sidebar navigation inside Explorer
    win.querySelectorAll('.win-side-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextFolder = btn.dataset.folder;
        this.closeWindow(windowId);
        this.openExplorer(nextFolder);
        sound.click(600, 0.02);
      });
    });

    // File double-click/click inside Explorer
    win.querySelectorAll('.win-file-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.itemType;
        const target = btn.dataset.itemTarget;
        sound.click(720, 0.02);
        this.handleLaunch(type, target);
      });
    });
  }

  openApp(id) {
    if (this.windows.has(id)) {
      const winEl = this.windows.get(id);
      winEl.classList.remove('is-minimized');
      this.focusWindow(id);
      return;
    }

    const appTitles = {
      'windsim': { title: 'WindSim CFD Aerodynamics Lab', icon: 'wind' },
      'berry': { title: 'Berry AI - Desktop Assistant', icon: 'ai' },
      'berrybot': { title: 'BerryBot Robotics Simulator', icon: 'robot' },
      'terminal': { title: 'Command Prompt (Administrator: C:\\Windows\\System32\\cmd.exe)', icon: 'cmd' },
      'timeline': { title: 'Pixel World Timeline (8-Bit Playable)', icon: 'game' },
      'contact': { title: 'Contact & Dispatch Client', icon: 'mail' },
    };

    const info = appTitles[id] || { title: id.toUpperCase(), icon: 'app' };

    this.highestZ++;
    const win = document.createElement('div');
    win.className = 'win-window is-maximized';
    win.id = `win_${id}`;
    win.style.zIndex = this.highestZ;

    win.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title">
          <div style="margin-right: 6px;">${this.getIconHtml(info.icon)}</div>
          <span>${info.title}</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn win-ctrl-min" data-action="min" type="button" title="Minimize">—</button>
          <button class="win-ctrl-btn win-ctrl-max" data-action="max" type="button" title="Maximize">□</button>
          <button class="win-ctrl-btn win-ctrl-close" data-action="close" type="button" title="Close">&times;</button>
        </div>
      </div>
      <div class="win-app-body" id="body_${id}"></div>
    `;

    const layer = this.container.querySelector('#winWindowsLayer');
    layer.appendChild(win);
    this.windows.set(id, win);
    this.focusWindow(id);
    this.updateTaskbar();

    this.setupWindowInteractions(win, id);
    this.mountAppContent(id, win.querySelector(`#body_${id}`));
  }

  openFile(fileId) {
    const windowId = `doc_${fileId}`;
    if (this.windows.has(windowId)) {
      const winEl = this.windows.get(windowId);
      winEl.classList.remove('is-minimized');
      this.focusWindow(windowId);
      return;
    }

    let title = 'Document Viewer';
    let content = '';

    if (fileId === 'about') {
      title = 'About_Dossier.txt - Notepad';
      content = `
================================================================================
                      JAIJITESH SURYAPRAKASH — PERSONNEL DOSSIER
================================================================================

[ IDENTITY & ACADEMIC PROFILE ]
Name: Jaijitesh Suryaprakash
University: VIT Vellore (Vellore Institute of Technology)
Degree: B.Tech Information Technology (2025–2029, 1st Year)
Academic Standing: Current CGPA 5.89
Schooling: SCTS School (10th: 93.4% | 12th: 76.4%)

[ CONTACT & DISPATCH ]
Email: jaijitesh.2025@vitstudent.ac.in
Phone: +91 9940970749
GitHub: https://github.com/BerrF35
LinkedIn: https://linkedin.com/in/jaijitesh-suryaprakash-j

[ COMPANIONS & SPIRIT ]
1. BERRY (12-year-old Belgian Malinois): Namesake and spirit behind Berry AI Agent
   and BerryBot Tracked Robotics.
2. CRISPY (10-year-old Companion Cat): Supervises late-night hardware/firmware sessions.

[ CORE TECHNICAL PILLARS ]
1. Scientific Simulation: Real-time Lattice Boltzmann Method (LBM) CFD aerodynamics.
2. Local-First AI Agents: Desktop CUA automation, persistent memory, and browser relay.
3. Autonomous Robotics: Tracked chassis kinematics, optical encoder feedback, S-curve PID.
4. Academic Research: 3 papers in preparation with faculty group.

================================================================================
      `;
    } else if (fileId === 'impactx') {
      title = 'ImpactX_3.0_Winner.txt - Notepad';
      content = `
[ IMPACTX 3.0 HACKATHON — 3RD PLACE OVERALL ]
Role: Hackathon Lead & Primary Developer / Coder
Project: Hyperlocal Dispatch & Real-Time Logistics Platform
Key Highlights: Real-time geospatial route optimization and high-concurrency order engine.
      `;
    } else if (fileId === 'farmassist') {
      title = 'FarmAssist_AI.txt - Notepad';
      content = `
[ FARMASSIST AI — YANTRA 26 CENTRAL HACK ]
Role: Lead & Primary Developer
Domain: Edge Computer Vision & Agricultural Disease Diagnostics
Stack: PyTorch, OpenCV, Raspberry Pi edge vision deployment.
      `;
    } else if (fileId === 'vinhack') {
      title = 'VinHack_25_Exchange.txt - Notepad';
      content = `
[ VINHACK 25 — P2P BOOK EXCHANGE ]
Role: Lead Developer
Domain: Peer-to-Peer Distributed Resource Exchange
      `;
    } else if (fileId === 'res_synth' || fileId === 'res_color' || fileId === 'res_vision') {
      title = `${fileId}.pdf - Document Viewer`;
      content = `
[ RESEARCH PAPER IN PREPARATION ]
Group: 5-Person Academic Research Group with Professor
Status: Active experimentation, mathematical validation, and manuscript preparation.
Topics:
- Synthetic data generation pipelines for robust edge classification.
- Spectral color-space image decomposition and optical filtering.
- Embedded vision integration on low-power ARM microcontrollers.
      `;
    } else {
      title = `${fileId} - Notepad`;
      content = `Contents of ${fileId}...`;
    }

    this.highestZ++;
    const win = document.createElement('div');
    win.className = 'win-window';
    win.id = `win_${windowId}`;
    win.style.zIndex = this.highestZ;
    win.style.top = '80px';
    win.style.left = '120px';
    win.style.width = '680px';
    win.style.height = '440px';

    win.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title">
          <div class="win-icon-doc win-icon-doc--txt" style="width: 12px; height: 14px; margin-right: 6px;"><span class="win-icon-doc__corner"></span></div>
          <span>${title}</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn win-ctrl-min" data-action="min" type="button" title="Minimize">—</button>
          <button class="win-ctrl-btn win-ctrl-max" data-action="max" type="button" title="Maximize">□</button>
          <button class="win-ctrl-btn win-ctrl-close" data-action="close" type="button" title="Close">&times;</button>
        </div>
      </div>
      <div class="win-notepad-menu">
        <span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span>
      </div>
      <div class="win-notepad-body">
        <pre>${content.trim()}</pre>
      </div>
    `;

    const layer = this.container.querySelector('#winWindowsLayer');
    layer.appendChild(win);
    this.windows.set(windowId, win);
    this.focusWindow(windowId);
    this.updateTaskbar();

    this.setupWindowInteractions(win, windowId);
  }

  setupWindowInteractions(win, id) {
    const titlebar = win.querySelector('.win-titlebar');

    win.addEventListener('mousedown', () => this.focusWindow(id));

    let isDragging = false;
    let startX, startY, origLeft, origTop;

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.win-controls') || win.classList.contains('is-maximized')) return;
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
      win.style.top = `${Math.max(0, origTop + dy)}px`;
      win.style.transform = 'none';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) isDragging = false;
    });

    win.querySelector('.win-ctrl-close').addEventListener('click', () => this.closeWindow(id));
    win.querySelector('.win-ctrl-min').addEventListener('click', () => this.minimizeWindow(id));
    win.querySelector('.win-ctrl-max').addEventListener('click', () => this.toggleMaximize(win));
  }

  focusWindow(id) {
    this.activeWindowId = id;
    this.highestZ++;
    const win = this.windows.get(id);
    if (win) {
      win.style.zIndex = this.highestZ;
      this.container.querySelectorAll('.win-window').forEach(w => w.classList.remove('is-focused'));
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
      win.style.height = 'calc(100% - 90px)';
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
    const taskbar = this.container.querySelector('#winTaskbarItems');
    if (!taskbar) return;

    taskbar.innerHTML = Array.from(this.windows.keys()).map(id => {
      const isFocused = this.activeWindowId === id;
      const isMin = this.windows.get(id)?.classList.contains('is-minimized');
      let title = id.replace('explorer_', '📁 ').replace('doc_', '📄 ');
      if (id === 'windsim') title = 'CFD WindSim';
      if (id === 'berry') title = 'Berry AI';
      if (id === 'berrybot') title = 'BerryBot';
      if (id === 'terminal') title = 'Command Prompt';
      if (id === 'timeline') title = 'Pixel World';

      return `
        <button class="win-taskbar-tab ${isFocused && !isMin ? 'is-active' : ''} ${isMin ? 'is-min' : ''}" data-task-id="${id}" type="button">
          <span>${title}</span>
        </button>
      `;
    }).join('');

    taskbar.querySelectorAll('[data-task-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.taskId;
        const win = this.windows.get(id);
        if (!win) return;
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
    } else if (id === 'contact') {
      this.renderContactApp(body);
    }
  }

  renderContactApp(body) {
    body.innerHTML = `
      <div class="win-contact-form" style="padding: 24px; color: #fff; font-family: var(--font-sans);">
        <h3 style="margin-top: 0; color: var(--accent);">Direct Contact &amp; Dispatch</h3>
        <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 20px;">Send a direct communication to Jaijitesh Suryaprakash.</p>
        <div style="display: grid; gap: 12px; max-width: 480px;">
          <div>
            <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Name</label>
            <input type="text" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 4px;" placeholder="Your Name" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Email</label>
            <input type="email" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 4px;" placeholder="your.email@domain.com" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Message</label>
            <textarea rows="4" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 4px;" placeholder="Enter your message..."></textarea>
          </div>
          <button type="button" style="padding: 10px; background: var(--accent); color: #07090b; border: 0; font-weight: bold; border-radius: 4px;" onclick="alert('Message queued for Jaijitesh (jaijitesh.2025@vitstudent.ac.in)');">SEND MESSAGE</button>
        </div>
      </div>
    `;
  }
}
