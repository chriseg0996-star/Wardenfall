# Wardenfall RPG Pivot — Master Phase Index

> **For agentic workers:** This is the phase INDEX, not an executable plan.
> Each phase gets its own detailed plan in `docs/superpowers/plans/` written
> just-in-time before implementation (Phase P's exists already). Implement
> ONE phase per user instruction; the game must run clean after every phase.

**Spec:** `docs/superpowers/specs/2026-06-12-wardenfall-rpg-pivot-design.md`
**Constraints:** single `index.html`, vanilla JS, no deps/build step, pixel art
in-dungeon, mobile-first, determinism preserved, performance first.
**Verification model:** no test framework — each task verifies via browser
preview (`preview_eval` assertions with expected values + manual play smoke).

| Phase | Name | Goal | Ships when |
|---|---|---|---|
| **P** | Stat model + classes (foundation) | `player stats = classBase(level) + gearStats` derived model; `CLASS_DEFS` for knight/ranger/mage; mage == current hero (zero gameplay diff) | detailed plan: `2026-06-12-phase-p-stat-model-classes.md` |
| **Q** | Gear system core | Generated items (5 slots × 5 rarities × ilvl stat rolls) replace the LOOT table; equipped slots feed `gearStats`; inventory screen (equip/compare/sell); chest modal → rarity loot cards | plan written after P ships |
| **R** | Screens + account save + playable classes | `SCREEN` state machine; title, character select (chibi portraits), `wardenfall.account.v1` persistence (3 character slots, shared stash/gold); Knight + Ranger kits, class sprites, bow basic attack | after Q |
| **S** | Stage select structure | Chapter map (4×5 stages), stage seed = `hash(chapter, stage, difficulty)`, stars (★/★★/★★★), results screen, death = stage fail (keep XP/loot), chapter gating, touch pause button + PAUSED state, leaderboard UI retired | after R |
| **T** | Bosses & endgame | Grave Monarch (ch3, Colossus remix), The Warden (ch4, unique sprite + 3-phase AI), victory flow, Nightmare difficulty unlock | after S |
| **U** | Procedural music | MUSIC module: per-chapter ambient loops + boss track, crossfades, music vol/mute persisted in `audio.v1`, own mulberry32 instance | after T |
| **V** | Balance pass | recLevel-driven enemy curves (kill `1.22^floor`), class/gear/XP tuning recLevel 1–20 + Nightmare, in-file `window.__simBalance()` TTK table | after U |
| **W** | Release v1.0 | CLAUDE.md + README rewrite, canvas contextlost recovery, meta/og + inline SVG favicon, GitHub Pages deploy, `v1.0` tag | after V |

**Ordering rationale:** P before Q (gear math needs the derived model), Q
before R (character save serializes equipped gear), R before S (stage select
needs the screen state machine), bosses/music/balance/release as before —
balance only once all content exists.

**Done:** Phase O (render perf + wider lantern) — commit `616e992`.
