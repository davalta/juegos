/* Figuras — arrastrar cada figura (gema brillante) a su silueta. Formas + motricidad fina. */
GAMES['figuras'] = {
  id: 'figuras',
  title: 'Figuras',
  intro: '¡Pon cada figura en su lugar!',
  color: '#ffb14e',
  icon: '🔷',
  rounds: 5,

  NAMES: { circle: 'el círculo', square: 'el cuadrado', triangle: 'el triángulo',
           star: 'la estrella', heart: 'el corazón', moon: 'la luna' },
  COLORS: { circle: '#5ec8ff', square: '#7ed957', triangle: '#ff8a5c',
            star: '#ffd23f', heart: '#ff4fa3', moon: '#c77dff' },
  ROUNDS: [
    ['circle', 'square', 'triangle'],
    ['circle', 'triangle', 'star'],
    ['square', 'star', 'heart'],
    ['triangle', 'heart', 'moon'],
    ['star', 'heart', 'moon']
  ],
  YS: [170, 420, 670],

  _path: function (shape) {
    switch (shape) {
      case 'circle': return '<circle cx="50" cy="50" r="44"/>';
      case 'square': return '<rect x="8" y="8" width="84" height="84" rx="12"/>';
      case 'triangle': return '<polygon points="50,8 93,90 7,90"/>';
      case 'star': return '<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/>';
      case 'heart': return '<path d="M50 86 C10 58 14 22 38 22 C48 22 50 32 50 36 C50 32 52 22 62 22 C86 22 90 58 50 86 Z"/>';
      case 'moon': return '<path d="M64 12 A40 40 0 1 0 64 88 A32 32 0 1 1 64 12 Z"/>';
    }
    return '';
  },

  _svg: function (shape, fill, silhouette) {
    var inner = this._path(shape);
    if (silhouette) {
      return '<svg viewBox="0 0 100 100" width="100%" height="100%">' +
        '<g fill="rgba(0,0,0,.18)" stroke="rgba(255,255,255,.9)" stroke-width="3" stroke-dasharray="7 7">' +
        inner + '</g></svg>';
    }
    return '<svg viewBox="0 0 100 100" width="100%" height="100%">' +
      '<g fill="' + fill + '" stroke="rgba(255,255,255,.85)" stroke-width="3">' + inner + '</g>' +
      '<circle cx="34" cy="32" r="8" fill="#fff" opacity=".55"/></svg>';
  },

  init: function (scene, api) {
    this.api = api; this.scene = scene;
    var wrap = document.createElement('div');
    wrap.className = 'g-figuras';
    wrap.innerHTML = '<div class="fig-board"></div><div class="fig-tray"></div>';
    scene.appendChild(wrap);
    this.board = wrap.querySelector('.fig-board');
    this.tray = wrap.querySelector('.fig-tray');
  },

  nextRound: function (i) {
    this.board.innerHTML = '';
    this.tray.innerHTML = '';
    this.placed = 0;
    this.pieces = [];
    var shapes = this.ROUNDS[i % this.ROUNDS.length];
    this.total = shapes.length;
    var self = this;

    // pista: manita de la primera pieza libre a su silueta
    this.api.idleHint(8000, function () {
      for (var p = 0; p < self.pieces.length; p++) {
        var pc = self.pieces[p];
        if (pc.placed) continue;
        for (var z = 0; z < self.slots.length; z++) {
          if (!self.slots[z].filled && self.slots[z].shape === pc.shape) {
            self.api.hand(pc.el, self.slots[z].el);
            Voz.speak('Pon ' + self.NAMES[pc.shape] + ' en su lugar');
            return;
          }
        }
      }
    });

    // slots (orden fijo) y piezas (orden mezclado)
    this.slots = [];
    for (var s = 0; s < shapes.length; s++) {
      var slot = document.createElement('div');
      slot.className = 'fig-slot';
      slot.style.top = this.YS[s] + 'px';
      slot.innerHTML = this._svg(shapes[s], null, true);
      slot.dataset.shape = shapes[s];
      this.board.appendChild(slot);
      this.slots.push({ el: slot, shape: shapes[s], filled: false });
    }

    var order = shapes.slice();
    for (var k = order.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)); var tmp = order[k]; order[k] = order[r]; order[r] = tmp; }

    for (var p = 0; p < order.length; p++) {
      (function (shape, y) {
        var piece = document.createElement('div');
        piece.className = 'fig-piece';
        piece.style.top = y + 'px';
        piece.innerHTML = self._svg(shape, self.COLORS[shape], false);
        self.tray.appendChild(piece);
        var rec = { el: piece, shape: shape, placed: false };
        self.pieces.push(rec);
        self.api.drag(piece, {
          data: { shape: shape },
          inflate: 50,
          onPickup: function () { Voz.speak(self.NAMES[shape]); },
          getTargets: function () {
            var out = [];
            for (var z = 0; z < self.slots.length; z++) if (!self.slots[z].filled)
              out.push({ el: self.slots[z].el, data: { shape: self.slots[z].shape } });
            return out;
          },
          accepts: function (d, t) { return d.shape === t.shape; },
          onCorrect: function (el, target) {
            for (var z = 0; z < self.slots.length; z++) if (self.slots[z].el === target.el) self.slots[z].filled = true;
            rec.placed = true;
            target.el.classList.add('lit');
            el.style.pointerEvents = 'none';
            var c = Stage.centerOf(el);
            self.api.correct(c.x, c.y, { say: '¡' + self._cap(self.NAMES[shape]) + '!' });
            self.placed++;
            if (self.placed >= self.total) {
              self.board.classList.add('done');
              self.api.after(700, function () { self.api.roundComplete(); });
            }
          },
          onWrong: function (el, target) { self.api.wrong(target.el, { say: '¡Casi! ¿Dónde va?' }); }
        });
      })(order[p], this.YS[p]);
    }
  },

  _cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },
  destroy: function () {}
};
