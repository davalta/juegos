/* Tamaños — dar lo grande a Cami y lo pequeño a Lola (concepto grande/pequeño). */
GAMES['tamanos'] = {
  id: 'tamanos',
  title: 'Grande y chico',
  intro: '¡Lo grande para Cami, lo chico para Lola!',
  color: '#9d7bff',
  icon: '🧸',
  rounds: 5,

  ITEMS: [
    ['⚽', 'la pelota'], ['🎩', 'el sombrero'], ['🌸', 'la flor'],
    ['🍪', 'la galleta'], ['🎈', 'el globo']
  ],

  init: function (scene, api) {
    this.api = api; this.scene = scene;
    var wrap = document.createElement('div');
    wrap.className = 'g-tamanos';
    wrap.innerHTML =
      '<div class="tam-char tam-cami" id="tam-cami">' + Art.cami({ blink: true }) +
        '<div class="tam-label">Cami</div></div>' +
      '<div class="tam-char tam-lola" id="tam-lola">' + Art.lola() +
        '<div class="tam-label">Lola</div></div>' +
      '<div class="tam-tray-zone"></div>';
    scene.appendChild(wrap);
    this.cami = wrap.querySelector('#tam-cami');
    this.lola = wrap.querySelector('#tam-lola');
    this.zone = wrap.querySelector('.tam-tray-zone');
  },

  nextRound: function (i) {
    this.zone.innerHTML = '';
    this.delivered = 0;
    this.trays = [];
    var item = this.ITEMS[i % this.ITEMS.length];
    var self = this;

    // pista: manita del primer objeto pendiente a su personaje
    this.api.idleHint(8000, function () {
      for (var p = 0; p < self.trays.length; p++) {
        var tr = self.trays[p];
        if (tr.done) continue;
        var who = tr.size === 'big' ? self.cami : self.lola;
        self.api.hand(tr.el, who);
        Voz.speak(tr.size === 'big' ? 'Lo grande para Cami' : 'Lo chico para Lola');
        return;
      }
    });

    var defs = [
      { size: 'big', emoji: item[0], cls: 'big', x: 300, y: 250 },
      { size: 'small', emoji: item[0], cls: 'small', x: 330, y: 560 }
    ];

    for (var d = 0; d < defs.length; d++) {
      (function (def) {
        var tray = document.createElement('div');
        tray.className = 'size-tray ' + def.cls;
        tray.style.left = def.x + 'px';
        tray.style.top = def.y + 'px';
        tray.innerHTML = '<span class="size-emoji">' + def.emoji + '</span>';
        self.zone.appendChild(tray);
        var rec = { el: tray, size: def.size, done: false };
        self.trays.push(rec);
        self.api.drag(tray, {
          data: { size: def.size },
          inflate: 60,
          getTargets: function () {
            return [
              { el: self.cami, data: { size: 'big' } },
              { el: self.lola, data: { size: 'small' } }
            ];
          },
          accepts: function (dd, t) { return dd.size === t.size; },
          onCorrect: function (el, target) {
            el.style.visibility = 'hidden';
            rec.done = true;
            var who = target.el === self.cami ? self.cami : self.lola;
            who.classList.remove('hug'); void who.offsetWidth; who.classList.add('hug');
            var c = Stage.centerOf(who);
            var word = def.size === 'big' ? '¡Grande! Para Cami. ¡Gracias!' : '¡Chico! Para Lola. ¡Gracias!';
            self.api.correct(c.x, c.y, { say: word });
            self.delivered++;
            if (self.delivered >= 2) {
              self.cami.classList.add('dance'); self.lola.classList.add('dance');
              self.api.after(800, function () { self.api.roundComplete(); });
            }
          },
          onWrong: function (el, target) {
            var msg = (target.el === self.cami) ? 'Eso es muy chico para Cami' : 'Eso es muy grande para Lola';
            self.api.wrong(target.el, { say: msg });
          }
        });
      })(defs[d]);
    }
  },

  destroy: function () {
    if (this.cami) this.cami.classList.remove('dance', 'hug');
    if (this.lola) this.lola.classList.remove('dance', 'hug');
  }
};
