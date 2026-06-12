/* Números — Lola pide N quesitos pero hay MÁS en la mesa: hay que darle
   exactamente los que pidió (conteo 1-3 + noción de cantidad exacta).
   Si le ofrecen de más, Lola dice que ya está llena. */
GAMES['numeros'] = {
  id: 'numeros',
  title: 'A contar',
  intro: '¡Dale de comer a Lola!',
  color: '#ffd23f',
  icon: '🔢',
  rounds: 5,

  COUNTS: [1, 2, 3, 2, 3],
  PLATES: 4,
  WORDS: ['', 'uno', 'dos', 'tres', 'cuatro'],

  init: function (scene, api) {
    this.api = api; this.root = scene;
    var wrap = document.createElement('div');
    wrap.className = 'g-numeros';
    wrap.innerHTML =
      '<div class="num-lola" id="num-lola">' + Art.lola() +
        '<div class="num-mouth" id="num-mouth"></div></div>' +
      '<div class="num-bubble" id="num-bubble"></div>' +
      '<div class="num-plates" id="num-plates"></div>' +
      '<div class="num-big" id="num-big"></div>';
    scene.appendChild(wrap);
    this.lola = wrap.querySelector('#num-lola');
    this.mouth = wrap.querySelector('#num-mouth');
    this.bubble = wrap.querySelector('#num-bubble');
    this.plates = wrap.querySelector('#num-plates');
    this.big = wrap.querySelector('#num-big');
    Art.addCheer(wrap, 'left:8px;bottom:0;width:170px;height:238px;');
  },

  nextRound: function (i) {
    this.plates.innerHTML = '';
    this.bubble.innerHTML = '';
    this.big.textContent = '';
    this.count = 0;
    var N = this.COUNTS[i % this.COUNTS.length];
    this.total = N;
    var self = this;

    // burbuja de pensamiento con la meta (menos quesitos de los que hay)
    var goal = '';
    for (var g = 0; g < N; g++) goal += '🧀';
    this.bubble.innerHTML = '<div class="bubble-in">' + goal + '</div>';
    Voz.speak('Lola quiere ' + (N === 1 ? 'un quesito' : this.WORDS[N] + ' quesitos') + '. ¡Solo ' + this.WORDS[N] + '!');

    // pista: manita del primer quesito visible a la boca (voz solo una vez)
    this.api.idleHint(8000, function () {
      if (self.count >= self.total) return;
      var qs = self.plates.querySelectorAll('.quesito');
      for (var p = 0; p < qs.length; p++) {
        if (qs[p].style.visibility !== 'hidden') {
          self.api.hand(qs[p], self.mouth);
          self.api.hintSpeak('Dale el quesito a Lola');
          return;
        }
      }
    });

    // siempre hay 4 quesitos: el reto es PARAR en N
    var xs = [240, 460, 680, 900];
    for (var p = 0; p < this.PLATES; p++) {
      (function (x, idx) {
        var q = document.createElement('div');
        q.className = 'quesito';
        q.style.left = x + 'px';
        q.style.bottom = (140 + (idx % 2) * 26) + 'px';
        q.innerHTML = '<span>🧀</span><span class="plate"></span>';
        self.plates.appendChild(q);
        self.api.drag(q, {
          data: {},
          inflate: 80,
          getTargets: function () { return [{ el: self.mouth, data: {} }]; },
          accepts: function () { return self.count < self.total; },
          onCorrect: function (el) {
            el.style.visibility = 'hidden';
            Sound.play('chomp');
            self.lola.classList.remove('chomp'); void self.lola.offsetWidth; self.lola.classList.add('chomp');
            self.count++;
            self._popNum(self.count);
            var c = Stage.centerOf(self.lola);
            Confetti.hearts(c.x, c.y - 80, 4);
            if (self.count >= self.total) {
              self.api.after(700, function () {
                self.api.correct(c.x, c.y - 80, { say: '¡' + (self.total === 1 ? 'Un quesito' : self._cap(self.WORDS[self.total]) + ' quesitos') + '! ¡Ñam ñam! ¡Justo lo que quería!' });
                // los quesitos sobrantes siguen un momento: si Cami ofrece otro,
                // Lola enseña "ya comí" antes de cerrar la ronda
                self.api.after(2000, function () {
                  self._fadeLeftovers();
                  self.api.after(600, function () { self.api.roundComplete(); });
                });
              });
            } else {
              Voz.speak('¡' + self._cap(self.WORDS[self.count]) + '!');
            }
          },
          onWrong: function (el) {
            // Lola ya está llena: enseña la noción de "exactamente N"
            self.lola.classList.remove('wiggle'); void self.lola.offsetWidth; self.lola.classList.add('wiggle');
            Sound.play('boing');
            Voz.speak('¡No, no! Ya comí ' + self.WORDS[self.total] + '. ¡Gracias, Cami!');
          }
        });
      })(xs[p], p);
    }
  },

  _fadeLeftovers: function () {
    var qs = this.plates.querySelectorAll('.quesito');
    for (var p = 0; p < qs.length; p++) {
      if (qs[p].style.visibility !== 'hidden') {
        qs[p].style.transition = 'opacity .6s';
        qs[p].style.opacity = '0.35';
        qs[p].style.pointerEvents = 'none';
      }
    }
  },

  _popNum: function (n) {
    this.big.textContent = n;
    this.big.classList.remove('pop'); void this.big.offsetWidth; this.big.classList.add('pop');
  },

  _cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },
  destroy: function () {}
};
