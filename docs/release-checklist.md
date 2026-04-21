# Wardenfall Release Checklist

Use this checklist before tagging any playable build.

## Pre-merge routine (solo cadence)

1. Work on a short-lived branch from `main`.
2. Run:
   - `node scripts/run-quality-gates.mjs`
3. Playtest quick loop:
   - movement, combat, skills, portal transition, save/load.
4. Merge to `main` only when checks pass.

## Build validation

- [ ] No uncaught console errors during 10-minute run.
- [ ] Save/load works after map transition and level-up.
- [ ] Boss defeat still persists across refresh.
- [ ] Objective text and HUD remain readable.
- [ ] Debug overlay (`F3`) reports sane frame times and counters.

## Content readiness

- [ ] Zone portals link both directions.
- [ ] New enemies spawn and animate correctly.
- [ ] Difficulty curve feels fair in each zone.

## Release notes

- [ ] Update `README.md` controls and testing section.
- [ ] Summarize gameplay additions and known limitations.
