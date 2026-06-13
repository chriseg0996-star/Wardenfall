# Wardenfall Side-Scroll — Vertical Slice Design Spec

**Date:** 2026-06-12
**Status:** Approved by user
**Type:** Engine-pivot vertical slice (de-risking prototype)

## Context

Wardenfall shipped as a top-down action-RPG dungeon crawler (single-file vanilla
JS canvas; Phases O–S complete: derived stats, gear system, 3 classes + skill
kits, account save, chapter/stage select). The user's refined vision is a game
**between MapleStory (side-scrolling platformer art + class playstyle) and WoW
(dungeons, leveling, grinding, raids)**, released on **mobile**, with **online
co-op as an explicit v2**.

This requires converting the engine from **top-down** (8-direction tile
movement, BSP dungeons, A* pathfinding, lantern lighting) to a **side-scrolling
platformer** (gravity, jumping, one-way platforms, ropes). That is a near-total
engine rewrite — but the **RPG systems layer (Phases P–S) is movement-agnostic
and survives intact**: derived stats, gear, classes, SKILLS, account, stage
select, results, UI, audio.

Because the pivot is large, it is decomposed; this spec covers ONLY the
**vertical slice** — the first, smallest playable proof that the MapleStory
movement + combat **feel** is right, before committing to the full port.

### Locked direction decisions (from brainstorming)
- **Perspective:** side-scrolling platformer (not top-down).
- **First build:** vertical slice (prove feel before full engine).
- **Movement depth:** deep — standard Maple base + per-class mobility skills.
- **Stage layout:** hand-authored maps + procedural enemy/loot spawns (20 stages total, later).
- **Art pipeline:** **sprite-sheet assets allowed** (relaxes the single-file/no-assets rule); game becomes a folder (HTML + JS + `assets/`), still no build step; PWA bundles assets. (Slice itself uses procedural animated placeholders; real assets are the next phase.)
- **Code home:** new engine lives **in `index.html` behind a `GAME_MODE` flag**; shipped top-down game stays default and untouched.
- **Slice class:** **Mage** — firebolt projectile + blink mobility (most readable side-scroll proof).
- **Multiplayer:** v2, after a solo mobile launch.

## Goal

One hand-authored side-scroll stage, playable as the Mage, that proves the core
movement and ranged-combat feel — reusing the existing stat/gear/skill systems,
gated behind `GAME_MODE` so the shipped top-down game is completely unaffected.
The slice's output is a **go/no-go feel verdict**, not shippable content.

## Architecture

A module-level `GAME_MODE` flag: `'topdown'` (current, default) | `'sidescroll'`
(new). The main loop branches `update`/`render` by mode. A dev entry
(`window.__sidescroll()` and, in dev, a title-screen button) sets the flag and
loads the slice stage. Default remains `'topdown'`; the shipped flow never
touches the new code.

New modules (inserted into `index.html` with the existing `// ── MODULE: X ──`
banner convention), all namespaced so they cannot collide with top-down globals:

- **`PLATFORMER PHYSICS`** — the player body: `{x, y, vx, vy, onGround, facing,
  jumpsLeft, coyoteMs, jumpBufferMs, dropThruMs, onRope}` + a fixed-timestep
  integrator (gravity, velocity, friction, jump impulse + variable cut).
- **`PLATFORMER LEVEL`** — authored-stage data format + loader producing a solid
  grid + one-way-platform list + rope list + spawn/exit + camera bounds.
- **`PLATFORMER COLLISION`** — swept AABB resolution vs solids; one-way platform
  rules (land from above, pass from below, drop-through on command); rope enter/climb/exit.
- **`PLATFORMER CAMERA`** — horizontal follow with a vertical deadzone +
  look-ahead, clamped to level bounds.
- **`PLATFORMER AI`** — side-scroll enemy: patrol within platform bounds, turn at
  edges/walls, aggro radius, horizontal approach, telegraphed contact attack.
- **`PLATFORMER RENDER`** — parallax background + platform tiles + animated
  sprites for this mode; reuses the existing particle/floating-text/hit-flash draws.

Reused unchanged (called from the sidescroll update/render): the player stat
object and `recomputeStats`; `SKILLS` (effect bodies re-pointed to side-scroll
spawn coords); gear/account/persistence; `SFX`; particles, `spawnFloatingText`,
hit-flashes; the HP/MP HUD bars.

## Movement & physics (the feel — this is the test)

Fixed-timestep update (accumulate `dt`, step physics at a constant rate, e.g.
1/120s) so feel is frame-rate independent. Tunable constants grouped in one
`PLAT` config object for fast iteration.

- **Run:** horizontal target speed via ground accel + friction; reduced air control.
- **Jump:** impulse on press; **variable height** — cut upward velocity when the
  button is released early. Terminal fall-speed cap.
- **Double-jump:** one extra mid-air jump; `jumpsLeft` resets on landing.
- **Coyote time (~80ms):** can still jump shortly after leaving a ledge.
- **Jump buffer (~100ms):** a jump pressed just before landing fires on touchdown.
- **One-way platforms:** land when falling onto them; pass through from below;
  **down + jump** drops through (brief `dropThruMs` ignore window).
- **Ropes/ladders:** enter on overlap + up/down; vertical climb at a fixed speed;
  jump to detach.
- **Mage mobility — Blink:** a NEW slice ability (not part of the existing
  firebolt/mend/nova kit) — short-range instant horizontal reposition in the
  facing direction with brief i-frames (reuse the existing iframe/stance timer
  pattern); MP cost + cooldown via the existing skill-cost plumbing. Stops at
  solid walls (swept, no tunnelling).

## The slice stage

One hand-authored level as a data literal in `PLATFORMER LEVEL`: a ground floor,
several floating one-way platforms at varied heights and gaps, one or two solid
walls, one rope, at least one jump gap that requires double-jump or blink, a
spawn point, and an exit marker. **Wider than one screen** (e.g. ~3 screens) so
the camera must scroll. Grid-based for collision simplicity (reuse `TILE`),
authored as rows or as a rectangle list — implementer's choice, documented in
the plan.

## Combat (Mage, wired to real stats)

The slice gives the Mage exactly two abilities: **Firebolt** (offense) and
**Blink** (mobility). Mend and Nova are deferred — they re-enter when classes are
fully ported.

- **Primary attack — Firebolt:** spawns a horizontal projectile in `facing`
  direction (castable grounded or airborne), damage from `player.atk` and the
  existing firebolt scaling, MP cost via the skill system. Reuse the projectile
  module's owner/hitSet/damage pattern, adapted to side-scroll velocity (no
  gravity on the bolt for the slice).
- **Enemy:** one type, side-scroll AI above; HP/ATK from existing
  `ENEMY_DEFS`-style scaling; takes firebolt damage, applies contact damage to
  the player through the existing i-frame/`recomputeStats` damage path; death via
  the existing kill/particle flow.
- **Death/HP:** player can die (reuse HP, death handling — for the slice, death
  simply reloads the slice stage; no account/stage-select coupling).
- Floating damage numbers, hit-flashes, screen shake, SFX all reused.

## Touch & input

- Keyboard (desktop): existing bindings extended — left/right, jump (e.g. Space
  or the attack-adjacent key — wired through the BINDINGS module), attack
  (firebolt), blink, up/down (rope/drop-through).
- Touch (mobile): on-screen left/right + jump + attack + blink buttons (reuse the
  existing touch-button styling), ≥44px targets. The slice must be fully playable
  on a phone with no keyboard.

## Art (slice scope only)

Animated **procedural** placeholder sprites drawn in code for the Mage (idle /
run / jump / fall / attack frames) and the one enemy, in a **brighter palette**
that starts the MapleStory direction. The slice does **not** load asset files —
the sprite-sheet asset pipeline (the relaxed-constraint decision) is its own
dedicated phase immediately after the slice, where it's proven with real art.

## Out of scope (deferred to later phases)

Other two classes' combat/mobility; all 20 authored maps; the procedural
enemy/loot spawn system; sprite-sheet asset loading + real art; bosses;
stage-select / chapter-map integration; retiring the top-down engine; lantern
lighting; the multi-file split; mobile PWA packaging; online co-op.

## Success criteria / verification

The slice is a **feel gate**. It passes only when:

1. **Movement feels responsive** on desktop AND on a real phone: run, variable
   jump, double-jump, drop-through, rope climb, and blink all read correctly at a
   stable 60fps; coyote-time + jump-buffer make inputs forgiving. (Subjective —
   the user plays it and signs off; knobs in `PLAT` are tuned until they do.)
2. **Combat works with real stats:** firebolt damages the enemy per `player.atk`;
   the enemy patrols, aggros, and can damage/kill the player; numbers come from
   the existing systems, not hardcoded.
3. **Camera scrolls smoothly** across the larger-than-screen stage, clamped to bounds.
4. **Zero regression:** `GAME_MODE` defaults to `'topdown'`; the entire shipped
   game (character select → chapter map → stages → gear → results → death) and
   determinism (stage maphash) are unchanged. Verified by re-running the
   established browser checks.

Verification method matches the project norm: browser via the preview server
(`static-http (python)`), reload + `preview_eval` assertions, manual frame
stepping where RAF is frozen, and hands-on play for the subjective feel gate.

## Risks

- **Feel is subjective and iterative** — the slice exists precisely to surface
  this early; budget tuning passes on `PLAT`.
- **Two engines in one file temporarily** — `index.html` grows; mitigated by
  strict module namespacing and the `GAME_MODE` branch. The multi-file split is a
  known later phase.
- **Scope creep toward "just one more class/map"** — the Out-of-scope list is the
  contract; the slice ships with one class, one enemy, one stage.
