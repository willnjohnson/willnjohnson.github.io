(function () {
  "use strict";

  // Piece definitions: port order is [N, S, E, W]
  const PORTS = {
    "|": [1, 1, 0, 0],
    "─": [0, 0, 1, 1],
    "┌": [0, 1, 1, 0],
    "┐": [0, 1, 0, 1],
    "└": [1, 0, 1, 0],
    "┘": [1, 0, 0, 1],
    "┬": [0, 1, 1, 1],
    "┴": [1, 0, 1, 1],
    "├": [1, 1, 1, 0],
    "┤": [1, 1, 0, 1],
    "┼": [1, 1, 1, 1],
    "∩": [0, 1, 0, 0],
    "∪": [1, 0, 0, 0],
    "c": [0, 0, 1, 0],
    "ↄ": [0, 0, 0, 1],
  };
  const GLYPH_LABELS = {
    "|": "Vertical pipe",
    "─": "Horizontal pipe",
    "┌": "Corner (opens S/E)",
    "┐": "Corner (opens S/W)",
    "└": "Corner (opens N/E)",
    "┘": "Corner (opens N/W)",
    "┬": "T-joint (opens S/E/W)",
    "┴": "T-joint (opens N/E/W)",
    "├": "T-joint (opens N/S/E)",
    "┤": "T-joint (opens N/S/W)",
    "┼": "Cross joint",
    "∩": "Cap (opens S)",
    "∪": "Cap (opens N)",
    "c": "Cap (opens E)",
    "ↄ": "Cap (opens W)",
  };
  const PALETTE_GROUPS = [
    ["|", "─"],
    ["┌", "┐", "└", "┘"],
    ["┬", "┴", "├", "┤", "┼"],
    ["∩", "∪", "c", "ↄ"],
  ];
  const ALL_GLYPHS = PALETTE_GROUPS.flat();
  const DIRS = [[-1, 0], [1, 0], [0, 1], [0, -1]]; // N S E W
  const OPP = [1, 0, 3, 2];
  const WALL = "O";
  const EMPTY = " ";
  const CAMPAIGNS_KEY = "pipe-patcher-campaigns";
  const ACTIVE_CAMPAIGN_KEY = "pipe-patcher-active-campaign";
  const COMPLETED_DEFAULT_KEY = "pipe-patcher-completed-default";
  const COMPLETED_CUSTOM_KEY = "pipe-patcher-completed-custom"; // Set of "campaignId:levelIndex"

  const cellKey = (r, c) => r + "," + c;
  const sumScores = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

  // Level construction
  function buildLevel(raw) {
    const rawMap = raw.map || [];
    const rows = rawMap.length;
    const cols = rawMap.reduce((m, r) => Math.max(m, r.length), 0);
    const grid = rawMap.map((row) => {
      const chars = row.split("");
      while (chars.length < cols) chars.push(WALL);
      return chars;
    });

    // A piece is a terminal only if it sits on the literal board edge, i.e.
    // one of its neighbor directions runs off-grid. That can only happen for
    // a cell on row 0/rows-1 or col 0/cols-1, so this also naturally excludes
    // any interior piece, even one that happens to sit next to an interior
    // obstacle wall. A piece qualifies if either (a) one of its OPEN ports
    // faces off-grid, the classic case for straight/corner/T/cross pieces,
    // where water enters through that port, or (b) it's a cap (exactly one
    // open port) and one of its CLOSED sides faces off-grid, a cap's single
    // port always points inward by design, so the "outward opening" it's
    // sealing is on a closed side, not an open one.
    const terminals = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = grid[r][c];
        const ports = PORTS[ch];
        if (!ports) continue;
        const openCount = ports[0] + ports[1] + ports[2] + ports[3];
        for (let d = 0; d < 4; d++) {
          const nr = r + DIRS[d][0];
          const nc = c + DIRS[d][1];
          const inBounds = nr >= 0 && nr < rows && nc >= 0 && nc < cols;
          if (inBounds) continue;
          if (ports[d] || openCount === 1) {
            terminals.push([r, c]);
            break;
          }
        }
      }
    }

    const pipes = raw.pipes || {};
    const pool = [];
    Object.keys(pipes).forEach((g) => {
      const w = pipes[g] | 0;
      for (let i = 0; i < w; i++) pool.push(g);
    });

    return {
      name: raw.name || raw.mapName || "Untitled Level",
      rows,
      cols,
      initialGrid: grid,
      pipes,
      totalDiscards: raw.totalDiscards != null ? raw.totalDiscards : 5,
      startingPipes: (raw.startingPipes || []).filter((g) => PORTS[g]),
      terminals,
      source: terminals[0] || null,
      drain: terminals[terminals.length - 1] || null,
      pool,
    };
  }

  function levelIsValid(level) {
    if (level.rows <= 0 || level.cols <= 0) return false;
    return level.terminals.length >= 2;
  }

  // Board analysis (mirrors the reference engine's leak/connectivity rules).
  function bfsComponent(ctx, board, start) {
    const visited = new Set([cellKey(start[0], start[1])]);
    const queue = [start];
    const terminalSet = new Set(ctx.terminals.map(([r, c]) => cellKey(r, c)));
    let leak = false;

    while (queue.length) {
      const [r, c] = queue.shift();
      const ports = PORTS[board[r][c]];
      if (!ports) continue;
      for (let d = 0; d < 4; d++) {
        if (!ports[d]) continue;
        const nr = r + DIRS[d][0];
        const nc = c + DIRS[d][1];
        const inBounds = nr >= 0 && nr < ctx.rows && nc >= 0 && nc < ctx.cols;
        if (!inBounds || board[nr][nc] === WALL) {
          if (!terminalSet.has(cellKey(r, c))) leak = true;
          continue;
        }
        const neighborPorts = PORTS[board[nr][nc]];
        const reciprocates = neighborPorts && neighborPorts[OPP[d]];
        if (!reciprocates) {
          leak = true;
          continue;
        }
        const nk = cellKey(nr, nc);
        if (!visited.has(nk)) {
          visited.add(nk);
          queue.push([nr, nc]);
        }
      }
    }
    return { visited, leak };
  }

  function analyzeBoard(ctx, board, userPlaced) {
    if (!ctx.source) {
      return { solved: false, C: 0, U: userPlaced.size, connected: new Set() };
    }
    const { visited: fromSource, leak } = bfsComponent(ctx, board, ctx.source);
    const solved = !!ctx.drain && fromSource.has(cellKey(ctx.drain[0], ctx.drain[1])) && !leak;
    // A piece counts as connected if it reaches either terminal, not just the
    // source: a stub running in from the drain is just as "connected" to the
    // player as one running in from the source, only a fully isolated piece
    // is stray.
    let connected = fromSource;
    if (ctx.drain) {
      const { visited: fromDrain } = bfsComponent(ctx, board, ctx.drain);
      connected = new Set([...fromSource, ...fromDrain]);
    }
    let C = 0, U = 0;
    userPlaced.forEach((k) => (connected.has(k) ? C++ : U++));
    return { solved, C, U, connected };
  }

  function calcScore(levelNumber, C, U) {
    const multiplier = 10 + 0.5 * (levelNumber - 1);
    return Math.max(10, Math.floor(multiplier * (C - 0.8 * U)));
  }

  function drawPiece(level) {
    if (!level.pool.length) return "─";
    return level.pool[Math.floor(Math.random() * level.pool.length)];
  }

  function boardHasEmpty(level, board) {
    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        if (board[r][c] === EMPTY) return true;
      }
    }
    return false;
  }

  // Session (one in-progress play-through)
  function sessionCtx(session) {
    return {
      rows: session.level.rows,
      cols: session.level.cols,
      source: session.source,
      drain: session.drain,
      terminals: session.terminals,
    };
  }

  function newSession(level, levelNumber) {
    const board = level.initialGrid.map((row) => row.slice());
    const queue = level.startingPipes.slice();
    while (queue.length < 3) queue.push(drawPiece(level));
    const terminals = [level.terminals[0], level.terminals[level.terminals.length - 1]];
    const session = {
      level,
      levelNumber,
      board,
      discards: level.totalDiscards,
      queue,
      userPlaced: new Set(),
      status: "playing",
      terminals,
      source: terminals[0],
      drain: terminals[1],
      C: 0,
      U: 0,
      score: 0,
      connected: new Set(),
    };
    postAction(session);
    return session;
  }

  function postAction(session) {
    const result = analyzeBoard(sessionCtx(session), session.board, session.userPlaced);
    session.C = result.C;
    session.U = result.U;
    session.connected = result.connected;
    if (result.solved) {
      session.status = "solved";
      session.score = calcScore(session.levelNumber, result.C, result.U);
    } else if (!boardHasEmpty(session.level, session.board)) {
      session.status = "bust";
    }
  }

  function placePiece(session, r, c) {
    if (session.status !== "playing") return false;
    if (session.board[r][c] !== EMPTY) return false;
    const p0 = session.queue.shift();
    session.board[r][c] = p0;
    session.userPlaced.add(cellKey(r, c));
    session.queue.push(drawPiece(session.level));
    postAction(session);
    return true;
  }

  function discardPiece(session) {
    if (session.status !== "playing") return false;
    if (session.discards <= 0) return false;
    session.discards--;
    session.queue.shift();
    session.queue.push(drawPiece(session.level));
    postAction(session);
    return true;
  }

  // Rendering helpers
  function pieceInnerSVG(glyph, opts) {
    opts = opts || {};
    const ports = PORTS[glyph];
    if (!ports) return "";
    const openCount = ports.reduce((a, b) => a + b, 0);
    const pipeClass = opts.disconnected ? "pp-stroke-warn" : "pp-stroke-pipe";
    const endPoints = [[20, 2], [20, 38], [38, 20], [2, 20]]; // N S E W

    let svg = "";
    ports.forEach((open, d) => {
      if (!open) return;
      const [x, y] = endPoints[d];
      // A cap (single open port) draws the same short stub as every other
      // piece (from the center out to its one open edge) and relies on the
      // round line-cap to blunt the far (center) end, instead of a separate
      // colored dome shape. No special-casing needed: the round cap is
      // already just how every line here terminates.
      svg += `<line x1="20" y1="20" x2="${x}" y2="${y}" class="${pipeClass}" stroke-width="13" stroke-linecap="round"/>`;
    });
    if (openCount >= 2) {
      svg += `<circle cx="20" cy="20" r="8" class="pp-fill-pipe"/>`;
    }
    return svg;
  }

  function cellMarkup(glyph, opts) {
    opts = opts || {};
    if (glyph === WALL) {
      return `<div class="pp-cell-fill pp-cell-wall" title="Wall"></div>`;
    }
    if (glyph === EMPTY || !PORTS[glyph]) {
      return `<div class="pp-cell-fill pp-cell-empty"></div>`;
    }
    const inner = pieceInnerSVG(glyph, opts);
    const label = GLYPH_LABELS[glyph] || glyph;
    return `<svg viewBox="0 0 40 40" class="pp-piece-svg" role="img" aria-label="${label}">${inner}</svg>`;
  }

  // Campaign & completion storage
  function loadCampaigns() {
    try {
      const raw = window.localStorage.getItem(CAMPAIGNS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveCampaigns(list) {
    try {
      window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(list));
    } catch (e) {
      /* storage unavailable, silently skip persistence */
    }
  }

  function loadActiveCampaignId() {
    try {
      return window.localStorage.getItem(ACTIVE_CAMPAIGN_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  function saveActiveCampaignId(id) {
    try {
      if (id) window.localStorage.setItem(ACTIVE_CAMPAIGN_KEY, id);
      else window.localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
    } catch (e) {
      /* storage unavailable, silently skip persistence */
    }
  }

  function genId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  }

  function loadIdSet(key) {
    try {
      const raw = window.localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list : []);
    } catch (e) {
      return new Set();
    }
  }

  function saveIdSet(key, set) {
    try {
      window.localStorage.setItem(key, JSON.stringify([...set]));
    } catch (e) {
      /* storage unavailable, silently skip persistence */
    }
  }

  function clearCompletionForCampaign(campaignId) {
    const prefix = campaignId + ":";
    [...completedCustom].forEach((k) => {
      if (k.startsWith(prefix)) completedCustom.delete(k);
    });
    saveIdSet(COMPLETED_CUSTOM_KEY, completedCustom);
    delete customBestScores[campaignId];
  }

  function normalizeRawLevel(raw, fallbackName) {
    return {
      name: raw.name || raw.mapName || fallbackName,
      map: raw.map,
      pipes: raw.pipes || {},
      totalDiscards: raw.totalDiscards != null ? raw.totalDiscards : 5,
      startingPipes: raw.startingPipes || [],
    };
  }

  // Accepts a full campaign ({campaign_name, progression_only, levels:{...}}),
  // a bare array of levels, or a single level object, all become a campaign.
  function parseImportedCampaign(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { campaign: null, errors: ["That's not valid JSON: " + e.message] };
    }

    let campaignName = "Imported Campaign";
    let progressionOnly = false;
    let rawLevels = [];

    if (Array.isArray(parsed)) {
      rawLevels = parsed;
    } else if (parsed && typeof parsed === "object" && parsed.levels) {
      campaignName = parsed.campaign_name || parsed.name || campaignName;
      progressionOnly = !!parsed.progression_only;
      rawLevels = Array.isArray(parsed.levels) ? parsed.levels : Object.values(parsed.levels);
    } else if (parsed && typeof parsed === "object" && parsed.map) {
      campaignName = parsed.name || parsed.mapName || campaignName;
      rawLevels = [parsed];
    } else {
      return {
        campaign: null,
        errors: ["Unrecognized JSON shape: expected a campaign ({ campaign_name, levels: {...} }), a level object, or an array of levels."],
      };
    }

    const levels = [];
    const errors = [];
    rawLevels.forEach((raw, i) => {
      if (!raw || !Array.isArray(raw.map) || !raw.map.length) {
        errors.push(`Level ${i + 1}: missing or invalid "map" array: skipped.`);
        return;
      }
      const normalized = normalizeRawLevel(raw, `Level ${i + 1}`);
      const built = buildLevel(normalized);
      if (!levelIsValid(built)) {
        errors.push(`"${normalized.name}": needs a source and a drain to be playable: skipped.`);
        return;
      }
      levels.push(normalized);
    });

    if (!levels.length) {
      return { campaign: null, errors: errors.length ? errors : ["No playable levels found in that JSON."] };
    }

    return {
      campaign: { id: null, campaign_name: campaignName, progression_only: progressionOnly, levels },
      errors,
    };
  }

  // DOM references
  const els = {
    tabs: document.querySelectorAll(".pp-tab"),
    panes: {
      play: document.getElementById("pp-pane-play"),
      editor: document.getElementById("pp-pane-editor"),
    },

    playSelect: document.getElementById("pp-play-select"),
    playGame: document.getElementById("pp-play-game"),
    defaultLevels: document.getElementById("pp-default-levels"),
    customLevelsList: document.getElementById("pp-custom-levels"),
    customEmptyNote: document.getElementById("pp-custom-empty"),
    campaignScore: document.getElementById("pp-campaign-score"),
    campaignReset: document.getElementById("pp-campaign-reset"),
    customScore: document.getElementById("pp-custom-score"),
    campaignSelect: document.getElementById("pp-campaign-select"),
    campaignDelete: document.getElementById("pp-campaign-delete"),
    importBtn: document.getElementById("pp-import-btn"),

    gameBack: document.getElementById("pp-game-back"),
    gameTitle: document.getElementById("pp-game-title"),
    discardsCount: document.getElementById("pp-discards"),
    board: document.getElementById("pp-board"),
    queue: document.getElementById("pp-queue"),
    discardBtn: document.getElementById("pp-discard-btn"),
    restartBtn: document.getElementById("pp-restart-btn"),
    liveStats: document.getElementById("pp-live-stats"),
    result: document.getElementById("pp-result"),
    resultTitle: document.getElementById("pp-result-title"),
    resultText: document.getElementById("pp-result-text"),
    resultActions: document.getElementById("pp-result-actions"),

    importModal: document.getElementById("pp-import-modal"),
    importText: document.getElementById("pp-import-text"),
    importFile: document.getElementById("pp-import-file"),
    importSubmit: document.getElementById("pp-import-submit"),
    importCancel: document.getElementById("pp-import-cancel"),
    importErrors: document.getElementById("pp-import-errors"),

    // Editor
    editorCampaignName: document.getElementById("pp-ed-campaign-name"),
    editorCampaignProgression: document.getElementById("pp-ed-campaign-progression"),
    editorLevelSelect: document.getElementById("pp-ed-level-select"),
    editorAddLevel: document.getElementById("pp-ed-add-level"),
    editorRemoveLevel: document.getElementById("pp-ed-remove-level"),
    editorName: document.getElementById("pp-ed-name"),
    editorRows: document.getElementById("pp-ed-rows"),
    editorCols: document.getElementById("pp-ed-cols"),
    editorResize: document.getElementById("pp-ed-resize"),
    editorPalette: document.getElementById("pp-ed-palette"),
    editorGrid: document.getElementById("pp-ed-grid"),
    editorTerminalStatus: document.getElementById("pp-ed-terminal-status"),
    editorWeights: document.getElementById("pp-ed-weights"),
    editorDiscards: document.getElementById("pp-ed-discards"),
    editorStartSelect: document.getElementById("pp-ed-start-select"),
    editorStartAdd: document.getElementById("pp-ed-start-add"),
    editorStartList: document.getElementById("pp-ed-start-list"),
    editorNew: document.getElementById("pp-ed-new"),
    editorSave: document.getElementById("pp-ed-save"),
    editorDelete: document.getElementById("pp-ed-delete"),
    editorTest: document.getElementById("pp-ed-test"),
    editorExport: document.getElementById("pp-ed-export"),
    editorLoadSelect: document.getElementById("pp-ed-load-select"),
    editorJsonOut: document.getElementById("pp-ed-json-out"),
    editorImport: document.getElementById("pp-ed-import"),
    customReset: document.getElementById("pp-custom-reset"),
  };

  // App state
  let campaigns = loadCampaigns();
  let activeCampaignId = loadActiveCampaignId();
  let defaultBestScores = {}; // levelIndex -> best score achieved for that level
  let customBestScores = {}; // campaignId -> { levelIndex -> best score }, same session-only lifetime as defaultBestScores
  let session = null;
  let currentPlaylist = null; // { levels, isDefault, campaignId?, levelNumberOverride? }
  let currentIndex = 0;
  let completedDefault = loadIdSet(COMPLETED_DEFAULT_KEY); // Set of level indices (numbers)
  let completedCustom = loadIdSet(COMPLETED_CUSTOM_KEY); // Set of "campaignId:levelIndex"

  // Tabs
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      els.tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      Object.values(els.panes).forEach((p) => p.classList.remove("active"));
      els.panes[tab.dataset.tab].classList.add("active");
    });
  });

  // Play: level select
  function activeCampaign() {
    return campaigns.find((c) => c.id === activeCampaignId) || null;
  }

  function renderLevelSelect() {
    els.campaignScore.textContent = sumScores(defaultBestScores);

    els.defaultLevels.innerHTML = "";
    (window.PIPE_PATCHER_LEVELS || []).forEach((raw, i) => {
      const completed = completedDefault.has(i);
      const locked = i > 0 && !completedDefault.has(i - 1);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pp-level-tile" + (locked ? " pp-level-tile--locked" : "") + (completed ? " pp-level-tile--done" : "");
      const badge = locked
        ? `<span class="pp-level-lock" title="Complete level ${i} to unlock">🔒</span>`
        : completed
        ? `<span class="pp-level-check" title="Completed">✓</span>`
        : "";
      btn.innerHTML = `<span class="pp-level-num">${i + 1}</span><span class="pp-level-name">${escapeHtml(raw.name)}</span>${badge}`;
      if (locked) {
        btn.disabled = true;
        btn.title = `Complete level ${i} to unlock`;
      } else {
        btn.addEventListener("click", () => {
          currentPlaylist = { levels: window.PIPE_PATCHER_LEVELS, isDefault: true };
          startLevel(i);
        });
      }
      els.defaultLevels.appendChild(btn);
    });

    if (!campaigns.some((c) => c.id === activeCampaignId)) {
      activeCampaignId = campaigns.length ? campaigns[0].id : null;
      saveActiveCampaignId(activeCampaignId);
    }
    els.campaignSelect.innerHTML = campaigns.length
      ? campaigns.map((c) => `<option value="${c.id}">${escapeHtml(c.campaign_name)}</option>`).join("")
      : `<option value="">No campaigns yet</option>`;
    if (activeCampaignId) els.campaignSelect.value = activeCampaignId;
    els.campaignSelect.disabled = !campaigns.length;
    if (els.campaignDelete) els.campaignDelete.classList.toggle("pp-hidden", !activeCampaignId);
    if (els.customReset) els.customReset.classList.toggle("pp-hidden", !activeCampaignId);
    if (els.customScore) els.customScore.textContent = activeCampaignId ? sumScores(customBestScores[activeCampaignId] || {}) : 0;

    const camp = activeCampaign();
    const levels = camp ? camp.levels : [];
    els.customLevelsList.innerHTML = "";
    els.customEmptyNote.classList.toggle("pp-hidden", levels.length > 0);
    els.customEmptyNote.textContent = !campaigns.length
      ? "No custom campaigns yet: build one in the Level Editor, or import a JSON file."
      : "This campaign has no levels yet: add some in the Level Editor.";

    levels.forEach((raw, i) => {
      const key = activeCampaignId + ":" + i;
      const completed = completedCustom.has(key);
      const prevKey = activeCampaignId + ":" + (i - 1);
      const locked = !!(camp && camp.progression_only) && i > 0 && !completedCustom.has(prevKey);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pp-level-tile pp-level-tile--custom" + (locked ? " pp-level-tile--locked" : "") + (completed ? " pp-level-tile--done" : "");
      const badge = locked
        ? `<span class="pp-level-lock" title="Complete the previous level to unlock">🔒</span>`
        : completed
        ? `<span class="pp-level-check" title="Completed">✓</span>`
        : `<span class="pp-level-tag">custom</span>`;
      btn.innerHTML = `<span class="pp-level-num">${i + 1}</span><span class="pp-level-name">${escapeHtml(raw.name)}</span>${badge}`;
      if (locked) {
        btn.disabled = true;
        btn.title = "Complete the previous level to unlock";
      } else {
        btn.addEventListener("click", () => {
          currentPlaylist = { levels, isDefault: false, campaignId: activeCampaignId };
          startLevel(i);
        });
      }
      els.customLevelsList.appendChild(btn);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text == null ? "" : text);
    return div.innerHTML;
  }

  function startLevel(index) {
    currentIndex = index;
    const raw = currentPlaylist.levels[index];
    const level = buildLevel(raw);
    if (!levelIsValid(level)) {
      alert(`"${level.name}" doesn't have both a source and a drain and can't be played.`);
      return;
    }
    const levelNumber = currentPlaylist.levelNumberOverride || index + 1;
    session = newSession(level, levelNumber);
    els.playSelect.classList.add("pp-hidden");
    els.playGame.classList.remove("pp-hidden");
    els.result.classList.add("pp-hidden");
    renderGame();
  }

  function backToLevels() {
    session = null;
    els.playGame.classList.add("pp-hidden");
    els.playSelect.classList.remove("pp-hidden");
    renderLevelSelect();
  }

  els.gameBack.addEventListener("click", backToLevels);
  els.campaignReset.addEventListener("click", () => {
    if (!confirm("Reset campaign score and unlock progress?")) return;
    defaultBestScores = {};
    completedDefault = new Set();
    saveIdSet(COMPLETED_DEFAULT_KEY, completedDefault);
    renderLevelSelect();
  });

  els.campaignSelect.addEventListener("change", () => {
    activeCampaignId = els.campaignSelect.value || null;
    saveActiveCampaignId(activeCampaignId);
    renderLevelSelect();
  });

  if (els.campaignDelete) {
    els.campaignDelete.addEventListener("click", () => {
      const camp = activeCampaign();
      if (!camp) return;
      if (!confirm(`Delete campaign "${camp.campaign_name}" and all ${camp.levels.length} of its levels? This can't be undone.`)) return;
      campaigns = campaigns.filter((c) => c.id !== camp.id);
      saveCampaigns(campaigns);
      clearCompletionForCampaign(camp.id);
      activeCampaignId = campaigns.length ? campaigns[0].id : null;
      saveActiveCampaignId(activeCampaignId);
      refreshEditorLoadOptions();
      renderLevelSelect();
    });
  }

  if (els.customReset) {
    els.customReset.addEventListener("click", () => {
      if (!activeCampaignId) return;
      if (!confirm("Reset unlock progress for this campaign?")) return;
      clearCompletionForCampaign(activeCampaignId);
      renderLevelSelect();
    });
  }

  // Play: game board
  function renderGame() {
    const level = session.level;
    els.gameTitle.textContent = `${session.levelNumber}. ${level.name}`;
    els.discardsCount.textContent = session.discards;
    els.discardBtn.classList.toggle("pp-hidden", session.discards <= 0 || session.status !== "playing");

    els.board.style.setProperty("--pp-rows", level.rows);
    els.board.style.setProperty("--pp-cols", level.cols);
    let boardHtml = "";
    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        const glyph = session.board[r][c];
        const isUserPlaced = session.userPlaced.has(cellKey(r, c));
        const connected = session.connected.has(cellKey(r, c));
        const disconnected = isUserPlaced && !connected;
        const clickable = glyph === EMPTY && session.status === "playing";
        boardHtml += `<div class="pp-cell${clickable ? " pp-cell--clickable" : ""}" data-r="${r}" data-c="${c}">${cellMarkup(glyph, { disconnected })}</div>`;
      }
    }
    els.board.innerHTML = boardHtml;

    els.queue.innerHTML = "";
    const labels = ["Now", "Next", "Then"];
    session.queue.slice(0, 3).forEach((glyph, i) => {
      const box = document.createElement("div");
      box.className = "pp-queue-item" + (i === 0 ? " pp-queue-item--current" : "");
      box.innerHTML = `<span class="pp-queue-label">${labels[i]}</span><svg viewBox="0 0 40 40" class="pp-piece-svg">${pieceInnerSVG(glyph)}</svg>`;
      els.queue.appendChild(box);
    });

    if (els.liveStats) {
      els.liveStats.textContent = `Connected: ${session.C}   Stray: ${session.U}`;
    }

    if (session.status === "solved" || session.status === "bust") {
      showResult();
    } else {
      els.result.classList.add("pp-hidden");
    }
  }

  els.board.addEventListener("click", (e) => {
    const cell = e.target.closest(".pp-cell--clickable");
    if (!cell || !session) return;
    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);
    if (placePiece(session, r, c)) renderGame();
  });

  els.discardBtn.addEventListener("click", () => {
    if (session && discardPiece(session)) renderGame();
  });

  els.restartBtn.addEventListener("click", () => {
    if (!session) return;
    if (!confirm("Restart this level from the beginning?")) return;
    startLevel(currentIndex);
  });

  function showResult() {
    els.result.classList.remove("pp-hidden");
    els.resultActions.innerHTML = "";

    if (session.status === "solved") {
      if (currentPlaylist && currentPlaylist.isDefault) {
        if (session.score > (defaultBestScores[currentIndex] || 0)) defaultBestScores[currentIndex] = session.score;
        completedDefault.add(currentIndex);
        saveIdSet(COMPLETED_DEFAULT_KEY, completedDefault);
      } else if (currentPlaylist && currentPlaylist.campaignId) {
        const key = currentPlaylist.campaignId + ":" + currentIndex;
        completedCustom.add(key);
        saveIdSet(COMPLETED_CUSTOM_KEY, completedCustom);
        const campId = currentPlaylist.campaignId;
        const campScores = customBestScores[campId] || (customBestScores[campId] = {});
        if (session.score > (campScores[currentIndex] || 0)) campScores[currentIndex] = session.score;
      }
      els.resultTitle.textContent = "Level Complete!";
      els.resultText.textContent = `Score: ${session.score}  (connected: ${session.C}, stray: ${session.U})`;

      const hasNext = currentPlaylist && currentIndex + 1 < currentPlaylist.levels.length;
      if (hasNext) {
        addResultButton("Next Level →", () => startLevel(currentIndex + 1), true);
        addResultButton("Replay", () => startLevel(currentIndex));
      } else {
        addResultButton("Replay", () => startLevel(currentIndex), true);
      }
      addResultButton("Back to Levels", backToLevels);
    } else {
      els.resultTitle.textContent = "Bust!";
      els.resultText.textContent = "The board filled up before the pipe reached the drain.";
      addResultButton("Retry", () => startLevel(currentIndex), true);
      addResultButton("Back to Levels", backToLevels);
    }
  }

  function addResultButton(label, handler, primary) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = primary ? "btn" : "pp-link-btn";
    btn.textContent = label;
    btn.addEventListener("click", handler);
    els.resultActions.appendChild(btn);
  }

  // Import modal (shared by Play + Editor)
  let importTarget = "play"; // 'play' -> adds a new campaign to My Levels; 'editor' -> loads into the editor

  function openImportModal(target) {
    importTarget = target;
    els.importText.value = "";
    els.importErrors.innerHTML = "";
    if (els.importFile) els.importFile.value = "";
    els.importModal.classList.remove("pp-hidden");
  }
  function closeImportModal() {
    els.importModal.classList.add("pp-hidden");
  }

  els.importBtn.addEventListener("click", () => openImportModal("play"));
  els.importCancel.addEventListener("click", closeImportModal);
  if (els.editorImport) {
    els.editorImport.addEventListener("click", () => openImportModal("editor"));
  }

  if (els.importFile) {
    els.importFile.addEventListener("change", () => {
      const file = els.importFile.files && els.importFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        els.importText.value = String(reader.result || "");
      };
      reader.readAsText(file);
    });
  }

  els.importSubmit.addEventListener("click", () => {
    const { campaign, errors } = parseImportedCampaign(els.importText.value.trim());
    els.importErrors.innerHTML = errors.map((e) => `<p>${escapeHtml(e)}</p>`).join("");
    if (!campaign) return;

    if (importTarget === "editor") {
      loadCampaignIntoEditor(campaign);
      closeImportModal();
      return;
    }

    campaign.id = genId("camp");
    campaigns.push(campaign);
    saveCampaigns(campaigns);
    activeCampaignId = campaign.id;
    saveActiveCampaignId(activeCampaignId);
    renderLevelSelect();
    refreshEditorLoadOptions();
    if (!errors.length) closeImportModal();
  });

  // Level Editor
  function blankGrid(rows, cols) {
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const border = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
        row.push(border ? WALL : EMPTY);
      }
      grid.push(row);
    }
    return grid;
  }

  function freshLevelRaw() {
    return {
      name: "New Level",
      map: blankGrid(5, 5).map((row) => row.join("")),
      pipes: {},
      totalDiscards: 5,
      startingPipes: [],
    };
  }

  function freshCampaign() {
    return { id: null, campaign_name: "New Campaign", progression_only: false, levels: [freshLevelRaw()] };
  }

  // Converts a raw (serializable) level into the editor's live working shape
  // (2D grid instead of map strings).
  function rawToWorking(raw) {
    const rows = raw.map.length;
    const cols = raw.map.reduce((m, r) => Math.max(m, r.length), 0);
    const grid = raw.map.map((row) => {
      const chars = row.split("");
      while (chars.length < cols) chars.push(WALL);
      return chars;
    });
    return {
      name: raw.name || raw.mapName || "Untitled Level",
      rows,
      cols,
      grid,
      pipes: Object.assign({}, raw.pipes || {}),
      totalDiscards: raw.totalDiscards != null ? raw.totalDiscards : 5,
      startingPipes: (raw.startingPipes || []).slice(),
    };
  }

  function workingToRaw(working) {
    return {
      name: working.name || "Untitled Level",
      map: working.grid.map((row) => row.join("")),
      pipes: Object.assign({}, working.pipes),
      totalDiscards: working.totalDiscards,
      startingPipes: working.startingPipes.slice(),
    };
  }

  let editorCampaign = freshCampaign();
  let editorLevelIndex = 0;
  let editor = rawToWorking(editorCampaign.levels[0]);
  let editorTool = EMPTY;

  function syncEditorIntoCampaign() {
    editorCampaign.levels[editorLevelIndex] = workingToRaw(editor);
  }

  function switchEditorLevel(index) {
    syncEditorIntoCampaign();
    editorLevelIndex = Math.max(0, Math.min(index, editorCampaign.levels.length - 1));
    editor = rawToWorking(editorCampaign.levels[editorLevelIndex]);
    loadEditorIntoForm();
  }

  function renderPalette() {
    els.editorPalette.innerHTML = "";
    const makeBtn = (glyph, label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pp-tool" + (editorTool === glyph ? " active" : "");
      btn.title = label;
      btn.innerHTML = glyph === WALL
        ? `<div class="pp-cell-fill pp-cell-wall pp-tool-fill"></div>`
        : glyph === EMPTY
        ? `<div class="pp-cell-fill pp-cell-empty pp-tool-fill"></div>`
        : `<svg viewBox="0 0 40 40" class="pp-piece-svg">${pieceInnerSVG(glyph)}</svg>`;
      btn.addEventListener("click", () => {
        editorTool = glyph;
        renderPalette();
        renderEditorGrid();
      });
      return btn;
    };

    const specials = document.createElement("div");
    specials.className = "pp-tool-group";
    specials.appendChild(makeBtn(WALL, "Wall"));
    specials.appendChild(makeBtn(EMPTY, "Empty: targeting an outer wall (not a corner) turns it into a source/drain instead (max 2)"));
    els.editorPalette.appendChild(specials);

    PALETTE_GROUPS.forEach((group) => {
      const wrap = document.createElement("div");
      wrap.className = "pp-tool-group";
      group.forEach((g) => wrap.appendChild(makeBtn(g, GLYPH_LABELS[g])));
      els.editorPalette.appendChild(wrap);
    });
  }

  function editorTerminals() {
    const level = buildLevel({
      name: editor.name,
      map: editor.grid.map((row) => row.join("")),
      pipes: editor.pipes,
      totalDiscards: editor.totalDiscards,
      startingPipes: editor.startingPipes,
    });
    return level;
  }

  // Which straight-pipe glyph an outer wall becomes, purely by position:
  // top/bottom edge -> vertical, left/right edge -> horizontal. Corners are
  // ambiguous (both at once) and interior walls aren't "outer" at all, so
  // both return null and are left alone.
  function editorTerminalShape(r, c) {
    const onTopOrBottom = r === 0 || r === editor.rows - 1;
    const onLeftOrRight = c === 0 || c === editor.cols - 1;
    if (onTopOrBottom === onLeftOrRight) return null; // both = corner, neither = interior
    return onTopOrBottom ? "|" : "─";
  }

  function breakEditorWall(r, c) {
    const shape = editorTerminalShape(r, c);
    if (shape === null) return false;
    if (editorTerminals().terminals.length >= 2) {
      alert("This level already has 2 terminals (source + drain). Paint one back to Wall first if you want to relocate it.");
      return true; // handled (blocked), caller should not also fall through to a plain repaint
    }
    editor.grid[r][c] = shape;
    renderEditorGrid();
    return true;
  }

  function renderEditorGrid() {
    const level = editorTerminals();
    const sourceKey = level.source ? cellKey(level.source[0], level.source[1]) : null;
    const drainKey = level.drain ? cellKey(level.drain[0], level.drain[1]) : null;

    els.editorGrid.style.setProperty("--pp-rows", editor.rows);
    els.editorGrid.style.setProperty("--pp-cols", editor.cols);
    let html = "";
    for (let r = 0; r < editor.rows; r++) {
      for (let c = 0; c < editor.cols; c++) {
        const glyph = editor.grid[r][c];
        const k = cellKey(r, c);
        let badge = "";
        if (k === sourceKey) badge = `<span class="pp-terminal-badge pp-terminal-badge--source" title="Source">S</span>`;
        else if (k === drainKey) badge = `<span class="pp-terminal-badge pp-terminal-badge--drain" title="Drain">D</span>`;
        html += `<div class="pp-cell pp-cell--clickable" data-r="${r}" data-c="${c}">${cellMarkup(glyph)}${badge}</div>`;
      }
    }
    els.editorGrid.innerHTML = html;

    if (level.terminals.length >= 2) {
      els.editorTerminalStatus.textContent = `Source at (${level.source[0]}, ${level.source[1]}), drain at (${level.drain[0]}, ${level.drain[1]}).`;
      els.editorTerminalStatus.className = "pp-terminal-status pp-terminal-status--ok";
    } else {
      const needed = 2 - level.terminals.length;
      els.editorTerminalStatus.textContent = `Needs ${needed} more terminal opening${needed > 1 ? "s" : ""} (found ${level.terminals.length} placed). Place a pipe piece on the board edge, or use the Empty tool on an outer wall to shape it into one.`;
      els.editorTerminalStatus.className = "pp-terminal-status pp-terminal-status--warn";
    }
  }

  function isEditorTerminalCell(r, c) {
    return editorTerminals().terminals.some(([tr, tc]) => tr === r && tc === c);
  }

  function isOuterWallCell(r, c) {
    const onBoundary = r === 0 || c === 0 || r === editor.rows - 1 || c === editor.cols - 1;
    return onBoundary && editor.grid[r][c] === WALL;
  }

  function isCornerWallCell(r, c) {
    const onTopOrBottom = r === 0 || r === editor.rows - 1;
    const onLeftOrRight = c === 0 || c === editor.cols - 1;
    return onTopOrBottom && onLeftOrRight && editor.grid[r][c] === WALL;
  }

  els.editorGrid.addEventListener("click", (e) => {
    const cell = e.target.closest(".pp-cell");
    if (!cell) return;
    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);
    // With the Empty tool selected, targeting an existing outer wall (not a
    // corner) shapes it into a source/drain instead of clearing it to empty.
    // Any other tool always paints exactly what's selected (full manual control).
    if (editorTool === EMPTY && editor.grid[r][c] === WALL && breakEditorWall(r, c)) {
      return;
    }
    // A corner wall is never a valid source/drain position (editorTerminalShape
    // can't tell top/bottom from left/right there) and it isn't an interior
    // obstacle either, so it stays permanently a wall, not even Empty may
    // clear it. Only the Wall tool (a no-op here) is allowed to touch it.
    if (editorTool === EMPTY && isCornerWallCell(r, c)) {
      return;
    }
    // Once a cell is a source/drain, only the Wall tool can clear it (Empty)
    // and every pipe glyph are blocked so a terminal can't vanish by accident.
    if (editorTool !== WALL && isEditorTerminalCell(r, c)) {
      return;
    }
    // No pipe glyph may replace an outer wall directly, the only way to turn
    // one into a source/drain is the Empty tool's auto-shape above.
    if (editorTool !== WALL && editorTool !== EMPTY && isOuterWallCell(r, c)) {
      return;
    }
    editor.grid[r][c] = editorTool;
    renderEditorGrid();
  });

  function renderWeights() {
    els.editorWeights.innerHTML = "";
    ALL_GLYPHS.forEach((g) => {
      const row = document.createElement("label");
      row.className = "pp-weight-row";
      row.innerHTML = `<svg viewBox="0 0 40 40" class="pp-piece-svg pp-piece-svg--sm">${pieceInnerSVG(g)}</svg><span>${GLYPH_LABELS[g]}</span>`;
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.value = editor.pipes[g] || 0;
      input.addEventListener("input", () => {
        const v = Math.max(0, parseInt(input.value, 10) || 0);
        if (v > 0) editor.pipes[g] = v;
        else delete editor.pipes[g];
      });
      row.appendChild(input);
      els.editorWeights.appendChild(row);
    });
  }

  function renderStartList() {
    els.editorStartList.innerHTML = "";
    editor.startingPipes.forEach((g, i) => {
      const chip = document.createElement("span");
      chip.className = "pp-chip";
      chip.innerHTML = `<svg viewBox="0 0 40 40" class="pp-piece-svg pp-piece-svg--sm">${pieceInnerSVG(g)}</svg>`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "pp-chip-remove";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        editor.startingPipes.splice(i, 1);
        renderStartList();
      });
      chip.appendChild(remove);
      els.editorStartList.appendChild(chip);
    });
  }

  function populateStartSelect() {
    els.editorStartSelect.innerHTML = ALL_GLYPHS.map((g) => `<option value="${g}">${GLYPH_LABELS[g]}</option>`).join("");
  }

  els.editorStartAdd.addEventListener("click", () => {
    const g = els.editorStartSelect.value;
    if (g) {
      editor.startingPipes.push(g);
      renderStartList();
    }
  });

  function renderLevelPicker() {
    els.editorLevelSelect.innerHTML = editorCampaign.levels
      .map((raw, i) => `<option value="${i}">${i + 1}. ${escapeHtml(raw.name || "Untitled Level")}</option>`)
      .join("");
    els.editorLevelSelect.value = String(editorLevelIndex);
  }

  els.editorLevelSelect.addEventListener("change", () => {
    switchEditorLevel(parseInt(els.editorLevelSelect.value, 10));
  });

  function loadEditorIntoForm() {
    els.editorCampaignName.value = editorCampaign.campaign_name;
    els.editorCampaignProgression.checked = !!editorCampaign.progression_only;
    els.editorName.value = editor.name;
    els.editorRows.value = editor.rows;
    els.editorCols.value = editor.cols;
    els.editorDiscards.value = editor.totalDiscards;
    renderLevelPicker();
    renderPalette();
    renderEditorGrid();
    renderWeights();
    renderStartList();
  }

  els.editorCampaignName.addEventListener("input", () => {
    editorCampaign.campaign_name = els.editorCampaignName.value;
  });
  els.editorCampaignProgression.addEventListener("change", () => {
    editorCampaign.progression_only = els.editorCampaignProgression.checked;
  });
  els.editorName.addEventListener("input", () => {
    editor.name = els.editorName.value;
    renderLevelPicker();
  });
  els.editorDiscards.addEventListener("input", () => {
    editor.totalDiscards = Math.max(0, parseInt(els.editorDiscards.value, 10) || 0);
  });

  els.editorResize.addEventListener("click", () => {
    if (!confirm("Resize to a fresh grid? This clears all walls, terminals, and pieces you've painted.")) return;
    const newRows = Math.min(20, Math.max(3, parseInt(els.editorRows.value, 10) || editor.rows));
    const newCols = Math.min(20, Math.max(3, parseInt(els.editorCols.value, 10) || editor.cols));
    editor.rows = newRows;
    editor.cols = newCols;
    editor.grid = blankGrid(newRows, newCols);
    els.editorRows.value = newRows;
    els.editorCols.value = newCols;
    renderEditorGrid();
  });

  els.editorAddLevel.addEventListener("click", () => {
    syncEditorIntoCampaign();
    editorCampaign.levels.push(freshLevelRaw());
    switchEditorLevel(editorCampaign.levels.length - 1);
  });

  els.editorRemoveLevel.addEventListener("click", () => {
    if (editorCampaign.levels.length <= 1) {
      alert("A campaign needs at least one level.");
      return;
    }
    if (!confirm(`Remove level ${editorLevelIndex + 1} ("${editor.name}") from this campaign?`)) return;
    editorCampaign.levels.splice(editorLevelIndex, 1);
    editorLevelIndex = Math.min(editorLevelIndex, editorCampaign.levels.length - 1);
    editor = rawToWorking(editorCampaign.levels[editorLevelIndex]);
    loadEditorIntoForm();
  });

  els.editorNew.addEventListener("click", () => {
    if (!confirm("Start a new campaign? Unsaved changes to the current one will be lost.")) return;
    editorCampaign = freshCampaign();
    editorLevelIndex = 0;
    editor = rawToWorking(editorCampaign.levels[0]);
    loadEditorIntoForm();
  });

  function loadCampaignIntoEditor(camp) {
    const levels = camp.levels && camp.levels.length ? camp.levels : [freshLevelRaw()];
    editorCampaign = {
      id: camp.id || null,
      campaign_name: camp.campaign_name || "Untitled Campaign",
      progression_only: !!camp.progression_only,
      levels: levels.map((l) => normalizeRawLevel(l, "Untitled Level")),
    };
    editorLevelIndex = 0;
    editor = rawToWorking(editorCampaign.levels[0]);
    loadEditorIntoForm();
  }

  function refreshEditorLoadOptions() {
    els.editorLoadSelect.innerHTML = `<option value="">— Load a saved campaign —</option>` +
      campaigns.map((c) => `<option value="${c.id}">${escapeHtml(c.campaign_name)}</option>`).join("");
  }

  els.editorLoadSelect.addEventListener("change", () => {
    const id = els.editorLoadSelect.value;
    if (!id) return;
    const camp = campaigns.find((c) => c.id === id);
    if (camp) loadCampaignIntoEditor(camp);
  });

  els.editorSave.addEventListener("click", () => {
    syncEditorIntoCampaign();
    if (!editorCampaign.campaign_name.trim()) {
      alert("Give this campaign a name before saving.");
      return;
    }
    for (const raw of editorCampaign.levels) {
      const level = buildLevel(raw);
      if (!levelIsValid(level)) {
        alert(`Level "${level.name}" doesn't have both a source and a drain placed. Fix it before saving the campaign.`);
        return;
      }
    }
    const existingIdx = campaigns.findIndex((c) => c.id && c.id === editorCampaign.id);
    const toSave = JSON.parse(JSON.stringify(editorCampaign));
    if (existingIdx >= 0) {
      campaigns[existingIdx] = toSave;
    } else {
      editorCampaign.id = genId("camp");
      toSave.id = editorCampaign.id;
      campaigns.push(toSave);
    }
    saveCampaigns(campaigns);
    refreshEditorLoadOptions();
    activeCampaignId = editorCampaign.id;
    saveActiveCampaignId(activeCampaignId);
    renderLevelSelect();
    alert(`Saved campaign "${editorCampaign.campaign_name}" (${editorCampaign.levels.length} level${editorCampaign.levels.length === 1 ? "" : "s"}).`);
  });

  els.editorDelete.addEventListener("click", () => {
    if (!editorCampaign.id) {
      alert("This campaign hasn't been saved yet.");
      return;
    }
    if (!confirm(`Delete campaign "${editorCampaign.campaign_name}" and all its levels? This can't be undone.`)) return;
    campaigns = campaigns.filter((c) => c.id !== editorCampaign.id);
    saveCampaigns(campaigns);
    clearCompletionForCampaign(editorCampaign.id);
    if (activeCampaignId === editorCampaign.id) {
      activeCampaignId = campaigns.length ? campaigns[0].id : null;
      saveActiveCampaignId(activeCampaignId);
    }
    refreshEditorLoadOptions();
    renderLevelSelect();
    editorCampaign = freshCampaign();
    editorLevelIndex = 0;
    editor = rawToWorking(editorCampaign.levels[0]);
    loadEditorIntoForm();
  });

  els.editorTest.addEventListener("click", () => {
    const raw = workingToRaw(editor);
    const level = buildLevel(raw);
    if (!levelIsValid(level)) {
      alert("This level doesn't have both a source and a drain placed yet. Add one of each before test playing.");
      return;
    }
    currentPlaylist = { levels: [raw], isDefault: false, levelNumberOverride: editorLevelIndex + 1 };
    els.tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === "play"));
    Object.values(els.panes).forEach((p) => p.classList.remove("active"));
    els.panes.play.classList.add("active");
    startLevel(0);
  });

  els.editorExport.addEventListener("click", () => {
    syncEditorIntoCampaign();
    const exportObj = {
      campaign_name: editorCampaign.campaign_name || "Untitled Campaign",
      progression_only: !!editorCampaign.progression_only,
      levels: {},
    };
    editorCampaign.levels.forEach((raw, i) => {
      const entry = {
        mapName: raw.name,
        map: raw.map,
        pipes: raw.pipes,
        totalDiscards: raw.totalDiscards,
      };
      if (raw.startingPipes && raw.startingPipes.length) entry.startingPipes = raw.startingPipes;
      exportObj.levels[String(i + 1)] = entry;
    });
    const json = JSON.stringify(exportObj, null, 2);
    els.editorJsonOut.value = json;
    els.editorJsonOut.classList.remove("pp-hidden");
    els.editorJsonOut.select();

    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (exportObj.campaign_name || "campaign").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "campaign";
      a.download = `pipe-patcher-${safeName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      /* download unsupported, the textarea above still has the JSON to copy */
    }
  });

  // Init
  populateStartSelect();
  refreshEditorLoadOptions();
  loadEditorIntoForm();
  renderLevelSelect();
})();