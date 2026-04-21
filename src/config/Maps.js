// ============================================================
// Maps.js
// Map definitions. Each map has:
//   - platforms[]: { x, y, width, height, oneWay }
//   - spawnPoints[]: { x, y, typeId }  (enemy type from ENEMY enum)
//   - portals[]: { x, y, width, height, targetMap, targetX, targetY, label }
//   - playerStart: { x, y }
//   - boss: optional boss config
//   - background: { far, near } color tints
//   - width, height: world dimensions
// ============================================================

export const MAPS = {
  // ----- Map 1: Starting meadow -----
  meadow: {
    id: "meadow",
    name: "Green Meadow",
    width: 2400,
    height: 540,
    background: { far: "#1a1a2e", near: "#2a2a4e" },
    playerStart: { x: 100, y: 300 },
    platforms: [
      { x: 0, y: 500, width: 2400, height: 40, oneWay: false },
      { x: 250,  y: 390, width: 180, height: 16, oneWay: true },
      { x: 520,  y: 320, width: 180, height: 16, oneWay: true },
      { x: 800,  y: 410, width: 160, height: 16, oneWay: true },
      { x: 1060, y: 330, width: 200, height: 16, oneWay: true },
      { x: 1340, y: 400, width: 180, height: 16, oneWay: true },
      { x: 1600, y: 310, width: 200, height: 16, oneWay: true },
      { x: 1880, y: 390, width: 180, height: 16, oneWay: true },
      { x: 2150, y: 320, width: 180, height: 16, oneWay: true },
    ],
    spawnPoints: [
      { x: 350,  y: 200, typeId: "SLIME" },
      { x: 600,  y: 200, typeId: "SLIME" },
      { x: 750,  y: 350, typeId: "SLIME" },
      { x: 900,  y: 200, typeId: "SLIME" },
      { x: 1150, y: 150, typeId: "MUSHROOM" },
      { x: 1300, y: 350, typeId: "MUSHROOM" },
      { x: 1450, y: 200, typeId: "SLIME" },
      { x: 1700, y: 150, typeId: "MUSHROOM" },
      { x: 1950, y: 350, typeId: "MUSHROOM" },
    ],
    portals: [
      {
        x: 2330, y: 420, width: 48, height: 72,
        targetMap: "forest", targetX: 120, targetY: 300,
        label: "→ Dark Forest",
      },
    ],
  },

  // ----- Map 2: Dark forest (harder, has wolves) -----
  forest: {
    id: "forest",
    name: "Dark Forest",
    width: 2600,
    height: 540,
    background: { far: "#0f1a1f", near: "#1a2d2a" },
    playerStart: { x: 120, y: 300 },
    platforms: [
      { x: 0, y: 500, width: 2600, height: 40, oneWay: false },
      { x: 220,  y: 410, width: 180, height: 16, oneWay: true },
      { x: 500,  y: 340, width: 180, height: 16, oneWay: true },
      { x: 780,  y: 400, width: 160, height: 16, oneWay: true },
      { x: 1040, y: 310, width: 200, height: 16, oneWay: true },
      { x: 1320, y: 380, width: 180, height: 16, oneWay: true },
      { x: 1600, y: 290, width: 200, height: 16, oneWay: true },
      { x: 1880, y: 360, width: 180, height: 16, oneWay: true },
      { x: 2160, y: 300, width: 180, height: 16, oneWay: true },
      { x: 2400, y: 380, width: 160, height: 16, oneWay: true },
    ],
    spawnPoints: [
      { x: 300,  y: 350, typeId: "MUSHROOM" },
      { x: 550,  y: 200, typeId: "WOLF" },
      { x: 850,  y: 300, typeId: "MUSHROOM" },
      { x: 1100, y: 150, typeId: "WOLF" },
      { x: 1350, y: 300, typeId: "WOLF" },
      { x: 1650, y: 150, typeId: "MUSHROOM" },
      { x: 1950, y: 250, typeId: "WOLF" },
      { x: 2200, y: 150, typeId: "WOLF" },
      { x: 2430, y: 300, typeId: "WOLF" },
    ],
    portals: [
      {
        x: 10, y: 420, width: 48, height: 72,
        targetMap: "meadow", targetX: 2280, targetY: 300,
        label: "← Green Meadow",
      },
      {
        x: 2530, y: 420, width: 48, height: 72,
        targetMap: "ruins", targetX: 120, targetY: 300,
        label: "→ Boss Ruins",
      },
    ],
  },

  // ----- Map 3: Boss arena -----
  ruins: {
    id: "ruins",
    name: "Ancient Ruins",
    width: 1400,
    height: 540,
    background: { far: "#1a0f1f", near: "#2a1f35" },
    playerStart: { x: 120, y: 300 },
    platforms: [
      { x: 0, y: 500, width: 1400, height: 40, oneWay: false },
      { x: 200,  y: 380, width: 140, height: 16, oneWay: true },
      { x: 520,  y: 320, width: 160, height: 16, oneWay: true },
      { x: 820,  y: 380, width: 140, height: 16, oneWay: true },
      { x: 1100, y: 320, width: 160, height: 16, oneWay: true },
    ],
    spawnPoints: [],      // no regular enemies in the boss arena
    portals: [
      {
        x: 10, y: 420, width: 48, height: 72,
        targetMap: "forest", targetX: 2480, targetY: 300,
        label: "← Dark Forest",
      },
      {
        x: 1330, y: 420, width: 48, height: 72,
        targetMap: "skyreach", targetX: 120, targetY: 280,
        label: "→ Skyreach Cliffs",
      },
    ],
    boss: {
      id: "ancient_warden",
      spawnX: 1100,
      spawnY: 380,
      // Once defeated, stays dead via save file
    },
  },

  // ----- Map 4: Late-game cliff route -----
  skyreach: {
    id: "skyreach",
    name: "Skyreach Cliffs",
    width: 2800,
    height: 540,
    background: { far: "#10182a", near: "#1b2940" },
    playerStart: { x: 120, y: 280 },
    platforms: [
      { x: 0, y: 500, width: 2800, height: 40, oneWay: false },
      { x: 280, y: 390, width: 220, height: 16, oneWay: true },
      { x: 620, y: 340, width: 220, height: 16, oneWay: true },
      { x: 980, y: 300, width: 220, height: 16, oneWay: true },
      { x: 1340, y: 360, width: 220, height: 16, oneWay: true },
      { x: 1680, y: 320, width: 220, height: 16, oneWay: true },
      { x: 2040, y: 380, width: 220, height: 16, oneWay: true },
      { x: 2380, y: 330, width: 220, height: 16, oneWay: true },
    ],
    spawnPoints: [
      { x: 420, y: 320, typeId: "WOLF" },
      { x: 760, y: 260, typeId: "ALPHA_WOLF" },
      { x: 1120, y: 220, typeId: "WOLF" },
      { x: 1480, y: 280, typeId: "ALPHA_WOLF" },
      { x: 1840, y: 240, typeId: "WOLF" },
      { x: 2200, y: 300, typeId: "ALPHA_WOLF" },
      { x: 2520, y: 260, typeId: "WOLF" },
    ],
    portals: [
      {
        x: 10, y: 420, width: 48, height: 72,
        targetMap: "ruins", targetX: 1240, targetY: 300,
        label: "← Ancient Ruins",
      },
    ],
  },
};

export const STARTING_MAP = "meadow";
