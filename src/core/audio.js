// JAIJITESH.OS // Procedural Synthesizer Audio Engine (Web Audio API)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.12;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.12;
    }
    return !this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.15) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context silently ignored if autoplay policy restricted
    }
  }

  click(freq = 600, duration = 0.03) {
    this.playTone(freq, 'triangle', duration, 0.2);
  }

  tick(freq = 1200) {
    this.playTone(freq, 'square', 0.015, 0.08);
  }

  powerOn() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const freqs = [220, 330, 440, 660, 880];
    freqs.forEach((f, i) => {
      setTimeout(() => {
        this.playTone(f, 'sine', 0.18, 0.12);
      }, i * 65);
    });
  }

  bootChime() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const chords = [392, 523.25, 659.25, 783.99, 1046.5];
    chords.forEach((f, i) => {
      setTimeout(() => {
        this.playTone(f, 'sine', 0.45, 0.15);
      }, i * 85);
    });
  }

  chipJingle() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.playTone(f, 'square', 0.06, 0.09);
      }, i * 45);
    });
  }

  sonarPing(freq = 880) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.playTone(freq, 'sine', 0.35, 0.22);
    setTimeout(() => {
      this.playTone(freq * 1.5, 'sine', 0.25, 0.12);
    }, 90);
  }
}

export const sound = new SoundEngine();
