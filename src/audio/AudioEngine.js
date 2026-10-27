// Original music and sound effects synthesised live with Web Audio (no audio files).
const CHORDS = [
  [48, 55, 59, 64], // Cmaj7
  [45, 52, 55, 60], // Am7
  [41, 48, 52, 57], // Fmaj7
  [43, 50, 53, 59], // G7sus
];
const MELODY_SCALE = [72, 74, 76, 79, 81, 84, 86, 88];
const CHORD_SECONDS = 4.8;
const MASTER_VOLUME = 0.55;

const midiToFrequency = note => 440 * 2 ** ((note - 69) / 12);

export class AudioEngine {
  constructor() {
    this.context = null;
    this.isEnabled = false;
    this.chordIndex = 0;
    this.nextChordTime = 0;
    this.nextNoteTime = 0;
    this.night = 0;
    this.scheduler = null;
    this.playbackRevision = 0;
    this.playbackUpdate = Promise.resolve(false);
    this.document = globalThis.document;
    this.document?.addEventListener('visibilitychange', () => {
      if (this.document.hidden) this.#silence();
      // Visibility never changes the user's explicit sound preference.
      if (this.context) void this.#updatePlayback();
    });
  }

  async enable() {
    this.isEnabled = true;
    try {
      if (!this.context || this.context.state === 'closed') this.#createGraph();
    } catch {
      this.isEnabled = false;
      this.#silence();
      const failedContext = this.context;
      this.context = null;
      this.master = null;
      try { await failedContext?.close(); } catch { /* A failed graph is already silent. */ }
      return false;
    }
    return this.#updatePlayback();
  }

  disable() {
    this.isEnabled = false;
    this.#silence();
    void this.#updatePlayback();
  }

  #silence() {
    if (this.scheduler !== null) clearInterval(this.scheduler);
    this.scheduler = null;
    if (this.master && this.context && this.context.state !== 'closed') {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setValueAtTime(0, this.context.currentTime);
    }
  }

  #updatePlayback() {
    const revision = ++this.playbackRevision;
    // Serialise suspend/resume so a slow browser operation cannot undo a later toggle.
    this.playbackUpdate = this.playbackUpdate.then(async () => {
      if (revision !== this.playbackRevision) return false;
      const context = this.context;
      if (!context) return false;
      if (!this.isEnabled || this.document?.hidden) {
        this.#silence();
        try { await context.suspend(); } catch { /* Muting also works if suspension is unavailable. */ }
        return this.isEnabled;
      }
      try {
        await context.resume();
        if (revision !== this.playbackRevision) return false;
        if (context.state !== 'running') throw new Error('Audio is unavailable');
        this.master.gain.setTargetAtTime(MASTER_VOLUME, context.currentTime, 0.4);
        if (this.scheduler === null) {
          this.nextChordTime = context.currentTime + 0.1;
          this.nextNoteTime = context.currentTime + 1.2;
          this.scheduler = setInterval(() => this.#schedule(), 200);
        }
        return true;
      } catch {
        if (revision === this.playbackRevision) {
          this.isEnabled = false;
          this.#silence();
        }
        return false;
      }
    });
    return this.playbackUpdate;
  }

  setNight(nightFactor) {
    this.night = nightFactor;
    if (this.musicFilter) this.musicFilter.frequency.setTargetAtTime(1600 - nightFactor * 900, this.context.currentTime, 1);
  }

  play(effect) {
    if (!this.isEnabled || this.document?.hidden || this.context?.state !== 'running') return;
    const handler = EFFECTS[effect];
    if (handler) handler(this, this.context.currentTime);
  }

  #createGraph() {
    const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    this.context = new Context();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    const compressor = this.context.createDynamicsCompressor();
    this.master.connect(compressor).connect(this.context.destination);

    this.musicBus = this.context.createGain();
    this.musicBus.gain.value = 0.32;
    this.musicFilter = this.context.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 1600;
    this.delay = this.context.createDelay(1);
    this.delay.delayTime.value = 0.36;
    const feedback = this.context.createGain();
    feedback.gain.value = 0.32;
    this.delay.connect(feedback).connect(this.delay);
    this.musicBus.connect(this.musicFilter).connect(this.master);
    this.musicFilter.connect(this.delay).connect(this.master);

    this.effectsBus = this.context.createGain();
    this.effectsBus.gain.value = 0.7;
    this.effectsBus.connect(this.master);
    this.noiseBuffer = this.#createNoise();
  }

  #createNoise() {
    const buffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
    return buffer;
  }

  #schedule() {
    if (!this.isEnabled || this.document?.hidden || this.context?.state !== 'running') return;
    const horizon = this.context.currentTime + 0.6;
    while (this.nextChordTime < horizon) {
      this.#pad(CHORDS[this.chordIndex], this.nextChordTime);
      this.chordIndex = (this.chordIndex + 1) % CHORDS.length;
      this.nextChordTime += CHORD_SECONDS;
    }
    while (this.nextNoteTime < horizon) {
      if (Math.random() < 0.62) {
        const note = MELODY_SCALE[Math.floor(Math.random() * MELODY_SCALE.length)] - (this.night > 0.5 ? 12 : 0);
        this.tone({ frequency: midiToFrequency(note), start: this.nextNoteTime, duration: 1.4, volume: 0.07, type: 'triangle', bus: this.musicBus });
      }
      this.nextNoteTime += [0.4, 0.6, 0.8, 1.2][Math.floor(Math.random() * 4)];
    }
  }

  #pad(notes, start) {
    notes.forEach((note, index) => {
      [-6, 6].forEach(detune => {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = index === 0 ? 'sine' : 'sawtooth';
        oscillator.frequency.value = midiToFrequency(note);
        oscillator.detune.value = detune;
        const level = index === 0 ? 0.05 : 0.012;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(level, start + 1.4);
        gain.gain.setValueAtTime(level, start + CHORD_SECONDS - 0.6);
        gain.gain.linearRampToValueAtTime(0, start + CHORD_SECONDS + 0.8);
        oscillator.connect(gain).connect(this.musicBus);
        oscillator.start(start);
        oscillator.stop(start + CHORD_SECONDS + 1);
      });
    });
  }

  tone({ frequency, start, duration, volume, type = 'sine', bus = this.effectsBus, slideTo }) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(bus);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  noise({ start, duration, volume, frequency = 800, q = 1, type = 'bandpass' }) {
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(this.effectsBus);
    source.start(start, Math.random() * 0.5);
    source.stop(start + duration + 0.05);
  }
}

const EFFECTS = {
  step: (audio, now) => audio.noise({ start: now, duration: 0.07, volume: 0.08, frequency: 500 + Math.random() * 400, q: 2 }),
  splash: (audio, now) => audio.noise({ start: now, duration: 0.25, volume: 0.12, frequency: 1400, q: 0.8 }),
  jump: (audio, now) => audio.tone({ frequency: 280, slideTo: 620, start: now, duration: 0.18, volume: 0.09, type: 'square' }),
  doubleJump: (audio, now) => audio.tone({ frequency: 420, slideTo: 980, start: now, duration: 0.2, volume: 0.08, type: 'square' }),
  land: (audio, now) => audio.noise({ start: now, duration: 0.16, volume: 0.18, frequency: 220, q: 1.4, type: 'lowpass' }),
  collect: (audio, now) => [76, 79, 84, 88].forEach((note, index) => audio.tone({ frequency: midiToFrequency(note), start: now + index * 0.07, duration: 0.5, volume: 0.1, type: 'triangle' })),
  beacon: (audio, now) => {
    [60, 64, 67, 72, 76].forEach((note, index) => audio.tone({ frequency: midiToFrequency(note), start: now + index * 0.09, duration: 2.4, volume: 0.07, type: 'triangle' }));
    audio.noise({ start: now, duration: 1.6, volume: 0.06, frequency: 3000, q: 0.5, type: 'highpass' });
  },
  open: (audio, now) => audio.tone({ frequency: 520, slideTo: 780, start: now, duration: 0.16, volume: 0.06 }),
  close: (audio, now) => audio.tone({ frequency: 700, slideTo: 420, start: now, duration: 0.14, volume: 0.05 }),
  whoosh: (audio, now) => audio.noise({ start: now, duration: 1.4, volume: 0.1, frequency: 600, q: 0.6 }),
  speak: (audio, now) => [0, 1, 2].forEach(index => audio.tone({ frequency: 900 + Math.random() * 500, start: now + index * 0.06, duration: 0.05, volume: 0.03, type: 'square' })),
  firework: (audio, now) => {
    audio.noise({ start: now, duration: 0.6, volume: 0.16, frequency: 300, q: 0.7, type: 'lowpass' });
    audio.noise({ start: now + 0.05, duration: 0.9, volume: 0.05, frequency: 5000, q: 0.4, type: 'highpass' });
  },
};
