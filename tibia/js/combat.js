// combat.js — targeting, attack resolution, XP/levels, death & respawn.

import { ATTACK_MS, DEATH_EXP_LOSS, expForLevel } from './config.js';
import { game, log, randInt, dist } from './state.js';
import { SPAWN } from './map.js';
import { rollLoot } from './items.js';

export function levelFromExp(exp) {
  let L = 1;
  while (expForLevel(L + 1) <= exp) L++;
  return L;
}

export function setTarget(creature) {
  if (creature && creature.hp > 0) {
    game.target = creature;
    log(`You attack ${creature.name}.`, 'white');
  }
}
export function clearTarget() { game.target = null; }

// ---- floating feedback ----
function floatText(x, y, text, color) {
  game.effects.push({ kind: 'text', x, y, text, color, born: game.now, ttl: 900, vy: -0.5 });
}
function splat(x, y, sprite, ttl = 700) {
  game.effects.push({ kind: 'sprite', x, y, sprite, born: game.now, ttl });
}

// ---- main combat tick ----
export function updateCombat(now) {
  const p = game.player;
  if (p.hp <= 0) return;

  // player auto-attack
  const t = game.target;
  if (t) {
    if (t.hp <= 0) { game.target = null; }
    else if (dist(p.x, p.y, t.x, t.y) <= 1) {
      faceTarget(p, t);
      if (now - p.lastAttack >= ATTACK_MS) {
        p.lastAttack = now;
        playerHit(t);
      }
    }
  }

  // creature attacks
  for (const c of game.creatures) {
    if (c.hp <= 0 || c.target !== p) continue;
    const d = dist(c.x, c.y, p.x, p.y);
    const melee = d <= 1;
    const ranged = c.tmpl.ranged && d <= 5;
    if ((melee || ranged) && now - c.lastAttack >= ATTACK_MS) {
      c.lastAttack = now;
      creatureHit(c, ranged && !melee);
    }
  }
}

function faceTarget(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 3 : 1;
  else a.dir = dy > 0 ? 0 : 2;
}

function playerHit(c) {
  const p = game.player;
  const raw = randInt(p.atkRange[0], p.atkRange[1]) * (1 + (p.level - 1) * 0.06);
  const mit = randInt(0, c.tmpl.armor);
  const dmg = Math.max(0, Math.round(raw - mit));
  damageCreature(c, dmg, 'phys');
}

function creatureHit(c, ranged) {
  const p = game.player;
  const range = ranged ? c.tmpl.fire : c.tmpl.atk;
  const raw = randInt(range[0], range[1]);
  const mit = randInt(0, p.bonusArmor + Math.floor(p.defense / 2));
  const dmg = Math.max(0, raw - mit);
  if (ranged) splat(p.x, p.y, 'fire', 500);
  damagePlayer(dmg, c.name, ranged);
}

export function damageCreature(c, dmg, type) {
  if (c.hp <= 0) return;
  c.hp -= dmg;
  c.hitFlash = game.now;
  c.target = game.player; // provoke
  if (dmg > 0) { floatText(c.x, c.y, String(dmg), type === 'fire' ? '#ff8c1a' : '#e8443a'); splat(c.x, c.y, 'blood', 600); }
  else floatText(c.x, c.y, '0', '#cfcfcf');
  if (c.hp <= 0) killCreature(c);
}

function killCreature(c) {
  c.hp = 0;
  // corpse with loot
  const contents = rollLoot(c.type);
  game.corpses.push({ x: c.x, y: c.y, sprite: 'corpse', name: c.name, contents, born: game.now, decay: 90000 });
  // remove from world
  const i = game.creatures.indexOf(c);
  if (i >= 0) game.creatures.splice(i, 1);
  if (game.target === c) game.target = null;
  log(`Loot of ${/^[aeiou]/i.test(c.name) ? 'an' : 'a'} ${c.name.toLowerCase()}: ${contents.length ? describeLoot(contents) : 'nothing'}.`, 'magenta');
  gainExp(c.tmpl.exp);
}

function describeLoot(contents) {
  return contents.map(s => s.count > 1 ? `${s.count} gold coins` : itemName(s.id)).join(', ');
}
function itemName(id) {
  // light import-free lookup to avoid cycles is unnecessary; ids map closely
  const names = { gold: 'gold coin', meat: 'meat', club: 'a club', sword: 'a sword', firesword: 'a fire sword',
    leatherarmor: 'leather armor', platearmor: 'a plate armor', woodshield: 'a wooden shield', steelshield: 'a steel shield',
    leatherhelmet: 'a leather helmet', steelhelmet: 'a steel helmet', boots: 'leather boots', legs: 'brass legs',
    backpack: 'a backpack', amulet: 'an amulet', ring: 'a life ring',
    rune_uh: 'a UH rune', rune_sd: 'an SD rune', rune_gfb: 'a GFB rune', rune_hmm: 'an HMM rune' };
  return names[id] || id;
}

export function gainExp(amount) {
  const p = game.player;
  p.exp += amount;
  floatText(p.x, p.y, '+' + amount, '#ffffff');
  let leveled = false;
  while (p.exp >= expForLevel(p.level + 1)) {
    p.level++;
    leveled = true;
    p.applyLevelStats(true);
    log(`You advanced from Level ${p.level - 1} to Level ${p.level}.`, 'lightblue');
  }
  if (leveled) game.statsDirty = true;
}

export function damagePlayer(dmg, sourceName, ranged) {
  const p = game.player;
  if (p.hp <= 0) return;
  p.hp -= dmg;
  if (dmg > 0) {
    floatText(p.x, p.y, String(dmg), ranged ? '#ff8c1a' : '#e8443a');
    log(`You lose ${dmg} hitpoint${dmg === 1 ? '' : 's'} due to an attack by ${article(sourceName)}.`, 'white');
  }
  if (p.hp <= 0) { p.hp = 0; playerDeath(sourceName); }
  game.statsDirty = true;
}

function article(name) { return (/^[aeiou]/i.test(name) ? 'an ' : 'a ') + name.toLowerCase(); }

function playerDeath(killer) {
  const p = game.player;
  log('You are dead.', 'red');
  const before = p.level;
  p.exp = Math.max(0, Math.floor(p.exp * (1 - DEATH_EXP_LOSS)));
  p.level = levelFromExp(p.exp);
  p.applyLevelStats(true);
  if (p.level < before) log(`You were downgraded from Level ${before} to Level ${p.level}.`, 'red');
  // respawn at temple
  p.x = SPAWN.x; p.y = SPAWN.y; p.fromX = p.x; p.fromY = p.y; p.dir = 0;
  game.target = null;
  for (const c of game.creatures) if (c.target === p) c.target = null;
  game.deathScreen = true;
  game.paused = true;
  game.statsDirty = true;
}
