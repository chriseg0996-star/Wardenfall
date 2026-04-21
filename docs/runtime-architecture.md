# Runtime Architecture Audit

This document captures current system boundaries and frame-order contracts.
It is a living reference for behavior-safe refactors.

## Composition Root

- `src/main.js` bootstraps sprite generation, creates `Game`, and starts loop.
- `src/core/Game.js` composes all systems, owns frame loop, and is the only global orchestrator.

## System Boundaries

- `core`
  - `Game`: update/render sequencing and top-level input routing.
  - `Input`: frame-based key state (`isDown`, `wasPressed`).
  - `Camera`: world follow and shake.
- `entities`
  - Runtime actors (`Player`, `Enemy`, `Boss`, projectiles, loot, effects).
- `systems`
  - Domain services (`Combat`, `Skills`, `Progression`, `Stats`, `Inventory`, `MapManager`, `UI`, `SaveLoad`, etc.).
- `config`
  - Static definitions (`Constants`, `Maps`, `Items`, `SkillTree`).

## Update Order Contract

Per frame (`Game.update()`), the current order is:

1. Global input (`menus`, `potions`, `portal key`, `save`, `mute`).
2. Deferred BGM start after first user gesture.
3. Early-return guards:
   - menu-open world freeze
   - death state
   - hitstop frames
4. Player update and input-driven attack start.
5. Skill cooldown tick and cast inputs.
6. Combat resolution:
   - melee hitbox
   - projectiles
7. Enemy AI/update, dead cleanup, respawn queue progression.
8. Boss state machine and boss projectile updates.
9. Portals and loot updates.
10. Player projectile lifecycle.
11. Effects, damage numbers, and particles update.
12. Camera follow and UI update.

Maintaining this order is required to preserve feel and outcomes.

## Render Order Contract

Per frame (`Game.render()`), current order is:

1. Far background clear.
2. Camera transform.
3. Parallax near background.
4. Platforms.
5. Portals.
6. Effects.
7. Loot.
8. Enemies.
9. Boss.
10. Boss projectiles.
11. Player projectiles.
12. Player.
13. Particles.
14. Damage numbers.
15. Screen-space UI.

This layering preserves readability and hit-feedback clarity.
