// config.js — core constants for the Tibia 7.6 tribute
// Faithful-ish numbers; this is an homage, not a clone.

export const TILE = 32;          // rendered tile size in px
export const SRC = 16;           // source sprite size (authored 16x16, drawn x2)

// Visible viewport in tiles. Dynamic: the renderer fills the available window
// with whole tiles and recomputes this on resize. Defaults mirror the classic
// 15x11 client; setView() keeps the centre indices in sync.
export const view = { w: 15, h: 11, cx: 7, cy: 5 };
export function setView(w, h) {
  view.w = Math.max(11, w);
  view.h = Math.max(9, h);
  view.cx = Math.floor(view.w / 2);
  view.cy = Math.floor(view.h / 2);
}

export const MAP_W = 64;
export const MAP_H = 64;

export const LOGIC_HZ = 60;            // logic ticks per second
export const STEP_MS = 230;            // player walk time per tile
export const ATTACK_MS = 2000;         // auto-attack interval (classic 2s)
export const EXHAUST_MS = 1000;        // spell/rune exhaustion

// Classic Tibia experience curve: total exp needed to BE level L.
export function expForLevel(L) {
  return Math.round((50 / 3) * (L * L * L - 6 * L * L + 17 * L - 12));
}

// Player stat growth (simplified hybrid vocation: "Adventurer")
export const BASE_HP = 150;
export const HP_PER_LEVEL = 15;
export const BASE_MANA = 60;
export const MANA_PER_LEVEL = 15;
export const BASE_CAP = 400;
export const CAP_PER_LEVEL = 10;

export function maxHpForLevel(L) { return BASE_HP + (L - 1) * HP_PER_LEVEL; }
export function maxManaForLevel(L) { return BASE_MANA + (L - 1) * MANA_PER_LEVEL; }
export function maxCapForLevel(L) { return BASE_CAP + (L - 1) * CAP_PER_LEVEL; }

export const DEATH_EXP_LOSS = 0.10;    // lose 10% exp on death (7.6 was harsher, but be kind)

// Tile type ids
export const T = {
  WATER: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,   // temple / town floor
  SAND: 4,
  CAVE: 5,    // dark cave floor
  ROCK: 6,    // mountain (blocks)
  FOREST: 7,  // darker grass
};

// Which base tiles block movement on their own
export const BLOCKING_TILES = new Set([T.WATER, T.ROCK]);

// Directions
export const DIR = { DOWN: 0, LEFT: 1, UP: 2, RIGHT: 3 };
export const DIR_VEC = {
  [DIR.DOWN]: { x: 0, y: 1 },
  [DIR.LEFT]: { x: -1, y: 0 },
  [DIR.UP]: { x: 0, y: -1 },
  [DIR.RIGHT]: { x: 1, y: 0 },
};
