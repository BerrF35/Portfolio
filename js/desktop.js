import { sound } from './audio.js';
import { TerminalEngine } from './terminal.js';
import { WindSimulator } from './simWind.js';
import { RobotSimulator } from './simRobot.js';
import { AgentSimulator } from './simAgent.js';
import {
  IDENTITY,
  PROJECTS,
  RESEARCH,
  HARDWARE_DEFINITIONS,
  TIMELINE_MILESTONES,
  VIRTUAL_FILESYSTEM
} from './portfolioData.js';

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

    this.desktopItems = VIRTUAL_FILESYSTEM['Desktop'].items;
    this.fileSystem = VIRTUAL_FILESYSTEM;

    this.init();
  }

  init() {
    this.renderDesktop();
    this.startClock();
  }

  open() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  close() {
    this.closeStartMenu();
    const ctx = this.container?.querySelector('#winContextMenu');
    if (ctx) ctx.style.display = 'none';
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
        return `<div class="win-icon-app win-icon-app--game"><span>TIM</span></div>`;
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
        <!-- Desktop Wallpaper Surface with Icons -->
        <div class="win-desktop-surface" id="winDesktopSurface">
          <div class="win-icons-grid" id="winIconsGrid">
            ${this.desktopItems.map(item => `
              <div class="win-desktop-icon" data-id="${item.id}" data-type="${item.type}" data-target="${item.target}" tabindex="0" role="button" aria-label="Open ${item.name}">
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
              <b>${IDENTITY.name}</b>
              <small>${IDENTITY.degree} • ${IDENTITY.university.split('(')[0].trim()}</small>
            </div>
          </div>
          <div class="win-start-search">
            <span style="color:#888;">🔍</span>
            <input type="text" placeholder="Search applications, projects, research..." id="winStartSearchInput" />
          </div>
          
          <div id="winStartMainView">
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
                <div class="win-icon-app win-icon-app--game"><span>TIM</span></div>
                <span>Timeline</span>
              </button>
              <button class="win-start-app-item" data-launch="contact" type="button">
                <div class="win-icon-app win-icon-app--mail"><span>@</span></div>
                <span>Contact</span>
              </button>
            </div>

            <div class="win-start-section-title">Quick Access &amp; Documents</div>
            <div class="win-start-recent-list">
              <button class="win-start-recent-item" data-open-doc="about" type="button">
                <div class="win-icon-doc win-icon-doc--txt" style="width: 14px; height: 18px;"><span class="win-icon-doc__corner"></span></div>
                <div><b>About_Dossier.txt</b><small>Developer Profile &amp; Research Focus</small></div>
              </button>
              <button class="win-start-recent-item" data-launch="impactx" type="button">
                <div class="win-icon-doc win-icon-doc--txt" style="width: 14px; height: 18px;"><span class="win-icon-doc__corner"></span></div>
                <div><b>ImpactX_3.0_Winner.txt</b><small>3rd Place Overall Hackathon Case File</small></div>
              </button>
              <button class="win-start-recent-item" data-open-folder="Research" type="button">
                <div class="win-icon-folder" style="width: 18px; height: 14px;"><span class="win-icon-folder__body"></span></div>
                <div><b>Research Papers</b><small>ColorSplitter &amp; Synthetic Data Pipelines</small></div>
              </button>
              <button class="win-start-recent-item" data-open-folder="Hardware" type="button">
                <div class="win-icon-folder" style="width: 18px; height: 14px;"><span class="win-icon-folder__body"></span></div>
                <div><b>Hardware 3D</b><small>SolidWorks CAD &amp; Robotics Models</small></div>
              </button>
            </div>
          </div>

          <div id="winStartSearchResults" style="display: none; padding: 10px 16px; flex: 1; overflow-y: auto;"></div>

          <div class="win-start-menu__footer">
            <button class="win-start-power-btn" id="winExitBenchBtn" type="button">
              <span>⏻</span>
              <span>Exit to 3D Bench</span>
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

        <!-- Lightbox Overlay for Real Project Images -->
        <div class="win-lightbox" id="winLightbox" hidden>
          <div class="win-lightbox__backdrop" id="winLightboxBackdrop"></div>
          <div class="win-lightbox__content">
            <button class="win-lightbox__close" id="winLightboxClose" type="button">&times;</button>
            <img class="win-lightbox__img" id="winLightboxImg" src="" alt="Project Evidence Preview" />
            <div class="win-lightbox__caption" id="winLightboxCaption"></div>
          </div>
        </div>

        <!-- Desktop Context Menu -->
        <div class="win-context-menu" id="winContextMenu" style="display: none; position: fixed; z-index: 99999; background: #181d24; border: 1px solid #384252; box-shadow: 0 10px 30px rgba(0,0,0,0.85); min-width: 190px; padding: 4px 0;">
          <button class="win-ctx-item" data-ctx="explorer" type="button" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 14px; background: none; border: 0; color: #fff; font-size: 11.5px; text-align: left; cursor: pointer;">📁 Open File Explorer</button>
          <button class="win-ctx-item" data-ctx="terminal" type="button" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 14px; background: none; border: 0; color: #fff; font-size: 11.5px; text-align: left; cursor: pointer;">🖥️ Open Command Prompt</button>
          <button class="win-ctx-item" data-ctx="timeline" type="button" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 14px; background: none; border: 0; color: #fff; font-size: 11.5px; text-align: left; cursor: pointer;">📊 Open Projects Timeline</button>
          <button class="win-ctx-item" data-ctx="about" type="button" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 14px; background: none; border: 0; color: #fff; font-size: 11.5px; text-align: left; cursor: pointer;">📄 View About Dossier</button>
          <div style="border-top: 1px solid #283342; margin: 4px 0;"></div>
          <button class="win-ctx-item" data-ctx="theme" type="button" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 14px; background: none; border: 0; color: #fff; font-size: 11.5px; text-align: left; cursor: pointer;">◐ Toggle Display Theme</button>
          <button class="win-ctx-item" data-ctx="sound" type="button" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 14px; background: none; border: 0; color: #fff; font-size: 11.5px; text-align: left; cursor: pointer;">🔊 Toggle Audio Mute</button>
          <div style="border-top: 1px solid #283342; margin: 4px 0;"></div>
          <button class="win-ctx-item" data-ctx="exit" type="button" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 14px; background: none; border: 0; color: #38bdf8; font-size: 11.5px; text-align: left; cursor: pointer;">⏻ Exit to 3D Bench</button>
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
    const startSearchInput = this.container.querySelector('#winStartSearchInput');
    const taskbarSearchInput = this.container.querySelector('#winTaskbarSearchInput');
    const lightbox = this.container.querySelector('#winLightbox');
    const lightboxClose = this.container.querySelector('#winLightboxClose');
    const lightboxBackdrop = this.container.querySelector('#winLightboxBackdrop');

    const surface = this.container.querySelector('#winDesktopSurface');
    const ctxMenu = this.container.querySelector('#winContextMenu');

    // Desktop Right-Click Context Menu
    surface?.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!ctxMenu) return;
      ctxMenu.style.display = 'block';
      ctxMenu.style.left = `${Math.min(window.innerWidth - 210, e.clientX)}px`;
      ctxMenu.style.top = `${Math.min(window.innerHeight - 250, e.clientY)}px`;
      sound.tick(1100);
    });

    document.addEventListener('click', (e) => {
      if (ctxMenu && !ctxMenu.contains(e.target)) {
        ctxMenu.style.display = 'none';
      }
    });

    ctxMenu?.querySelectorAll('.win-ctx-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.ctx;
        ctxMenu.style.display = 'none';
        if (action === 'explorer') this.openExplorer('Projects');
        else if (action === 'terminal') this.openApp('terminal');
        else if (action === 'timeline') this.openApp('timeline');
        else if (action === 'about') this.openDocument('about');
        else if (action === 'theme') {
          const cur = document.documentElement.getAttribute('data-theme') || 'dark';
          const nxt = cur === 'dark' ? 'matrix' : (cur === 'matrix' ? 'light' : 'dark');
          document.documentElement.setAttribute('data-theme', nxt);
          window.set3DTheme?.(nxt);
        } else if (action === 'sound') {
          sound.toggleMute();
        } else if (action === 'exit') {
          this.onExit?.();
        }
        sound.click(600, 0.02);
      });
    });

    // Window Cycle via Tab
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && (e.altKey || document.activeElement === document.body)) {
        const keys = Array.from(this.windows.keys());
        if (keys.length > 1) {
          e.preventDefault();
          const curIdx = keys.indexOf(this.activeWindowId);
          const nextIdx = (curIdx + 1) % keys.length;
          const nextId = keys[nextIdx];
          const nextWin = this.windows.get(nextId);
          if (nextWin) {
            nextWin.classList.remove('is-minimized');
            this.focusWindow(nextId);
            sound.tick(1300);
          }
        }
      }
    });

    // Desktop icons click and double click
    grid.querySelectorAll('.win-desktop-icon').forEach(icon => {
      icon.addEventListener('click', () => {
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

    // Start Menu toggle
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleStartMenu();
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

    const traySoundBtn = this.container.querySelector('#winTraySoundBtn');
    const trayThemeBtn = this.container.querySelector('#winTrayThemeBtn');

    traySoundBtn?.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      traySoundBtn.textContent = isMuted ? '🔇' : '🔊';
      traySoundBtn.title = isMuted ? 'Unmute Audio' : 'Mute Audio';
      sound.click(600, 0.02);
    });

    trayThemeBtn?.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'dark' ? 'matrix' : (currentTheme === 'matrix' ? 'light' : 'dark');
      document.documentElement.setAttribute('data-theme', nextTheme);
      window.set3DTheme?.(nextTheme);
      sound.click(750, 0.02);
    });

    showDesktop.addEventListener('click', () => {
      this.windows.forEach((win) => {
        win.classList.add('is-minimized');
      });
      this.updateTaskbar();
      sound.click(300, 0.02);
    });

    // Start menu app launches
    startMenu.querySelectorAll('[data-launch]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openApp(btn.dataset.launch);
        this.closeStartMenu();
      });
    });

    startMenu.querySelectorAll('[data-open-doc]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openDocument(btn.dataset.openDoc);
        this.closeStartMenu();
      });
    });

    startMenu.querySelectorAll('[data-open-folder]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openExplorer(btn.dataset.openFolder);
        this.closeStartMenu();
      });
    });

    // Start menu search
    const handleSearch = (val) => {
      const q = val.trim().toLowerCase();
      const mainView = this.container.querySelector('#winStartMainView');
      const resultsView = this.container.querySelector('#winStartSearchResults');

      if (!q) {
        if (mainView) mainView.style.display = 'block';
        if (resultsView) resultsView.style.display = 'none';
        return;
      }

      if (mainView) mainView.style.display = 'none';
      if (resultsView) {
        resultsView.style.display = 'block';
        const matches = [];

        // Search projects
        Object.values(PROJECTS).forEach(p => {
          if (p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) {
            matches.push({ title: p.title, subtitle: `Project • ${p.category}`, type: 'project', id: p.id });
          }
        });

        // Search research
        Object.values(RESEARCH).forEach(r => {
          if (r.title.toLowerCase().includes(q) || r.abstract.toLowerCase().includes(q)) {
            matches.push({ title: r.title, subtitle: `Research • ${r.category}`, type: 'research', id: r.id });
          }
        });

        // Search hardware
        Object.values(HARDWARE_DEFINITIONS).forEach(h => {
          if (h.title.toLowerCase().includes(q) || h.summary.toLowerCase().includes(q)) {
            matches.push({ title: h.title.split('//')[0].trim(), subtitle: `Hardware 3D • ${h.category}`, type: 'cad', id: h.id });
          }
        });

        if (matches.length === 0) {
          resultsView.innerHTML = `<div style="color: #888; font-size: 11.5px; padding: 12px 0;">No matching applications, projects, or research files found.</div>`;
        } else {
          resultsView.innerHTML = `
            <div style="font-size: 10.5px; font-weight: 600; color: #888; text-transform: uppercase; margin-bottom: 8px;">Search Results (${matches.length})</div>
            <div style="display: grid; gap: 4px;">
              ${matches.map(m => `
                <button class="win-start-search-item" data-type="${m.type}" data-id="${m.id}" type="button" style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 8px 10px; background: #202020; border: 1px solid #2e2e2e; color: #fff; text-align: left; cursor: pointer; width: 100%;">
                  <b style="font-size: 12px; color: #38bdf8;">${m.title}</b>
                  <small style="font-size: 10px; color: #aaa;">${m.subtitle}</small>
                </button>
              `).join('')}
            </div>
          `;

          resultsView.querySelectorAll('.win-start-search-item').forEach(item => {
            item.addEventListener('click', () => {
              const t = item.dataset.type;
              const id = item.dataset.id;
              if (t === 'project') {
                this.openApp(id);
              } else if (t === 'research') {
                this.openDocument(id);
              } else if (t === 'cad') {
                this.onHardwareInspect?.(id);
                this.onExit?.();
              }
              this.closeStartMenu();
            });
          });
        }
      }
    };

    if (startSearchInput) {
      startSearchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }

    if (taskbarSearchInput) {
      taskbarSearchInput.addEventListener('focus', () => {
        this.openStartMenu();
        setTimeout(() => startSearchInput?.focus(), 50);
      });
    }

    // Lightbox handlers
    const hideLightbox = () => {
      if (lightbox) {
        lightbox.hidden = true;
        lightbox.classList.remove('is-open');
      }
    };

    lightboxClose?.addEventListener('click', hideLightbox);
    lightboxBackdrop?.addEventListener('click', hideLightbox);
  }

  toggleStartMenu() {
    this.isStartOpen = !this.isStartOpen;
    const startMenu = this.container.querySelector('#winStartMenu');
    const startBtn = this.container.querySelector('#winStartToggleBtn');
    startMenu?.classList.toggle('is-open', this.isStartOpen);
    startBtn?.classList.toggle('is-active', this.isStartOpen);
    sound.tick(800);
  }

  openStartMenu() {
    this.isStartOpen = true;
    const startMenu = this.container.querySelector('#winStartMenu');
    const startBtn = this.container.querySelector('#winStartToggleBtn');
    startMenu?.classList.add('is-open');
    startBtn?.classList.add('is-active');
  }

  closeStartMenu() {
    this.isStartOpen = false;
    const startMenu = this.container.querySelector('#winStartMenu');
    const startBtn = this.container.querySelector('#winStartToggleBtn');
    startMenu?.classList.remove('is-open');
    startBtn?.classList.remove('is-active');
  }

  showLightbox(src, caption) {
    const lightbox = this.container.querySelector('#winLightbox');
    const img = this.container.querySelector('#winLightboxImg');
    const cap = this.container.querySelector('#winLightboxCaption');
    if (!lightbox || !img) return;

    img.src = src;
    if (cap) cap.textContent = caption || '';
    lightbox.hidden = false;
    lightbox.classList.add('is-open');
    sound.click(750, 0.02);
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
    win.style.top = '48px';
    win.style.left = '80px';
    win.style.width = '820px';
    win.style.height = '510px';

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
          <input type="text" placeholder="Search ${folderData.title}" class="win-explorer-filter" />
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
          <div class="win-side-drive">🖴 Local System (C:)</div>
          <div class="win-side-drive">🖴 Engineering NVMe (D:)</div>
        </div>
        <div class="win-explorer-files" id="winExplorerFiles_${windowId}">
          ${folderData.items.map(item => `
            <div class="win-file-item" data-id="${item.id}" data-type="${item.type}" data-target="${item.target}" tabindex="0">
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

    // Explorer filter search
    const filterInput = win.querySelector('.win-explorer-filter');
    const fileContainer = win.querySelector(`#winExplorerFiles_${windowId}`);
    filterInput?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      fileContainer.querySelectorAll('.win-file-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'grid' : 'none';
      });
    });

    // Explorer file interaction
    win.querySelectorAll('.win-file-item').forEach(item => {
      item.addEventListener('click', () => {
        win.querySelectorAll('.win-file-item').forEach(i => i.classList.remove('is-selected'));
        item.classList.add('is-selected');
        sound.tick(1200);
      });

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
        sound.click(600, 0.03);
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
    let defaultWidth = '920px';
    let defaultHeight = '590px';

    if (appId === 'windsim') {
      title = 'WindSim — Real-Time LBM CFD Aerodynamics Platform';
      iconClass = 'win-icon-app--wind';
      defaultWidth = '980px';
      defaultHeight = '620px';
    } else if (appId === 'berry') {
      title = 'Berry AI — Local-First Desktop Assistant';
      iconClass = 'win-icon-app--ai';
      defaultWidth = '940px';
      defaultHeight = '600px';
    } else if (appId === 'berrybot') {
      title = 'BerryBot — Tracked Autonomous Robotics Platform';
      iconClass = 'win-icon-app--robot';
      defaultWidth = '960px';
      defaultHeight = '610px';
    } else if (appId === 'impactx') {
      title = 'ImpactX 3.0 — 3rd Place Overall Hackathon Case File';
      iconClass = 'win-icon-app--cmd';
    } else if (appId === 'farmassist') {
      title = 'FarmAssist AI — Agricultural Disease Diagnostics';
      iconClass = 'win-icon-app--cmd';
    } else if (appId === 'vinhack') {
      title = 'VinHack 25 — Peer-to-Peer Academic Resource Exchange';
      iconClass = 'win-icon-app--cmd';
    } else if (appId === 'terminal') {
      title = 'Command Prompt (Administrator: C:\\Windows\\System32\\cmd.exe)';
      iconClass = 'win-icon-app--cmd';
      defaultWidth = '880px';
      defaultHeight = '530px';
    } else if (appId === 'timeline') {
      title = 'Projects & Hackathons Timeline Directory';
      iconClass = 'win-icon-app--game';
      defaultWidth = '900px';
      defaultHeight = '560px';
    } else if (appId === 'contact') {
      title = 'Contact Dispatch — Direct Communication';
      iconClass = 'win-icon-app--mail';
      defaultWidth = '660px';
      defaultHeight = '510px';
    }

    this.highestZ++;
    const win = document.createElement('div');
    win.className = 'win-window';
    win.id = `win_${windowId}`;
    win.style.zIndex = this.highestZ;
    win.style.top = '36px';
    win.style.left = '54px';
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
    if (PROJECTS[fileId]) {
      this.openApp(fileId);
      return;
    }

    const windowId = `doc_${fileId}`;
    if (this.windows.has(windowId)) {
      const win = this.windows.get(windowId);
      win.classList.remove('is-minimized');
      this.focusWindow(windowId);
      return;
    }

    this.highestZ++;
    const win = document.createElement('div');
    win.className = 'win-window';
    win.id = `win_${windowId}`;
    win.style.zIndex = this.highestZ;
    win.style.top = '60px';
    win.style.left = '100px';
    win.style.width = '780px';
    win.style.height = '520px';

    if (fileId === 'about') {
      win.innerHTML = `
        <div class="win-titlebar">
          <div class="win-title">
            <div class="win-icon-doc win-icon-doc--txt" style="width: 12px; height: 14px; margin-right: 6px;"><span class="win-icon-doc__corner"></span></div>
            <span>About_Dossier.txt - Identity &amp; Affiliation Dossier</span>
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
        <div class="win-app-body" id="docBody_${windowId}"></div>
      `;
    } else {
      win.innerHTML = `
        <div class="win-titlebar">
          <div class="win-title">
            <div class="win-icon-doc win-icon-doc--pdf" style="width: 12px; height: 14px; margin-right: 6px;"><span class="win-icon-doc__corner"></span></div>
            <span>${fileId}.pdf - Document Viewer</span>
          </div>
          <div class="win-controls">
            <button class="win-ctrl-btn win-ctrl-min" data-action="min" type="button" title="Minimize">—</button>
            <button class="win-ctrl-btn win-ctrl-max" data-action="max" type="button" title="Maximize">□</button>
            <button class="win-ctrl-btn win-ctrl-close" data-action="close" type="button" title="Close">&times;</button>
          </div>
        </div>
        <div class="win-app-body" id="docBody_${windowId}"></div>
      `;
    }

    const layer = this.container.querySelector('#winWindowsLayer');
    layer.appendChild(win);
    this.windows.set(windowId, win);
    this.focusWindow(windowId);
    this.updateTaskbar();
    this.setupWindowInteractions(win, windowId);

    const body = win.querySelector(`#docBody_${windowId}`);
    if (fileId === 'about') {
      this.renderAboutDossier(body);
    } else if (fileId === 'res_color' || fileId === 'res_synth' || fileId === 'res_vision') {
      this.renderResearchDoc(fileId, body);
    } else {
      body.innerHTML = `<div style="padding: 24px; color: #fff; font-family: monospace;">Document: ${fileId}</div>`;
    }
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

    // Window Resize Grip
    const resizer = document.createElement('div');
    resizer.className = 'win-resizer';
    resizer.style.cssText = 'position: absolute; right: 0; bottom: 0; width: 16px; height: 16px; cursor: se-resize; z-index: 20;';
    win.appendChild(resizer);

    let isResizing = false;
    let rStartX, rStartY, rStartW, rStartH;

    resizer.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isResizing = true;
      rStartX = e.clientX;
      rStartY = e.clientY;
      rStartW = win.offsetWidth;
      rStartH = win.offsetHeight;
      this.focusWindow(id);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dw = e.clientX - rStartX;
      const dh = e.clientY - rStartY;
      win.style.width = `${Math.max(480, rStartW + dw)}px`;
      win.style.height = `${Math.max(300, rStartH + dh)}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isResizing) isResizing = false;
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
      if (id === 'impactx') title = 'ImpactX 3.0';
      if (id === 'farmassist') title = 'FarmAssist AI';
      if (id === 'vinhack') title = 'VinHack 25';
      if (id === 'terminal') title = 'Command Prompt';
      if (id === 'timeline') title = 'Projects Timeline';
      if (id === 'contact') title = 'Contact Dispatch';

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
    if (PROJECTS[id]) {
      this.renderProjectCaseFile(id, body);
    } else if (id === 'terminal') {
      const term = new TerminalEngine(
        body,
        (navId) => {
          if (navId === 'close_current') this.closeWindow('terminal');
          else if (PROJECTS[navId]) this.openApp(navId);
          else this.openExplorer(navId);
        },
        (cadId) => {
          this.onHardwareInspect?.(cadId);
          this.onExit?.();
        },
        (simId) => this.openApp(simId)
      );
      this.instances.set(id, term);
    } else if (id === 'timeline') {
      this.renderTimelineApp(body);
    } else if (id === 'contact') {
      this.renderContactApp(body);
    }
  }

  renderProjectCaseFile(projId, body) {
    const proj = PROJECTS[projId];
    if (!proj) return;

    body.innerHTML = `
      <div class="project-casefile" style="padding: 28px 32px; background: #111418; color: #f3f4f6; font-family: var(--font-sans, sans-serif); height: 100%; overflow-y: auto;">
        <!-- Header -->
        <header style="border-bottom: 1px solid #282f38; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: #38bdf8; letter-spacing: 0.12em; text-transform: uppercase;">${proj.badge}</span>
              <span style="color: #64748b; font-size: 11px;">•</span>
              <span style="color: #8b949e; font-size: 11px; font-family: var(--font-mono);">${proj.year}</span>
            </div>
            <h1 style="font-size: 26px; font-weight: 600; margin: 0 0 6px 0; color: #ffffff; letter-spacing: -0.02em;">${proj.title}</h1>
            <p style="font-size: 13px; color: #8b949e; margin: 0; line-height: 1.5; max-width: 680px;">${proj.subtitle}</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            ${proj.demo ? `
              <a href="${proj.demo}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #38bdf8; color: #090b0d; text-decoration: none; font-size: 11px; font-weight: 700; font-family: var(--font-mono); letter-spacing: 0.06em;">
                <span>LIVE DEMO</span>
                <span>↗</span>
              </a>
            ` : ''}
            ${proj.github ? `
              <a href="${proj.github}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #1c222b; border: 1px solid #384252; color: #f3f4f6; text-decoration: none; font-size: 11px; font-weight: 600; font-family: var(--font-mono); letter-spacing: 0.06em;">
                <span>GITHUB REPO</span>
                <span>↗</span>
              </a>
            ` : ''}
          </div>
        </header>

        <!-- Main Content Grid -->
        <div style="display: grid; grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr); gap: 28px; margin-bottom: 28px;">
          <!-- Left Column: Deep Problem, Solution, Architecture -->
          <div style="display: grid; gap: 24px;">
            <!-- Overview & Problem -->
            <div>
              <h2 style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px 0;">01 // PROBLEM STATEMENT &amp; OBJECTIVE</h2>
              <div style="background: #161b22; border: 1px solid #262f3d; padding: 18px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
                <p style="margin: 0 0 10px 0;">${proj.problem}</p>
                <p style="margin: 0; color: #94a3b8;"><b style="color: #38bdf8;">Engineering Solution:</b> ${proj.solution}</p>
              </div>
            </div>

            <!-- Architecture & Mathematical Subsystems -->
            <div>
              <h2 style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px 0;">02 // SYSTEM ARCHITECTURE &amp; SUBSYSTEMS</h2>
              <div style="display: grid; gap: 10px;">
                ${proj.architecture.map((arch, idx) => `
                  <div style="background: #161b22; border: 1px solid #262f3d; border-left: 3px solid #38bdf8; padding: 14px 18px;">
                    <b style="display: block; color: #ffffff; font-size: 12.5px; margin-bottom: 4px; font-family: var(--font-mono);">${arch.name}</b>
                    <span style="font-size: 12px; color: #94a3b8; line-height: 1.55;">${arch.detail}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Personal Contribution -->
            <div>
              <h2 style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px 0;">03 // PERSONAL ENGINEERING CONTRIBUTION</h2>
              <div style="background: #161b22; border: 1px solid #262f3d; padding: 16px 18px; font-size: 12.5px; line-height: 1.6; color: #cbd5e1;">
                ${proj.contribution}
              </div>
            </div>
          </div>

          <!-- Right Column: Specs, Stack, Meta -->
          <div style="display: grid; gap: 24px; align-content: start;">
            <!-- Tech Specs -->
            <div>
              <h2 style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px 0;">SYSTEM METADATA</h2>
              <div style="background: #161b22; border: 1px solid #262f3d; padding: 16px;">
                <dl style="margin: 0; display: grid; grid-template-columns: 90px 1fr; gap: 8px 12px; font-size: 11px;">
                  <dt style="color: #64748b; font-family: var(--font-mono);">ROLE</dt>
                  <dd style="margin: 0; color: #fff; font-weight: 500;">${proj.role}</dd>
                  <dt style="color: #64748b; font-family: var(--font-mono);">YEAR</dt>
                  <dd style="margin: 0; color: #fff;">${proj.year}</dd>
                  <dt style="color: #64748b; font-family: var(--font-mono);">STATUS</dt>
                  <dd style="margin: 0; color: #38ef7d; font-weight: 600;">${proj.status}</dd>
                  ${proj.specs ? proj.specs.map(([k, v]) => `
                    <dt style="color: #64748b; font-family: var(--font-mono);">${k}</dt>
                    <dd style="margin: 0; color: #e2e8f0;">${v}</dd>
                  `).join('') : ''}
                </dl>
              </div>
            </div>

            <!-- Tech Stack Tags -->
            <div>
              <h2 style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px 0;">TECHNOLOGIES</h2>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${proj.technologies.map(t => `
                  <span style="padding: 4px 8px; background: #161b22; border: 1px solid #262f3d; font-family: var(--font-mono); font-size: 10px; color: #94a3b8;">${t}</span>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Visual Evidence Section (Condition-Rendered with real images) -->
        ${proj.images && proj.images.length > 0 ? `
          <div style="margin-top: 24px; border-top: 1px solid #282f38; padding-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h2 style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">
                04 // VISUAL EVIDENCE &amp; EXPERIMENTAL OUTPUTS (${proj.images.length})
              </h2>
              <span style="font-size: 10px; font-family: var(--font-mono); color: #64748b;">CLICK IMAGE TO EXPAND</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
              ${proj.images.map((img, idx) => `
                <div class="casefile-evidence-card" data-img-src="${img.url}" data-img-cap="${img.caption}" style="background: #161b22; border: 1px solid #262f3d; cursor: pointer; overflow: hidden; transition: border-color 0.2s ease;">
                  <div style="width: 100%; height: 180px; background: #0b0d10; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${img.url}" alt="${img.caption}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'" />
                  </div>
                  <div style="padding: 10px 14px; font-size: 11px; color: #94a3b8; line-height: 1.4; border-top: 1px solid #202733;">
                    ${img.caption}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div style="margin-top: 24px; border-top: 1px solid #282f38; padding-top: 20px;">
            <div style="font-size: 11px; font-family: var(--font-mono); color: #64748b; letter-spacing: 0.08em; text-transform: uppercase;">
              04 // VERIFIED SYSTEM SPECIFICATION (PURE ARCHITECTURAL ARTIFACT)
            </div>
          </div>
        `}

        <!-- Interactive Simulator Section for Flagships -->
        ${projId === 'windsim' ? `
          <div style="margin-top: 32px; border-top: 1px solid #282f38; padding-top: 24px;">
            <h2 style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 12px 0;">
              05 // EMBEDDED AERODYNAMIC SIMULATION ENGINE (CANVAS)
            </h2>
            <div id="windSimMount_${projId}" style="min-height: 480px; background: #0c0f13; border: 1px solid #262f3d;"></div>
          </div>
        ` : ''}

        ${projId === 'berrybot' ? `
          <div style="margin-top: 32px; border-top: 1px solid #282f38; padding-top: 24px;">
            <h2 style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 12px 0;">
              05 // EMBEDDED CLOSED-LOOP ROBOTICS TELEMETRY SIMULATOR
            </h2>
            <div id="robotSimMount_${projId}" style="min-height: 480px; background: #0c0f13; border: 1px solid #262f3d;"></div>
          </div>
        ` : ''}

        ${projId === 'berry' ? `
          <div style="margin-top: 32px; border-top: 1px solid #282f38; padding-top: 24px;">
            <h2 style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 12px 0;">
              05 // EMBEDDED LOCAL AGENT EXECUTION TRACE
            </h2>
            <div id="agentSimMount_${projId}" style="min-height: 440px; background: #0c0f13; border: 1px solid #262f3d;"></div>
          </div>
        ` : ''}
      </div>
    `;

    // Bind evidence image lightboxes
    body.querySelectorAll('.casefile-evidence-card').forEach(card => {
      card.addEventListener('click', () => {
        this.showLightbox(card.dataset.imgSrc, card.dataset.imgCap);
      });
    });

    // Mount interactive engine if applicable
    if (projId === 'windsim') {
      const mount = body.querySelector(`#windSimMount_${projId}`);
      if (mount) {
        const sim = new WindSimulator(mount);
        this.instances.set(projId, sim);
      }
    } else if (projId === 'berrybot') {
      const mount = body.querySelector(`#robotSimMount_${projId}`);
      if (mount) {
        const sim = new RobotSimulator(mount);
        this.instances.set(projId, sim);
      }
    } else if (projId === 'berry') {
      const mount = body.querySelector(`#agentSimMount_${projId}`);
      if (mount) {
        const sim = new AgentSimulator(mount);
        this.instances.set(projId, sim);
      }
    }
  }

  renderAboutDossier(body) {
    body.innerHTML = `
      <div style="padding: 28px 32px; background: #111418; color: #f3f4f6; font-family: var(--font-sans, sans-serif); height: 100%; overflow-y: auto;">
        <!-- Header Banner -->
        <div style="border-bottom: 1px solid #282f38; padding-bottom: 20px; margin-bottom: 24px; display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;">
          <div style="width: 140px; height: 180px; background: #181d24; border: 1px solid #384252; overflow: hidden; flex-shrink: 0;">
            <img src="${IDENTITY.portraitImage}" alt="${IDENTITY.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<div style=\\'display:grid;place-items:center;height:100%;font-size:10px;font-family:monospace;color:#888;\\'>PERSONNEL ID</div>'" />
          </div>
          <div style="flex: 1; min-width: 260px;">
            <div style="font-family: var(--font-mono); font-size: 10px; color: #38bdf8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px;">PERSONNEL DOSSIER // SYS-ID: JAIJITESH-01</div>
            <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 6px 0; color: #ffffff;">${IDENTITY.name}</h1>
            <p style="font-size: 12.5px; color: #8b949e; margin: 0 0 12px 0; line-height: 1.5;">
              ${IDENTITY.degree} • ${IDENTITY.university} (${IDENTITY.cohort})
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span style="padding: 3px 8px; background: #182029; border: 1px solid #2d3b4d; font-family: var(--font-mono); font-size: 10px; color: #38bdf8;">LOCATION: ${IDENTITY.location}</span>
              <span style="padding: 3px 8px; background: #182029; border: 1px solid #2d3b4d; font-family: var(--font-mono); font-size: 10px; color: #38ef7d;">STATUS: ACTIVE</span>
            </div>
          </div>
        </div>

        <!-- Dossier Pillars Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
          ${IDENTITY.pillars.map((pil, idx) => `
            <div style="background: #161b22; border: 1px solid #262f3d; padding: 16px 18px;">
              <div style="font-family: var(--font-mono); font-size: 9.5px; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;">PILLAR 0${idx + 1} // ${pil.tag}</div>
              <b style="display: block; font-size: 13px; color: #ffffff; margin-bottom: 4px;">${pil.title}</b>
              <p style="font-size: 11.5px; color: #94a3b8; margin: 0; line-height: 1.5;">${pil.desc}</p>
            </div>
          `).join('')}
        </div>

        <!-- Technical Affiliations & Contact Dispatch -->
        <div style="background: #161b22; border: 1px solid #262f3d; padding: 20px; margin-bottom: 24px;">
          <h3 style="font-size: 11.5px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 14px 0;">VERIFIED DISPATCH &amp; CONTACT CHANNELS</h3>
          <dl style="margin: 0; display: grid; grid-template-columns: 120px 1fr; gap: 8px 14px; font-size: 12px;">
            <dt style="color: #64748b; font-family: var(--font-mono);">PRIMARY EMAIL</dt>
            <dd style="margin: 0;"><a href="mailto:${IDENTITY.email}" style="color: #38bdf8; text-decoration: none;">${IDENTITY.email}</a></dd>
            <dt style="color: #64748b; font-family: var(--font-mono);">PHONE</dt>
            <dd style="margin: 0; color: #e2e8f0;">${IDENTITY.phone}</dd>
            <dt style="color: #64748b; font-family: var(--font-mono);">GITHUB</dt>
            <dd style="margin: 0;"><a href="${IDENTITY.github}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: none;">${IDENTITY.github} ↗</a></dd>
            <dt style="color: #64748b; font-family: var(--font-mono);">LINKEDIN</dt>
            <dd style="margin: 0;"><a href="${IDENTITY.linkedin}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: none;">${IDENTITY.linkedin} ↗</a></dd>
          </dl>
        </div>

        <!-- Interests & Curiosity -->
        <div style="background: #161b22; border: 1px solid #262f3d; padding: 18px;">
          <h3 style="font-size: 11px; font-family: var(--font-mono); font-weight: 700; color: #8b949e; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px 0;">RESEARCH TOPICS &amp; ENGINEERING DOMAINS</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${IDENTITY.interests.map(int => `
              <span style="padding: 4px 10px; background: #1c222b; border: 1px solid #2d3847; font-size: 11px; color: #cbd5e1; font-family: var(--font-mono);">${int}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderResearchDoc(fileId, body) {
    let resKey = 'colorsplitter';
    if (fileId === 'res_synth') resKey = 'synthetic_data';
    if (fileId === 'res_vision') resKey = 'edge_vision';

    const r = RESEARCH[resKey] || RESEARCH['colorsplitter'];

    body.innerHTML = `
      <div style="padding: 28px 32px; background: #111418; color: #f3f4f6; font-family: var(--font-sans, sans-serif); height: 100%; overflow-y: auto;">
        <header style="border-bottom: 1px solid #282f38; padding-bottom: 18px; margin-bottom: 22px;">
          <div style="font-family: var(--font-mono); font-size: 10px; color: #38bdf8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px;">${r.status}</div>
          <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 6px 0; color: #ffffff;">${r.title}</h1>
          <p style="font-size: 12.5px; color: #8b949e; margin: 0;">${r.subtitle} • ${r.group}</p>
        </header>

        <div style="display: grid; gap: 20px; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 11.5px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 8px 0;">ABSTRACT &amp; PROBLEM FORMULATION</h2>
            <div style="background: #161b22; border: 1px solid #262f3d; padding: 18px; font-size: 12.5px; line-height: 1.65; color: #cbd5e1;">
              ${r.abstract}
            </div>
          </div>

          <div>
            <h2 style="font-size: 11.5px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 8px 0;">METHODOLOGY &amp; MATHEMATICAL ALGORITHMS</h2>
            <div style="background: #161b22; border: 1px solid #262f3d; padding: 18px; font-size: 12.5px; line-height: 1.65; color: #cbd5e1;">
              ${r.method}
            </div>
          </div>
        </div>

        ${r.images && r.images.length > 0 ? `
          <div style="border-top: 1px solid #282f38; padding-top: 20px;">
            <h2 style="font-size: 11.5px; font-family: var(--font-mono); font-weight: 700; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 12px 0;">EXPERIMENTAL UI &amp; OUTPUT EVIDENCE</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
              ${r.images.map(img => `
                <div class="casefile-evidence-card" data-img-src="${img.url}" data-img-cap="${img.caption}" style="background: #161b22; border: 1px solid #262f3d; cursor: pointer; overflow: hidden;">
                  <img src="${img.url}" alt="${img.caption}" style="width: 100%; height: auto; display: block;" />
                  <div style="padding: 8px 12px; font-size: 11px; color: #8b949e; border-top: 1px solid #262f3d;">${img.caption}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    body.querySelectorAll('.casefile-evidence-card').forEach(card => {
      card.addEventListener('click', () => {
        this.showLightbox(card.dataset.imgSrc, card.dataset.imgCap);
      });
    });
  }

  renderTimelineApp(body) {
    body.innerHTML = `
      <div style="padding: 28px 32px; background: #111418; color: #f3f4f6; font-family: var(--font-sans, sans-serif); height: 100%; overflow-y: auto;">
        <header style="border-bottom: 1px solid #282f38; padding-bottom: 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-family: var(--font-mono); font-size: 10px; color: #c2185b; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px;">DEVELOPMENTAL CHRONOLOGY</div>
            <h1 style="font-size: 22px; font-weight: 600; margin: 0; color: #ffffff;">Projects &amp; Hackathons Timeline</h1>
          </div>
          <a href="${IDENTITY.github}" target="_blank" rel="noopener noreferrer" style="padding: 6px 14px; background: #1c222b; border: 1px solid #384252; color: #f3f4f6; text-decoration: none; font-size: 11px; font-family: var(--font-mono);">
            GITHUB REPOSITORY INDEX ↗
          </a>
        </header>

        <div style="display: grid; gap: 14px;">
          ${TIMELINE_MILESTONES.map(m => `
            <div class="timeline-card" data-link-type="${m.type}" data-link-target="${m.link}" style="background: #161b22; border: 1px solid #262f3d; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; cursor: pointer; transition: border-color 0.2s ease;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                  <span style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: #38bdf8;">${m.year}</span>
                  <span style="padding: 2px 6px; background: #1f2733; font-family: var(--font-mono); font-size: 9px; color: #94a3b8; letter-spacing: 0.08em;">${m.category}</span>
                </div>
                <b style="font-size: 13.5px; color: #ffffff; display: block; margin-bottom: 4px;">${m.title}</b>
                <p style="font-size: 12px; color: #8b949e; margin: 0; line-height: 1.45;">${m.desc}</p>
              </div>
              <div style="font-family: var(--font-mono); font-size: 11px; color: #38bdf8; display: flex; align-items: center; gap: 4px;">
                <span>OPEN</span>
                <span>→</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    body.querySelectorAll('.timeline-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.linkType;
        const target = card.dataset.linkTarget;
        if (type === 'project') {
          this.openApp(target);
        } else if (type === 'file') {
          this.openDocument(target);
        } else if (type === 'folder') {
          this.openExplorer(target);
        }
        sound.click(600, 0.03);
      });
    });
  }

  renderContactApp(body) {
    body.innerHTML = `
      <div style="padding: 28px; background: #14171c; color: #ffffff; font-family: var(--font-sans, sans-serif); height: 100%; overflow-y: auto;">
        <div style="font-family: var(--font-mono); font-size: 10px; color: #38bdf8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px;">DIRECT DISPATCH CHANNEL</div>
        <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 6px 0; color: #ffffff;">Contact Jaijitesh Suryaprakash</h2>
        <p style="color: #8b949e; font-size: 12px; margin: 0 0 20px 0;">Primary communication dispatch for engineering collaborations, research discussions, and project inquiries.</p>
        
        <form id="contactDispatchForm" style="display: grid; gap: 14px; max-width: 520px;">
          <div>
            <label style="display: block; font-family: var(--font-mono); font-size: 10px; color: #94a3b8; margin-bottom: 4px;">SENDER NAME</label>
            <input type="text" id="contactName" required style="width: 100%; padding: 8px 12px; background: #1c222b; border: 1px solid #2d3847; color: #ffffff; font-size: 12px; font-family: inherit; outline: none;" placeholder="Your Name or Organization" />
          </div>
          <div>
            <label style="display: block; font-family: var(--font-mono); font-size: 10px; color: #94a3b8; margin-bottom: 4px;">EMAIL ADDRESS</label>
            <input type="email" id="contactEmail" required style="width: 100%; padding: 8px 12px; background: #1c222b; border: 1px solid #2d3847; color: #ffffff; font-size: 12px; font-family: inherit; outline: none;" placeholder="your.email@domain.com" />
          </div>
          <div>
            <label style="display: block; font-family: var(--font-mono); font-size: 10px; color: #94a3b8; margin-bottom: 4px;">MESSAGE</label>
            <textarea id="contactMessage" rows="5" required style="width: 100%; padding: 8px 12px; background: #1c222b; border: 1px solid #2d3847; color: #ffffff; font-size: 12px; font-family: inherit; outline: none; resize: vertical;" placeholder="Type your engineering inquiry or dispatch message..."></textarea>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button type="submit" style="padding: 9px 20px; background: #38bdf8; color: #090b0d; border: 0; font-family: var(--font-mono); font-weight: 700; font-size: 11px; cursor: pointer; letter-spacing: 0.08em;">
              SEND DISPATCH &rarr;
            </button>
            <button type="button" id="copyEmailBtn" style="padding: 9px 14px; background: #1c222b; border: 1px solid #2d3847; color: #e2e8f0; font-family: var(--font-mono); font-size: 11px; cursor: pointer;">
              COPY EMAIL
            </button>
          </div>
        </form>

        <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #262f3d; display: flex; gap: 16px; font-size: 11.5px;">
          <a href="${IDENTITY.github}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: none; font-family: var(--font-mono);">GitHub (${IDENTITY.handle}) ↗</a>
          <a href="${IDENTITY.linkedin}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: none; font-family: var(--font-mono);">LinkedIn ↗</a>
          <a href="mailto:${IDENTITY.email}" style="color: #94a3b8; text-decoration: none; font-family: var(--font-mono);">${IDENTITY.email}</a>
        </div>
      </div>
    `;

    const form = body.querySelector('#contactDispatchForm');
    const copyBtn = body.querySelector('#copyEmailBtn');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = body.querySelector('#contactName')?.value;
      const email = body.querySelector('#contactEmail')?.value;
      const msg = body.querySelector('#contactMessage')?.value;
      const mailtoUrl = `mailto:${IDENTITY.email}?subject=${encodeURIComponent('Inquiry from ' + name)}&body=${encodeURIComponent(msg + '\n\nSender: ' + name + ' (' + email + ')')}`;
      window.open(mailtoUrl, '_blank');
      sound.sonarPing(900);
      alert(`Dispatch prepared for ${IDENTITY.email}. Your default mail client has been opened.`);
    });

    copyBtn?.addEventListener('click', () => {
      navigator.clipboard?.writeText(IDENTITY.email);
      sound.tick(1400);
      copyBtn.textContent = 'COPIED TO CLIPBOARD!';
      setTimeout(() => { copyBtn.textContent = 'COPY EMAIL'; }, 2000);
    });
  }
}
