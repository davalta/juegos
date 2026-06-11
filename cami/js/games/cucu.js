/* Cucú — los personajes se esconden tras los arbustos; Cami encuentra al nombrado.
   Trabaja la permanencia del objeto y la memoria. */
GAMES['cucu'] = {
  id: 'cucu',
  title: 'Cucú',
  intro: '¡Vamos a jugar a las escondidas!',
  color: '#c77dff',
  icon: '🌳',
  rounds: 5,

  POOL: [
    ['🐰', 'el conejo'],
    ['🐸', 'la rana'],
    ['🐱', 'el gato'],
    ['🐦', 'el pájaro'],
    ['🐹', 'el hámster'],
    ['🐭', 'Lola']
  ],
  SLOTS: [300, 660, 1000, 1340],

  init: function (scene, api) {
    this.api = api; this.scene = scene; this._timers = [];
    var wrap = document.createElement('div');
    wrap.className = 'g-cucu';
    wrap.innerHTML =
      '<div class="cucu-sky"></div>' +
      '<div class="cucu-ground"></div>' +
      '<div class="bush-layer"></div>' +
      '<div class="cucu-cloud" id="cucu-cloud"></div>';
    scene.appendChild(wrap);
    this.layer = wrap.querySelector('.bush-layer');
    this.cloud = wrap.querySelector('#cucu-cloud');
  },

  _t: function (ms, fn) { var t = setTimeout(fn, ms); this._timers.push(t); return t; },
  _clearTimers: function () { for (var i = 0; i < this._timers.length; i++) clearTimeout(this._timers[i]); this._timers = []; },

  nextRound: function (i) {
    this._clearTimers();
    this.layer.innerHTML = '';
    this.ready = false; this.solved = false;
    this.bushes = [];

    var hideCount = i < 2 ? 1 : 2;
    var pool = this.POOL.slice();
    var cast = [];
    for (var k = 0; k < hideCount; k++) cast.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    this.target = cast[0];

    // qué arbusto esconde a quién
    var idxs = [0, 1, 2, 3];
    for (var s = idxs.length - 1; s > 0; s--) { var r = Math.floor(Math.random() * (s + 1)); var tmp = idxs[s]; idxs[s] = idxs[r]; idxs[r] = tmp; }
    var assign = [null, null, null, null];
    for (var c = 0; c < cast.length; c++) assign[idxs[c]] = cast[c];

    var self = this;
    for (var b = 0; b < 4; b++) {
      (function (animal, x) {
        var bush = document.createElement('div');
        bush.className = 'bush';
        bush.style.left = (x - 130) + 'px';
        var em = animal ? animal[0] : '';
        bush.innerHTML =
          '<div class="bush-animal">' + em + '</div>' +
          '<div class="bush-leaves">' +
            '<span class="leaf l1"></span><span class="leaf l2"></span><span class="leaf l3"></span>' +
          '</div>';
        bush.addEventListener('pointerdown', function (e) { e.preventDefault(); self._tap(bush, animal); });
        self.layer.appendChild(bush);
        self.bushes.push({ el: bush, animal: animal, anim: bush.querySelector('.bush-animal') });
      })(assign[b], this.SLOTS[b]);
    }

    this._intro(i);
  },

  _intro: function (i) {
    var self = this;
    // muestra a los escondidos asomados y di sus nombres
    var shown = [];
    for (var b = 0; b < this.bushes.length; b++) if (this.bushes[b].animal) shown.push(this.bushes[b]);

    var d = 900;
    for (var s = 0; s < shown.length; s++) {
      (function (bush, delay) {
        self._t(delay, function () {
          bush.anim.classList.add('peek');
          Voz.speak(self._cap(bush.animal[1] === 'Lola' ? 'Lola' : bush.animal[1]));
        });
      })(shown[s], d);
      d += 1200;
    }

    // se esconden (round 4: con cortina de nube)
    this._t(d, function () {
      if (i >= 4) self._curtain();
      Sound.play('whoosh');
      for (var b = 0; b < shown.length; b++) shown[b].anim.classList.remove('peek');
      self._t(900, function () { self.ready = true; self._ask(); self._startHints(); });
    });
  },

  _curtain: function () {
    var self = this;
    this.cloud.classList.add('sweep');
    this._t(1200, function () { self.cloud.classList.remove('sweep'); });
  },

  _ask: function () {
    if (this.solved) return;
    Voz.speak('¿Dónde está ' + this.target[1] + '?');
  },

  _startHints: function () {
    var self = this;
    var n = 0;
    this.hint = setInterval(function () {
      if (self.solved || !self.ready) return;
      n++;
      if (n % 2 === 0) self._ask(); // alterna pista visual y re-pregunta
      for (var b = 0; b < self.bushes.length; b++) {
        if (self.bushes[b].animal === self.target) {
          var bu = self.bushes[b];
          bu.el.classList.remove('rustle'); void bu.el.offsetWidth; bu.el.classList.add('rustle');
          bu.anim.classList.add('tease');
          (function (a) { self._t(450, function () { a.classList.remove('tease'); }); })(bu.anim);
        }
      }
    }, 5000);
  },

  _tap: function (bushEl, animal) {
    if (!this.ready || this.solved) return;
    var self = this;
    bushEl.classList.remove('rustle'); void bushEl.offsetWidth; bushEl.classList.add('rustle');
    var rec = null;
    for (var b = 0; b < this.bushes.length; b++) if (this.bushes[b].el === bushEl) rec = this.bushes[b];

    if (animal === this.target) {
      this.solved = true;
      if (this.hint) { clearInterval(this.hint); this.hint = null; }
      this._clearTimers();
      rec.anim.classList.add('peek');
      var c = Stage.centerOf(bushEl);
      this.api.correct(c.x, c.y, { say: '¡Cucú! Aquí está ' + animal[1] });
      this._t(900, function () { self.api.roundComplete(); });
    } else if (animal) {
      // señuelo: se asoma y se ríe
      rec.anim.classList.add('peek');
      Sound.play('pop');
      Voz.speak('¡Cucú! Soy ' + animal[1]);
      this._t(1200, function () { rec.anim.classList.remove('peek'); });
    } else {
      // vacío
      Sound.play('pop');
      Voz.speak('Aquí no hay nadie.');
    }
  },

  _cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },

  destroy: function () {
    this._clearTimers();
    if (this.hint) { clearInterval(this.hint); this.hint = null; }
  }
};
