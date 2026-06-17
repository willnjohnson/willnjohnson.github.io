(function () {
  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 12;
  const CATEGORIES = [
    "Animal",
    "Actor",
    "Planet",
    "Country",
    "Food",
    "Sports",
    "Movie",
    "Book",
    "Color",
    "Plant",
    "Instrument",
    "Occupation",
    "Vehicle",
    "City",
    "Brand",
    "Holiday",
    "Weather",
    "Emotion",
    "Tool",
    "Politician",
    "Body Part",
    "Artist",
    "Scientist",
    "Fast Food Chain",
    "Dessert",
    "Fruit",
    "Vegetable",
    "Farm Animal",
    "Kitchen Utensil",
    "Flower",
    "Anime Character",
    "Cartoon Character",
    "Video Game Character"

  ];

  const els = {
    setup: document.getElementById("matchless-setup"),
    game: document.getElementById("matchless-game"),
    over: document.getElementById("matchless-over"),
    playerCount: document.getElementById("matchless-player-count"),
    playerFields: document.getElementById("matchless-player-fields"),
    beginBtn: document.getElementById("matchless-begin"),
    roster: document.getElementById("matchless-roster"),
    category: document.getElementById("matchless-category"),
    status: document.getElementById("matchless-status"),
    roundForm: document.getElementById("matchless-round-form"),
    hostWord: document.getElementById("matchless-host-word"),
    playerWords: document.getElementById("matchless-player-words"),
    revealBtn: document.getElementById("matchless-reveal"),
    roundResult: document.getElementById("matchless-round-result"),
    resultText: document.getElementById("matchless-result-text"),
    nextRoundBtn: document.getElementById("matchless-next-round"),
    finishBtn: document.getElementById("matchless-finish"),
    winnerText: document.getElementById("matchless-winner"),
    playAgainBtn: document.getElementById("matchless-play-again"),
  };

  let players = [];
  let categoryIndex = 0;
  let pendingWinner = null;

  function stripTrailingDots(raw) {
    return raw.trim().replace(/\.+$/, "");
  }

  function normalizeWord(raw) {
    return stripTrailingDots(raw).replace(/[^a-zA-Z]/g, "").toLowerCase();
  }

  function displayWord(raw) {
    return stripTrailingDots(raw);
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function clampPlayerCount() {
    return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, parseInt(els.playerCount.value, 10) || MIN_PLAYERS));
  }

  function getActivePlayers() {
    return players.filter((p) => !p.isHost && !p.eliminated);
  }

  function showScreen(screen) {
    els.setup.classList.toggle("matchless-hidden", screen !== "setup");
    els.game.classList.toggle("matchless-hidden", screen !== "game");
    els.over.classList.toggle("matchless-hidden", screen !== "over");
  }

  function randomCategory() {
    categoryIndex = Math.floor(Math.random() * CATEGORIES.length);
    els.category.textContent = CATEGORIES[categoryIndex];
  }

  function nextCategory() {
    categoryIndex = (categoryIndex + 1) % CATEGORIES.length;
    els.category.textContent = CATEGORIES[categoryIndex];
  }

  function renderPlayerFields() {
    const count = clampPlayerCount();
    els.playerCount.value = count;
    els.playerFields.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "matchless-player-row";
      const label = i === 0 ? "Host (Player 1)" : "Player " + (i + 1);
      const placeholder = i === 0 ? "Host" : "Player " + (i + 1);
      row.innerHTML =
        '<label for="matchless-player-' +
        i +
        '">' +
        label +
        '</label><input type="text" id="matchless-player-' +
        i +
        '" placeholder="' +
        placeholder +
        '" maxlength="24" />';
      els.playerFields.appendChild(row);
    }
  }

  function renderRoster() {
    els.roster.innerHTML = players
      .map((player) => {
        const tags = [];
        if (player.isHost) tags.push('<span class="matchless-tag">HOST</span>');
        if (player.eliminated) tags.push('<span class="matchless-tag matchless-tag--out">OUT</span>');
        const classes = ["matchless-roster-row"];
        if (player.eliminated) classes.push("matchless-roster-row--out");
        if (player.isHost) classes.push("matchless-roster-row--host");
        return (
          '<div class="' +
          classes.join(" ") +
          '">' +
          '<span class="matchless-roster-name">' +
          escapeHtml(player.name) +
          "</span>" +
          '<span class="matchless-roster-tags">' +
          tags.join("") +
          "</span></div>"
        );
      })
      .join("");
  }

  function renderWordInputs() {
    const active = getActivePlayers();
    els.playerWords.innerHTML = active
      .map((player) => {
        return (
          '<div class="matchless-word-row">' +
          '<label for="matchless-word-' +
          player.index +
          '">' +
          escapeHtml(player.name) +
          "</label>" +
          '<input type="text" id="matchless-word-' +
          player.index +
          '" class="matchless-player-word" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Enter word" />' +
          "</div>"
        );
      })
      .join("");

    if (active.length === 0) {
      els.playerWords.innerHTML = '<p class="matchless-empty">No active players remaining.</p>';
    }
  }

  function clearRoundInputs() {
    els.hostWord.value = "";
    els.playerWords.querySelectorAll(".matchless-player-word").forEach((input) => {
      input.value = "";
    });
  }

  function showRoundForm() {
    els.roundForm.classList.remove("matchless-hidden");
    els.roundResult.classList.add("matchless-hidden");
    els.revealBtn.disabled = getActivePlayers().length === 0;
    pendingWinner = null;
  }

  function beginGame() {
    const count = clampPlayerCount();
    players = [];

    for (let i = 0; i < count; i++) {
      const input = document.getElementById("matchless-player-" + i);
      const defaultName = i === 0 ? "Host" : "Player " + (i + 1);
      const name = (input && input.value.trim()) || defaultName;
      players.push({ index: i, name, isHost: i === 0, eliminated: false });
    }

    randomCategory();
    renderRoster();
    renderWordInputs();
    clearRoundInputs();
    showRoundForm();
    els.status.textContent = "Host: enter your secret word. Everyone else: enter a word when ready.";
    showScreen("game");
  }

  function revealRound() {
    const hostWord = normalizeWord(els.hostWord.value);
    if (!hostWord) {
      els.status.textContent = "The host must enter a secret word first.";
      return;
    }

    const active = getActivePlayers();
    if (active.length === 0) return;

    const missing = active.filter((player) => {
      const input = document.getElementById("matchless-word-" + player.index);
      return !normalizeWord(input ? input.value : "");
    });

    if (missing.length > 0) {
      els.status.textContent = "Every active player needs to enter a word.";
      return;
    }

    const eliminated = [];
    active.forEach((player) => {
      const input = document.getElementById("matchless-word-" + player.index);
      if (normalizeWord(input.value) === hostWord) {
        player.eliminated = true;
        eliminated.push(player.name);
      }
    });

    const remaining = getActivePlayers();
    renderRoster();

    let resultHtml =
      '<p><strong>Host word:</strong> ' + escapeHtml(displayWord(els.hostWord.value)) + "</p>";

    if (eliminated.length > 0) {
      resultHtml +=
        "<p><strong>Eliminated:</strong> " +
        eliminated.map(escapeHtml).join(", ") +
        " (matched the host)</p>";
    } else {
      resultHtml += "<p><strong>No matches.</strong> Everyone survives this round!</p>";
    }

    if (remaining.length === 1) {
      resultHtml +=
        "<p><strong>" +
        escapeHtml(remaining[0].name) +
        "</strong> is the last player standing!</p>";
    } else if (remaining.length === 0) {
      resultHtml += "<p>Everyone was eliminated — nobody wins this game.</p>";
    } else {
      resultHtml +=
        "<p><strong>" +
        remaining.length +
        " players</strong> still in the game.</p>";
    }

    els.resultText.innerHTML = resultHtml;
    els.roundForm.classList.add("matchless-hidden");
    els.roundResult.classList.remove("matchless-hidden");
    els.status.textContent = "";

    if (remaining.length === 1) {
      pendingWinner = remaining[0];
      els.nextRoundBtn.classList.add("matchless-hidden");
      els.finishBtn.classList.remove("matchless-hidden");
    } else if (remaining.length === 0) {
      pendingWinner = null;
      els.nextRoundBtn.classList.add("matchless-hidden");
      els.finishBtn.classList.remove("matchless-hidden");
    } else {
      pendingWinner = null;
      els.nextRoundBtn.classList.remove("matchless-hidden");
      els.finishBtn.classList.add("matchless-hidden");
    }
  }

  function startNextRound() {
    nextCategory();
    clearRoundInputs();
    renderWordInputs();
    showRoundForm();
    els.status.textContent =
      getActivePlayers().length +
      " players remain. Host: enter a new secret word.";
  }

  function finishGame() {
    endGame(pendingWinner);
  }

  function endGame(winner) {
    if (winner) {
      els.winnerText.textContent = winner.name + " wins!";
    } else {
      els.winnerText.textContent = "Nobody wins — everyone matched the host!";
    }
    showScreen("over");
  }

  function playAgain() {
    players = [];
    categoryIndex = 0;
    clearRoundInputs();
    renderPlayerFields();
    showScreen("setup");
  }

  els.playerCount.addEventListener("change", renderPlayerFields);
  els.playerCount.addEventListener("input", renderPlayerFields);
  els.beginBtn.addEventListener("click", beginGame);
  els.revealBtn.addEventListener("click", revealRound);
  els.nextRoundBtn.addEventListener("click", startNextRound);
  els.finishBtn.addEventListener("click", finishGame);
  els.playAgainBtn.addEventListener("click", playAgain);

  renderPlayerFields();
})();
