/* Voz — narración en español con speechSynthesis.
   Frases cortas, voz es-MX preferida, cancel antes de cada speak. */
var Voz = {
  voice: null,
  muted: false,
  ready: false,

  PRAISE: ['¡Muy bien!', '¡Bravo!', '¡Excelente!', '¡Eso es!', '¡Súper, Cami!', '¡Lo lograste!', '¡Qué linda!'],
  ALMOST: ['¡Casi!', 'Inténtalo otra vez', '¡Tú puedes, Cami!', 'Mmm, otra vez'],

  init: function () {
    if (!('speechSynthesis' in window)) return;
    var self = this;
    this._load();
    // las voces pueden cargar tarde
    window.speechSynthesis.onvoiceschanged = function () { self._load(); };
  },

  _load: function () {
    try {
      var voices = window.speechSynthesis.getVoices();
      if (voices && voices.length) {
        this.voice = this._pick(voices);
        this.ready = true;
      }
    } catch (e) { /* nada */ }
  },

  _pick: function (voices) {
    var prefs = ['es-mx', 'es-us', 'es-419', 'es-co', 'es-ar', 'es-es', 'es'];
    var names = ['sabina', 'paulina', 'dalia', 'mónica', 'monica', 'jorge', 'google español'];
    // primero por nombre conocido + idioma español
    for (var n = 0; n < names.length; n++) {
      for (var i = 0; i < voices.length; i++) {
        var v = voices[i];
        if ((v.lang || '').toLowerCase().indexOf('es') === 0 &&
            (v.name || '').toLowerCase().indexOf(names[n]) !== -1) return v;
      }
    }
    // luego por prioridad de locale
    for (var p = 0; p < prefs.length; p++) {
      for (var j = 0; j < voices.length; j++) {
        if ((voices[j].lang || '').toLowerCase().indexOf(prefs[p]) === 0) return voices[j];
      }
    }
    return null;
  },

  setMuted: function (m) {
    this.muted = !!m;
    if (this.muted) this.cancel();
  },

  speak: function (text, opts) {
    if (!('speechSynthesis' in window) || this.muted || !text) return;
    if (document.hidden) return; // no hablar si la pestaña no está visible
    opts = opts || {};
    try {
      if (opts.interrupt !== false) window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      if (this.voice) { u.voice = this.voice; u.lang = this.voice.lang; }
      else { u.lang = 'es-MX'; }
      u.rate = opts.rate != null ? opts.rate : 0.92;
      u.pitch = opts.pitch != null ? opts.pitch : 1.15;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch (e) { /* nada */ }
  },

  cancel: function () {
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  },

  prime: function () {
    // desbloquea TTS dentro del primer gesto (iOS/Chrome)
    if (!('speechSynthesis' in window) || this.muted) return;
    try {
      var u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  },

  pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; }
};
