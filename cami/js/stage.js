/* Stage — escenario lógico fijo 1600x900 escalado para caber en cualquier viewport. */
var Stage = {
  W: 1600,
  H: 900,
  scale: 1,
  el: null,

  init: function () {
    this.el = document.getElementById('stage');
    this.fit();
    var self = this;
    window.addEventListener('resize', function () { self.fit(); });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () { self.fit(); });
    }
    window.addEventListener('orientationchange', function () {
      setTimeout(function () { self.fit(); }, 200);
    });
  },

  fit: function () {
    var s = Math.min(window.innerWidth / this.W, window.innerHeight / this.H);
    this.scale = s;
    if (this.el) this.el.style.transform = 'scale(' + s + ')';
  },

  // coordenadas de cliente -> coordenadas lógicas del escenario
  toStage: function (clientX, clientY) {
    var r = this.el.getBoundingClientRect();
    return { x: (clientX - r.left) / this.scale, y: (clientY - r.top) / this.scale };
  },

  // centro lógico de un elemento (para confeti, etc.)
  centerOf: function (el) {
    var r = el.getBoundingClientRect();
    return this.toStage(r.left + r.width / 2, r.top + r.height / 2);
  },

  // ¿soporta pantalla completa?
  canFullscreen: function () {
    return !!(document.documentElement.requestFullscreen ||
              document.documentElement.webkitRequestFullscreen);
  },

  isFullscreen: function () {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  },

  toggleFullscreen: function () {
    var d = document.documentElement;
    if (!this.isFullscreen()) {
      var req = d.requestFullscreen || d.webkitRequestFullscreen;
      if (req) {
        var p = req.call(d);
        var lock = function () {
          try {
            if (screen.orientation && screen.orientation.lock)
              screen.orientation.lock('landscape').catch(function () {});
          } catch (e) {}
        };
        if (p && p.then) p.then(lock).catch(function () {}); else lock();
      }
    } else {
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
    }
  }
};
