# Phase S — Chapter/Stage Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** Endless descent becomes a chapter map: 4 chapters × 5 stages, deterministic per-stage seeds, ★/★★/★★★ ratings, a results screen, death = stage failed (keep XP/loot, return to map, NO page reload), chapter gating, plus a touch pause button + PAUSED indicator. Leaderboard UI retired.

**Architecture:** A STAGES module maps `(chapter, stage)` → `recLevel = (chapter-1)*5 + stage` (1–20). `GameState.floorNum = recLevel` so ALL existing scaling, enemy tiers, ilvl, and the `% 5 === 0` boss logic work unchanged — stage 5 of each chapter is automatically a boss stage (colossus ch1/ch3-odd, broodmother ch2/ch4 per existing alternation; Phase T replaces ch3/ch4 bosses). Stage seed = integer hash of (chapter, stage, difficulty) → `GameState.runSeed`, so stages are farmable/reproducible. Biome comes from the CHAPTER (new 4th biome `black_bastion` for ch4). The stair tile becomes the stage exit → results screen. Progress lives in `account.progress.stages` (additive to the v1 schema). Death teardown returns to the chapter map without reloading.

**Verification environment:** identical to Phase Q/R plans (preview "static-http (python)", reload + preview_eval, RAF frozen → step `update(16);drawGame(16)`, screenshots time out → DOM evals, commits on main via PowerShell).

**Anchors (drift — locate by symbol):** stair trigger 5067 / descendFloor 4124 / loadFloor 4056 / buildDungeon seed line 1781 / setupBossFloor 4809 / populateFloor 2560 / auto-respawn 5264 / RunStats 3820 + resetRunStats 3833 / submitRunToScores 3870 / renderScores 3964 / showDeathScreen 3925 / death HTML 599 / GameState 2214 / #floor-fade 563+233 / settings fns 5717 / #floor-label 533 / _animateCountUp 3901 / ACCOUNT 2129 (loadAccount validation 2146, syncAccount 2180) / BIOMES 743 / biome cycle 4062 / startGame ~5970 / char-select Task-R code ~5900.

---

### Task 1: STAGES module + progress schema (pure addition)

- [ ] **Step 1:** Insert after the ACCOUNT module:
```js
// ─────────────────────────────────────────────
// MODULE: STAGES (Phase S — RPG pivot)
// 4 chapters × 5 stages. recLevel = (chapter-1)*5 + stage ∈ 1..20 and is
// fed into GameState.floorNum so every existing scaling/boss/ilvl system
// works untouched. Stage seeds are pure integer hashes → farmable layouts.
// ─────────────────────────────────────────────
const CHAPTERS = [
  { id:1, name:'The Cursed Keep',  biome:'cursed_keep',     icon:'🏰' },
  { id:2, name:'Bone Crypt',       biome:'bone_crypt',      icon:'💀' },
  { id:3, name:'Infernal Depths',  biome:'infernal_depths', icon:'🔥' },
  { id:4, name:'The Black Bastion',biome:'black_bastion',   icon:'👑' },
];
const STAGE_NAMES = [
  ['Outer Ward','Collapsed Hall','Gaol Stairs','Warden\'s Shadow','Colossus Gate'],
  ['Ossuary','Marrow Pits','Silent Chapel','Gravewind Pass','Brood Nest'],
  ['Ash Causeway','Cinder Vaults','Magma Throat','Furnace Row','Molten Court'],
  ['Black Gate','Starless Yard','Throne Approach','Last Vigil','The Warden'],
];
function stageKey(c, s)      { return 'c' + c + 's' + s; }
function stageRecLevel(c, s) { return (c - 1) * 5 + s; }
function stageSeed(c, s, diff) {
  let h = 0x57A9D;
  h = Math.imul(h ^ c, 0x9E3779B1);
  h = Math.imul(h ^ s, 0x85EBCA6B);
  h = Math.imul(h ^ (diff === 'nightmare' ? 0xBEEF : 1), 0xC2B2AE35);
  h ^= h >>> 16;
  return h >>> 0;
}
function _freshProgress() { return { stages:{}, nightmareUnlocked:false }; }
function starsFor(c, s) {
  const e = account.progress.stages[stageKey(c, s)];
  return e ? (e.stars | 0) : 0;
}
function isStageUnlocked(c, s) {
  if (c === 1 && s === 1) return true;
  if (s > 1) return starsFor(c, s - 1) > 0;
  return starsFor(c - 1, 5) > 0;            // chapter gate: beat the prior boss stage
}
function recordStageResult(c, s, stars) {
  const k = stageKey(c, s);
  const e = account.progress.stages[k] || { stars:0, clears:0 };
  e.stars  = Math.max(e.stars, stars);
  e.clears = (e.clears | 0) + 1;
  account.progress.stages[k] = e;
  saveAccount();
}
```
- [ ] **Step 2:** Schema (additive, stays v1): `_freshAccount()` gains `progress:_freshProgress()`. In `loadAccount`, after the characters merge loop, add defensive merge:
```js
    account.progress = _freshProgress();
    if (p.progress && p.progress.stages && typeof p.progress.stages === 'object') {
      for (const k in p.progress.stages) {
        const e = p.progress.stages[k];
        if (/^c[1-4]s[1-5]$/.test(k) && e && typeof e.stars === 'number') {
          account.progress.stages[k] = { stars: Math.max(0, Math.min(3, e.stars|0)), clears: Math.max(0, e.clears|0) };
        }
      }
      account.progress.nightmareUnlocked = p.progress.nightmareUnlocked === true;
    }
```
NOTE ordering: `_freshProgress` is referenced by `_freshAccount` — define the STAGES module helpers BEFORE... simplest: put `_freshProgress()` INSIDE the ACCOUNT module (above `_freshAccount`) and the rest in the STAGES module after; OR move the whole schema bits into ACCOUNT. Implementer: keep `_freshProgress` next to `_freshCharacter` in ACCOUNT; everything else in STAGES (which only runs at call time — safe). `loadAccount()` runs at script load BEFORE the STAGES module would be parsed if placed after — function declarations hoist across the whole script, so `stageKey` etc. are fine; `_freshProgress` as a hoisted function declaration is also fine wherever it sits. Use function declarations (as written) and placement is a non-issue.
- [ ] **Step 3:** New biome entry in BIOMES — `black_bastion` (ch4 remix, darkest palette):
```js
  black_bastion: {
    ambientName: 'The Black Bastion',
    accent:      '#9a86c8',
    wallTint:    '#06060c', wallTintAlpha: 0.62,
    floorTint:   '#0a0a12', floorTintAlpha: 0.55,
    lightColor:  'rgba(0,0,5,0.95)',
    torchColor:  '#b070ff',
    enemyBias:   { skeleton:0.20, archer:0.20, shielder:0.25, necromancer:0.35 },
    hazardType:  'spike',
    ambient:     'dust',
    floorInlay:  null,
  },
```
- [ ] **Step 4:** Verify via eval (no behavior change yet): `stageSeed(1,1,'normal') !== stageSeed(1,2,'normal')`, `stageSeed` stable across calls, `stageRecLevel(4,5) === 20`, fresh account has `progress.stages` `{}`, `isStageUnlocked(1,1) === true`, `isStageUnlocked(1,2) === false`, after `recordStageResult(1,1,2)` → unlocked + `starsFor(1,1) === 2`; corrupt progress in a saved blob → sanitized. `BIOMES.black_bastion` resolvable via `getBiomeSprites('black_bastion')` without error (call it — tints build). Clean localStorage after. Console clean.
- [ ] **Step 5:** Commit `Phase S: STAGES module — chapters/stages data, seeds, stars, progress schema, black_bastion biome`

### Task 2: Flow rewire — chapter map, startStage, stage exit, death-to-map, no auto-respawn

The world becomes stage-based. After this task: char select → chapter map → stage → (exit or death) → chapter map. Minimal completion toast (full results screen is Task 3).

- [ ] **Step 1: GameState fields.** Add `chapter:1, stageIdx:1, difficulty:'normal'` to GameState.
- [ ] **Step 2: Chapter map screen.** New `#chaptermap-overlay` (same overlay family, z-index 100): header `WARDENFALL — <class icon> Lv.N` + gold readout; a vertical scrollable list of 4 chapter sections, each with the chapter icon+name and 5 stage rows. Stage row (≥44px tall, full-width tap target): `Stage c-s · <name>`, `rec. Lv.N`, star display (★★☆ style from starsFor), lock state (`🔒` + dimmed when !isStageUnlocked). Locked rows ignore taps. Unlocked → `launchStage(c, s)`. Footer: a `CHANGE HERO` button → back to char select (calls syncAccount first, then shows charselect overlay) and the control-hints text (move it here from char-select if simpler — implementer's judgment, keep hints SOMEWHERE).
  - `showChapterMap()` rebuilds the list every call (stars/locks change). `hideChapterMap()`.
  - Char-select card click now routes: `startGame(cid)` → REWORK: split startGame into `selectCharacter(cid)` (ensureAudio, applyCharacter(cid), sprite-build RNG-isolated block — KEEP IT, runs once per character pick) + `showChapterMap()`. The RAF loop start moves into launchStage. READ startGame's current body carefully and split it; `gameRunning` stays false on the map.
- [ ] **Step 3: launchStage(c, s).**
```js
function launchStage(c, s) {
  if (!isStageUnlocked(c, s)) return;
  GameState.chapter = c; GameState.stageIdx = s;
  GameState.runSeed = stageSeed(c, s, GameState.difficulty);
  GameState.floorNum = stageRecLevel(c, s);     // drives ALL existing scaling
  GameState.transitioning = false;
  player.potions = 3;                            // stage-scoped resource
  resetRunStats();
  hideChapterMap();
  loadFloor();
  updateHUD(); updateHotbar();
  addLog(`Chapter ${c}-${s}: ${STAGE_NAMES[c-1][s-1]}`, 'sys');
  if (!gameRunning) {
    gameRunning = true;
    requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(loop); });
  }
}
```
CAUTION: gameRunning/loop — after a death return, gameRunning was set false; restarting RAF must not double-start the loop. Use a `loopRunning` one-shot flag if the existing structure can't tell (READ how loop/gameRunning interact; the loop itself keeps RAF-ing regardless — check; if loop never stops RAF, then keep gameRunning=false as the sim gate and DON'T re-request the frame; implement accordingly and explain in the report).
- [ ] **Step 4: Biome from chapter.** In loadFloor, replace the 10-floor cycle with `GameState.biome = CHAPTERS[GameState.chapter - 1].biome;`. Lava swap condition: keep keyed on `_currentBiome().hazardType === 'lava'` (read it — currently `=== 'infernal_depths'`; switch to the hazardType check so black_bastion stays spikes). Floor label: `☠ ${chapterName} ${c}-${s} — ${stageName}` (boss stages: `☠ BOSS — ${bossName}`).
- [ ] **Step 5: Stage exit.** Replace the stair-touch `descendFloor()` call with `completeStage()`:
```js
function stageStars() {
  let stars = 1;
  if (player.hp >= player.maxHp * 0.5) stars = 2;
  if (!enemies.some(e => e.alive)) stars = 3;            // full clear
  return stars;
}
function completeStage() {
  if (GameState.transitioning) return;
  GameState.transitioning = true;
  SFX.descend();
  const c = GameState.chapter, s = GameState.stageIdx;
  const stars = stageStars();
  recordStageResult(c, s, stars);
  syncAccount();
  // Task 3 replaces this block with the results screen:
  const fade = document.getElementById('floor-fade');
  fade.innerHTML = `<div class="ff-biome">STAGE CLEAR</div><div class="ff-floor">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>`;
  fade.style.opacity = '1';
  setTimeout(() => {
    fade.style.opacity = '0';
    gameRunning = false;
    GameState.transitioning = false;
    showChapterMap();
  }, 1100);
}
```
Wait — 3-star logic: necromancer/broodmother summons make “no alive enemies” the honest test; `enemies` only holds alive ones post-splice, so `enemies.length === 0` works; use that. STARS NOTE: stars=3 requires full clear but NOT the hp condition (spec: ★★★ = full clear). Keep as plan shows (full clear overrides).
`descendFloor()` is now dead: DELETE it and grep references (the +25% heal/potion gift die with it — stage model replaces them).
- [ ] **Step 6: Death → map (no reload).** In the death overlay HTML: button → `STAGE FAILED — RETURN TO MAP` calling `returnToMap()` (new), `onclick="location.reload()"` removed. Death header → `STAGE FAILED`; saved-note text → `XP and gear are kept. The stage can be retried.`
```js
function returnToMap() {
  const overlay = document.getElementById('death-overlay');
  overlay.classList.remove('show', 'show-anim');
  // tear down the run; applyCharacter on next launch revives + restores
  gameRunning = false;
  GameState.transitioning = false;
  applyCharacter(player.classId);        // revive + reload synced state
  updateHUD(); updateHotbar();
  showChapterMap();
}
```
(playerDie already syncAccounts first, so applyCharacter restores the kept XP/gear.)
- [ ] **Step 7: Remove auto-respawn.** Delete the `enemies.length < 3` respawn block (full clear must be attainable). Also confirm necromancer summons still work (they spawn via their own path).
- [ ] **Step 8: Verify** (big eval-driven pass): char select → map shows; only c1s1 unlocked; launch c1s1 (recLevel 1, cursed_keep, label right); exit via stairs (teleport to dungeon.stairPos) → stars recorded (hp-based 2★ vs full-clear 3★ — test by killing all first), map reshows with stars + c1s2 unlocked; same stage relaunched → SAME maphash (stage seed determinism, run twice); ch4 stage biome = black_bastion when force-unlocked via recordStageResult evals; boss stage c1s5 spawns colossus (floorNum 5); death path: die → STAGE FAILED → return to map → player alive at full hp on map → relaunch works; no auto-respawn (kill all on a stage, step 600 frames, enemies stay 0); console clean. CLEAN UP test progress (`localStorage.removeItem('wardenfall.account.v1')`).
- [ ] **Step 9:** Commit `Phase S: chapter map + stage flow — seeds, stars, gating, death-to-map, no auto-respawn`

### Task 3: Results screen + death restyle + leaderboard UI retirement

- [ ] **Step 1: Results overlay.** New `#results-overlay` (death-overlay CSS family, z-index 220, gold/purple accents instead of red): header `STAGE CLEAR`, big star row (animate: stars pop in sequentially via CSS transition + staggered timeouts, ☆→★), stage name line, stats grid (Enemies Slain / Gold Gained / Damage Dealt / Time — from RunStats, count-up via `_animateCountUp`), loot summary (track per-stage acquisitions: push `{icon,name,rarity}` into a `stageLoot` array inside `acquireItem`, reset in `launchStage`; render as small rarity-colored chips, cap display at 8 + `+N more`), level-up callout if `player.level > levelAtStageStart` (capture in launchStage), buttons: `CONTINUE` → hide + showChapterMap, `RETRY` → hide + launchStage(same c,s).
- [ ] **Step 2:** `completeStage()` drops its temporary fade block: after recordStageResult/syncAccount → `gameRunning = false; GameState.transitioning = false; showResults(stars);`.
- [ ] **Step 3: Death restyle + leaderboard retirement.** Remove from death overlay: seed row + COPY button, VIEW SCORES button, `#death-scores` div (and `renderScores`, `clearScoresConfirm`, `submitRunToScores` call in showDeathScreen — DELETE these functions + the scores CSS block; keep `loadScores/saveScores` deleted too UNLESS other refs exist — grep; the `wardenfall.scores.v1` key simply goes dormant in users' storage). Death stats grid trims to: Enemies Slain, Gold Collected, Damage Dealt, Damage Taken, Time. showDeathScreen stops calling submitRunToScores/renderScores.
- [ ] **Step 4: Verify:** clear a stage → results show with correct stars/stats/loot chips/level-up callout; CONTINUE → map; RETRY → same stage relaunches (same maphash); die → trimmed STAGE FAILED screen, no scores UI anywhere (grep DOM); `wardenfall.scores.v1` no longer written (clear it, die, confirm absent). Console clean.
- [ ] **Step 5:** Commit `Phase S: results screen (stars, count-up, loot chips) + death restyle; leaderboard UI retired`

### Task 4: Touch pause + PAUSED indicator + visibilitychange

- [ ] **Step 1:** Touch pause button `#pause-btn` (⚙, ≥44px, top-right area clear of #floor-label/boss bar — read HUD layout) → `toggleSettings()`. Visible only during gameplay is unnecessary — overlays cover it; keep simple.
- [ ] **Step 2:** PAUSED banner: small `PAUSED` div shown while `settingsOpen && gameRunning` (toggle in openSettings/closeSettings; guard `gameRunning` so the map/title don't show it).
- [ ] **Step 3:** `document.addEventListener('visibilitychange', () => { if (document.hidden && gameRunning && !settingsOpen && !inventoryOpen && !gearOpen && !player.dead && !GameState.transitioning) openSettings(); });`
- [ ] **Step 4: Verify:** button toggles settings + sim freeze; banner shows in-game only; visibilitychange can't be evaled directly — dispatch `Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange'));` then restore (configurable redefine back) — settings opened; guards: on chapter map (gameRunning false) nothing happens. Console clean.
- [ ] **Step 5:** Commit `Phase S: touch pause button, PAUSED indicator, auto-pause on tab hide`

### Task 5: Smoke + close-out + final review

- [ ] **Step 1 (condensed, batch evals):** (a) full loop: title → char select → map → c1s1 clear (3★ path) → results → map shows stars → c1s2 → die → STAGE FAILED → map → retry c1s2 OK; (b) per-class spot: knight + ranger each launch a stage and fight (skills fire); (c) determinism: c1s1 maphash twice across a reload — identical; ALSO c2s3 ≠ c1s1 hash; (d) gating matrix: fresh account → only c1s1; star c1s1..c1s5 via recordStageResult evals → c2s1 unlocks; (e) boss stage: c1s5 colossus, stair hidden until kill, completeStage after; (f) overlays: pause button + banner + gear screen + chest modal still gate; (g) 300-frame sweeps; (h) account round-trip: progress survives reload, corrupt blob → fresh. Clean localStorage at end.
- [ ] **Step 2:** Close-out: footer → `// Wardenfall — phases A–O complete; RPG pivot P–S shipped (stats, classes, gear, account, stages).`; CLAUDE.md: Phase S DONE line (`chapter/stage select, stage seeds, stars, results screen, touch pause`) + `NEXT — RPG Phase T: bosses & endgame (Grave Monarch ch3, The Warden ch4, victory, Nightmare unlock).`
- [ ] **Step 3:** Commit `Phase S: smoke-verified close-out; roadmap status updated`

## Self-review
- Spec §2/§5 coverage: chapter map ✓ (T2), stage seeds hash(chapter,stage,difficulty) ✓ (T1), stars incl. full-clear ✓ (T2, auto-respawn removed), results screen w/ count-up + loot + level-up + Equip?— spec lists [Equip]/[Continue]; RETRY+CONTINUE shipped, gear equip reachable via gear screen on map — acceptable simplification, note in results: omit Equip button (gear screen covers it). Death=fail keep XP/loot ✓ (T2). Gating ✓. Touch pause ✓ (T4). Leaderboard retired ✓ (T3). recLevel scaling mapping ✓ (floorNum=recLevel; retune in V). Nightmare flag exists in schema; unlock lands in T.
- Consistency: stageKey/stageSeed/stageRecLevel/launchStage/completeStage/returnToMap/showChapterMap/stageLoot names used identically across tasks; floorNum stays the single scaling driver.
