import { sound } from './audio.js';

export class TerminalEngine {
  constructor(container, onNavigate, onHardware, onSim) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.onHardware = onHardware;
    this.onSim = onSim;

    this.history = [];
    this.historyIndex = -1;
    this.currentPath = 'C:\\Users\\Jaijitesh';

    this.fs = {
      'C:\\Users\\Jaijitesh': {
        dirs: ['Desktop', 'Documents', 'Downloads', 'Projects', 'Research', 'Hardware'],
        files: [
          { name: 'About_Dossier.txt', size: 1420 },
          { name: 'WindSim.exe', size: 4210000 },
          { name: 'BerryAI.exe', size: 12800000 },
          { name: 'BerryBot.exe', size: 6100000 },
          { name: 'PixelWorld.exe', size: 8400000 },
          { name: 'Contact_Dispatch.exe', size: 2100000 }
        ]
      },
      'C:\\Users\\Jaijitesh\\Projects': {
        dirs: [],
        files: [
          { name: 'WindSim_CFD.exe', size: 4210000 },
          { name: 'Berry_AI_Assistant.exe', size: 12800000 },
          { name: 'BerryBot_Robotics.exe', size: 6100000 },
          { name: 'ImpactX_3.0_Winner.txt', size: 2048 },
          { name: 'FarmAssist_AI.txt', size: 3072 },
          { name: 'VinHack_25_Exchange.txt', size: 2048 }
        ]
      },
      'C:\\Users\\Jaijitesh\\Research': {
        dirs: [],
        files: [
          { name: 'Synthetic_Data_Generator.pdf', size: 1400000 },
          { name: 'Spectral_Color_Splitter.pdf', size: 920000 },
          { name: 'Edge_Vision_Systems.pdf', size: 2100000 }
        ]
      },
      'C:\\Users\\Jaijitesh\\Hardware': {
        dirs: [],
        files: [
          { name: 'BerryBot_Chassis.step', size: 3897368 },
          { name: 'Raspberry_Pi_4_Model_B.step', size: 5937772 },
          { name: 'ESP32_WROOM_38Pin.step', size: 6284216 },
          { name: 'Canon_AT1_Retro.cad', size: 19505580 },
          { name: 'Refractor_Telescope.cad', size: 6661216 }
        ]
      }
    };

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="cmd-terminal-window">
        <div class="cmd-terminal-body" id="termBody">
          <div class="cmd-banner">
            <div>Microsoft Windows [Version 10.0.19045.3803]</div>
            <div>(c) Microsoft Corporation. All rights reserved.</div>
            <div style="margin-top: 8px; color: #888;">Type 'help' for available commands or 'dir' to list files.</div>
            <div style="margin-bottom: 12px;"></div>
          </div>
          <div class="cmd-output" id="termOutput"></div>
          <form class="cmd-prompt-line" id="termForm">
            <span class="cmd-prompt-path" id="termPathPrompt">${this.currentPath}&gt;</span>
            <input type="text" id="termInput" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="Command Input" />
          </form>
        </div>
      </div>
    `;

    this.body = this.container.querySelector('#termBody');
    this.output = this.container.querySelector('#termOutput');
    this.form = this.container.querySelector('#termForm');
    this.input = this.container.querySelector('#termInput');
    this.pathPrompt = this.container.querySelector('#termPathPrompt');

    this.bindEvents();
    setTimeout(() => this.input?.focus(), 50);
  }

  bindEvents() {
    this.body.addEventListener('click', () => this.input?.focus());

    this.input.addEventListener('keydown', (e) => {
      sound.click(700, 0.01);

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.history.length && this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.input.value = this.history[this.history.length - 1 - this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.input.value = this.history[this.history.length - 1 - this.historyIndex];
        } else if (this.historyIndex === 0) {
          this.historyIndex = -1;
          this.input.value = '';
        }
      }
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = this.input.value.trim();
      if (!raw) return;

      this.history.push(raw);
      this.historyIndex = -1;
      this.input.value = '';

      this.appendLine(`${this.currentPath}&gt; ${raw}`);
      this.executeCommand(raw);
      this.body.scrollTop = this.body.scrollHeight;
    });
  }

  appendLine(text) {
    const div = document.createElement('div');
    div.className = 'cmd-line';
    div.innerHTML = text;
    this.output.appendChild(div);
  }

  executeCommand(raw) {
    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    switch (cmd) {
      case 'cls':
      case 'clear':
        this.output.innerHTML = '';
        break;

      case 'help':
        this.appendLine(`
For more information on a specific command, type HELP command-name
  DIR            Displays a list of files and subdirectories in a directory.
  CD             Displays the name of or changes the current directory.
  TYPE           Displays the contents of a text file.
  CLS            Clears the screen.
  VER            Displays the Windows version.
  IPCONFIG       Displays all current TCP/IP network configuration values.
  SYSTEMINFO     Displays operating system and engineer workstation properties.
  EXIT           Quits the CMD.EXE program (Command Prompt).

Application Launchers:
  WINDSIM        Launches WindSim Aerodynamics CFD Lab.
  BERRY          Launches Berry AI Desktop Assistant.
  BERRYBOT       Launches BerryBot Tracked Robotics Simulator.
  PIXEL          Launches Pixel World 8-bit memory game.
  EXPLORER       Opens Windows File Explorer.
        `);
        break;

      case 'ver':
        this.appendLine('Microsoft Windows [Version 10.0.19045.3803]');
        break;

      case 'ipconfig':
        this.appendLine(`
Windows IP Configuration

Ethernet adapter Ethernet 2:
   Connection-specific DNS Suffix  . : localdomain
   Link-local IPv6 Address . . . . . : fe80::d914:482e:5141:8920%14
   IPv4 Address. . . . . . . . . . . : 192.168.1.108
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
        `);
        break;

      case 'systeminfo':
      case 'neofetch':
        this.appendLine(`
Host Name:                 OMEN-WORKSTATION-16
OS Name:                   Microsoft Windows 11 Pro
OS Version:                10.0.22631 N/A Build 22631
Engineer:                  Jaijitesh Suryaprakash (VIT Vellore IT '29)
Affiliation:               B.Tech Information Technology • 3 Research Papers in Prep
Hackathon Track:           ImpactX 3.0 (3rd Place Lead), FarmAssist AI Lead, VinHack 25 Lead
System Model:              HP OMEN Laptop 16-wd0xxx
Processor:                 13th Gen Intel(R) Core(TM) i7-13700HX (16 CPUs)
Memory:                    32,768 MB RAM
        `);
        break;

      case 'dir':
        this.handleDir();
        break;

      case 'cd':
        this.handleCd(arg);
        break;

      case 'type':
      case 'cat':
        this.handleType(arg);
        break;

      case 'windsim':
      case 'windsim.exe':
        this.appendLine('Launching WindSim Aerodynamics CFD Lab...');
        this.onSim?.('windsim');
        break;

      case 'berry':
      case 'berry.exe':
      case 'berryai':
      case 'berryai.exe':
        this.appendLine('Launching Berry AI Desktop Assistant...');
        this.onSim?.('berry');
        break;

      case 'berrybot':
      case 'berrybot.exe':
        this.appendLine('Launching BerryBot Tracked Robotics Simulator...');
        this.onSim?.('berrybot');
        break;

      case 'pixel':
      case 'pixelworld':
      case 'pixelworld.exe':
      case 'timeline':
        this.appendLine('Opening Projects & Hackathons Directory...');
        this.onSim?.('timeline');
        break;

      case 'explorer':
      case 'explorer.exe':
        this.appendLine('Opening Windows File Explorer...');
        this.onNavigate?.('projects');
        break;

      case 'exit':
        this.onNavigate?.('close_current');
        break;

      default:
        this.appendLine(`'${cmd}' is not recognized as an internal or external command,\noperable program or batch file. Type 'help' for command list.`);
        break;
    }
  }

  handleDir() {
    const node = this.fs[this.currentPath] || { dirs: [], files: [] };
    const dateStr = '01-09-2026  12:00 PM';

    let out = ` Volume in drive C is Windows\n Volume Serial Number is 8A42-E910\n\n Directory of ${this.currentPath}\n\n`;
    out += `${dateStr}    &lt;DIR&gt;          .\n`;
    out += `${dateStr}    &lt;DIR&gt;          ..\n`;

    node.dirs.forEach(d => {
      out += `${dateStr}    &lt;DIR&gt;          ${d}\n`;
    });

    let totalBytes = 0;
    node.files.forEach(f => {
      totalBytes += f.size;
      const sizeStr = f.size.toLocaleString('en-US').padStart(14, ' ');
      out += `${dateStr}  ${sizeStr} ${f.name}\n`;
    });

    out += `               ${node.files.length} File(s)    ${totalBytes.toLocaleString('en-US')} bytes\n`;
    out += `               ${node.dirs.length + 2} Dir(s)   482,914,816,000 bytes free\n`;

    this.appendLine(`<pre style="margin:0; font-family:inherit;">${out}</pre>`);
  }

  handleCd(target) {
    if (!target || target === '.') return;
    if (target === '..') {
      if (this.currentPath !== 'C:\\Users\\Jaijitesh') {
        this.currentPath = 'C:\\Users\\Jaijitesh';
        this.pathPrompt.textContent = `${this.currentPath}&gt;`;
      }
      return;
    }

    const cleaned = target.replace(/\\/g, '');
    const candidate = `${this.currentPath}\\${cleaned}`;

    if (this.fs[candidate]) {
      this.currentPath = candidate;
      this.pathPrompt.textContent = `${this.currentPath}&gt;`;
    } else {
      this.appendLine(`The system cannot find the path specified: ${target}`);
    }
  }

  handleType(target) {
    if (!target) {
      this.appendLine('The syntax of the command is incorrect.');
      return;
    }

    const t = target.toLowerCase();
    if (t.includes('about') || t.includes('dossier')) {
      this.appendLine(`
================================================================================
                    JAIJITESH SURYAPRAKASH — PERSONNEL DOSSIER
================================================================================
Name: Jaijitesh Suryaprakash
University: VIT Vellore (B.Tech IT 2025–2029, 1st Year)
Contact: jaijiteshsp@gmail.com | +91 9940970749 | https://github.com/BerrF35
LinkedIn: https://linkedin.com/in/jaijitesh-suryaprakash-j
Focus: LBM CFD Simulation, Local-First AI Agents, Autonomous Tracked Robotics
================================================================================
      `);
    } else if (t.includes('impactx')) {
      this.appendLine('ImpactX 3.0: 3rd Place Overall. Lead & Primary Developer. Hyperlocal Real-time Logistics.');
    } else if (t.includes('farmassist')) {
      this.appendLine('FarmAssist AI: Yantra 26 Central Hackathon Lead Dev. Edge Computer Vision Agricultural Diagnostics.');
    } else {
      this.appendLine(`Cannot open '${target}'. Access granted.`);
    }
  }
}
