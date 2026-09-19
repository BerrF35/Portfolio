export class ScrollParallaxEngine {
  constructor() {
    this.heroTrack = document.getElementById('heroTrack');
    this.heroPin = document.getElementById('heroPin');
    this.titleJai = document.getElementById('titleJaijitesh');
    this.titleSur = document.getElementById('titleSuryaprakash');
    this.subtitle = document.getElementById('entrySubtitle');
    this.scrollHint = document.getElementById('scrollHint');
    this.topNav = document.getElementById('topNav');
    this.introContainer = document.getElementById('introContainer');
    this.introCard = document.getElementById('introCard');
    this.statsScreen = document.getElementById('statsScreen');
    this.statBoxes = document.querySelectorAll('.stat-box');
    this.statDigits = document.querySelectorAll('.stat-digits');
    this.hasAnimatedDigits = false;
    this.eduSection = document.getElementById('educationSection');
    this.eduSchool = document.getElementById('eduSchool');
    this.eduCollege = document.getElementById('eduCollege');
    this.starCanvas = document.getElementById('starCanvas');
    this.hasShotStar = false;
    this.projectsSection = document.getElementById('projectsSection');
    this.projectItems = document.querySelectorAll('.project-item');

    this.init();
  }

  init() {
    this.initScrollListener();

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      this.initGSAPChoreography();
    } else {
      this.initFallback();
    }
  }

  initScrollListener() {
    window.addEventListener('scroll', () => {
      if (window.__webglBackgroundInstance) {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        window.__webglBackgroundInstance.setScrollProgress(progress);
      }
    }, { passive: true });
  }

  initGSAPChoreography() {
    if (this.heroTrack && this.titleJai && this.titleSur) {
      const heroTL = gsap.timeline({
        scrollTrigger: {
          trigger: this.heroTrack,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.1
        }
      });

      const getJaiDistance = () => {
        const rect = this.titleJai.getBoundingClientRect();
        return window.innerWidth - rect.left + 180;
      };

      const getSurDistance = () => {
        const rect = this.titleSur.getBoundingClientRect();
        return window.innerWidth - rect.left + 180;
      };

      heroTL
        .to(this.titleJai, { 
          x: getJaiDistance, 
          ease: 'power1.out',
          duration: 1 
        }, 0)
        .to(this.titleSur, { 
          x: getSurDistance, 
          ease: 'power2.in',
          duration: 1 
        }, 0)
        .to([this.titleJai, this.titleSur], {
          opacity: 0,
          duration: 0.2,
          ease: 'power1.in'
        }, 0.8)
        .to([this.subtitle, this.scrollHint], { 
          y: -25, 
          opacity: 0, 
          duration: 0.35, 
          ease: 'power1.out' 
        }, 0);

      if (this.topNav) {
        gsap.fromTo(this.topNav, 
          { y: -20, opacity: 0, pointerEvents: 'none' },
          {
            y: 0,
            opacity: 1,
            pointerEvents: 'auto',
            duration: 0.3,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: this.heroTrack,
              start: '35% top',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    }

    if (this.introCard && this.introContainer) {
      gsap.fromTo(this.introCard,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: this.introContainer,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    if (this.statsScreen && this.statBoxes.length > 0) {
      gsap.fromTo(this.statBoxes,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: this.statsScreen,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
            onEnter: () => this.animateDigitsSequence()
          }
        }
      );
    }

    if (this.eduSection && this.eduSchool && this.eduCollege) {
      gsap.fromTo([this.eduSchool, this.eduCollege],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: this.eduSection,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
            onEnter: () => {
              if (!this.hasShotStar) {
                this.hasShotStar = true;
                this.launchShootingStar();
              }
            }
          }
        }
      );
    }

    if (this.projectsSection && this.projectItems.length > 0) {
      gsap.fromTo(this.projectItems,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: this.projectsSection,
            start: 'top 75%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }

  animateDigitsSequence() {
    if (this.hasAnimatedDigits) return;
    this.hasAnimatedDigits = true;

    const chars = '0123456789%#$@&*';

    this.statDigits.forEach((el) => {
      const targetText = el.textContent.trim();
      let step = 0;
      const totalSteps = 10;

      const timer = setInterval(() => {
        step++;
        if (step >= totalSteps) {
          clearInterval(timer);
          el.textContent = targetText;
          return;
        }

        el.textContent = targetText
          .split('')
          .map((c) => {
            if (c === '+' || c === ' ') return c;
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
      }, 35);
    });
  }

  launchShootingStar() {
    if (!this.starCanvas || !this.eduSchool || !this.eduCollege) return;
    const canvasRect = this.starCanvas.getBoundingClientRect();
    this.starCanvas.width = canvasRect.width || this.starCanvas.parentElement.clientWidth || 800;
    this.starCanvas.height = canvasRect.height || this.starCanvas.parentElement.clientHeight || 400;

    const ctx = this.starCanvas.getContext('2d');
    if (!ctx) return;

    const schoolRect = this.eduSchool.getBoundingClientRect();
    const collegeRect = this.eduCollege.getBoundingClientRect();

    const startX = Math.max(20, schoolRect.right - canvasRect.left - 20);
    const startY = Math.max(20, schoolRect.top - canvasRect.top + schoolRect.height / 2);
    const endX = Math.min(this.starCanvas.width - 20, collegeRect.left - canvasRect.left + 20);
    const endY = Math.max(20, collegeRect.top - canvasRect.top + collegeRect.height / 2);

    const ctrlX = (startX + endX) / 2;
    const ctrlY = Math.min(startY, endY) - 80;

    let progress = 0;
    const trail = [];

    const animateStar = () => {
      progress += 0.045;
      const t = Math.min(1, progress);

      const curX = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * ctrlX + Math.pow(t, 2) * endX;
      const curY = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * ctrlY + Math.pow(t, 2) * endY;

      trail.push({ x: curX, y: curY, alpha: 1 });

      ctx.clearRect(0, 0, this.starCanvas.width, this.starCanvas.height);

      for (let i = 0; i < trail.length; i++) {
        const pt = trail[i];
        pt.alpha -= 0.05;
        if (pt.alpha > 0) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5 * pt.alpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(45, 212, 191, ${pt.alpha * 0.85})`;
          ctx.fill();
        }
      }

      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      if (progress < 1) {
        requestAnimationFrame(animateStar);
      } else {
        setTimeout(() => {
          ctx.clearRect(0, 0, this.starCanvas.width, this.starCanvas.height);
          if (this.eduCollege) {
            this.eduCollege.classList.add('star-hit');
          }
        }, 80);
      }
    };

    requestAnimationFrame(animateStar);
  }

  initFallback() {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || 0;
      if (this.titleJai) this.titleJai.style.transform = `translateX(${scrollY * 0.4}px)`;
      if (this.titleSur) this.titleSur.style.transform = `translateX(${scrollY * 0.2}px)`;
      if (this.introCard) {
        const rect = this.introCard.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
          this.introCard.style.opacity = '1';
          this.introCard.style.transform = 'translateY(0)';
        }
      }
    }, { passive: true });
  }
}
