# Wardenfall RPG Pivot — Design Spec

**Date:** 2026-06-12
**Status:** Approved by user
**Supersedes:** the run-based-roguelike framing of the v1.0 roadmap (plan file
`make-a-plan-how-resilient-ocean.md`). Phases from that roadmap are folded in
(see §8); its Phase O (render perf pass) shipped as commit `616e992`.

## 1. Vision

Wardenfall evolves from a run-based roguelike into a **persistent action-RPG**
in the mobile-ARPG mold: pick a class, descend stage by stage, level up
forever, farm better gear. Inspired by chibi-hero mobile games in *structure
and UI presentation only* — all character designs are original; in-dungeon art
stays the established dark pixel-art style.

Hard constraints (unchanged): single `index.html`, vanilla JS, no
frameworks/build step, HTML5 Canvas + Web Audio, mobile-first touch support,
preserve all shipped gameplay systems, performance > simplicity > scalability
> maintainability.

## 2. Game flow & screens

```
Title → Character Select → Chapter Map → Stage (gameplay) → Results → Chapter Map
                ↑                                                        |
                └────────────── switch character anytime ───────────────┘
```

- **Title** — logo, Continue/New, settings, credits. AudioContext unlock
  gesture stays on the first button press.
- **Character Select** — 3 cards with large procedural chibi portraits
  (Knight / Ranger / Mage). One persistent character slot per class; shared
  gold and shared gear stash across all three. Switch freely.
- **Chapter Map** — the hub. 4 chapters × 5 stages as a vertical card list.
  Stage card: biome icon, name, recommended level, earned stars, lock state.
  No town, no energy system (explicit YAGNI).
- **Stage** — exactly today's dungeon gameplay on one seeded BSP floor.
- **Results** — victory or defeat panel: XP count-up (reuse the existing
  RAF count-up helper), loot cards earned, level-up callout, [Equip] /
  [Continue] actions.
- **Death** = stage failed: keep XP and loot already picked up, return to
  Chapter Map. No other penalty.

## 3. Classes

One character slot per class; class defines base stats, per-level growth, and
a 3-skill hotbar kit (slots 2–4, replacing the current global spell list).
The SPELLS module generalizes to data-driven per-class kits; combat, enemy
AI, and the projectile module are reused untouched.

| Class | Identity | Stats bias | Kit (slots 2–4) |
|---|---|---|---|
| **Knight** | melee bruiser | high HP/DEF, low MP | Shield Bash (stun strike), Stalwart Stance (temp DEF/regen), Whirlwind (melee AoE) |
| **Ranger** | ranged skirmisher | high SPD, mid HP | Power Shot (piercing arrow), Multishot (fan of 3), Tumble (dash + brief iframes) |
| **Mage** | caster (current hero kit) | high MP, low DEF | Firebolt, Mend, Nova (as shipped) |

Ranger basic attack = bow projectile (reuses the enemy archer's arrow
projectile kind with player ownership). Knight/Mage basic attack = current
melee swing. Each class gets its own in-dungeon pixel sprite (hooded hero
template recolored/re-propped) plus a chibi portrait (§6).

## 4. Gear & stats

- **5 slots:** weapon, helm, armor, boots, ring.
- **5 rarities:** common / uncommon / rare / epic / legendary
  (white / green / blue / purple / orange).
- **Item generation:** an item has `slot`, `rarity`, `ilvl` (≈ stage's
  recommended level), and stat rolls (atk/def/hp/mp/spd) drawn from a budget
  = f(ilvl) × rarityMultiplier, with slot-appropriate weighting (weapon→atk,
  armor→hp/def, boots→spd, ring→wildcard). Replaces the fixed 15-item LOOT
  table; item names compose from slot + rarity affix pools.
- **Acquisition:** chests and boss kills drop gear via the existing chest
  flow, restyled as **rarity-framed loot cards** (Phase J modal evolves; this
  is where the gacha-card aesthetic lives). Cards show stat deltas vs the
  currently equipped item.
- **Inventory screen:** equipped 5 slots + scrollable stash, tap to
  compare/equip; sell-for-gold on stash items as the gold faucet's drain.
- **Stat refactor (load-bearing):** `player.effective = classBase(level) +
  Σ(equipped item stats)`. All permanent-stat mutation sites (item pickup,
  level-up) move to this derived model. Level-ups raise `classBase` only.

## 5. Stages, difficulty & endgame

- **Layout determinism:** stage seed = `hash(chapterIdx, stageIdx, difficulty)`
  — same stage always generates the same floor; farmable and shareable.
  (Replaces `runSeed ^ floorNum`.)
- **Mapping of existing content:** chapters 1–3 use the three shipped biomes;
  chapter 4 is a remix biome (darkest palette). Stage 5 of each chapter is a
  boss stage using the shipped boss-floor system: Bone Colossus (ch1), Brood
  Mother (ch2), the **Grave Monarch** (ch3 — a remixed Bone Colossus: new
  tint, faster, bone-shard volleys replace half its melee phases; cheap to
  build from the shipped boss AI), **The Warden** (ch4 finale — new unique
  sprite + 3-phase state machine per the prior roadmap's Phase Q design).
- **Gating:** beat a chapter's boss stage to unlock the next chapter.
- **Stars:** ★ complete · ★★ finish with ≥50% HP · ★★★ full clear (all
  enemies). Stored per stage per difficulty.
- **Enemy scaling:** per-stage `recLevel` drives enemy stats via a tuned curve
  (replaces the runaway `1.22^floor`); balance pass targets recLevel 1–20.
- **Endgame:** beating The Warden unlocks **Nightmare** difficulty — the same
  20 stages with scaled stats (+recLevel offset) and higher-ilvl loot.

## 6. Chibi portraits

Procedural canvas portraits (~128×128 offscreen, drawn once, cached):
big-head/small-body chibi proportions, dark Wardenfall palette, class props
(Knight: tower shield + horned helm; Ranger: hood + bow; Mage: ember eyes +
staff). Original designs — no resemblance to any existing game's heroes.
Used on character select, results screen, and chapter-map corner avatar.
In-dungeon sprites remain pixel art.

## 7. Persistence

Single versioned blob `wardenfall.account.v1` (try/catch-wrapped like
existing keys):

```js
{ v: 1, gold, stash: [items],
  characters: { knight: {level, xp, equipped:{5 slots}}, ranger: {...}, mage: {...} },
  progress: { stages: { "c1s1": {stars, clears}, ... }, nightmareUnlocked },
  lastPlayed: 'mage' }
```

Existing keys (`audio.v1`, `keybinds.v1`) unchanged. `scores.v1` leaderboard
is retired from the UI for now (per-stage best times/stars are a possible
later revival). Malformed/missing blob → fresh account. Mid-stage state is
**not** saved — stages are short; quitting mid-stage = stage failed.

## 8. Migration of the approved O–U roadmap

| Old phase | Fate |
|---|---|
| O — render perf | ✅ shipped (`616e992`) |
| P — shell UX / pause / title | absorbed into the new screen system (title, pause button, touch modals all land with the new UI phases) |
| Q — The Warden | becomes chapter 4 finale, design unchanged |
| R — procedural music | unchanged; biome tracks map to chapters |
| S — mid-run save | superseded by the account save (§7) |
| T — balance pass | reframed: per-recLevel curves, stages 1–20 + Nightmare |
| U — docs/hardening/GH Pages release | unchanged, ships last |

## 9. Out of scope (explicit)

Gacha/summoning, energy systems, multiplayer/social, gear upgrading (+1
enhancement) and set bonuses (possible v1.1), town hub, cloud saves, asset
files of any kind.

## 10. Risks

- **File growth** (~8k lines): mitigate with strict `// ── MODULE: X ──`
  sectioning; screens as a state machine (`SCREEN` enum) rather than DOM-page
  spaghetti.
- **Stat refactor regression risk:** it touches every damage/pickup site —
  must land as its own phase with before/after combat verification.
- **Scope creep toward the screenshots:** §9 is the contract; YAGNI rules.
