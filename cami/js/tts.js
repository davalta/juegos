/* Voz — narración en español.
   1º: audio PREGRABADO (audio/voz/*.mp3, voz neuronal Dalia es-MX, manifiesto
       en js/voces.js generado por tools/gen_voces.py) — calidad humana.
   2º: speechSynthesis del navegador, solo como respaldo si la frase no existe. */
var Voz = {
  voice: null,
  muted: false,
  ready: false,
  _audio: null,        // reproductor único para las frases pregrabadas
  _audioUnlocked: false,

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
        var prev = this.voice && this.voice.name;
        this.voice = this._pick(voices);
        this.ready = true;
        if (this.voice && this.voice.name !== prev) {
          try { console.log('[Voz] usando: ' + this.voice.name + ' (' + this.voice.lang + ')'); } catch (e) {}
        }
      }
    } catch (e) { /* nada */ }
  },

  _pick: function (voices) {
    // Las voces "Google" (online de Chrome) y las "Natural/Online" suenan MUCHO
    // más humanas que las Microsoft locales (Sabina/Raul = robóticas tipo Loquendo).
    function esVoices(filter) {
      var out = [];
      for (var i = 0; i < voices.length; i++) {
        var v = voices[i];
        var lang = (v.lang || '').toLowerCase().replace('_', '-');
        var name = (v.name || '').toLowerCase();
        if (lang.indexOf('es') === 0 && filter(name, lang)) out.push(v);
      }
      return out;
    }
    function byLocale(list) {
      var prefs = ['es-us', 'es-419', 'es-mx', 'es-co', 'es-ar', 'es-es', 'es'];
      for (var p = 0; p < prefs.length; p++) {
        for (var i = 0; i < list.length; i++) {
          if ((list[i].lang || '').toLowerCase().replace('_', '-').indexOf(prefs[p]) === 0) return list[i];
        }
      }
      return list[0] || null;
    }
    // 1) Google español (Chrome online, calidad alta)
    var g = esVoices(function (n) { return n.indexOf('google') !== -1; });
    if (g.length) return byLocale(g);
    // 2) Voces "Natural"/"Online" (Edge neural)
    var nat = esVoices(function (n) { return n.indexOf('natural') !== -1 || n.indexOf('online') !== -1; });
    if (nat.length) return byLocale(nat);
    // 3) Mejores voces locales conocidas (iOS/macOS/Android)
    var names = ['paulina', 'mónica', 'monica', 'luciana', 'angélica', 'angelica', 'juan', 'dalia'];
    for (var n = 0; n < names.length; n++) {
      var hit = esVoices(function (nm) { return nm.indexOf(names[n]) !== -1; });
      if (hit.length) return byLocale(hit);
    }
    // 4) lo que haya en español
    var any = esVoices(function () { return true; });
    return byLocale(any);
  },

  setMuted: function (m) {
    this.muted = !!m;
    if (this.muted) this.cancel();
  },

  // misma normalización que tools/gen_voces.py: así un "¡El círculo!" y un
  // "el círculo" comparten el mismo archivo de audio
  _norm: function (t) {
    return String(t).toLowerCase()
      .replace(/[¡!¿?.,:;]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  _playFile: function (src, opts) {
    opts = opts || {};
    if (!this._audio) this._audio = new Audio();
    var a = this._audio;
    var self = this;
    if (opts.interrupt === false && !a.paused && !a.ended && a.src) {
      // sin interrumpir: encola para cuando termine la frase actual
      a.onended = function () { a.onended = null; self._playFile(src, { interrupt: true }); };
      return;
    }
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    a.onended = null;
    a.src = src;
    a.volume = 1;
    var p = a.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado: silencio */ });
  },

  speak: function (text, opts) {
    if (this.muted || !text) return;
    if (document.hidden) return; // no hablar si la pestaña no está visible
    opts = opts || {};
    // 1º intenta la frase pregrabada (voz humana)
    var key = this._norm(text);
    if (window.VOCES && window.VOCES[key]) {
      this._playFile(window.VOCES[key], opts);
      return;
    }
    // 2º respaldo: sintetizador del navegador
    if (!('speechSynthesis' in window)) return;
    try {
      if (opts.interrupt !== false) window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      if (this.voice) { u.voice = this.voice; u.lang = this.voice.lang; }
      else { u.lang = 'es-MX'; }
      // entonación alegre: más aguda y ágil, con variación leve para no sonar plana
      u.rate = opts.rate != null ? opts.rate : (1.0 + Math.random() * 0.06);
      u.pitch = opts.pitch != null ? opts.pitch : (1.3 + Math.random() * 0.1);
      u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch (e) { /* nada */ }
  },

  cancel: function () {
    if (this._audio) {
      this._audio.onended = null;
      try { this._audio.pause(); } catch (e) {}
    }
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  },

  prime: function () {
    // desbloquea el audio HTML y el TTS dentro del primer gesto (iOS/Chrome)
    if (!this._audioUnlocked && window.VOCES) {
      try {
        if (!this._audio) this._audio = new Audio();
        var a = this._audio;
        var self = this;
        for (var k in window.VOCES) { a.src = window.VOCES[k]; break; }
        a.volume = 0;
        var p = a.play();
        var ok = function () { a.pause(); a.volume = 1; self._audioUnlocked = true; };
        if (p && p.then) p.then(ok).catch(function () {}); else ok();
      } catch (e) {}
    }
    if (!('speechSynthesis' in window) || this.muted) return;
    try {
      var u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  },

  pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; }
};
