# Balance Targets

Use these targets while tuning progression and encounter economy.

## Core pacing metrics

- Time-to-kill (normal enemy):
  - Early zone: 3-6 seconds
  - Mid zone: 5-8 seconds
  - Late zone: 7-11 seconds
- Time-to-level:
  - Lv 1-5: 6-10 minutes
  - Lv 6-10: 10-16 minutes
- Potion usage:
  - Average 1-3 potions per 10 minutes in balanced play

## Data sources

- Debug overlay counters (`F3`) for deaths and potion usage.
- Session analytics captured in `game.analytics`:
  - `deaths`
  - `potionsUsed`
  - `mapTransitions`
  - `levelUps[]` with elapsed seconds

## Tuning workflow

1. Pick a target metric to move.
2. Change one variable group only:
   - Enemy stats
   - Drop rates
   - EXP curve
3. Playtest 10-15 minutes.
4. Record before/after values.
