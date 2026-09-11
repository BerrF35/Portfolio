import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

export class HomeTubesCursor {
  constructor(canvasId = 'tubesCanvas') {
    this.canvas = document.getElementById(canvasId);
    this.instance = null;
    this.isActive = true;
    this.paletteIndex = 0;
    
    // Curated high-impact vibrant neon palettes
    this.palettes = [
      {
        tubes: ["#38ef7d", "#38bdf8", "#818cf8"],
        lights: ["#38ef7d", "#00ff88", "#38bdf8", "#e0e7ff"]
      },
      {
        tubes: ["#ff007f", "#7928ca", "#00f2fe"],
        lights: ["#ff007f", "#ff416c", "#7928ca", "#00f2fe"]
      },
      {
        tubes: ["#38bdf8", "#6366f1", "#ec4899"],
        lights: ["#38bdf8", "#818cf8", "#c084fc", "#f43f5e"]
      },
      {
        tubes: ["#10b981", "#06b6d4", "#3b82f6"],
        lights: ["#34d399", "#22d3ee", "#60a5fa", "#ffffff"]
      },
      {
        tubes: ["#f59e0b", "#ef4444", "#ec4899"],
        lights: ["#fbbf24", "#f87171", "#f472b6", "#ffffff"]
      },
      {
        tubes: ["#00ffcc", "#ff00aa", "#ffe600"],
        lights: ["#00ffcc", "#ff00aa", "#ffe600", "#ffffff"]
      }
    ];

    this.init();
  }

  init() {
    if (!this.canvas) return;

    try {
      const initialPalette = this.palettes[0];
      this.instance = TubesCursor(this.canvas, {
        tubes: {
          colors: initialPalette.tubes,
          lights: {
            intensity: 220,
            colors: initialPalette.lights
          }
        }
      });

      this.bindEvents();
    } catch (e) {
      console.warn('TubesCursor initialization error:', e);
    }
  }

  nextPalette() {
    if (!this.instance || !this.instance.tubes) return;
    this.paletteIndex = (this.paletteIndex + 1) % this.palettes.length;
    const p = this.palettes[this.paletteIndex];
    this.instance.tubes.setColors(p.tubes);
    this.instance.tubes.setLightsColors(p.lights);
  }

  randomColors(count) {
    return new Array(count)
      .fill(0)
      .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
  }

  bindEvents() {
    this.clickHandler = (e) => {
      if (!this.isActive) return;
      // Cycle to next gorgeous curated palette on click / tap
      this.nextPalette();
    };

    window.addEventListener('click', this.clickHandler);

    // Resize handling
    window.addEventListener('resize', () => {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
    }, { passive: true });
  }

  hide() {
    this.isActive = false;
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  show() {
    this.isActive = true;
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  const initTubes = () => {
    if (!window.__tubesCursorInstance) {
      window.__tubesCursorInstance = new HomeTubesCursor('tubesCanvas');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTubes);
  } else {
    initTubes();
  }
}
