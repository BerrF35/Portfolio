import { sound } from './audio.js';

export class TerminalEngine {
  constructor(container, onNavigate, onHardware, onSim) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.onHardware = onHardware;
    this.onSim = onSim;

    this.history = [];
    this.historyIndex = -1;
    this.currentPath = '~';

    this.fs = {
      '~': ['projects', 'research', 'hardware', 'about', 'skills.txt', 'contact.txt', 'README.md'],
      '~/projects': ['01_windsim.md', '02_berry_ai.md', '03_berrybot.md', '04_farmassist.md', '05_impactx.md', '06_vinhack.md', '07_other_repos.txt'],
      '~/research': ['paper_01_synthetic_data_generator.draft', 'paper_02_color_splitter_spectral.draft', 'paper_03_vision_group.draft'],
      '~/hardware': ['berrybot_tracked_chassis.glb', 'raspberry_pi_4.glb', 'esp32_wroom_controller.glb'],
    };

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="terminal-shell">
        <header class="terminal-shell__header">
          <div class="terminal-shell__title">
            <span class="term-dot"></span>
            <b>JAIJITESH.OS // UNIX SHELL v2.6 (x86_64-pc-omen)</b>
          </div>
          <div class="terminal-shell__stats">BASH // UTF-8 // ONLINE</div>
        </header>

        <div class="terminal-shell__body" id="termBody">
          <div class="terminal-shell__welcome">
            <pre class="term-ascii">
    ╦╔═╗╦ ╦╦╔╦╗╔═╗╔═╗╦ ╦  ╔═╗╔═╗
    ║╠═╣║ ║║ ║ ║╣ ╚═╗╠═╣  ║ ║╚═╗
   ╚╝╩ ╩╚═╝╩ ╩ ╚═╝╚═╝╩ ╩  ╚═╝╚═╝
            </pre>
            <div class="term-dim">Jaijitesh Suryaprakash &bull; Personal Operating Environment</div>
            <div class="term-dim">Type <span class="term-accent">'help'</span> for command suite, <span class="term-accent">'projects'</span> for repositories, or <span class="term-accent">'neofetch'</span> for specs.</div>
            <hr class="term-hr"/>
          </div>
          <div class="terminal-shell__output" id="termOutput"></div>
          <form class="terminal-shell__prompt-line" id="termForm">
            <span class="term-user">jaijitesh@omen</span>:<span class="term-path" id="termPathPrompt">~</span>$
            <input type="text" id="termInput" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="Terminal Input" />
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
      sound.click(650 + Math.random() * 80, 0.015);

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
        } else {
          this.historyIndex = -1;
          this.input.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabCompletion();
      }
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = this.input.value.trim();
      this.input.value = '';
      if (!raw) return;

      this.history.push(raw);
      this.historyIndex = -1;
      this.executeCommand(raw);
    });
  }

  handleTabCompletion() {
    const val = this.input.value.trim();
    const parts = val.split(' ');
    const cmds = ['help', 'whoami', 'neofetch', 'ls', 'cd', 'cat', 'projects', 'wind', 'berry', 'robot', 'skills', 'about', 'research', 'contact', 'theme', 'clear', 'sudo', 'game'];
    
    if (parts.length === 1) {
      const match = cmds.find(c => c.startsWith(val.toLowerCase()));
      if (match) this.input.value = match + ' ';
    }
  }

  print(html, type = 'line') {
    const el = document.createElement('div');
    el.className = `term-${type}`;
    el.innerHTML = html;
    this.output.appendChild(el);
    this.body.scrollTop = this.body.scrollHeight;
  }

  executeCommand(raw) {
    this.print(`<span class="term-user">jaijitesh@omen</span>:<span class="term-path">${this.currentPath}</span>$ ${raw}`, 'command');
    
    const parts = raw.split(' ').filter(Boolean);
    const cmd = parts[0].toLowerCase();
    const arg = parts[1]?.toLowerCase();

    switch (cmd) {
      case 'help':
        this.print(`
AVAILABLE COMMANDS:
  <b class="term-accent">whoami</b>           - Identity, education, and development profile
  <b class="term-accent">neofetch</b>         - Hardware specs, Omen host info, and verified tech stack
  <b class="term-accent">projects</b>         - GitHub repositories directory & descriptions
  <b class="term-accent">wind</b>             - Launch WindSim 2D Aerodynamics & CFD platform (#1 work)
  <b class="term-accent">berry</b> / <b class="term-accent">agent</b>    - Launch Berry Local AI Assistant execution visualizer
  <b class="term-accent">robot</b> / <b class="term-accent">berrybot</b> - Launch BerryBot Tracked Autonomous Robotics telemetry
  <b class="term-accent">skills</b>           - Verified technical languages, frameworks, & hardware
  <b class="term-accent">about</b>            - Academic dossier (VIT Vellore, SCTS, CGPA, Hackathons)
  <b class="term-accent">research</b>         - 3 research papers in preparation with professor & 5-person group
  <b class="term-accent">cad [robot|raspberry|esp32]</b> - Inspect physical 3D hardware models
  <b class="term-accent">game</b> / <b class="term-accent">timeline</b>   - Enter the playable Pixel Memory World
  <b class="term-accent">contact</b>          - Direct communication telemetry
  <b class="term-accent">ls</b> [dir]         - List files in virtual filesystem
  <b class="term-accent">cd</b> [dir]         - Change working directory
  <b class="term-accent">cat</b> [file]       - Read file content
  <b class="term-accent">theme [dark|light|matrix]</b> - Switch UI color palette
  <b class="term-accent">sudo</b>             - Authenticate as superuser
  <b class="term-accent">clear</b>            - Clear terminal screen
        `, 'output');
        sound.click(750, 0.02);
        break;

      case 'whoami':
        this.print(`
<b>JAIJITESH SURYAPRAKASH</b>
Information Technology Undergraduate @ Vellore Institute of Technology (VIT), Vellore (2025–2029).
School: SCTS (10th: 93.4%, 12th: 76.4%) | CGPA: 5.89.
Role: Systems Builder / Scientific Computing / Autonomous Robotics / Local AI / Hackathon Technical Lead.
Key Works: WindSim (Browser Aerodynamics CFD), Berry (Local AI Desktop Assistant), BerryBot (Tracked Autonomous Robot).
        `, 'output');
        break;

      case 'neofetch':
      case 'sysinfo':
        this.print(`
<div class="neofetch-grid">
<pre class="neofetch-ascii">
    .----------------.
   |  [HP OMEN 16]   |
   |  .------------. |
   |  | >_ J.OS    | |
   |  |            | |
   |  '------------' |
    '----------------'
       /==========\\
      /============\\
</pre>
<div class="neofetch-text">
<b>jaijitesh@hp-omen-workstation</b>
------------------------------
<b>NAME:</b> Jaijitesh Suryaprakash
<b>EDUCATION:</b> B.Tech Information Technology, VIT Vellore (2025–2029)
<b>HOST:</b> HP Omen Laptop / Engineering Lab Bench
<b>OS:</b> JAIJITESH.OS v2.6.4 (WebGL2 / Three.js / Canvas)
<b>LANGUAGES:</b> Python, Java, C, C++, JavaScript, HTML, CSS, SQL
<b>FRAMEWORKS:</b> React, Node.js, Flask, FastAPI, REST APIs, WebGL, Three.js, GSAP, SolidWorks
<b>HARDWARE:</b> Arduino, Raspberry Pi 4, ESP32 (Waveshare), Encoders, S-curve Motor Control
<b>AI/ML:</b> LLMs, AI Agents, Local AI, Computer Vision, Image Processing, Data Synthesis, CFD
<b>HACKATHONS:</b> ImpactX 3.0 (3rd Place), Yantra '26 FarmAssist AI, Vinhack 25 (Lead & Primary Coder)
<b>LOCATION:</b> VIT Vellore, Tamil Nadu, India (+05:30 IST)
</div>
</div>
        `, 'output');
        sound.sonarPing(950);
        break;

      case 'skills':
        this.print(`
<b>VERIFIED TECHNICAL SKILLS:</b>
  &bull; <b class="term-accent">Languages:</b> Python, Java, C, C++, JavaScript, HTML, CSS, SQL
  &bull; <b class="term-accent">Web / Backend:</b> React, Node.js, Flask, FastAPI, REST APIs, Browser Automation
  &bull; <b class="term-accent">AI / ML / Vision:</b> Large Language Models, AI Agents, Local/On-device AI, Computer Vision, Image Processing, Data Synthesis, Scientific Computing
  &bull; <b class="term-accent">Hardware / Robotics:</b> Arduino, Raspberry Pi, ESP32 (Waveshare), Sensors, Motor Control, Encoders, S-curve Trajectories, Path Tracking, Return-to-Home, SolidWorks CAD
  &bull; <b class="term-dim">Excluded / Not Claimed:</b> Spring Boot, scikit-learn, RAG, Redis, Azure, GCP, IntelliJ
        `, 'output');
        break;

      case 'projects':
      case 'projects --active':
        this.print(`
<b>ACTIVE REPOSITORIES &amp; PROJECTS (github.com/BerrF35):</b>
  1. <b class="term-accent">WindSim</b> (Best Work) - Browser-based aerodynamics platform (CFD LBM, streamlines, slices). Live: <a href="https://berrf35.github.io/Windsim/" target="_blank" class="term-link">berrf35.github.io/Windsim</a>
  2. <b class="term-accent">Berry</b> - High-performance local-first desktop AI assistant (Core Engine, Berry CUA, Browser Relay, Berry Vault). Python, AGPL-3.0.
  3. <b class="term-accent">BerryBot</b> - Tracked autonomous robotics platform built around Waveshare ESP32 controller (S-curve motion, path tracking, RTH).
  4. <b class="term-accent">FarmAssist AI</b> - AI-assisted agriculture & edge vision (Yantra '26 Central Hack - Lead & Primary Coder).
  5. <b class="term-accent">Research Papers (3 in prep)</b> - synthetic-data-generator, color-splitter, vision systems.
  6. <b class="term-accent">ImpactX 3.0</b> - Hyperlocal service marketplace (3rd Place Overall - Lead & Primary Coder).
  7. <b class="term-accent">Other Repositories:</b> gesturecontrolpc, speaksafe, imagegen, Agrichain, AI property damage detection.
        `, 'output');
        break;

      case 'wind':
      case 'windsim':
        this.print('Launching WindSim Aerodynamics CFD Lab...', 'dim');
        this.onSim?.('windsim');
        break;

      case 'berry':
      case 'agent':
        this.print('Launching Berry Local AI Desktop Assistant Visualizer...', 'dim');
        this.onSim?.('agent');
        break;

      case 'robot':
      case 'berrybot':
        this.print('Launching BerryBot Tracked Autonomous Robotics Telemetry...', 'dim');
        this.onSim?.('robot');
        break;

      case 'cad':
        if (arg === 'robot' || arg === 'raspberry' || arg === 'esp32') {
          this.print(`Inspecting physical 3D model [${arg.toUpperCase()}]...`, 'dim');
          this.onHardware?.(arg);
        } else {
          this.print('Usage: cad [robot | raspberry | esp32]', 'error');
        }
        break;

      case 'game':
      case 'timeline':
        this.print('Entering Playable Pixel Memory World...', 'dim');
        this.onNavigate?.('timeline');
        break;

      case 'about':
        this.onNavigate?.('about');
        break;

      case 'research':
        this.onNavigate?.('research');
        break;

      case 'contact':
        this.print(`
EMAIL: <a href="mailto:jaijitesh.2025@vitstudent.ac.in" class="term-link">jaijitesh.2025@vitstudent.ac.in</a>
PHONE: +91 9940970749
LINKEDIN: <a href="https://www.linkedin.com/in/jaijitesh-suryaprakash-j" target="_blank" class="term-link">linkedin.com/in/jaijitesh-suryaprakash-j</a>
GITHUB: <a href="https://github.com/BerrF35" target="_blank" class="term-link">github.com/BerrF35</a>
WINDSIM: <a href="https://berrf35.github.io/Windsim/" target="_blank" class="term-link">berrf35.github.io/Windsim</a>
        `, 'output');
        break;

      case 'ls': {
        const files = this.fs[this.currentPath] || [];
        this.print(files.map(f => f.endsWith('.glb') ? `<span class="term-cad">${f}</span>` : (!f.includes('.') ? `<span class="term-dir">${f}/</span>` : f)).join('   '), 'output');
        break;
      }

      case 'cd':
        if (!arg || arg === '~') {
          this.currentPath = '~';
        } else if (arg === '..') {
          this.currentPath = '~';
        } else if (this.fs[`~/${arg}`]) {
          this.currentPath = `~/${arg}`;
        } else if (this.fs[arg]) {
          this.currentPath = arg;
        } else {
          this.print(`cd: no such directory: ${arg}`, 'error');
        }
        this.pathPrompt.textContent = this.currentPath;
        break;

      case 'cat':
        if (!arg) {
          this.print('cat: specify a filename to read', 'error');
        } else if (arg.includes('windsim')) {
          this.print(`
<b>WINDSIM // AERODYNAMICS PLATFORM</b>
- Browser-based CFD platform combining real-time reduced order wind sandbox & deterministic LBM solver.
- Streamlines, slices, and surface pressure visualization.
- Repository: BerrF35/Windsim (JavaScript, MIT License)
- Deployed at: https://berrf35.github.io/Windsim/
          `, 'output');
        } else if (arg.includes('berry_ai') || arg.includes('berry')) {
          this.print(`
<b>BERRY // LOCAL DESKTOP AI ASSISTANT</b>
- Local-first architecture: Core Engine, Berry CUA sidecar, Browser Relay, Skill Codex, Berry Vault.
- Executes Python/JS locally, manipulates files, automated browser sessions, persistent document memory.
- Repository: BerrF35/Berry (Python, AGPL-3.0)
          `, 'output');
        } else if (arg.includes('berrybot')) {
          this.print(`
<b>BERRYBOT // TRACKED AUTONOMOUS ROBOT</b>
- Built around Waveshare ESP32 controller.
- Optical encoder feedback, S-curve trajectory profiling, telemetry, path tracking, return-to-home.
- Built entirely by Jaijitesh.
          `, 'output');
        } else if (arg === 'readme.md' || arg === 'contact.txt') {
          this.print(`
<b>JAIJITESH SURYAPRAKASH</b>
Email: jaijitesh.2025@vitstudent.ac.in | Phone: +91 9940970749
GitHub: github.com/BerrF35 | LinkedIn: linkedin.com/in/jaijitesh-suryaprakash-j
Live Sim: https://berrf35.github.io/Windsim/
          `, 'output');
        } else {
          this.print(`Reading ${arg}... [Loaded from virtual filesystem]`, 'output');
        }
        break;

      case 'sudo':
        this.print('jaijitesh is not in the sudoers file. This incident will be logged.', 'error');
        sound.click(200, 0.08);
        break;

      case 'theme':
        if (arg === 'light' || arg === 'dark' || arg === 'matrix') {
          document.documentElement.dataset.theme = arg;
          this.print(`Theme set to: ${arg.toUpperCase()}`, 'dim');
          sound.tick(1000);
        } else {
          this.print('Usage: theme [dark | light | matrix]', 'error');
        }
        break;

      case 'clear':
        this.output.innerHTML = '';
        break;

      default:
        this.print(`command not found: ${cmd}. Type 'help' for available commands.`, 'error');
        break;
    }
  }
}
