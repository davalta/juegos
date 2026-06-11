/* Burbujas — tocar burbujas flotantes para reventarlas (causa-efecto + vocabulario). */
GAMES['burbujas'] = {
  id: 'burbujas',
  title: 'Burbujas',
  intro: '¡Toca las burbujas, Cami!',
  color: '#5ec8ff',
  icon: '🫧',
  rounds: 5,

  THEMES: [
    [['🎀', 'el moño'], ['💖', 'el corazón'], ['👑', 'la corona'], ['⭐', 'la estrella'], ['🌸', 'la flor']],
    [['🐶', 'el perro'], ['🐱', 'el gato'], ['🐰', 'el conejo'], ['🐦', 'el pájaro'], ['🐟', 'el pez']],
    [['🍎', 'la manzana'], ['🍌', 'el plátano'], ['🍓', 'la fresa'], ['🍇', 'las uvas'], ['🍊', 'la naranja']],
    [['⚽', 'la pelota'], ['🧸', 'el osito'], ['🎈', 'el globo'], ['🚗', 'el carro'], ['🥁', 'el tambor']],
    [['🦋', 'la mariposa'], ['🐞', 'la catarina'], ['🐝', 'la abeja'], ['🐢', 'la tortuga'], ['🐠', 'el pececito']]
  ],

  init: function (scene, api) {
    this.api = api;
    this.scene = scene;
    this.bubbles = [];
    this.raf = null;
    this.popped = 0;
    this.roundDone = false;

    var wrap = document.createElement('div');
    wrap.className = 'g-burbujas';
    wrap.innerHTML = '<div class="bubbles-bg"></div>';
    scene.appendChild(wrap);
    this.wrap = wrap;

    var self = this;
    this.tick = function () { self._update(); self.raf = requestAnimationFrame(self.tick); };
  },

  nextRound: function (i) {
    this.popped = 0;
    this.roundDone = false;
    this.theme = this.THEMES[i % this.THEMES.length];
    // limpia y recrea burbujas
    this._clearBubbles();
    for (var k = 0; k < 7; k++) this._spawn(true);
    if (!this.raf) this.tick();
  },

  _clearBubbles: function () {
    for (var i = 0; i < this.bubbles.length; i++) {
      if (this.bubbles[i].el.parentNode) this.bubbles[i].el.parentNode.removeChild(this.bubbles[i].el);
    }
    this.bubbles = [];
  },

  _spawn: function (spread) {
    var item = this.theme[Math.floor(Math.random() * this.theme.length)];
    var size = 200 + Math.random() * 60;
    var x = 120 + Math.random() * (1360);
    var y = spread ? (200 + Math.random() * 800) : (940 + Math.random() * 90);
    var golden = Math.random() < 0.13;
    var el = document.createElement('button');
    el.className = 'bubble' + (golden ? ' golden' : '');
    el.style.width = el.style.height = size + 'px';
    el.innerHTML = '<span class="bub-emoji">' + item[0] + '</span><span class="bub-shine"></span>';
    var b = { el: el, x: x, y: y, size: size,
              vy: 1.0 + Math.random() * 1.0, phase: Math.random() * 6.28,
              amp: 20 + Math.random() * 30, baseX: x, name: item[1], emoji: item[0],
              golden: golden, dead: false };
    var self = this;
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); self._pop(b); });
    this.wrap.appendChild(el);
    this.bubbles.push(b);
  },

  _update: function () {
    for (var i = 0; i < this.bubbles.length; i++) {
      var b = this.bubbles[i];
      if (b.dead) continue;
      b.y -= b.vy;
      b.phase += 0.02;
      var x = b.baseX + Math.sin(b.phase) * b.amp;
      if (b.y < -b.size) { // reaparece abajo
        b.y = 980 + Math.random() * 100;
        b.baseX = 120 + Math.random() * 1360;
      }
      b.el.style.transform = 'translate(' + (x - b.size / 2) + 'px,' + (b.y - b.size / 2) + 'px)';
    }
  },

  _pop: function (b) {
    if (b.dead || this.roundDone) return;
    b.dead = true;
    Sound.play('pop');
    var c = Stage.centerOf(b.el);
    if (b.golden) {
      // burbuja dorada: fiesta extra
      Sound.play('sparkle');
      Confetti.starPop(c.x, c.y);
      Confetti.hearts(c.x, c.y, 8);
      Confetti.burst(c.x, c.y, { count: 18, colors: ['#ffd23f', '#ffe98a', '#fff'] });
    } else {
      Confetti.burst(c.x, c.y, { count: 12, shapes: ['rect'], colors: ['#aef0ff', '#fff', '#5ec8ff'] });
    }
    // animación de reventar
    b.el.classList.add('burst');
    var el = b.el;
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    // zoom del objeto al centro + voz
    this._zoom(b.emoji);
    Voz.speak(b.golden ? '¡' + this._cap(b.name) + '! ¡Qué brillante!' : '¡' + this._cap(b.name) + '!');

    // quita de la lista y repón una nueva
    var idx = this.bubbles.indexOf(b);
    if (idx >= 0) this.bubbles.splice(idx, 1);

    this.popped++;
    if (this.popped >= 6) {
      this.roundDone = true;
      this._cascade();
    } else {
      this._spawn(false);
    }
  },

  // al cerrar la ronda, las burbujas restantes revientan solas en cadena
  _cascade: function () {
    var self = this;
    var rest = this.bubbles.slice();
    this.bubbles = [];
    for (var k = 0; k < rest.length; k++) {
      (function (b, delay) {
        b.dead = true;
        setTimeout(function () {
          Sound.play('pop');
          b.el.classList.add('burst');
          setTimeout(function () { if (b.el.parentNode) b.el.parentNode.removeChild(b.el); }, 260);
        }, delay);
      })(rest[k], 150 * k);
    }
    // api.after se limpia si el usuario sale a media cascada
    this.api.after(150 * rest.length + 500, function () { self.api.roundComplete(); });
  },

  _zoom: function (emoji) {
    var z = document.createElement('div');
    z.className = 'bub-zoom';
    z.textContent = emoji;
    this.wrap.appendChild(z);
    setTimeout(function () { if (z.parentNode) z.parentNode.removeChild(z); }, 800);
  },

  _cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },

  destroy: function () {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this._clearBubbles();
  }
};
