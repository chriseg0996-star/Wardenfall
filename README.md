# Wardenfall

> A 2D dark-fantasy roguelike. Three hero classes, generated gear, four
> chapters, four bosses, Nightmare endgame. The entire game lives in a
> single `index.html` — vanilla JS, no build step, no dependencies.

**[Play it in your browser →](https://chriseg0996-star.github.io/Wardenfall/)**

Descend a procedurally generated dungeon by lantern light. Pick one of
three classes (Knight / Ranger / Mage), each with its own skill kit and
sprite. Fight skeletons, spiders, archers, shield-bearers, necromancers,
and four chapter bosses. Loot epic and legendary gear from generated drop
tables. Beat The Warden, unlock Nightmare difficulty, and grind back
through for top-tier rolls.

Every stage is reproducible from a seed.

---

## Features (v1.0)

- **Three playable classes** — Knight (tank: Bash / Stalwart Stance /
  Whirlwind), Ranger (kiter: Powershot / Multishot / Tumble), Mage
  (caster: Firebolt / Mend / Nova). Each has a unique sprite, portrait,
  growth curve, and skill kit.
- **Chapter map** — 4 chapters × 5 stages × per-stage star rating (1-3
  ★ based on HP remaining + boss-bonus + no-deaths). Stage 5 of each
  chapter is the boss arena.
- **Generated gear** — 5 slots (weapon / helm / armor / boots / ring)
  × 5 rarities (common / uncommon / rare / epic / legendary). Stat
  budgets scale with ilvl; rarity drives lines and roll variance.
  Loot cards on enemy + boss drops, run-scoped stash, account-saved
  equipped gear.
- **Four bosses** — Bone Colossus (ch1), Brood Mother (ch2 — summons
  + web slow), Grave Monarch (ch3 — Grave Lurch pull + bone barrage),
  The Warden (ch4 — 3-phase AI with Shadow Lances + wraith summons).
- **Nightmare difficulty** — unlocked after first Warden kill. Enemies
  ×1.5 HP / ×1.15 ATK, +35% rewards, bosses gain a rage timer at 30 s.
  Stages reseed via a Nightmare salt so layouts differ.
- **Account save** — 3 character slots + persistent stash. Per-character
  level, gear, gold, and stage stars. Stored in `localStorage`.
- **Procedural music** — 5 synthesized tracks via Web Audio (no asset
  files): cursed_keep (ch1-2 ambient), bone_crypt (ch3),
  infernal_depths / black_bastion (ch4), boss. 800 ms crossfade on
  stage launch + boss spawn + chapter map.
- **Procedural SFX** — 13 synthesized one-shots (swing, impact, per-type
  death, per-spell cast, pickup tiers, level-up, descend, boss roar).
- **Lantern lighting** — near-blackout fog-of-war (alpha 0.92) with
  destination-out radial cuts around the player and every torch tile.
- **A\* enemy pathing** — 4-connected pathfinder with min-heap open
  set, staggered re-planning, and walkable cache. Enemies route around
  pillars, walls, and corners.
- **Custom keybinds** — full settings overlay (ESC), three presets
  (Default / WoW QER+F / Arrows), per-action rebind, persisted.
- **Mobile-first** — joystick + spell buttons + attack/potion/pause/
  gear/settings touch controls scale to viewport. Tested on Chrome
  desktop + iOS Safari.

---

## Hero classes

| Class | Role | Base HP / MP / ATK / DEF | Kit |
|---|---|---|---|
| Knight | Tank / melee | 140 / 20 / 14 / 8 | Bash (stun) · Stalwart Stance (DR) · Whirlwind (AoE) |
| Ranger | DPS / kiter | 90 / 30 / 13 / 4 | Powershot · Multishot · Tumble (iframes) |
| Mage | Caster / control | 100 / 50 / 12 / 5 | Firebolt · Mend (HoT) · Nova (AoE) |

Each class also has a basic attack: Knight + Mage use a melee swing,
Ranger fires a bow shot.

---

## Controls

### Default

| Action | Keyboard | Mobile |
|---|---|---|
| Move | `WASD` or arrows | left joystick |
| Attack | `Space` | ⚔ button |
| Potion | `H` | 🧪 button |
| Skill 1 / 2 / 3 | `2` / `3` / `4` | 🔥 / ➕ / 💥 buttons (per class) |
| Settings / Pause | `Esc` | ⏸ button |
| Gear | `G` | ⚙ gear button |

### WoW preset (Settings → "WoW (QER+F)")

| Action | Key |
|---|---|
| Move | `WASD` |
| Attack | `Space` |
| Potion | `F` |
| Skill 1 / 2 / 3 | `Q` / `E` / `R` |

Every action is rebindable from the in-game settings overlay (ESC).

---

## Run it locally

Wardenfall is a single static HTML file. Either open it directly
(`file://...`), or serve it over HTTP (recommended — some browser APIs
behave better that way):

```sh
# From the project root:
python -m http.server 8000
# Then open http://localhost:8000/
```

Any static HTTP server works (`npx serve`, `caddy`, etc.). The dev-server
launch config lives at `.claude/launch.json`.

If you see a stale build on the live URL after an update, append
`?v=` + something (e.g. `?v=2`) to bust the Pages cache.

---

## Tech

- **HTML5 Canvas** — single 2D context for everything visual, offscreen
  light layer composited via `globalCompositeOperation = 'destination-out'`.
- **Vanilla JS only** — no frameworks, no bundler, no `package.json`.
- **Web Audio API** — procedural music + SFX, no asset files.
- **localStorage** — bindings, audio settings, account (characters
  + stash + Nightmare unlock).
- **Single file**, ~7400 lines of JavaScript inside one `index.html`.

---

## Dev tools

The game exposes a small dev API for tuning + debugging from the browser
console:

```js
__setClass('knight')        // hot-switch class mid-run
__simBalance()              // print combat sim table per recLevel
__simBossClearRates()       // normal vs Nightmare per-class boss survival
__verifySeeds()             // assert seeded layouts are reproducible
__sidescroll()              // dev-only side-scroll vertical slice
```

The side-scroll mode is reachable via `#sidescroll` in the URL or by
calling `__sidescroll()` in the console. It is a separate feel
experiment — not part of the v1.0 product.

---

## Roadmap

Shipped in chronological phases, see git log for detail:

- Phases 1-3 — combat, loot, HUD, spells & MP
- Phases A-O — visual overhaul (hooded hero, lantern lighting, redesigned
  enemies, viewport zoom, pillars, attack lunge, keybinds, audio, A\*
  pathing, biomes, perf pass)
- RPG pivot P-S — stats / classes / gear / account / chapter map
- Phase T — bosses & endgame (Grave Monarch + The Warden + Nightmare)
- Phase U — procedural music
- Phase V — balance pass (recLevel curves + simBalance harness + DR
  refactor)
- **Phase W — v1.0 release** ← you are here

---

## License

[MIT](./LICENSE).
