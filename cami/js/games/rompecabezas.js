/* Rompecabezas — cada pieza es el mismo SVG con viewBox recortado (sin imágenes).
   Razonamiento espacial / relación parte-todo. */
GAMES['rompecabezas'] = {
  id: 'rompecabezas',
  title: 'Rompecabezas',
  intro: '¡Arma el dibujo!',
  color: '#ff8a5c',
  icon: '🧩',
  rounds: 5,

  W: 700, H: 520,
  // grid por ronda: [cols, rows]
  GRIDS: [[2, 1], [3, 1], [3, 1], [2, 2], [2, 2]],
  NAMES: ['la casa', 'el carrito', 'el árbol', 'la flor', 'el barco'],

  sceneSvg: function (i) {
    var bg = '<rect x="0" y="0" width="700" height="520" fill="#bfefff"/>';
    var sun = '<circle cx="90" cy="90" r="52" fill="#ffe169"/>' +
              '<circle cx="78" cy="84" r="5" fill="#c99a1e"/><circle cx="102" cy="84" r="5" fill="#c99a1e"/>' +
              '<path d="M76 100 q14 12 28 0" fill="none" stroke="#c99a1e" stroke-width="4" stroke-linecap="round"/>';
    var grass = '<rect x="0" y="430" width="700" height="90" fill="#7ed957"/>';
    switch (i % 5) {
      case 0: // casa de ensueño
        return bg + sun + grass +
          '<rect x="250" y="250" width="220" height="180" rx="10" fill="#ffe7f4"/>' +
          '<path d="M230 250 L360 150 L490 250 Z" fill="#ff4fa3"/>' +
          '<circle cx="320" cy="220" r="7" fill="#fff"/><circle cx="360" cy="205" r="7" fill="#fff"/><circle cx="400" cy="220" r="7" fill="#fff"/>' +
          '<rect x="335" y="350" width="50" height="80" rx="8" fill="#ff7ec0"/>' +
          '<rect x="275" y="285" width="40" height="40" rx="6" fill="#aee9ff"/>' +
          '<rect x="405" y="285" width="40" height="40" rx="6" fill="#aee9ff"/>' +
          '<path d="M360 120 q-8 -10 -16 -2 q-6 6 16 22 q22 -16 16 -22 q-8 -8 -16 2z" fill="#ffd23f"/>';
      case 1: // carrito convertible rosa
        return bg + sun + grass +
          '<rect x="0" y="430" width="700" height="40" fill="#9aa0a6"/>' +
          '<rect x="180" y="300" width="340" height="80" rx="30" fill="#ff4fa3"/>' +
          '<path d="M250 300 q40 -60 120 -60 q60 0 90 60 Z" fill="#ff7ec0"/>' +
          '<rect x="285" y="258" width="70" height="44" rx="8" fill="#cdeeff"/>' +
          '<circle cx="260" cy="392" r="42" fill="#3a3a3a"/><circle cx="260" cy="392" r="18" fill="#bbb"/>' +
          '<circle cx="450" cy="392" r="42" fill="#3a3a3a"/><circle cx="450" cy="392" r="18" fill="#bbb"/>';
      case 2: // árbol y flor
        return bg + sun + grass +
          '<rect x="330" y="300" width="40" height="140" fill="#9b6b3a"/>' +
          '<circle cx="350" cy="270" r="90" fill="#5fbf4b"/>' +
          '<circle cx="290" cy="300" r="60" fill="#6cd44b"/>' +
          '<circle cx="410" cy="300" r="60" fill="#6cd44b"/>' +
          '<circle cx="350" cy="250" r="14" fill="#ff4fa3"/><circle cx="300" cy="280" r="12" fill="#ffd23f"/>' +
          '<g transform="translate(150 420)"><rect x="-6" y="-60" width="12" height="60" fill="#5fbf4b"/>' +
          '<circle cx="0" cy="-70" r="22" fill="#ff5fae"/><circle cx="0" cy="-70" r="9" fill="#ffd23f"/></g>';
      case 3: // jardín de flores y corazones
        return '<rect x="0" y="0" width="700" height="520" fill="#ffe0f1"/>' + sun +
          '<g transform="translate(350 300)">' +
          '<circle cx="0" cy="-70" r="40" fill="#ff8ac4"/><circle cx="66" cy="-22" r="40" fill="#ff8ac4"/>' +
          '<circle cx="40" cy="60" r="40" fill="#ff8ac4"/><circle cx="-40" cy="60" r="40" fill="#ff8ac4"/>' +
          '<circle cx="-66" cy="-22" r="40" fill="#ff8ac4"/><circle cx="0" cy="0" r="40" fill="#ffd23f"/></g>' +
          '<path d="M170 160 q-10 -14 -22 -3 q-9 9 22 31 q31 -22 22 -31 q-12 -11 -22 3z" fill="#ff4fa3"/>' +
          '<path d="M540 200 q-10 -14 -22 -3 q-9 9 22 31 q31 -22 22 -31 q-12 -11 -22 3z" fill="#ff4fa3"/>';
      default: // barco en el mar
        return bg + sun +
          '<rect x="0" y="360" width="700" height="160" fill="#4fb6e6"/>' +
          '<path d="M0 380 q40 -20 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="#aee3ff" stroke-width="6"/>' +
          '<path d="M250 360 L450 360 L420 420 L280 420 Z" fill="#ff4fa3"/>' +
          '<rect x="345" y="250" width="10" height="110" fill="#9b6b3a"/>' +
          '<path d="M355 255 L355 350 L440 345 Z" fill="#ffd23f"/>' +
          '<path d="M345 255 L345 345 L270 345 Z" fill="#ffffff"/>';
    }
  },

  init: function (scene, api) {
    this.api = api; this.root = scene;
    var wrap = document.createElement('div');
    wrap.className = 'g-rompe';
    wrap.innerHTML =
      '<div class="puz-board" id="puz-board">' +
        '<div class="puz-guide" id="puz-guide"></div>' +
        '<div class="puz-cells" id="puz-cells"></div>' +
        '<div class="puz-solved" id="puz-solved"></div>' +
      '</div>' +
      '<div class="puz-tray" id="puz-tray"></div>';
    scene.appendChild(wrap);
    this.board = wrap.querySelector('#puz-board');
    this.guide = wrap.querySelector('#puz-guide');
    this.cellsEl = wrap.querySelector('#puz-cells');
    this.solvedEl = wrap.querySelector('#puz-solved');
    this.tray = wrap.querySelector('#puz-tray');
  },

  nextRound: function (i) {
    var self = this;
    this.cellsEl.innerHTML = '';
    this.tray.innerHTML = '';
    this.solvedEl.innerHTML = '';
    this.solvedEl.classList.remove('show');
    this.placed = 0;

    var inner = this.sceneSvg(i);
    this.guide.innerHTML = '<svg viewBox="0 0 700 520" width="700" height="520">' + inner + '</svg>';
    this.solvedEl.innerHTML = '<svg viewBox="0 0 700 520" width="700" height="520">' + inner + '</svg>';
    this.pieceRecs = [];

    // pista: manita de la primera pieza suelta a su celda
    var self2 = this;
    this.api.idleHint(9000, function () {
      for (var p = 0; p < self2.pieceRecs.length; p++) {
        var pr = self2.pieceRecs[p];
        if (pr.placed) continue;
        for (var z = 0; z < self2.cells.length; z++) {
          if (self2.cells[z].idx === pr.idx && !self2.cells[z].filled) {
            self2.api.hand(pr.el, self2.cells[z].el);
            Voz.speak('¿Dónde va esta pieza?');
            return;
          }
        }
      }
    });

    var cols = this.GRIDS[i][0], rows = this.GRIDS[i][1];
    var cw = this.W / cols, ch = this.H / rows;
    var n = cols * rows;
    this.total = n;

    // celdas (targets)
    this.cells = [];
    for (var c = 0; c < n; c++) {
      var col = c % cols, row = Math.floor(c / cols);
      var cell = document.createElement('div');
      cell.className = 'puz-cell';
      cell.style.left = (col * cw) + 'px';
      cell.style.top = (row * ch) + 'px';
      cell.style.width = cw + 'px';
      cell.style.height = ch + 'px';
      this.cellsEl.appendChild(cell);
      this.cells.push({ el: cell, idx: c, filled: false });
    }

    // posiciones de dispersión en la zona izquierda
    var spots = this._spots(n);
    var order = [];
    for (var k = 0; k < n; k++) order.push(k);
    for (var s = order.length - 1; s > 0; s--) { var r = Math.floor(Math.random() * (s + 1)); var tmp = order[s]; order[s] = order[r]; order[r] = tmp; }

    for (var p = 0; p < n; p++) {
      (function (idx, spot) {
        var col = idx % cols, row = Math.floor(idx / cols);
        var vbx = col * cw, vby = row * ch;
        var piece = document.createElement('div');
        piece.className = 'puz-piece';
        piece.style.left = spot.x + 'px';
        piece.style.top = spot.y + 'px';
        piece.style.width = cw + 'px';
        piece.style.height = ch + 'px';
        piece.style.transform = 'rotate(' + spot.rot + 'deg)';
        piece.innerHTML = '<svg viewBox="' + vbx + ' ' + vby + ' ' + cw + ' ' + ch +
          '" width="' + cw + '" height="' + ch + '">' + inner + '</svg>';
        self.tray.appendChild(piece);
        var rec = { el: piece, idx: idx, placed: false };
        self.pieceRecs.push(rec);

        self.api.drag(piece, {
          data: { idx: idx },
          inflate: 45,
          getTargets: function () {
            var out = [];
            for (var z = 0; z < self.cells.length; z++) if (!self.cells[z].filled)
              out.push({ el: self.cells[z].el, data: { idx: self.cells[z].idx } });
            return out;
          },
          accepts: function (d, t) { return d.idx === t.idx; },
          onCorrect: function (el, target) {
            for (var z = 0; z < self.cells.length; z++) if (self.cells[z].el === target.el) self.cells[z].filled = true;
            rec.placed = true;
            el.style.pointerEvents = 'none';
            el.classList.add('set');
            Sound.play('pop');
            self.placed++;
            if (self.placed >= self.total) self._solve(i);
          },
          onWrong: function (el, target) { self.api.wrong(target.el); }
        });
      })(order[p], spots[p]);
    }
  },

  _spots: function (n) {
    var sets = {
      2: [{ x: 80, y: 230, rot: -6 }, { x: 430, y: 250, rot: 5 }],
      3: [{ x: 40, y: 200, rot: -5 }, { x: 300, y: 210, rot: 4 }, { x: 560, y: 200, rot: -3 }],
      4: [{ x: 60, y: 170, rot: -6 }, { x: 430, y: 175, rot: 5 }, { x: 70, y: 480, rot: 4 }, { x: 440, y: 470, rot: -4 }]
    };
    return sets[n] || sets[2];
  },

  _solve: function (i) {
    var self = this;
    this.solvedEl.classList.add('show');
    this.board.classList.add('celebrate-puz');
    var c = Stage.centerOf(this.board);
    this.api.correct(c.x, c.y, { say: '¡Mira, ' + this.NAMES[i] + '! ¡Lo armaste!' });
    this.api.after(900, function () {
      self.board.classList.remove('celebrate-puz');
      self.api.roundComplete();
    });
  },

  destroy: function () {}
};
