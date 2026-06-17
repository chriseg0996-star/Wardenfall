# Side-Scroll Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Prove the MapleStory movement + ranged-combat feel in one hand-authored side-scroll stage (Mage: firebolt + blink), reusing the existing stat/gear/skill systems, gated behind `GAME_MODE` so the shipped top-down game stays default and regresses nothing.

**Architecture:** A new `// ── MODULE: SIDESCROLL ──` block lives inside `index.html`. All slice state hangs off one namespaced `ss` object (`ss.body`, `ss.level`, `ss.cam`, `ss.enemies`, `ss.projectiles`) so it never collides with top-down globals (`player.x/y`, `enemies`, `projectiles`, `camera`, `dungeon`). The slice reads real numbers off the existing `player` (atk/mp/level) but owns its own position/physics/transient state. `loop(ts)` branches on `GAME_MODE`; top-down `update`/`drawGame` are never called in sidescroll mode and vice-versa. Fixed-timestep physics inside `ssUpdate` for frame-rate-independent feel.

**Tech Stack:** Vanilla JS in single `index.html` (~6,300 lines). No build step. No test framework — every task verifies in the browser: preview server `mcp__Claude_Preview__preview_start` name `"static-http (python)"` (reuses running), reload via `preview_eval` `window.location.reload()`, assertions via `preview_eval`. **Slice physics DOES advance under manual frame stepping**: call `ssStep(1/120)` or `ssUpdate(16)` in evals to tick. RAF is frozen in the hidden preview window — that only affects auto-advance, not manual stepping. The subjective **feel gate is hands-on by the user** at the end. Commits go on `main` (project convention; PowerShell tool — use a message file `git commit -F` to avoid here-string quoting issues, as established this session).

**Reuse anchors (verified, drift with edits — locate by symbol):** `loop(ts)` 5560 · `TILE` 830 · `VIEW_W`/`VIEW_H` 841-842 (384×256) · `canvas`/`ctx` (global) · `keys` keydown map + `actionActive` (BINDINGS ~5569) · `spawnParticles` 2900 · `spawnFloatingText` 2943 · `spawnProjectile` 3039 (pattern reference only — slice owns its projectiles) · `SFX` / `ensureAudio` · `player` stat object + `recomputeStats` · global FX arrays `particles`/`floatingTexts`/`hitFlashes`.

**Isolation rule (every task):** when `GAME_MODE==='topdown'` (the default), behavior is byte-identical to today. Never modify a top-down code path; only ADD the branch and the new module. The shipped game (title → char select → chapter map → stage → gear → results → death) and stage-maphash determinism must stay green — re-checked in Task 8.

---

### Task 1: GAME_MODE flag + loop branch + SIDESCROLL module skeleton + dev entry

**Files:** Modify `index.html` (add state flag, branch `loop`, append the new module).

- [ ] **Step 1: Add the mode flag.** Near `let lastTime=0, ...` (~5077), add:
```js
let GAME_MODE = 'topdown';   // 'topdown' (shipped, default) | 'sidescroll' (slice)
let loopStartedSS = false;   // slice shares the single RAF chain
```

- [ ] **Step 2: Branch the loop.** Replace the body of `loop(ts)` (5560-5566) with:
```js
function loop(ts) {
  const dt = Math.min(ts-lastTime, 50);
  lastTime = ts;
  if (GAME_MODE === 'sidescroll') { ssUpdate(dt); ssDraw(dt); }
  else { update(dt); drawGame(dt); }
  requestAnimationFrame(loop);
}
```

- [ ] **Step 3: Append the SIDESCROLL module** at the end of the script (before the final `// Wardenfall —` footer comment). This task ships a STUB update/draw + the dev entry; later tasks fill it in:
```js
// ─────────────────────────────────────────────
// MODULE: SIDESCROLL (vertical slice — MapleStory-style platformer)
// Gated behind GAME_MODE. All slice state lives on `ss`; reads real numbers
// off `player` (atk/mp/level) but owns its own physics + transient state so
// it never touches top-down globals. Fixed-timestep physics for stable feel.
// ─────────────────────────────────────────────
const SS_PLAT = {
  STEP: 1/120,            // fixed physics step (s)
  GRAVITY: 2400,          // px/s^2
  MAX_FALL: 900,          // px/s terminal
  RUN_SPEED: 200,         // px/s target
  RUN_ACCEL: 2600,        // ground accel px/s^2
  FRICTION: 2600,         // ground decel px/s^2
  AIR_ACCEL: 1400,        // air control px/s^2
  JUMP_V: 640,            // initial jump velocity (up)
  JUMP_CUT: 0.45,         // vy *= this on early release
  DJUMP_V: 560,           // double-jump velocity
  COYOTE: 0.08,           // s after leaving ground you can still jump
  BUFFER: 0.10,           // s a jump press is remembered before landing
  DROPTHRU: 0.20,         // s of one-way-platform ignore after drop-through
  CLIMB_SPEED: 130,       // px/s rope climb
  BLINK_DIST: 130,        // px blink reposition
  BLINK_IFR: 0.30,        // s i-frames after blink
  BLINK_CD: 0.7,          // s cooldown
  BLINK_MP: 12,           // MP cost
};
const ss = {
  acc: 0,                 // fixed-step accumulator
  body: null,             // {x,y,w,h,vx,vy,onGround,facing,jumpsLeft,coyote,buffer,dropthru,iframes,onRope,blinkCd}
  level: null,            // {grid, cols, rows, oneWay:[], ropes:[], spawn:{x,y}, exit:{x,y}, w, h}
  cam: { x:0, y:0 },
  enemies: [],
  projectiles: [],
  frameT: 0,              // animation clock
};

// Slice-local key state (read straight from the global `keys` map so we do
// NOT disturb the shipped BINDINGS/settings UI). Down=held.
function ssKey(...names){ return names.some(n => keys[n]); }
const SSK = {
  left:  () => ssKey('ArrowLeft','a'),
  right: () => ssKey('ArrowRight','d'),
  up:    () => ssKey('ArrowUp','w'),
  down:  () => ssKey('ArrowDown','s'),
  jump:  () => ssKey(' '),          // Space
  fire:  () => ssKey('j'),
  blink: () => ssKey('k'),
};

function ssUpdate(dt){ /* stub — Task 2+ */ ss.frameT += dt; }
function ssDraw(dt){
  ctx.clearRect(0,0,VIEW_W,VIEW_H);
  ctx.fillStyle = '#243042'; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  ctx.fillStyle = '#cfe0ff'; ctx.font = 'bold 12px Courier New'; ctx.textAlign='center';
  ctx.fillText('SIDESCROLL SLICE', VIEW_W/2, VIEW_H/2);
  ctx.textAlign='left';
}

// Dev entry — launch the slice. Sets the mode, hides overlays, starts the loop.
window.__sidescroll = function(){
  ensureAudio();
  GAME_MODE = 'sidescroll';
  ['overlay','charselect-overlay','chaptermap-overlay','results-overlay','death-overlay','settings-overlay']
    .forEach(id => { const el = document.getElementById(id); if (el){ el.style.display='none'; el.classList.remove('open','show','show-anim'); } });
  if (!loopStarted && !loopStartedSS) { loopStartedSS = true; requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(loop); }); }
  return 'sidescroll mode';
};
```
NOTE: `loopStarted` is the Phase S RAF one-shot. If it isn't in scope here, the implementer must reference whatever the existing one-shot flag is (grep `loopStarted`). The guard's intent: never start a second RAF chain. If the top-down loop is already running, just flipping `GAME_MODE` is enough — do NOT request another frame. Verify the actual flag name and adapt.

- [ ] **Step 4: Verify.** Reload. `preview_eval`:
  - Default untouched: `GAME_MODE` → `"topdown"`; `selectCharacter('mage'); launchStage(1,1); JSON.stringify({mode:GAME_MODE, floor:GameState.floorNum})` → topdown, floor 1.
  - Determinism guard still holds (seed 12345 maphash unchanged from a known prior value).
  - Switch: reload, `__sidescroll()` → `"sidescroll mode"`, `GAME_MODE` → `"sidescroll"`, then `ssDraw(16)` runs without error. `preview_console_logs` level=error clean. Clean account key after.

- [ ] **Step 5: Commit** `Sidescroll slice: GAME_MODE flag + loop branch + module skeleton + dev entry`

---

### Task 2: Physics body + collision grid + run/gravity/ground + camera

**Files:** Modify `index.html` (SIDESCROLL module).

- [ ] **Step 1: A minimal flat level + body init.** Add to the module:
```js
// Build a solid-tile collision grid from an ASCII rows array. '#'=solid,
// '='=one-way platform, '|'=rope, 'S'=spawn, 'E'=exit, ' '=empty.
function ssBuildLevel(rows){
  const cols = Math.max(...rows.map(r=>r.length));
  const grid = []; const oneWay = []; const ropes = []; let spawn={x:64,y:64}, exit={x:0,y:0};
  for (let y=0;y<rows.length;y++){
    grid[y] = [];
    for (let x=0;x<cols;x++){
      const ch = rows[y][x] || ' ';
      grid[y][x] = (ch==='#') ? 1 : 0;
      if (ch==='=') oneWay.push({x, y});
      if (ch==='|') ropes.push({x, y});
      if (ch==='S') spawn = { x:x*TILE+TILE/2, y:y*TILE+TILE };
      if (ch==='E') exit  = { x:x*TILE+TILE/2, y:y*TILE+TILE };
    }
  }
  return { grid, cols, rows:rows.length, oneWay, ropes, spawn, exit, w:cols*TILE, h:rows.length*TILE };
}
function ssSolidAt(tx,ty){
  const L=ss.level; if (!L) return true;
  if (tx<0||tx>=L.cols||ty<0||ty>=L.rows) return true;   // out of bounds = solid wall
  return L.grid[ty][tx]===1;
}
function ssResetBody(){
  const s = ss.level.spawn;
  ss.body = { x:s.x, y:s.y, w:18, h:26, vx:0, vy:0, onGround:false, facing:1,
              jumpsLeft:0, coyote:0, buffer:0, dropthru:0, iframes:0, onRope:false, blinkCd:0 };
}
```

- [ ] **Step 2: Fixed-timestep update + horizontal move + gravity + AABB collision + camera.** Replace the stub `ssUpdate`:
```js
function ssUpdate(dt){
  ss.frameT += dt;
  ss.acc += Math.min(dt, 50) / 1000;
  while (ss.acc >= SS_PLAT.STEP){ ssStep(SS_PLAT.STEP); ss.acc -= SS_PLAT.STEP; }
  ssCamera();
}
function ssStep(h){
  const b = ss.body; if (!b) return;
  const P = SS_PLAT;
  // horizontal intent
  let dir = (SSK.right()?1:0) - (SSK.left()?1:0);
  if (dir!==0) b.facing = dir;
  const accel = b.onGround ? P.RUN_ACCEL : P.AIR_ACCEL;
  if (dir!==0) b.vx += dir * accel * h;
  else if (b.onGround) { // friction
    const s = Math.sign(b.vx); b.vx -= s * P.FRICTION * h; if (Math.sign(b.vx)!==s) b.vx=0;
  }
  b.vx = Math.max(-P.RUN_SPEED, Math.min(P.RUN_SPEED, b.vx));
  // gravity
  b.vy = Math.min(P.MAX_FALL, b.vy + P.GRAVITY * h);
  // integrate + resolve (x then y)
  ssMoveX(b, b.vx * h);
  const wasAir = !b.onGround;
  ssMoveY(b, b.vy * h);
  if (b.iframes>0) b.iframes -= h;
  if (b.blinkCd>0) b.blinkCd -= h;
}
// Swept-ish AABB by tile sampling. Solids only in this task; one-way in Task 4.
function ssMoveX(b, dx){
  b.x += dx;
  const top = Math.floor((b.y-b.h)/TILE), bot = Math.floor((b.y-1)/TILE);
  if (dx>0){ const tx=Math.floor((b.x+b.w/2)/TILE); for(let ty=top;ty<=bot;ty++) if(ssSolidAt(tx,ty)){ b.x = tx*TILE - b.w/2; b.vx=0; break; } }
  else if (dx<0){ const tx=Math.floor((b.x-b.w/2)/TILE); for(let ty=top;ty<=bot;ty++) if(ssSolidAt(tx,ty)){ b.x = (tx+1)*TILE + b.w/2; b.vx=0; break; } }
}
function ssMoveY(b, dy){
  b.y += dy; b.onGround=false;
  const lft=Math.floor((b.x-b.w/2)/TILE), rgt=Math.floor((b.x+b.w/2-1)/TILE);
  if (dy>0){ const ty=Math.floor((b.y-1)/TILE); for(let tx=lft;tx<=rgt;tx++) if(ssSolidAt(tx,ty)){ b.y=ty*TILE; b.vy=0; b.onGround=true; break; } }
  else if (dy<0){ const ty=Math.floor((b.y-b.h)/TILE); for(let tx=lft;tx<=rgt;tx++) if(ssSolidAt(tx,ty)){ b.y=(ty+1)*TILE + b.h; b.vy=0; break; } }
}
function ssCamera(){
  const b=ss.body, L=ss.level; if(!b||!L) return;
  ss.cam.x = Math.max(0, Math.min(L.w - VIEW_W, b.x - VIEW_W/2));
  ss.cam.y = Math.max(0, Math.min(L.h - VIEW_H, (b.y - b.h/2) - VIEW_H/2));
}
```
(`b.y` is the body's FOOT; body spans `y-h`..`y` vertically, `x±w/2` horizontally. Keep this convention everywhere.)

- [ ] **Step 3: Render floor + body rectangle (placeholder).** Replace `ssDraw`:
```js
function ssDraw(dt){
  ctx.clearRect(0,0,VIEW_W,VIEW_H);
  ctx.fillStyle = '#3a4a6a'; ctx.fillRect(0,0,VIEW_W,VIEW_H);   // bright bg (Maple direction)
  const L=ss.level; if(!L){ return; }
  ctx.save(); ctx.translate(-Math.round(ss.cam.x), -Math.round(ss.cam.y));
  const x0=Math.floor(ss.cam.x/TILE), x1=Math.ceil((ss.cam.x+VIEW_W)/TILE);
  const y0=Math.floor(ss.cam.y/TILE), y1=Math.ceil((ss.cam.y+VIEW_H)/TILE);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    if(ssSolidAt(tx,ty) && tx>=0 && ty>=0 && tx<L.cols && ty<L.rows){
      ctx.fillStyle='#5a4632'; ctx.fillRect(tx*TILE,ty*TILE,TILE,TILE);
      ctx.fillStyle='#6e573e'; ctx.fillRect(tx*TILE,ty*TILE,TILE,4);
    }
  }
  L.oneWay.forEach(p=>{ ctx.fillStyle='#7a6a4a'; ctx.fillRect(p.x*TILE, p.y*TILE, TILE, 6); });
  L.ropes.forEach(p=>{ ctx.fillStyle='#caa050'; ctx.fillRect(p.x*TILE+TILE/2-1, p.y*TILE, 2, TILE); });
  const b=ss.body;
  if(b){ ctx.fillStyle='#6db0ff'; ctx.fillRect(b.x-b.w/2, b.y-b.h, b.w, b.h); }
  ctx.restore();
}
```

- [ ] **Step 4: Wire the dev entry to build the level + body.** In `window.__sidescroll`, after setting the mode, before returning, add:
```js
  ss.level = ssBuildLevel([
    '                                        ',
    '                                        ',
    '   S                                    ',
    '                                        ',
    '########################################',
    '########################################',
  ]);
  ssResetBody();
  ss.acc = 0;
```

- [ ] **Step 5: Verify.** Reload, `__sidescroll()`. Eval a physics burst:
```js
(() => { const y0=ss.body.y; for(let i=0;i<200;i++) ssStep(1/120); const landed=ss.body.onGround;
  keys['ArrowRight']=true; const x0=ss.body.x; for(let i=0;i<120;i++) ssStep(1/120); keys['ArrowRight']=false;
  const movedRight = ss.body.x > x0; ssCamera(); const camTracks = ss.cam.x >= 0;
  return JSON.stringify({landed, movedRight, vyAtRest: Math.round(ss.body.vy), camX: Math.round(ss.cam.x)}); })()
```
Expect: `landed:true`, `movedRight:true`, `vyAtRest:0`. Body never falls through floor; stops at left bound (x can't go below ~w/2). Console clean.

- [ ] **Step 6: Commit** `Sidescroll slice: physics body, tile collision, run/gravity/ground, camera`

---

### Task 3: Jump — variable height, double-jump, coyote, jump buffer

**Files:** Modify `index.html` (SIDESCROLL module).

- [ ] **Step 1: Jump state in `ssStep`.** Insert, after the horizontal-intent block and before gravity, jump handling that uses edge-detection on the jump key. Add `b.jumpHeld` to the body (init false in `ssResetBody`). Logic:
```js
  // jump timers
  if (b.onGround){ b.coyote = P.COYOTE; b.jumpsLeft = 2; } else { b.coyote -= h; }
  const jp = SSK.jump();
  if (jp && !b.jumpHeld) b.buffer = P.BUFFER;       // rising edge → buffer a jump
  else if (b.buffer>0) b.buffer -= h;
  b.jumpHeld = jp;
  // consume a buffered jump
  if (b.buffer>0){
    if (b.coyote>0 && b.jumpsLeft===2){ b.vy = -P.JUMP_V; b.jumpsLeft=1; b.buffer=0; b.coyote=0; b.onGround=false; }
    else if (b.jumpsLeft>0 && !b.onGround){ b.vy = -P.DJUMP_V; b.jumpsLeft=0; b.buffer=0; }
  }
  // variable height: releasing early cuts the rise
  if (!jp && b.vy < 0) b.vy *= Math.pow(P.JUMP_CUT, h*60);
```
(Note: `jumpsLeft===2` = the ground/coyote jump; then 1 left = the double jump. Tune the cut to feel right.)

- [ ] **Step 2: Verify variable height + double jump.** Eval:
```js
(() => { ssResetBody(); for(let i=0;i<200;i++) ssStep(1/120); // settle on ground
  // full-hold jump
  keys[' ']=true; let peakHold=ss.body.y; for(let i=0;i<70;i++){ ssStep(1/120); peakHold=Math.min(peakHold, ss.body.y); } keys[' ']=false;
  for(let i=0;i<200;i++) ssStep(1/120);
  // tapped jump (release after 3 steps)
  keys[' ']=true; let peakTap=ss.body.y; for(let i=0;i<3;i++) ssStep(1/120); keys[' ']=false;
  for(let i=0;i<67;i++){ ssStep(1/120); peakTap=Math.min(peakTap, ss.body.y); }
  const groundY = ss.body.y;
  return JSON.stringify({ holdRise: Math.round(groundY-peakHold), tapRise: Math.round(groundY-peakTap), variable: (groundY-peakHold) > (groundY-peakTap)+10 }); })()
```
Expect `variable:true` (hold rises meaningfully higher than tap). Also test double-jump: jump, then mid-air a second Space rising-edge gains additional height (manual eval). Console clean.

- [ ] **Step 3: Commit** `Sidescroll slice: variable-height jump, double-jump, coyote + buffer`

---

### Task 4: Authored stage + one-way platforms + drop-through + rope

**Files:** Modify `index.html` (SIDESCROLL module).

- [ ] **Step 1: One-way platform set + helper.** Add `ss.level` lookup for one-way tiles (build a Set in `ssBuildLevel`: `oneWaySet = new Set(oneWay.map(p=>p.y*cols+p.x))`, store on level). Add:
```js
function ssOneWayAt(tx,ty){ const L=ss.level; return L && L.oneWaySet.has(ty*L.cols+tx); }
```

- [ ] **Step 2: One-way collision + drop-through in `ssMoveY`.** Extend the downward branch: when moving down and the body's feet cross a one-way tile's top edge AND `b.dropthru<=0` AND the feet were above it last step, land on it (`b.y=ty*TILE; vy=0; onGround=true`). Passing upward ignores one-way tiles entirely. Drop-through: in `ssStep`, if `SSK.down() && jump rising-edge`, set `b.dropthru = P.DROPTHRU` (and DON'T also jump that frame); decrement `b.dropthru` each step. While `dropthru>0`, skip one-way landing. Implement precisely; show the final `ssMoveY` down-branch in your report.

- [ ] **Step 3: Rope climb.** In `ssStep`, before gravity: if the body overlaps a rope tile (`ssRopeAt(tx,ty)`) and `SSK.up()||SSK.down()` → `b.onRope=true`. While `onRope`: zero gravity, `b.vy = (SSK.down()?1:SSK.up()?-1:0)*P.CLIMB_SPEED`, `b.vx=0`, snap `b.x` to rope center; jump rising-edge detaches (`onRope=false`, small `vy=-JUMP_V*0.7`); leaving the rope tile detaches. Add `ssRopeAt(tx,ty)` (Set like one-way).

- [ ] **Step 4: The authored slice stage.** Replace the level in `__sidescroll` with a designed ~3-screen layout (≥ 36 cols wide × ~18 rows): ground floor with a gap requiring double-jump or blink, 4–6 floating one-way platforms at varied heights, one solid wall, one rope spanning two heights, `S` spawn, `E` exit at the far end. Author it as a rows array. Keep it readable; document the layout in your report.

- [ ] **Step 5: Verify.** Eval-drive: place body above a one-way platform, step → lands on it (`onGround`, y at platform top). From below, moving up passes through. Trigger drop-through (`keys['ArrowDown']=true` + jump edge) → falls through, `dropthru>0`. Rope: move body onto a rope column, `keys['ArrowUp']=true`, step → `onRope`, y decreases. Camera scrolls full `level.w`. Console clean. Paste the level rows + final `ssMoveY` in the report.

- [ ] **Step 6: Commit** `Sidescroll slice: authored stage, one-way platforms, drop-through, rope climb`

---

### Task 5: Blink mobility skill

**Files:** Modify `index.html` (SIDESCROLL module).

- [ ] **Step 1: Blink in `ssStep`** (edge-detected on the blink key; add `b.blinkHeld`):
```js
  const bk = SSK.blink();
  if (bk && !b.blinkHeld && b.blinkCd<=0 && player.mp >= P.BLINK_MP){
    let dist=0; const step=4*b.facing;
    while (Math.abs(dist) < P.BLINK_DIST){
      const nx = b.x + step;
      const tx = Math.floor((nx + (b.facing>0?b.w/2:-b.w/2))/TILE);
      const tTop=Math.floor((b.y-b.h)/TILE), tBot=Math.floor((b.y-1)/TILE);
      let blocked=false; for(let ty=tTop;ty<=tBot;ty++) if(ssSolidAt(tx,ty)){ blocked=true; break; }
      if (blocked) break;
      b.x = nx; dist += step;
    }
    b.iframes = P.BLINK_IFR; b.blinkCd = P.BLINK_CD; player.mp -= P.BLINK_MP;
    if (typeof updateHUD==='function') updateHUD();
    if (SFX && SFX.dash) SFX.dash();
    spawnParticles(b.x, b.y - b.h/2, 8, '#b090ff');
  }
  b.blinkHeld = bk;
```
(Blink is swept in 4px increments so it stops flush at a wall — no tunnelling. Reuses `player.mp`, `updateHUD`, `SFX.dash`, `spawnParticles`.)

- [ ] **Step 2: Verify.** Eval: face right, clear MP high, `keys['k']=true; ssStep(1/120); keys['k']=false` → body x increased ~`BLINK_DIST`, `iframes>0`, `blinkCd>0`, `player.mp` dropped by `BLINK_MP`. Blink into a wall → stops flush (x not past the wall). Cooldown blocks a second blink until `blinkCd<=0`. Insufficient MP → no blink. Console clean.

- [ ] **Step 3: Commit** `Sidescroll slice: blink mobility (swept, i-frames, MP + cooldown)`

---

### Task 6: Firebolt + enemy + combat + death

**Files:** Modify `index.html` (SIDESCROLL module).

- [ ] **Step 1: Slice projectiles.** Add `ss.projectiles` spawn on the fire key (edge-detected, add `b.fireCd`):
```js
  if (SSK.fire() && b.fireCd<=0){
    const dmg = Math.max(1, Math.round(player.atk*1.6 + player.level*1.5));   // firebolt scaling parity
    ss.projectiles.push({ x:b.x + b.facing*10, y:b.y - b.h/2, vx:b.facing*420, vy:0, w:10,h:10, life:1.4, dmg, hit:new Set() });
    b.fireCd = 0.28; if (SFX && SFX.firebolt) SFX.firebolt();
  }
  if (b.fireCd>0) b.fireCd -= h;
```
Update projectiles in `ssStep` (move by vx*h, decrement life, despawn on wall via `ssSolidAt` or life≤0). Draw them in `ssDraw` (reuse the firebolt look: warm radial — or just a bright ellipse for the slice).

- [ ] **Step 2: One enemy + side-scroll AI.** `ss.enemies` entry: `{x,y,w:22,h:24,vx:0,hp,maxHp,atk,facing,aggro:false,alive:true,attackCd:0,homeX,leftX,rightX}`. AI in `ssStep`: gravity + ground-clamp (reuse `ssMoveY`-style or simple floor snap), patrol between `leftX/rightX` turning at bounds/walls, aggro when `|player.x - e.x| < 180` and roughly same height → walk toward the body; contact (AABB overlap with `ss.body`) with `attackCd<=0` → deal `e.atk` to the player if `body.iframes<=0` (`player.hp -= dmg; body.iframes=0.7; spawnFloatingText(...,'#f55'); updateHUD()`), set `attackCd`. Player death when `player.hp<=0` → `ssRespawn()` (reset body to spawn, restore hp via `recomputeStats({fullHeal:true})`, clear enemies/projectiles, re-seed the one enemy). Spawn the enemy in `__sidescroll`.

- [ ] **Step 3: Firebolt → enemy damage.** In the projectile update, AABB vs each alive enemy not in `p.hit`: subtract `p.dmg`, add to `p.hit`, `spawnFloatingText(e.x, e.y-e.h, p.dmg, '#fff')`, hit-flash/particles, consume the bolt (no pierce); on `e.hp<=0` → `e.alive=false`, death particles, `SFX.enemy_death`. Tick + draw the global `particles`/`floatingTexts`/`hitFlashes` arrays inside `ssUpdate`/`ssDraw` (copy the top-down tick: decrement life, splice; draw with the camera transform) so reused FX render in slice mode.

- [ ] **Step 4: Verify.** Eval: spawn enemy near body, fire → projectile travels, hits, enemy hp drops by the computed dmg, dies at 0 (real `player.atk`). Enemy aggros and on contact reduces `player.hp` (respecting i-frames). Force `player.hp=1`, contact → `ssRespawn` (body at spawn, hp full). HUD HP/MP update. Console clean.

- [ ] **Step 5: Commit** `Sidescroll slice: firebolt projectile, enemy AI, two-way combat, respawn`

---

### Task 7: Animated procedural sprites + brighter palette + parallax

**Files:** Modify `index.html` (SIDESCROLL module).

- [ ] **Step 1: Build slice sprites in code.** A `ssBuildSprites()` (called once from `__sidescroll`, guard against rebuild) that draws to offscreen canvases stored on `ssSprites`: mage frames `idle` (2), `run` (4), `jump` (1), `fall` (1), `attack` (2); enemy `walk` (2). Bright Maple-ish palette (light robe, warm skin, glowing staff). 24×32 each, drawn facing right; flip via `ctx.scale(-1,1)` for left. Pure procedural (no asset files this task).

- [ ] **Step 2: State→frame selection + animation clock.** A `ssMageFrame()` picks the set from body state (onGround+|vx|>20 → run cycle by `ss.frameT`; !onGround & vy<0 → jump; !onGround & vy≥0 → fall; recent fire → attack for ~180ms via a `b.attackAnim` timer; else idle). Replace the body/enemy rectangles in `ssDraw` with `drawImage` of the selected frame (camera transform, facing flip). Same for the enemy walk cycle.

- [ ] **Step 3: Parallax background.** 1–2 back layers in `ssDraw` drawn BEFORE the camera-translated world, offset by `ss.cam.x * factor` (e.g. distant hills at 0.3, mid at 0.6), in the brighter palette. Keep cheap (a few rects/shapes, no per-frame allocation).

- [ ] **Step 4: Verify.** Reload, `__sidescroll()`, step frames while moving: `ssMageFrame()` returns the run set when moving on ground, jump/fall sets airborne, attack set right after firing (eval the selector's state output). No errors over 300 stepped frames. Attempt a `preview_screenshot` (may time out — if so, rely on the selector evals). Console clean.

- [ ] **Step 5: Commit** `Sidescroll slice: animated procedural sprites, bright palette, parallax bg`

---

### Task 8: Touch controls + mobile + close-out + regression

**Files:** Modify `index.html` (HTML touch buttons + CSS + SIDESCROLL wiring).

- [ ] **Step 1: Touch buttons.** Add a `#ss-touch` overlay (shown only in sidescroll mode) with ≥44px buttons: left, right (dpad), up, down, JUMP, FIRE, BLINK. Each sets/clears the matching `keys[...]` entry on pointerdown/up (e.g. left button → `keys['ArrowLeft']`), so they feed the exact same input path as the keyboard. Style to match the existing touch HUD. Show `#ss-touch` in `__sidescroll`, ensure the shipped touch HUD (`#spell-btns`/`#pause-btn`) stays hidden in slice mode.

- [ ] **Step 2: Regression gate.** Verify the shipped game is byte-untouched with `GAME_MODE` default: reload (no `__sidescroll`), run the established flow — `selectCharacter('mage'); launchStage(1,1)` plays; gear/chest/results/death overlays gate; stage maphash for seed 12345 identical to the known value; 300-frame top-down sweep clean.

- [ ] **Step 3: Mobile playability.** At 390×844 (or default if resize unavailable), confirm via DOM that `#ss-touch` buttons exist, are ≥44px, and pointer events drive `keys`. Drive a short play sequence through the buttons via eval (set keys, step, clear) — move, jump, fire, blink all respond.

- [ ] **Step 4: Close-out.** Footer comment → append `; side-scroll vertical slice (dev: window.__sidescroll()) — feel prototype, GAME_MODE-gated`. Add a one-line note to CLAUDE.md roadmap status: `- ACTIVE — Side-scroll pivot: vertical slice behind GAME_MODE (spec/plan 2026-06-12-sidescroll-*). Feel-gate pending user sign-off.`

- [ ] **Step 5: Commit** `Sidescroll slice: touch controls, mobile, close-out + regression verified`

---

### Task 9: Final review + feel-gate handoff

- [ ] **Step 1:** Whole-slice integration review (opus) over the Task 1–8 range: isolation (zero top-down regression, GAME_MODE branch clean, no global collisions), determinism untouched, fixed-timestep correctness, blink/one-way/rope edge cases, FX-array sharing safety, no per-frame allocation in `ssDraw`. Fix anything surfaced.
- [ ] **Step 2:** Hand the running slice to the user for the **subjective feel gate** — they play it (desktop + phone) and either sign off or name what feels off, which becomes a `SS_PLAT` tuning pass. This gate decides whether the full pivot proceeds.

---

## Self-review checklist (run before execution)
- **Spec coverage:** GAME_MODE flag + branch ✓ (T1); physics/run/gravity/collision/camera ✓ (T2); variable jump/double/coyote/buffer ✓ (T3); authored stage/one-way/drop-through/rope ✓ (T4); blink ✓ (T5); firebolt+enemy+combat+death ✓ (T6); animated procedural sprites/bright/parallax ✓ (T7); touch/mobile + zero-regression ✓ (T8); feel gate ✓ (T9). Deferred-per-spec (other classes, 20 maps, procedural spawns, asset sheets, bosses, stage-select wiring, top-down retirement, PWA, multiplayer) — correctly absent.
- **Naming consistency:** `ss`, `ss.body`, `SS_PLAT`, `ssStep`/`ssUpdate`/`ssDraw`, `ssBuildLevel`/`ssSolidAt`/`ssOneWayAt`/`ssRopeAt`, `ssMoveX`/`ssMoveY`, `ssCamera`, `ssResetBody`/`ssRespawn`, `ssBuildSprites`/`ssMageFrame`, `SSK`, `window.__sidescroll` — used identically across tasks. Body convention: `y`=foot, spans `y-h`..`y`, `x±w/2`.
- **Isolation:** every task gated by `GAME_MODE`; top-down paths only ever gain a branch, never a modification. Regression re-verified in T8 + T9.
