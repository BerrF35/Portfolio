import { sound } from '../core/audio.js';

export class TerminalApp {
  constructor(container, onInspect) {
    this.container = container;
    this.onInspect = onInspect;
    this.history = [];
    this.historyIndex = -1;

    this.fs = {
      'about.txt': `Jaijitesh Suryaprakash
B.Tech Information Technology, VIT Vellore (2025-2029)
Schooling: SCTS (10th: 93.4%, 12th: 76.4%), Current CGPA: 5.89
Focus: Aerodynamics CFD, Local-First AI Agents, Autonomous Robotics, Synthetic Data Pipelines`,
      'projects.txt': `1. WindSim - Real-time aerodynamics platform with Lattice Boltzmann CFD. (berrf35.github.io/Windsim)
2. Berry - High-performance local-first desktop AI assistant in Python. (github.com/BerrF35/Berry)
3. BerryBot - Tracked autonomous robot platform w/ Waveshare ESP32 controller.
4. FarmAssist AI - AI-assisted agriculture & edge vision (Yantra '26 Central Hack).
5. ImpactX 3.0 - Hyperlocal service marketplace (3rd place overall).
6. Vinhack 25 - P2P book exchange platform.`,
      'research.txt': `Collaborative Research (Professor & 5-person Group):
- Paper 1: Synthetic Data Generation Pipelines (synthetic-data-generator)
- Paper 2: Spectral Color-Space Image Analysis (color-splitter)
- Paper 3: Autonomous Vision & Robotics Systems`,
      'contact.txt': `Email:    jaijitesh.2025@vitstudent.ac.in
Phone:    +91 9940970749
GitHub:   github.com/BerrF35
LinkedIn: linkedin.com/in/jaijitesh-suryaprakash-j`,
      'hardware.txt': `Workbench Nodes:
- BerryBot Tracked Robotics Chassis
- Raspberry Pi 4 Model B (Broadcom BCM2711)
- ESP32-WROOM Dual-Core Microcontroller
- Canon AT-1 35mm Retro Optical Camera
- Refractor Telescope (Astronomical Optics)
- Berry (12yo Belgian Malinois Companion)
- Crispy (10yo Companion Cat)`
    };

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="cli-term">
        <div class="cli-term__output" id="cliOutput">
          <div class="cli-term__banner">
            JAIJITESH.OS v2.6.4 (x86_64-workstation-linux-gnu)<br />
            * Documentation:  https://github.com/BerrF35<br />
            * Management:     Type 'help' for command index.<br />
            Last login: Tue Sep  1 11:48:00 2026 from 127.0.0.1
          </div>
        </div>
        <div class="cli-term__input-line">
          <span class="cli-prompt">jaijitesh@workstation:~$</span>
          <input class="cli-input" id="cliInput" type="text" autofocus autocomplete="off" spellcheck="false" />
        </div>
      </div>
    `;

    this.outputEl = this.container.querySelector('#cliOutput');
    this.inputEl = this.container.querySelector('#cliInput');

    this.bindEvents();
  }

  bindEvents() {
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = this.inputEl.value.trim();
        this.inputEl.value = '';
        if (cmd) {
          this.history.push(cmd);
          this.historyIndex = this.history.length;
          this.execute(cmd);
        }
      } else if (e.key === 'ArrowUp') {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.inputEl.value = this.history[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.inputEl.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = this.history.length;
          this.inputEl.value = '';
        }
      }
    });

    this.container.addEventListener('click', () => {
      this.inputEl.focus();
    });
  }

  print(html, isCmd = false) {
    const line = document.createElement('div');
    line.className = isCmd ? 'cli-line cli-line--cmd' : 'cli-line';
    line.innerHTML = html;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  execute(cmdLine) {
    sound.tick(1100);
    this.print(`<span class="cli-prompt">jaijitesh@workstation:~$</span> ${this.escapeHtml(cmdLine)}`, true);

    const parts = cmdLine.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        this.print(`
Available commands:
  <b>neofetch</b>     - Display system specifications and ASCII badge
  <b>ls</b>           - List files in virtual environment
  <b>cat &lt;file&gt;</b>    - Display contents of a file
  <b>projects</b>     - List major engineering systems and deployments
  <b>research</b>     - View research papers in preparation
  <b>skills</b>       - Print verified technical skills matrix
  <b>contact</b>      - Print phone, email, and social coordinates
  <b>clear</b>        - Clear the terminal screen
  <b>inspect &lt;id&gt;</b> - Inspect 3D physical model (robot, pi, esp32, camera, cat, dog, telescope)
  <b>date</b>         - Print current system timestamp
  <b>whoami</b>       - Print authenticated user identity
        `);
        break;

      case 'ls':
        this.print(Object.keys(this.fs).join('   '));
        break;

      case 'cat':
        if (!args[0]) {
          this.print('<span class="cli-err">Usage: cat &lt;filename&gt;</span>');
        } else if (this.fs[args[0]]) {
          this.print(this.escapeHtml(this.fs[args[0]]).replace(/\n/g, '<br />'));
        } else {
          this.print(`<span class="cli-err">cat: ${this.escapeHtml(args[0])}: No such file or directory</span>`);
        }
        break;

      case 'neofetch':
        this.print(`
<div class="cli-neofetch">
  <pre class="cli-ascii">
     /\\___/\\
    (  o.o  )  JAIJITESH.OS
     > ^ <     ------------
  </pre>
  <div class="cli-specs">
    <b>OS:</b> JAIJITESH.OS v2.6.4 x86_64<br />
    <b>Host:</b> Engineering Workstation 16<br />
    <b>Kernel:</b> 6.8.0-custom-lbm-robotics<br />
    <b>Uptime:</b> 1st Year (2025-2029)<br />
    <b>Institution:</b> VIT Vellore (B.Tech IT)<br />
    <b>Schooling:</b> SCTS (10th: 93.4%, 12th: 76.4%)<br />
    <b>Languages:</b> Python, C, C++, JavaScript, HTML, CSS, SQL<br />
    <b>Hardware:</b> ESP32, Raspberry Pi, Tracked Robotics, SolidWorks<br />
    <b>Flagship:</b> WindSim (berrf35.github.io/Windsim)
  </div>
</div>
        `);
        break;

      case 'projects':
        this.print(this.escapeHtml(this.fs['projects.txt']).replace(/\n/g, '<br />'));
        break;

      case 'research':
        this.print(this.escapeHtml(this.fs['research.txt']).replace(/\n/g, '<br />'));
        break;

      case 'skills':
        this.print(`
<b>Languages:</b>      Python, Java, C, C++, JavaScript, HTML, CSS, SQL
<b>Frameworks:</b>     React, Node.js, Flask, FastAPI, REST APIs, Three.js, GSAP, SolidWorks CAD
<b>Hardware/Robotics:</b> Arduino, Raspberry Pi, ESP32 (Waveshare), Motor Control, Optical Encoders, S-Curve Trajectory, Path Tracking, Return-to-Home
<b>AI & Computation:</b> LLMs, AI Agents, Computer Vision, Image Processing, Synthetic Data, CFD / LBM, Browser Automation
        `);
        break;

      case 'contact':
        this.print(this.escapeHtml(this.fs['contact.txt']).replace(/\n/g, '<br />'));
        break;

      case 'inspect':
        if (!args[0]) {
          this.print('Available targets: robot, pi, esp32, camera, cat, dog, telescope');
        } else {
          const target = args[0].toLowerCase();
          const map = { pi: 'raspberry', raspberry: 'raspberry', robot: 'robot', esp32: 'esp32', camera: 'camera', cat: 'cat', dog: 'dog', telescope: 'telescope' };
          if (map[target]) {
            this.print(`Flying camera to 3D target [${map[target]}]...`);
            this.onInspect?.(map[target]);
          } else {
            this.print(`<span class="cli-err">Unknown 3D target: ${args[0]}</span>`);
          }
        }
        break;

      case 'clear':
        this.outputEl.innerHTML = '';
        break;

      case 'whoami':
        this.print('jaijitesh (Jaijitesh Suryaprakash - Undergraduate Engineer & AI Builder)');
        break;

      case 'date':
        this.print(new Date().toUTCString());
        break;

      default:
        this.print(`<span class="cli-err">Command not found: ${this.escapeHtml(cmd)}. Type 'help' for available commands.</span>`);
        break;
    }
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  destroy() {}
}
