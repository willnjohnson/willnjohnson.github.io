(function () {
  const els = {
    setup: document.getElementById("imposter-setup"),
    scoreboard: document.getElementById("imposter-scoreboard"),
    passScreen: document.getElementById("imposter-pass-screen"),
    revealScreen: document.getElementById("imposter-reveal-screen"),
    discussScreen: document.getElementById("imposter-discuss-screen"),
    scoreScreen: document.getElementById("imposter-score-screen"),
    over: document.getElementById("imposter-over"),
    
    playerCount: document.getElementById("imposter-player-count"),
    roundCount: document.getElementById("imposter-round-count"),
    playerFields: document.getElementById("imposter-player-fields"),
    beginBtn: document.getElementById("imposter-begin"),
    
    passName: document.getElementById("imposter-pass-name"),
    revealBtn: document.getElementById("imposter-reveal-btn"),
    wordDisplay: document.getElementById("imposter-word"),
    categoryDisplay: document.getElementById("imposter-category"),
    nextPlayerBtn: document.getElementById("imposter-next-player-btn"),
    
    revealImposterBtn: document.getElementById("imposter-reveal-imposter-btn"),
    revealNameDisplay: document.getElementById("imposter-reveal-name"),
    trueWordDisplay: document.getElementById("imposter-true-word"),
    phonyWordDisplay: document.getElementById("imposter-phony-word"),
    categoryResultDisplay: document.getElementById("imposter-category-result"),
    votingFields: document.getElementById("imposter-voting-fields"),
    updateScoreBtn: document.getElementById("imposter-update-score-btn"),
    
    finalScoreboard: document.getElementById("imposter-final-scoreboard"),
    winnerText: document.getElementById("imposter-winner"),
    playAgainBtn: document.getElementById("imposter-play-again"),
  };

  // Used only if proper_list.csv fails to load.
  const FALLBACK_CATEGORIES = {
    "Fruits": ["Apple", "Banana", "Orange", "Mango", "Strawberry", "Watermelon", "Grape", "Peach"],
    "Superheroes": ["Superman", "Batman", "Spider-Man", "Iron Man", "Wonder Woman", "The Flash", "Wolverine", "Thor"],
    "Countries": ["United States", "Canada", "Mexico", "Brazil", "France", "Germany", "Japan", "China"],
  };

  let categories = {};
  let players = [];
  let totalRounds = 5;
  let currentRound = 1;
  let currentPlayerIndex = 0;
  let imposterIndex = -1;
  let trueWord = "";
  let phonyWord = "";
  let currentCategory = "";

  function parseCategoryCsv(text) {
    const parsed = {};
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const commaIndex = trimmed.indexOf(',');
      if (commaIndex === -1) return;
      const category = trimmed.slice(0, commaIndex).replace(/"/g, '').trim();
      const word = trimmed.slice(commaIndex + 1).replace(/"/g, '').trim();
      if (!category || !word || category.toLowerCase() === 'category') return;
      if (!parsed[category]) parsed[category] = [];
      parsed[category].push(word);
    });
    return parsed;
  }

  categories = FALLBACK_CATEGORIES;

  fetch('../resources/proper_list.csv')
    .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.text();
    })
    .then(data => {
        const parsed = parseCategoryCsv(data);
        const usable = Object.keys(parsed).filter((cat) => parsed[cat].length >= 2);
        if (usable.length > 0) categories = parsed;
    })
    .catch(err => console.log("Using fallback word list. Could not load proper_list.csv"));

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function hideAllScreens() {
    els.setup.classList.add("imposter-hidden");
    els.passScreen.classList.add("imposter-hidden");
    els.revealScreen.classList.add("imposter-hidden");
    els.discussScreen.classList.add("imposter-hidden");
    els.scoreScreen.classList.add("imposter-hidden");
    els.over.classList.add("imposter-hidden");
  }

  function renderScoreboard(targetElement) {
    const maxScore = Math.max(...players.map((p) => p.score), 0);
    targetElement.innerHTML = players
      .map((player) => {
        const leading = player.score === maxScore && maxScore > 0;
        const leadTag = leading ? ' <span class="worderly-lead" style="font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); margin-left: 0.35rem;">[LEAD]</span>' : "";
        return (
          '<div class="imposter-score-row">' +
            '<span class="imposter-score-name">' + escapeHtml(player.name) + leadTag + '</span>' +
            '<span class="imposter-score-value">' + player.score + ' pts</span>' +
          '</div>'
        );
      })
      .join("");
  }

  function renderPlayerFields() {
    const count = Math.min(12, Math.max(3, parseInt(els.playerCount.value, 10) || 3));
    els.playerCount.value = count;
    els.playerFields.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "imposter-player-row";
      row.innerHTML =
        '<label for="imposter-player-' + i + '">Player ' + (i + 1) + '</label>' +
        '<input type="text" id="imposter-player-' + i + '" placeholder="Player ' + (i + 1) + '" maxlength="24" />';
      els.playerFields.appendChild(row);
    }
  }

  function beginGame() {
    const count = Math.min(12, Math.max(3, parseInt(els.playerCount.value, 10) || 3));
    totalRounds = Math.max(1, parseInt(els.roundCount.value, 10) || 5);
    players = [];

    for (let i = 0; i < count; i++) {
      const input = document.getElementById("imposter-player-" + i);
      const name = (input && input.value.trim()) || "Player " + (i + 1);
      players.push({ name, score: 0 });
    }

    currentRound = 1;
    els.scoreboard.classList.remove("imposter-hidden");
    renderScoreboard(els.scoreboard);
    startRound();
  }

  function startRound() {
    if (currentRound > totalRounds) {
      endGame();
      return;
    }

    const catNames = Object.keys(categories).filter((cat) => categories[cat].length >= 2);
    currentCategory = catNames[Math.floor(Math.random() * catNames.length)];
    const shuffledWords = shuffle(categories[currentCategory]);
    trueWord = shuffledWords[0];
    phonyWord = shuffledWords[1];

    imposterIndex = Math.floor(Math.random() * players.length);
    currentPlayerIndex = 0;
    
    showPassScreen();
  }

  function showPassScreen() {
    hideAllScreens();
    els.passName.textContent = "Player: " + players[currentPlayerIndex].name;
    els.passScreen.classList.remove("imposter-hidden");
  }

  function revealWord() {
    hideAllScreens();
    const isImposter = (currentPlayerIndex === imposterIndex);
    els.wordDisplay.textContent = isImposter ? phonyWord : trueWord;
    if (els.categoryDisplay) els.categoryDisplay.textContent = "Category: " + currentCategory;
    els.revealScreen.classList.remove("imposter-hidden");
  }

  function nextPlayer() {
    currentPlayerIndex++;
    if (currentPlayerIndex < players.length) {
      showPassScreen();
    } else {
      hideAllScreens();
      els.discussScreen.classList.remove("imposter-hidden");
    }
  }

  function showScoringScreen() {
    hideAllScreens();
    els.revealNameDisplay.textContent = players[imposterIndex].name;
    els.trueWordDisplay.textContent = trueWord;
    els.phonyWordDisplay.textContent = phonyWord;
    if (els.categoryResultDisplay) els.categoryResultDisplay.textContent = currentCategory;

    els.votingFields.innerHTML = "";
    players.forEach((player, index) => {
      if (index === imposterIndex) return; // Imposter cannot vote/score

      const row = document.createElement("div");
      row.className = "imposter-player-row";
      row.innerHTML =
        '<input type="checkbox" id="imposter-vote-' + index + '" />' +
        '<label for="imposter-vote-' + index + '" style="margin:0; font-size:1.05rem;">' + escapeHtml(player.name) + ' guessed correctly</label>';
      els.votingFields.appendChild(row);
    });

    els.scoreScreen.classList.remove("imposter-hidden");
  }

  function updateScoresAndNextRound() {
    players.forEach((player, index) => {
      if (index === imposterIndex) return;
      const checkbox = document.getElementById("imposter-vote-" + index);
      if (checkbox && checkbox.checked) {
        player.score += 1;
      }
    });

    renderScoreboard(els.scoreboard);

    currentRound++;
    startRound();
  }

  function endGame() {
    hideAllScreens();
    els.scoreboard.classList.add("imposter-hidden");
    
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const maxScore = sortedPlayers[0].score;
    const winners = sortedPlayers.filter(p => p.score === maxScore).map(p => p.name);

    renderScoreboard(els.finalScoreboard);

    if (winners.length > 1) {
      els.winnerText.textContent = "It's a tie between " + winners.join(" & ") + "!";
    } else {
      els.winnerText.textContent = winners[0] + " wins with " + maxScore + " points!";
    }

    els.over.classList.remove("imposter-hidden");
  }

  function playAgain() {
    hideAllScreens();
    els.scoreboard.classList.add("imposter-hidden");
    renderPlayerFields();
    els.setup.classList.remove("imposter-hidden");
  }

  els.playerCount.addEventListener("change", renderPlayerFields);
  els.playerCount.addEventListener("input", renderPlayerFields);
  els.beginBtn.addEventListener("click", beginGame);
  els.revealBtn.addEventListener("click", revealWord);
  els.nextPlayerBtn.addEventListener("click", nextPlayer);
  els.revealImposterBtn.addEventListener("click", showScoringScreen);
  els.updateScoreBtn.addEventListener("click", updateScoresAndNextRound);
  els.playAgainBtn.addEventListener("click", playAgain);

  renderPlayerFields();
})();