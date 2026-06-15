(function () {
  const SINGLES = new Set(["J", "Q", "X", "Z", "V"]);
  const WIN_SCORE = 10;
  const ROUND_SECONDS = 10;
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

  const LETTER_POOL = (() => {
    const pool = [];
    for (let code = 65; code <= 90; code++) {
      const letter = String.fromCharCode(code);
      const count = SINGLES.has(letter) ? 1 : 2;
      for (let i = 0; i < count; i++) pool.push(letter);
    }
    return pool;
  })();

  const els = {
    setup: document.getElementById("worderly-setup"),
    game: document.getElementById("worderly-game"),
    over: document.getElementById("worderly-over"),
    playerCount: document.getElementById("worderly-player-count"),
    playerFields: document.getElementById("worderly-player-fields"),
    beginBtn: document.getElementById("worderly-begin"),
    scoreboard: document.getElementById("worderly-scoreboard"),
    category: document.getElementById("worderly-category"),
    countdown: document.getElementById("worderly-countdown"),
    letters: document.getElementById("worderly-letters"),
    timer: document.getElementById("worderly-timer"),
    status: document.getElementById("worderly-status"),
    startBtn: document.getElementById("worderly-round-btn"),
    winnerText: document.getElementById("worderly-winner"),
    playAgainBtn: document.getElementById("worderly-play-again"),
  };

  let players = [];
  let categoryIndex = 0;
  let phase = "idle";
  let countdownTimer = null;
  let roundTimer = null;
  let tickInterval = null;
  let secondsLeft = ROUND_SECONDS;

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function drawLetters() {
    const bag = shuffle(LETTER_POOL);
    let first = bag[0];
    let second = bag.find((l) => l !== first) || bag[1];
    return [first, second];
  }

  function nextCategory() {
    categoryIndex = (categoryIndex + 1) % CATEGORIES.length;
    els.category.textContent = CATEGORIES[categoryIndex];
  }

  function randomCategory() {
    categoryIndex = Math.floor(Math.random() * CATEGORIES.length);
    els.category.textContent = CATEGORIES[categoryIndex];
  }

  function clearTimers() {
    clearTimeout(countdownTimer);
    clearTimeout(roundTimer);
    clearInterval(tickInterval);
    countdownTimer = null;
    roundTimer = null;
    tickInterval = null;
  }

  function setPhase(next) {
    phase = next;
    updateRoundButton();
  }

  function updateRoundButton() {
    if (phase === "idle") {
      els.startBtn.textContent = "Start";
      els.startBtn.disabled = false;
    } else if (phase === "countdown") {
      els.startBtn.textContent = "Start";
      els.startBtn.disabled = true;
    } else if (phase === "round") {
      els.startBtn.textContent = "Next Round";
      els.startBtn.disabled = false;
    }
  }

  function handleRoundAction() {
    if (phase === "idle") {
      startRound();
    } else if (phase === "round") {
      advanceRound();
    }
  }

  function renderPlayerFields() {
    const count = Math.min(6, Math.max(2, parseInt(els.playerCount.value, 10) || 2));
    els.playerCount.value = count;
    els.playerFields.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "worderly-player-row";
      row.innerHTML =
        '<label for="worderly-player-' +
        i +
        '">Player ' +
        (i + 1) +
        '</label><input type="text" id="worderly-player-' +
        i +
        '" placeholder="Player ' +
        (i + 1) +
        '" maxlength="24" />';
      els.playerFields.appendChild(row);
    }
  }

  function renderScoreboard() {
    const maxScore = Math.max(...players.map((p) => p.score), 0);
    els.scoreboard.innerHTML = players
      .map((player, index) => {
        const leading = player.score === maxScore && maxScore > 0;
        const leadTag = leading ? ' <span class="worderly-lead">[LEAD]</span>' : "";
        const canDeduct = player.score > 0;
        return (
          '<div class="worderly-score-row" data-index="' +
          index +
          '">' +
          '<span class="worderly-score-name">' +
          escapeHtml(player.name) +
          leadTag +
          "</span>" +
          '<span class="worderly-score-value">' +
          '<button type="button" class="worderly-score-btn worderly-score-btn--minus" data-index="' +
          index +
          '" data-delta="-1" aria-label="Deduct point for ' +
          escapeHtml(player.name) +
          '"' +
          (canDeduct ? "" : " disabled") +
          ">−</button>" +
          '<span class="worderly-score-num">' +
          player.score +
          "</span>" +
          '<button type="button" class="worderly-score-btn" data-index="' +
          index +
          '" data-delta="1" aria-label="Add point for ' +
          escapeHtml(player.name) +
          '">+</button>' +
          "</span></div>"
        );
      })
      .join("");

    els.scoreboard.querySelectorAll(".worderly-score-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        adjustScore(parseInt(btn.dataset.index, 10), parseInt(btn.dataset.delta, 10));
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showScreen(screen) {
    els.setup.classList.toggle("worderly-hidden", screen !== "setup");
    els.game.classList.toggle("worderly-hidden", screen !== "game");
    els.over.classList.toggle("worderly-hidden", screen !== "over");
  }

  function beginGame() {
    const count = Math.min(6, Math.max(2, parseInt(els.playerCount.value, 10) || 2));
    players = [];

    for (let i = 0; i < count; i++) {
      const input = document.getElementById("worderly-player-" + i);
      const name = (input && input.value.trim()) || "Player " + (i + 1);
      players.push({ name, score: 0 });
    }

    clearTimers();
    setPhase("idle");
    randomCategory();
    resetRoundDisplay();
    renderScoreboard();
    showScreen("game");
    els.status.textContent = 'Press "Start" when ready for the next round.';
  }

  function resetRoundDisplay() {
    els.countdown.textContent = "";
    els.countdown.classList.add("worderly-hidden");
    els.letters.innerHTML = "";
    els.letters.classList.add("worderly-hidden");
    els.timer.textContent = "";
    els.timer.classList.add("worderly-hidden");
    els.timer.classList.remove("urgent");
  }

  function startRound() {
    if (phase === "countdown" || phase === "round") return;

    clearTimers();
    resetRoundDisplay();
    setPhase("countdown");
    els.status.textContent = "Get ready…";

    const sequence = [3, 2, 1];
    els.countdown.classList.remove("worderly-hidden");
    let step = 0;

    function tickCountdown() {
      if (step < sequence.length) {
        els.countdown.textContent = sequence[step];
        step++;
        countdownTimer = setTimeout(tickCountdown, 1000);
      } else {
        els.countdown.textContent = "Go!";
        countdownTimer = setTimeout(beginActiveRound, 500);
      }
    }

    tickCountdown();
  }

  function beginActiveRound() {
    const [a, b] = drawLetters();
    els.countdown.classList.add("worderly-hidden");
    els.letters.classList.remove("worderly-hidden");
    els.letters.innerHTML =
      '<div class="worderly-letter">' +
      a +
      '</div><div class="worderly-letter">' +
      b +
      "</div>";

    secondsLeft = ROUND_SECONDS;
    els.timer.classList.remove("worderly-hidden");
    els.timer.textContent = secondsLeft + "s";
    els.status.textContent = "Say a word in the category that contains both letters!";
    setPhase("round");

    tickInterval = setInterval(() => {
      secondsLeft -= 1;
      els.timer.textContent = secondsLeft + "s";
      if (secondsLeft <= 3) els.timer.classList.add("urgent");
      if (secondsLeft <= 0) endRoundTimeout();
    }, 1000);

    roundTimer = setTimeout(endRoundTimeout, ROUND_SECONDS * 1000);
  }

  function endRoundTimeout() {
    if (phase !== "round") return;
    clearTimers();
    setPhase("idle");
    resetRoundDisplay();
    nextCategory();
    els.status.textContent = "Time's up! New category — press Start when ready.";
  }

  function adjustScore(index, delta) {
    const player = players[index];
    if (!player) return;

    const nextScore = player.score + delta;
    if (nextScore < 0) return;

    player.score = nextScore;
    renderScoreboard();

    if (player.score >= WIN_SCORE) {
      clearTimers();
      setPhase("idle");
      resetRoundDisplay();
      endGame(player);
    }
  }

  function advanceRound() {
    if (phase !== "round") return;
    clearTimers();
    setPhase("idle");
    resetRoundDisplay();
    nextCategory();
    els.status.textContent = "New category — press Start when ready.";
  }

  function endGame(winner) {
    clearTimers();
    setPhase("idle");
    els.winnerText.textContent = winner.name + " wins with " + WIN_SCORE + " points!";
    showScreen("over");
  }

  function playAgain() {
    players = [];
    categoryIndex = 0;
    clearTimers();
    setPhase("idle");
    resetRoundDisplay();
    renderPlayerFields();
    showScreen("setup");
  }

  els.playerCount.addEventListener("change", renderPlayerFields);
  els.playerCount.addEventListener("input", renderPlayerFields);
  els.beginBtn.addEventListener("click", beginGame);
  els.startBtn.addEventListener("click", handleRoundAction);
  els.playAgainBtn.addEventListener("click", playAgain);

  renderPlayerFields();
})();
