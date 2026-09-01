import { sound } from '../core/audio.js';

export class BerryAgentVisualizer {
  constructor(container) {
    this.container = container;
    this.activeNode = 'core';
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="agent-app">
        <header class="agent-app__header">
          <div class="agent-app__title">
            <b>BERRY // LOCAL-FIRST DESKTOP AI AGENT</b>
            <span>PYTHON &bull; AGPL-3.0 &bull; SYSTEM AUTOMATION &bull; CUA SIDECAR</span>
          </div>
          <div class="agent-app__repo">
            <a class="agent-link" href="https://github.com/BerrF35/Berry" target="_blank" rel="noopener noreferrer">
              GITHUB REPO: BerrF35/Berry ↗
            </a>
          </div>
        </header>

        <div class="agent-app__body">
          <div class="agent-graph">
            <div class="agent-node agent-node--primary" data-node="core">
              <span class="agent-node__badge">CORE RUNTIME</span>
              <b>Berry Core Engine</b>
              <p>Task router, agent orchestration &amp; execution loop</p>
            </div>

            <div class="agent-grid">
              <div class="agent-node" data-node="cua">
                <span class="agent-node__tag">PERCEPTION &amp; ACTION</span>
                <b>Berry CUA Sidecar</b>
                <p>Computer Use Agent (GUI vision, clicks, keystrokes)</p>
              </div>

              <div class="agent-node" data-node="browser">
                <span class="agent-node__tag">WEB AUTOMATION</span>
                <b>Browser Relay</b>
                <p>Chromium CDP bridge, DOM parsing, network hooks</p>
              </div>

              <div class="agent-node" data-node="codex">
                <span class="agent-node__tag">EXTENSIONS</span>
                <b>Skill Codex</b>
                <p>Dynamic tool binding, CLI executors, custom Python modules</p>
              </div>

              <div class="agent-node" data-node="vault">
                <span class="agent-node__tag">PERSISTENCE</span>
                <b>Berry Vault</b>
                <p>Local SQLite metadata, memory recall &amp; encrypted tokens</p>
              </div>
            </div>
          </div>

          <aside class="agent-details" id="agentDetails">
            <div class="agent-detail-card" id="agentDetailCard">
              <span class="agent-badge">CORE COMPONENT</span>
              <h3 id="agentDetailTitle">Berry Core Engine</h3>
              <p id="agentDetailCopy">
                The central orchestrator in Python that bridges local and remote LLM backends with direct OS automation. Routes intents to CUA, Browser Relay, or terminal tools with strict local execution privacy.
              </p>
              <div class="agent-specs" id="agentDetailSpecs">
                <div><span>LANGUAGE</span><b>Python 3.11+</b></div>
                <div><span>LICENSE</span><b>AGPL-3.0</b></div>
                <div><span>REPOSITORY</span><b>BerrF35/Berry</b></div>
                <div><span>EXECUTION</span><b>Local-First / Sidecar</b></div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const nodes = this.container.querySelectorAll('.agent-node');
    nodes.forEach((n) => {
      n.addEventListener('click', () => {
        nodes.forEach((o) => o.classList.remove('is-active'));
        n.classList.add('is-active');
        this.selectNode(n.dataset.node);
        sound.click(750, 0.02);
      });
    });
  }

  selectNode(nodeKey) {
    const titleEl = this.container.querySelector('#agentDetailTitle');
    const copyEl = this.container.querySelector('#agentDetailCopy');

    const nodeData = {
      core: {
        title: 'Berry Core Engine',
        copy: 'The central orchestrator in Python that bridges local and remote LLM backends with direct OS automation. Routes intents to CUA, Browser Relay, or terminal tools with strict local execution privacy.'
      },
      cua: {
        title: 'Berry CUA (Computer Use Agent)',
        copy: 'Low-latency desktop sidecar with screen capture, viewport coordinates parsing, and native OS mouse/keyboard synthetic event dispatching.'
      },
      browser: {
        title: 'Browser Relay Service',
        copy: 'Direct Chromium DevTools Protocol (CDP) controller enabling automated research, web page scraping, form submission, and tab orchestration.'
      },
      codex: {
        title: 'Skill Codex & Tool Registry',
        copy: 'Extensible plugin system enabling dynamic runtime loading of Python functions, CLI scripts, and domain-specific knowledge bases.'
      },
      vault: {
        title: 'Berry Vault & Local Memory',
        copy: 'Encrypted on-disk key-value and SQLite persistent store for long-term user context, credentials, task history, and episodic recall.'
      }
    };

    const data = nodeData[nodeKey] || nodeData.core;
    if (titleEl) titleEl.textContent = data.title;
    if (copyEl) copyEl.textContent = data.copy;
  }

  destroy() {}
}
