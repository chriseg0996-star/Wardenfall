# Wardenfall

> A 2D dark-fantasy dungeon crawler. Lone hooded hero, cursed-kingdom theme.
> The entire game lives in a single `index.html` — vanilla JS, no build step,
> no dependencies.

A pixel-art roguelike where you descend a procedurally-generated dungeon by
the light of a flickering lantern. Fight skeletons and giant spiders, sling
spells, loot chests, and dive deeper through stairway after stairway. Every
floor is reproducible from a seed.

---

## Features (shipped so far)

- **Procedural floors** — BSP-generated rooms + corridors, reproducible from
  a per-run seed. Geometric HP/ATK scaling per floor, additive XP/gold rewards.
- **Combat** — melee swing with lunge + slash arc, hit flash, screen shake,
  knockback.
- **Spells & MP** — Firebolt (projectile), Mend (heal-over-time), Nova (AoE),
  each with cooldowns, MP costs, and per-spell SFX.
- **Reusable projectile system** — wall-aware via the same `isSolid` predicate
  the player uses; supports player + enemy ownership.
- **Hooded hero** — silhouette-first design with ember eyes, breathing idle,
  attack-lunge animation, procedural slash arc.
- **Lantern lighting** — near-blackout fog-of-war (`rgba(0,0,0,0.92)` veil)
  with destination-out radial cuts around the player and every torch tile.
- **Enemies** — Giant Spider (articulated legs, glowing eye cluster),
  Skeleton Warrior (hollow sockets, tattered cloth, bone-rattle jitter when
  aggro'd), per-type death dissolves.
- **Tall props with Z-sort** — pillars block movement and overlap the player
  correctly based on foot Y.
- **Hotbar + touch HUD** — potion + 3 spells, cooldown overlays, mobile
  joystick + buttons.
- **Custom keybinds** — full settings overlay (ESC), three presets (Default /
  WoW-style QER+F / Arrows), per-action rebind, localStorage persistence.
- **Web Audio SFX** — 13 procedurally-synthesized sounds (no asset files),
  master volume + mute, persisted.

---

## Controls

### Default

| Action | Keyboard | Mobile |
|---|---|---|
| Move | `WASD` or arrows | left joystick |
| Attack | `Space` | ⚔ button |
| Potion | `H` | 🧪 button |
| Firebolt | `2` | 🔥 button |
| Mend | `3` | ➕ button |
| Nova | `4` | 💥 button |
| Settings / Pause | `Esc` | (n/a yet) |

### WoW preset (open Settings → click "WoW (QER+F)")

| Action | Key |
|---|---|
| Move | `WASD` |
| Attack | `Space` |
| Potion | `F` |
| Firebolt / Mend / Nova | `Q` / `E` / `R` |

Every action is rebindable from the in-game settings overlay.

---

## Run it locally

Wardenfall is a single static HTML file. You can either open it directly
(`file://...`), or serve it over HTTP (recommended — some browser APIs
behave better that way):

```sh
# From the project root:
python -m http.server 8000
# Then open http://localhost:8000/
```

Any static HTTP server works (`npx serve`, `caddy`, etc.). The dev-server
launch config lives at `.claude/launch.json`.

---

## Tech

- **HTML5 Canvas** for everything visual.
- **Vanilla JS only** — no frameworks, no bundler, no `package.json`.
- **Web Audio API** for procedurally synthesized SFX.
- **localStorage** for bindings + audio preferences.
- Single file, ~2300 lines.

---

## Roadmap

The visual + systems overhaul is tracked in chronological phases.
Done so far: Phase 1 (combat / loot / HUD), Phase 2 (BSP + multi-floor),
Phase 3 (spells & MP), Phase A (hooded player + lighting), Phase B
(enemy redesigns + death FX), Phase C (viewport zoom + pillars + Z-sort),
Phase D (playtest polish), Phase E (lighting comfort + UI shrink),
Phase F (keybinds & settings), Phase F.1 (collision fix), Phase G
(audio core + SFX).

Coming: bosses + enemy AI state machine (H), gear & inventory (I),
environment textures (J), UI skin (K), QoL pass (L), meta-progression (M),
balance pass (N), perf + cross-browser (O), release packaging (P).

---

## License

[MIT](./LICENSE).
