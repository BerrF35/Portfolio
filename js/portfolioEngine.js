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
          font-family: 'JetBrains Mono', monospace;
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
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText('VIT Vellore', cx + pPin.x + 6, cy + pPin.y + 3);
        }
      }
      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }
}

// Auto-instantiate
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.portfolioEngine = new PortfolioEngine();
  });
}
