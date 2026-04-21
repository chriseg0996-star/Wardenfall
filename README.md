# Action RPG Prototype — Phase 3

A 2D side-scrolling action RPG inspired by MapleStory. Single-player foundation built for **game feel first** and **clean, modular code**.

## 🎮 Controls

| Action         | Keys                      |
|----------------|---------------------------|
| Move           | `A` / `D` or `←` / `→`    |
| Jump           | `Space` / `W` / `↑`       |
| Basic Attack (3-hit combo) | `J` / `Z` / `X`           |
| Skill: Bolt    | `I` (5 MP)                |
| Skill: Dash    | `K` (8 MP)                |
| Skill: Slam    | `L` (15 MP, unlock via skill tree) |
| HP Potion      | `1` (50 HP)               |
| MP Potion      | `2` (30 MP)               |
| Greater HP Pot | `3` (150 HP)              |
| Enter Portal   | `↑` or `W` when on portal |
| Stats Menu     | `C` → `1–4` to allocate   |
| Inventory      | `B` → ↑/↓ + Enter, `7/8/9` unequip |
| Skill Tree     | `T` → `1–8` to unlock     |
| Mute           | `M`                       |
| Debug Overlay  | `F3`                      |
| Save           | `F5`                      |
| Clear Save     | `F8`                      |
| Close Menu     | `Esc`                     |
| Respawn        | `R` (after death)         |

## ▶️ How to Run

```bash
cd action-rpg
python3 -m http.server 8000     # or: npx serve .
```
Open http://localhost:8000

### Quality checks

```bash
node scripts/save-migration.test.mjs
node scripts/smoke-runtime.test.mjs
node scripts/run-quality-gates.mjs
```

## Troubleshooting (quick)

- Open [http://127.0.0.1:8000](http://127.0.0.1:8000) with a hard refresh (`Ctrl+F5`) after code changes.
- If the page is blank, open DevTools Console (`F12`) and check the first red error.
- Common regression signature after refactors: missing imports in `src/core/Game.js` causing `ReferenceError`.
- Run `node scripts/run-quality-gates.mjs` before testing in browser to catch syntax/migration/smoke issues early.

## 📁 Structure

```
action-rpg/
├── index.html · style.css · README.md
└── src/
    ├── main.js                 Bootstraps (generates sprites, creates Game)
    ├── config/
    │   ├── Constants.js        Tunables (physics, player, skills, particles...)
    │   ├── Items.js            Gear + potions + drop tables
    │   ├── Maps.js             3 maps: meadow → forest → ruins
    │   └── SkillTree.js        8 unlockable nodes, 3 branches
    ├── core/
    │   ├── Game.js             Main loop & orchestrator
    │   ├── Input.js            Keyboard (bootstraps audio on 1st press)
    │   └── Camera.js           Follow + screen shake + per-map width
    ├── entities/
    │   ├── Player.js           Movement, combo, MP, gear stats, sprite walk cycle
    │   ├── Enemy.js            Patrol/chase AI, hitstun, sprite animation
    │   ├── Boss.js             2-phase Ancient Warden w/ telegraphed attacks
    │   ├── BossProjectile.js   Fireballs
    │   ├── Projectile.js       Player energy bolts
    │   ├── Portal.js           Map transition zones
    │   ├── Effect.js           Shockwave + dash streak visuals
    │   ├── DamageNumber.js
    │   └── Loot.js             Coins + items w/ rarity glow
    └── systems/
        ├── Physics.js          AABB + one-way platforms
        ├── Combat.js           Hit detection, crits, hitstop, audio
        ├── Skills.js           3 skills w/ cooldowns + MP + tree multipliers
        ├── Progression.js      EXP / level / stat + skill point grants
        ├── Stats.js            STR/DEX/VIT/LUK allocation
        ├── Inventory.js        Bag + equipment + stacking + use()
        ├── MapManager.js       Load/switch maps, track defeated bosses
        ├── Particles.js        Hit sparks, pickup bursts
        ├── LootSystem.js       Drop rolls
        ├── Audio.js            Web Audio synth (15+ SFX, no asset files)
        ├── Sprite.js           Procedural pixel-art generator + renderer
        ├── SaveLoad.js         localStorage persistence
        └── UI.js               HUD, menus, skill tree, boss bar, quickbar
```

## 🎯 What's in Phase 3 (the full build)

### Combat depth
- 3-hit combo — finisher has wider hitbox + 1.6× damage
- Jump attack → 1.25× damage (stacks with finisher)
- Hitstop on every impact; extra-long on crits
- Stagger/hitstun — hit enemies flinch for 18 frames
- Combo counter on screen fades as the window closes

### Skills (3 total)
- **🟣 Energy Bolt (`I`)** — piercing projectile, 5 MP
- **🔵 Dash Slash (`K`)** — i-frame dash that damages along the path, 8 MP
- **🟡 Ground Slam (`L`)** — AOE shockwave, 15 MP, **unlocked via skill tree**

### Progression
- Level up → 3 stat points + 1 skill point
- **STR** damage · **DEX** crit · **VIT** max HP · **LUK** drop rate
- **Skill tree** (`T`): 8 nodes across Offense / Arcane / Defense branches with prerequisites
  - Combat Mastery I & II: +10% / +15% damage
  - Crit Focus: +10% crit
  - Ground Slam unlock + Arcane Power: +25% skill damage
  - Deep Reserves: +50 max MP
  - Toughness: +50 max HP → Regeneration: 1 HP/sec

### Gear + Consumables
- 8 equipable items (weapon / armor / accessory)
- 5 rarity tiers (Common → Legendary) with 1.0× → 3.0× stat multiplier
- Auto-equip on pickup if it's an upgrade
- 3 potions: HP (50), MP (30), Greater HP (150). Stack in inventory.

### Enemies & Boss
- **Slimes** → **Mushrooms** → **Wolves** (harder, more stagger-resistant)
- **Ancient Warden** — 2-phase boss at the end of map 3
  - Phase 1: chase + slam + fireball
  - Phase 2 (under 50% HP): triple-shot + dash charge + faster
  - Attacks are telegraphed (red zone on ground before slam / dash)
  - Guaranteed **Legendary Sharp Fang** drop on kill

### World
- 3 maps with portal transitions — stand on a portal, press `↑` to travel
- Per-map width, background tint, parallax
- Defeated bosses stay defeated (persists in save)

### Juice
- **Procedural sprites** — pixel-art player with 3-frame walk cycle, animated enemies, 2-phase boss
- **Procedural audio** — hit/crit/swing/jump/coin/level-up/potion/portal/boss roar/death/etc., all synthesized via Web Audio (no audio files needed)
- Screen shake on crits and impacts; bigger shake on kills + phase transitions
- Damage numbers, hit sparks, rarity glow on drops

### Save/Load
- `F5` writes to `localStorage`: position, HP/MP, level, EXP, stats, inventory, skills, **current map**, **defeated bosses**, **unlocked tree nodes**
- Auto-loads on page refresh

## 🔧 Tuning Game Feel

Most knobs are in `src/config/Constants.js`:

| To change... | Edit... |
|---|---|
| Grind speed | `PLAYER.ATTACK_COOLDOWN` |
| Combo window | `PLAYER.COMBO_WINDOW` |
| Hit crunch | `COMBAT.HITSTOP_FRAMES` + camera shake in `Combat.js` |
| Drop rates | `LOOT.ITEM_DROP_CHANCE` + weights in `Items.js` drop tables |
| Skill damage | `SKILLS.*.damageMult` / `cooldown` |
| Level curve | `PROGRESSION.EXP_BASE` / `EXP_CURVE` |
| Stat power | `STATS.STR.damage`, `STATS.VIT.maxHp`, etc. |
| Boss difficulty | `Boss.js` constructor `maxHp` / `contactDamage` |

## 🧪 Debug

`window.__game` is exposed:
```js
__game.progression.gainExp(10000);
__game.stats.grantPoints(20);
__game.progression.skillPoints = 10;         // for tree testing
__game.skills.unlock("aoe_slam");
__game.inventory.addItem("sharp_fang", "LEGENDARY");
__game.inventory.addItem("hp_potion", "COMMON");  // (adds 1 to stack)
__game.player.recalcStats();
__game.maps.loadMap("ruins", __game);         // jump to boss
```

## 🔁 Next (Phase 4 ideas)

- Visual telegraphs for boss attacks with sound stings
- Map backgrounds with layered parallax art
- More enemy types per zone + elites
- Second boss / multi-boss dungeon
- Quest/objective log
- When going multiplayer: wrap Game state in an authoritative snapshot + NetworkAdapter
