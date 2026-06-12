/* home.js — pantalla de inicio: casa de ensueño, Cami + Lola, y la cuadrícula de juegos. */
var Home = {
  ORDER: ['burbujas', 'animales', 'cucu', 'figuras', 'colores', 'tamanos', 'numeros', 'rompecabezas', 'caminito'],

  build: function (scene) {
    var self = this;
    scene.innerHTML = '';

    var sky = document.createElement('div');
    sky.className = 'home-sky';
    sky.innerHTML =
      this._sun() +
      '<div class="home-cloud" style="top:90px; animation-delay:-4s">☁️</div>' +
      '<div class="home-cloud" style="top:180px; font-size:70px; animation-delay:-16s">☁️</div>' +
      this._house();
    scene.appendChild(sky);

    var title = document.createElement('div');
    title.className = 'home-title';
    title.innerHTML = '<span class="spark">✨</span> Cami <span class="spark">✨</span>';
    scene.appendChild(title);

    // cuadrícula de juegos
    var grid = document.createElement('div');
    grid.className = 'home-grid';
    for (var i = 0; i < this.ORDER.length; i++) {
      var id = this.ORDER[i];
      var game = window.GAMES[id];
      if (!game) continue;
      grid.appendChild(this._tile(game));
    }
    scene.appendChild(grid);

    // Cami + Lola
    var cami = document.createElement('div');
    cami.className = 'home-cami';
    cami.innerHTML = Art.cami({ blink: true });
    cami.addEventListener('click', function () {
      Sound.play('pop'); Voz.speak('¡Hola, soy Cami! ¿Jugamos?');
      cami.style.animation = 'none'; void cami.offsetWidth; cami.style.animation = '';
    });
    scene.appendChild(cami);

    var lola = document.createElement('div');
    lola.className = 'home-lola';
    lola.innerHTML = Art.lola();
    lola.addEventListener('click', function () {
      Sound.play('sparkle'); Voz.speak('¡Hola! Soy Lola.');
    });
    scene.appendChild(lola);

    // botones de esquina
    var corner = document.createElement('div');
    corner.className = 'corner-btns';

    var mute = document.createElement('button');
    mute.className = 'corner-btn';
    var setMute = function () { mute.textContent = Save.muted ? '🔇' : '🔊'; };
    setMute();
    mute.addEventListener('click', function () {
      Save.muted = !Save.muted; setMute();
      if (!Save.muted) Sound.play('ding');
    });
    corner.appendChild(mute);

    if (Stage.canFullscreen()) {
      var fs = document.createElement('button');
      fs.className = 'corner-btn';
      fs.textContent = '⛶';
      fs.addEventListener('click', function () { Sound.play('click'); Stage.toggleFullscreen(); });
      corner.appendChild(fs);
    }
    scene.appendChild(corner);
  },

  _tile: function (game) {
    var t = document.createElement('button');
    t.className = 'tile';
    t.style.background = 'linear-gradient(160deg, ' + this._lighten(game.color) + ', ' + game.color + ')';

    var stars = Math.min(3, Save.getStars(game.id));
    var starsHtml = '';
    for (var i = 0; i < 3; i++) {
      starsHtml += '<span class="s' + (i < stars ? ' on' : '') + '">' + Art.star() + '</span>';
    }

    t.innerHTML =
      '<span class="shine"></span>' +
      '<span class="tile-icon">' + game.icon + '</span>' +
      '<span class="tile-name">' + game.title + '</span>' +
      '<span class="tile-stars">' + starsHtml + '</span>';

    t.addEventListener('click', function () {
      Sound.play('pop'); Voz.speak(game.title);
      Shell.after ? Shell.after(260, function () { Shell.startGame(game.id); })
                  : setTimeout(function () { Shell.startGame(game.id); }, 260);
    });
    return t;
  },

  _lighten: function (hex) {
    // mezcla con blanco para el degradado superior del tile
    try {
      var c = hex.replace('#', '');
      var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
      r = Math.round(r + (255 - r) * 0.5); g = Math.round(g + (255 - g) * 0.5); b = Math.round(b + (255 - b) * 0.5);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } catch (e) { return '#fff'; }
  },

  _sun: function () {
    return '<svg class="home-sun" viewBox="0 0 180 180">' +
      '<g class="rays"><g fill="#ffd23f">' +
      this._rays() + '</g></g>' +
      '<circle cx="90" cy="90" r="50" fill="#ffe169"/>' +
      '<circle cx="76" cy="84" r="6" fill="#c99a1e"/><circle cx="104" cy="84" r="6" fill="#c99a1e"/>' +
      '<path d="M74 102 q16 16 32 0" fill="none" stroke="#c99a1e" stroke-width="5" stroke-linecap="round"/>' +
      '</svg>';
  },
  _rays: function () {
    var s = '';
    for (var i = 0; i < 12; i++) {
      var a = i * 30 * Math.PI / 180;
      var x = 90 + Math.cos(a) * 70, y = 90 + Math.sin(a) * 70;
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9"/>';
    }
    return s;
  },

  _house: function () {
    return '<svg class="home-house" viewBox="0 0 300 300">' +
      // techo con lunares
      '<path d="M40 150 L150 60 L260 150 Z" fill="#ff4fa3"/>' +
      '<circle cx="120" cy="120" r="7" fill="#fff"/><circle cx="160" cy="110" r="7" fill="#fff"/>' +
      '<circle cx="190" cy="130" r="7" fill="#fff"/><circle cx="150" cy="140" r="7" fill="#fff"/>' +
      // cuerpo
      '<rect x="70" y="150" width="160" height="130" rx="10" fill="#ffe7f4"/>' +
      // puerta
      '<rect x="130" y="200" width="44" height="80" rx="8" fill="#ff7ec0"/>' +
      '<circle cx="165" cy="242" r="4" fill="#ffd23f"/>' +
      // ventanas
      '<rect x="92" y="180" width="34" height="34" rx="6" fill="#aee9ff"/>' +
      '<rect x="178" y="180" width="34" height="34" rx="6" fill="#aee9ff"/>' +
      // corazón en el techo
      '<path d="M150 40 q-8 -10 -16 -2 q-6 6 16 22 q22 -16 16 -22 q-8 -8 -16 2z" fill="#ffd23f"/>' +
      '</svg>';
  }
};
