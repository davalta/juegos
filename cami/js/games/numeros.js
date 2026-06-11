/* Números — darle N quesitos a Lola contando en voz alta 1-2-3 (conteo temprano). */
GAMES['numeros'] = {
  id: 'numeros',
  title: 'A contar',
  intro: '¡Dale de comer a Lola!',
  color: '#ffd23f',
  icon: '🔢',
  rounds: 5,

  COUNTS: [1, 2, 2, 3, 3],
  WORDS: ['', 'uno', 'dos', 'tres'],

  init: function (scene, api) {
    this.api = api; this.scene = scene;
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
  },

  nextRound: function (i) {
    this.plates.innerHTML = '';
    this.bubble.innerHTML = '';
    this.big.textContent = '';
    this.count = 0;
    var N = this.COUNTS[i % this.COUNTS.length];
    this.total = N;
    var self = this;

    // burbuja de pensamiento con la meta
    var goal = '';
    for (var g = 0; g < N; g++) goal += '🧀';
    this.bubble.innerHTML = '<div class="bubble-in">' + goal + '</div>';
    Voz.speak('Lola quiere ' + this.WORDS[N] + (N === 1 ? ' quesito' : ' quesitos'));

    // pista: manita del primer quesito visible a la boca de Lola
    this.api.idleHint(8000, function () {
      var qs = self.plates.querySelectorAll('.quesito');
      for (var p = 0; p < qs.length; p++) {
        if (qs[p].style.visibility !== 'hidden') {
          self.api.hand(qs[p], self.mouth);
          Voz.speak('Dale el quesito a Lola');
          return;
        }
      }
    });

    var xs = N === 1 ? [400] : (N === 2 ? [320, 560] : [240, 470, 700]);
    for (var p = 0; p < N; p++) {
      (function (x) {
        var q = document.createElement('div');
        q.className = 'quesito';
        q.style.left = x + 'px';
        q.innerHTML = '<span>🧀</span><span class="plate"></span>';
        self.plates.appendChild(q);
        self.api.drag(q, {
          data: {},
          inflate: 80,
          getTargets: function () { return [{ el: self.mouth, data: {} }]; },
          accepts: function () { return true; },
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
                self.api.correct(c.x, c.y - 80, { say: '¡' + self._cap(self.WORDS[self.total]) + (self.total === 1 ? ' quesito' : ' quesitos') + '! ¡Ñam ñam!' });
                self.api.after(700, function () { self.api.roundComplete(); });
              });
            } else {
              Voz.speak('¡' + self._cap(self.WORDS[self.count]) + '!');
            }
          }
        });
      })(xs[p]);
    }
  },

  _popNum: function (n) {
    this.big.textContent = n;
    this.big.classList.remove('pop'); void this.big.offsetWidth; this.big.classList.add('pop');
  },

  _cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },
  destroy: function () {}
};
