/* Animales — granja: presenta los animales y luego "¿dónde está...?" (comprensión auditiva). */
GAMES['animales'] = {
  id: 'animales',
  title: 'La Granja',
  intro: '¡Vamos a la granja!',
  color: '#7ed957',
  icon: '🐄',
  rounds: 5,

  POOL: [
    ['🐄', 'la vaca', '¡Muu!'],
    ['🐷', 'el cerdito', '¡Oink!'],
    ['🐑', 'la oveja', '¡Bee!'],
    ['🐔', 'la gallina', '¡Co co co!'],
    ['🐴', 'el caballo', '¡Iiii!'],
    ['🐶', 'el perro', '¡Guau!'],
    ['🐱', 'el gato', '¡Miau!'],
    ['🦆', 'el pato', '¡Cuac!']
  ],
  SLOTS: [330, 660, 990, 1300],

  init: function (scene, api) {
    this.api = api; this.scene = scene; this._timers = [];
    var wrap = document.createElement('div');
    wrap.className = 'g-animales';
    wrap.innerHTML =
      '<div class="farm-sky"></div>' +
      '<div class="farm-sun">☀️</div>' +
      '<div class="farm-barn">🏠</div>' +
      '<div class="farm-grass"></div>' +
      '<div class="farm-lola">' + Art.lola() + '</div>' +
      '<div class="animal-layer"></div>';
    scene.appendChild(wrap);
    this.layer = wrap.querySelector('.animal-layer');
  },

  _t: function (ms, fn) { var t = setTimeout(fn, ms); this._timers.push(t); return t; },
  _clearTimers: function () { for (var i = 0; i < this._timers.length; i++) clearTimeout(this._timers[i]); this._timers = []; },

  nextRound: function (i) {
    this._clearTimers();
    this.layer.innerHTML = '';
    this.solved = false;
    this.ready = false;
    this._askCount = 0;

    // rondas 0-2: "¿dónde está la vaca?" | rondas 3-4: "¿quién dice muu?" (más reto)
    this.mode = i >= 3 ? 'sound' : 'name';

    // elige 4 animales y un objetivo
    var pool = this.POOL.slice();
    var pick = [];
    for (var k = 0; k < 4; k++) pick.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    this.current = pick;
    this.target = pick[Math.floor(Math.random() * pick.length)];
    this.question = this.mode === 'sound'
      ? '¿Quién dice ' + this.target[2].replace(/[¡!]/g, '') + '?'
      : '¿Dónde está ' + this.target[1] + '?';

    var self = this;
    for (var j = 0; j < 4; j++) {
      (function (animal, slotX) {
        var el = document.createElement('button');
        el.className = 'animal';
        el.style.left = (slotX - 120) + 'px';
        el.innerHTML = '<span class="mound"></span><span class="animal-emoji">' + animal[0] + '</span>';
        el.addEventListener('pointerdown', function (e) { e.preventDefault(); self._tap(animal, el); });
        self.layer.appendChild(el);
      })(pick[j], this.SLOTS[j]);
    }

    if (i === 0) { this._present(); }
    else { this.ready = true; this._t(400, function () { self._ask(); }); }
  },

  _present: function () {
    var self = this;
    var els = this.layer.querySelectorAll('.animal');
    var d = 500;
    for (var j = 0; j < this.current.length; j++) {
      (function (animal, el, delay) {
        self._t(delay, function () {
          el.classList.add('spotlight');
          Voz.speak(self._cap(animal[1]) + '. ' + animal[2]);
          self._t(950, function () { el.classList.remove('spotlight'); });
        });
      })(this.current[j], els[j], d);
      d += 1050;
    }
    this._t(d + 200, function () { self.ready = true; self._ask(); });
  },

  _ask: function () {
    if (this.solved) return;
    var self = this;
    Voz.speak(this.question);
    this._askCount = (this._askCount || 0) + 1;
    // tras dos preguntas sin acierto, el animal correcto da un brinquito de pista
    if (this._askCount >= 3) {
      var els = this.layer.querySelectorAll('.animal');
      for (var j = 0; j < this.current.length; j++) {
        if (this.current[j] === this.target && els[j]) {
          els[j].classList.remove('wiggle'); void els[j].offsetWidth; els[j].classList.add('wiggle');
        }
      }
    }
    this._clearReask();
    this.reask = this._t(6500, function () { self._ask(); });
  },
  _clearReask: function () { if (this.reask) { clearTimeout(this.reask); this.reask = null; } },

  _tap: function (animal, el) {
    if (this.solved || !this.ready) return;
    var self = this;
    if (animal === this.target) {
      this.solved = true;
      this._clearTimers();
      el.classList.add('jump');
      var c = Stage.centerOf(el);
      this.api.correct(c.x, c.y, { say: '¡Sí! ' + this._cap(animal[1]) + '. ' + animal[2] });
      this._t(900, function () { self.api.roundComplete(); });
    } else {
      // todo toque enseña: dice su propio nombre (sin regaño)
      el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle');
      Sound.play('pop');
      Voz.speak('Soy ' + animal[1] + '. ' + animal[2]);
      this._clearReask();
      this.reask = this._t(5000, function () { self._ask(); });
    }
  },

  _cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },

  destroy: function () { this._clearTimers(); }
};
