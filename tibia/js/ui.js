// ui.js — DOM client chrome: bars, minimap, paper-doll, backpack, skills,
// battle list, console, spell bar, loot window, death screen.

import { game, dist } from './state.js';
import { view } from './config.js';
import { sprites } from './sprites.js';
import { ITEMS, SLOTS, useItem, equipFromBackpack, unequip } from './items.js';
import { castSpell } from './spells.js';
import { setTarget } from './combat.js';
import { addToBackpackFromCorpse, closeLoot } from './loot.js';
import { resetGame } from './save.js';

let el = {};

// build a fresh icon canvas (only called when a panel is re-rendered, so cheap)
function makeIcon(spriteKey, size = 32) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  const src = sprites.items[spriteKey];
  if (src) x.drawImage(src, 0, 0, size, size);
  return c;
}

export function initUI() {
  el = {
    minimap: document.getElementById('minimap'),
    hpFill: document.getElementById('hp-fill'),
    hpText: document.getElementById('hp-text'),
    manaFill: document.getElementById('mana-fill'),
    manaText: document.getElementById('mana-text'),
    equipment: document.getElementById('equipment'),
    backpack: document.getElementById('backpack'),
    skills: document.getElementById('skills'),
    battle: document.getElementById('battle-list'),
    consolelog: document.getElementById('console-log'),
    chatinput: document.getElementById('chat-input'),
    loot: document.getElementById('loot-window'),
    lootItems: document.getElementById('loot-items'),
    deathscreen: document.getElementById('death-screen'),
  };
  el.miniCtx = el.minimap.getContext('2d');
  el.miniCtx.imageSmoothingEnabled = false;

  // spell bar
  document.querySelectorAll('[data-spell]').forEach(b => {
    b.addEventListener('click', () => castSpell(b.dataset.spell));
  });
  // console tabs
  document.querySelectorAll('[data-tab]').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      game.consoleTab = t.dataset.tab;
      game.messagesDirty = true;
    });
  });
  // equipment slots: click to unequip
  el.equipment.querySelectorAll('[data-slot]').forEach(s => {
    s.addEventListener('click', () => unequip(s.dataset.slot));
  });
  // loot window close
  document.getElementById('loot-close').addEventListener('click', closeLoot);
  // reset button
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Reset your character? All progress will be lost.')) resetGame();
  });
  // respawn button
  document.getElementById('respawn-btn').addEventListener('click', () => {
    game.deathScreen = false; game.paused = false;
  });

  // chat input: type spell words like the real client
  el.chatinput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = el.chatinput.value.trim().toLowerCase();
      el.chatinput.value = '';
      if (!text) return;
      handleChat(text);
      e.stopPropagation();
    }
  });

  game.consoleTab = 'default';
}

function handleChat(text) {
  const spellWords = ['exura vita', 'exura', 'exori'];
  const match = spellWords.find(w => text === w);
  if (match) castSpell(match);
  else {
    game.messages.push({ text: 'You say: ' + text, type: 'yellow' });
    game.messagesDirty = true;
  }
}

// ---------------------------------------------------------------- per-frame
export function renderUI(now) {
  const p = game.player;
  // bars
  const hpPct = Math.max(0, Math.round((p.hp / p.maxHp) * 100));
  const manaPct = Math.max(0, Math.round((p.mana / p.maxMana) * 100));
  el.hpFill.style.width = hpPct + '%';
  el.manaFill.style.width = manaPct + '%';
  el.hpText.textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
  el.manaText.textContent = `${Math.max(0, Math.ceil(p.mana))} / ${p.maxMana}`;

  renderMinimap();
  renderBattleList();

  if (game.invDirty) { renderEquipment(); renderBackpack(); game.invDirty = false; game.statsDirty = true; }
  if (game.statsDirty) { renderSkills(); game.statsDirty = false; }
  if (game.messagesDirty) { renderConsole(); game.messagesDirty = false; }

  // spell button exhaust state
  const exh = now < game.exhaustUntil;
  document.querySelectorAll('[data-spell]').forEach(b => b.classList.toggle('exhausted', exh));

  // loot window
  if (game.lootWindow) {
    el.loot.classList.remove('hidden');
    if (game.lootDirty) { showLoot(); game.lootDirty = false; }
  } else {
    el.loot.classList.add('hidden');
  }

  // death screen
  el.deathscreen.classList.toggle('hidden', !game.deathScreen);
}

function renderMinimap() {
  const base = game.map.minimapBase;
  const ctx = el.miniCtx;
  const W = el.minimap.width, H = el.minimap.height;
  const scale = W / base.width;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(base, 0, 0, base.width, base.height, 0, 0, W, H);
  // creatures
  for (const c of game.creatures) {
    if (c.hp <= 0) continue;
    ctx.fillStyle = c.type === 'dragon' || c.type === 'cyclops' ? '#ff5a3a' : '#e8a0a0';
    ctx.fillRect(Math.floor(c.x * scale), Math.floor(c.y * scale), 2, 2);
  }
  // player
  const p = game.player;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.floor(p.x * scale) - 1, Math.floor(p.y * scale) - 1, 3, 3);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
  ctx.strokeRect(Math.floor(p.x * scale) - 1.5, Math.floor(p.y * scale) - 1.5, 4, 4);
}

function renderBattleList() {
  const p = game.player;
  const near = game.creatures
    .filter(c => c.hp > 0 && dist(p.x, p.y, c.x, c.y) <= Math.ceil(view.w / 2) + 1)
    .sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y))
    .slice(0, 12);
  el.battle.innerHTML = '';
  for (const c of near) {
    const row = document.createElement('div');
    row.className = 'battle-row' + (game.target === c ? ' targeted' : '');
    const ic = document.createElement('canvas'); ic.width = 20; ic.height = 20;
    const cx = ic.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(sprites.creatures[c.type], 0, 0, 20, 20);
    const info = document.createElement('div'); info.className = 'battle-info';
    const nm = document.createElement('div'); nm.className = 'battle-name'; nm.textContent = c.name;
    const hpbar = document.createElement('div'); hpbar.className = 'battle-hp';
    const hpfill = document.createElement('div'); hpfill.className = 'battle-hp-fill';
    hpfill.style.width = Math.max(0, Math.round((c.hp / c.maxHp) * 100)) + '%';
    hpbar.appendChild(hpfill);
    info.appendChild(nm); info.appendChild(hpbar);
    row.appendChild(ic); row.appendChild(info);
    row.addEventListener('click', () => setTarget(c));
    el.battle.appendChild(row);
  }
  if (!near.length) el.battle.innerHTML = '<div class="battle-empty">No creatures nearby.</div>';
}

function renderEquipment() {
  const p = game.player;
  el.equipment.querySelectorAll('[data-slot]').forEach(div => {
    div.innerHTML = '';
    const e = p.equip[div.dataset.slot];
    if (e) div.appendChild(makeIcon(ITEMS[e.id].sprite, 30));
    div.classList.toggle('filled', !!e);
  });
}

function renderBackpack() {
  const p = game.player;
  el.backpack.innerHTML = '';
  const SLOTS_N = 20;
  for (let i = 0; i < SLOTS_N; i++) {
    const cell = document.createElement('div');
    cell.className = 'bp-cell';
    const s = p.backpack[i];
    if (s) {
      const def = ITEMS[s.id];
      cell.appendChild(makeIcon(def.sprite, 30));
      if (s.count > 1) {
        const cnt = document.createElement('span'); cnt.className = 'bp-count'; cnt.textContent = s.count;
        cell.appendChild(cnt);
      }
      cell.title = def.name;
      cell.classList.add('filled');
      cell.addEventListener('click', () => useItem(i));
    }
    el.backpack.appendChild(cell);
  }
}

function renderSkills() {
  const p = game.player;
  const need = (lvl) => Math.round((50 / 3) * (lvl ** 3 - 6 * lvl ** 2 + 17 * lvl - 12));
  const toNext = need(p.level + 1) - p.exp;
  const rows = [
    ['Level', p.level],
    ['Experience', p.exp.toLocaleString()],
    ['XP to level', Math.max(0, toNext).toLocaleString()],
    ['Hit Points', `${Math.ceil(p.hp)} / ${p.maxHp}`],
    ['Mana', `${Math.ceil(p.mana)} / ${p.maxMana}`],
    ['Capacity', p.maxCap],
    ['Attack', p.atkRange[0] + '-' + p.atkRange[1]],
    ['Armor', p.bonusArmor],
    ['Defense', p.defense],
  ];
  el.skills.innerHTML = rows.map(([k, v]) =>
    `<div class="skill-row"><span>${k}</span><span>${v}</span></div>`).join('');
}

const TYPE_COLOR = {
  white: '#e0e0e0', green: '#5ad05a', orange: '#ff8c1a', yellow: '#f4e04a',
  lightblue: '#7fc8ff', magenta: '#e070d0', red: '#ff5a4a',
};

function renderConsole() {
  const serverTypes = new Set(['lightblue', 'magenta', 'red']);
  const msgs = game.messages.filter(m =>
    game.consoleTab === 'server' ? serverTypes.has(m.type) : true);
  el.consolelog.innerHTML = msgs.slice(-60).map(m =>
    `<div class="log-line" style="color:${TYPE_COLOR[m.type] || '#e0e0e0'}">${escapeHtml(m.text)}</div>`).join('');
  el.consolelog.scrollTop = el.consolelog.scrollHeight;
}

function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

// ---------------------------------------------------------------- loot window
function showLoot() {
  const corpse = game.lootWindow;
  el.lootItems.innerHTML = '';
  if (!corpse.contents.length) {
    el.lootItems.innerHTML = '<div class="loot-empty">Nothing.</div>';
    return;
  }
  corpse.contents.forEach((s, i) => {
    const cell = document.createElement('div');
    cell.className = 'bp-cell filled';
    cell.appendChild(makeIcon(ITEMS[s.id].sprite, 30));
    if (s.count > 1) {
      const cnt = document.createElement('span'); cnt.className = 'bp-count'; cnt.textContent = s.count;
      cell.appendChild(cnt);
    }
    cell.title = ITEMS[s.id].name + ' (click to take)';
    cell.addEventListener('click', () => addToBackpackFromCorpse(corpse, i));
    el.lootItems.appendChild(cell);
  });
}
