/* Confetti — sistema de partículas sobre el canvas #fx (coordenadas lógicas 1600x900).
   Tipos: burst (estallido), rain (lluvia), starPop. Formas: rect, star, heart. */
var Confetti = {
  canvas: null,
  ctx: null,
  parts: [],
  running: false,
  COLORS: ['#ff4fa3', '#ffd23f', '#5ec8ff', '#7ed957', '#ff8a5c', '#c77dff', '#fff'],

  init: function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  },

  _add: function (p) { this.parts.push(p); this._start(); },

  _rand: function (a, b) { return a + Math.random() * (b - a); },

  burst: function (x, y, opts) {
    opts = opts || {};
    var count = opts.count || 26;
    var colors = opts.colors || this.COLORS;
    var shapes = opts.shapes || ['rect', 'star', 'heart'];
    for (var i = 0; i < count; i++) {
      var ang = this._rand(0, Math.PI * 2);
      var sp = this._rand(6, 17);
      this._add({
        x: x, y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 6,
        g: 0.45,
        rot: this._rand(0, 6.28), vr: this._rand(-0.3, 0.3),
        size: this._rand(14, 26),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        life: 1
      });
    }
  },

  starPop: function (x, y) {
    for (var i = 0; i < 8; i++) {
      this._add({
        x: x, y: y,
        vx: this._rand(-5, 5), vy: this._rand(-14, -7),
        g: 0.5, rot: this._rand(0, 6.28), vr: this._rand(-0.4, 0.4),
        size: this._rand(18, 30), color: '#ffd23f', shape: 'star', life: 1
      });
    }
  },

  hearts: function (x, y, n) {
    n = n || 10;
    for (var i = 0; i < n; i++) {
      this._add({
        x: x, y: y,
        vx: this._rand(-6, 6), vy: this._rand(-15, -8),
        g: 0.4, rot: 0, vr: this._rand(-0.2, 0.2),
        size: this._rand(20, 34), color: ['#ff4fa3', '#ff8ac4', '#ff3d8b'][i % 3],
        shape: 'heart', life: 1
      });
    }
  },

  rain: function (durMs) {
    var self = this;
    var end = (durMs || 2500);
    var spawned = 0;
    var iv = setInterval(function () {
      for (var i = 0; i < 6; i++) {
        self._add({
          x: self._rand(0, 1600), y: -20,
          vx: self._rand(-1.5, 1.5), vy: self._rand(3, 7),
          g: 0.06, rot: self._rand(0, 6.28), vr: self._rand(-0.2, 0.2),
          size: self._rand(14, 28),
          color: self.COLORS[Math.floor(Math.random() * self.COLORS.length)],
          shape: ['rect', 'star', 'heart'][Math.floor(Math.random() * 3)],
          life: 1, fall: true
        });
      }
      spawned += 120;
      if (spawned >= end) clearInterval(iv);
    }, 120);
  },

  _start: function () {
    if (this.running) return;
    this.running = true;
    var self = this;
    var step = function () {
      var ctx = self.ctx;
      ctx.clearRect(0, 0, 1600, 900);
      for (var i = self.parts.length - 1; i >= 0; i--) {
        var p = self.parts[i];
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (!p.fall) p.life -= 0.012;
        if (p.life <= 0 || p.y > 980) { self.parts.splice(i, 1); continue; }
        if (p.fall && p.y > 920) { self.parts.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.color;
        self._shape(ctx, p);
        ctx.restore();
      }
      if (self.parts.length > 0) { requestAnimationFrame(step); }
      else { ctx.clearRect(0, 0, 1600, 900); self.running = false; }
    };
    requestAnimationFrame(step);
  },

  _shape: function (ctx, p) {
    var s = p.size;
    if (p.shape === 'rect') {
      ctx.fillRect(-s / 2, -s / 3, s, s * 0.66);
    } else if (p.shape === 'star') {
      this._poly(ctx, s / 2);
    } else { // heart
      ctx.beginPath();
      var k = s / 30;
      ctx.moveTo(0, 6 * k);
      ctx.bezierCurveTo(0, 2 * k, -7 * k, -6 * k, -13 * k, -1 * k);
      ctx.bezierCurveTo(-20 * k, 6 * k, -2 * k, 16 * k, 0, 20 * k);
      ctx.bezierCurveTo(2 * k, 16 * k, 20 * k, 6 * k, 13 * k, -1 * k);
      ctx.bezierCurveTo(7 * k, -6 * k, 0, 2 * k, 0, 6 * k);
      ctx.fill();
    }
  },

  _poly: function (ctx, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var rad = (i % 2 === 0) ? r : r * 0.45;
      var a = Math.PI / 5 * i - Math.PI / 2;
      var x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  }
};
