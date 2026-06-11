// main.js — boot, game loop, and the canvas renderer.

import {
  TILE, VIEW_W, VIEW_H, CENTER_X, CENTER_Y, MAP_W, MAP_H,
} from './config.js';
import { game, log, clamp } from './state.js';
import { buildSprites, sprites } from './sprites.js';
import { generateMap, tileAt, objectAt } from './map.js';
import { spawnInitial, maintainSpawns } from './entities.js';
import { updateCombat, damagePlayer } from './combat.js';
import { updateFields } from './spells.js';
import { loadGame, saveGame } from './save.js';
import { initUI, renderUI } from './ui.js';
import { initInput, updateInput } from './input.js';

let canvas, ctx;

function boot() {
  buildSprites();
  game.map = generateMap();
  loadGame();
  spawnInitial();
  game.invDirty = game.statsDirty = game.messagesDirty = true;
  window.game = game; // dev console hook: tinker with the world from devtools

  canvas = document.getElementById('game');
  canvas.width = VIEW_W * TILE;
  canvas.height = VIEW_H * TILE;
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  initUI();
  initInput(canvas, document.getElementById('chat-input'));

  log('Welcome. This is a fan tribute to Tibia 7.6 — not affiliated with CipSoft.', 'lightblue');
  log('Walk with WASD or the arrow keys. Click a creature to attack it.', 'lightblue');
  log('Click a rune in your backpack, then click a target. Type spells like "exura".', 'lightblue');

  requestAnimationFrame(loop);
}

let lastSave = 0;
let lastRegen = 0;

function loop() {
  const now = performance.now();
  game.now = now;

  if (!game.paused && !game.deathScreen) {
    updateInput(now);
    maintainSpawns(now);
    for (const c of [...game.creatures]) c.update(now);
    updateCombat(now);
    updateFields(now, damagePlayer);
    regen(now);
    decay(now);
  }

  render(now);
  renderUI(now);

  if (now - lastSave > 4000) { saveGame(); lastSave = now; }
  requestAnimationFrame(loop);
}

function regen(now) {
  const p = game.player;
  if (p.hp <= 0) return;
  if (now - lastRegen > 3000) {
    lastRegen = now;
    let changed = false;
    if (p.food > 0) p.food -= 30;
    const hpRegen = (p.food > 0 ? 1 : 0) + (p.bonusRegen || 0);
    const manaRegen = p.food > 0 ? 3 : 1;
    if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + hpRegen); changed = true; }
    if (p.mana < p.maxMana) { p.mana = Math.min(p.maxMana, p.mana + manaRegen); changed = true; }
    if (changed) game.statsDirty = true;
  }
}

function decay(now) {
  for (let i = game.corpses.length - 1; i >= 0; i--) {
    const c = game.corpses[i];
    if (now - c.born > c.decay) {
      if (game.lootWindow === c) game.lootWindow = null;
      game.corpses.splice(i, 1);
    }
  }
  for (let i = game.effects.length - 1; i >= 0; i--) {
    if (now - game.effects[i].born > game.effects[i].ttl) game.effects.splice(i, 1);
  }
}

// ---------------------------------------------------------------- render
function render(now) {
  const p = game.player;
  const pr = p.renderPos(now);
  const camX = clamp(pr.x - CENTER_X, 0, MAP_W - VIEW_W);
  const camY = clamp(pr.y - CENTER_Y, 0, MAP_H - VIEW_H);
  game.camera.x = camX; game.camera.y = camY;

  const sx = (wx) => (wx - camX) * TILE;
  const sy = (wy) => (wy - camY) * TILE;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const x0 = Math.floor(camX) - 1, x1 = Math.floor(camX) + VIEW_W + 1;
  const y0 = Math.floor(camY) - 1, y1 = Math.floor(camY) + VIEW_H + 1;

  // terrain + objects
  for (let wy = y0; wy <= y1; wy++) {
    for (let wx = x0; wx <= x1; wx++) {
      if (wx < 0 || wy < 0 || wx >= MAP_W || wy >= MAP_H) continue;
      const ter = sprites.terrain[tileAt(wx, wy)];
      if (ter) ctx.drawImage(ter, sx(wx), sy(wy), TILE, TILE);
      const o = objectAt(wx, wy);
      if (o) {
        const spr = sprites.objects[o.sprite];
        if (spr) ctx.drawImage(spr, sx(wx), sy(wy), TILE, TILE);
      }
    }
  }

  // corpses
  for (const c of game.corpses) ctx.drawImage(sprites.fx.corpse, sx(c.x), sy(c.y), TILE, TILE);

  // fire fields
  for (const f of game.fields) ctx.drawImage(sprites.fx.fire, sx(f.x), sy(f.y), TILE, TILE);

  // target marker
  if (game.target && game.target.hp > 0) {
    const tr = game.target.renderPos(now);
    ctx.strokeStyle = '#e83a2a'; ctx.lineWidth = 2;
    ctx.strokeRect(sx(tr.x) + 1, sy(tr.y) + 1, TILE - 2, TILE - 2);
  }

  // y-sorted actors (creatures + hero)
  const actors = game.creatures.filter(c => c.hp > 0).map(c => ({ e: c, isP: false }));
  actors.push({ e: p, isP: true });
  actors.sort((a, b) => a.e.renderPos(now).y - b.e.renderPos(now).y);

  for (const { e, isP } of actors) {
    const r = e.renderPos(now);
    const px = sx(r.x), py = sy(r.y);
    if (isP) {
      ctx.drawImage(sprites.hero[p.dir], px, py, TILE, TILE);
      nameplate('Adventurer', px + TILE / 2, py - 2, '#6ad06a');
    } else {
      const spr = sprites.creatures[e.type];
      if (now - e.hitFlash < 90) {
        ctx.drawImage(spr, px, py, TILE, TILE);
        ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(spr, px, py, TILE, TILE);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.drawImage(spr, px, py, TILE, TILE);
      }
      const hpW = TILE - 8;
      const pct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = '#000'; ctx.fillRect(px + 4, py - 6, hpW, 3);
      ctx.fillStyle = pct > 0.5 ? '#4caf3a' : pct > 0.25 ? '#d8b020' : '#d83a2a';
      ctx.fillRect(px + 4, py - 6, hpW * pct, 3);
      nameplate(e.name, px + TILE / 2, py - 8, game.target === e ? '#ff5a4a' : '#d8d2b0');
    }
  }

  // floating effects
  for (const e of game.effects) {
    const t = (now - e.born) / e.ttl;
    if (e.kind === 'text') {
      const ex = sx(e.x) + TILE / 2;
      const ey = sy(e.y) + TILE / 2 + (e.vy || -0.5) * (now - e.born) / 16;
      ctx.font = 'bold 13px Verdana, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = clamp(1 - t, 0, 1);
      ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(e.text, ex, ey);
      ctx.fillStyle = e.color || '#fff'; ctx.fillText(e.text, ex, ey);
      ctx.globalAlpha = 1;
    } else if (e.kind === 'sprite') {
      ctx.globalAlpha = clamp(1 - t, 0, 1);
      const spr = sprites.fx[e.sprite];
      if (spr) ctx.drawImage(spr, sx(e.x), sy(e.y), TILE, TILE);
      ctx.globalAlpha = 1;
    } else if (e.kind === 'heal') {
      ctx.globalAlpha = clamp(1 - t, 0, 1);
      ctx.strokeStyle = '#7df09a'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx(e.x) + TILE / 2, sy(e.y) + TILE / 2, TILE / 2 * (0.4 + t * 0.5), 0, 7);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // rune crosshair
  canvas.style.cursor = game.pendingRune ? 'crosshair' : 'default';
  if (game.pendingRune && game.hoverTile) {
    const hx = sx(game.hoverTile.x), hy = sy(game.hoverTile.y);
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2;
    ctx.strokeRect(hx + 1, hy + 1, TILE - 2, TILE - 2);
    ctx.beginPath();
    ctx.moveTo(hx + TILE / 2, hy); ctx.lineTo(hx + TILE / 2, hy + TILE);
    ctx.moveTo(hx, hy + TILE / 2); ctx.lineTo(hx + TILE, hy + TILE / 2);
    ctx.stroke();
  }
}

function nameplate(text, cx, baseY, color) {
  ctx.font = '10px Verdana, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.strokeText(text, cx, baseY);
  ctx.fillStyle = color; ctx.fillText(text, cx, baseY);
}

window.addEventListener('DOMContentLoaded', boot);
