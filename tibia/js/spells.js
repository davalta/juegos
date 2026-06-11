// spells.js — spells (magic words) and runes (crosshair-targeted). No hotkeys: this is 7.6.

import { EXHAUST_MS } from './config.js';
import { game, log, randInt, dist } from './state.js';
import { creatureAt } from './entities.js';
import { damageCreature } from './combat.js';
import { countItem, removeFromBackpack } from './items.js';

export const SPELLS = {
  exura:        { words: 'exura',      mana: 20, heal: [10, 30] },
  'exura vita': { words: 'exura vita', mana: 80, heal: [60, 120] },
  exori:        { words: 'exori',      mana: 25, dmg: [15, 35], area: true },
};

export const RUNES = {
  uh:  { name: 'ultimate healing', heal: [60, 120] },
  sd:  { name: 'sudden death',     dmg: [60, 120], type: 'death' },
  gfb: { name: 'great fireball',   dmg: [30, 60],  type: 'fire', radius: 2, field: true },
  hmm: { name: 'heavy magic missile', dmg: [10, 25], type: 'energy' },
};

function fx(x, y, kind, opts = {}) {
  game.effects.push({ kind, x, y, born: game.now, ttl: opts.ttl || 600, ...opts });
}
function floatText(x, y, text, color) {
  game.effects.push({ kind: 'text', x, y, text, color, born: game.now, ttl: 900, vy: -0.5 });
}
function healEntity(e, amount) {
  e.hp = Math.min(e.maxHp, e.hp + amount);
  floatText(e.x, e.y, '+' + amount, '#39d353');
  fx(e.x, e.y, 'heal', { ttl: 500 });
  game.statsDirty = true;
}

function exhausted(now) {
  if (now < game.exhaustUntil) { log('You are exhausted.', 'white'); return true; }
  return false;
}

// ----- spoken spells -----
export function castSpell(name, now = game.now) {
  const s = SPELLS[name]; if (!s) return false;
  if (exhausted(now)) return false;
  const p = game.player;
  if (p.mana < s.mana) { log('You do not have enough mana.', 'white'); return false; }
  p.mana -= s.mana;
  game.exhaustUntil = now + EXHAUST_MS;
  log(p.name + ': ' + s.words, 'yellow');

  if (s.heal) {
    healEntity(p, randInt(s.heal[0], s.heal[1]) + Math.floor(p.level * 1.5));
  } else if (s.area) {
    let hit = 0;
    for (const c of [...game.creatures]) {
      if (c.hp > 0 && dist(p.x, p.y, c.x, c.y) <= 1) {
        damageCreature(c, randInt(s.dmg[0], s.dmg[1]) + p.level, 'energy'); hit++;
      }
    }
    if (!hit) floatText(p.x, p.y, 'whoosh', '#9fe0ff');
  }
  game.statsDirty = true;
  return true;
}

// ----- runes (crosshair) -----  returns true if the rune was consumed
export function castRune(rune, tx, ty, now = game.now) {
  const r = RUNES[rune]; if (!r) return false;
  if (exhausted(now)) return false;
  const p = game.player;
  const id = 'rune_' + rune;
  if (countItem(id) <= 0) { log('You have no such rune.', 'white'); return false; }

  if (r.heal) {
    const target = (tx === p.x && ty === p.y) ? p : creatureAt(tx, ty);
    if (!target) { log('You can only use this on creatures.', 'white'); return false; }
    healEntity(target, randInt(r.heal[0], r.heal[1]));
  } else if (r.radius) {
    // area rune (GFB): hit everything in the square radius
    fx(tx, ty, 'sprite', { sprite: 'fire', ttl: 700 });
    for (let yy = ty - r.radius; yy <= ty + r.radius; yy++) {
      for (let xx = tx - r.radius; xx <= tx + r.radius; xx++) {
        if (r.field) game.fields.push({ x: xx, y: yy, ttl: 6000, nextDmg: now + 1000, dmg: [4, 10] });
        const c = creatureAt(xx, yy);
        if (c && c.hp > 0) damageCreature(c, randInt(r.dmg[0], r.dmg[1]), r.type);
      }
    }
  } else {
    // single target rune (SD / HMM)
    const c = creatureAt(tx, ty);
    if (!c || c.hp <= 0) { log('You need a target.', 'white'); return false; }
    fx(c.x, c.y, 'sprite', { sprite: 'fire', ttl: 300 });
    damageCreature(c, randInt(r.dmg[0], r.dmg[1]), r.type);
  }

  // consume one rune
  const idx = p.backpack.findIndex(s => s.id === id);
  if (idx >= 0) removeFromBackpack(idx, 1);
  game.exhaustUntil = now + EXHAUST_MS;
  return true;
}

// lingering fire fields damage whoever stands on them
export function updateFields(now, damagePlayer) {
  for (let i = game.fields.length - 1; i >= 0; i--) {
    const f = game.fields[i];
    if (f.expireAt === undefined) f.expireAt = now + f.ttl;
    if (now >= f.expireAt) { game.fields.splice(i, 1); continue; }
    if (now >= f.nextDmg) {
      f.nextDmg = now + 1000;
      const c = creatureAt(f.x, f.y);
      if (c && c.hp > 0) damageCreature(c, randInt(f.dmg[0], f.dmg[1]), 'fire');
      if (game.player.x === f.x && game.player.y === f.y) {
        damagePlayer(randInt(f.dmg[0], f.dmg[1]), 'fire field', true);
      }
    }
  }
}
