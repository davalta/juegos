/* Colores — arrastrar cada cosa a la canasta de su color (clasificación). */
GAMES['colores'] = {
  id: 'colores',
  title: 'Colores',
  intro: '¡Guarda cada cosa en su color!',
  color: '#ff6b9d',
  icon: '🎨',
  rounds: 5,

  C: {
    rojo:     { hex: '#ff4b4b', items: ['🍎', '🍓', '🌹', '🐞'] },
    azul:     { hex: '#4b8bff', items: ['🫐', '🦋', '🐳', '💙'] },
    amarillo: { hex: '#ffce2e', items: ['🍌', '⭐', '🐤', '🌻'] },
    verde:    { hex: '#5fd44b', items: ['🐸', '🥦', '🍀', '🐢'] },
    rosa:     { hex: '#ff5fae', items: ['🎀', '👗', '👠', '💖'] }
  },
  ROUNDS: [
    ['rojo', 'azul'],
    ['amarillo', 'verde'],
    ['rojo', 'azul', 'amarillo'],
    ['rosa', 'verde', 'azul'],
    ['rosa', 'rojo', 'amarillo']
  ],

  init: function (scene, api) {
    this.api = api; this.scene = scene;
    var wrap = document.createElement('div');
    wrap.className = 'g-colores';
    wrap.innerHTML = '<div class="col-items"></div><div class="col-baskets"></div>';
    scene.appendChild(wrap);
    this.itemsEl = wrap.querySelector('.col-items');
    this.basketsEl = wrap.querySelector('.col-baskets');
  },

  nextRound: function (i) {
    this.itemsEl.innerHTML = '';
    this.basketsEl.innerHTML = '';
    this.placed = 0;
    this.items = [];
    var colors = this.ROUNDS[i % this.ROUNDS.length];
    var self = this;

    // pista: manita del primer item libre a su canasta
    this.api.idleHint(8000, function () {
      for (var p = 0; p < self.items.length; p++) {
        var it = self.items[p];
        if (it.done) continue;
        for (var z = 0; z < self.baskets.length; z++) {
          if (self.baskets[z].color === it.color) {
            self.api.hand(it.el, self.baskets[z].el);
            Voz.speak('Va con el color ' + it.color);
            return;
          }
        }
      }
    });

    // canastas
    this.baskets = [];
    var bxs = colors.length === 2 ? [550, 1050] : [380, 800, 1220];
    for (var b = 0; b < colors.length; b++) {
      var key = colors[b];
      var bk = document.createElement('div');
      bk.className = 'basket';
      bk.style.left = (bxs[b] - 140) + 'px';
      bk.style.setProperty('--c', this.C[key].hex);
      bk.innerHTML = '<div class="basket-dot"></div><div class="basket-body"></div>';
      this.basketsEl.appendChild(bk);
      this.baskets.push({ el: bk, color: key });
    }

    // items: al menos uno por color, hasta N
    var N = colors.length === 2 ? 4 : 3;
    var chosen = [];
    for (var c = 0; c < colors.length; c++) chosen.push(colors[c]);
    while (chosen.length < N) chosen.push(colors[Math.floor(Math.random() * colors.length)]);
    // mezcla
    for (var k = chosen.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)); var t = chosen[k]; chosen[k] = chosen[r]; chosen[r] = t; }
    this.total = chosen.length;

    var ixs = [];
    var span = 1400 / chosen.length;
    for (var p = 0; p < chosen.length; p++) {
      (function (key, idx) {
        var pool = self.C[key].items;
        var emoji = pool[Math.floor(Math.random() * pool.length)];
        var x = 120 + span * idx + span / 2 - 100;
        var it = document.createElement('div');
        it.className = 'col-item';
        it.style.left = x + 'px';
        it.style.top = (320 + (idx % 2) * 40) + 'px';
        it.innerHTML = '<span>' + emoji + '</span>';
        self.itemsEl.appendChild(it);
        var rec = { el: it, color: key, done: false };
        self.items.push(rec);
        self.api.drag(it, {
          data: { color: key },
          inflate: 50,
          getTargets: function () {
            var out = [];
            for (var z = 0; z < self.baskets.length; z++) out.push({ el: self.baskets[z].el, data: { color: self.baskets[z].color } });
            return out;
          },
          accepts: function (d, t) { return d.color === t.color; },
          onCorrect: function (el, target) {
            el.style.pointerEvents = 'none';
            el.classList.add('stored');
            rec.done = true;
            var c = Stage.centerOf(target.el);
            self.api.correct(c.x, c.y, { say: '¡' + self._cap(key) + '!' });
            self.placed++;
            if (self.placed >= self.total) {
              for (var z = 0; z < self.baskets.length; z++) self.baskets[z].el.classList.add('cheer');
              self.api.after(700, function () { self.api.roundComplete(); });
            }
          },
          onWrong: function (el, target) { self.api.wrong(target.el, { say: 'Ahí no va. Busca el ' + key }); }
        });
      })(chosen[p], p);
    }
  },

  _basketName: function (target) {
    return target && target.data ? target.data.color : 'ahí';
  },
  _cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },
  destroy: function () {}
};
