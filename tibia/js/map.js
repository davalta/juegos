// map.js — procedural island, zones, collision, minimap.

import { T, MAP_W, MAP_H, BLOCKING_TILES } from './config.js';
import { game, mulberry32 } from './state.js';

const MINI = {
  [T.WATER]: '#27507e', [T.GRASS]: '#5a9a3a', [T.FOREST]: '#2f5a20',
  [T.DIRT]: '#b9924f', [T.STONE]: '#9a9a92', [T.SAND]: '#d8c272',
  [T.CAVE]: '#322f2a', [T.ROCK]: '#6f685d',
};

export const SPAWN = { x: 33, y: 43 };

// Creature spawn zones (filled by the spawner up to `max`)
export const ZONES = [
  { name: 'rat',     x: 40, y: 38, w: 12, h: 10, creature: 'rat',     max: 4 },
  { name: 'rat2',    x: 16, y: 40, w: 10, h: 10, creature: 'rat',     max: 3 },
  { name: 'snake',   x: 10, y: 10, w: 14, h: 14, creature: 'snake',   max: 4 },
  { name: 'wolf',    x: 12, y: 24, w: 14, h: 10, creature: 'wolf',    max: 3 },
  { name: 'rotworm', x: 45, y: 11, w: 12, h: 12, creature: 'rotworm', max: 4 },
  { name: 'cyclops', x: 42, y: 44, w: 16, h: 14, creature: 'cyclops', max: 3 },
  { name: 'dragon',  x: 28, y: 5,  w: 12, h: 8,  creature: 'dragon',  max: 1 },
];

export function generateMap() {
  const tiles = new Uint8Array(MAP_W * MAP_H);
  const objects = new Map(); // index -> { sprite, blocking }
  const rng = mulberry32(76076);
  const idx = (x, y) => y * MAP_W + x;
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) tiles[idx(x, y)] = t; };
  const get = (x, y) => tiles[idx(x, y)];
  const obj = (x, y, sprite, blocking) => objects.set(idx(x, y), { sprite, blocking });

  // 1. ocean
  tiles.fill(T.WATER);

  // 2. carve a blobby island of grass
  const cx = 32, cy = 33;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const wobble = 4 * Math.sin(x * 0.5) + 4 * Math.cos(y * 0.45) + (rng() * 4 - 2);
      if (d < 27 + wobble) set(x, y, T.GRASS);
    }
  }

  const rect = (x1, y1, x2, y2, fn) => {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) fn(x, y);
  };
  const onLand = (x, y) => get(x, y) !== T.WATER;

  // 3. forest (NW)
  rect(8, 8, 26, 26, (x, y) => {
    const dx = x - 16, dy = y - 16;
    if (dx * dx + dy * dy < 80 && onLand(x, y)) {
      set(x, y, T.FOREST);
      if (rng() < 0.28) obj(x, y, 'tree', true);
      else if (rng() < 0.12) obj(x, y, 'bush', false);
    }
  });

  // 4. enclosed cave for rotworms (NE) — rock ring, cave floor, south entrance
  const cave = { x1: 43, y1: 9, x2: 58, y2: 24 };
  rect(cave.x1, cave.y1, cave.x2, cave.y2, (x, y) => { if (onLand(x, y)) set(x, y, T.CAVE); });
  for (let x = cave.x1; x <= cave.x2; x++) { set(x, cave.y1, T.ROCK); set(x, cave.y2, T.ROCK); }
  for (let y = cave.y1; y <= cave.y2; y++) { set(cave.x1, y, T.ROCK); set(cave.x2, y, T.ROCK); }
  set(50, cave.y2, T.CAVE); set(51, cave.y2, T.CAVE); // entrance gap
  rect(cave.x1, cave.y1, cave.x2, cave.y2, (x, y) => {
    if (get(x, y) === T.ROCK && rng() < 0.4) obj(x, y, 'mountain', true);
  });

  // 5. dragon lair (N) — enclosed cave, single narrow entrance south
  const lair = { x1: 26, y1: 3, x2: 41, y2: 14 };
  rect(lair.x1, lair.y1, lair.x2, lair.y2, (x, y) => { if (onLand(x, y) || y < 14) set(x, y, T.CAVE); });
  for (let x = lair.x1; x <= lair.x2; x++) { set(x, lair.y1, T.ROCK); set(x, lair.y2, T.ROCK); }
  for (let y = lair.y1; y <= lair.y2; y++) { set(lair.x1, y, T.ROCK); set(lair.x2, y, T.ROCK); }
  set(33, lair.y2, T.CAVE); set(34, lair.y2, T.CAVE); // entrance
  rect(lair.x1, lair.y1, lair.x2, lair.y2, (x, y) => {
    if (get(x, y) === T.ROCK && rng() < 0.5) obj(x, y, 'mountain', true);
  });

  // 6. cyclops hill (SE) — sand with scattered boulders
  rect(40, 42, 60, 58, (x, y) => {
    if (!onLand(x, y)) return;
    set(x, y, T.SAND);
    if (rng() < 0.10) obj(x, y, 'mountain', true);
  });

  // 7. town plaza + temple facade (center, spawn)
  rect(28, 36, 39, 47, (x, y) => { if (onLand(x, y)) set(x, y, T.STONE); });
  // temple facade walls (north side, non-enclosing)
  for (let x = 29; x <= 38; x++) obj(x, 37, 'wall', true);
  obj(28, 38, 'wall', true); obj(38, 38, 'wall', true);
  obj(28, 39, 'wall', true); obj(38, 39, 'wall', true);
  obj(SPAWN.x, 40, 'banner', false); // banner behind the temple steps

  // 8. dirt paths from temple toward the zones
  const path = (x0, y0, x1, y1) => {
    let x = x0, y = y0;
    while (x !== x1 || y !== y1) {
      if (get(x, y) === T.GRASS) set(x, y, T.DIRT);
      if (x < x1) x++; else if (x > x1) x--;
      else if (y < y1) y++; else if (y > y1) y--;
    }
  };
  path(33, 47, 46, 43);  // toward rat field / cyclops
  path(33, 47, 20, 40);  // toward west
  path(20, 40, 16, 24);  // toward wolves/forest
  path(33, 36, 33, 15);  // toward dragon entrance
  path(46, 43, 50, 25);  // toward rotworm cave entrance

  // 9. scatter bushes on open grass
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rng() * MAP_W), y = Math.floor(rng() * MAP_H);
    if (get(x, y) === T.GRASS && !objects.has(idx(x, y)) && rng() < 0.5) obj(x, y, 'bush', false);
  }

  // clear objects on the spawn tile and its neighbours so we never start trapped
  for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) {
    objects.delete(idx(SPAWN.x + dx, SPAWN.y + dy));
  }

  // 10. precompute static minimap
  const mini = document.createElement('canvas');
  mini.width = MAP_W; mini.height = MAP_H;
  const mx = mini.getContext('2d');
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const o = objects.get(idx(x, y));
    mx.fillStyle = o && o.blocking ? '#3a352c' : (MINI[get(x, y)] || '#000');
    mx.fillRect(x, y, 1, 1);
  }
  mx.fillStyle = '#f4c542'; mx.fillRect(SPAWN.x, SPAWN.y, 1, 1); // temple marker

  return { tiles, objects, minimapBase: mini, idx };
}

export function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return T.WATER;
  return game.map.tiles[y * MAP_W + x];
}

export function objectAt(x, y) {
  return game.map.objects.get(y * MAP_W + x) || null;
}

// terrain/object collision only (creature occupancy handled separately)
export function isBlocked(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  if (BLOCKING_TILES.has(tileAt(x, y))) return true;
  const o = objectAt(x, y);
  return !!(o && o.blocking);
}
