import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

export class HomeTubesCursor {
  constructor(canvasId = 'tubesCanvas') {
    this.canvas = document.getElementById(canvasId);
    this.instance = null;
    this.isActive = true;
    this.paletteIndex = 0;

    this.palettes = [
      {
        tubes: ["#d84536", "#e0a82e", "#b83829"],
        lights: ["#d84536", "#e0a82e", "#9e2f22", "#f5ce72"]
      },
      {
        tubes: ["#e0a82e", "#d84536", "#d59828"],
        lights: ["#e0a82e", "#d84536", "#f0c265", "#b83829"]
      },
      {
        tubes: ["#c84131", "#dca836", "#8f281b"],
        lights: ["#c84131", "#dca836", "#e5b746", "#7c2217"]
      },
      {
        tubes: ["#dca836", "#bf3d2e", "#e8bb52"],
        lights: ["#dca836", "#bf3d2e", "#f5ce72", "#a83224"]
      },
      {
        tubes: ["#b83829", "#cf972a", "#8e271a"],
        lights: ["#b83829", "#cf972a", "#d84536", "#e0a82e"]
      },
      {
        tubes: ["#e2b03d", "#c74030", "#eec058"],
        lights: ["#e2b03d", "#c74030", "#d84536", "#f8d47e"]
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
