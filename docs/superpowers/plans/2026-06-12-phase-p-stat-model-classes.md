# Phase P — Stat Model + Classes (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace permanent stat mutation with a derived model — `player stats = classBase(classId, level) + gearStats` — and introduce `CLASS_DEFS` for Knight/Ranger/Mage, with Mage numerically identical to the current hero (zero gameplay change this phase).

**Architecture:** New `// ── MODULE: CLASSES ──` data block + three pure-ish functions (`classBaseStats`, `recomputeStats`, `initPlayerStats`). Every site that mutates player stats permanently (level-up, item pickup, chest equip) now writes to `player.gearStats` or bumps `player.level`, then calls `recomputeStats()`. Knight/Ranger exist as data only; their kits/sprites land in Phase R.

**Tech Stack:** Vanilla JS in `index.html`. No test framework — each task verifies via the browser preview (`preview_eval` with expected values). Game must run after every task.

**Verification baseline (current behavior to preserve for Mage):**
- Fresh game Lv.1: maxHp 100, maxMp 50, atk 12, def 5, speed 120
- Per level-up: +25 maxHp, +10 maxMp, +4 atk, +2 def, full heal, xpNext ×1.6
- Item `dHp`: raises maxHp AND heals by the same amount
- Known intentional semantic change: `dSpd` percent bonuses now sum additively on class base speed (`120 × (1 + ΣdSpd/100)`) instead of compounding on current speed. Two Swift Boots: old 172.8 → new 168. Accepted.

---

### Task 1: CLASSES module (data + classBaseStats)

**Files:**
- Modify: `index.html` — insert a new module immediately BEFORE the `// GAME STATE` section header (search for `// GAME STATE`, ~line 1634)

- [ ] **Step 1: Insert the CLASSES module**

```js
// ─────────────────────────────────────────────
// MODULE: CLASSES (Phase P — RPG pivot)
// Player stats are DERIVED: classBase(classId, level) + player.gearStats.
// Mage base/growth == the pre-pivot hero numbers, so this refactor is a
// zero-diff change for current gameplay. Knight/Ranger kits wire up in
// Phase R; until then they are selectable only via window.__setClass.
// ─────────────────────────────────────────────
const CLASS_DEFS = {
  knight: {
    name: 'Knight', icon: '🛡',
    base:   { hp:140, mp:20, atk:14, def:8, speed:110 },
    growth: { hp:35,  mp:4,  atk:4,  def:3 },
    kit: ['bash','stance','whirlwind'],          // Phase R
  },
  ranger: {
    name: 'Ranger', icon: '🏹',
    base:   { hp:90,  mp:30, atk:13, def:4, speed:135 },
    growth: { hp:20,  mp:6,  atk:5,  def:1 },
    kit: ['powershot','multishot','tumble'],     // Phase R
  },
  mage: {
    name: 'Mage', icon: '🔮',
    base:   { hp:100, mp:50, atk:12, def:5, speed:120 },
    growth: { hp:25,  mp:10, atk:4,  def:2 },
    kit: ['firebolt','mend','nova'],             // existing SPELLS
  },
};

function classBaseStats(classId, level) {
  const c = CLASS_DEFS[classId] || CLASS_DEFS.mage;
  const n = level - 1;
  return {
    hp:    c.base.hp  + c.growth.hp  * n,
    mp:    c.base.mp  + c.growth.mp  * n,
    atk:   c.base.atk + c.growth.atk * n,
    def:   c.base.def + c.growth.def * n,
    speed: c.base.speed,
  };
}
```

- [ ] **Step 2: Verify in browser**

Reload preview, click ENTER DUNGEON, then run via preview_eval:
```js
JSON.stringify([classBaseStats('mage',1), classBaseStats('mage',3), classBaseStats('knight',1)])
```
Expected: `[{"hp":100,"mp":50,"atk":12,"def":5,"speed":120},{"hp":150,"mp":70,"atk":20,"def":9,"speed":120},{"hp":140,"mp":20,"atk":14,"def":8,"speed":110}]`

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Phase P: CLASS_DEFS data + classBaseStats (knight/ranger/mage)"
```

---

### Task 2: Derived stats — recomputeStats + initPlayerStats, wired into startGame

**Files:**
- Modify: `index.html` — player literal (search `const player = {`, ~line 1647); CLASSES module (append functions); `startGame()` (search `function startGame`, ~line 4977)

- [ ] **Step 1: Add classId + gearStats to the player literal**

In the `const player = {` literal, after the `atk:12, def:5,` line, add:

```js
  classId:'mage',                       // Phase P — drives classBaseStats
  gearStats:{atk:0, def:0, hp:0, mp:0, spdPct:0},  // Phase P — Σ run bonuses (Phase Q: Σ equipped)
```

- [ ] **Step 2: Append recomputeStats + initPlayerStats to the CLASSES module**

```js
// Recompute all derived stats from class base + gear. Current hp/mp are
// preserved (clamped to new max) unless opts.fullHeal (level-up, new game).
function recomputeStats(opts) {
  const b = classBaseStats(player.classId, player.level);
  const g = player.gearStats;
  player.maxHp = b.hp + g.hp;
  player.maxMp = b.mp + g.mp;
  if (opts && opts.fullHeal) { player.hp = player.maxHp; player.mp = player.maxMp; }
  else {
    player.hp = Math.min(player.hp, player.maxHp);
    player.mp = Math.min(player.mp, player.maxMp);
  }
  player.atk   = b.atk + g.atk;
  player.def   = b.def + g.def;
  player.speed = Math.round(b.speed * (1 + g.spdPct / 100));
}

function initPlayerStats(classId) {
  player.classId = classId;
  player.level = 1; player.xp = 0; player.xpNext = 100;
  player.gearStats = { atk:0, def:0, hp:0, mp:0, spdPct:0 };
  recomputeStats({ fullHeal: true });
}

// Dev helper until the Phase R character-select screen exists. Resets to
// Lv.1 of the given class. NOTE: hotbar kit stays the mage spells until
// Phase R wires per-class kits.
window.__setClass = (id) => {
  if (!CLASS_DEFS[id]) return 'unknown class: ' + id;
  initPlayerStats(id);
  updateHUD();
  return `now ${id} Lv.1 — atk ${player.atk} def ${player.def} hp ${player.maxHp}`;
};
```

- [ ] **Step 3: Call initPlayerStats in startGame**

In `startGame()`, immediately before `resetRunStats();`, add:

```js
  initPlayerStats(player.classId || 'mage');   // Phase P — derived stat model
```

- [ ] **Step 4: Verify in browser**

Reload, ENTER DUNGEON, then preview_eval:
```js
JSON.stringify({hp:player.maxHp, mp:player.maxMp, atk:player.atk, def:player.def, spd:player.speed, lvl:player.level})
```
Expected: `{"hp":100,"mp":50,"atk":12,"def":5,"spd":120,"lvl":1}` — identical to pre-refactor. Then `window.__setClass('knight')` → expected `"now knight Lv.1 — atk 14 def 8 hp 140"`. Then `window.__setClass('mage')` to restore.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Phase P: derived stat model (recomputeStats/initPlayerStats) wired into startGame"
```

---

### Task 3: Level-up goes through the derived model

**Files:**
- Modify: `index.html` — `checkLevelUp()` (search `function checkLevelUp`, ~line 2894)

- [ ] **Step 1: Replace the stat-mutation block**

Replace the body lines:
```js
    player.maxHp += 25; player.hp = player.maxHp;
    player.maxMp += 10; player.mp = player.maxMp;
    player.atk += 4; player.def += 2;
    addLog(`LEVEL UP! Lv.${player.level} — ATK+4 DEF+2 HP full`, 'lvl');
```
with:
```js
    recomputeStats({ fullHeal: true });        // Phase P — growth comes from CLASS_DEFS
    const gr = (CLASS_DEFS[player.classId] || CLASS_DEFS.mage).growth;
    addLog(`LEVEL UP! Lv.${player.level} — ATK+${gr.atk} DEF+${gr.def} HP full`, 'lvl');
```
(The `player.level++`, xp lines, particles/shake/SFX/HUD lines stay untouched.)

- [ ] **Step 2: Verify level-up math in browser**

Reload, ENTER DUNGEON, preview_eval:
```js
(() => { player.xp = player.xpNext; checkLevelUp();
  return JSON.stringify({lvl:player.level, atk:player.atk, def:player.def, hp:player.maxHp, mp:player.maxMp, xpNext:player.xpNext}); })()
```
Expected: `{"lvl":2,"atk":16,"def":7,"hp":125,"mp":60,"xpNext":160}` — same as the old +4/+2/+25/+10 and ×1.6 progression.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Phase P: checkLevelUp derives growth from CLASS_DEFS via recomputeStats"
```

---

### Task 4: Item application goes through gearStats (and DRY the duplicate)

**Files:**
- Modify: `index.html` — `_applyItemToPlayer()` (search `function _applyItemToPlayer`, ~line 4703) and the duplicated inline item logic in the pickups loop (search `if(it.dAtk) { player.atk+=it.dAtk; }`, ~line 4377)

- [ ] **Step 1: Rewrite _applyItemToPlayer**

```js
function _applyItemToPlayer(it) {
  // Phase P — items accumulate into gearStats; totals are derived.
  const g = player.gearStats;
  if (it.dAtk) g.atk    += it.dAtk;
  if (it.dDef) g.def    += it.dDef;
  if (it.dHp)  g.hp     += it.dHp;
  if (it.dMp)  g.mp     += it.dMp;
  if (it.dSpd) g.spdPct += it.dSpd;
  recomputeStats();
  // Preserve the old heal-on-pickup feel for +HP items.
  if (it.dHp) player.hp = Math.min(player.hp + it.dHp, player.maxHp);
}
```

- [ ] **Step 2: Replace the duplicate inline block in the pickups loop**

In the `p.type==='item'` branch of the pickups loop, replace:
```js
        if(it.dAtk) { player.atk+=it.dAtk; }
        if(it.dDef) { player.def+=it.dDef; }
        if(it.dHp)  { player.maxHp+=it.dHp; player.hp=Math.min(player.hp+it.dHp,player.maxHp); }
        if(it.dMp)  { player.maxMp+=it.dMp; }
        if(it.dSpd) { player.speed+=player.speed*(it.dSpd/100); }
```
with:
```js
        _applyItemToPlayer(it);        // Phase P — single application path
```
(Function declarations hoist; the later definition is callable here.)

- [ ] **Step 3: Verify item math in browser**

Reload, ENTER DUNGEON, preview_eval:
```js
(() => { const before = {atk:player.atk, hp:player.maxHp, spd:player.speed};
  _applyItemToPlayer(LOOT[0]);   // Iron Sword: dAtk 8, dDef 2
  _applyItemToPlayer(LOOT[5]);   // Swift Boots: dSpd 20
  return JSON.stringify({before, after:{atk:player.atk, def:player.def, spd:player.speed},
    gear:player.gearStats}); })()
```
Expected: atk 12→20, def 5→7, spd 120→144, `gear:{"atk":8,"def":2,"hp":0,"mp":0,"spdPct":20}`. Then verify a level-up KEEPS gear bonuses: `player.xp=player.xpNext; checkLevelUp(); player.atk` → expected `24` (16 base + 8 gear).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Phase P: item bonuses flow through gearStats; DRY duplicate pickup path"
```

---

### Task 5: Phase smoke test + close-out

**Files:**
- Modify: `index.html` (footer comment), `CLAUDE.md` (roadmap status line)

- [ ] **Step 1: Full playthrough smoke**

In the preview: start a game, kill enemies until a level-up fires, open a chest and equip an item, take damage, use a potion, descend a floor. Watch preview_console_logs for errors. Expected: zero errors; HUD numbers consistent with the derived model.

- [ ] **Step 2: Determinism check**

preview_eval: `GameState.runSeed` → note value, `GameState.floorNum` → note. Reload page, ENTER DUNGEON, eval `(GameState.runSeed = <noted seed>, GameState.floorNum = <noted floor>, loadFloor(), 'ok')`, screenshot/compare minimap layout to confirm identical generation (no new RNG calls were added — this is a regression guard).

- [ ] **Step 3: Update the footer + CLAUDE.md status**

In `index.html`, update the closing comment block to `// Wardenfall — phases A–O complete; RPG pivot Phase P (stat model + classes) shipped.` In `CLAUDE.md`, update the roadmap status section to point at the spec + master plan (one line each; full doc rewrite stays in Phase W).

- [ ] **Step 4: Commit**

```bash
git add index.html CLAUDE.md
git commit -m "Phase P: smoke-verified close-out; docs status updated"
```
