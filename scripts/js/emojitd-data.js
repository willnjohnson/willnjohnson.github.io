/*
 * Emoji Tower Defense: map, tower tree, enemy/boss stats, and wave schedule.
 *
 * Grid coordinates are {r, c} (row, col), 0-indexed. The path is defined as
 * a polyline of waypoints; enemies walk the polyline continuously (not tile
 * by tile) so movement reads smoothly regardless of grid size.
 */
window.EMOJITD_DATA = (function () {
  "use strict";

  const GRID_ROWS = 11;
  const GRID_COLS = 16;

  // Path polyline: straight orthogonal segments between consecutive points.
  const PATH_WAYPOINTS = [
    { r: 0, c: 0 },
    { r: 0, c: 5 },
    { r: 3, c: 5 },
    { r: 3, c: 12 },
    { r: 6, c: 12 },
    { r: 6, c: 2 },
    { r: 9, c: 2 },
    { r: 9, c: 14 },
    { r: 10, c: 14 },
  ];

  function pathTileSet() {
    const set = new Set();
    for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
      const a = PATH_WAYPOINTS[i];
      const b = PATH_WAYPOINTS[i + 1];
      if (a.r === b.r) {
        const lo = Math.min(a.c, b.c), hi = Math.max(a.c, b.c);
        for (let c = lo; c <= hi; c++) set.add(a.r + "," + c);
      } else {
        const lo = Math.min(a.r, b.r), hi = Math.max(a.r, b.r);
        for (let r = lo; r <= hi; r++) set.add(r + "," + a.c);
      }
    }
    return set;
  }

  // Loosely hand-placed clumps of trees in the "islands" between path bends.
  // Any candidate that happens to land on a path tile is filtered out below.
  const TREE_CANDIDATES = [
    { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 2 }, { r: 1, c: 3 },
    { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 1, c: 9 },
    { r: 1, c: 13 }, { r: 2, c: 13 }, { r: 1, c: 14 }, { r: 2, c: 14 },
    { r: 4, c: 7 }, { r: 4, c: 8 }, { r: 5, c: 8 }, { r: 4, c: 9 }, { r: 5, c: 6 }, { r: 5, c: 10 },
    { r: 4, c: 13 }, { r: 4, c: 14 }, { r: 5, c: 14 }, { r: 5, c: 13 },
    { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 8, c: 5 }, { r: 7, c: 8 }, { r: 8, c: 8 }, { r: 7, c: 9 }, { r: 8, c: 10 }, { r: 7, c: 11 },
    { r: 7, c: 14 }, { r: 8, c: 14 }, { r: 8, c: 15 }, { r: 7, c: 15 },
    { r: 9, c: 9 }, { r: 9, c: 10 }, { r: 8, c: 12 },
  ];

  function buildMap() {
    const path = pathTileSet();
    const trees = new Set();
    TREE_CANDIDATES.forEach((t) => {
      const key = t.r + "," + t.c;
      if (!path.has(key)) trees.add(key);
    });
    const spawnKey = PATH_WAYPOINTS[0].r + "," + PATH_WAYPOINTS[0].c;
    const baseWp = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1];
    const baseKey = baseWp.r + "," + baseWp.c;
    return {
      rows: GRID_ROWS,
      cols: GRID_COLS,
      waypoints: PATH_WAYPOINTS,
      pathTiles: path,
      treeTiles: trees,
      spawnTile: PATH_WAYPOINTS[0],
      baseTile: baseWp,
      spawnKey,
      baseKey,
    };
  }

  // Tower tree:
  //   Hut -> Temple -> Fortress (lightning AoE)
  //                 -> Volcano Fortress (fire / burn)
  //                 -> Snowy Fortress (ice / slow)
  //       -> Arch Tower (long-range bow, alt path)
  //       -> Watchtower (lightning chain + reveals stealth, alt path)
  const TOWERS = {
    hut: {
      id: "hut", name: "Hut", emoji: "🛖", tier: 1, cost: 40,
      range: 1.6, damage: 9, cooldown: 850, attackType: "melee",
      desc: "Cheap starter tower. Basic single-target strikes.",
      upgrades: ["temple", "archtower", "watchtower"],
    },
    temple: {
      id: "temple", name: "Temple", emoji: "🏛️", tier: 2, from: "hut", cost: 65,
      range: 2.0, damage: 15, cooldown: 800, attackType: "melee",
      desc: "Sturdier hub building. Unlocks the elemental fortresses.",
      upgrades: ["fortress", "volcano", "snowy"],
    },
    fortress: {
      id: "fortress", name: "Fortress", emoji: "🏯", tier: 3, from: "temple", cost: 130,
      range: 2.6, damage: 11, cooldown: 1150, attackType: "lightning",
      aoeTargets: 4, aoeRadius: 1.3,
      desc: "Calls down lightning that arcs to up to 4 nearby enemies.",
      upgrades: [],
    },
    volcano: {
      id: "volcano", name: "Volcano Fortress", emoji: "🌋", tier: 3, from: "temple", cost: 115,
      range: 2.1, damage: 13, cooldown: 1000, attackType: "fire",
      burnDps: 5, burnDuration: 3000, burnMaxStacks: 3,
      desc: "Hurls fire that sets enemies ablaze (stacking burn damage over time).",
      upgrades: [],
    },
    snowy: {
      id: "snowy", name: "Snowy Fortress", emoji: "🏔️", tier: 3, from: "temple", cost: 105,
      range: 2.3, damage: 10, cooldown: 950, attackType: "ice",
      slowMultiplier: 0.5, slowDuration: 2200, aoeSlowRadius: 1.5,
      desc: "Ice blasts chill the target and slow nearby enemies too.",
      upgrades: [],
    },
    archtower: {
      id: "archtower", name: "Arch Tower", emoji: "🏹", tier: 2, from: "hut", cost: 75,
      range: 4.6, damage: 18, cooldown: 1250, attackType: "bow",
      desc: "Very long range. Picks off enemies from afar, one at a time.",
      upgrades: [],
    },
    watchtower: {
      id: "watchtower", name: "Watchtower", emoji: "🗼", tier: 2, from: "hut", cost: 70,
      range: 3.1, damage: 8, cooldown: 1000, attackType: "lightning",
      chainTargets: 2, detect: true,
      desc: "Reveals stealthed Ghosts within range (for every tower) and chain-zaps 2 foes.",
      upgrades: [],
    },
  };

  const TOWER_BUILD_ORDER = ["hut"];

  // Enemies
  const ENEMIES = {
    snail: { id: "snail", name: "Snail", emoji: "🐌", hp: 22, speed: 0.55, leak: 1, bounty: 4 },
    skeleton: { id: "skeleton", name: "Skeleton", emoji: "💀", hp: 34, speed: 0.9, leak: 1, bounty: 5 },
    zombie: { id: "zombie", name: "Zombie", emoji: "🧟", hp: 78, speed: 0.6, leak: 2, bounty: 7 },
    spider: { id: "spider", name: "Spider", emoji: "🕷️", hp: 26, speed: 1.35, leak: 1, bounty: 6, slowResist: 0.5 },
    ghost: { id: "ghost", name: "Ghost", emoji: "👻", hp: 40, speed: 1.0, leak: 2, bounty: 8, stealth: true },
    wolf: { id: "wolf", name: "Wolf", emoji: "🐺", hp: 30, speed: 1.5, leak: 2, bounty: 6, pack: 3 },
    troll: { id: "troll", name: "Troll", emoji: "🧌", hp: 115, speed: 0.75, leak: 3, bounty: 10, regen: 2 },
  };

  // Bosses
  const BOSSES = {
    vampire: { id: "vampire", name: "Vampire", emoji: "🧛", hp: 520, speed: 0.9, leak: 8, bounty: 90, regen: 6, boss: true },
    ogre: { id: "ogre", name: "Ogre", emoji: "👹", hp: 950, speed: 0.55, leak: 12, bounty: 130, boss: true },
    djinn: { id: "djinn", name: "Djinn", emoji: "🧞", hp: 720, speed: 1.0, leak: 8, bounty: 145, boss: true, teleportEvery: 4200, teleportDistance: 1.6 },
    wizard: { id: "wizard", name: "Wizard", emoji: "🧙", hp: 660, speed: 0.85, leak: 8, bounty: 155, boss: true, silenceEvery: 5000, silenceDuration: 2500, silenceRange: 2.2 },
    tengu: { id: "tengu", name: "Tengu", emoji: "👺", hp: 800, speed: 1.6, leak: 9, bounty: 165, boss: true, dodge: 0.35 },
    dragon: { id: "dragon", name: "Dragon", emoji: "🐉", hp: 1700, speed: 1.05, leak: 15, bounty: 320, boss: true, fireImmune: true },
  };

  const WAVE_COUNT = 24;
  const BOSS_WAVES = { 4: "vampire", 8: "ogre", 12: "djinn", 16: "wizard", 20: "tengu", 24: "dragon" };

  // Which regular enemy types are "unlocked" as of a given wave (introduced gradually).
  function enemyPoolForWave(wave) {
    const pool = ["snail", "skeleton"];
    if (wave >= 5) pool.push("zombie");
    if (wave >= 9) pool.push("spider");
    if (wave >= 13) pool.push("ghost");
    if (wave >= 17) pool.push("wolf");
    if (wave >= 21) pool.push("troll");
    return pool;
  }

  function buildWave(wave) {
    const bossId = BOSS_WAVES[wave];
    const groups = [];
    const pool = enemyPoolForWave(wave);
    const baseCount = 5 + Math.floor(wave * 1.15);
    // Spread a wave's spawns across the unlocked pool, weighted toward the newest addition.
    pool.forEach((id, idx) => {
      const isNewest = idx === pool.length - 1;
      const count = Math.max(2, Math.round((baseCount / pool.length) * (isNewest ? 1.4 : 0.9)));
      groups.push({ type: id, count, interval: 650 });
    });
    return { wave, groups, boss: bossId || null };
  }

  function buildWaveList() {
    const list = [];
    for (let w = 1; w <= WAVE_COUNT; w++) list.push(buildWave(w));
    return list;
  }

  // Per-wave difficulty scaling applied to base enemy/boss stats at spawn time.
  function scaleForWave(base, wave) {
    const hpMul = 1 + 0.13 * (wave - 1);
    const dmgMul = 1 + 0.06 * (wave - 1);
    return {
      hp: Math.round(base.hp * hpMul),
      leak: base.leak + Math.floor((wave - 1) / 6),
      damageMul: dmgMul,
    };
  }

  return {
    GRID_ROWS,
    GRID_COLS,
    buildMap,
    TOWERS,
    TOWER_BUILD_ORDER,
    ENEMIES,
    BOSSES,
    WAVE_COUNT,
    BOSS_WAVES,
    buildWaveList,
    scaleForWave,
    START_GOLD: 160,
    START_LIVES: 20,
  };
})();
