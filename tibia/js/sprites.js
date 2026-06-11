// sprites.js — all pixel art, generated procedurally into 16x16 offscreen canvases.
// Original art inspired by Tibia's style; no CipSoft assets are used.

import { T } from './config.js';
import { mulberry32 } from './state.js';

const S = 16; // source sprite resolution; drawn x2 at render time

export const sprites = {
  terrain: {},   // tile type -> canvas
  objects: {},   // name -> canvas (transparent bg, drawn over terrain)
  hero: [],      // dir -> canvas
  creatures: {}, // name -> canvas
  items: {},     // id -> canvas
  fx: {},        // name -> canvas
};

function makeCanvas(w = S, h = S) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function block(x, c, px, py, w, h, color) {
  x.fillStyle = color;
  x.fillRect(px, py, w, h);
}

// rect with 1px dark border + inset fill
function panel(x, px, py, w, h, fill, border = '#1c130a') {
  x.fillStyle = border; x.fillRect(px, py, w, h);
  x.fillStyle = fill; x.fillRect(px + 1, py + 1, w - 2, h - 2);
}

function dot(x, px, py, color) { x.fillStyle = color; x.fillRect(px, py, 1, 1); }

// ---------------------------------------------------------------- terrain
function terrainTile(base, specks, opts = {}) {
  const c = makeCanvas(); const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  const rng = mulberry32(opts.seed || 1234);
  for (const s of specks) {
    for (let i = 0; i < s.count; i++) {
      const px = Math.floor(rng() * S), py = Math.floor(rng() * S);
      dot(x, px, py, s.color);
    }
  }
  if (opts.ripple) { // water lines
    x.fillStyle = opts.ripple;
    x.fillRect(2, 4, 5, 1); x.fillRect(9, 9, 4, 1); x.fillRect(4, 12, 3, 1);
  }
  return c;
}

function buildTerrain() {
  sprites.terrain[T.GRASS] = terrainTile('#5a9a3a', [
    { color: '#74b84a', count: 40 }, { color: '#3f7327', count: 28 },
    { color: '#4f8a32', count: 30 },
  ], { seed: 7 });
  sprites.terrain[T.FOREST] = terrainTile('#3f7327', [
    { color: '#2f5a20', count: 50 }, { color: '#4f8a32', count: 24 },
  ], { seed: 11 });
  sprites.terrain[T.DIRT] = terrainTile('#b9924f', [
    { color: '#7c5d2e', count: 36 }, { color: '#d8b46a', count: 22 },
  ], { seed: 13 });
  sprites.terrain[T.STONE] = terrainTile('#8a8a82', [
    { color: '#6b6b63', count: 30 }, { color: '#a9a99f', count: 18 },
  ], { seed: 17 });
  // draw mortar grid on stone for a flagstone look
  {
    const x = sprites.terrain[T.STONE].getContext('2d');
    x.fillStyle = '#5c5c55';
    x.fillRect(0, 7, S, 1); x.fillRect(7, 0, 1, 8); x.fillRect(11, 8, 1, 8);
  }
  sprites.terrain[T.SAND] = terrainTile('#d8c272', [
    { color: '#b59f50', count: 28 }, { color: '#e6d488', count: 20 },
  ], { seed: 19 });
  sprites.terrain[T.CAVE] = terrainTile('#4a4640', [
    { color: '#322f2a', count: 44 }, { color: '#5a564e', count: 16 },
  ], { seed: 23 });
  sprites.terrain[T.ROCK] = terrainTile('#6f685d', [
    { color: '#9a9388', count: 26 }, { color: '#4d473e', count: 30 },
  ], { seed: 29 });
  // mountain face shading
  {
    const x = sprites.terrain[T.ROCK].getContext('2d');
    x.fillStyle = '#4d473e'; x.fillRect(0, 0, S, 2);
    x.fillStyle = '#8a8377'; x.fillRect(0, 13, S, 3);
  }
  sprites.terrain[T.WATER] = terrainTile('#3a6ea5', [
    { color: '#27507e', count: 40 }, { color: '#4d7fb5', count: 20 },
  ], { seed: 31, ripple: '#7fb0e0' });
}

// ---------------------------------------------------------------- objects
function buildObjects() {
  // Tree: trunk + round canopy
  {
    const c = makeCanvas(); const x = c.getContext('2d');
    // trunk
    panel(x, 6, 10, 4, 6, '#7a4f28', '#3d2812');
    // canopy (layered greens)
    x.fillStyle = '#1f3d16'; x.beginPath(); x.arc(8, 6, 7, 0, 7); x.fill();
    x.fillStyle = '#2f5a20'; x.beginPath(); x.arc(8, 6, 6, 0, 7); x.fill();
    x.fillStyle = '#3f7327'; x.beginPath(); x.arc(7, 5, 4, 0, 7); x.fill();
    x.fillStyle = '#5a9a3a'; x.fillRect(5, 3, 2, 2);
    sprites.objects.tree = c;
  }
  // Stone wall block
  {
    const c = makeCanvas(); const x = c.getContext('2d');
    panel(x, 0, 0, 16, 16, '#7d7a70', '#46443c');
    x.fillStyle = '#5c5950';
    x.fillRect(0, 7, 16, 1); x.fillRect(8, 0, 1, 8); x.fillRect(4, 8, 1, 8); x.fillRect(12, 8, 1, 8);
    x.fillStyle = '#94918680'; x.fillRect(1, 1, 6, 1); x.fillRect(9, 8, 6, 1);
    sprites.objects.wall = c;
  }
  // Mountain boulder (blocking, drawn over rock)
  {
    const c = makeCanvas(); const x = c.getContext('2d');
    x.fillStyle = '#3d382f'; x.beginPath(); x.moveTo(1, 16); x.lineTo(5, 3); x.lineTo(11, 2); x.lineTo(15, 16); x.fill();
    x.fillStyle = '#6f685d'; x.beginPath(); x.moveTo(3, 16); x.lineTo(6, 5); x.lineTo(10, 4); x.lineTo(13, 16); x.fill();
    x.fillStyle = '#8f887b'; x.beginPath(); x.moveTo(6, 5); x.lineTo(9, 5); x.lineTo(8, 10); x.fill();
    sprites.objects.mountain = c;
  }
  // Temple banner / brazier-ish marker (decoration, non-blocking)
  {
    const c = makeCanvas(); const x = c.getContext('2d');
    panel(x, 6, 8, 4, 8, '#5a3a1e', '#2c1d0e');   // post
    panel(x, 4, 1, 8, 8, '#b8322a', '#5d1812');   // banner
    x.fillStyle = '#f4c542'; x.fillRect(7, 3, 2, 4);
    sprites.objects.banner = c;
  }
  // Bush (non-blocking decoration)
  {
    const c = makeCanvas(); const x = c.getContext('2d');
    x.fillStyle = '#2f5a20'; x.beginPath(); x.arc(8, 11, 5, 0, 7); x.fill();
    x.fillStyle = '#3f7327'; x.beginPath(); x.arc(6, 10, 3, 0, 7); x.fill();
    x.fillStyle = '#5a9a3a'; x.fillRect(9, 8, 2, 2);
    sprites.objects.bush = c;
  }
}

// ---------------------------------------------------------------- hero
function drawHeroDown(x) {
  // legs / boots
  panel(x, 5, 12, 3, 4, '#5a3a1e', '#2c1d0e');
  panel(x, 8, 12, 3, 4, '#5a3a1e', '#2c1d0e');
  // tunic
  panel(x, 4, 7, 8, 6, '#3f6e2f', '#1f3d16');
  // belt
  block(x, 4, 11, 8, 1, '#5a3a1e');
  // arms
  panel(x, 3, 8, 2, 4, '#e3b07a', '#7a4f28');
  panel(x, 11, 8, 2, 4, '#e3b07a', '#7a4f28');
  // head
  panel(x, 5, 2, 6, 6, '#e3b07a', '#7a4f28');
  // hair
  block(x, 5, 2, 6, 2, '#6b4423');
  block(x, 5, 2, 1, 3, '#6b4423'); block(x, 10, 2, 1, 3, '#6b4423');
  // eyes
  dot(x, 6, 5, '#20140a'); dot(x, 9, 5, '#20140a');
}
function drawHeroUp(x) {
  panel(x, 5, 12, 3, 4, '#5a3a1e', '#2c1d0e');
  panel(x, 8, 12, 3, 4, '#5a3a1e', '#2c1d0e');
  panel(x, 4, 7, 8, 6, '#356026', '#1f3d16');
  block(x, 4, 11, 8, 1, '#5a3a1e');
  panel(x, 3, 8, 2, 4, '#e3b07a', '#7a4f28');
  panel(x, 11, 8, 2, 4, '#e3b07a', '#7a4f28');
  // back of head all hair
  panel(x, 5, 2, 6, 6, '#6b4423', '#3d2812');
}
function drawHeroSide(x) {
  // profile facing left
  panel(x, 6, 12, 4, 4, '#5a3a1e', '#2c1d0e'); // boots together
  panel(x, 5, 7, 7, 6, '#3f6e2f', '#1f3d16');  // tunic
  block(x, 5, 11, 7, 1, '#5a3a1e');
  panel(x, 4, 8, 2, 4, '#e3b07a', '#7a4f28');  // front arm
  panel(x, 5, 2, 6, 6, '#e3b07a', '#7a4f28');  // head
  block(x, 5, 2, 6, 2, '#6b4423');             // hair top
  block(x, 9, 2, 2, 4, '#6b4423');             // hair back
  dot(x, 6, 5, '#20140a');                     // one eye (front)
  dot(x, 4, 6, '#c0392b');                     // nose hint
}

function buildHero() {
  const down = makeCanvas(); drawHeroDown(down.getContext('2d'));
  const up = makeCanvas(); drawHeroUp(up.getContext('2d'));
  const left = makeCanvas(); drawHeroSide(left.getContext('2d'));
  const right = makeCanvas();
  { const x = right.getContext('2d'); x.translate(S, 0); x.scale(-1, 1); x.drawImage(left, 0, 0); }
  sprites.hero[0] = down;  // DIR.DOWN
  sprites.hero[1] = left;  // DIR.LEFT
  sprites.hero[2] = up;    // DIR.UP
  sprites.hero[3] = right; // DIR.RIGHT
}

// ---------------------------------------------------------------- creatures
function shadow(x) { x.fillStyle = 'rgba(0,0,0,0.22)'; x.beginPath(); x.ellipse(8, 14, 6, 2, 0, 0, 7); x.fill(); }

function buildCreatures() {
  // Rat — small gray with pink tail
  {
    const c = makeCanvas(); const x = c.getContext('2d'); shadow(x);
    panel(x, 4, 8, 8, 5, '#9a9a92', '#4a4a44'); // body
    panel(x, 10, 6, 4, 4, '#9a9a92', '#4a4a44'); // head
    block(x, 11, 5, 1, 2, '#6a6a62'); block(x, 13, 5, 1, 2, '#6a6a62'); // ears
    dot(x, 12, 8, '#20140a'); // eye
    x.fillStyle = '#d98fa0'; x.fillRect(1, 11, 4, 1); x.fillRect(1, 10, 1, 2); // tail
    block(x, 5, 13, 1, 2, '#4a4a44'); block(x, 9, 13, 1, 2, '#4a4a44'); // legs
    sprites.creatures.rat = c;
  }
  // Snake — green coil
  {
    const c = makeCanvas(); const x = c.getContext('2d'); shadow(x);
    x.strokeStyle = '#27602a'; x.lineWidth = 4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(3, 13); x.bezierCurveTo(2, 7, 9, 9, 8, 4); x.stroke();
    x.strokeStyle = '#3c8a36'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(3, 13); x.bezierCurveTo(2, 7, 9, 9, 8, 4); x.stroke();
    panel(x, 6, 2, 4, 4, '#3c8a36', '#27602a'); // head
    dot(x, 7, 4, '#f4c542'); dot(x, 9, 4, '#f4c542'); // eyes
    x.fillStyle = '#c0392b'; x.fillRect(7, 1, 1, 1); x.fillRect(9, 1, 1, 1); // tongue
    sprites.creatures.snake = c;
  }
  // Wolf — larger gray canine
  {
    const c = makeCanvas(); const x = c.getContext('2d'); shadow(x);
    panel(x, 3, 7, 9, 6, '#7d7a72', '#3a382f'); // body
    panel(x, 10, 5, 5, 5, '#7d7a72', '#3a382f'); // head
    block(x, 11, 3, 2, 2, '#5a5850'); block(x, 13, 3, 2, 2, '#5a5850'); // ears
    block(x, 14, 8, 2, 2, '#5a5850'); // snout
    dot(x, 12, 7, '#f4c542'); // eye
    x.fillStyle = '#3a382f'; x.fillRect(0, 8, 4, 2); // tail
    block(x, 4, 13, 2, 3, '#3a382f'); block(x, 9, 13, 2, 3, '#3a382f'); // legs
    sprites.creatures.wolf = c;
  }
  // Rotworm — brown segmented
  {
    const c = makeCanvas(); const x = c.getContext('2d'); shadow(x);
    for (let i = 0; i < 5; i++) panel(x, 3 + i * 2, 9 - (i % 2), 4, 5, '#9b6a3a', '#4d3318');
    panel(x, 11, 5, 5, 5, '#b07a44', '#4d3318'); // head
    dot(x, 12, 7, '#20140a'); dot(x, 14, 7, '#20140a');
    x.fillStyle = '#6e2018'; x.fillRect(11, 4, 1, 2); x.fillRect(15, 4, 1, 2); // mandibles
    sprites.creatures.rotworm = c;
  }
  // Cyclops — big tan brute, one eye
  {
    const c = makeCanvas(); const x = c.getContext('2d'); shadow(x);
    panel(x, 3, 6, 10, 8, '#c79a5c', '#6e4a1f'); // body
    panel(x, 5, 1, 7, 6, '#d8ab6a', '#6e4a1f'); // head
    block(x, 4, 11, 8, 3, '#6e4a1f'); // loincloth
    panel(x, 7, 3, 3, 3, '#ffffff', '#6e4a1f'); // big eye white
    dot(x, 8, 4, '#7a1f12'); // pupil
    block(x, 5, 6, 7, 1, '#6e4a1f'); // brow
    panel(x, 1, 7, 3, 5, '#c79a5c', '#6e4a1f'); // left arm
    panel(x, 12, 7, 3, 5, '#c79a5c', '#6e4a1f'); // right arm
    sprites.creatures.cyclops = c;
  }
  // Dragon — green winged
  {
    const c = makeCanvas(); const x = c.getContext('2d'); shadow(x);
    // wings
    x.fillStyle = '#1f5a1f'; x.beginPath(); x.moveTo(2, 4); x.lineTo(6, 8); x.lineTo(2, 11); x.fill();
    x.fillStyle = '#1f5a1f'; x.beginPath(); x.moveTo(14, 4); x.lineTo(10, 8); x.lineTo(14, 11); x.fill();
    panel(x, 5, 6, 7, 7, '#2e8b2e', '#16400f'); // body
    block(x, 6, 13, 2, 3, '#16400f'); block(x, 9, 13, 2, 3, '#16400f'); // legs
    panel(x, 9, 2, 5, 5, '#34a02e', '#16400f'); // head
    block(x, 13, 4, 2, 2, '#34a02e'); // snout
    dot(x, 11, 4, '#f4c542'); // eye
    x.fillStyle = '#e8772a'; x.fillRect(15, 4, 1, 1); // fire breath hint
    x.fillStyle = '#c0d860'; x.fillRect(7, 8, 3, 1); x.fillRect(7, 10, 2, 1); // belly scales
    sprites.creatures.dragon = c;
  }
}

// ---------------------------------------------------------------- items
function buildItems() {
  const it = (id, fn) => { const c = makeCanvas(); fn(c.getContext('2d')); sprites.items[id] = c; };

  it('gold', x => { x.fillStyle = '#c79a22'; x.beginPath(); x.arc(8, 9, 5, 0, 7); x.fill();
    x.fillStyle = '#f4c542'; x.beginPath(); x.arc(8, 8, 4, 0, 7); x.fill();
    x.fillStyle = '#fff3b0'; x.fillRect(6, 6, 2, 1); });
  it('meat', x => { x.fillStyle = '#7c4a22'; x.beginPath(); x.arc(8, 9, 5, 0, 7); x.fill();
    x.fillStyle = '#a85f2c'; x.beginPath(); x.arc(8, 9, 4, 0, 7); x.fill();
    x.fillStyle = '#efe4cf'; x.fillRect(7, 13, 2, 3); x.fillRect(6, 15, 4, 1); });
  it('club', x => { panel(x, 8, 2, 4, 5, '#9b6a3a', '#3d2812'); panel(x, 6, 6, 4, 9, '#7a4f28', '#3d2812'); });
  it('sword', x => { x.fillStyle = '#2a2a2a'; x.fillRect(7, 1, 3, 11);
    x.fillStyle = '#cfd4da'; x.fillRect(7, 1, 2, 11); x.fillStyle = '#eef1f5'; x.fillRect(7, 2, 1, 9);
    panel(x, 5, 11, 7, 2, '#8a6a30', '#3d2812'); panel(x, 7, 13, 3, 3, '#5a3a1e', '#2c1d0e'); });
  it('firesword', x => { x.fillStyle = '#7a1f12'; x.fillRect(6, 1, 5, 11);
    x.fillStyle = '#e8772a'; x.fillRect(7, 1, 3, 11); x.fillStyle = '#f7d34a'; x.fillRect(8, 2, 1, 9);
    panel(x, 5, 11, 7, 2, '#8a6a30', '#3d2812'); panel(x, 7, 13, 3, 3, '#5a3a1e', '#2c1d0e');
    dot(x, 6, 3, '#f7d34a'); dot(x, 11, 6, '#f7d34a'); });
  it('leatherarmor', x => { panel(x, 3, 3, 10, 11, '#8a5a2c', '#3d2812'); block(x, 3, 3, 10, 2, '#a06a36');
    x.fillStyle = '#5a3a1e'; x.fillRect(7, 5, 2, 8); });
  it('platearmor', x => { panel(x, 3, 3, 10, 11, '#9aa0a8', '#3a3d42'); block(x, 3, 3, 10, 2, '#c3c8ce');
    x.fillStyle = '#6c7178'; x.fillRect(7, 5, 2, 8); x.fillStyle = '#e6eaf0'; x.fillRect(4, 4, 2, 6); });
  it('woodshield', x => { x.fillStyle = '#3d2812'; x.beginPath(); x.moveTo(3, 2); x.lineTo(13, 2); x.lineTo(8, 15); x.fill();
    x.fillStyle = '#9b6a3a'; x.beginPath(); x.moveTo(4, 3); x.lineTo(12, 3); x.lineTo(8, 14); x.fill();
    x.fillStyle = '#7a4f28'; x.fillRect(7, 4, 2, 8); });
  it('steelshield', x => { x.fillStyle = '#3a3d42'; x.beginPath(); x.moveTo(3, 2); x.lineTo(13, 2); x.lineTo(8, 15); x.fill();
    x.fillStyle = '#9aa0a8'; x.beginPath(); x.moveTo(4, 3); x.lineTo(12, 3); x.lineTo(8, 14); x.fill();
    x.fillStyle = '#c3c8ce'; x.fillRect(7, 4, 2, 6); });
  it('leatherhelmet', x => { x.fillStyle = '#3d2812'; x.beginPath(); x.arc(8, 9, 6, Math.PI, 0); x.fill(); x.fillRect(2, 9, 12, 3);
    x.fillStyle = '#9b6a3a'; x.beginPath(); x.arc(8, 9, 5, Math.PI, 0); x.fill(); x.fillRect(4, 9, 8, 2); });
  it('steelhelmet', x => { x.fillStyle = '#3a3d42'; x.beginPath(); x.arc(8, 9, 6, Math.PI, 0); x.fill(); x.fillRect(2, 9, 12, 4);
    x.fillStyle = '#9aa0a8'; x.beginPath(); x.arc(8, 9, 5, Math.PI, 0); x.fill(); x.fillRect(4, 9, 8, 3);
    x.fillStyle = '#20140a'; x.fillRect(6, 10, 1, 2); x.fillRect(9, 10, 1, 2); });
  it('boots', x => { panel(x, 4, 4, 3, 9, '#5a3a1e', '#2c1d0e'); panel(x, 4, 12, 6, 3, '#5a3a1e', '#2c1d0e');
    panel(x, 9, 4, 3, 9, '#5a3a1e', '#2c1d0e'); });
  it('backpack', x => { panel(x, 3, 4, 10, 11, '#8a3a2c', '#3d160e'); block(x, 3, 4, 10, 2, '#a8452f');
    panel(x, 6, 7, 4, 4, '#5a241a', '#3d160e'); });
  it('amulet', x => { x.strokeStyle = '#c79a22'; x.lineWidth = 1; x.beginPath(); x.arc(8, 7, 4, 0.2, Math.PI - 0.2); x.stroke();
    x.fillStyle = '#3aa0a0'; x.beginPath(); x.arc(8, 11, 3, 0, 7); x.fill(); x.fillStyle = '#7fe0e0'; dot(x, 7, 10, '#bff2f2'); });
  it('ring', x => { x.strokeStyle = '#f4c542'; x.lineWidth = 2; x.beginPath(); x.arc(8, 10, 4, 0, 7); x.stroke();
    x.fillStyle = '#c0392b'; x.fillRect(7, 4, 2, 2); });

  // Runes: tan blank rune with colored element + 2-letter label
  const rune = (id, elem, label) => it(id, x => {
    panel(x, 2, 2, 12, 12, '#d8c89a', '#6e5a2e'); // blank rune body
    x.fillStyle = elem; x.beginPath(); x.arc(8, 8, 4, 0, 7); x.fill();
    x.fillStyle = '#00000088'; x.font = 'bold 6px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(label, 8, 9);
  });
  rune('rune_uh', '#e0e0e0', 'UH');
  rune('rune_sd', '#7a4fb0', 'SD');
  rune('rune_gfb', '#e8772a', 'GFB');
  rune('rune_hmm', '#c0392b', 'HMM');
}

// ---------------------------------------------------------------- fx
function buildFx() {
  // blood splat
  { const c = makeCanvas(); const x = c.getContext('2d'); x.fillStyle = '#8a1c12';
    x.beginPath(); x.arc(8, 9, 4, 0, 7); x.fill();
    dot(x, 3, 6, '#8a1c12'); dot(x, 13, 11, '#8a1c12'); dot(x, 11, 4, '#8a1c12'); dot(x, 5, 13, '#8a1c12');
    sprites.fx.blood = c; }
  // corpse pool (creature death)
  { const c = makeCanvas(); const x = c.getContext('2d'); x.fillStyle = '#6e1810';
    x.beginPath(); x.ellipse(8, 10, 6, 4, 0, 0, 7); x.fill();
    x.fillStyle = '#3d0d08'; x.beginPath(); x.ellipse(8, 10, 3, 2, 0, 0, 7); x.fill();
    sprites.fx.corpse = c; }
  // fire field
  { const c = makeCanvas(); const x = c.getContext('2d');
    x.fillStyle = '#7a1f12'; x.fillRect(2, 8, 12, 7);
    x.fillStyle = '#e8772a'; for (let i = 0; i < 4; i++) x.fillRect(3 + i * 3, 5 + (i % 2) * 2, 3, 8);
    x.fillStyle = '#f7d34a'; x.fillRect(5, 4, 2, 5); x.fillRect(9, 6, 2, 4);
    sprites.fx.fire = c; }
}

export function buildSprites() {
  buildTerrain();
  buildObjects();
  buildHero();
  buildCreatures();
  buildItems();
  buildFx();
}
