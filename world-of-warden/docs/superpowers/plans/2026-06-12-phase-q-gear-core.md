# Phase Q — Gear System Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed 15-item LOOT table with generated gear (5 slots × 5 rarities × ilvl stat budgets), an equip model where `player.gearStats` is derived from equipped items, and an inventory screen.

**Architecture:** New `// ── MODULE: GEAR ──` beside the CLASSES module. `generateItem(ilvl, opts)` rolls stats from `budget(ilvl) × rarityMult` with slot-weighted profiles. `player.equipped` (5 slots) + run-scoped `gearStash[]`; `recomputeGearTotals()` sums equipped → `player.gearStats` → `recomputeStats()` (single-writer chain preserved). All acquisition sites (enemy/boss drops, chest) emit generated items through one `acquireItem()` path (auto-equip if better, else stash). Loot rolls use `Math.random()` — same as existing drop rolls; dungeon RNG untouched.

**Tech Stack:** Vanilla JS in single `index.html` (~5090 lines). No test framework — every task verifies via browser preview: server `mcp__Claude_Preview__preview_start` name `"static-http (python)"` (reuses running), reload via `preview_eval` `window.location.reload()`, start via `preview_click` `#start-btn` (fallback: eval `startGame()`), assertions via `preview_eval`, error sweep via `preview_console_logs` level=error. RAF does NOT advance in the hidden preview window — step frames manually with `update(16); drawGame(16)` when needed; this is normal, not a bug. Commits go directly on `main` (project convention; PowerShell tool).

**Current-code anchors (verified 2026-06-12):** LOOT 1774–1792 · RARITY_COL 1793 · RARITY_RANK 3002 · `_chestRarityWeights` 4700 · `_pickRarity` 4707 · `pickItemByRarity` 4720 · `pickUpgradeItem` 4738 · `generateChestOffer` 4759 · `computeStatDeltas` 4768 · `_applyItemToPlayer` 4778 · `renderInventoryModal` 4791 · `selectChestItem` 4829 · `openChest` 5003 · enemy drops 2905–2911 · boss drops 2846–2868 · pickup collect 4451–4459 · `spawnItem` 2038 · tooltip 3449 · `updateBestItem` 3032 · `initPlayerStats` ~1692 · chest HTML 514–523 · chest CSS 251–312. Line numbers drift as tasks land — always locate by searching the named symbol.

---

### Task 1: GEAR module — generation data + `generateItem` + `itemScore`

Pure addition; game behavior unchanged. Insert a new module immediately AFTER the CLASSES module (after `window.__setClass = ...};`) and BEFORE the `// GAME STATE` banner.

**Files:**
- Modify: `index.html` (one insertion block)

- [ ] **Step 1: Insert the GEAR module**

```js
// ─────────────────────────────────────────────
// MODULE: GEAR (Phase Q — RPG pivot)
// Generated equipment: 5 slots × 5 rarities × ilvl-budget stat rolls.
// Replaces the fixed LOOT table. ilvl == floorNum until Phase S stages.
// Loot rolls use Math.random() (mid-game stochastic, same as drop rolls);
// dungeon RNG is never touched here.
// ─────────────────────────────────────────────
const GEAR_SLOTS = ['weapon','helm','armor','boots','ring'];
const GEAR_ICON  = { weapon:'⚔', helm:'🪖', armor:'🛡', boots:'👟', ring:'💍' };
const GEAR_LABEL = { weapon:'Weapon', helm:'Helm', armor:'Armor', boots:'Boots', ring:'Ring' };
const RARITY_MULT = { common:1, uncommon:1.35, rare:1.8, epic:2.4, legendary:3.2 };
// stat points → stat units (hp/mp are cheaper per point; spd is % based)
const STAT_RATE = { atk:1, def:1, hp:3, mp:2, spdPct:0.8 };
// slot stat-weight profiles; highest weight = the slot's primary stat
const SLOT_PROFILE = {
  weapon: { atk:0.70, def:0.10, hp:0.10, mp:0.10 },
  helm:   { def:0.40, hp:0.30, mp:0.30 },
  armor:  { hp:0.45, def:0.40, mp:0.15 },
  boots:  { spdPct:0.55, def:0.20, hp:0.25 },
  ring:   { atk:0.25, def:0.25, hp:0.20, mp:0.20, spdPct:0.10 },
};
const GEAR_NAME = {
  weapon: ['Sword','Blade','Saber','Claymore'],
  helm:   ['Helm','Hood','Visor','Circlet'],
  armor:  ['Vest','Plate','Cloak','Mail'],
  boots:  ['Boots','Greaves','Striders','Treads'],
  ring:   ['Ring','Band','Loop','Signet'],
};
const RARITY_PREFIX = {
  common:    ['Rusted','Worn','Plain'],
  uncommon:  ["Soldier's",'Sturdy','Keen'],
  rare:      ["Knight's",'Runed','Gleaming'],
  epic:      ['Royal','Shadowforged','Sunblessed'],
  legendary: ["Warden's",'Kingsbane','Doomforged'],
};
const RARITY_LINES = { common:1, uncommon:2, rare:2, epic:3, legendary:4 };

function gearBudget(ilvl) { return 6 + ilvl * 4; }

// opts: { rarity, minRarity, slot } — all optional.
function generateItem(ilvl, opts) {
  opts = opts || {};
  let rarity = opts.rarity || _pickRarity(ilvl);
  if (opts.minRarity && RARITY_RANK[rarity] < RARITY_RANK[opts.minRarity]) rarity = opts.minRarity;
  const slot   = opts.slot || GEAR_SLOTS[Math.floor(Math.random()*GEAR_SLOTS.length)];
  const budget = Math.max(2, Math.round(gearBudget(ilvl) * RARITY_MULT[rarity] * (0.85 + Math.random()*0.3)));
  const prof   = SLOT_PROFILE[slot];
  const keys   = Object.keys(prof);
  const primary = keys.reduce((a,b) => prof[a] >= prof[b] ? a : b);
  const lines  = Math.min(RARITY_LINES[rarity], keys.length);
  const stats  = { atk:0, def:0, hp:0, mp:0, spdPct:0 };
  const primaryPts = Math.max(1, Math.round(budget * (0.55 + Math.random()*0.2)));
  stats[primary] = Math.max(1, Math.round(primaryPts * STAT_RATE[primary]));
  let remaining = budget - primaryPts;
  const secKeys = keys.filter(k => k !== primary);
  for (let i = 1; i < lines && remaining > 0 && secKeys.length; i++) {
    const k   = secKeys.splice(Math.floor(Math.random()*secKeys.length), 1)[0];
    const pts = (i === lines - 1 || secKeys.length === 0)
      ? remaining
      : Math.max(1, Math.round(remaining * (0.4 + Math.random()*0.3)));
    stats[k] += Math.max(1, Math.round(pts * STAT_RATE[k]));
    remaining -= pts;
  }
  const base = GEAR_NAME[slot][Math.floor(Math.random()*GEAR_NAME[slot].length)];
  const pre  = RARITY_PREFIX[rarity][Math.floor(Math.random()*RARITY_PREFIX[rarity].length)];
  return {
    slot, rarity, ilvl, stats,
    name: pre + ' ' + base,
    icon: GEAR_ICON[slot],
    type: GEAR_LABEL[slot] + ' · ilvl ' + ilvl,
    desc: '',
    gold: Math.max(10, Math.round(budget * 3)),
  };
}

// Comparable power score ≈ budget points spent (inverse of STAT_RATE).
function itemScore(it) {
  const s = it.stats;
  return s.atk / STAT_RATE.atk + s.def / STAT_RATE.def + s.hp / STAT_RATE.hp
       + s.mp / STAT_RATE.mp + s.spdPct / STAT_RATE.spdPct;
}

// Display-stat lines for tooltip/cards, e.g. { ATK:'+12', SPD:'+8%' }.
function _dispStats(it) {
  const d = {};
  if (it.stats.atk)    d.ATK = '+' + it.stats.atk;
  if (it.stats.def)    d.DEF = '+' + it.stats.def;
  if (it.stats.hp)     d.HP  = '+' + it.stats.hp;
  if (it.stats.mp)     d.MP  = '+' + it.stats.mp;
  if (it.stats.spdPct) d.SPD = '+' + it.stats.spdPct + '%';
  return d;
}
```

Notes for the implementer: `_pickRarity` and `RARITY_RANK` are declared later in the file — function declarations hoist and the consts are initialized long before any runtime call to `generateItem`, so forward references are safe (same pattern the CLASSES module already uses with `player`).

- [ ] **Step 2: Verify in browser**

Reload, then eval (no game start needed):
```js
(() => { const r = []; for (let i=0;i<200;i++) {
  const it = generateItem(5);
  const sum = it.stats.atk + it.stats.def + it.stats.hp + it.stats.mp + it.stats.spdPct;
  r.push([GEAR_SLOTS.includes(it.slot), RARITY_MULT[it.rarity] !== undefined,
          sum > 0, it.name.length > 3, it.gold >= 10, Number.isFinite(itemScore(it))]);
} return JSON.stringify({allOk: r.every(x => x.every(Boolean))}); })()
```
Expected: `{"allOk":true}`.
Also: `generateItem(5,{minRarity:'epic'}).rarity` run 5× → only `"epic"` or `"legendary"`. And `generateItem(3,{slot:'boots'}).stats.spdPct` > 0 (boots primary). Console errors clean.

- [ ] **Step 3: Commit**

```
git add index.html
git commit -m "Phase Q: GEAR module — generated items (5 slots x 5 rarities x ilvl budgets)"
```

---

### Task 2: Equip model + acquisition flip + legacy removal

The big one: `player.equipped` + `gearStash`, `recomputeGearTotals` as the bridge into the Phase P stat chain, one `acquireItem()` path, all drop/chest sites emit generated items, LOOT and `_applyItemToPlayer` deleted. Game fully playable after this task (inventory UI comes in Task 3; chest card restyle in Task 4).

**Files:**
- Modify: `index.html` (GEAR module additions + 6 call-site edits + deletions)

- [ ] **Step 1: Append the equip/stash model to the GEAR module** (after `itemScore`):

```js
// ── Equip model. player.gearStats is DERIVED: Σ equipped item stats.
// gearStash is run-scoped until the Phase R account save.
let gearStash = [];
const STASH_CAP = 40;

function recomputeGearTotals() {
  const g = { atk:0, def:0, hp:0, mp:0, spdPct:0 };
  for (const slot of GEAR_SLOTS) {
    const it = player.equipped[slot];
    if (!it) continue;
    g.atk += it.stats.atk; g.def += it.stats.def; g.hp += it.stats.hp;
    g.mp  += it.stats.mp;  g.spdPct += it.stats.spdPct;
  }
  player.gearStats = g;
  recomputeStats();
}

function stashItem(it) {
  if (gearStash.length >= STASH_CAP) {
    let wi = 0;
    for (let i = 1; i < gearStash.length; i++)
      if (itemScore(gearStash[i]) < itemScore(gearStash[wi])) wi = i;
    const sold = gearStash.splice(wi, 1)[0];
    player.gold += sold.gold;
    document.getElementById('gold-v').textContent = player.gold;
    addLog(`Stash full — sold ${sold.icon} ${sold.name} (+${sold.gold}g)`, 'loot');
  }
  gearStash.push(it);
}

function equipItem(it) {
  const prev = player.equipped[it.slot];
  player.equipped[it.slot] = it;
  const idx = gearStash.indexOf(it);
  if (idx >= 0) gearStash.splice(idx, 1);
  if (prev) stashItem(prev);
  recomputeGearTotals();
}

function unequipSlot(slot) {
  const it = player.equipped[slot];
  if (!it) return;
  player.equipped[slot] = null;
  stashItem(it);
  recomputeGearTotals();
}

function sellStashItem(idx) {
  const it = gearStash[idx];
  if (!it) return;
  gearStash.splice(idx, 1);
  player.gold += it.gold;
  RunStats.goldCollected += it.gold;
  document.getElementById('gold-v').textContent = player.gold;
  addLog(`Sold ${it.icon} ${it.name} (+${it.gold}g)`, 'loot');
  SFX.pickup_coin();
}

// Single acquisition path for every loot source.
function acquireItem(it) {
  updateBestItem(it);
  const cur = player.equipped[it.slot];
  if (!cur || itemScore(it) > itemScore(cur)) {
    equipItem(it);
    addLog(`Equipped: ${it.icon} ${it.name}`, 'loot');
  } else {
    stashItem(it);
    addLog(`Stashed: ${it.icon} ${it.name}`, 'loot');
  }
  showItemTooltip(it);
  updateHUD();
}
```

- [ ] **Step 2: Player + init wiring.** In the player literal, after the `gearStats:{...}` line, add:
```js
  equipped:{weapon:null, helm:null, armor:null, boots:null, ring:null},  // Phase Q
```
In `initPlayerStats`, immediately before the `player.gearStats = { ... };` line, add:
```js
  player.equipped = { weapon:null, helm:null, armor:null, boots:null, ring:null };
  gearStash = [];
```

- [ ] **Step 3: Flip all acquisition sites.**
1. Enemy drops (search `spawnItem(e.x, e.y-10, LOOT[`): replace the LOOT pick with
   `spawnItem(e.x, e.y-10, generateItem(GameState.floorNum));`
2. Boss drops (in `killEnemy`, the colossus/broodmother blocks that filter LOOT by rarity): replace each whole filtered-pool pick with
   `spawnItem(e.x, e.y-10, generateItem(GameState.floorNum, { minRarity:'epic' }));` (colossus) and `{ minRarity:'rare' }` (broodmother). Keep the bonus-gold and full-heal lines untouched. Adapt the exact spawn coordinates to whatever the existing block uses — read it first.
3. Pickup collection (the `p.type==='item'` branch): replace the body
   (`addLog`/`SFX.pickup_item`/`updateBestItem`/`_applyItemToPlayer`/`showItemTooltip`/`updateHUD` lines) with:
```js
        SFX.pickup_item();
        acquireItem(p.itemDef);
```
4. `generateChestOffer(floorNum)`: replace its body with:
```js
function weakestGearSlot() {
  let worst = GEAR_SLOTS[0], worstScore = Infinity;
  for (const s of GEAR_SLOTS) {
    const it = player.equipped[s];
    const sc = it ? itemScore(it) : -1;     // empty slot always wins
    if (sc < worstScore) { worstScore = sc; worst = s; }
  }
  return worst;
}
function generateChestOffer(floorNum) {
  return [
    generateItem(floorNum),
    generateItem(floorNum),
    generateItem(floorNum, { slot: weakestGearSlot() }),  // upgrade-biased card
  ];
}
```
5. `selectChestItem(idx)`: replace the `_applyItemToPlayer(it)` + `updateBestItem(it)` + its `addLog('Equipped: ...')` + `showItemTooltip(it)` + `updateHUD()` lines with a single `acquireItem(it);` (keep the SFX/`ui_select` and `_closeChestModal(true)` plumbing).
5b. `showItemTooltip`: change `Object.entries(item.stats)` to `Object.entries(_dispStats(item))` — generated items carry numeric `stats`, the display strings come from the GEAR-module `_dispStats` helper.
6. `computeStatDeltas(it)`: replace the whole function with (KEEP the return shape `{stat, amount}` that `renderInventoryModal` consumes — verify by reading the consumer first):
```js
// Phase Q — delta vs the currently equipped item in the candidate's slot.
function computeStatDeltas(it) {
  const cur = player.equipped[it.slot];
  const deltas = [];
  for (const k of ['atk','def','hp','mp','spdPct']) {
    const d = it.stats[k] - (cur ? cur.stats[k] : 0);
    if (d !== 0) deltas.push({ stat: k === 'spdPct' ? 'SPD%' : k.toUpperCase(), amount: d });
  }
  return deltas;
}
```

- [ ] **Step 4: Delete legacy.** Remove entirely: the `LOOT` array (keep `RARITY_COL` on the line after it), `pickItemByRarity`, `pickUpgradeItem`, `_applyItemToPlayer`. Then grep `LOOT`, `pickItemByRarity`, `pickUpgradeItem`, `_applyItemToPlayer` — ZERO references may remain. Keep `_chestRarityWeights`/`_pickRarity` (now used by `generateItem`).

- [ ] **Step 5: Verify in browser** (reload, start game):
```js
(() => { const w = generateItem(3, {slot:'weapon', rarity:'rare'});
  const baseAtk = player.atk;
  acquireItem(w);                                  // empty slot → auto-equips
  const equippedOk = player.equipped.weapon === w && player.atk === baseAtk + w.stats.atk;
  const w2 = generateItem(1, {slot:'weapon', rarity:'common'});
  acquireItem(w2);                                 // worse → stash
  const stashOk = gearStash.includes(w2) && player.equipped.weapon === w;
  unequipSlot('weapon');
  const unequipOk = player.equipped.weapon === null && player.atk === baseAtk && gearStash.length === 2;
  const goldBefore = player.gold;
  sellStashItem(gearStash.indexOf(w2));
  const sellOk = player.gold === goldBefore + w2.gold && !gearStash.includes(w2);
  return JSON.stringify({equippedOk, stashOk, unequipOk, sellOk}); })()
```
Expected: all four `true`.
Then level-up interaction: equip something, `player.xp=player.xpNext; checkLevelUp();` → equipped bonus must persist on top of new base.
Then play-loop sanity: step 200 frames, kill an enemy if possible or eval `killEnemy(enemies[0])` repeatedly until an item drops, walk onto it via teleport (`player.x = pickups.find(p=>p.type==='item').x; ...`), step frames, confirm acquire log appears. Open a chest if reachable (or eval `openChest` with a chest tile from `dungeon.map`); pick a card; confirm it equips/stashes. Console errors clean. Grep output for deleted symbols pasted in report.

- [ ] **Step 6: Commit**
```
git add index.html
git commit -m "Phase Q: equip model + single acquireItem path; all drops generated; LOOT table retired"
```

---

### Task 3: Inventory screen (equipped + stash, equip/sell, touch + keyboard)

**Files:**
- Modify: `index.html` (HTML block, CSS block, JS render/open/close, input wiring)

- [ ] **Step 1: HTML.** After the `#inventory-overlay` block (chest modal, ends line ~524), add:

```html
  <!-- Phase Q — Gear screen: equipped slots + stash -->
  <div id="gear-overlay">
    <div class="gear-panel">
      <div class="gear-title">🎒 GEAR</div>
      <div class="gear-equipped" id="gear-equipped"></div>
      <div class="gear-stash-label">STASH (<span id="gear-stash-count">0</span>/40)</div>
      <div class="gear-stash" id="gear-stash"></div>
      <div class="gear-actions">
        <button class="inv-action-btn skip" onclick="closeGearScreen()">CLOSE</button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: CSS.** After the existing `.inv-action-btn` rules (~line 308), add:

```css
/* Phase Q — Gear screen */
#gear-overlay {
  position:absolute; inset:0; background:rgba(0,0,0,0.78); z-index:60;
  display:none; align-items:center; justify-content:center;
}
#gear-overlay.open { display:flex; }
.gear-panel {
  background:#15151d; border:2px solid #6a5a20; border-radius:8px;
  padding:14px 16px; width:min(520px, 92vw); max-height:86vh;
  display:flex; flex-direction:column; gap:8px;
}
.gear-title { color:#ffd040; font-size:13px; letter-spacing:3px; text-align:center; }
.gear-equipped { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }
.gear-slot {
  width:84px; min-height:64px; border:1px solid #444; border-radius:6px;
  background:#1b1b26; padding:4px; font-size:9px; color:#ccc; text-align:center;
  cursor:pointer;
}
.gear-slot .gs-icon { font-size:18px; }
.gear-slot .gs-name { font-size:8px; line-height:1.2; }
.gear-slot.empty { opacity:0.45; }
.gear-stash-label { color:#999; font-size:9px; letter-spacing:2px; }
.gear-stash {
  overflow-y:auto; max-height:38vh; display:grid;
  grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:6px;
}
.stash-card {
  border:1px solid #444; border-radius:6px; background:#1b1b26;
  padding:5px; font-size:9px; color:#ccc; cursor:pointer; min-height:44px;
}
.stash-card .sc-name { font-size:9px; }
.stash-card .sc-stats { color:#9a9; font-size:8px; }
.stash-card .sc-row { display:flex; gap:4px; margin-top:3px; }
.stash-card button {
  flex:1; font-size:8px; padding:3px 0; min-height:22px; cursor:pointer;
  background:#262635; color:#ddd; border:1px solid #555; border-radius:4px;
}
.gear-actions { display:flex; justify-content:center; }
```

- [ ] **Step 3: JS.** Next to the chest-modal code (near `let inventoryOpen`), add state + functions:

```js
// Phase Q — Gear screen
let gearOpen = false;

function openGearScreen() {
  if (!gameRunning || player.dead || GameState.transitioning || inventoryOpen) return;
  gearOpen = true;
  renderGearScreen();
  document.getElementById('gear-overlay').classList.add('open');
}
function closeGearScreen() {
  gearOpen = false;
  document.getElementById('gear-overlay').classList.remove('open');
}
function renderGearScreen() {
  const eq = document.getElementById('gear-equipped');
  eq.innerHTML = GEAR_SLOTS.map(slot => {
    const it = player.equipped[slot];
    if (!it) return `<div class="gear-slot empty"><div class="gs-icon">${GEAR_ICON[slot]}</div>` +
                    `<div class="gs-name">${GEAR_LABEL[slot]}<br>— empty —</div></div>`;
    const rc = RARITY_COL[it.rarity];
    const lines = Object.entries(_dispStats(it)).map(([k,v])=>`${k} ${v}`).join(' · ');
    return `<div class="gear-slot" style="border-color:${rc}" onclick="unequipSlot('${slot}');renderGearScreen();">` +
           `<div class="gs-icon">${it.icon}</div><div class="gs-name" style="color:${rc}">${it.name}</div>` +
           `<div class="gs-name">${lines}</div></div>`;
  }).join('');
  const st = document.getElementById('gear-stash');
  document.getElementById('gear-stash-count').textContent = gearStash.length;
  st.innerHTML = gearStash.map((it, i) => {
    const rc = RARITY_COL[it.rarity];
    const lines = Object.entries(_dispStats(it)).map(([k,v])=>`${k} ${v}`).join(' · ');
    return `<div class="stash-card" style="border-color:${rc}">` +
           `<div class="sc-name" style="color:${rc}">${it.icon} ${it.name}</div>` +
           `<div class="sc-stats">${lines} · ilvl ${it.ilvl}</div>` +
           `<div class="sc-row">` +
           `<button onclick="equipItem(gearStash[${i}]);renderGearScreen();updateHUD();">EQUIP</button>` +
           `<button onclick="sellStashItem(${i});renderGearScreen();">SELL ${it.gold}g</button>` +
           `</div></div>`;
  }).join('') || `<div style="color:#666;font-size:9px;">Stash is empty — defeat enemies and open chests.</div>`;
}
```
(`_dispStats` already lives in the GEAR module from Task 1; `showItemTooltip` was switched to it in Task 2 — just call it here.)

- [ ] **Step 4: Input wiring.**
1. Pause gate: find the early-return in `update()` reading `if (settingsOpen || inventoryOpen) return;` → `if (settingsOpen || inventoryOpen || gearOpen) return;`
2. ESC handler (search `if (inventoryOpen) skipChestItem();`): add BEFORE that line: `if (gearOpen) { closeGearScreen(); return; }` (match the surrounding structure — read it first; keep chest/settings behavior intact).
3. Keyboard: in the keydown handler where ESC is handled, add a sibling branch: `if ((ev.key === 'i' || ev.key === 'I') && gameRunning && !settingsOpen && !inventoryOpen) { gearOpen ? closeGearScreen() : openGearScreen(); }` (adapt to the handler's actual event-variable name).
4. Touch button: find the touch HUD container holding the potion/spell buttons (`#spell-btns` / `#potion-btn` HTML ~line 460s). Add a sibling button styled like `#potion-btn`:
```html
<div id="gear-btn" title="Gear">🎒</div>
```
with CSS copying `#potion-btn`'s rules (position it above or beside; read the existing absolute-positioning scheme and pick a non-overlapping spot), and JS: `document.getElementById('gear-btn').addEventListener('click', () => gearOpen ? closeGearScreen() : openGearScreen());`
5. Canvas chest-tap guard (search `inventoryOpen` inside the canvas pointerdown handler): add `|| gearOpen` to that early-return condition.

- [ ] **Step 5: Verify in browser.** Reload, start. Eval: acquire 3 items (`acquireItem(generateItem(3))` ×3), `openGearScreen()`, then `preview_screenshot` — equipped slots + stash render. Click an EQUIP button via `preview_click` on a `.stash-card button` selector; confirm `player.equipped` changed. Eval `update(16)` while gearOpen → player position must not change (pause gate works). Keyboard: `preview_eval` dispatch `document.dispatchEvent(new KeyboardEvent('keydown',{key:'i'}))` toggles. `#gear-btn` click toggles. Console errors clean.

- [ ] **Step 6: Commit**
```
git add index.html
git commit -m "Phase Q: gear screen — equipped slots + stash with equip/sell, I key + touch button"
```

---

### Task 4: Chest modal → rarity loot cards

**Files:**
- Modify: `index.html` (`renderInventoryModal` + CSS touches only)

- [ ] **Step 1: Restyle `renderInventoryModal`.** Rewrite the card template so each card shows: big slot icon, name colored by `RARITY_COL[it.rarity]`, rarity label + `ilvl N` line, stat lines from `_dispStats(it)`, and the delta block (existing `computeStatDeltas` output, now vs-equipped) with green `+`/red `−` styling (reuse `.ic-delta-pos`/`.ic-delta-neg`), card border `2px solid` rarity color and a subtle `box-shadow: 0 0 8px <rarity color>` for epic/legendary. Title line: change `⚱ CHEST OPENED` text to `⚱ LOOT — CHOOSE ONE` (HTML). Keep `selectChestItem`/reroll/skip wiring EXACTLY as-is.
- [ ] **Step 2: CSS.** Extend `.item-card` for the rarity border/glow via inline styles in the template (single-file pattern already does inline rarity colors) — only add new CSS classes if the existing `.ic-*` set is insufficient.
- [ ] **Step 3: Verify.** Reload, start, eval-open a chest (`openChest` on a chest tile from `dungeon.map`, or teleport to one), `preview_screenshot` the modal: rarity colors, deltas vs currently-equipped visible. Pick the upgrade-biased card; confirm acquire flow. Reroll once (needs 30g — eval `player.gold = 100` first); confirm new cards render. Console errors clean.
- [ ] **Step 4: Commit**
```
git add index.html
git commit -m "Phase Q: chest modal restyled as rarity loot cards with vs-equipped deltas"
```

---

### Task 5: Smoke test + close-out

- [ ] **Step 1: Full browser smoke** (reload, start, paste every output):
  a) Fresh stats unchanged: `{"hp":100,"mp":50,"atk":12,"def":5,"spd":120,"lvl":1}` from the usual eval.
  b) 300 stepped frames + error sweep clean.
  c) Kill→drop→pickup→auto-equip loop via evals (force `Math.random` luck by looping kills).
  d) Chest end-to-end: open → pick → equipped/stashed; reroll; skip → gold drops.
  e) Gear screen: open via key, equip from stash, sell, close; pause gate verified.
  f) Level-up with gear equipped: stats = classBase(level) + Σ equipped (recompute by hand from `player.equipped`, assert equality).
  g) `__setClass('knight')` → equipped/stash reset, stats = knight base; back to mage.
  h) Descend 2 floors; drops on floor 3 have `ilvl 3`.
  i) Determinism guard: same `maphash` eval pair as Phase P close-out (seed 12345, before/after reload) — identical.
- [ ] **Step 2: Close-out edits.** index.html footer comment → `// Wardenfall — phases A–O complete; RPG pivot P–Q shipped (stats, classes, gear).` CLAUDE.md roadmap: mark `DONE — RPG Phase Q: gear system core (generateItem, equip/stash, gear screen, loot cards).` and `NEXT — RPG Phase R: screens + account save + playable Knight/Ranger kits.`
- [ ] **Step 3: Commit**
```
git add index.html CLAUDE.md
git commit -m "Phase Q: smoke-verified close-out; roadmap status updated"
```

---

## Self-review checklist (run before execution)
- Spec coverage: generation ✓ (Task 1), 5 slots/5 rarities/ilvl ✓, equip→gearStats ✓ (Task 2), inventory screen ✓ (Task 3), loot cards ✓ (Task 4), sell-for-gold ✓ (Tasks 2/3). Deferred per spec: persistence (R), per-stage ilvl (S).
- Type consistency: item shape `{slot, rarity, ilvl, stats{atk,def,hp,mp,spdPct}, name, icon, type, desc, gold}` used identically in Tasks 1–4; `itemScore`/`_dispStats`/`acquireItem` names consistent.
- Every code step has complete code or an explicit read-the-consumer-first instruction where the surrounding code must be matched in place.
