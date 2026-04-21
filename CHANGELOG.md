# Changelog

All notable changes to Wardenfall are documented in this file.

## [0.2.0] - 2026-04-21

### Added
- New late-game zone: `Skyreach Cliffs` with bidirectional portal routing from `Ancient Ruins`.
- New enemy tier: `Alpha Wolf` with stronger stats and longer detection range.
- Multiplayer-ready simulation foundations:
  - `CommandBus` for input command and world event capture.
  - `Snapshot` builder for serializable world-state export hooks.
- New project docs:
  - `docs/release-checklist.md`
  - `docs/balance-targets.md`
  - `docs/playtest-triage.md`

### Changed
- Enemy combat readability improvements:
  - Added attack windup and telegraph bar before contact damage.
  - Expanded wolf rendering logic to support alpha variants.
- HUD improvements:
  - Objective display panel.
  - Debug overlay now includes death and potion analytics counters.
- Runtime analytics integration:
  - Session counters for deaths, potions used, map transitions, and level-up timestamps.
- Smoke test expansion:
  - Added coverage for new map loading, defeated-boss persistence behavior, and command/snapshot hooks.

### Notes
- This release focuses on roadmap alignment: content growth + combat clarity + networking-ready architecture boundaries.
