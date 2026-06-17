# Phase R — Screens + Account Save + Playable Classes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Title → character-select flow with persistent account (`wardenfall.account.v1`: 3 character slots, shared gold/stash), and Knight + Ranger fully playable (kits, sprites, bow basic attack). Death keeps XP/gear (saved), no other penalty.

**Architecture:** SPELLS generalizes into a `SKILLS` registry; the hotbar binds to `CLASS_DEFS[player.classId].kit` (3 slots). Temp effects (stun, stance) are runtime timers consumed at damage/movement sites — they never write derived stats (single-writer rule from Phase P holds). The ACCOUNT module mirrors the existing localStorage try/catch idiom; `applyCharacter(classId)` = `initPlayerStats` + restore level/xp/equipped + shared gold/stash + `recomputeGearTotals`. Screens stay DOM overlays (existing pattern), shown/hidden around `startGame(classId)`.

**Tech Stack / verification:** identical to Phase Q plan (single index.html; preview server "static-http (python)"; reload + `preview_eval`; RAF frozen in hidden preview — step `update(16);drawGame(16)`; `preview_screenshot` known to time out — verify via DOM evals; commits on main, PowerShell).

**Anchors (verified, drift with edits — locate by symbol):** SPELLS 2070 / SPELL_ORDER 2136 / castSpell 3155 / refreshSpellButtons 3171 / updateHotbar 3598 / spell-btn HTML 509 / spell click listeners 5188 / doAttack 3003 / spawnProjectile 2404 / updateProjectiles player-hit 2450, enemy-hit 2477 / spawnEnemy struct 2148 / enemyAttackPlayer 3128 / hazard dmg ~4530 / #overlay 519 / startGame 5274 / death HTML 546 + showDeathScreen 3322 / player sprite 962–1006 / storage idioms 2609, 3255, 4856 / loadFloor 3453 / descendFloor 3520 / updateHUD 3568 / spellCd decay 4405 / keybind actions spell0-2 4813.

---

### Task 1: SKILLS registry — kit-driven hotbar (mage zero-diff)

- [ ] **Step 1:** Rename the SPELLS module to SKILLS. The three existing entries keep their cast bodies VERBATIM. Replace `const SPELLS = {` with `const SKILLS = {` and delete `const SPELL_ORDER = ['firebolt','mend','nova'];`, adding instead:
```js
// Phase R — the active kit comes from the class definition (3 skill ids).
function kitSkills() {
  return (CLASS_DEFS[player.classId] || CLASS_DEFS.mage).kit;
}
```
- [ ] **Step 2:** Update every consumer of `SPELLS`/`SPELL_ORDER` (grep both): `castSpell(slot)` resolves `const id = kitSkills()[slot]; const s = SKILLS[id];` and guards missing skill (`if (!s) return;`) and plays SFX via `const sfxFn = SFX[s.sfx || id]; if (sfxFn) sfxFn();` (add `sfx` field support — mage entries need none). `refreshSpellButtons` + `updateHotbar` iterate `kitSkills()` instead of SPELL_ORDER. The touch-button loop `for (let i=0; i<SPELL_ORDER.length; i++)` → `for (let i=0; i<3; i++)`.
- [ ] **Step 3:** The static `#spell-btns` HTML hardcodes 🔥✚💥 + mp costs. Add `refreshKitButtons()` (near updateHotbar) that rewrites each `#spell-btn-N`'s icon text, `.mp-cost` text, and `title` from `SKILLS[kitSkills()[N]]` (keep the `.cd-mask` child — set icon via a dedicated `<span class="sk-icon">` wrapper you add to the static HTML so innerHTML of the mask is never clobbered; read the existing structure first and preserve it). Call `refreshKitButtons()` at the end of `initPlayerStats`. NOTE: `initPlayerStats` runs before DOM-dependent callers only at startGame time (DOM ready) — but `__setClass` also calls it mid-game: fine. Guard `if (!document.getElementById('spell-btn-0')) return;`.
- [ ] **Step 4:** Verify (reload/start): mage plays identically — eval `castSpell(0)` spawns firebolt projectile, `castSpell(1)` HoT, `castSpell(2)` nova; hotbar/touch buttons show 🔥✚💥 with 10/15/25; cooldown masks animate (step frames). `__setClass('knight')` → buttons show three missing-skill states without throwing (kit ids exist but SKILLS entries don't yet — `castSpell` must no-op silently; updateHotbar/refreshKitButtons must tolerate `SKILLS[id] === undefined` rendering a dim "—" slot; implement that tolerance). Console clean. Back to mage.
- [ ] **Step 5:** Commit `Phase R: SKILLS registry — hotbar driven by class kit (mage zero-diff)`

### Task 2: Knight kit (bash / stance / whirlwind) + enemy stun

- [ ] **Step 1:** Enemy stun plumbing: add `stunTimer:0` to the spawnEnemy struct. In the enemy update loop, find the windupTimer freeze gate; add an equivalent gate FIRST: `if (e.stunTimer > 0) { e.stunTimer -= dt; return-equivalent/skip movement+attack for this enemy; }` (read the loop's structure — it's a forEach body; match how windup skips). Stunned enemies also cannot queue/execute attacks (windup ticking pauses too) and render with a small ⭐-like white flicker: in the Y-sort enemy branch add (manual-alpha pattern from Phase O): `if (e.ref?… stunTimer>0 && Math.floor(torchPhase*8)%2===0) { ctx.globalAlpha=0.5; ctx.fillStyle='#ffffff'; ctx.fillRect(sx, sy-4, sprites[e.sprite].width, 2); ctx.globalAlpha=1; }` (adapt to local variable names).
- [ ] **Step 2:** Player stance timer: add `stanceTimer:0` to the player literal (near `slowTimer`), decrement beside slowTimer's decrement in update. Damage reduction ×0.5 while active — apply at ALL THREE player-damage sites (enemyAttackPlayer; enemy-projectile hit; hazard damage): after the site's `dmg` is computed, `if (player.stanceTimer > 0) dmg = Math.max(1, Math.round(dmg * 0.5));` Each site computes/assigns differently — read each and integrate without breaking the `Math.max(0, hp-dmg)` flow.
- [ ] **Step 3:** Add knight skills to SKILLS:
```js
  bash: {
    name:'Shield Bash', icon:'🛡', mp:8, cd:5000, sfx:'shielder_bash',
    cast(p) {
      const reach = 30, ax = p.x + p.facing*reach, ay = p.y;
      const toKill = [];
      enemies.forEach(e => {
        if (!e.alive) return;
        if (Math.hypot(ax-e.x, ay-e.y) < 52) {
          const dmg = shieldedDamage(e, Math.max(1, Math.round(p.atk*1.3)));
          e.hp -= dmg; RunStats.damageDealt += dmg;
          e.iframes = 300; e.stunTimer = 1200;
          const ang = Math.atan2(e.y-p.y, e.x-p.x);
          e.x += Math.cos(ang)*24; e.y += Math.sin(ang)*24;
          spawnFloatingText(e.x, e.y-12, dmg, '#fff');
          if (e.hp <= 0) toKill.push(e);
        }
      });
      toKill.forEach(killEnemy);
      spawnParticles(ax, ay, 8, '#80c0ff');
      triggerShake(3, 150);
    },
  },
  stance: {
    name:'Stalwart Stance', icon:'🏰', mp:12, cd:12000, sfx:'heal',
    cast(p) {
      p.stanceTimer = 5000;
      addLog('Stalwart Stance! Damage halved for 5s.', 'heal');
      spawnParticles(p.x, p.y, 12, '#80c0ff');
    },
  },
  whirlwind: {
    name:'Whirlwind', icon:'🌀', mp:18, cd:6000, sfx:'nova',
    cast(p) {
      const R = 80, toKill = [];
      enemies.forEach(e => {
        if (!e.alive) return;
        if (Math.hypot(p.x-e.x, p.y-e.y) < R) {
          const dmg = shieldedDamage(e, Math.max(1, Math.round(p.atk*1.2)));
          e.hp -= dmg; RunStats.damageDealt += dmg;
          e.iframes = 280;
          const ang = Math.atan2(e.y-p.y, e.x-p.x);
          e.x += Math.cos(ang)*26; e.y += Math.sin(ang)*26;
          spawnFloatingText(e.x, e.y-12, dmg, '#fff');
          if (e.hp <= 0) toKill.push(e);
        }
      });
      toKill.forEach(killEnemy);
      for (let i=0;i<14;i++) {
        const a = (i/14)*Math.PI*2;
        spawnParticles(p.x+Math.cos(a)*40, p.y+Math.sin(a)*40, 2, '#d0d8e8');
      }
      triggerShake(4, 200);
    },
  },
```
Adapt helper names to reality (spawnFloatingText signature, shieldedDamage, triggerShake) — read nova's cast body and copy its idioms exactly (deferred-kill array etc.).
- [ ] **Step 4:** Verify: `__setClass('knight')` → buttons 🛡🏰🌀, costs 8/12/18; bash stuns (eval: spawn enemy adjacent, castSpell(0), check `e.stunTimer > 0`, step 30 frames, enemy didn't move); stance halves damage (eval enemyAttackPlayer with/without stanceTimer, compare dmg via hp delta — account for the ±2 variance by setting it deterministically or comparing ranges); whirlwind hits ring of enemies. Mage unaffected. Console clean.
- [ ] **Step 5:** Commit `Phase R: Knight kit — Shield Bash (stun), Stalwart Stance (DR), Whirlwind (AoE)`

### Task 3: Ranger kit (powershot / multishot / tumble) + bow basic attack

- [ ] **Step 1:** Bow basic: in `doAttack()`, after the cooldown guard + reset + attackPhase + SFX block, branch:
```js
  if (player.classId === 'ranger') {
    SFX.arrow_fire();
    spawnProjectile({
      x: player.x + player.facing*12, y: player.y,
      vx: player.facing*340, vy: 0, w: 10, h: 4,
      life: 700, owner: 'player',
      damage: Math.max(1, player.atk + Math.floor(Math.random()*5-2)),
      kind: 'arrow',
    });
    return;
  }
```
Read doAttack first: place the branch so melee SFX.swing does NOT also fire for ranger (move `SFX.swing()` into the melee path). The arrow projectile renderer rotates by velocity — already handles player-owned arrows? Read drawProjectiles' arrow branch + updateProjectiles' owner checks: enemy arrows exist; confirm owner:'player' arrows hit enemies through the player-projectile path (kind-agnostic). 
- [ ] **Step 2:** Ranger skills:
```js
  powershot: {
    name:'Power Shot', icon:'🏹', mp:10, cd:4000, sfx:'arrow_fire',
    cast(p) {
      spawnProjectile({
        x: p.x + p.facing*12, y: p.y, vx: p.facing*460, vy: 0, w: 12, h: 4,
        life: 900, owner:'player', damage: Math.max(1, Math.round(p.atk*1.8)),
        kind:'arrow', pierce:true,
      });
      spawnParticles(p.x + p.facing*16, p.y, 6, '#caa078');
    },
  },
  multishot: {
    name:'Multishot', icon:'🎯', mp:16, cd:7000, sfx:'arrow_fire',
    cast(p) {
      for (const spread of [-0.25, 0, 0.25]) {
        const ang = (p.facing > 0 ? 0 : Math.PI) + spread;
        spawnProjectile({
          x: p.x + p.facing*12, y: p.y,
          vx: Math.cos(ang)*360, vy: Math.sin(ang)*360, w: 10, h: 4,
          life: 700, owner:'player', damage: Math.max(1, Math.round(p.atk*0.9)),
          kind:'arrow',
        });
      }
    },
  },
  tumble: {
    name:'Tumble', icon:'💨', mp:8, cd:5000, sfx:'dash',
    cast(p) {
      // Dash 90px in the movement direction (facing if standing still),
      // stepping in 6px increments so walls stop the dash cleanly.
      let dx = p.facing, dy = 0;
      if (joy.active && (joy.dx || joy.dy)) { const m = Math.hypot(joy.dx, joy.dy); dx = joy.dx/m; dy = joy.dy/m; }
      for (let i = 0; i < 15; i++) {
        const nx = p.x + dx*6, ny = p.y + dy*6;
        if (isSolid(tileAt(nx, ny))) break;
        p.x = nx; p.y = ny;
      }
      p.iframes = 500;
      spawnParticles(p.x, p.y, 10, '#b0a890');
    },
  },
```
Read the actual movement/collision helpers first (`isSolid`/`tileAt` names, how moveEntity collides — if a `tileAt` helper doesn't exist, use the same expression the hazard check or moveEntity uses; if keyboard movement direction is tracked somewhere (keys WASD state), prefer last-move direction over joystick-only — read how update() builds the player move vector and reuse that source). Verify `SFX.dash` exists (plan map says it does — confirm).
- [ ] **Step 3:** Verify: `__setClass('ranger')` → basic attack spawns arrow (eval doAttack, check projectiles array kind/owner/damage); powershot pierces 2 lined-up enemies (both take damage); multishot spawns 3; tumble moves the player ~90px and stops at walls (teleport next to a wall, dash into it); melee classes unaffected (mage/knight doAttack still melee). Console clean.
- [ ] **Step 4:** Commit `Phase R: Ranger kit — bow basic attack, Power Shot (pierce), Multishot, Tumble (dash+iframes)`

### Task 4: Class sprites + chibi portraits

- [ ] **Step 1:** In `buildSprites`, after the hero sprite block, add `player_knight` and `player_ranger` (24×32, same palette/silhouette language — read the existing 'player' drawing first and derive): knight = broader cloak, metal helm strip instead of hood rim, small tower-shield slab on the left side, sword arm kept; ranger = existing hood, NO sword arm — instead a simple bow arc on the right (2px curve + string line), quiver hint on back. Keep ember eyes on both (signature). Also add `sprites.player_mage = sprites.player` alias after buildSprites' definitions (one line, so `'player_' + classId` always resolves).
- [ ] **Step 2:** Render: in the Y-sort player branch (and ANY other `sprites.player` use — grep `sprites.player` / `'player'` drawSprite calls), resolve via `const heroSprite = sprites['player_' + player.classId] || sprites.player;` and use its width/height where the code reads `sprites.player.width` etc.
- [ ] **Step 3:** Portraits module (new small section near buildSprites): `function buildPortraits()` draws three 96×96 chibi busts on offscreen canvases into `const portraits = {}` keyed by classId — big head (~60% height: knight horned helm, ranger hood + single feather, mage hood + ember glow), narrow shoulders, class prop edge (shield rim / bow limb / staff tip), dark bg transparent, palette from existing PAL where natural. NO Math.random / NO RNG — fully deterministic drawing. Called once at script load (it must work BEFORE startGame/buildSprites — so it must not depend on `sprites`; if it reuses PAL consts that's fine). Expose `portraits[classId].toDataURL()` consumers in Task 6.
- [ ] **Step 4:** Verify: `__setClass('knight')` then screenshot-by-eval: `sprites.player_knight instanceof HTMLCanvasElement`, render loop draws without errors for all three classes (step frames per class); `portraits.knight.toDataURL().length > 1000` for all three. Console clean.
- [ ] **Step 5:** Commit `Phase R: class sprites (knight/ranger) + procedural chibi portraits`

### Task 5: ACCOUNT module (persistence)

- [ ] **Step 1:** New module after the GEAR module:
```js
// ─────────────────────────────────────────────
// MODULE: ACCOUNT (Phase R — RPG pivot)
// Persistent account: per-class character slots + shared gold/stash.
// 'wardenfall.account.v1'. Same defensive try/catch idiom as audio/scores.
// ─────────────────────────────────────────────
const ACCOUNT_STORAGE_KEY = 'wardenfall.account.v1';

function _freshCharacter() {
  return { level:1, xp:0, xpNext:100,
           equipped:{ weapon:null, helm:null, armor:null, boots:null, ring:null } };
}
function _freshAccount() {
  return { v:1, gold:0, stash:[],
           characters:{ knight:_freshCharacter(), ranger:_freshCharacter(), mage:_freshCharacter() },
           lastPlayed:'mage' };
}
let account = _freshAccount();

function loadAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (!p || p.v !== 1 || !p.characters) return;       // unknown schema → fresh
    const fresh = _freshAccount();
    account = {
      v:1,
      gold: typeof p.gold === 'number' ? Math.max(0, p.gold) : 0,
      stash: Array.isArray(p.stash) ? p.stash.filter(it => it && it.slot && it.stats) : [],
      characters: fresh.characters,
      lastPlayed: CLASS_DEFS[p.lastPlayed] ? p.lastPlayed : 'mage',
    };
    for (const cid of ['knight','ranger','mage']) {
      const c = p.characters[cid];
      if (!c) continue;
      const f = account.characters[cid];
      if (typeof c.level === 'number' && c.level >= 1) f.level = Math.floor(c.level);
      if (typeof c.xp === 'number' && c.xp >= 0) f.xp = c.xp;
      if (typeof c.xpNext === 'number' && c.xpNext > 0) f.xpNext = c.xpNext;
      if (c.equipped) for (const s of GEAR_SLOTS) {
        const it = c.equipped[s];
        if (it && it.slot === s && it.stats) f.equipped[s] = it;
      }
    }
  } catch {}
}

function saveAccount() {
  try { localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account)); } catch {}
}

// Pull the live run state into the account object, then persist.
function syncAccount() {
  const c = account.characters[player.classId];
  if (c) {
    c.level = player.level; c.xp = player.xp; c.xpNext = player.xpNext;
    c.equipped = player.equipped;
  }
  account.gold = player.gold;
  account.stash = gearStash;
  account.lastPlayed = player.classId;
  saveAccount();
}

// Load a character slot into the live player (start of a run).
function applyCharacter(classId) {
  initPlayerStats(classId);                       // resets, revives, fullHeal
  const c = account.characters[classId] || _freshCharacter();
  player.level = c.level; player.xp = c.xp; player.xpNext = c.xpNext;
  player.equipped = c.equipped;
  player.gold = account.gold;
  gearStash = account.stash;
  recomputeGearTotals();                          // Σ equipped → gearStats → stats
  recomputeStats({ fullHeal:true });              // start runs at full hp/mp
}
loadAccount();
```
Place `loadAccount()` call at module end (script-load time, like `loadAudio()`).
- [ ] **Step 2:** Save hooks — call `syncAccount()` at: end of `loadFloor()`; inside `playerDie()` BEFORE `showDeathScreen()`; end of `acquireItem`, `sellStashItem`, `equipItem`, `unequipSlot` (gear churn); end of `checkLevelUp`'s level-up branch. Cheap JSON (≤ ~50 items), event-frequency only.
- [ ] **Step 3:** IMPORTANT interaction: `initPlayerStats` resets equipped/stash — `applyCharacter` restores them after. But `__setClass` calls bare `initPlayerStats` (wipes gear). Re-route `__setClass` to use `applyCharacter(id)` + `updateHUD()/updateHotbar()` so the dev helper now SWITCHES persistent characters (and call `syncAccount()` first to save the outgoing character).
- [ ] **Step 4:** Verify: start, gain a level + equip items + gold, eval `syncAccount()`; check `JSON.parse(localStorage.getItem('wardenfall.account.v1'))` reflects level/equipped/gold/stash. Reload page → `account.characters.mage.level` matches. `applyCharacter('mage')` (via eval after startGame) restores stats exactly: assert `player.atk === classBaseStats('mage', savedLevel).atk + Σ equipped atk`. `__setClass('knight')` then back: mage gear intact (per-slot), gold shared. Corrupt-blob test: `localStorage.setItem('wardenfall.account.v1','{garbage')`, reload → fresh account, no errors. Console clean.
- [ ] **Step 5:** Commit `Phase R: ACCOUNT module — persistent per-class slots, shared gold/stash, save hooks`

### Task 6: Title + character select + death flow

- [ ] **Step 1:** Restyle `#overlay` (title): keep the WARDENFALL h1 + sub; replace the controls row + ENTER DUNGEON button with a single `CHOOSE YOUR HERO` button (`id="start-btn"` retained — it's the AudioContext unlock gesture; keep `ensureAudio()` on its click) that hides `#overlay` and shows `#charselect-overlay`. Move the control hints into the character-select footer (small text).
- [ ] **Step 2:** New `#charselect-overlay` (same overlay CSS family, z-index 100): three `.char-card`s (one per class, ≥120px wide, thumb-friendly): portrait `<img>` (src set from `portraits[cid].toDataURL()` at render time), class icon+name, `Lv.N` from `account.characters[cid].level`, equipped-count line (`X/5 gear`), kit icons row (three skill icons from SKILLS via CLASS_DEFS kit). A small `last played` badge on `account.lastPlayed`'s card. Card click → `startGame(cid)`.
- [ ] **Step 3:** `startGame(classId)` (signature change; default `account.lastPlayed`): hide both overlays; keep the RNG-isolated `buildSprites()` block as-is; replace the bare `initPlayerStats(...)` call (added in Phase P) with `applyCharacter(classId)`; everything else unchanged. Keep the existing `#start-btn` click → now `showCharSelect()`; char cards call `startGame(cid)` (ensure ensureAudio already ran on the title click; call `ensureAudio()` defensively in startGame too — it's idempotent).
- [ ] **Step 4:** Death flow: in the death HTML change `TRY AGAIN` → `RETURN TO THE KEEP` (keep `onclick="location.reload()"` — reload lands on title; account already synced in `playerDie`). Add a line under the death header: `Your level and gear are saved.` (small, #999).
- [ ] **Step 5:** Verify: reload → title shows; click start-btn → char select with 3 portraits + correct levels; click ranger → game starts as ranger (bow attack works); die (eval `player.hp=1; enemyAttackPlayer(enemies[0])` after luring) → death screen wording; reload → char select shows ranger's level/gear preserved + `last played` on ranger. All three cards launch. Touch sanity at 390×844 via DOM checks (cards ≥44px tap targets). Console clean.
- [ ] **Step 6:** Commit `Phase R: title + character select (chibi portraits) + saved-on-death flow`

### Task 7: Smoke + close-out + final review

- [ ] **Step 1:** Full smoke (paste all): (a) per-class spawn-and-fight matrix — for each of mage/knight/ranger: start from char select, basic attack hits, all 3 kit skills cast (CD+MP respected), level-up math (base+gear) holds; (b) persistence matrix — level/gear per class isolated, gold/stash shared across switches, survives reload, corrupt blob → fresh; (c) determinism maphash pair (seed 12345) identical pre/post reload; (d) 300-frame error sweep per class; (e) gear/chest/death overlays still gate correctly with char select around them.
- [ ] **Step 2:** Close-out: footer comment → `// Wardenfall — phases A–O complete; RPG pivot P–R shipped (stats, classes, gear, account).`; CLAUDE.md roadmap: Q line stays, add `DONE — RPG Phase R: SKILLS kits (knight/ranger/mage), class sprites+portraits, account save, title/char-select.` and `NEXT — RPG Phase S: chapter/stage select, stage seeds, stars, results screen, touch pause.`
- [ ] **Step 3:** Commit `Phase R: smoke-verified close-out; roadmap status updated`

## Self-review
- Spec coverage: screens ✓ (T6), account ✓ (T5), Knight/Ranger kits ✓ (T2/T3), class sprites + portraits ✓ (T4), kit-driven hotbar ✓ (T1), death-keeps-progress ✓ (T5/T6). Deferred per spec: chapter map/stars (S), per-class touch pause button (S).
- Single-writer rule: stance/stun are timers consumed at damage/movement sites — no stat writes. applyCharacter only writes via initPlayerStats/recomputeGearTotals/recomputeStats.
- Consistency: `kitSkills()`, `SKILLS`, `applyCharacter`, `syncAccount`, `portraits`, `player_knight/ranger/mage` names used identically across tasks.
