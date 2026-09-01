import { sound } from './audio.js';

export class AgentSimulator {
  constructor(container) {
    this.container = container;
    this.animId = null;
    this.running = false;

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="agent-sim">
        <header class="agent-sim__header">
          <div class="agent-sim__title">
            <b>BERRY // LOCAL-FIRST DESKTOP AI ASSISTANT</b>
            <span>CORE ENGINE &bull; BERRY CUA (COMPUTER USE) &bull; BROWSER RELAY &bull; BERRY VAULT</span>
          </div>
          <div class="agent-sim__presets">
            <button class="agent-preset-btn" data-query="Automate browser flight telemetry scrape" type="button">TASK 1: BROWSER RELAY</button>
            <button class="agent-preset-btn" data-query="Execute local Python CFD data analysis" type="button">TASK 2: BERRY CUA (CODE EXEC)</button>
            <button class="agent-preset-btn" data-query="Query Berry Vault for research citations" type="button">TASK 3: VAULT MEMORY</button>
          </div>
        </header>

        <div class="agent-sim__body">
          <div class="agent-sim__graph">
            <div class="agent-node" id="nodeCore">
              <div class="node-head">01 // CENTRAL ENGINE</div>
              <div class="node-title">CORE ENGINE</div>
              <div class="node-meta">Orchestrator &bull; Python</div>
            </div>
            <div class="agent-arrow">&rarr;</div>

            <div class="agent-node" id="nodeCua">
              <div class="node-head">02 // OS SIDECAR</div>
              <div class="node-title">BERRY CUA</div>
              <div class="node-meta">Filesystem &bull; Terminal</div>
            </div>
            <div class="agent-arrow">&rarr;</div>

            <div class="agent-node" id="nodeRelay">
              <div class="node-head">03 // WEB AUTOMATION</div>
              <div class="node-title">BROWSER RELAY</div>
              <div class="node-meta">Chromium Bridge</div>
            </div>
            <div class="agent-arrow">&rarr;</div>

            <div class="agent-node" id="nodeVault">
              <div class="node-head">04 // PERSISTENCE</div>
              <div class="node-title">BERRY VAULT</div>
              <div class="node-meta">Long-term Memory</div>
            </div>
          </div>

          <div class="agent-sim__terminal">
            <div class="agent-term-head">
              <span>LOCAL EXECUTION STREAM [AIR-GAPPED // ON-DEVICE]</span>
              <span id="agentStatus">READY</span>
            </div>
            <div class="agent-term-body" id="agentStream">
              <span class="dim">// Select a task above to trigger Berry's local orchestration pipeline.</span>
            </div>
          </div>

          <div class="agent-sim__metrics">
            <div class="metric-box"><span>ARCHITECTURE</span><b>Local-First / Modular</b></div>
            <div class="metric-box"><span>SKILL CODEX</span><b>Markdown Skills Library</b></div>
            <div class="metric-box"><span>LICENSE</span><b>AGPL-3.0 (Python)</b></div>
            <div class="metric-box"><span>PRIVACY</span><b>100% On-Device Processing</b></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('.agent-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.dataset.query;
        this.runTask(query);
      });
    });
  }

  runTask(query) {
    if (this.running) return;
    this.running = true;
    sound.click(680, 0.03);

    const stream = this.container.querySelector('#agentStream');
    const status = this.container.querySelector('#agentStatus');
    const nodes = [
      this.container.querySelector('#nodeCore'),
      this.container.querySelector('#nodeCua'),
      this.container.querySelector('#nodeRelay'),
      this.container.querySelector('#nodeVault')
    ];

    if (stream) stream.innerHTML = `<div class="accent">&gt; INITIATING TASK: "${query}"</div>`;
    if (status) status.textContent = 'RUNNING';

    // Step 1: Core Engine
    nodes.forEach(n => n.classList.remove('is-active'));
    nodes[0]?.classList.add('is-active');
    sound.tick(900);

    setTimeout(() => {
      // Step 2: CUA
      nodes[0]?.classList.remove('is-active');
      nodes[1]?.classList.add('is-active');
      if (stream) stream.innerHTML += `<div class="dim">&gt; Berry CUA sidecar evaluating system commands &amp; local script generator...</div>`;
      sound.tick(1100);

      setTimeout(() => {
        // Step 3: Browser Relay / Tools
        nodes[1]?.classList.remove('is-active');
        nodes[2]?.classList.add('is-active');
        if (stream) stream.innerHTML += `<div class="dim">&gt; Browser Relay establishing real-time DOM bridge and executing workflow...</div>`;
        sound.click(800, 0.02);

        setTimeout(() => {
          // Step 4: Vault
          nodes[2]?.classList.remove('is-active');
          nodes[3]?.classList.add('is-active');
          if (stream) {
            stream.innerHTML += `
              <div class="success">&gt; Task execution completed successfully:</div>
              <div class="output">
                &bull; Session state archived to Berry Vault.<br/>
                &bull; Local filesystem modified with zero cloud exposure.<br/>
                &bull; Telemetry reported to JAIJITESH.OS desktop.
              </div>
            `;
          }
          sound.chipJingle();

          setTimeout(() => {
            nodes[3]?.classList.remove('is-active');
            if (status) status.textContent = 'READY';
            this.running = false;
          }, 800);
        }, 800);
      }, 700);
    }, 600);
  }

  destroy() {
    this.running = false;
  }
}
