// state.js — shared mutable game state + small helpers (no imports, avoids cycles)

export const game = {
  player: null,
  creatures: [],
  corpses: [],     // { x, y, item, decay, opened, contents:[] }
  effects: [],     // floating text, blood, spell anims
  fields: [],      // fire fields etc: { x, y, kind, ttl, nextDmg }
  map: null,
  camera: { x: 0, y: 0 },
  target: null,    // creature being attacked
  pendingRune: null, // item awaiting crosshair click
  hoverTile: null, // {x,y} under mouse, for crosshair
  lootWindow: null,  // corpse currently shown in loot window
  messages: [],    // console lines: { text, type }
  messagesDirty: true,
  exhaustUntil: 0, // ms timestamp; spells/runes blocked until then
  paused: false,
  now: 0,          // ms, advanced by the loop (avoids Date in logic where possible)
};

const MAX_MESSAGES = 200;

export function log(text, type = 'white') {
  game.messages.push({ text, type });
  if (game.messages.length > MAX_MESSAGES) game.messages.shift();
  game.messagesDirty = true;
}

// Seeded RNG (mulberry32) for reproducible world generation.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function chance(p) { return Math.random() < p; }

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export function dist(ax, ay, bx, by) {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by)); // chebyshev (tiles)
}
