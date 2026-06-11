// items.js — item defs, inventory, equipment, loot tables.

import { game, log, randInt, chance } from './state.js';

// slot ids match the paper-doll in the sidebar
export const SLOTS = ['helmet', 'amulet', 'backpack', 'armor', 'weapon', 'shield', 'legs', 'ring', 'boots'];

export const ITEMS = {
  gold:          { name: 'gold coin',               sprite: 'gold',          type: 'gold', stack: true, weight: 0 },
  meat:          { name: 'meat',                     sprite: 'meat',          type: 'food', heal: [6, 12], weight: 8 },
  club:          { name: 'club',                     sprite: 'club',          slot: 'weapon', atk: [1, 9],  weight: 35 },
  sword:         { name: 'sword',                    sprite: 'sword',         slot: 'weapon', atk: [4, 16], weight: 35 },
  firesword:     { name: 'fire sword',               sprite: 'firesword',     slot: 'weapon', atk: [8, 28], weight: 42 },
  leatherarmor:  { name: 'leather armor',            sprite: 'leatherarmor',  slot: 'armor',  arm: 4,  weight: 60 },
  platearmor:    { name: 'plate armor',              sprite: 'platearmor',    slot: 'armor',  arm: 10, weight: 120 },
  woodshield:    { name: 'wooden shield',            sprite: 'woodshield',    slot: 'shield', def: 6,  weight: 30 },
  steelshield:   { name: 'steel shield',             sprite: 'steelshield',   slot: 'shield', def: 14, weight: 55 },
  leatherhelmet: { name: 'leather helmet',           sprite: 'leatherhelmet', slot: 'helmet', arm: 1,  weight: 8 },
  steelhelmet:   { name: 'steel helmet',             sprite: 'steelhelmet',   slot: 'helmet', arm: 6,  weight: 42 },
  boots:         { name: 'leather boots',            sprite: 'boots',         slot: 'boots',  arm: 1,  weight: 7 },
  legs:          { name: 'brass legs',               sprite: 'platearmor',    slot: 'legs',   arm: 4,  weight: 60 },
  backpack:      { name: 'backpack',                 sprite: 'backpack',      slot: 'backpack', container: true, weight: 18 },
  amulet:        { name: 'protection amulet',        sprite: 'amulet',        slot: 'amulet', arm: 2,  weight: 5 },
  ring:          { name: 'life ring',                sprite: 'ring',          slot: 'ring',   regen: 2, weight: 1 },
  rune_uh:       { name: 'ultimate healing rune',    sprite: 'rune_uh',       type: 'rune', rune: 'uh',  stack: true, weight: 1 },
  rune_sd:       { name: 'sudden death rune',        sprite: 'rune_sd',       type: 'rune', rune: 'sd',  stack: true, weight: 1 },
  rune_gfb:      { name: 'great fireball rune',      sprite: 'rune_gfb',      type: 'rune', rune: 'gfb', stack: true, weight: 1 },
  rune_hmm:      { name: 'heavy magic missile rune', sprite: 'rune_hmm',      type: 'rune', rune: 'hmm', stack: true, weight: 1 },
};

export function itemDef(id) { return ITEMS[id]; }
export function article(name) { return /^[aeiou]/i.test(name) ? 'an ' + name : 'a ' + name; }

// ---- inventory (backpack is an array of { id, count }) ----
export function addItem(id, count = 1, silent = false) {
  const def = ITEMS[id]; if (!def) return;
  const bp = game.player.backpack;
  if (def.stack) {
    const s = bp.find(s => s.id === id);
    if (s) s.count += count; else bp.push({ id, count });
  } else {
    for (let i = 0; i < count; i++) bp.push({ id, count: 1 });
  }
  game.invDirty = true;
  if (!silent) {
    const label = def.stack && count > 1 ? `${count} ${def.name}s` : article(def.name);
    log(`You see ${label}.`, 'green');
  }
}

export function removeFromBackpack(index, count = 1) {
  const bp = game.player.backpack;
  const s = bp[index]; if (!s) return;
  s.count -= count;
  if (s.count <= 0) bp.splice(index, 1);
  game.invDirty = true;
}

export function countItem(id) {
  return game.player.backpack.filter(s => s.id === id).reduce((a, s) => a + s.count, 0);
}

// ---- equipment ----
export function equipFromBackpack(index) {
  const p = game.player;
  const s = p.backpack[index]; if (!s) return;
  const def = ITEMS[s.id];
  if (!def.slot) { useItem(index); return; }
  const slot = def.slot;
  const prev = p.equip[slot];
  removeFromBackpack(index, 1);
  p.equip[slot] = { id: s.id };
  if (prev) addItem(prev.id, 1, true);
  log(`You equip ${article(def.name)}.`, 'white');
  recalcStats();
}

export function unequip(slot) {
  const p = game.player;
  const cur = p.equip[slot]; if (!cur) return;
  p.equip[slot] = null;
  addItem(cur.id, 1, true);
  recalcStats();
  game.invDirty = true;
}

export function useItem(index) {
  const p = game.player;
  const s = p.backpack[index]; if (!s) return;
  const def = ITEMS[s.id];
  if (def.type === 'food') {
    const heal = randInt(def.heal[0], def.heal[1]);
    p.food = Math.min(600, (p.food || 0) + 60);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    removeFromBackpack(index, 1);
    log('Munch.', 'orange');
  } else if (def.type === 'rune') {
    // arm the crosshair; targeting handled by input/spells
    game.pendingRune = { id: s.id, rune: def.rune, index };
    log(`Select a target for the ${def.name}.`, 'lightblue');
  } else if (def.slot) {
    equipFromBackpack(index);
  }
}

export function recalcStats() {
  const p = game.player;
  let arm = 0, regen = 0;
  for (const slot of SLOTS) {
    const e = p.equip[slot]; if (!e) continue;
    const d = ITEMS[e.id];
    arm += d.arm || 0;
    regen += d.regen || 0;
  }
  p.bonusArmor = arm;
  p.bonusRegen = regen;
  const wpn = p.equip.weapon ? ITEMS[p.equip.weapon.id] : null;
  p.atkRange = wpn ? wpn.atk.slice() : [1, 6]; // bare fists
  const shield = p.equip.shield ? ITEMS[p.equip.shield.id] : null;
  p.defense = (shield ? shield.def : 0) + 2;
  game.invDirty = true;
}

// ---- loot tables ----  [ id, chance, [minCount,maxCount] ]
export const LOOT = {
  rat:     [['gold', 0.6, [1, 4]], ['meat', 0.25, [1, 1]]],
  snake:   [['gold', 0.4, [1, 3]], ['meat', 0.2, [1, 1]]],
  wolf:    [['gold', 0.6, [1, 8]], ['meat', 0.35, [1, 1]], ['rune_hmm', 0.05, [1, 1]]],
  rotworm: [['gold', 0.75, [3, 18]], ['meat', 0.3, [1, 1]], ['rune_hmm', 0.1, [1, 2]], ['leatherhelmet', 0.06, [1, 1]]],
  cyclops: [['gold', 0.9, [10, 45]], ['meat', 0.4, [1, 1]], ['steelshield', 0.08, [1, 1]],
            ['rune_sd', 0.08, [1, 2]], ['platearmor', 0.03, [1, 1]]],
  dragon:  [['gold', 1.0, [40, 100]], ['steelshield', 0.2, [1, 1]], ['platearmor', 0.12, [1, 1]],
            ['firesword', 0.04, [1, 1]], ['rune_sd', 0.5, [2, 5]], ['rune_gfb', 0.3, [2, 4]],
            ['steelhelmet', 0.1, [1, 1]]],
};

export function rollLoot(creatureName) {
  const table = LOOT[creatureName] || [];
  const out = [];
  for (const [id, ch, range] of table) {
    if (chance(ch)) out.push({ id, count: randInt(range[0], range[1]) });
  }
  return out;
}
