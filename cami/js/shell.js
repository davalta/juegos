/* shell.js — router + ciclo de vida de juegos + HUD + flujo de rondas + celebración. */
window.GAMES = window.GAMES || {};

var Shell = {
  scene: null,
  hud: null,
  overlay: null,
  current: null,
  round: 0,
  _drags: [],
  _timers: [],
  _starEls: [],

  init: function () {
    this.scene = document.getElementById('scene');
    this.hud = document.getElementById('hud');
    this.overlay = document.getElementById('overlay');
    // cualquier toque reinicia el contador de inactividad (para las pistas)
    var self = this;
    document.getElementById('stage').addEventListener('pointerdown', function () {
      self._idleLast = Date.now();
    }, true);
  },

  // ---- pistas por inactividad (manita estilo Bimi Boo) ----
  _idleLast: 0,
  _idleCfg: null,
  _idleTimer: null,

  _startIdle: function () {
    var self = this;
    this._idleLast = Date.now();
    this._idleTimer = setInterval(function () {
      if (!self._idleCfg || !self.current) return;
      if (self.overlay.classList.contains('show')) return;
      if (Date.now() - self._idleLast > self._idleCfg.ms) {
        self._idleLast = Date.now();
        try { self._idleCfg.fn(); } catch (e) {}
      }
    }, 1000);
  },

  _stopIdle: function () {
    if (this._idleTimer) { clearInterval(this._idleTimer); this._idleTimer = null; }
    this._idleCfg = null;
  },

  // manita 👆 que viaja de un elemento a otro (o se queda tocando uno solo)
  hand: function (fromEl, toEl) {
    if (!fromEl) return;
    var f = Stage.centerOf(fromEl);
    var t = toEl ? Stage.centerOf(toEl) : f;
    var h = document.createElement('div');
    h.className = 'hint-hand';
    h.innerHTML = '<span class="hh-inner">👆</span>';
    h.style.left = f.x + 'px';
    h.style.top = f.y + 'px';
    this.hud.appendChild(h);
    var dx = t.x - f.x, dy = t.y - f.y;
    if (h.animate) {
      var anim = h.animate([
        { transform: 'translate(-26%,-12%) translate(0,0)', opacity: 0 },
        { transform: 'translate(-26%,-12%) translate(0,0)', opacity: 1, offset: 0.18 },
        { transform: 'translate(-26%,-12%) translate(' + dx + 'px,' + dy + 'px)', opacity: 1, offset: 0.85 },
        { transform: 'translate(-26%,-12%) translate(' + dx + 'px,' + dy + 'px)', opacity: 0 }
      ], { duration: 1500, iterations: 2, easing: 'ease-in-out' });
      anim.onfinish = function () { if (h.parentNode) h.parentNode.removeChild(h); };
      setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 3400);
    } else {
      setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 3000);
    }
  },

  // ---- utilidades de limpieza ----
  _clearTimers: function () {
    for (var i = 0; i < this._timers.length; i++) clearTimeout(this._timers[i]);
    this._timers = [];
  },
  after: function (ms, fn) { var t = setTimeout(fn, ms); this._timers.push(t); return t; },

  _teardownGame: function () {
    if (this.current && this.current.destroy) {
      try { this.current.destroy(); } catch (e) {}
    }
    for (var i = 0; i < this._drags.length; i++) {
      try { this._drags[i].destroy(); } catch (e) {}
    }
    this._drags = [];
    this._clearTimers();
    this._stopIdle();
    Voz.cancel();
    this.current = null;
    this.scene.innerHTML = '';
    this.hud.innerHTML = '';
    this.overlay.innerHTML = '';
    this.overlay.classList.remove('show');
  },

  // ---- navegación ----
  showHome: function () {
    this._teardownGame();
    Home.build(this.scene);
  },

  startGame: function (id) {
    var game = window.GAMES[id];
    if (!game) return;
    this._teardownGame();
    this.current = game;
    this.round = 0;
    this._buildHud(game);
    var api = this._api(game);
    if (game.init) game.init(this.scene, api);
    if (game.intro) Voz.speak(game.intro);
    Sound.play('whoosh');
    api.round = 0; api.totalRounds = game.rounds;
    this._startIdle();
    // deja que el intro hablado se escuche antes de arrancar la ronda
    this.after(1100, function () { if (game.nextRound) game.nextRound(0); });
  },

  exitToHome: function () {
    Sound.play('click');
    this.showHome();
  },

  // ---- HUD ----
  _buildHud: function (game) {
    var self = this;
    this.hud.innerHTML = '';
    this._starEls = [];

    var home = document.createElement('button');
    home.className = 'hud-home';
    home.innerHTML = Art.house();
    home.addEventListener('click', function () { self.exitToHome(); });
    this.hud.appendChild(home);

    var stars = document.createElement('div');
    stars.className = 'hud-stars';
    for (var i = 0; i < game.rounds; i++) {
      var st = document.createElement('div');
      st.className = 'hud-star';
      st.innerHTML = Art.star();
      stars.appendChild(st);
      this._starEls.push(st);
    }
    this.hud.appendChild(stars);

    // mute en el HUD (esquina derecha)
    var muteBtn = document.createElement('button');
    muteBtn.className = 'corner-btn';
    muteBtn.style.position = 'absolute';
    muteBtn.style.right = '26px';
    muteBtn.style.top = '24px';
    var setIcon = function () { muteBtn.textContent = Save.muted ? '🔇' : '🔊'; };
    setIcon();
    muteBtn.addEventListener('click', function () {
      Save.muted = !Save.muted; setIcon();
      if (!Save.muted) Sound.play('ding');
    });
    this.hud.appendChild(muteBtn);
  },

  _fillStar: function (idx) {
    var st = this._starEls[idx];
    if (!st) return;
    st.classList.add('on');
    Sound.play('star');
    // starPop en la posición lógica del slot
    var r = st.getBoundingClientRect();
    var p = Stage.toStage(r.left + r.width / 2, r.top + r.height / 2);
    Confetti.starPop(p.x, p.y);
  },

  // ---- API por sesión ----
  _api: function (game) {
    var self = this;
    var api = {
      round: 0,
      totalRounds: game.rounds,

      correct: function (x, y, opts) {
        opts = opts || {};
        Sound.play('tada');
        if (x != null && y != null) {
          Confetti.burst(x, y, { count: 22 });
          Confetti.hearts(x, y, 6);
        }
        Voz.speak(opts.say || Voz.pick(Voz.PRAISE));
      },

      wrong: function (el, opts) {
        opts = opts || {};
        Sound.play('boing');
        if (el) {
          el.classList.remove('wiggle');
          void el.offsetWidth; // reinicia animación
          el.classList.add('wiggle');
        }
        Voz.speak(opts.say || Voz.pick(Voz.ALMOST));
      },

      roundComplete: function () {
        self._fillStar(self.round);
        self.round++;
        api.round = self.round;
        if (self.round < game.rounds) {
          self.after(1300, function () {
            api.round = self.round;
            if (game.nextRound) game.nextRound(self.round);
          });
        } else {
          self.after(900, function () { self._celebrate(game); });
        }
      },

      speak: function (t, o) { Voz.speak(t, o); },
      sfx: function (n) { Sound.play(n); },

      drag: function (el, opts) {
        var h = DragHelper.make(el, opts);
        self._drags.push(h);
        return h;
      },

      // pista por inactividad: tras ms sin tocar, ejecuta fn (manita + voz)
      idleHint: function (ms, fn) { self._idleCfg = { ms: ms, fn: fn }; },
      hand: function (fromEl, toEl) { Shell.hand(fromEl, toEl); },

      after: function (ms, fn) { return self.after(ms, fn); }
    };
    return api;
  },

  // ---- celebración ----
  _celebrate: function (game) {
    var self = this;
    Save.addStar(game.id);
    Sound.play('fanfare');
    Voz.speak('¡Felicidades, Cami! ¡Lo lograste!');

    var texts = ['¡Muy bien!', '¡Bravo!', '¡Lo lograste!', '¡Increíble!'];
    var c = document.createElement('div');
    c.className = 'celebrate';
    c.innerHTML =
      '<div class="cel-cami">' + Art.cami({ blink: true }) + '</div>' +
      '<div class="cel-text">' + texts[Math.floor(Math.random() * texts.length)] + '</div>' +
      '<div class="cel-stars"><div class="big">' + Art.star() + '</div>' +
      '<div class="big">' + Art.star() + '</div>' +
      '<div class="big">' + Art.star() + '</div></div>' +
      '<div class="cel-btns">' +
      '<button class="cel-btn" id="cel-replay">' + Art.replay() + '</button>' +
      '<button class="cel-btn" id="cel-home">' + Art.house() + '</button>' +
      '</div>';
    this.overlay.innerHTML = '';
    this.overlay.appendChild(c);
    this.overlay.classList.add('show');
    void c.offsetWidth;
    c.classList.add('in');

    var bigs = c.querySelectorAll('.cel-stars .big');
    for (var i = 0; i < bigs.length; i++) {
      (function (el, d) { self.after(d, function () { el.classList.add('pop'); Sound.play('sparkle'); }); })(bigs[i], 300 + i * 300);
    }
    Confetti.rain(2800);

    c.querySelector('#cel-replay').addEventListener('click', function () {
      self.startGame(game.id);
    });
    c.querySelector('#cel-home').addEventListener('click', function () {
      self.exitToHome();
    });
  }
};
