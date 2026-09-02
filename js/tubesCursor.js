import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

export class HomeTubesCursor {
  constructor(canvasId = 'tubesCanvas') {
    this.canvas = document.getElementById(canvasId);
    this.instance = null;
    this.isActive = true;
    this.init();
  }

  init() {
    if (!this.canvas) return;

    try {
      this.instance = TubesCursor(this.canvas, {
        tubes: {
          colors: ["#38ef7d", "#38bdf8", "#818cf8"],
          lights: {
            intensity: 220,
            colors: ["#38ef7d", "#00ff88", "#38bdf8", "#e0e7ff"]
          }
        }
      });

      this.bindEvents();
    } catch (e) {
      console.warn('TubesCursor initialization error:', e);
    }
  }

  randomColors(count) {
    return new Array(count)
      .fill(0)
      .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
  }

  bindEvents() {
    const intro = document.getElementById('intro');
    if (!intro) return;

    this.clickHandler = (e) => {
      if (!this.isActive) return;
      if (e.target && e.target.closest && e.target.closest('#enter')) return;
      if (this.instance && this.instance.tubes) {
        const colors = this.randomColors(3);
        const lightsColors = this.randomColors(4);
        this.instance.tubes.setColors(colors);
        this.instance.tubes.setLightsColors(lightsColors);
      }
    };

    intro.addEventListener('click', this.clickHandler);
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
