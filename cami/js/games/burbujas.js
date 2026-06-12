/* Burbujas — ¡atrapa 3 del objetivo! Atención selectiva + vocabulario + conteo 1-3.
   Un panel muestra qué hay que atrapar; las demás burbujas son distractores. */
GAMES['burbujas'] = {
  id: 'burbujas',
  title: 'Burbujas',
  intro: '¡Atrapa las burbujas, Cami!',
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
  COUNT_WORDS: ['', '¡Una!', '¡Dos!', '¡Tres!'],
  GOAL: 3,

  init: function (scene, api) {
    this.api = api;
    this.root = scene;
    this.bubbles = [];
    this.raf = null;
    this.caught = 0;
    this.roundDone = false;

    var wrap = document.createElement('div');
    wrap.className = 'g-burbujas';
    wrap.innerHTML = '<div class="bubbles-bg"></div><div class="bub-goal" id="bub-goal"></div>';
    scene.appendChild(wrap);
    this.wrap = wrap;
    this.goalEl = wrap.querySelector('#bub-goal');

    var self = this;
    this.tick = function () { self._update(); self.raf = requestAnimationFrame(self.tick); };

    // pista: la manita toca una burbuja objetivo + recuerda la misión (voz solo 1 vez)
    api.idleHint(8000, function () {
      for (var i = 0; i < self.bubbles.length; i++) {
        if (!self.bubbles[i].dead && self.bubbles[i].isTarget) {
          self.api.hand(self.bubbles[i].el, null);
          self.api.hintSpeak('¡Atrapa ' + self.target[1] + '!');
          return;
        }
      }
    });
  },

  nextRound: function (i) {
    this.caught = 0;
    this.roundDone = false;
    this.theme = this.THEMES[i % this.THEMES.length];
    this.target = this.theme[Math.floor(Math.random() * this.theme.length)];

    // panel de meta: 3 siluetas del objetivo que se van iluminando
    var html = '';
    for (var g = 0; g < this.GOAL; g++) html += '<span class="bg-slot">' + this.target[0] + '</span>';
    this.goalEl.innerHTML = html;

    Voz.speak('¡Atrapa ' + this.target[1] + '! ¡Tres veces!');

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

  _aliveTargets: function () {
    var n = 0;
    for (var i = 0; i < this.bubbles.length; i++) if (!this.bubbles[i].dead && this.bubbles[i].isTarget) n++;
    return n;
  },

  _spawn: function (spread) {
    // garantiza que siempre haya al menos 2 burbujas objetivo a la vista
    var forceTarget = this._aliveTargets() < 2;
    var item;
    if (forceTarget || Math.random() < 0.35) {
      item = this.target;
    } else {
      do { item = this.theme[Math.floor(Math.random() * this.theme.length)]; }
      while (item === this.target);
    }
    var isTarget = item === this.target;
    var size = 200 + Math.random() * 60;
    var x = 120 + Math.random() * 1360;
    var y = spread ? (260 + Math.random() * 740) : (940 + Math.random() * 90);
    var golden = isTarget && Math.random() < 0.15; // dorada = objetivo brillante
    var el = document.createElement('button');
    el.className = 'bubble' + (golden ? ' golden' : '');
    el.style.width = el.style.height = size + 'px';
    el.innerHTML = '<span class="bub-emoji">' + item[0] + '</span><span class="bub-shine"></span>';
    var b = { el: el, x: x, y: y, size: size,
              vy: 1.0 + Math.random() * 1.0, phase: Math.random() * 6.28,
              amp: 20 + Math.random() * 30, baseX: x, name: item[1], emoji: item[0],
              isTarget: isTarget, golden: golden, dead: false };
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

    // animación de reventar
    b.el.classList.add('burst');
    var el = b.el;
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    var idx = this.bubbles.indexOf(b);
    if (idx >= 0) this.bubbles.splice(idx, 1);

    if (b.isTarget) {
      // ¡atrapada! cuenta en voz alta y llena el panel
      this.caught++;
      Sound.play(b.golden ? 'sparkle' : 'tada');
      Confetti.burst(c.x, c.y, { count: b.golden ? 22 : 14 });
      if (b.golden) Confetti.starPop(c.x, c.y);
      this._zoom(b.emoji);
      var slot = this.goalEl.querySelectorAll('.bg-slot')[this.caught - 1];
      if (slot) slot.classList.add('on');

      if (this.caught >= this.GOAL) {
        this.roundDone = true;
        Voz.speak('¡Tres! ¡Lo lograste, Cami!');
        this._cascade();
      } else {
        Voz.speak(this.COUNT_WORDS[this.caught]);
        this._spawn(false);
      }
    } else {
      // distractor: pop suave, a veces dice su nombre (vocabulario sin regaño)
      Confetti.burst(c.x, c.y, { count: 8, shapes: ['rect'], colors: ['#aef0ff', '#fff', '#5ec8ff'] });
      if (Math.random() < 0.35) Voz.speak(this._cap(b.name));
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
