import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

export class HomeTubesCursor {
  constructor(canvasId = 'tubesCanvas') {
    this.canvas = document.getElementById(canvasId);
    this.instance = null;
    this.isActive = true;
    this.paletteIndex = 0;

    this.palettes = [
      {
        tubes: ["#ffffff", "#e0a82e", "#d84536"],
        lights: ["#ffffff", "#e0a82e", "#d84536", "#ffe49e"]
      },
      {
        tubes: ["#e0a82e", "#ffffff", "#c84131"],
        lights: ["#e0a82e", "#ffffff", "#c84131", "#ffeed0"]
      },
      {
        tubes: ["#d84536", "#ffffff", "#dfa732"],
        lights: ["#d84536", "#ffffff", "#dfa732", "#fcd580"]
      },
      {
        tubes: ["#ffffff", "#dca836", "#a83222"],
        lights: ["#ffffff", "#dca836", "#a83222", "#fff5e0"]
      },
      {
        tubes: ["#dfa732", "#c43c2c", "#ffffff"],
        lights: ["#dfa732", "#c43c2c", "#ffffff", "#ffe082"]
      },
      {
        tubes: ["#c83a2a", "#f0be4a", "#ffffff"],
        lights: ["#c83a2a", "#f0be4a", "#ffffff", "#ffd54f"]
      }
    ];

    this.init();
  }

  init() {
    if (!this.canvas) return;

    try {
      const initialPalette = this.palettes[0];
      this.instance = TubesCursor(this.canvas, {
        maxPixelRatio: 1,
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

    window.dispatchEvent(new CustomEvent('tubesPaletteChange', { detail: p }));
  }

  randomColors(count) {
    return new Array(count)
      .fill(0)
      .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
  }

  bindEvents() {
    this.clickHandler = (e) => {
      if (!this.isActive) return;
      if (e.target && e.target.closest && e.target.closest('a, button, input, textarea, select')) return;
      this.nextPalette();
    };

    window.addEventListener('click', this.clickHandler);

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
