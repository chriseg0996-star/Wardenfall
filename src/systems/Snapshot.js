// ============================================================
// Snapshot.js
// Serializable world snapshot helpers for future net sync.
// ============================================================

export function buildSnapshot(game) {
  return {
    player: {
      x: game.player.x,
      y: game.player.y,
      hp: game.player.hp,
      mp: game.player.mp,
      facing: game.player.facing,
      level: game.progression.level,
      exp: game.progression.exp,
    },
    map: {
      id: game.maps.currentId,
      width: game.worldWidth,
      height: game.worldHeight,
    },
    entities: {
      enemies: game.enemies.map((e) => ({
        id: e.type.id,
        x: e.x,
        y: e.y,
        hp: e.hp,
        dead: e.dead,
      })),
      loot: game.loot.map((l) => ({
        kind: l.kind,
        x: l.x,
        y: l.y,
      })),
      boss: game.boss ? {
        id: game.boss.bossId || "boss",
        x: game.boss.x,
        y: game.boss.y,
        hp: game.boss.hp,
        phase: game.boss.phase,
      } : null,
    },
  };
}
