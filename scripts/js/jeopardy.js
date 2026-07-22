(function () {
  "use strict";

  const VALUES = [200, 400, 600, 800, 1000];
  const MAX_CLUE_VALUE = VALUES[VALUES.length - 1];
  const MIN_CATEGORIES = 3;
  const MAX_CATEGORIES = 6;
  const GAMES_KEY = "jeopardy-games";

  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = String(text == null ? "" : text);
    return div.innerHTML;
  };

  const formatMoney = (n) => (n < 0 ? "-$" + Math.abs(n) : "$" + n);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const genId = (prefix) => prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);

  // Game construction & validation
  function buildGame(raw) {
    raw = raw || {};
    const rawCats = Array.isArray(raw.categories) ? raw.categories : [];
    const categories = rawCats.slice(0, MAX_CATEGORIES).map((cat, ci) => {
      cat = cat || {};
      const rawClues = Array.isArray(cat.clues) ? cat.clues : [];
      return {
        name: cat.name || `Category ${ci + 1}`,
        clues: VALUES.map((v, i) => {
          const c = rawClues[i] || {};
          return {
            value: v,
            question: c.question || "",
            answer: c.answer || "",
            daily_double: !!c.daily_double,
          };
        }),
      };
    });
    const fj = raw.final_jeopardy || {};
    return {
      id: raw.id || null,
      game_name: raw.game_name || raw.name || "Untitled Game",
      daily_doubles_enabled: raw.daily_doubles_enabled !== false,
      categories,
      final_jeopardy: {
        category: fj.category || "",
        question: fj.question || "",
        answer: fj.answer || "",
      },
    };
  }

  function freshGame() {
    return buildGame({
      game_name: "New Game",
      daily_doubles_enabled: true,
      categories: [1, 2, 3].map((n) => ({ name: `Category ${n}`, clues: VALUES.map((v) => ({ value: v, question: "", answer: "", daily_double: false })) })),
      final_jeopardy: { category: "", question: "", answer: "" },
    });
  }

  function gameIsPlayable(game) {
    return game.categories.length >= MIN_CATEGORIES;
  }

  // Storage
  function loadGames() {
    try {
      const raw = window.localStorage.getItem(GAMES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveGames(list) {
    try {
      window.localStorage.setItem(GAMES_KEY, JSON.stringify(list));
    } catch (e) {
      /* storage unavailable, silently skip persistence */
    }
  }

  function parseImportedGame(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { game: null, errors: ["That's not valid JSON: " + e.message] };
    }
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.categories) || !parsed.categories.length) {
      return { game: null, errors: ['Unrecognized JSON shape: expected a game with a "categories" array.'] };
    }
    const game = buildGame(parsed);
    if (!gameIsPlayable(game)) {
      return { game: null, errors: [`A game needs at least ${MIN_CATEGORIES} categories: found ${game.categories.length}.`] };
    }
    return { game, errors: [] };
  }

  // DOM references
  const els = {
    tabs: document.querySelectorAll(".jp-tab"),
    panes: {
      play: document.getElementById("jp-pane-play"),
      editor: document.getElementById("jp-pane-editor"),
    },

    screens: {
      select: document.getElementById("jp-select"),
      setup: document.getElementById("jp-setup"),
      board: document.getElementById("jp-board-screen"),
      final: document.getElementById("jp-final-screen"),
      results: document.getElementById("jp-results-screen"),
    },

    defaultGameGrid: document.getElementById("jp-default-game"),
    customGamesGrid: document.getElementById("jp-custom-games"),
    customEmpty: document.getElementById("jp-custom-empty"),
    importBtn: document.getElementById("jp-import-btn"),

    setupBack: document.getElementById("jp-setup-back"),
    setupTitle: document.getElementById("jp-setup-title"),
    teamCountWrap: document.getElementById("jp-team-count"),
    teamNamesWrap: document.getElementById("jp-team-names"),
    setupDD: document.getElementById("jp-setup-dd"),
    setupStart: document.getElementById("jp-setup-start"),

    scoreboard: document.getElementById("jp-scoreboard"),
    board: document.getElementById("jp-board"),
    quitBtn: document.getElementById("jp-quit-btn"),
    gotoFinalBtn: document.getElementById("jp-goto-final-btn"),

    finalCategory: document.getElementById("jp-final-category"),
    finalWagerPhase: document.getElementById("jp-final-wager-phase"),
    finalWagerList: document.getElementById("jp-final-wager-list"),
    finalLockWagers: document.getElementById("jp-final-lock-wagers"),
    finalQuestionPhase: document.getElementById("jp-final-question-phase"),
    finalQuestion: document.getElementById("jp-final-question"),
    finalRevealAnswer: document.getElementById("jp-final-reveal-answer"),
    finalAnswerPhase: document.getElementById("jp-final-answer-phase"),
    finalAnswer: document.getElementById("jp-final-answer"),
    finalGradeList: document.getElementById("jp-final-grade-list"),
    finalShowResults: document.getElementById("jp-final-show-results"),

    resultsList: document.getElementById("jp-results-list"),
    resultsReplay: document.getElementById("jp-results-replay"),
    resultsBack: document.getElementById("jp-results-back"),

    clueModal: document.getElementById("jp-clue-modal"),
    clueMeta: document.getElementById("jp-clue-meta"),
    clueWagerPhase: document.getElementById("jp-clue-wager-phase"),
    clueWagerTeam: document.getElementById("jp-clue-wager-team"),
    clueWagerRange: document.getElementById("jp-clue-wager-range"),
    clueWagerInput: document.getElementById("jp-clue-wager-input"),
    clueWagerSubmit: document.getElementById("jp-clue-wager-submit"),
    clueQuestionPhase: document.getElementById("jp-clue-question-phase"),
    clueQuestion: document.getElementById("jp-clue-question"),
    clueReveal: document.getElementById("jp-clue-reveal"),
    clueAnswerPhase: document.getElementById("jp-clue-answer-phase"),
    clueAnswerText: document.getElementById("jp-clue-answer-text"),
    clueTeamButtons: document.getElementById("jp-clue-team-buttons"),
    clueClose: document.getElementById("jp-clue-close"),

    importModal: document.getElementById("jp-import-modal"),
    importText: document.getElementById("jp-import-text"),
    importFile: document.getElementById("jp-import-file"),
    importSubmit: document.getElementById("jp-import-submit"),
    importCancel: document.getElementById("jp-import-cancel"),
    importErrors: document.getElementById("jp-import-errors"),

    // Editor
    edGameName: document.getElementById("jp-ed-game-name"),
    edDDEnabled: document.getElementById("jp-ed-dd-enabled"),
    edCatSelect: document.getElementById("jp-ed-cat-select"),
    edAddCat: document.getElementById("jp-ed-add-cat"),
    edRemoveCat: document.getElementById("jp-ed-remove-cat"),
    edCatName: document.getElementById("jp-ed-cat-name"),
    edClues: document.getElementById("jp-ed-clues"),
    edFjCategory: document.getElementById("jp-ed-fj-category"),
    edFjQuestion: document.getElementById("jp-ed-fj-question"),
    edFjAnswer: document.getElementById("jp-ed-fj-answer"),
    edNew: document.getElementById("jp-ed-new"),
    edImport: document.getElementById("jp-ed-import"),
    edLoadSelect: document.getElementById("jp-ed-load-select"),
    edSave: document.getElementById("jp-ed-save"),
    edDelete: document.getElementById("jp-ed-delete"),
    edTest: document.getElementById("jp-ed-test"),
    edExport: document.getElementById("jp-ed-export"),
    edJsonOut: document.getElementById("jp-ed-json-out"),
  };

  // App state
  let games = loadGames();
  let pendingGame = null; // game object mid-setup (before session starts)
  let setupTeamCount = 2;
  let setupTeamNames = ["Team 1", "Team 2"];
  let session = null;

  function showScreen(name) {
    Object.keys(els.screens).forEach((k) => {
      els.screens[k].classList.toggle("jp-hidden", k !== name);
    });
  }

  // Tabs
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      els.tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      Object.values(els.panes).forEach((p) => p.classList.remove("active"));
      els.panes[tab.dataset.tab].classList.add("active");
    });
  });

  // Game select screen
  function renderGameSelect() {
    els.defaultGameGrid.innerHTML = "";
    const defaultGame = buildGame(window.JEOPARDY_DEFAULT_GAME || {});
    const tile = document.createElement("div");
    tile.className = "jp-game-tile";
    const tileBtn = document.createElement("button");
    tileBtn.type = "button";
    tileBtn.className = "jp-game-tile-main";
    tileBtn.innerHTML = `<span class="jp-game-tile-name">${escapeHtml(defaultGame.game_name)}</span><span class="jp-game-tile-meta">${defaultGame.categories.length} categories</span>`;
    tileBtn.addEventListener("click", () => startSetupForGame(defaultGame));
    tile.appendChild(tileBtn);
    els.defaultGameGrid.appendChild(tile);

    els.customGamesGrid.innerHTML = "";
    els.customEmpty.classList.toggle("jp-hidden", games.length > 0);
    games.forEach((raw) => {
      const game = buildGame(raw);
      const row = document.createElement("div");
      row.className = "jp-game-tile jp-game-tile--custom";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "jp-game-tile-main";
      btn.innerHTML = `<span class="jp-game-tile-name">${escapeHtml(game.game_name)}</span><span class="jp-game-tile-meta">${game.categories.length} categories</span>`;
      btn.addEventListener("click", () => startSetupForGame(game));
      const del = document.createElement("button");
      del.type = "button";
      del.className = "jp-link-btn jp-game-tile-delete";
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        if (!confirm(`Delete game "${game.game_name}"? This can't be undone.`)) return;
        games = games.filter((g) => g.id !== game.id);
        saveGames(games);
        refreshEditorLoadOptions();
        renderGameSelect();
      });
      row.appendChild(btn);
      row.appendChild(del);
      els.customGamesGrid.appendChild(row);
    });
  }

  // Setup screen
  function startSetupForGame(game) {
    pendingGame = game;
    els.setupTitle.textContent = game.game_name;
    els.setupDD.checked = !!game.daily_doubles_enabled;
    renderTeamCountButtons();
    renderTeamNameInputs();
    showScreen("setup");
  }

  function renderTeamCountButtons() {
    els.teamCountWrap.innerHTML = "";
    [2, 3, 4].forEach((n) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "jp-count-btn" + (setupTeamCount === n ? " active" : "");
      btn.textContent = n + " Teams";
      btn.addEventListener("click", () => {
        setupTeamCount = n;
        while (setupTeamNames.length < n) setupTeamNames.push(`Team ${setupTeamNames.length + 1}`);
        renderTeamCountButtons();
        renderTeamNameInputs();
      });
      els.teamCountWrap.appendChild(btn);
    });
  }

  function renderTeamNameInputs() {
    els.teamNamesWrap.innerHTML = "";
    for (let i = 0; i < setupTeamCount; i++) {
      const label = document.createElement("label");
      label.textContent = `Team ${i + 1} name`;
      const input = document.createElement("input");
      input.type = "text";
      input.value = setupTeamNames[i] || `Team ${i + 1}`;
      input.addEventListener("input", () => {
        setupTeamNames[i] = input.value;
      });
      label.appendChild(input);
      els.teamNamesWrap.appendChild(label);
    }
  }

  els.setupBack.addEventListener("click", () => {
    pendingGame = null;
    showScreen("select");
    renderGameSelect();
  });

  els.setupStart.addEventListener("click", () => {
    const teams = [];
    for (let i = 0; i < setupTeamCount; i++) {
      const name = (setupTeamNames[i] || "").trim() || `Team ${i + 1}`;
      teams.push({ name, score: 0 });
    }
    session = {
      game: pendingGame,
      dailyDoublesEnabled: els.setupDD.checked,
      teams,
      control: 0,
      used: new Set(),
      cluesTotal: pendingGame.categories.length * VALUES.length,
      cluesUsed: 0,
      currentClue: null,
      final: null,
    };
    showScreen("board");
    renderScoreboard();
    renderBoard();
  });

  // Board screen
  function renderScoreboard() {
    els.scoreboard.innerHTML = session.teams
      .map(
        (t, i) =>
          `<div class="jp-team${i === session.control ? " jp-team--control" : ""}">
            <span class="jp-team-name">${escapeHtml(t.name)}</span>
            <span class="jp-team-score${t.score < 0 ? " jp-team-score--negative" : ""}">${formatMoney(t.score)}</span>
          </div>`
      )
      .join("");
  }

  function renderBoard() {
    const cats = session.game.categories;
    els.board.style.setProperty("--jp-cols", cats.length);
    let html = cats.map((c) => `<div class="jp-board-cat">${escapeHtml(c.name)}</div>`).join("");
    for (let vi = 0; vi < VALUES.length; vi++) {
      cats.forEach((cat, ci) => {
        const key = ci + ":" + vi;
        const used = session.used.has(key);
        if (used) {
          html += `<div class="jp-board-cell jp-board-cell--used"></div>`;
        } else {
          html += `<button type="button" class="jp-board-cell" data-cat="${ci}" data-clue="${vi}">$${VALUES[vi]}</button>`;
        }
      });
    }
    els.board.innerHTML = html;
    els.gotoFinalBtn.classList.remove("jp-hidden");
    els.gotoFinalBtn.textContent = session.cluesUsed >= session.cluesTotal ? "Continue to Final Jeopardy →" : "Skip to Final Jeopardy →";
  }

  els.board.addEventListener("click", (e) => {
    const cell = e.target.closest(".jp-board-cell:not(.jp-board-cell--used)");
    if (!cell || !session) return;
    openClue(parseInt(cell.dataset.cat, 10), parseInt(cell.dataset.clue, 10));
  });

  els.quitBtn.addEventListener("click", () => {
    if (!confirm("Abandon this game and return to the game list? Scores will be lost.")) return;
    session = null;
    showScreen("select");
    renderGameSelect();
  });

  els.gotoFinalBtn.addEventListener("click", () => {
    initFinalJeopardy();
  });

  // Clue modal
  function openClue(catIdx, clueIdx) {
    const cat = session.game.categories[catIdx];
    const clue = cat.clues[clueIdx];
    const isDailyDouble = !!clue.daily_double && session.dailyDoublesEnabled;
    session.currentClue = {
      catIdx,
      clueIdx,
      value: clue.value,
      question: clue.question,
      answer: clue.answer,
      daily_double: isDailyDouble,
      wager: clue.value,
    };
    els.clueMeta.textContent = `${cat.name} — ${isDailyDouble ? "Daily Double" : "$" + clue.value}`;

    if (isDailyDouble) {
      const team = session.teams[session.control];
      const maxWager = Math.max(team.score, MAX_CLUE_VALUE);
      els.clueWagerTeam.textContent = `${team.name}'s wager:`;
      els.clueWagerRange.textContent = `$5 – $${maxWager}`;
      els.clueWagerInput.min = "5";
      els.clueWagerInput.max = String(maxWager);
      els.clueWagerInput.value = String(Math.min(clue.value, maxWager));
      setCluePhase("wager");
    } else {
      els.clueQuestion.textContent = clue.question;
      setCluePhase("question");
    }
    els.clueModal.classList.remove("jp-hidden");
  }

  function setCluePhase(phase) {
    els.clueWagerPhase.classList.toggle("jp-hidden", phase !== "wager");
    els.clueQuestionPhase.classList.toggle("jp-hidden", phase !== "question");
    els.clueAnswerPhase.classList.toggle("jp-hidden", phase !== "answer");
  }

  els.clueWagerSubmit.addEventListener("click", () => {
    const team = session.teams[session.control];
    const maxWager = Math.max(team.score, MAX_CLUE_VALUE);
    const wager = clamp(parseInt(els.clueWagerInput.value, 10) || 0, 5, maxWager);
    session.currentClue.wager = wager;
    els.clueQuestion.textContent = session.currentClue.question;
    setCluePhase("question");
  });

  els.clueReveal.addEventListener("click", () => {
    const clue = session.currentClue;
    els.clueAnswerText.textContent = clue.answer;
    renderClueTeamButtons();
    setCluePhase("answer");
  });

  function renderClueTeamButtons() {
    const clue = session.currentClue;
    els.clueTeamButtons.innerHTML = "";
    if (clue.daily_double) {
      const idx = session.control;
      const team = session.teams[idx];
      els.clueTeamButtons.appendChild(
        makeClueTeamButton(`${team.name}: Correct (+${formatMoney(clue.wager)})`, "jp-correct", () => {
          team.score += clue.wager;
          finishClue(idx, true);
        })
      );
      els.clueTeamButtons.appendChild(
        makeClueTeamButton(`${team.name}: Incorrect (${formatMoney(-clue.wager)})`, "jp-incorrect", () => {
          team.score -= clue.wager;
          finishClue(idx, false);
        })
      );
      return;
    }
    session.teams.forEach((team, idx) => {
      const row = document.createElement("div");
      row.className = "jp-clue-team-row";
      row.innerHTML = `<span>${escapeHtml(team.name)}</span>`;
      const correct = makeClueTeamButton(`+${formatMoney(clue.value)}`, "jp-correct", () => {
        team.score += clue.value;
        finishClue(idx, true);
      });
      const incorrect = makeClueTeamButton(formatMoney(-clue.value), "jp-incorrect", () => {
        team.score -= clue.value;
        renderScoreboard();
        renderClueTeamButtons();
      });
      row.appendChild(correct);
      row.appendChild(incorrect);
      els.clueTeamButtons.appendChild(row);
    });
  }

  function makeClueTeamButton(label, cls, handler) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "jp-clue-team-btn " + cls;
    btn.textContent = label;
    btn.addEventListener("click", handler);
    return btn;
  }

  function finishClue(controlIdx, gotItRight) {
    if (gotItRight) session.control = controlIdx;
    closeClue();
  }

  function closeClue() {
    const clue = session.currentClue;
    if (clue) {
      const key = clue.catIdx + ":" + clue.clueIdx;
      if (!session.used.has(key)) session.cluesUsed++;
      session.used.add(key);
    }
    session.currentClue = null;
    els.clueModal.classList.add("jp-hidden");
    renderScoreboard();
    renderBoard();
  }

  els.clueClose.addEventListener("click", closeClue);

  // Final Jeopardy
  function initFinalJeopardy() {
    session.final = {
      wagers: session.teams.map(() => 0),
      graded: new Set(),
    };
    els.finalCategory.textContent = session.game.final_jeopardy.category || "(no category set)";
    renderFinalWagerList();
    els.finalWagerPhase.classList.remove("jp-hidden");
    els.finalQuestionPhase.classList.add("jp-hidden");
    els.finalAnswerPhase.classList.add("jp-hidden");
    showScreen("final");
  }

  function renderFinalWagerList() {
    els.finalWagerList.innerHTML = "";
    session.teams.forEach((team, idx) => {
      const maxWager = Math.max(0, team.score);
      const row = document.createElement("label");
      row.className = "jp-final-wager-row";
      row.innerHTML = `<span>${escapeHtml(team.name)} (${formatMoney(team.score)}, max ${formatMoney(maxWager)})</span>`;
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = String(maxWager);
      input.value = "0";
      input.addEventListener("input", () => {
        session.final.wagers[idx] = clamp(parseInt(input.value, 10) || 0, 0, maxWager);
      });
      row.appendChild(input);
      els.finalWagerList.appendChild(row);
    });
  }

  els.finalLockWagers.addEventListener("click", () => {
    els.finalWagerPhase.classList.add("jp-hidden");
    els.finalQuestion.textContent = session.game.final_jeopardy.question || "(no clue set)";
    els.finalQuestionPhase.classList.remove("jp-hidden");
  });

  els.finalRevealAnswer.addEventListener("click", () => {
    els.finalQuestionPhase.classList.add("jp-hidden");
    els.finalAnswer.textContent = session.game.final_jeopardy.answer || "(no answer set)";
    renderFinalGradeList();
    els.finalAnswerPhase.classList.remove("jp-hidden");
  });

  function renderFinalGradeList() {
    els.finalGradeList.innerHTML = "";
    session.teams.forEach((team, idx) => {
      const wager = session.final.wagers[idx] || 0;
      const row = document.createElement("div");
      row.className = "jp-final-grade-row";
      const graded = session.final.graded.has(idx);
      row.innerHTML = `<span>${escapeHtml(team.name)} — wagered ${formatMoney(wager)}</span>`;
      const correct = document.createElement("button");
      correct.type = "button";
      correct.className = "jp-clue-team-btn jp-correct";
      correct.textContent = "Correct";
      correct.disabled = graded;
      correct.addEventListener("click", () => {
        team.score += wager;
        session.final.graded.add(idx);
        renderFinalGradeList();
        updateFinalResultsButton();
      });
      const incorrect = document.createElement("button");
      incorrect.type = "button";
      incorrect.className = "jp-clue-team-btn jp-incorrect";
      incorrect.textContent = "Incorrect";
      incorrect.disabled = graded;
      incorrect.addEventListener("click", () => {
        team.score -= wager;
        session.final.graded.add(idx);
        renderFinalGradeList();
        updateFinalResultsButton();
      });
      row.appendChild(correct);
      row.appendChild(incorrect);
      els.finalGradeList.appendChild(row);
    });
    updateFinalResultsButton();
  }

  function updateFinalResultsButton() {
    els.finalShowResults.disabled = session.final.graded.size < session.teams.length;
  }

  els.finalShowResults.addEventListener("click", () => {
    renderResults();
    showScreen("results");
  });

  function renderResults() {
    const ranked = session.teams.slice().sort((a, b) => b.score - a.score);
    const topScore = ranked.length ? ranked[0].score : 0;
    els.resultsList.innerHTML = ranked
      .map(
        (t, i) =>
          `<div class="jp-result-row${t.score === topScore ? " jp-result-row--winner" : ""}">
            <span class="jp-result-rank">${i + 1}.</span>
            <span class="jp-result-name">${escapeHtml(t.name)}${t.score === topScore ? " 🏆" : ""}</span>
            <span class="jp-result-score${t.score < 0 ? " jp-team-score--negative" : ""}">${formatMoney(t.score)}</span>
          </div>`
      )
      .join("");
  }

  els.resultsReplay.addEventListener("click", () => {
    const game = session.game;
    session = null;
    startSetupForGame(game);
  });

  els.resultsBack.addEventListener("click", () => {
    session = null;
    showScreen("select");
    renderGameSelect();
  });

  // Import modal (shared by Play + Editor)
  let importTarget = "play";

  function openImportModal(target) {
    importTarget = target;
    els.importText.value = "";
    els.importErrors.innerHTML = "";
    if (els.importFile) els.importFile.value = "";
    els.importModal.classList.remove("jp-hidden");
  }
  function closeImportModal() {
    els.importModal.classList.add("jp-hidden");
  }

  els.importBtn.addEventListener("click", () => openImportModal("play"));
  els.importCancel.addEventListener("click", closeImportModal);
  els.edImport.addEventListener("click", () => openImportModal("editor"));

  els.importFile.addEventListener("change", () => {
    const file = els.importFile.files && els.importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      els.importText.value = String(reader.result || "");
    };
    reader.readAsText(file);
  });

  els.importSubmit.addEventListener("click", () => {
    const { game, errors } = parseImportedGame(els.importText.value.trim());
    els.importErrors.innerHTML = errors.map((e) => `<p>${escapeHtml(e)}</p>`).join("");
    if (!game) return;

    if (importTarget === "editor") {
      loadGameIntoEditor(game);
      closeImportModal();
      return;
    }

    game.id = genId("game");
    games.push(game);
    saveGames(games);
    renderGameSelect();
    refreshEditorLoadOptions();
    closeImportModal();
  });

  // Game Builder (editor)
  let editorGame = freshGame();
  let editorCatIndex = 0;

  function renderCatSelect() {
    els.edCatSelect.innerHTML = editorGame.categories
      .map((c, i) => `<option value="${i}">${i + 1}. ${escapeHtml(c.name)}</option>`)
      .join("");
    els.edCatSelect.value = String(editorCatIndex);
  }

  function renderClueEditorList() {
    const cat = editorGame.categories[editorCatIndex];
    els.edClues.innerHTML = "";
    cat.clues.forEach((clue, i) => {
      const row = document.createElement("div");
      row.className = "jp-clue-editor-row";

      const valueLabel = document.createElement("span");
      valueLabel.className = "jp-clue-editor-value";
      valueLabel.textContent = "$" + clue.value;

      const qLabel = document.createElement("label");
      qLabel.className = "jp-clue-editor-field";
      qLabel.textContent = "Clue";
      const qInput = document.createElement("textarea");
      qInput.rows = 2;
      qInput.value = clue.question;
      qInput.addEventListener("input", () => {
        clue.question = qInput.value;
      });
      qLabel.appendChild(qInput);

      const aLabel = document.createElement("label");
      aLabel.className = "jp-clue-editor-field";
      aLabel.textContent = "Response";
      const aInput = document.createElement("input");
      aInput.type = "text";
      aInput.value = clue.answer;
      aInput.addEventListener("input", () => {
        clue.answer = aInput.value;
      });
      aLabel.appendChild(aInput);

      const ddLabel = document.createElement("label");
      ddLabel.className = "jp-checkbox-row jp-clue-editor-dd";
      const ddInput = document.createElement("input");
      ddInput.type = "checkbox";
      ddInput.checked = !!clue.daily_double;
      ddInput.addEventListener("change", () => {
        clue.daily_double = ddInput.checked;
      });
      ddLabel.appendChild(ddInput);
      ddLabel.appendChild(document.createTextNode("Daily Double"));

      row.appendChild(valueLabel);
      row.appendChild(qLabel);
      row.appendChild(aLabel);
      row.appendChild(ddLabel);
      els.edClues.appendChild(row);
    });
  }

  function loadEditorIntoForm() {
    els.edGameName.value = editorGame.game_name;
    els.edDDEnabled.checked = !!editorGame.daily_doubles_enabled;
    els.edCatName.value = editorGame.categories[editorCatIndex].name;
    els.edFjCategory.value = editorGame.final_jeopardy.category;
    els.edFjQuestion.value = editorGame.final_jeopardy.question;
    els.edFjAnswer.value = editorGame.final_jeopardy.answer;
    renderCatSelect();
    renderClueEditorList();
  }

  els.edGameName.addEventListener("input", () => {
    editorGame.game_name = els.edGameName.value;
  });
  els.edDDEnabled.addEventListener("change", () => {
    editorGame.daily_doubles_enabled = els.edDDEnabled.checked;
  });
  els.edCatName.addEventListener("input", () => {
    editorGame.categories[editorCatIndex].name = els.edCatName.value;
    renderCatSelect();
  });
  els.edFjCategory.addEventListener("input", () => {
    editorGame.final_jeopardy.category = els.edFjCategory.value;
  });
  els.edFjQuestion.addEventListener("input", () => {
    editorGame.final_jeopardy.question = els.edFjQuestion.value;
  });
  els.edFjAnswer.addEventListener("input", () => {
    editorGame.final_jeopardy.answer = els.edFjAnswer.value;
  });

  els.edCatSelect.addEventListener("change", () => {
    editorCatIndex = parseInt(els.edCatSelect.value, 10) || 0;
    els.edCatName.value = editorGame.categories[editorCatIndex].name;
    renderClueEditorList();
  });

  els.edAddCat.addEventListener("click", () => {
    if (editorGame.categories.length >= MAX_CATEGORIES) {
      alert(`A game can have at most ${MAX_CATEGORIES} categories.`);
      return;
    }
    editorGame.categories.push({
      name: `Category ${editorGame.categories.length + 1}`,
      clues: VALUES.map((v) => ({ value: v, question: "", answer: "", daily_double: false })),
    });
    editorCatIndex = editorGame.categories.length - 1;
    loadEditorIntoForm();
  });

  els.edRemoveCat.addEventListener("click", () => {
    if (editorGame.categories.length <= MIN_CATEGORIES) {
      alert(`A game needs at least ${MIN_CATEGORIES} categories.`);
      return;
    }
    if (!confirm(`Remove category "${editorGame.categories[editorCatIndex].name}"?`)) return;
    editorGame.categories.splice(editorCatIndex, 1);
    editorCatIndex = Math.min(editorCatIndex, editorGame.categories.length - 1);
    loadEditorIntoForm();
  });

  els.edNew.addEventListener("click", () => {
    if (!confirm("Start a new game? Unsaved changes to the current one will be lost.")) return;
    editorGame = freshGame();
    editorCatIndex = 0;
    loadEditorIntoForm();
  });

  function loadGameIntoEditor(game) {
    editorGame = buildGame(game);
    if (editorGame.categories.length < MIN_CATEGORIES) {
      while (editorGame.categories.length < MIN_CATEGORIES) {
        editorGame.categories.push({
          name: `Category ${editorGame.categories.length + 1}`,
          clues: VALUES.map((v) => ({ value: v, question: "", answer: "", daily_double: false })),
        });
      }
    }
    editorCatIndex = 0;
    loadEditorIntoForm();
  }

  function refreshEditorLoadOptions() {
    els.edLoadSelect.innerHTML =
      `<option value="">— Load a saved game —</option>` +
      games.map((g) => `<option value="${g.id}">${escapeHtml(g.game_name)}</option>`).join("");
  }

  els.edLoadSelect.addEventListener("change", () => {
    const id = els.edLoadSelect.value;
    if (!id) return;
    const game = games.find((g) => g.id === id);
    if (game) loadGameIntoEditor(game);
  });

  els.edSave.addEventListener("click", () => {
    if (!editorGame.game_name.trim()) {
      alert("Give this game a name before saving.");
      return;
    }
    const existingIdx = games.findIndex((g) => g.id && g.id === editorGame.id);
    const toSave = JSON.parse(JSON.stringify(editorGame));
    if (existingIdx >= 0) {
      games[existingIdx] = toSave;
    } else {
      editorGame.id = genId("game");
      toSave.id = editorGame.id;
      games.push(toSave);
    }
    saveGames(games);
    refreshEditorLoadOptions();
    renderGameSelect();
    alert(`Saved game "${editorGame.game_name}" (${editorGame.categories.length} categories).`);
  });

  els.edDelete.addEventListener("click", () => {
    if (!editorGame.id) {
      alert("This game hasn't been saved yet.");
      return;
    }
    if (!confirm(`Delete game "${editorGame.game_name}"? This can't be undone.`)) return;
    games = games.filter((g) => g.id !== editorGame.id);
    saveGames(games);
    refreshEditorLoadOptions();
    renderGameSelect();
    editorGame = freshGame();
    editorCatIndex = 0;
    loadEditorIntoForm();
  });

  els.edTest.addEventListener("click", () => {
    const clone = buildGame(JSON.parse(JSON.stringify(editorGame)));
    if (!clone.game_name.trim()) {
      alert("Give this game a name before test playing.");
      return;
    }
    els.tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === "play"));
    Object.values(els.panes).forEach((p) => p.classList.remove("active"));
    els.panes.play.classList.add("active");
    startSetupForGame(clone);
  });

  els.edExport.addEventListener("click", () => {
    const exportObj = {
      game_name: editorGame.game_name || "Untitled Game",
      daily_doubles_enabled: !!editorGame.daily_doubles_enabled,
      categories: editorGame.categories.map((c) => ({
        name: c.name,
        clues: c.clues.map((cl) => ({ value: cl.value, question: cl.question, answer: cl.answer, daily_double: !!cl.daily_double })),
      })),
      final_jeopardy: {
        category: editorGame.final_jeopardy.category,
        question: editorGame.final_jeopardy.question,
        answer: editorGame.final_jeopardy.answer,
      },
    };
    const json = JSON.stringify(exportObj, null, 2);
    els.edJsonOut.value = json;
    els.edJsonOut.classList.remove("jp-hidden");
    els.edJsonOut.select();

    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (exportObj.game_name || "game").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "game";
      a.download = `jeopardy-${safeName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      /* download unsupported, the textarea above still has the JSON to copy */
    }
  });

  // Init
  refreshEditorLoadOptions();
  loadEditorIntoForm();
  renderGameSelect();
})();
