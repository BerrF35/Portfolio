import { sound } from '../core/audio.js';
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
    this.currentExplorerPath = 'Projects';

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
      { id: 'timeline', name: 'Projects_Timeline.exe', type: 'app', target: 'timeline', iconType: 'game' },
      { id: 'contact', name: 'Contact_Dispatch.exe', type: 'app', target: 'contact', iconType: 'mail' },
      { id: 'recycle', name: 'Recycle Bin', type: 'folder', target: 'RecycleBin', iconType: 'trash' },
    ];

    // Virtual File System for Windows File Explorer
    this.fileSystem = {
      'Projects': {
        title: 'Projects',
        path: 'C:\\Users\\Jaijitesh\\Desktop\\Projects',
        items: [
          { id: 'windsim', name: 'WindSim_CFD.exe', type: 'app', target: 'windsim', iconType: 'wind', desc: 'Browser Aerodynamics Platform (LBM CFD)', size: '4.2 MB' },
          { id: 'berry', name: 'Berry_AI_Assistant.exe', type: 'app', target: 'berry', iconType: 'ai', desc: 'Local Desktop Agent (Python AGPL-3.0)', size: '12.8 MB' },
          { id: 'berrybot', name: 'BerryBot_Robotics.exe', type: 'app', target: 'berrybot', iconType: 'robot', desc: 'Tracked Autonomous Robotics Controller', size: '6.1 MB' },
          { id: 'impactx', name: 'ImpactX_3.0_Winner.txt', type: 'doc', target: 'impactx', iconType: 'txt', desc: 'Hackathon 3rd Place Overall', size: '2 KB' },
          { id: 'farmassist', name: 'FarmAssist_AI.txt', type: 'doc', target: 'farmassist', iconType: 'txt', desc: 'Yantra 26 Central Hack', size: '3 KB' },
          { id: 'vinhack', name: 'VinHack_25_Exchange.txt', type: 'doc', target: 'vinhack', iconType: 'txt', desc: 'P2P Book Exchange', size: '2 KB' },
        ]
      },
      'Research': {
        title: 'Research',
        path: 'C:\\Users\\Jaijitesh\\Desktop\\Research',
        items: [
          { id: 'res_synth', name: 'Synthetic_Data_Generator.pdf', type: 'doc', target: 'res_synth', iconType: 'pdf', desc: 'Pipeline for robust synthetic training data', size: '1.4 MB' },
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
        return `<div class="win-icon-app win-icon-app--game"><span>DIR</span></div>`;
      case 'mail':
        return `<div class="win-icon-app win-icon-app--mail"><span>@</span></div>`;
      case 'trash':
        return `<div class="win-icon-trash"><span class="win-icon-trash__lid"></span><span class="win-icon-trash__can"></span></div>`;
      default:
        return `<div class="win-icon-folder"><span class="win-icon-folder__tab"></span><span class="win-icon-folder__body"></span></div>`;
    }
  }

  renderDesktop() {
    this.container.innerHTML = `
      <div class="win-desktop-environment">
        <!-- Wallpaper Surface with Desktop Icons -->
        <div class="win-desktop-surface" id="winDesktopSurface">
          <div class="win-icons-grid" id="winIconsGrid">
            ${this.desktopItems.map(item => `
              <div class="win-desktop-icon" data-id="${item.id}" data-type="${item.type}" data-target="${item.target}" tabindex="0">
                <div class="win-desktop-icon__graphic">
                  ${this.getIconHtml(item.iconType)}
                </div>
                <span class="win-desktop-icon__name">${item.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Windows Layer -->
        <div class="win-windows-layer" id="winWindowsLayer"></div>

        <!-- Start Menu Popup -->
        <div class="win-start-menu" id="winStartMenu">
          <div class="win-start-menu__header">
            <div class="win-start-avatar">JS</div>
            <div class="win-start-user">
              <b>Jaijitesh Suryaprakash</b>
              <small>B.Tech IT • VIT Vellore</small>
            </div>
          </div>
          <div class="win-start-search">
            <span style="color:#888;">🔍</span>
            <input type="text" placeholder="Type here to search..." id="winStartSearchInput" />
          </div>
          <div class="win-start-section-title">Pinned Applications</div>
          <div class="win-start-apps-grid">
            <button class="win-start-app-item" data-launch="windsim" type="button">
              <div class="win-icon-app win-icon-app--wind"><span>CFD</span></div>
              <span>WindSim</span>
            </button>
            <button class="win-start-app-item" data-launch="berry" type="button">
              <div class="win-icon-app win-icon-app--ai"><span>AI</span></div>
              <span>Berry AI</span>
            </button>
            <button class="win-start-app-item" data-launch="berrybot" type="button">
              <div class="win-icon-app win-icon-app--robot"><span>BOT</span></div>
              <span>BerryBot</span>
            </button>
            <button class="win-start-app-item" data-launch="terminal" type="button">
              <div class="win-icon-app win-icon-app--cmd"><span>&gt;_</span></div>
              <span>Command Prompt</span>
            </button>
            <button class="win-start-app-item" data-launch="timeline" type="button">
              <div class="win-icon-app win-icon-app--game"><span>DIR</span></div>
              <span>Timeline</span>
            </button>
            <button class="win-start-app-item" data-launch="contact" type="button">
              <div class="win-icon-app win-icon-app--mail"><span>@</span></div>
              <span>Contact</span>
            </button>
          </div>
          <div class="win-start-section-title">Recent Documents &amp; Projects</div>
          <div class="win-start-recent-list">
            <button class="win-start-recent-item" data-open-doc="about" type="button">
              <div class="win-icon-doc win-icon-doc--txt" style="width: 14px; height: 18px;"><span class="win-icon-doc__corner"></span></div>
              <div><b>About_Dossier.txt</b><small>Developer Profile &amp; Contact</small></div>
            </button>
            <button class="win-start-recent-item" data-open-doc="impactx" type="button">
              <div class="win-icon-doc win-icon-doc--txt" style="width: 14px; height: 18px;"><span class="win-icon-doc__corner"></span></div>
              <div><b>ImpactX_3.0_Winner.txt</b><small>Hackathon 3rd Place Overall</small></div>
            </button>
            <button class="win-start-recent-item" data-open-folder="Hardware" type="button">
              <div class="win-icon-folder" style="width: 18px; height: 14px;"><span class="win-icon-folder__body"></span></div>
              <div><b>Hardware 3D</b><small>SolidWorks &amp; Robotics Models</small></div>
            </button>
          </div>
          <div class="win-start-menu__footer">
            <button class="win-start-power-btn" id="winExitBenchBtn" type="button">
              <span>⏻</span>
              <span>Exit to Bench</span>
            </button>
          </div>
        </div>

        <!-- Taskbar -->
        <div class="win-taskbar" id="winTaskbar">
          <div class="win-taskbar__start-group">
            <button class="win-start-btn" id="winStartToggleBtn" type="button" title="Start">
              <div class="win-logo-quadrant">
                <i></i><i></i><i></i><i></i>
              </div>
              <span>Start</span>
            </button>
            <div class="win-taskbar-search">
              <span>🔍</span>
              <input type="text" placeholder="Type here to search" id="winTaskbarSearchInput" />
            </div>
          </div>
          <div class="win-taskbar__tasks" id="winTaskbarItems"></div>
          <div class="win-taskbar__tray">
            <button class="win-tray-btn" id="winTraySoundBtn" type="button" title="Audio">🔊</button>
            <button class="win-tray-btn" id="winTrayThemeBtn" type="button" title="Display">◐</button>
            <div class="win-tray-clock" id="winTrayClock">
              <span class="win-clock-time" id="winClockTime">12:00:00</span>
              <span class="win-clock-date" id="winClockDate">01/09/2026</span>
            </div>
            <button class="win-bench-exit-tray" id="winBenchExitTray" type="button" title="Return to 3D Workbench">
              ← 3D BENCH
            </button>
            <div class="win-show-desktop-bar" id="winShowDesktopBar" title="Show Desktop"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  startClock() {
    const timeEl = this.container.querySelector('#winClockTime');
    const dateEl = this.container.querySelector('#winClockDate');
    if (!timeEl || !dateEl) return;

    const update = () => {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString([], { hour12: false });
      dateEl.textContent = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  }

  bindEvents() {
    const grid = this.container.querySelector('#winIconsGrid');
    const startMenu = this.container.querySelector('#winStartMenu');
    const startBtn = this.container.querySelector('#winStartToggleBtn');
    const exitBtn = this.container.querySelector('#winExitBenchBtn');
    const trayExitBtn = this.container.querySelector('#winBenchExitTray');
    const showDesktop = this.container.querySelector('#winShowDesktopBar');

    grid.querySelectorAll('.win-desktop-icon').forEach(icon => {
      icon.addEventListener('click', (e) => {
        grid.querySelectorAll('.win-desktop-icon').forEach(i => i.classList.remove('is-selected'));
        icon.classList.add('is-selected');
        sound.tick(1200);
      });

      icon.addEventListener('dblclick', () => {
        const id = icon.dataset.id;
        const type = icon.dataset.type;
        const target = icon.dataset.target;

        if (type === 'folder') {
          this.openExplorer(target);
        } else if (type === 'app') {
          this.openApp(target);
        } else if (type === 'file') {
          this.openDocument(target);
        }
        sound.click(600, 0.03);
      });
    });

    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isStartOpen = !this.isStartOpen;
      startMenu.classList.toggle('is-open', this.isStartOpen);
      startBtn.classList.toggle('is-active', this.isStartOpen);
      sound.tick(800);
    });

    document.addEventListener('click', (e) => {
      if (this.isStartOpen && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        this.isStartOpen = false;
        startMenu.classList.remove('is-open');
        startBtn.classList.remove('is-active');
      }
    });

    exitBtn.addEventListener('click', () => {
      sound.click(400, 0.05);
      this.onExit?.();
    });

    trayExitBtn.addEventListener('click', () => {
      sound.click(400, 0.05);
      this.onExit?.();
    });

    showDesktop.addEventListener('click', () => {
      this.windows.forEach((win) => {
        win.classList.add('is-minimized');
      });
      this.updateTaskbar();
      sound.click(300, 0.02);
    });

    startMenu.querySelectorAll('[data-launch]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openApp(btn.dataset.launch);
        this.isStartOpen = false;
        startMenu.classList.remove('is-open');
        startBtn.classList.remove('is-active');
      });
    });

    startMenu.querySelectorAll('[data-open-doc]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openDocument(btn.dataset.openDoc);
        this.isStartOpen = false;
        startMenu.classList.remove('is-open');
        startBtn.classList.remove('is-active');
      });
    });

    startMenu.querySelectorAll('[data-open-folder]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openExplorer(btn.dataset.openFolder);
        this.isStartOpen = false;
        startMenu.classList.remove('is-open');
        startBtn.classList.remove('is-active');
      });
    });
  }

  openExplorer(folderKey = 'Projects') {
    const windowId = `explorer_${folderKey.toLowerCase()}`;
    if (this.windows.has(windowId)) {
      const win = this.windows.get(windowId);
      win.classList.remove('is-minimized');
      this.focusWindow(windowId);
      return;
    }

    const folderData = this.fileSystem[folderKey] || this.fileSystem['Projects'];
    this.currentExplorerPath = folderKey;

    this.highestZ++;
    const win = document.createElement('div');
    win.className = 'win-window';
    win.id = `win_${windowId}`;
    win.style.zIndex = this.highestZ;
    win.style.top = '50px';
    win.style.left = '90px';
    win.style.width = '780px';
    win.style.height = '480px';

    win.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title">
          <div class="win-icon-folder" style="width: 14px; height: 12px; margin-right: 6px;"><span class="win-icon-folder__body"></span></div>
          <span>${folderData.title}</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn win-ctrl-min" data-action="min" type="button" title="Minimize">—</button>
          <button class="win-ctrl-btn win-ctrl-max" data-action="max" type="button" title="Maximize">□</button>
          <button class="win-ctrl-btn win-ctrl-close" data-action="close" type="button" title="Close">&times;</button>
        </div>
      </div>
      <div class="win-explorer-toolbar">
        <div class="win-nav-buttons">
          <button class="win-tool-btn" data-nav="back" title="Back">←</button>
          <button class="win-tool-btn" data-nav="forward" title="Forward">→</button>
          <button class="win-tool-btn" data-nav="up" title="Up">↑</button>
        </div>
        <div class="win-address-bar">
          <span style="color:#888;">📁</span>
          <span>${folderData.path}</span>
        </div>
        <div class="win-explorer-search">
          <span style="color:#888;">🔍</span>
          <input type="text" placeholder="Search ${folderData.title}" />
        </div>
      </div>
      <div class="win-explorer-body">
        <div class="win-explorer-sidebar">
          <div class="win-side-section">Quick Access</div>
          <button class="win-side-item ${folderKey === 'Projects' ? 'is-active' : ''}" data-side="Projects" type="button">📁 Projects</button>
          <button class="win-side-item ${folderKey === 'Research' ? 'is-active' : ''}" data-side="Research" type="button">📄 Research</button>
          <button class="win-side-item ${folderKey === 'Hardware' ? 'is-active' : ''}" data-side="Hardware" type="button">⚙ Hardware 3D</button>
          <button class="win-side-item ${folderKey === 'RecycleBin' ? 'is-active' : ''}" data-side="RecycleBin" type="button">🗑 Recycle Bin</button>
          <div class="win-side-section" style="margin-top: 10px;">This PC</div>
          <div class="win-side-drive">🖴 Local Disk (C:)</div>
          <div class="win-side-drive">🖴 Engineering NVMe (D:)</div>
        </div>
        <div class="win-explorer-files" id="winExplorerFiles">
          ${folderData.items.map(item => `
            <div class="win-file-item" data-id="${item.id}" data-type="${item.type}" data-target="${item.target}">
              ${this.getIconHtml(item.iconType)}
              <div>
                <span class="win-file-name">${item.name}</span>
                <span class="win-file-desc">${item.desc}</span>
              </div>
              <span class="win-file-size">${item.size}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="win-explorer-statusbar">
        <span>${folderData.items.length} item(s)</span>
        <span>NTFS | Local Storage</span>
      </div>
    `;

    const layer = this.container.querySelector('#winWindowsLayer');
    layer.appendChild(win);
    this.windows.set(windowId, win);
    this.focusWindow(windowId);
    this.updateTaskbar();

    this.setupWindowInteractions(win, windowId);

    // Explorer file interaction
    win.querySelectorAll('.win-file-item').forEach(item => {
      item.addEventListener('dblclick', () => {
        const type = item.dataset.type;
        const target = item.dataset.target;
        if (type === 'app') {
          this.openApp(target);
        } else if (type === 'doc') {
          this.openDocument(target);
        } else if (type === 'cad') {
          this.onHardwareInspect?.(target);
          this.onExit?.();
        }
      });
    });

    win.querySelectorAll('.win-side-item').forEach(side => {
      side.addEventListener('click', () => {
        this.closeWindow(windowId);
        this.openExplorer(side.dataset.side);
      });
    });
  }

  openApp(appId) {
    const windowId = appId;
    if (this.windows.has(windowId)) {
      const win = this.windows.get(windowId);
      win.classList.remove('is-minimized');
      this.focusWindow(windowId);
      return;
    }

    let title = 'Application';
    let iconClass = 'win-icon-app--cmd';
    let defaultWidth = '880px';
    let defaultHeight = '560px';

    if (appId === 'windsim') {
      title = 'WindSim — LBM CFD Aerodynamics Platform';
      iconClass = 'win-icon-app--wind';
    } else if (appId === 'berry') {
      title = 'Berry AI — Local Desktop Assistant';
      iconClass = 'win-icon-app--ai';
    } else if (appId === 'berrybot') {
      title = 'BerryBot — Tracked Robotics Platform';
      iconClass = 'win-icon-app--robot';
    } else if (appId === 'terminal') {
      title = 'Command Prompt (Administrator: C:\\Windows\\System32\\cmd.exe)';
      iconClass = 'win-icon-app--cmd';
      defaultWidth = '860px';
      defaultHeight = '520px';
    } else if (appId === 'timeline') {
      title = 'Projects & Hackathons Directory';
      iconClass = 'win-icon-app--game';
    } else if (appId === 'contact') {
      title = 'Contact Dispatch — Direct Communication';
      iconClass = 'win-icon-app--mail';
      defaultWidth = '620px';
      defaultHeight = '480px';
    }

    this.highestZ++;
    const win = document.createElement('div');
    win.className = 'win-window';
    win.id = `win_${windowId}`;
    win.style.zIndex = this.highestZ;
    win.style.top = '40px';
    win.style.left = '60px';
    win.style.width = defaultWidth;
    win.style.height = defaultHeight;

    win.innerHTML = `
      <div class="win-titlebar">
        <div class="win-title">
          <div class="win-icon-app ${iconClass}" style="width: 14px; height: 14px; font-size: 8px; margin-right: 6px;"></div>
          <span>${title}</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn win-ctrl-min" data-action="min" type="button" title="Minimize">—</button>
          <button class="win-ctrl-btn win-ctrl-max" data-action="max" type="button" title="Maximize">□</button>
          <button class="win-ctrl-btn win-ctrl-close" data-action="close" type="button" title="Close">&times;</button>
        </div>
      </div>
      <div class="win-app-body" id="appBody_${windowId}"></div>
    `;

    const layer = this.container.querySelector('#winWindowsLayer');
    layer.appendChild(win);
    this.windows.set(windowId, win);
    this.focusWindow(windowId);
    this.updateTaskbar();

    this.setupWindowInteractions(win, windowId);

    const body = win.querySelector(`#appBody_${windowId}`);
    this.mountAppContent(appId, body);
  }

  openDocument(fileId) {
    const windowId = `doc_${fileId}`;
    if (this.windows.has(windowId)) {
      const win = this.windows.get(windowId);
      win.classList.remove('is-minimized');
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

[ IDENTITY & ACADEMIC AFFILIATION ]
Name: Jaijitesh Suryaprakash
University: VIT Vellore (Vellore Institute of Technology)
Degree: B.Tech Information Technology (2025–2029, 1st Year)

[ CONTACT & DISPATCH ]
Email: jaijiteshsp@gmail.com
Phone: +91 9940970749
GitHub: https://github.com/BerrF35
LinkedIn: https://linkedin.com/in/jaijitesh-suryaprakash-j

[ CORE TECHNICAL PILLARS ]
1. Scientific Simulation: Real-time Lattice Boltzmann Method (LBM) CFD aerodynamics.
2. Local-First AI Agents: Desktop CUA automation, persistent memory, and tool orchestration.
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
Repo: https://github.com/BerrF35
      `;
    } else if (fileId === 'farmassist') {
      title = 'FarmAssist_AI.txt - Notepad';
      content = `
[ FARMASSIST AI — YANTRA 26 CENTRAL HACK ]
Role: Lead & Primary Developer
Domain: Edge Computer Vision & Agricultural Disease Diagnostics
Stack: PyTorch, OpenCV, Raspberry Pi edge vision deployment.
Repo: https://github.com/BerrF35
      `;
    } else if (fileId === 'vinhack') {
      title = 'VinHack_25_Exchange.txt - Notepad';
      content = `
[ VINHACK 25 — P2P BOOK EXCHANGE ]
Role: Lead Developer
Domain: Peer-to-Peer Distributed Resource Exchange
Repo: https://github.com/BerrF35
      `;
    } else if (fileId === 'res_synth' || fileId === 'res_color' || fileId === 'res_vision') {
      title = `${fileId}.pdf - Document Viewer`;
      content = `
[ RESEARCH PAPERS IN PREPARATION ]
Group: 5-Person Academic Research Group with Professor
Status: Active experimentation, mathematical validation, and manuscript preparation.

Topics:
- Synthetic data generation pipelines for robust edge classification.
- Spectral color-space image decomposition and optical filtering.
- Embedded vision integration on low-power ARM microcontrollers.

Contact: jaijiteshsp@gmail.com
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
        <pre style="white-space: pre-wrap; font-family: monospace;">${content.trim()}</pre>
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
      if (id === 'timeline') title = 'Projects Timeline';

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
      this.renderWindSimApp(body);
    } else if (id === 'berry') {
      this.renderBerryApp(body);
    } else if (id === 'berrybot') {
      this.renderBerryBotApp(body);
    } else if (id === 'timeline') {
      this.renderTimelineApp(body);
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

  renderWindSimApp(body) {
    body.innerHTML = `
      <div style="padding: 28px 32px; background: #121212; color: #ffffff; font-family: 'Segoe UI', sans-serif; height: 100%; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #282828; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #0078d7; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;">Aerodynamics &amp; Computational Physics // Best Work</div>
            <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 8px 0; color: #ffffff;">WindSim — Real-Time LBM CFD Platform</h1>
            <p style="margin: 0; color: #aaaaaa; font-size: 13px; line-height: 1.5; max-width: 640px;">
              Real-time browser computational fluid dynamics aerodynamic analysis platform powered by the Lattice Boltzmann Method (LBM). Designed for interactive aerodynamic research, boundary layer visualization, and airfoil drag/lift analysis.
            </p>
          </div>
          <a href="https://github.com/BerrF35" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: #0078d7; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 600; cursor: pointer; border: 0;">
            <span>View Project on GitHub</span>
            <span>↗</span>
          </a>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 28px; margin-bottom: 24px;">
          <div>
            <h3 style="font-size: 13px; font-weight: 600; color: #ffffff; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Technical Architecture &amp; Solvers</h3>
            <div style="background: #181818; border: 1px solid #282828; padding: 18px; line-height: 1.6; font-size: 12.5px; color: #cccccc; display: grid; gap: 12px;">
              <div>
                <b style="color: #ffffff;">Lattice Boltzmann Formulation:</b> Utilizes the discrete D2Q9 lattice velocity discretization with Bhatnagar-Gross-Krook (BGK) single-relaxation-time collision modeling.
              </div>
              <div>
                <b style="color: #ffffff;">Boundary Condition Formulation:</b> Full bounce-back collision for solid obstacle geometries with Zou-He velocity boundaries at the domain inlet and open pressure boundaries at the outlet.
              </div>
              <div>
                <b style="color: #ffffff;">Aerodynamic Extraction:</b> Computes macroscopic density $\rho$ and velocity vectors $\mathbf{u}$ per lattice node in real time to calculate dynamic pressure, vorticity curl $\nabla \times \mathbf{u}$, streamline topologies, and forces ($C_d$, $C_l$).
              </div>
            </div>
          </div>

          <div>
            <h3 style="font-size: 13px; font-weight: 600; color: #ffffff; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Specification Sheet</h3>
            <div style="background: #181818; border: 1px solid #282828; padding: 18px; font-size: 12px;">
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Method:</span><span style="color: #fff; font-weight: 500;">LBM D2Q9 BGK</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Compute:</span><span style="color: #fff; font-weight: 500;">WebGL 2.0 / GLSL</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Frame Rate:</span><span style="color: #fff; font-weight: 500;">60 FPS Real-Time</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Profiles:</span><span style="color: #fff; font-weight: 500;">NACA 0012, NACA 2412, Cylinder</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px;">
                <span style="color: #888;">Status:</span><span style="color: #38ef7d; font-weight: 500;">Active Production</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderBerryApp(body) {
    body.innerHTML = `
      <div style="padding: 28px 32px; background: #121212; color: #ffffff; font-family: 'Segoe UI', sans-serif; height: 100%; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #282828; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #7b1fa2; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;">Autonomous Agents &amp; Systems</div>
            <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 8px 0; color: #ffffff;">Berry AI — Local Desktop Assistant</h1>
            <p style="margin: 0; color: #aaaaaa; font-size: 13px; line-height: 1.5; max-width: 640px;">
              Fully local desktop assistant with Computer-Use Automation (CUA), persistent multi-turn vector memory, semantic tooling orchestration, and browser control relay.
            </p>
          </div>
          <a href="https://github.com/BerrF35" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: #7b1fa2; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 600; cursor: pointer; border: 0;">
            <span>View Project on GitHub</span>
            <span>↗</span>
          </a>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 28px; margin-bottom: 24px;">
          <div>
            <h3 style="font-size: 13px; font-weight: 600; color: #ffffff; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Core Capabilities &amp; Pipeline</h3>
            <div style="background: #181818; border: 1px solid #282828; padding: 18px; line-height: 1.6; font-size: 12.5px; color: #cccccc; display: grid; gap: 12px;">
              <div>
                <b style="color: #ffffff;">Local-First Inference:</b> Zero-telemetry local LLM orchestration running quant models via Ollama / Llama.cpp with sub-50ms token dispatch.
              </div>
              <div>
                <b style="color: #ffffff;">Computer-Use Automation (CUA):</b> Direct OS interaction layer capable of multi-step window control, shell execution, file indexing, and GUI automation.
              </div>
              <div>
                <b style="color: #ffffff;">Persistent Semantic Memory:</b> Local embedding vector database indexing past developer conversations, project files, and user preferences with hybrid keyword/vector search.
              </div>
            </div>
          </div>

          <div>
            <h3 style="font-size: 13px; font-weight: 600; color: #ffffff; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Specification Sheet</h3>
            <div style="background: #181818; border: 1px solid #282828; padding: 18px; font-size: 12px;">
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Language:</span><span style="color: #fff; font-weight: 500;">Python 3.11</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Memory:</span><span style="color: #fff; font-weight: 500;">SQLite / ChromaDB</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">License:</span><span style="color: #fff; font-weight: 500;">AGPL-3.0</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Platform:</span><span style="color: #fff; font-weight: 500;">Windows / Linux</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px;">
                <span style="color: #888;">Status:</span><span style="color: #38ef7d; font-weight: 500;">Active Dev</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderBerryBotApp(body) {
    body.innerHTML = `
      <div style="padding: 28px 32px; background: #121212; color: #ffffff; font-family: 'Segoe UI', sans-serif; height: 100%; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #282828; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #e65100; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;">Robotics &amp; Embedded Systems</div>
            <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 8px 0; color: #ffffff;">BerryBot — Tracked Autonomous Robotics</h1>
            <p style="margin: 0; color: #aaaaaa; font-size: 13px; line-height: 1.5; max-width: 640px;">
              High-speed tracked autonomous ground robot equipped with dual-core ESP32 motor control, optical quadrature encoders, 20kHz PWM H-bridge drivers, and Raspberry Pi 4 edge compute.
            </p>
          </div>
          <a href="https://github.com/BerrF35" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: #e65100; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 600; cursor: pointer; border: 0;">
            <span>View Project on GitHub</span>
            <span>↗</span>
          </a>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 28px; margin-bottom: 24px;">
          <div>
            <h3 style="font-size: 13px; font-weight: 600; color: #ffffff; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Hardware &amp; Control Engineering</h3>
            <div style="background: #181818; border: 1px solid #282828; padding: 18px; line-height: 1.6; font-size: 12.5px; color: #cccccc; display: grid; gap: 12px;">
              <div>
                <b style="color: #ffffff;">Custom Chassis Design:</b> Custom SolidWorks CAD M4 high-speed tractor chassis with low ground pressure, high traction rubber treads, and integrated sensor mounts.
              </div>
              <div>
                <b style="color: #ffffff;">Real-Time Kinematics &amp; PID:</b> ESP-WROOM-32 running FreeRTOS tasks with hardware timers generating 20kHz PWM signals for noise-free motor driving, closed-loop PID velocity control, and optical odometry.
              </div>
              <div>
                <b style="color: #ffffff;">Edge Computer Vision:</b> Onboard Raspberry Pi 4 running OpenCV edge perception, line/obstacle detection, and telemetry streaming over local WebSocket.
              </div>
            </div>
          </div>

          <div>
            <h3 style="font-size: 13px; font-weight: 600; color: #ffffff; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Specification Sheet</h3>
            <div style="background: #181818; border: 1px solid #282828; padding: 18px; font-size: 12px;">
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Chassis:</span><span style="color: #fff; font-weight: 500;">SolidWorks M4 Tracked</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">MCU:</span><span style="color: #fff; font-weight: 500;">ESP32 Dual-Core 240MHz</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Compute:</span><span style="color: #fff; font-weight: 500;">Raspberry Pi 4 Model B</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #222; padding-bottom: 6px;">
                <span style="color: #888;">Firmware:</span><span style="color: #fff; font-weight: 500;">C++ / FreeRTOS 20kHz</span>
              </div>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px;">
                <span style="color: #888;">Status:</span><span style="color: #38ef7d; font-weight: 500;">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderTimelineApp(body) {
    body.innerHTML = `
      <div style="padding: 28px 32px; background: #121212; color: #ffffff; font-family: 'Segoe UI', sans-serif; height: 100%; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #282828; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <div style="font-size: 11px; font-weight: 600; color: #c2185b; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;">Engineering Milestones &amp; Index</div>
            <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 8px 0; color: #ffffff;">Projects &amp; Hackathons Directory</h1>
            <p style="margin: 0; color: #aaaaaa; font-size: 13px; line-height: 1.5; max-width: 640px;">
              Chronological overview of lead engineering contributions across hackathons, research labs, and open source platforms.
            </p>
          </div>
          <a href="https://github.com/BerrF35" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: #c2185b; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 600; cursor: pointer; border: 0;">
            <span>GitHub Profile</span>
            <span>↗</span>
          </a>
        </div>

        <div style="display: grid; gap: 16px;">
          <div style="background: #181818; border: 1px solid #282828; padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <h3 style="font-size: 14px; font-weight: 600; color: #ffffff; margin: 0;">ImpactX 3.0 Hackathon — 3rd Place Overall</h3>
              <span style="font-size: 11px; color: #38ef7d; font-weight: 600;">3rd Place Lead Developer</span>
            </div>
            <p style="font-size: 12.5px; color: #aaaaaa; margin: 0; line-height: 1.5;">
              Led development of a high-throughput geospatial dispatch and real-time logistics routing platform with automated order assignment.
            </p>
          </div>

          <div style="background: #181818; border: 1px solid #282828; padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <h3 style="font-size: 14px; font-weight: 600; color: #ffffff; margin: 0;">FarmAssist AI — Yantra 26 Central Hack</h3>
              <span style="font-size: 11px; color: #0078d7; font-weight: 600;">Lead Developer</span>
            </div>
            <p style="font-size: 12.5px; color: #aaaaaa; margin: 0; line-height: 1.5;">
              Engineered edge computer vision pipeline for agricultural disease identification running on local edge microcomputers.
            </p>
          </div>

          <div style="background: #181818; border: 1px solid #282828; padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <h3 style="font-size: 14px; font-weight: 600; color: #ffffff; margin: 0;">VinHack 25 — Peer-to-Peer Exchange</h3>
              <span style="font-size: 11px; color: #7b1fa2; font-weight: 600;">Lead Coder</span>
            </div>
            <p style="font-size: 12.5px; color: #aaaaaa; margin: 0; line-height: 1.5;">
              Designed and deployed decentralized peer-to-peer student resource and book exchange network.
            </p>
          </div>

          <div style="background: #181818; border: 1px solid #282828; padding: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <h3 style="font-size: 14px; font-weight: 600; color: #ffffff; margin: 0;">Academic Research Group — 3 Papers in Preparation</h3>
              <span style="font-size: 11px; color: #e65100; font-weight: 600;">Research Co-Author</span>
            </div>
            <p style="font-size: 12.5px; color: #aaaaaa; margin: 0; line-height: 1.5;">
              Collaborating on 3 academic research papers with faculty group covering synthetic data generation pipelines, spectral color-space image decomposition, and embedded vision systems.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  renderContactApp(body) {
    body.innerHTML = `
      <div class="win-contact-form" style="padding: 24px; color: #ffffff; font-family: 'Segoe UI', sans-serif; background: #181818; height: 100%;">
        <h3 style="margin-top: 0; color: #ffffff; font-size: 15px;">Direct Contact &amp; Dispatch</h3>
        <p style="color: #888888; font-size: 11.5px; margin-bottom: 16px;">Send a direct communication to Jaijitesh Suryaprakash (jaijiteshsp@gmail.com).</p>
        <div style="display: grid; gap: 12px; max-width: 480px;">
          <div>
            <label style="display: block; font-size: 11px; color: #aaaaaa; margin-bottom: 4px;">Name</label>
            <input type="text" style="width: 100%; padding: 6px 10px; background: #242424; border: 1px solid #383838; color: #ffffff; font-size: 12px;" placeholder="Your Name" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; color: #aaaaaa; margin-bottom: 4px;">Email</label>
            <input type="email" style="width: 100%; padding: 6px 10px; background: #242424; border: 1px solid #383838; color: #ffffff; font-size: 12px;" placeholder="your.email@domain.com" />
          </div>
          <div>
            <label style="display: block; font-size: 11px; color: #aaaaaa; margin-bottom: 4px;">Message</label>
            <textarea rows="4" style="width: 100%; padding: 6px 10px; background: #242424; border: 1px solid #383838; color: #ffffff; font-size: 12px; font-family: inherit;" placeholder="Enter your message..."></textarea>
          </div>
          <button type="button" style="padding: 8px 16px; background: #0078d7; color: #ffffff; border: 0; font-weight: 600; font-size: 12px; cursor: pointer; justify-self: start;" onclick="alert('Message queued for Jaijitesh (jaijiteshsp@gmail.com)');">Send Message</button>
        </div>
      </div>
    `;
  }
}
