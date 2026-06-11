// input.js — keyboard movement + mouse targeting / looting / rune crosshair.

import { DIR, STEP_MS, TILE } from './config.js';
import { game } from './state.js';
import { creatureAt } from './entities.js';
import { setTarget, clearTarget } from './combat.js';
import { castRune } from './spells.js';
import { openCorpse } from './loot.js';

const KEYDIR = {
  ArrowUp: DIR.UP, KeyW: DIR.UP,
  ArrowDown: DIR.DOWN, KeyS: DIR.DOWN,
  ArrowLeft: DIR.LEFT, KeyA: DIR.LEFT,
  ArrowRight: DIR.RIGHT, KeyD: DIR.RIGHT,
};

const held = []; // stack of currently-held directions

let canvas = null;

export function initInput(gameCanvas, chatInput) {
  canvas = gameCanvas;

  window.addEventListener('keydown', (e) => {
    if (e.target === chatInput) return;            // don't walk while typing
    if (e.code === 'Escape') { game.pendingRune = null; clearTarget(); return; }
    const dir = KEYDIR[e.code];
    if (dir !== undefined) {
      e.preventDefault();
      if (!held.includes(dir)) held.push(dir);
    }
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEYDIR[e.code];
    if (dir !== undefined) {
      const i = held.indexOf(dir);
      if (i >= 0) held.splice(i, 1);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    game.hoverTile = tileFromEvent(e);
  });
  canvas.addEventListener('mouseleave', () => { game.hoverTile = null; });

  canvas.addEventListener('click', (e) => {
    const t = tileFromEvent(e);
    if (!t) return;
    // crosshair: a rune is armed
    if (game.pendingRune) {
      const ok = castRune(game.pendingRune.rune, t.x, t.y);
      if (ok) game.pendingRune = null;
      return;
    }
    const c = creatureAt(t.x, t.y);
    if (c) { setTarget(c); return; }
    const corpse = topCorpseAt(t.x, t.y);
    if (corpse) { openCorpse(corpse); return; }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (game.pendingRune) { game.pendingRune = null; return; }
    clearTarget();
  });
}

function topCorpseAt(x, y) {
  // most recent corpse on the tile
  for (let i = game.corpses.length - 1; i >= 0; i--) {
    const c = game.corpses[i];
    if (c.x === x && c.y === y) return c;
  }
  return null;
}

function tileFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
  const px = (e.clientX - rect.left) * sx;
  const py = (e.clientY - rect.top) * sy;
  const tx = Math.floor(game.camera.x + px / TILE);
  const ty = Math.floor(game.camera.y + py / TILE);
  return { x: tx, y: ty };
}

// called every frame from the main loop
export function updateInput(now) {
  if (game.paused || game.deathScreen) return;
  if (!held.length) return;
  const dir = held[held.length - 1];
  game.player.step(dir, now, STEP_MS);
}
