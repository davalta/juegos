/* characters.js — Cami, Lola y los iconos SVG reutilizables.
   Todo es arte original; los guiños (moño de lunares, orejas redondas) son
   reinterpretaciones genéricas, sin usar personajes ni marcas registradas. */
var Art = {

  // moño de lunares (guiño glam) — se incrusta en otros SVG
  bow: function (cx, cy, scale, color) {
    color = color || '#ff3d8b';
    var s = scale || 1;
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')">' +
      '<path d="M0 0 L-34 -20 Q-46 -2 -34 18 Z" fill="' + color + '"/>' +
      '<path d="M0 0 L34 -20 Q46 -2 34 18 Z" fill="' + color + '"/>' +
      '<circle cx="0" cy="-1" r="11" fill="#e62e78"/>' +
      '<circle cx="-25" cy="-9" r="3.4" fill="#fff"/>' +
      '<circle cx="-22" cy="6" r="3.4" fill="#fff"/>' +
      '<circle cx="25" cy="-9" r="3.4" fill="#fff"/>' +
      '<circle cx="22" cy="6" r="3.4" fill="#fff"/>' +
      '</g>';
  },

  // Cami — niña castaña, piel clara, coletas, moño de lunares, vestido rosa.
  cami: function (opts) {
    opts = opts || {};
    var cls = opts.blink ? ' class="blink-eyes"' : '';
    return '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' +
      // coletas
      '<ellipse cx="46" cy="120" rx="26" ry="46" fill="#7a4a25"/>' +
      '<ellipse cx="154" cy="120" rx="26" ry="46" fill="#7a4a25"/>' +
      '<circle cx="46" cy="86" r="14" fill="#8a5630"/>' +
      '<circle cx="154" cy="86" r="14" fill="#8a5630"/>' +
      // piernas
      '<rect x="84" y="232" width="14" height="44" rx="7" fill="#ffe0c2"/>' +
      '<rect x="102" y="232" width="14" height="44" rx="7" fill="#ffe0c2"/>' +
      '<ellipse cx="89" cy="282" rx="16" ry="10" fill="#ff5fae"/>' +
      '<ellipse cx="111" cy="282" rx="16" ry="10" fill="#ff5fae"/>' +
      // vestido
      '<path d="M100 150 L60 248 Q100 268 140 248 Z" fill="#ff5fae"/>' +
      '<path d="M100 150 L60 248 Q100 262 140 248 Z" fill="#ff7ec0" opacity=".5"/>' +
      '<circle cx="84" cy="220" r="4" fill="#fff"/><circle cx="108" cy="232" r="4" fill="#fff"/>' +
      '<circle cx="120" cy="210" r="4" fill="#fff"/><circle cx="80" cy="200" r="4" fill="#fff"/>' +
      // brazos
      '<rect x="58" y="162" width="13" height="46" rx="6.5" fill="#ffe0c2" transform="rotate(18 64 162)"/>' +
      '<rect x="129" y="162" width="13" height="46" rx="6.5" fill="#ffe0c2" transform="rotate(-18 135 162)"/>' +
      // cuello + cabeza
      '<rect x="92" y="138" width="16" height="18" fill="#ffe0c2"/>' +
      '<circle cx="100" cy="100" r="52" fill="#ffe0c2"/>' +
      // cabello (fleco)
      '<path d="M52 96 q48 -64 96 0 q-14 -26 -48 -26 q-34 0 -48 26z" fill="#7a4a25"/>' +
      '<path d="M52 96 q4 -10 0 -26 q-12 18 -6 34z" fill="#7a4a25"/>' +
      '<path d="M148 96 q-4 -10 0 -26 q12 18 6 34z" fill="#7a4a25"/>' +
      // ojos
      '<g' + cls + '>' +
      '<circle cx="82" cy="100" r="9" fill="#3a2417"/>' +
      '<circle cx="118" cy="100" r="9" fill="#3a2417"/>' +
      '<circle cx="85" cy="96" r="3" fill="#fff"/>' +
      '<circle cx="121" cy="96" r="3" fill="#fff"/>' +
      '</g>' +
      // cachetes + sonrisa
      '<circle cx="70" cy="116" r="8" fill="#ff9ec4" opacity=".7"/>' +
      '<circle cx="130" cy="116" r="8" fill="#ff9ec4" opacity=".7"/>' +
      '<path d="M84 120 q16 14 32 0" fill="none" stroke="#c43a6e" stroke-width="4" stroke-linecap="round"/>' +
      // moño
      this.bow(100, 58, 1, '#ff3d8b') +
      '</svg>';
  },

  // Lola — ratoncita con orejas redondas y moño de lunares.
  lola: function (opts) {
    opts = opts || {};
    return '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' +
      // orejas
      '<circle cx="56" cy="60" r="40" fill="#6b6b73"/>' +
      '<circle cx="144" cy="60" r="40" fill="#6b6b73"/>' +
      '<circle cx="56" cy="60" r="24" fill="#8a8a92"/>' +
      '<circle cx="144" cy="60" r="24" fill="#8a8a92"/>' +
      // cuerpo
      '<ellipse cx="100" cy="180" rx="46" ry="48" fill="#6b6b73"/>' +
      '<ellipse cx="100" cy="190" rx="30" ry="32" fill="#d9d2da"/>' +
      // cabeza
      '<circle cx="100" cy="112" r="56" fill="#6b6b73"/>' +
      '<ellipse cx="100" cy="132" rx="34" ry="28" fill="#e7dfe6"/>' +
      // ojos
      '<circle cx="82" cy="104" r="9" fill="#2a2230"/>' +
      '<circle cx="118" cy="104" r="9" fill="#2a2230"/>' +
      '<circle cx="85" cy="100" r="3" fill="#fff"/>' +
      '<circle cx="121" cy="100" r="3" fill="#fff"/>' +
      // nariz + sonrisa
      '<ellipse cx="100" cy="124" rx="8" ry="6" fill="#ff3d8b"/>' +
      '<path d="M86 134 q14 12 28 0" fill="none" stroke="#5a4a55" stroke-width="3.5" stroke-linecap="round"/>' +
      // cachetes
      '<circle cx="72" cy="128" r="7" fill="#ff9ec4" opacity=".7"/>' +
      '<circle cx="128" cy="128" r="7" fill="#ff9ec4" opacity=".7"/>' +
      // moño entre las orejas
      this.bow(100, 48, 0.9, '#ff3d8b') +
      '</svg>';
  },

  // ===== iconos =====
  star: function () {
    return '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l2.9 6.2 6.8.7-5 4.6 1.4 6.7L12 17.8 5.9 20.2l1.4-6.7-5-4.6 6.8-.7z"/></svg>';
  },
  house: function () {
    return '<svg viewBox="0 0 24 24"><path fill="#ff4fa3" d="M12 3l9 8h-3v9h-4v-5h-4v5H6v-9H3z"/></svg>';
  },
  replay: function () {
    return '<svg viewBox="0 0 24 24"><path fill="#ff4fa3" d="M12 5V2L7 7l5 5V8a5 5 0 1 1-5 5H4a8 8 0 1 0 8-8z"/></svg>';
  },
  heartIcon: function (color) {
    color = color || '#ff4fa3';
    return '<svg viewBox="0 0 24 24"><path fill="' + color + '" d="M12 21s-7-4.6-9.5-8.2C.9 10.2 1.6 6.8 4.6 5.6c2-.8 3.9.1 4.9 1.6 1-1.5 2.9-2.4 4.9-1.6 3 1.2 3.7 4.6 2.1 7.2C19 16.4 12 21 12 21z"/></svg>';
  },

  // Cami "porrista": aparece en una esquina del juego, hace una animación cada
  // cierto tiempo y brinca con cada acierto (shell le pone .cheer).
  addCheer: function (parent, css) {
    var c = document.createElement('div');
    c.className = 'game-cami';
    if (css) c.style.cssText = css;
    c.innerHTML = this.cami({ blink: true });
    parent.appendChild(c);
    return c;
  }
};
