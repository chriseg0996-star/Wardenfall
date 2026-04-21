// ============================================================
// Audio.js
// Procedural SFX using Web Audio API — no asset files needed.
// Every sound is synthesized from oscillators + filtered noise.
// Keeps the project self-contained. Replace with real samples
// later by swapping out the play() implementations.
// ============================================================

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.volume = 0.35;
    this._initialized = false;
  }

  // Browsers require a user gesture before AudioContext can start.
  // Call this from the first keydown.
  ensureInit() {
    if (this._initialized) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this._initialized = true;
    } catch (err) {
      console.warn("Audio init failed:", err);
      this.enabled = false;
    }
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this._stopBgm();
    } else if (this._currentBgmMap) {
      this.playMapMusic(this._currentBgmMap);
    }
    return this.enabled;
  }

  // ---------- Core synth helpers ----------

  _tone({ freq = 440, type = "sine", duration = 0.1, attack = 0.005,
          decay = 0.05, sustain = 0.3, release = 0.05, volume = 0.5,
          freqEnd = null, detune = 0 }) {
    if (!this.enabled || !this._initialized) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, freqEnd), now + duration
      );
    }

    // ADSR envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
    gain.gain.linearRampToValueAtTime(0, now + duration + release);

    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + release + 0.02);
  }

  _noise({ duration = 0.1, volume = 0.3, filterFreq = 2000, filterQ = 1 }) {
    if (!this.enabled || !this._initialized) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    src.connect(filter).connect(gain).connect(this.masterGain);
    src.start(now);
    src.stop(now + duration);
  }

  // ---------- Game-specific sounds ----------

  hit(variant = 0) {
    const jitter = (Math.random() * 24 - 12) + variant * 4;
    this._tone({ freq: 380, freqEnd: 180, type: "square",
      duration: 0.06, attack: 0.001, sustain: 0.6, volume: 0.35, detune: jitter });
    this._noise({ duration: 0.05, volume: 0.15, filterFreq: 1800 });
  }

  crit(variant = 0) {
    const jitter = (Math.random() * 18 - 9) + variant * 6;
    this._tone({ freq: 600, freqEnd: 220, type: "sawtooth",
      duration: 0.09, attack: 0.001, sustain: 0.7, volume: 0.4, detune: jitter });
    this._tone({ freq: 1200, freqEnd: 400, type: "square",
      duration: 0.08, attack: 0.001, sustain: 0.5, volume: 0.25, detune: -jitter });
    this._noise({ duration: 0.08, volume: 0.18, filterFreq: 2500 });
  }

  swing() {
    this._noise({ duration: 0.07, volume: 0.1, filterFreq: 800, filterQ: 2 });
  }

  jump() {
    this._tone({ freq: 280, freqEnd: 520, type: "square",
      duration: 0.12, attack: 0.001, sustain: 0.5, volume: 0.25 });
  }

  hurt() {
    this._tone({ freq: 220, freqEnd: 90, type: "sawtooth",
      duration: 0.2, sustain: 0.6, volume: 0.4 });
    this._noise({ duration: 0.1, volume: 0.2, filterFreq: 600 });
  }

  death() {
    this._tone({ freq: 400, freqEnd: 60, type: "sawtooth",
      duration: 0.5, sustain: 0.5, volume: 0.45 });
  }

  enemyDie(variant = 0) {
    this._tone({ freq: 350, freqEnd: 80, type: "triangle",
      duration: 0.18, sustain: 0.5, volume: 0.3, detune: variant * 5 });
    this._noise({ duration: 0.1, volume: 0.15, filterFreq: 900 });
  }

  coin() {
    this._tone({ freq: 880, type: "square", duration: 0.05,
      sustain: 0.8, volume: 0.2 });
    this._tone({ freq: 1320, type: "square", duration: 0.08,
      attack: 0.03, sustain: 0.7, volume: 0.18 });
  }

  itemPickup(rarity = "COMMON") {
    const freqs = {
      COMMON: [440, 660],
      UNCOMMON: [440, 660, 880],
      RARE: [523, 659, 784, 1046],
      EPIC: [523, 659, 784, 1046, 1318],
      LEGENDARY: [523, 659, 784, 1046, 1318, 1568],
    }[rarity] || [440, 660];
    freqs.forEach((f, i) => {
      setTimeout(() => this._tone({
        freq: f, type: "triangle", duration: 0.08,
        sustain: 0.6, volume: 0.22,
      }), i * 60);
    });
  }

  levelUp() {
    const notes = [523, 659, 784, 1046]; // C E G C
    notes.forEach((f, i) => {
      setTimeout(() => this._tone({
        freq: f, type: "triangle", duration: 0.16,
        sustain: 0.7, volume: 0.3,
      }), i * 90);
    });
  }

  skillCast(flavor = "projectile", variant = 0) {
    if (flavor === "projectile") {
      this._tone({ freq: 600, freqEnd: 900, type: "sine",
        duration: 0.1, sustain: 0.5, volume: 0.28, detune: variant * 3 });
    } else if (flavor === "dash") {
      this._noise({ duration: 0.12, volume: 0.2, filterFreq: 1500, filterQ: 3 });
      this._tone({ freq: 180, freqEnd: 500, type: "sawtooth",
        duration: 0.1, sustain: 0.4, volume: 0.22, detune: variant * 4 });
    } else if (flavor === "slam") {
      this._tone({ freq: 90, freqEnd: 40, type: "sawtooth",
        duration: 0.3, sustain: 0.6, volume: 0.5, detune: variant * 2 });
      this._noise({ duration: 0.25, volume: 0.3, filterFreq: 400 });
    }
  }

  potion() {
    this._tone({ freq: 700, freqEnd: 1100, type: "sine",
      duration: 0.18, sustain: 0.6, volume: 0.25 });
  }

  portal() {
    this._tone({ freq: 300, freqEnd: 1000, type: "sine",
      duration: 0.4, sustain: 0.4, volume: 0.3 });
    this._tone({ freq: 450, freqEnd: 1500, type: "triangle",
      duration: 0.35, sustain: 0.4, volume: 0.2 });
  }

  save() {
    this._tone({ freq: 660, type: "sine", duration: 0.08, sustain: 0.6, volume: 0.22 });
    setTimeout(() => this._tone({ freq: 990, type: "sine",
      duration: 0.1, sustain: 0.6, volume: 0.22 }), 70);
  }

  uiClick() {
    this._tone({ freq: 440, type: "square", duration: 0.04,
      sustain: 0.5, volume: 0.15 });
  }

  bossRoar() {
    this._tone({ freq: 120, freqEnd: 60, type: "sawtooth",
      duration: 0.8, sustain: 0.6, volume: 0.5 });
    this._noise({ duration: 0.7, volume: 0.25, filterFreq: 300, filterQ: 2 });
  }

  bossCharge() {
    this._tone({ freq: 200, freqEnd: 400, type: "sawtooth",
      duration: 0.6, attack: 0.4, sustain: 0.8, volume: 0.35 });
  }

  // ---------- Background Music (procedural ambient layers) ----------
  // Each map plays a slow pattern of notes from a scale with a drone.
  // No audio files — all synthesized. Volumes are deliberately low so
  // SFX remain clear.

  _startBgm(config) {
    if (!this.enabled || !this._initialized) return;
    this._stopBgm();
    const ctx = this.ctx;

    // Dedicated gain so we can fade and mute cleanly
    this._bgmGain = ctx.createGain();
    this._bgmGain.gain.value = 0;
    this._bgmGain.connect(this.masterGain);
    this._bgmGain.gain.linearRampToValueAtTime(
      config.volume, ctx.currentTime + 1.2
    );

    // Persistent drone oscillator (layer 1)
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = config.droneFreq;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.25;
    drone.connect(droneGain).connect(this._bgmGain);
    drone.start();

    // Second drone a fifth up (layer 2), filtered darker
    const drone2 = ctx.createOscillator();
    drone2.type = "triangle";
    drone2.frequency.value = config.droneFreq * 1.5;
    const drone2Gain = ctx.createGain();
    drone2Gain.gain.value = 0.12;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    drone2.connect(drone2Gain).connect(filter).connect(this._bgmGain);
    drone2.start();

    this._bgmDrones = [drone, drone2];

    // Melody loop: pluck a note every `noteEvery` seconds from `scale`
    this._bgmConfig = config;
    this._bgmNoteIdx = 0;
    this._bgmTimer = setInterval(() => {
      this._playBgmNote();
    }, config.noteEvery * 1000);
  }

  _playBgmNote() {
    if (!this.enabled || !this._initialized || !this._bgmGain) return;
    const cfg = this._bgmConfig;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Pick the next note (wander through the scale with some randomness)
    this._bgmNoteIdx = (this._bgmNoteIdx + 1 + Math.floor(Math.random() * 3)) % cfg.scale.length;
    const freq = cfg.scale[this._bgmNoteIdx];

    const osc = ctx.createOscillator();
    osc.type = cfg.melodyType || "triangle";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.22, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    osc.connect(g).connect(this._bgmGain);
    osc.start(now);
    osc.stop(now + 2);
  }

  _stopBgm() {
    if (this._bgmTimer) { clearInterval(this._bgmTimer); this._bgmTimer = null; }
    if (this._bgmGain) {
      const ctx = this.ctx;
      try {
        this._bgmGain.gain.cancelScheduledValues(ctx.currentTime);
        this._bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      } catch (_) {}
    }
    if (this._bgmDrones) {
      // Let the fade finish, then disconnect
      const drones = this._bgmDrones;
      setTimeout(() => {
        for (const d of drones) { try { d.stop(); d.disconnect(); } catch (_) {} }
      }, 500);
      this._bgmDrones = null;
    }
    this._bgmGain = null;
  }

  // Public: play a mood preset by map id
  playMapMusic(mapId) {
    // Minor pentatonic-ish scales pitched per mood
    const presets = {
      meadow: {
        droneFreq: 110,            // A2
        scale: [220, 262, 294, 330, 392, 440, 523, 587], // A minor-ish ascending
        melodyType: "triangle",
        noteEvery: 2.2,
        volume: 0.18,
      },
      forest: {
        droneFreq: 98,             // G2 — deeper, darker
        scale: [196, 233, 262, 294, 349, 392, 466, 523],
        melodyType: "sine",
        noteEvery: 2.8,
        volume: 0.16,
      },
      ruins: {
        droneFreq: 73,             // D2 — ominous
        scale: [146, 174, 196, 220, 261, 293, 349, 415],
        melodyType: "sawtooth",
        noteEvery: 1.8,
        volume: 0.14,
      },
    };
    const cfg = presets[mapId] || presets.meadow;
    this._startBgm(cfg);
    this._currentBgmMap = mapId;
  }

  stopMusic() { this._stopBgm(); this._currentBgmMap = null; }
  currentBgmMap() { return this._currentBgmMap || null; }
}

// Single shared instance
export const audio = new AudioEngine();
