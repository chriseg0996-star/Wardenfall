# Save Compatibility Policy

## Guarantees

- Saves from older versions are migrated forward when possible.
- Invalid or partial saves never crash runtime load; they normalize to safe defaults.
- The current save schema version is defined in `src/systems/SaveLoad.js`.

## Migration Rules

- Additive schema changes should be backward compatible through migration functions.
- Destructive changes must include explicit migration behavior and fixture updates.
- Every new migration must add at least one fixture and one assertion in the migration test script.

## Validation Scope

- Required top-level records are normalized: `player`, `progression`, `stats`, `inventory`, `skills`, `maps`.
- Array fields are sanitized to string arrays where required: `maps.defeatedBosses`, `unlockedTreeNodes`.
- Missing or non-numeric metadata (`timestamp`, `version`) is normalized safely.

## Verification

Run:

- `node scripts/save-migration.test.mjs`

The command must pass before merging save format changes.
