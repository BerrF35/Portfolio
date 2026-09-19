export class PortfolioEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlayingAudio = false;
    this.sequenceTimer = null;
    this.chordIdx = 0;

    this.init();
  }

  init() {
    this.initToast();
    this.initEmailCopy();
    this.initAudioSynthesizer();
    this.initChecklist();
    this.initLifeSlider();
    this.initGlobe();
    this.initLetterModal();
    this.initThemeSync();
    this.initPageTransitions();
  }

    initToast() {
    window.showToast = (message) => {
      let toast = document.getElementById('toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast-msg';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('active');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        toast.classList.remove('active');
      }, 2600);
    };
  }

    initEmailCopy() {
    document.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('[data-action="copy-email"]');
      if (copyBtn) {
        e.preventDefault();
        const email = copyBtn.dataset.email || 'jaijiteshsp@gmail.com';
        navigator.clipboard.writeText(email)
          .then(() => window.showToast(`Copied ${email} to clipboard`))
          .catch(() => window.showToast(`Email: ${email}`));
      }
    });
  }

    initThemeSync() {
    window.addEventListener('tubesPaletteChange', (e) => {
      const p = e.detail;
      if (p && p.tubes && p.tubes.length > 0) {
        document.documentElement.style.setProperty('--accent', p.tubes[0]);
        document.documentElement.style.setProperty('--accent-line', p.tubes[1] || p.tubes[0]);
      }
    });
  }

    initAudioSynthesizer() {
    const chords = [
      [311.13, 392.00, 466.16, 587.33],       [293.66, 369.99, 440.00, 554.37],       [261.63, 311.13, 392.00, 466.16],       [233.08, 293.66, 349.23, 440.00],       [207.65, 261.63, 311.13, 392.00],       [293.66, 349.23, 440.00, 523.25]      ];

    const playChord = (notes, duration) => {
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;

      notes.forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1300 + Math.sin(now) * 120, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.035 / (i + 1), now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    };

    const loopStep = () => {
      if (!this.isPlayingAudio) return;
      playChord(chords[this.chordIdx], 2.2);
      this.chordIdx = (this.chordIdx + 1) % chords.length;
      this.sequenceTimer = setTimeout(loopStep, 2400);
    };

    const toggleAudio = () => {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.isPlayingAudio = !this.isPlayingAudio;
      const eqs = document.querySelectorAll('.audio-eq-icon');

      if (this.isPlayingAudio) {
        loopStep();
        eqs.forEach(eq => eq.classList.add('playing'));
        window.showToast('Now Playing: Nujabes — Aruarian Dance');
      } else {
        clearTimeout(this.sequenceTimer);
        eqs.forEach(eq => eq.classList.remove('playing'));
        window.showToast('Audio Paused');
      }
    };

    document.querySelectorAll('[data-action="toggle-audio"], #audioToggle, #audioPill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAudio();
      });
    });
  }

    initChecklist() {
    const checkboxes = document.querySelectorAll('.plan-checkbox');
    const badge = document.getElementById('planCountBadge');

    const update = () => {
      let remaining = 0;
      checkboxes.forEach(cb => {
        const row = cb.closest('.checklist-item');
        if (cb.checked) {
          if (row) row.classList.add('completed');
        } else {
          if (row) row.classList.remove('completed');
          remaining++;
        }
      });
      if (badge) badge.textContent = `${remaining} remaining`;
    };

    checkboxes.forEach(cb => cb.addEventListener('change', update));
    update();
  }

    initLifeSlider() {
    const slider = document.getElementById('lifeSlider');
    const prevBtn = document.getElementById('lifePrevBtn');
    const nextBtn = document.getElementById('lifeNextBtn');

    if (!slider) return;

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        slider.scrollBy({ left: -320, behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        slider.scrollBy({ left: 320, behavior: 'smooth' });
      });
    }
  }

    initGlobe() {
    const canvas = document.getElementById('globeCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeGlobe = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.min(rect.width || 300, 320);
      canvas.height = 200;
    };
    resizeGlobe();
    window.addEventListener('resize', resizeGlobe, { passive: true });

    const radius = 80;
    const dots = [];
    const count = 340;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      dots.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi)
      });
    }

        const pinLat = 12.97 * (Math.PI / 180);
    const pinLon = 79.15 * (Math.PI / 180);
    const pinMarker = {
      x: radius * Math.cos(pinLat) * Math.sin(pinLon),
      y: -radius * Math.sin(pinLat),
      z: radius * Math.cos(pinLat) * Math.cos(pinLon)
    };

    let angleY = 0;
    let angleX = 0.22;

    const rotateX = (p, a) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
    };

    const rotateY = (p, a) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
    };

    const render = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      angleY += 0.007;

      const rotatedDots = dots.map(dot => {
        let p = rotateY(dot, angleY);
        return rotateX(p, angleX);
      });

      rotatedDots.sort((a, b) => a.z - b.z);

      rotatedDots.forEach(p => {
        const alpha = Math.max(0.1, (p.z + radius) / (2 * radius));
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.45})`;
        ctx.fill();
      });

      let m = rotateY(pinMarker, angleY);
      m = rotateX(m, angleX);

      if (m.z > 0) {
        ctx.beginPath();
        ctx.arc(cx + m.x, cy + m.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#2dd4bf';
        ctx.shadowColor = '#2dd4bf';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Space Mono", monospace';
        ctx.fillText('India', cx + m.x + 8, cy + m.y + 3);
      }

      requestAnimationFrame(render);
    };

    render();
  }

    initLetterModal() {
    const modal = document.getElementById('letterModal');
    if (!modal) return;

    const openModal = () => {
      modal.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modal.classList.remove('modal-open');
      document.body.style.overflow = '';
    };

    document.querySelectorAll('[data-action="open-letter"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    document.querySelectorAll('[data-action="close-letter"], .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el || el.dataset.action === 'close-letter') {
          closeModal();
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('modal-open')) {
        closeModal();
      }
    });

    const form = document.getElementById('letterForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        window.showToast('Letter received. Thank you.');
        form.reset();
        closeModal();
      });
    }
  }

    initPageTransitions() {
    let curtain = document.getElementById('pageTransition');
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.id = 'pageTransition';
      curtain.className = 'page-transition-curtain';
      curtain.setAttribute('aria-hidden', 'true');
      curtain.innerHTML = `
        <div class="page-transition-line"></div>
        <div class="page-transition-brand">JAIJITESH SURYAPRAKASH</div>
      `;
      document.body.prepend(curtain);
    }

        if (sessionStorage.getItem('nav_transition_active') === '1') {
      sessionStorage.removeItem('nav_transition_active');
      curtain.classList.add('initial-covered');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          curtain.classList.remove('initial-covered');
          curtain.classList.add('leaving');
          setTimeout(() => {
            curtain.classList.remove('leaving');
          }, 520);
        });
      });
    }

        document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

            if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('javascript:') ||
        link.target === '_blank'
      ) {
        return;
      }

            const currentFile = window.location.pathname.split('/').pop() || 'index.html';
      const cleanHref = href.split('#')[0].split('?')[0].replace(/^\.\
      if (cleanHref === currentFile || (cleanHref === '' && currentFile === 'index.html')) {
        return;
      }

            if (cleanHref.endsWith('.html') || cleanHref === '') {
        e.preventDefault();
        sessionStorage.setItem('nav_transition_active', '1');

        curtain.classList.remove('leaving', 'initial-covered');
        curtain.classList.add('entering');

        setTimeout(() => {
          window.location.href = href;
        }, 340);
      }
    });
  }
}
