/* Sound — efectos de sonido sintetizados con Web Audio API.
   Sin archivos de audio: todo se genera con osciladores y ruido.
   Se desbloquea en el primer gesto del usuario (main.js llama unlock()). */
var Sound = {
  ctx: null,
  master: null,
  muted: false,

  unlock: function () {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { this.ctx = null; }
  },

  setMuted: function (m) {
    this.muted = !!m;
    if (this.master) this.master.gain.value = this.muted ? 0 : 1;
  },

  ready: function () { return this.ctx && this.master; },

  _tone: function (freq, opts) {
    if (!this.ready()) return;
    opts = opts || {};
    var t0 = this.ctx.currentTime + (opts.delay || 0);
    var dur = opts.dur || 0.3;
    var osc = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + dur);
    var peak = opts.gain != null ? opts.gain : 0.4;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    var node = osc;
    if (opts.filter) {
      var f = this.ctx.createBiquadFilter();
      f.type = opts.filter; f.frequency.value = opts.filterFreq || 800;
      osc.connect(f); f.connect(g); node = f;
    } else { osc.connect(g); }
    g.connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  },

  _noise: function (dur, opts) {
    if (!this.ready()) return;
    opts = opts || {};
    var t0 = this.ctx.currentTime + (opts.delay || 0);
    var n = Math.floor(this.ctx.sampleRate * dur);
    var buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource(); src.buffer = buf;
    var g = this.ctx.createGain();
    var peak = opts.gain != null ? opts.gain : 0.2;
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    var node = src;
    if (opts.filterType) {
      var f = this.ctx.createBiquadFilter();
      f.type = opts.filterType; f.frequency.value = opts.freq || 1000;
      if (opts.freqTo) f.frequency.exponentialRampToValueAtTime(opts.freqTo, t0 + dur);
      src.connect(f); f.connect(g);
    } else { src.connect(g); }
    g.connect(this.master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  },

  play: function (name) {
    if (!this.ready() || this.muted) return;
    switch (name) {
      case 'pop': {
        var base = 480 + Math.random() * 120;
        this._tone(base, { type: 'triangle', dur: 0.12, gain: 0.5, slideTo: 180 });
        this._noise(0.02, { filterType: 'highpass', freq: 2200, gain: 0.18 });
        break;
      }
      case 'click':
        this._tone(1000, { type: 'sine', dur: 0.05, gain: 0.18 });
        break;
      case 'ding':
        this._tone(880, { type: 'sine', dur: 0.4, gain: 0.4 });
        this._tone(1318, { type: 'sine', dur: 0.4, gain: 0.3, delay: 0.06 });
        break;
      case 'tada':
        this._tone(523, { type: 'triangle', dur: 0.12, gain: 0.4 });
        this._tone(784, { type: 'triangle', dur: 0.3, gain: 0.4, delay: 0.1 });
        this._tone(1046, { type: 'sine', dur: 0.35, gain: 0.3, delay: 0.18 });
        break;
      case 'star':
        this._tone(520, { type: 'sine', dur: 0.2, gain: 0.3, slideTo: 1400 });
        this._tone(1318, { type: 'sine', dur: 0.35, gain: 0.3, delay: 0.18 });
        break;
      case 'sparkle':
        this._tone(1568, { type: 'sine', dur: 0.18, gain: 0.18 });
        this._tone(2093, { type: 'sine', dur: 0.18, gain: 0.14, delay: 0.07 });
        this._tone(2637, { type: 'sine', dur: 0.2, gain: 0.12, delay: 0.14 });
        break;
      case 'fanfare': {
        var notes = [523, 659, 784, 1046];
        for (var k = 0; k < notes.length; k++)
          this._tone(notes[k], { type: 'triangle', dur: 0.35, gain: 0.4, delay: k * 0.12 });
        this._noise(0.5, { filterType: 'bandpass', freq: 6000, gain: 0.08, delay: 0.5 });
        break;
      }
      case 'boing':
        this._tone(280, { type: 'sine', dur: 0.1, gain: 0.3, slideTo: 140, filter: 'lowpass', filterFreq: 900 });
        this._tone(180, { type: 'sine', dur: 0.15, gain: 0.3, slideTo: 240, delay: 0.1, filter: 'lowpass', filterFreq: 900 });
        break;
      case 'chomp':
        this._noise(0.09, { filterType: 'bandpass', freq: 700, freqTo: 250, gain: 0.45 });
        break;
      case 'whoosh':
        this._noise(0.25, { filterType: 'bandpass', freq: 400, freqTo: 2600, gain: 0.18 });
        break;
      default: break;
    }
  }
};
