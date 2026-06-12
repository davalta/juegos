/* Cucú — los personajes se esconden tras los arbustos; Cami encuentra al nombrado.
   Permanencia del objeto + memoria. Reto: desde la ronda 3 los arbustos se
   MUEVEN de lugar después de esconderse (juego de trilero suave).
   Incentivo: cada amigo encontrado se colecciona en una fila al pie. */
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
    this.api = api; this.root = scene; this._timers = [];
    this.friends = [];
    var wrap = document.createElement('div');
    wrap.className = 'g-cucu';
    wrap.innerHTML =
      '<div class="cucu-sky"></div>' +
      '<div class="cucu-ground"></div>' +
      '<div class="bush-layer"></div>' +
      '<div class="cucu-friends" id="cucu-friends"></div>' +
      '<div class="cucu-cloud" id="cucu-cloud"></div>';
    scene.appendChild(wrap);
    this.layer = wrap.querySelector('.bush-layer');
    this.friendsEl = wrap.querySelector('#cucu-friends');
    this.cloud = wrap.querySelector('#cucu-cloud');
    Art.addCheer(wrap, 'left:8px;bottom:170px;width:150px;height:210px;');
  },

  _t: function (ms, fn) { var t = setTimeout(fn, ms); this._timers.push(t); return t; },
  _clearTimers: function () { for (var i = 0; i < this._timers.length; i++) clearTimeout(this._timers[i]); this._timers = []; },

  nextRound: function (i) {
    this._clearTimers();
    this.layer.innerHTML = '';
    this.ready = false; this.solved = false;
    this.bushes = [];
    this.roundIdx = i;

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

    // se esconden (ronda 5: con cortina de nube)
    this._t(d, function () {
      if (i >= 4) self._curtain();
      Sound.play('whoosh');
      for (var b = 0; b < shown.length; b++) shown[b].anim.classList.remove('peek');
      // rondas 3+: ¡los arbustos bailan y cambian de lugar! (reto de memoria)
      if (i >= 2) {
        self._t(800, function () {
          self._shuffle(i >= 4 ? 3 : 2, function () {
            self._t(300, function () { self._begin(); });
          });
        });
      } else {
        self._t(900, function () { self._begin(); });
      }
    });
  },

  _begin: function () {
    this.ready = true;
    this._ask();
    this._startHints();
  },

  // intercambia pares de arbustos con animación (los animales viajan dentro)
  _shuffle: function (times, done) {
    var self = this;
    var step = 0;
    function once() {
      var a = Math.floor(Math.random() * 4);
      var b = (a + 1 + Math.floor(Math.random() * 3)) % 4;
      var la = self.bushes[a].el.style.left;
      var lb = self.bushes[b].el.style.left;
      Sound.play('whoosh');
      self.bushes[a].el.style.left = lb;
      self.bushes[b].el.style.left = la;
      step++;
      if (step < times) self._t(650, once);
      else self._t(620, done);
    }
    once();
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
    var n = 0, reasked = false;
    this.hint = setInterval(function () {
      if (self.solved || !self.ready) return;
      n++;
      // la voz recuerda la instrucción UNA sola vez; la pista visual sí continúa
      if (n === 2 && !reasked) { reasked = true; self._ask(); }
      for (var b = 0; b < self.bushes.length; b++) {
        if (self.bushes[b].animal === self.target) {
          var bu = self.bushes[b];
          bu.el.classList.remove('rustle'); void bu.el.offsetWidth; bu.el.classList.add('rustle');
        }
      }
    }, 6500);
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
      this._addFriend(animal);
      this._t(1100, function () { self.api.roundComplete(); });
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

  // colección de amigos encontrados (se queda entre rondas)
  _addFriend: function (animal) {
    this.friends.push(animal);
    var f = document.createElement('span');
    f.className = 'friend';
    f.textContent = animal[0];
    this.friendsEl.appendChild(f);
    Sound.play('sparkle');
    var self = this;
    var n = this.friends.length;
    this._t(900, function () {
      if (n >= 5) {
        self.friendsEl.classList.add('party');
        Voz.speak('¡Cinco amigos! ¡Todos contigo, Cami!', { interrupt: false });
      } else if (n >= 2) {
        Voz.speak('¡Ya tienes ' + ['', '', 'dos', 'tres', 'cuatro'][n] + ' amigos!', { interrupt: false });
      }
    });
  },

  _cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },

  destroy: function () {
    this._clearTimers();
    if (this.hint) { clearInterval(this.hint); this.hint = null; }
    this.friends = [];
    if (this.friendsEl) { this.friendsEl.innerHTML = ''; this.friendsEl.classList.remove('party'); }
  }
};
