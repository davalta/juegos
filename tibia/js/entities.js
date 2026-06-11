// entities.js — Player + Creature classes, AI, spawner.

import {
  DIR, DIR_VEC, STEP_MS,
  maxHpForLevel, maxManaForLevel, maxCapForLevel,
} from './config.js';
import { game, dist, clamp } from './state.js';
import { isBlocked } from './map.js';
import { ZONES, SPAWN } from './map.js';

// creature templates (speed = ms per tile; lower is faster)
export const CREATURES = {
  rat:     { name: 'Rat',     hp: 20,   exp: 5,   atk: [1, 4],   armor: 0,  speed: 620, aggro: 3 },
  snake:   { name: 'Snake',   hp: 16,   exp: 10,  atk: [1, 7],   armor: 0,  speed: 540, aggro: 4 },
  wolf:    { name: 'Wolf',    hp: 25,   exp: 22,  atk: [2, 10],  armor: 1,  speed: 380, aggro: 5 },
  rotworm: { name: 'Rotworm', hp: 65,   exp: 40,  atk: [4, 16],  armor: 4,  speed: 480, aggro: 4 },
  cyclops: { name: 'Cyclops', hp: 260,  exp: 150, atk: [10, 42], armor: 12, speed: 440, aggro: 5 },
  dragon:  { name: 'Dragon',  hp: 1000, exp: 700, atk: [20, 80], armor: 16, speed: 360, aggro: 6,
             ranged: true, fire: [30, 65] },
};

let nextId = 1;

export function creatureAt(x, y) {
  return game.creatures.find(c => c.x === x && c.y === y && c.hp > 0) || null;
}
export function playerAt(x, y) {
  const p = game.player;
  return p && p.x === x && p.y === y;
}
// a tile a body can step onto
export function tileFree(x, y, ignore) {
  if (isBlocked(x, y)) return false;
  if (playerAt(x, y) && ignore !== 'player') return false;
  const c = creatureAt(x, y);
  if (c && c !== ignore) return false;
  return true;
}

class Entity {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.dir = DIR.DOWN;
    this.fromX = x; this.fromY = y;
    this.moveStart = -99999;
    this.moveDur = STEP_MS;
  }
  isMoving(now) { return now < this.moveStart + this.moveDur; }
  // returns true if the step was taken
  step(dir, now, dur) {
    if (this.isMoving(now)) return false;
    this.dir = dir;
    const v = DIR_VEC[dir];
    const nx = this.x + v.x, ny = this.y + v.y;
    if (!tileFree(nx, ny, this)) return false;
    this.fromX = this.x; this.fromY = this.y;
    this.x = nx; this.y = ny;
    this.moveStart = now; this.moveDur = dur;
    return true;
  }
  // interpolated render position (in tiles)
  renderPos(now) {
    const t = clamp((now - this.moveStart) / this.moveDur, 0, 1);
    return {
      x: this.fromX + (this.x - this.fromX) * t,
      y: this.fromY + (this.y - this.fromY) * t,
    };
  }
}

export class Player extends Entity {
  constructor(x, y) {
    super(x, y);
    this.kind = 'player';
    this.name = 'Adventurer';
    this.level = 1;
    this.exp = 0;
    this.food = 120;
    this.backpack = [];
    this.equip = { helmet: null, amulet: null, backpack: null, armor: null, weapon: null, shield: null, legs: null, ring: null, boots: null };
    this.bonusArmor = 0; this.bonusRegen = 0;
    this.atkRange = [1, 6]; this.defense = 2;
    this.lastAttack = 0; this.lastStep = 0;
    this.lastRegen = 0;
    this.applyLevelStats(true);
  }
  applyLevelStats(full) {
    this.maxHp = maxHpForLevel(this.level);
    this.maxMana = maxManaForLevel(this.level);
    this.maxCap = maxCapForLevel(this.level);
    if (full) { this.hp = this.maxHp; this.mana = this.maxMana; }
    else { this.hp = Math.min(this.hp, this.maxHp); this.mana = Math.min(this.mana, this.maxMana); }
  }
}

export class Creature extends Entity {
  constructor(type, x, y) {
    super(x, y);
    const t = CREATURES[type];
    this.kind = 'creature';
    this.type = type;
    this.name = t.name;
    this.tmpl = t;
    this.maxHp = t.hp; this.hp = t.hp;
    this.id = nextId++;
    this.spawnX = x; this.spawnY = y;
    this.zone = null;
    this.target = null;
    this.lastAttack = 0;
    this.nextThink = 0;
    this.hitFlash = 0;
  }

  update(now) {
    if (this.hp <= 0 || this.isMoving(now)) return;
    if (now < this.nextThink) return;

    const p = game.player;
    const d = dist(this.x, this.y, p.x, p.y);

    // aggro: chase the player if close enough (or already provoked)
    if (p.hp > 0 && (d <= this.tmpl.aggro || this.target === p)) {
      this.target = p;
      if (d <= 1) {
        // adjacent: face the player, let combat.js handle the swing
        this.faceToward(p.x, p.y);
        this.nextThink = now + 200;
        return;
      }
      if (this.tmpl.ranged && d <= 5) {
        this.faceToward(p.x, p.y);
        this.nextThink = now + 300; // hold position and breathe fire (combat.js)
        return;
      }
      this.stepToward(p.x, p.y, now);
      this.nextThink = now + 40;
      return;
    }

    // idle wander near spawn
    this.target = null;
    if (Math.random() < 0.5) {
      const dir = Math.floor(Math.random() * 4);
      if (dist(this.x, this.y, this.spawnX, this.spawnY) < 6) this.step(dir, now, this.tmpl.speed);
    }
    this.nextThink = now + 600 + Math.random() * 900;
  }

  faceToward(tx, ty) {
    const dx = tx - this.x, dy = ty - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
    else this.dir = dy > 0 ? DIR.DOWN : DIR.UP;
  }

  stepToward(tx, ty, now) {
    const dx = tx - this.x, dy = ty - this.y;
    const tries = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx !== 0) tries.push(dx > 0 ? DIR.RIGHT : DIR.LEFT);
      if (dy !== 0) tries.push(dy > 0 ? DIR.DOWN : DIR.UP);
    } else {
      if (dy !== 0) tries.push(dy > 0 ? DIR.DOWN : DIR.UP);
      if (dx !== 0) tries.push(dx > 0 ? DIR.RIGHT : DIR.LEFT);
    }
    for (const dir of tries) if (this.step(dir, now, this.tmpl.speed)) return true;
    return false;
  }
}

// ----- spawner -----
function randTileIn(zone) {
  for (let i = 0; i < 30; i++) {
    const x = zone.x + Math.floor(Math.random() * zone.w);
    const y = zone.y + Math.floor(Math.random() * zone.h);
    if (tileFree(x, y) && dist(x, y, SPAWN.x, SPAWN.y) > 4) return { x, y };
  }
  return null;
}

export function spawnInitial() {
  for (const zone of ZONES) {
    for (let i = 0; i < zone.max; i++) {
      const pos = randTileIn(zone);
      if (!pos) continue;
      const c = new Creature(zone.creature, pos.x, pos.y);
      c.zone = zone;
      game.creatures.push(c);
    }
  }
}

let lastRespawnCheck = 0;
export function maintainSpawns(now) {
  if (now - lastRespawnCheck < 3000) return;
  lastRespawnCheck = now;
  for (const zone of ZONES) {
    const alive = game.creatures.filter(c => c.zone === zone && c.hp > 0).length;
    if (alive < zone.max && Math.random() < 0.5) {
      const pos = randTileIn(zone);
      if (!pos) continue;
      const c = new Creature(zone.creature, pos.x, pos.y);
      c.zone = zone;
      game.creatures.push(c);
    }
  }
}
