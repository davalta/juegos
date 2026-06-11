// loot.js — opening corpses and taking items.

import { game, log } from './state.js';
import { ITEMS, addItem } from './items.js';

export function openCorpse(corpse) {
  game.lootWindow = corpse;
  corpse.opened = true;
  game.lootDirty = true;
}

export function closeLoot() {
  game.lootWindow = null;
}

export function addToBackpackFromCorpse(corpse, index) {
  const s = corpse.contents[index];
  if (!s) return;
  addItem(s.id, s.count, true);
  const def = ITEMS[s.id];
  log(`You take ${s.count > 1 ? s.count + ' ' + def.name + 's' : (/^[aeiou]/i.test(def.name) ? 'an ' : 'a ') + def.name}.`, 'green');
  corpse.contents.splice(index, 1);
  game.lootDirty = true;
  if (!corpse.contents.length) {
    // empty corpse: auto-close shortly
    game.lootDirty = true;
  }
}

export function takeAll(corpse) {
  for (const s of [...corpse.contents]) addItem(s.id, s.count, true);
  corpse.contents.length = 0;
  game.lootDirty = true;
}
