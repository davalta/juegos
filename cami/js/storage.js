/* Save — progreso (estrellas por juego) + preferencia de mute en localStorage.
   Envuelto en try/catch porque file:// o modos privados pueden lanzar. */
var Save = {
  KEY: 'cami:v1',
  _d: { stars: {}, muted: false },

  load: function () {
    try {
      var raw = localStorage.getItem(this.KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this._d.stars = parsed.stars || {};
          this._d.muted = !!parsed.muted;
        }
      }
    } catch (e) { /* memoria nada más */ }
    return this._d;
  },

  _persist: function () {
    try { localStorage.setItem(this.KEY, JSON.stringify(this._d)); }
    catch (e) { /* ignorar */ }
  },

  getStars: function (id) { return this._d.stars[id] || 0; },

  addStar: function (id) {
    this._d.stars[id] = (this._d.stars[id] || 0) + 1;
    this._persist();
    return this._d.stars[id];
  },

  get muted() { return this._d.muted; },
  set muted(v) {
    this._d.muted = !!v;
    this._persist();
    if (typeof Sound !== 'undefined') Sound.setMuted(this._d.muted);
    if (typeof Voz !== 'undefined') Voz.setMuted(this._d.muted);
  }
};
