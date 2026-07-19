/*
 * Pipe Patcher — default campaign levels.
 *
 * Level schema:
 *   name          : string, display name
 *   map           : array of equal-ish-length strings.
 *                    'O' = wall, ' ' = empty (playable), any other glyph is
 *                    a pre-placed pipe piece (see PIPE_GLYPHS in
 *                    pipe-patcher.js for the full set). A pre-placed piece
 *                    with a port facing off-grid or a wall is a terminal
 *                    (source/drain) — the first one found (row-major) is
 *                    the source, the last is the drain.
 *   pipes         : { glyph: weight } — the draw pool for the piece queue.
 *   totalDiscards : number of discards allowed this level.
 *   startingPipes : optional array of glyphs guaranteed to appear first,
 *                    in order, before random draws resume.
 */
window.PIPE_PATCHER_LEVELS = [
  {
    name: "First Flush",
    map: [
      "OO|OO",
      "O   O",
      "O   O",
      "O   O",
      "OO|OO",
    ],
    pipes: { "|": 2, "─": 1 },
    totalDiscards: 5,
  },
  {
    name: "Elbow Joint",
    map: [
      "OOOOO",
      "O   O",
      "─   O",
      "O   O",
      "OO|OO",
    ],
    pipes: { "┌": 2, "┐": 2, "└": 2, "┘": 2, "─": 1, "|": 1 },
    totalDiscards: 5,
  },
  {
    name: "Ring Main",
    map: [
      "OOOOOOO",
      "O     O",
      "O OOO O",
      "─ OOO ─",
      "O OOO O",
      "O     O",
      "OOOOOOO",
    ],
    pipes: { "─": 4, "|": 2, "┌": 2, "┐": 2, "└": 2, "┘": 2 },
    totalDiscards: 6,
  },
  {
    name: "Staggered Flow",
    map: [
      "OOOOOO",
      "─    O",
      "O O  O",
      "O O  O",
      "─    O",
      "OOOOOO",
    ],
    pipes: { "┌": 2, "┐": 2, "└": 2, "┘": 2, "|": 2, "─": 2 },
    totalDiscards: 6,
  },
  {
    name: "Diagonal Cut",
    map: [
      "O|OOOOO",
      "O     O",
      "OO    O",
      "O O   O",
      "O  O  O",
      "O   O O",
      "OOOOO|O",
    ],
    pipes: { "┌": 3, "┐": 3, "└": 3, "┘": 3, "|": 2, "─": 2 },
    totalDiscards: 8,
  },
  {
    name: "Zigzag Pillars",
    map: [
      "OOOOOOO",
      "─     O",
      "O O O O",
      "O     O",
      "O  O  O",
      "O     O",
      "O O O ─",
      "OOOOOOO",
    ],
    pipes: { "|": 3, "─": 3, "┌": 3, "┐": 3, "└": 3, "┘": 3 },
    totalDiscards: 9,
  },
  {
    name: "The Loop",
    map: [
      "OO|OOO",
      "O    O",
      "O  O O",
      "O    O",
      "O    O",
      "OOOO|O",
    ],
    pipes: { "─": 2, "|": 2, "┌": 2, "┐": 2, "└": 2, "┘": 2, "┬": 2, "┴": 2, "├": 1, "┤": 1, "┼": 1 },
    totalDiscards: 7,
  },
  {
    name: "Twin Bores",
    map: [
      "OOOOOOO",
      "O     O",
      "O |   O",
      "─     ─",
      "O   | O",
      "O     O",
      "OOOOOOO",
    ],
    pipes: { "┌": 3, "┐": 3, "└": 3, "┘": 3, "─": 3, "|": 2 },
    totalDiscards: 9,
  },
  {
    name: "Long Haul",
    map: [
      "OOOOOOO",
      "─     O",
      "O     O",
      "OOOOO O",
      "O     O",
      "O OOOOO",
      "O     O",
      "O|OOOOO",
    ],
    pipes: { "─": 5, "|": 3, "┌": 2, "┐": 2, "└": 2, "┘": 2 },
    totalDiscards: 8,
    startingPipes: ["─"],
  },
  {
    name: "The Gauntlet",
    map: [
      "OO|OOOOO",
      "O      O",
      "O O  O O",
      "OO  O  O",
      "─    O O",
      "O   O  O",
      "O  O   O",
      "OOOOOOOO",
    ],
    pipes: {
      "|": 5, "─": 5, "┌": 4, "┐": 4, "└": 4, "┘": 4,
      "┬": 2, "┴": 2, "├": 2, "┤": 2, "┼": 1,
      "∩": 1, "∪": 1, "c": 1, "ↄ": 1,
    },
    totalDiscards: 8,
  },
];
