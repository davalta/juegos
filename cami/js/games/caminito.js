/* Caminito — juego de mesa estilo fiesta: Cami lanza el dado, cuenta los
   brincos (1 a 3) y recorre el caminito juntando estrellas hasta llegar a
   la casita de Lola. Cada estrella alcanzada cierra una ronda del shell.
   El dado es "amable": nunca se pasa de la siguiente estrella, así los
   puntos del dado siempre coinciden con los brincos y no hay frustración. */
GAMES['caminito'] = {
  id: 'caminito',
  title: 'El caminito',
  intro: '¡Vamos a la casita de Lola! ¡Toca el dado!',
  color: '#c77dff',
  icon: '🎲',
  rounds: 5,

  // centros lógicos de las 16 casillas (serpiente de 3 filas)
  TILES: [
    [180, 750], [415, 750], [650, 750], [885, 750], [1120, 750], [1355, 750],
    [1355, 495], [1120, 495], [885, 495], [650, 495], [415, 495], [180, 495],
    [180, 240], [415, 240], [650, 240], [885, 240]
  ],
  STARS: [3, 6, 9, 12, 15],
  DECOR: { 1: '🦋', 2: '🌼', 4: '🌈', 5: '🐤', 7: '🍎', 8: '🐸', 10: '🌈', 11: '🎈', 13: '🍓', 14: '🎵' },
  SAY: {
    '🦋': '¡Una mariposa!',
    '🌼': '¡Una florecita!',
    '🐤': '¡Un pollito! ¡Pío, pío!',
    '🍎': '¡Una manzana!',
    '🐸': '¡Una ranita! ¡Croac, croac!',
    '🎈': '¡Un globo!',
    '🍓': '¡Una fresa!',
    '🎵': '¡Música!',
    '🌈': '¡Un arcoíris mágico! ¡Brinco extra!'
  },
  WORDS: ['', 'uno', 'dos', 'tres'],
  COLORS: ['#ff8a5c', '#ffd23f', '#7ed957', '#5ec8ff', '#c77dff', '#ff7ec0'],
  DOTS: {
    1: [[50, 50]],
    2: [[30, 30], [70, 70]],
    3: [[27, 27], [50, 50], [73, 73]]
  },

  init: function (scene, api) {
    this.api = api;
    this.pos = 0;
    this.busy = true; // hasta que el shell llame nextRound(0)
    var self = this;

    var wrap = document.createElement('div');
    wrap.className = 'g-caminito';

    // decoración suave del prado (no interactiva)
    var deco = '<div class="cam-deco">' +
      '<span style="left:36px;top:148px;font-size:60px">☁️</span>' +
      '<span style="left:1430px;top:52px;font-size:72px">☁️</span>' +
      '<span style="left:520px;top:352px;font-size:42px;opacity:.55">🌼</span>' +
      '<span style="left:990px;top:340px;font-size:40px;opacity:.55">🌸</span>' +
      '<span style="left:300px;top:606px;font-size:40px;opacity:.55">🌸</span>' +
      '<span style="left:1010px;top:612px;font-size:42px;opacity:.55">🌼</span>' +
      '</div>';

    // camino blanco con puntitos rosas pasando por todas las casillas
    var d = 'M ' + this.TILES[0][0] + ' ' + this.TILES[0][1];
    for (var i = 1; i < this.TILES.length; i++) {
      d += ' L ' + this.TILES[i][0] + ' ' + this.TILES[i][1];
    }
    var road = '<svg class="cam-road" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + d + '" fill="none" stroke="#ffffff" stroke-width="88" stroke-linejoin="round" stroke-linecap="round" opacity=".8"/>' +
      '<path d="' + d + '" fill="none" stroke="#ffd9ec" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="0.1 44" opacity=".9"/>' +
      '</svg>';

    wrap.innerHTML = deco + road +
      '<div class="cam-house">' + this._house() + '</div>' +
      '<div class="cam-goal-lola">' + Art.lola() + '</div>';
    scene.appendChild(wrap);
    this.wrap = wrap;
    this.goalLola = wrap.querySelector('.cam-goal-lola');

    // casillas
    this.tiles = [];
    for (i = 0; i < this.TILES.length; i++) {
      var t = document.createElement('div');
      t.className = 'cam-tile';
      var size = 140;
      if (this.STARS.indexOf(i) !== -1) {
        size = 164;
        t.className += ' star-tile';
        t.innerHTML = '<span class="tstar">⭐</span>';
      } else {
        t.style.background = 'radial-gradient(circle at 35% 30%, #ffffff, ' +
          this.COLORS[i % this.COLORS.length] + ')';
        if (this.DECOR[i]) t.innerHTML = '<span class="deco">' + this.DECOR[i] + '</span>';
      }
      t.style.width = size + 'px';
      t.style.height = size + 'px';
      t.style.left = (this.TILES[i][0] - size / 2) + 'px';
      t.style.top = (this.TILES[i][1] - size / 2) + 'px';
      wrap.appendChild(t);
      this.tiles.push(t);
    }

    // ficha de Cami
    var tok = document.createElement('div');
    tok.className = 'cam-token';
    tok.innerHTML = '<div class="cam-shadow"></div><div class="cam-token-in">' + Art.cami() + '</div>';
    wrap.appendChild(tok);
    this.token = tok;
    this.tokenIn = tok.querySelector('.cam-token-in');
    this._placeToken(0);

    // dado
    var die = document.createElement('button');
    die.className = 'cam-die off';
    die.innerHTML = '<div class="die-face"></div>';
    die.addEventListener('click', function () { self._roll(); });
    wrap.appendChild(die);
    this.die = die;
    this.face = die.querySelector('.die-face');
    this._setFace(3);

    // número grande que salta sobre el dado al caer la tirada
    var num = document.createElement('div');
    num.className = 'cam-roll-num';
    wrap.appendChild(num);
    this.num = num;

    api.idleHint(9000, function () {
      if (self.busy) return;
      api.hand(self.die, null);
      Voz.speak('¡Toca el dado, Cami!');
    });
  },

  nextRound: function (i) {
    var self = this;
    this.busy = false;
    this.die.classList.remove('off');
    if (i > 0) {
      Voz.speak(Voz.pick(['¡Toca el dado!', '¡Otra vez! ¡El dado!', '¡Sigue, Cami! ¡Toca el dado!']));
    } else {
      // primera vez: manita enseñando dónde está el dado
      this.api.after(1600, function () { if (!self.busy) self.api.hand(self.die, null); });
    }
  },

  // ---- dado ----
  _roll: function () {
    if (this.busy) return;
    this.busy = true;
    var self = this, api = this.api;

    var steps = this._nextStar() - this.pos; // 1..3 siempre
    var result = 1 + Math.floor(Math.random() * Math.min(3, steps));

    this.die.classList.add('rolling');
    var flips = 7;
    var flip = function (k) {
      self._setFace(1 + Math.floor(Math.random() * 3));
      Sound.play('click');
      if (k < flips) api.after(110, function () { flip(k + 1); });
      else api.after(140, settle);
    };
    var settle = function () {
      self.die.classList.remove('rolling');
      self.die.classList.add('off'); // se apaga mientras Cami camina
      self._setFace(result);
      Sound.play('ding');
      self.num.textContent = result;
      self.num.classList.remove('pop'); void self.num.offsetWidth; self.num.classList.add('pop');
      Voz.speak('¡' + self._cap(self.WORDS[result]) + '!');
      api.after(850, function () { self._move(result); });
    };
    flip(0);
  },

  _setFace: function (n) {
    var dots = this.DOTS[n] || [];
    var html = '';
    for (var i = 0; i < dots.length; i++) {
      html += '<span class="die-dot" style="left:' + dots[i][0] + '%;top:' + dots[i][1] + '%"></span>';
    }
    this.face.innerHTML = html;
  },

  _nextStar: function () {
    for (var i = 0; i < this.STARS.length; i++) {
      if (this.STARS[i] > this.pos) return this.STARS[i];
    }
    return this.TILES.length - 1;
  },

  // ---- movimiento ----
  _placeToken: function (i) {
    this.token.style.left = (this.TILES[i][0] - 60) + 'px';
    this.token.style.top = (this.TILES[i][1] - 140) + 'px';
  },

  _hopOnce: function (say) {
    this.pos++;
    this._placeToken(this.pos);
    this.tokenIn.classList.remove('hop'); void this.tokenIn.offsetWidth; this.tokenIn.classList.add('hop');
    Sound.play('pop');
    if (say) Voz.speak(say);
  },

  _move: function (n) {
    var self = this, api = this.api;
    var k = 0;
    var hop = function () {
      k++;
      self._hopOnce(self.WORDS[k]); // cuenta cada brinco en voz alta
      if (k < n) api.after(520, hop);
      else api.after(480, function () { self._arrive(); });
    };
    hop();
  },

  _arrive: function () {
    var self = this, api = this.api;
    var t = this.pos;
    var tile = this.tiles[t];
    tile.classList.remove('stomp'); void tile.offsetWidth; tile.classList.add('stomp');
    var x = this.TILES[t][0], y = this.TILES[t][1];

    // casilla estrella: cierra la ronda
    if (this.STARS.indexOf(t) !== -1) {
      var star = tile.querySelector('.tstar');
      if (star) star.classList.add('got');
      Confetti.starPop(x, y - 30);
      var say = (t === 15) ? '¡Llegaste a la casita de Lola!' : '¡Una estrella!';
      if (t === 15) this.goalLola.classList.add('cheer');
      api.after(250, function () {
        api.correct(x, y - 60, { say: say });
        api.after(950, function () { api.roundComplete(); });
      });
      // la estrella recogida deja una chispita en la casilla
      api.after(900, function () {
        if (star) { star.textContent = '✨'; star.className = 'deco'; }
      });
      return;
    }

    // casilla sorpresa
    var d = this.DECOR[t];
    if (d) {
      Voz.speak(this.SAY[d] || '');
      Sound.play(d === '🎵' ? 'ding' : 'sparkle');
      Confetti.burst(x, y - 40, { count: 12 });
      if (d === '🌈') {
        // brinco extra mágico (nunca cae en estrella: el arcoíris está a 2 de ella)
        api.after(950, function () {
          Sound.play('whoosh');
          self._hopOnce(null);
          api.after(520, function () { self._arrive(); });
        });
        return;
      }
      api.after(1100, function () { self._enableDie(); });
      return;
    }

    api.after(400, function () { self._enableDie(); });
  },

  _enableDie: function () {
    this.busy = false;
    this.die.classList.remove('off');
  },

  // casita de ensueño (misma estética que la del home)
  _house: function () {
    return '<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' +
      '<path d="M40 150 L150 60 L260 150 Z" fill="#ff4fa3"/>' +
      '<circle cx="120" cy="120" r="7" fill="#fff"/><circle cx="160" cy="110" r="7" fill="#fff"/>' +
      '<circle cx="190" cy="130" r="7" fill="#fff"/><circle cx="150" cy="140" r="7" fill="#fff"/>' +
      '<rect x="70" y="150" width="160" height="130" rx="10" fill="#ffe7f4"/>' +
      '<rect x="130" y="200" width="44" height="80" rx="8" fill="#ff7ec0"/>' +
      '<circle cx="165" cy="242" r="4" fill="#ffd23f"/>' +
      '<rect x="92" y="180" width="34" height="34" rx="6" fill="#aee9ff"/>' +
      '<rect x="178" y="180" width="34" height="34" rx="6" fill="#aee9ff"/>' +
      '<path d="M150 40 q-8 -10 -16 -2 q-6 6 16 22 q22 -16 16 -22 q-8 -8 -16 2z" fill="#ffd23f"/>' +
      '</svg>';
  },

  _cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },
  destroy: function () {}
};
