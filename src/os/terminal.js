import { sound } from './audio.js';
import {
  IDENTITY,
  PROJECTS,
  RESEARCH,
  HARDWARE_DEFINITIONS,
  TIMELINE_MILESTONES,
  VIRTUAL_FILESYSTEM
} from './portfolioData.js';

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
          { name: 'Projects_Timeline.exe', size: 2400000 },
          { name: 'Contact_Dispatch.exe', size: 1800000 }
        ]
      },
      'C:\\Users\\Jaijitesh\\Projects': {
        dirs: [],
        files: [
          { name: 'WindSim_CFD.exe', size: 4210000 },
          { name: 'Berry_AI_Assistant.exe', size: 12800000 },
          { name: 'BerryBot_Robotics.exe', size: 6100000 },
          { name: 'ImpactX_3.0_Winner.txt', size: 3480 },
          { name: 'FarmAssist_AI.txt', size: 3120 },
          { name: 'VinHack_25_Exchange.txt', size: 2840 }
        ]
      },
      'C:\\Users\\Jaijitesh\\Research': {
        dirs: [],
        files: [
          { name: 'Spectral_Color_Splitter.pdf', size: 920000 },
          { name: 'Synthetic_Data_Generator.pdf', size: 1400000 },
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
            <div>Microsoft Windows [Version 10.0.22631.3803]</div>
            <div>(c) Microsoft Corporation. All rights reserved.</div>
            <div style="margin-top: 8px; color: #888;">JAIJITESH.OS CLI Environment • Type 'help' for command directory.</div>
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
      case '?':
        this.appendLine(`
<pre style="margin:0; font-family:inherit; color:#cbd5e1;">
SYSTEM COMMANDS:
  HELP           Displays this command index and system utilities.
  WHOAMI         Displays developer personnel dossier and academic affiliation.
  PROJECTS       Lists all verified software, simulation, and robotics projects.
  RESEARCH       Lists academic research papers and active investigation topics.
  HARDWARE       Lists physical 3D engineering models on the lab bench.
  HACKATHONS     Displays hackathon placement history and contributions.
  SKILLS         Displays verified engineering skills, languages, and tools.
  CONTACT        Displays direct communication channels and dispatch instructions.
  TIMELINE       Displays chronological development milestones.
  GITHUB         Opens the verified GitHub repository index.
  LINKEDIN       Opens the verified LinkedIn profile.
  SYSTEMINFO     Displays workstation telemetry and engineering specs.
  NEOFETCH       Displays system ASCII logo and host specifications.
  DIR / LS       Displays list of files and subdirectories.
  CD             Displays or changes current working directory.
  TYPE / CAT     Displays contents of a text or document file.
  EXIT           Closes the Command Prompt window.

APPLICATION LAUNCHERS:
  WINDSIM        Launches WindSim Real-Time LBM CFD Aerodynamics Platform.
  BERRY          Launches Berry AI Local-First Desktop Assistant.
  BERRYBOT       Launches BerryBot Tracked Robotics Simulator &amp; Case Study.
  EXPLORER       Opens Windows File Explorer.
</pre>
        `);
        break;

      case 'whoami':
      case 'about':
      case 'dossier':
        this.appendLine(`
<pre style="margin:0; font-family:inherit; color:#e2e8f0;">
================================================================================
                    JAIJITESH SURYAPRAKASH — PERSONNEL DOSSIER
================================================================================
Name:         ${IDENTITY.name} (${IDENTITY.handle})
Institution:  ${IDENTITY.university}
Degree:       ${IDENTITY.degree} (${IDENTITY.cohort})
Location:     ${IDENTITY.location}
Email:        ${IDENTITY.email} | Phone: ${IDENTITY.phone}
GitHub:       ${IDENTITY.github}
LinkedIn:     ${IDENTITY.linkedin}

CORE ENGINEERING FOCUS:
  1. Scientific Simulation: Real-Time Lattice Boltzmann Method (LBM D2Q9) CFD.
  2. Autonomous Robotics: SolidWorks CAD, Dual-Core ESP32 20kHz PWM, Closed-Loop PID.
  3. Local-First AI: Air-Gapped Desktop Agent with Computer-Use Automation (CUA).
  4. Academic Research: 3 Papers in preparation with Faculty Research Group.
================================================================================
</pre>
        `);
        break;

      case 'projects':
        this.appendLine(`
<pre style="margin:0; font-family:inherit; color:#cbd5e1;">
VERIFIED PROJECT REPOSITORY:
  1. WINDSIM     LBM D2Q9 CFD Aerodynamics Platform [Flagship / Live]
  2. BERRY AI    Local Desktop Assistant &amp; OS Sidecar [Python / AGPL-3.0]
  3. BERRYBOT    Tracked Autonomous Robotics Platform [ESP32 / SolidWorks]
  4. IMPACTX     ImpactX 3.0 Hackathon [3rd Place Overall Winner]
  5. FARMASSIST  FarmAssist AI Crop Diagnostics [Yantra 26 Hackathon]
  6. VINHACK     Peer-to-Peer Academic Resource Exchange [VinHack 25]

Type any project name (e.g. 'windsim' or 'berrybot') to launch its technical case file.
</pre>
        `);
        break;

      case 'research':
        this.appendLine(`
<pre style="margin:0; font-family:inherit; color:#cbd5e1;">
ACADEMIC RESEARCH MANUSCRIPTS (FACULTY COLLABORATION):
  1. SPECTRAL COLOR SPLITTER
     - Topic: Optical Color-Space Image Decomposition &amp; Spectral Filtering
     - Status: Experimental Validation &amp; Manuscript in Preparation
     - UI Evidence: Verified Analysis Suite UI Screenshot Available

  2. SYNTHETIC TRAINING DATA GENERATION PIPELINE
     - Topic: Parametric Scene Randomization for Robust Edge Vision Classifiers
     - Status: Active Experimentation with 5-Person Faculty Research Group

  3. EDGE VISION SYSTEMS ON CONSTRAINED MCUS
     - Topic: Low-Latency Spatial Feature Extraction on Low-Power ARM Hardware
     - Status: Algorithm Optimization &amp; Hardware Profiling
</pre>
        `);
        break;

      case 'hardware':
      case 'cad':
        this.appendLine(`
<pre style="margin:0; font-family:inherit; color:#cbd5e1;">
PHYSICAL 3D WORKBENCH HARDWARE &amp; PROPS:
  • BERRYBOT       SolidWorks CAD M4 Tracked Chassis &amp; Dual H-Bridge Electronics
  • RASPBERRY PI   Raspberry Pi 4 Model B (Broadcom BCM2711 4-Core Edge Node)
  • ESP32          ESP-WROOM-32 Dual-Core 240MHz (20kHz PWM Motor Controller)
  • CANON AT-1     Retro 35mm SLR Camera (Computer Vision &amp; Optics Prop)
  • TELESCOPE      Equatorial Refractor (Space, Rockets &amp; Celestial Curiosity Prop)
  • BERRY          Belgian Malinois (Lab Companion Easter Egg)
  • CRISPY         Domestic Cat (Workbench Supervisor Easter Egg)
</pre>
        `);
        break;

      case 'hackathons':
        this.appendLine(`
<pre style="margin:0; font-family:inherit; color:#cbd5e1;">
HACKATHON TRACK RECORD &amp; COMPETITIONS:
  • ImpactX 3.0 Hackathon (2026): 3RD PLACE OVERALL WINNER
    Role: Lead Developer &amp; System Architect
    System: High-Throughput Geospatial Logistics &amp; Real-Time Dispatch Engine

  • Yantra 26 Central Hackathon (2026): FARMASSIST AI
    Role: Lead Developer &amp; Model Engineer
    System: Edge Computer Vision Crop Pathology Diagnostics on Raspberry Pi

  • VinHack 25 (2025): PEER-TO-PEER ACADEMIC EXCHANGE
    Role: Lead Coder &amp; Backend Architect
    System: Decentralized Campus Resource Exchange Network with Escrow Validation
</pre>
        `);
        break;

      case 'skills':
      case 'stack':
        this.appendLine(`
<pre style="margin:0; font-family:inherit; color:#cbd5e1;">
VERIFIED ENGINEERING STACK &amp; CAPABILITIES:
  • Languages:    JavaScript (ES6+), TypeScript, Python 3.11, C++, GLSL, SQL, HTML5/CSS3
  • Numerical:    Lattice Boltzmann Method (LBM D2Q9), Navier-Stokes, BGK Collision
  • Robotics:     SolidWorks CAD, ESP32 FreeRTOS, 20kHz PWM, Optical Encoders, PID, S-Curve
  • AI &amp; Vision:  PyTorch, OpenCV, ONNX Runtime, MobileNetV3, Ollama, ChromaDB
  • Systems:      WebGL 2.0, WebSockets, Three.js, Node.js, FastAPI, Linux, FreeRTOS
</pre>
        `);
        break;

      case 'contact':
        this.appendLine(`
<pre style="margin:0; font-family:inherit; color:#cbd5e1;">
DIRECT CONTACT &amp; DISPATCH:
  • Email:    ${IDENTITY.email}
  • Phone:    ${IDENTITY.phone}
  • GitHub:   ${IDENTITY.github}
  • LinkedIn: ${IDENTITY.linkedin}
  (Note: No Twitter/X presence maintained.)
</pre>
        `);
        break;

      case 'github':
        this.appendLine(`Opening GitHub: ${IDENTITY.github}`);
        window.open(IDENTITY.github, '_blank');
        break;

      case 'linkedin':
        this.appendLine(`Opening LinkedIn: ${IDENTITY.linkedin}`);
        window.open(IDENTITY.linkedin, '_blank');
        break;

      case 'systeminfo':
      case 'neofetch':
        this.appendLine(`
<pre style="margin:0; font-family:inherit; color:#38bdf8;">
       .---.          <b>${IDENTITY.name}</b>@OMEN-WORKSTATION-16
      /     \\         -----------------------------------
     | () () |        OS: JAIJITESH.OS 2.6.4 (Windows 11 Subsystem)
      \\  _  /         Host: HP OMEN Workstation 16-wd0xxx
       \`---\`          Kernel: x86_64 WebGL2 / Vulkan Hybrid
      /     \\         Uptime: Active Session
     |       |        Affiliation: VIT Vellore (B.Tech IT 2025-2029)
     | |   | |        Simulation Engine: LBM D2Q9 60 FPS
     |_|___|_|        Robotics MCU: ESP32-WROOM-32 (240MHz Dual-Core)
                      Edge Node: Raspberry Pi 4 Model B (4GB RAM)
                      Local Agent: Berry AI Core (Air-Gapped)
</pre>
        `);
        break;

      case 'ver':
        this.appendLine('Microsoft Windows [Version 10.0.22631.3803] // JAIJITESH.OS v2.6.4');
        break;

      case 'date':
      case 'time':
        this.appendLine(`Current System Date & Time: ${new Date().toString()}`);
        break;

      case 'dir':
      case 'ls':
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
        this.appendLine('Launching WindSim Real-Time LBM CFD Aerodynamics Platform...');
        this.onSim?.('windsim');
        break;

      case 'berry':
      case 'berry.exe':
      case 'berryai':
      case 'berryai.exe':
        this.appendLine('Launching Berry AI Local-First Desktop Assistant...');
        this.onSim?.('berry');
        break;

      case 'berrybot':
      case 'berrybot.exe':
        this.appendLine('Launching BerryBot Tracked Autonomous Robotics Platform...');
        this.onSim?.('berrybot');
        break;

      case 'impactx':
        this.appendLine('Opening ImpactX 3.0 Hackathon Case File...');
        this.onSim?.('impactx');
        break;

      case 'farmassist':
        this.appendLine('Opening FarmAssist AI Case File...');
        this.onSim?.('farmassist');
        break;

      case 'vinhack':
        this.appendLine('Opening VinHack 25 Case File...');
        this.onSim?.('vinhack');
        break;

      case 'timeline':
        this.appendLine('Opening Projects & Hackathons Timeline...');
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

      // Easter Eggs
      case 'berry':
      case 'dog':
        this.appendLine(`🐶 Berry: Loyal Belgian Malinois lab companion. Telemetry: 100% Good Boy.`);
        sound.sonarPing(1200);
        break;

      case 'crispy':
      case 'cat':
        this.appendLine(`🐱 Crispy: Domestic cat resting on the engineering workbench. State: Purring.`);
        sound.sonarPing(1100);
        break;

      case '42':
        this.appendLine('42: The answer to the ultimate question of life, the universe, and everything.');
        break;

      case 'sudo':
        this.appendLine('User is in the sudoers file. Administrator access granted.');
        break;

      case 'matrix':
        document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'matrix' ? 'dark' : 'matrix');
        this.appendLine('Theme toggled to Matrix phosphor mode.');
        sound.powerOn();
        break;

      default:
        this.appendLine(`'${cmd}' is not recognized as an internal or external command.\nType 'help' for available commands.`);
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
<pre style="margin:0; font-family:inherit; color:#e2e8f0;">
================================================================================
                    JAIJITESH SURYAPRAKASH — PERSONNEL DOSSIER
================================================================================
Name:        ${IDENTITY.name}
University:  ${IDENTITY.university}
Degree:      ${IDENTITY.degree} (${IDENTITY.cohort})
Contact:     ${IDENTITY.email} | ${IDENTITY.phone}
GitHub:      ${IDENTITY.github}
LinkedIn:    ${IDENTITY.linkedin}
Focus:       LBM CFD Simulation, Local-First AI Agents, Tracked Autonomous Robotics
================================================================================
</pre>
      `);
    } else if (t.includes('impactx')) {
      this.appendLine('ImpactX 3.0: 3rd Place Overall Winner. Role: Lead Developer. Hyperlocal Real-time Logistics & Geospatial Routing.');
    } else if (t.includes('farmassist')) {
      this.appendLine('FarmAssist AI: Yantra 26 Central Hackathon Lead Dev. Edge Computer Vision Agricultural Disease Diagnostics.');
    } else if (t.includes('vinhack')) {
      this.appendLine('VinHack 25: P2P Academic Resource & Book Exchange Network. Role: Lead Coder.');
    } else {
      this.appendLine(`File '${target}' read successfully.`);
    }
  }
}
