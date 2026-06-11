// save.js — localStorage persistence, starting kit, character reset.

import { game, log } from './state.js';
import { Player, spawnInitial } from './entities.js';
import { recalcStats } from './items.js';
import { SPAWN } from './map.js';

const KEY = 'tibia76_tribute_save_v1';

function startingKit(p) {
  p.equip.weapon = { id: 'club' };
  p.equip.armor = { id: 'leatherarmor' };
  p.equip.shield = { id: 'woodshield' };
  p.equip.helmet = { id: 'leatherhelmet' };
  p.equip.boots = { id: 'boots' };
  p.equip.backpack = { id: 'backpack' };
  p.backpack = [
    { id: 'sword', count: 1 },
    { id: 'meat', count: 5 },
    { id: 'gold', count: 20 },
    { id: 'rune_uh', count: 5 },
    { id: 'rune_sd', count: 5 },
    { id: 'rune_gfb', count: 3 },
    { id: 'rune_hmm', count: 10 },
  ];
}

export function newPlayer() {
  const p = new Player(SPAWN.x, SPAWN.y);
  game.player = p;            // recalcStats() reads game.player
  startingKit(p);
  recalcStats();
  p.hp = p.maxHp; p.mana = p.maxMana;
  return p;
}

export function saveGame() {
  const p = game.player;
  if (!p) return;
  const data = {
    level: p.level, exp: p.exp, x: p.x, y: p.y, dir: p.dir,
    hp: p.hp, mana: p.mana, food: p.food,
    backpack: p.backpack, equip: p.equip,
  };
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage full / disabled */ }
}

export function loadGame() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
  if (!data) { game.player = newPlayer(); return false; }

  const p = new Player(data.x ?? SPAWN.x, data.y ?? SPAWN.y);
  p.level = data.level || 1;
  p.exp = data.exp || 0;
  p.dir = data.dir || 0;
  p.food = data.food ?? 120;
  p.backpack = Array.isArray(data.backpack) ? data.backpack : [];
  p.equip = Object.assign(
    { helmet: null, amulet: null, backpack: null, armor: null, weapon: null, shield: null, legs: null, ring: null, boots: null },
    data.equip || {});
  p.applyLevelStats(false);
  game.player = p;
  recalcStats();
  p.hp = Math.min(data.hp ?? p.maxHp, p.maxHp);
  p.mana = Math.min(data.mana ?? p.maxMana, p.maxMana);
  p.fromX = p.x; p.fromY = p.y;
  return true;
}

export function resetGame() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  game.creatures.length = 0;
  game.corpses.length = 0;
  game.effects.length = 0;
  game.fields.length = 0;
  game.target = null;
  game.pendingRune = null;
  game.lootWindow = null;
  game.deathScreen = false;
  game.paused = false;
  game.player = newPlayer();
  spawnInitial();
  game.invDirty = true; game.statsDirty = true; game.messagesDirty = true;
  log('A fresh adventurer steps off the boat at the temple.', 'lightblue');
}
