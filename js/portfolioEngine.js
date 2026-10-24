/**
 * JAIJITESH SURYAPRAKASH — PORTFOLIO ENGINE
 * Lightweight, accessible interactions without unnecessary overhead
 */

export class PortfolioEngine {
  constructor() {
    this.init();
  }

  init() {
    this.initToast();
    this.initEmailCopy();
    this.initMobileMenu();
    this.initFaqAccordion();
    this.initContactForm();
    this.initDotGlobe();
    this.initWorkSlidesScroll();
    this.initProjectVisuals();
  }

  /* --- Toast Notifications --- */
  initToast() {
    window.showToast = (message) => {
      let toast = document.getElementById('toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #14171d;
          color: #f4f4f6;
          border: 1px solid #e5a93c;
          padding: 12px 20px;
          border-radius: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 0.85rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          z-index: 9999;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 200ms ease, transform 200ms ease;
          pointer-events: none;
        `;
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }, 2800);
    };
  }

  /* --- Email Copy Utility --- */
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

  /* --- Accessible Mobile Navigation --- */
  initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- FAQ Accordion --- */
  initFaqAccordion() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(q => {
      q.addEventListener('click', () => {
        const item = q.closest('.faq-item');
        const answer = item.querySelector('.faq-answer');
        const isExpanded = q.getAttribute('aria-expanded') === 'true';

        // Toggle current
        q.setAttribute('aria-expanded', !isExpanded);
        answer.hidden = isExpanded;
      });
    });
  }

  /* --- Honest Contact Form Handling --- */
  initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('name') || {}).value || '';
      const email = (document.getElementById('email') || {}).value || '';
      const subject = (document.getElementById('subject') || {}).value || 'Engineering Inquiry';
      const message = (document.getElementById('message') || {}).value || '';

      const bodyText = `Hi Jaijitesh,\n\n${message}\n\nFrom: ${name} (${email})`;
      const mailtoUrl = `mailto:jaijiteshsp@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

      // Copy message draft to clipboard for convenience
      navigator.clipboard.writeText(bodyText).catch(() => {});

      window.showToast('Opening default email client... (Draft copied to clipboard)');

      // Launch email client
      setTimeout(() => {
        window.location.href = mailtoUrl;
      }, 350);
    });
  }

  /* --- Lightweight 2D Dot Globe (Personal Page) --- */
  initDotGlobe() {
    const canvas = document.getElementById('globeCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(canvas);

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.min(rect.width || 280, 320);
      canvas.height = 180;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const radius = 64;
    const dots = [];
    const count = 220;
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
    const pin = {
      x: radius * Math.cos(pinLat) * Math.sin(pinLon),
      y: -radius * Math.sin(pinLat),
      z: radius * Math.cos(pinLat) * Math.cos(pinLon)
    };

    let angleY = 0;
    const rotateY = (p, a) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
    };

    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        angleY += 0.008;

        dots.forEach(dot => {
          const p = rotateY(dot, angleY);
          if (p.z > -10) {
            const alpha = (p.z + radius) / (2 * radius);
            ctx.beginPath();
            ctx.arc(cx + p.x, cy + p.y, 1.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(229, 169, 60, ${Math.max(0.15, alpha * 0.7)})`;
            ctx.fill();
          }
        });

        const pPin = rotateY(pin, angleY);
        if (pPin.z > 0) {
          ctx.beginPath();
          ctx.arc(cx + pPin.x, cy + pPin.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#f4f4f6';
          ctx.fill();

          ctx.fillStyle = '#e5a93c';
          ctx.font = '10px "Space Mono", monospace';
          ctx.fillText('VIT Vellore', cx + pPin.x + 6, cy + pPin.y + 3);
        }
      }
      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  /* --- Cinematic Work Slides Intersection Observer --- */
  initWorkSlidesScroll() {
    const slides = document.querySelectorAll('.work-slide');
    if (!slides.length) return;

    // Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      slides.forEach(slide => slide.classList.add('is-inview'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
        }
      });
    }, {
      rootMargin: '-5% 0px -10% 0px',
      threshold: 0.15
    });

    slides.forEach(slide => observer.observe(slide));
  }

  /* --- Interactive Visual Telemetry Panels --- */
  initProjectVisuals() {
    this.initWindSimCanvas();
    this.initAutoBotCanvas();
    this.initPerfmonCanvas();
  }

  /* 1. WindSim Streamline Flow Canvas */
  initWindSimCanvas() {
    const canvas = document.getElementById('windsimCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isVisible = false;
    const obs = new IntersectionObserver(([e]) => { isVisible = e.isIntersecting; }, { threshold: 0.1 });
    obs.observe(canvas);

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth || 400;
      canvas.height = 200;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Streamline particles
    const particles = Array.from({ length: 42 }, () => ({
      x: Math.random() * 400,
      y: 20 + Math.random() * 160,
      speed: 1.8 + Math.random() * 2.2,
      length: 12 + Math.random() * 24
    }));

    const drawAirfoil = () => {
      const cx = canvas.width * 0.45;
      const cy = canvas.height * 0.52;
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy);
      ctx.bezierCurveTo(cx - 30, cy - 28, cx + 40, cy - 14, cx + 70, cy);
      ctx.bezierCurveTo(cx + 35, cy + 12, cx - 30, cy + 16, cx - 70, cy);
      ctx.strokeStyle = '#e5a93c';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(229, 169, 60, 0.15)';
      ctx.fill();
      ctx.stroke();
    };

    const animate = () => {
      if (isVisible) {
        ctx.fillStyle = 'rgba(11, 14, 18, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawAirfoil();

        particles.forEach(p => {
          p.x += p.speed;
          if (p.x > canvas.width) {
            p.x = 0;
            p.y = 20 + Math.random() * 160;
          }

          // Airfoil deflection
          const cx = canvas.width * 0.45;
          const cy = canvas.height * 0.52;
          const dx = p.x - cx;
          const dy = p.y - cy;
          let defY = p.y;
          if (Math.abs(dx) < 80 && Math.abs(dy) < 40) {
            defY += dy > 0 ? 12 : -16;
          }

          ctx.beginPath();
          ctx.moveTo(p.x, defY);
          ctx.lineTo(p.x - p.length, defY);
          ctx.strokeStyle = 'rgba(244, 244, 246, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  /* 2. AutoBot PID Response & Kinematics Canvas */
  initAutoBotCanvas() {
    const canvas = document.getElementById('autobotCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isVisible = false;
    const obs = new IntersectionObserver(([e]) => { isVisible = e.isIntersecting; }, { threshold: 0.1 });
    obs.observe(canvas);

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth || 400;
      canvas.height = 200;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    let t = 0;
    const dataPoints = [];
    const maxPoints = 80;

    const animate = () => {
      if (isVisible) {
        t += 0.04;
        ctx.fillStyle = 'rgba(11, 14, 18, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Target setpoint line
        const setpointY = canvas.height * 0.4;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(229, 169, 60, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.moveTo(0, setpointY);
        ctx.lineTo(canvas.width, setpointY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Closed-loop PID curve with damped oscillation
        const targetVal = setpointY;
        const currentVal = targetVal + Math.sin(t * 1.5) * 28 * Math.exp(-((t % 6) * 0.4));
        dataPoints.push(currentVal);
        if (dataPoints.length > maxPoints) dataPoints.shift();

        ctx.beginPath();
        const stepX = canvas.width / maxPoints;
        dataPoints.forEach((val, i) => {
          const x = i * stepX;
          if (i === 0) ctx.moveTo(x, val);
          else ctx.lineTo(x, val);
        });
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Latest point marker
        if (dataPoints.length > 0) {
          const lastX = (dataPoints.length - 1) * stepX;
          const lastY = dataPoints[dataPoints.length - 1];
          ctx.beginPath();
          ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#f4f4f6';
          ctx.fill();
        }
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  /* 3. Performance Monitor Telemetry Sparkline Canvas */
  initPerfmonCanvas() {
    const canvas = document.getElementById('perfmonCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isVisible = false;
    const obs = new IntersectionObserver(([e]) => { isVisible = e.isIntersecting; }, { threshold: 0.1 });
    obs.observe(canvas);

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth || 400;
      canvas.height = 200;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const cores = Array.from({ length: 4 }, () => ({
      data: Array.from({ length: 40 }, () => 30 + Math.random() * 40)
    }));

    let tick = 0;
    const animate = () => {
      if (isVisible) {
        tick++;
        if (tick % 6 === 0) {
          cores.forEach(core => {
            const last = core.data[core.data.length - 1];
            const next = Math.max(15, Math.min(95, last + (Math.random() - 0.48) * 14));
            core.data.push(next);
            core.data.shift();
          });
        }

        ctx.fillStyle = 'rgba(11, 14, 18, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const colors = ['#e5a93c', '#34d399', '#60a5fa', '#f472b6'];
        const stepX = canvas.width / 40;

        cores.forEach((core, idx) => {
          ctx.beginPath();
          core.data.forEach((val, i) => {
            const x = i * stepX;
            const y = canvas.height - (val / 100) * (canvas.height - 30) - 15;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = colors[idx % colors.length];
          ctx.lineWidth = 1.4;
          ctx.stroke();
        });
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

// Auto-instantiate
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.portfolioEngine = new PortfolioEngine();
  });
}
