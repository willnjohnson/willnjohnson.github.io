(function () {
  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 8;
  const MIN_ROUNDS = 2;
  const MAX_ROUNDS = 8;
  const ROUND_SECONDS = 120;
  const MAX_HINTS = 5;
  const BASE_POINTS = 10;
  const CANVAS_W = 640;
  const CANVAS_H = 420;
  const COLORS = [
    { name: "red", hex: "#e53935" },
    { name: "orange", hex: "#fb8c00" },
    { name: "gold", hex: "#fdd835" },
    { name: "lime", hex: "#c0ca33" },
    { name: "green", hex: "#43a047" },
    { name: "cyan", hex: "#00acc1" },
    { name: "blue", hex: "#1e88e5" },
    { name: "purple", hex: "#8e24aa" },
    { name: "magenta", hex: "#d81b60" },
    { name: "black", hex: "#212121" },
    { name: "brown", hex: "#6d4c41" },
  ];

  const els = {
    setup: document.getElementById("pictionary-setup"),
    game: document.getElementById("pictionary-game"),
    over: document.getElementById("pictionary-over"),
    playerCount: document.getElementById("pictionary-player-count"),
    roundCount: document.getElementById("pictionary-round-count"),
    playerFields: document.getElementById("pictionary-player-fields"),
    beginBtn: document.getElementById("pictionary-begin"),
    roundLabel: document.getElementById("pictionary-round-label"),
    drawerLabel: document.getElementById("pictionary-drawer-label"),
    scoreboard: document.getElementById("pictionary-scoreboard"),
    prep: document.getElementById("pictionary-prep"),
    prepStatus: document.getElementById("pictionary-prep-status"),
    secretWord: document.getElementById("pictionary-secret-word"),
    startDrawBtn: document.getElementById("pictionary-start-draw"),
    draw: document.getElementById("pictionary-draw"),
    canvas: document.getElementById("pictionary-canvas"),
    timerBg: document.querySelector(".pictionary-timer-bg"),
    timerElapsed: document.getElementById("pictionary-timer-elapsed"),
    hintCount: document.getElementById("pictionary-hint-count"),
    hintDisplay: document.getElementById("pictionary-hint-display"),
    hintBtn: document.getElementById("pictionary-hint-btn"),
    palette: document.getElementById("pictionary-palette"),
    brushSize: document.getElementById("pictionary-brush-size"),
    clearCanvasBtn: document.getElementById("pictionary-clear-canvas"),
    solvedBtn: document.getElementById("pictionary-solved-btn"),
    skipBtn: document.getElementById("pictionary-skip-btn"),
    resolve: document.getElementById("pictionary-resolve"),
    resolveStatus: document.getElementById("pictionary-resolve-status"),
    guesserList: document.getElementById("pictionary-guesser-list"),
    resolveSkip: document.getElementById("pictionary-resolve-skip"),
    turnResult: document.getElementById("pictionary-turn-result"),
    turnResultText: document.getElementById("pictionary-turn-result-text"),
    nextTurnBtn: document.getElementById("pictionary-next-turn"),
    finalScores: document.getElementById("pictionary-final-scores"),
    playAgainBtn: document.getElementById("pictionary-play-again"),
  };

  const ctx = els.canvas.getContext("2d", { willReadFrequently: true });

  let players = [];
  let totalRounds = 4;
  let round = 1;
  let turnInRound = 0;
  let secretWord = "";
  let hintsUsed = 0;
  let revealedIndices = new Set();
  let timerInterval = null;
  let secondsLeft = ROUND_SECONDS;
  let tool = "brush";
  let color = COLORS[0].hex;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;
  let phase = "setup";

  function stripTrailingDots(raw) {
    return raw.trim().replace(/\.+$/, "");
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function clampPlayerCount() {
    return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, parseInt(els.playerCount.value, 10) || MIN_PLAYERS));
  }

  function clampRoundCount() {
    return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, parseInt(els.roundCount.value, 10) || MIN_ROUNDS));
  }

  function getDrawerIndex() {
    return turnInRound;
  }

  function getDrawer() {
    return players[getDrawerIndex()];
  }

  function showScreen(screen) {
    els.setup.classList.toggle("pictionary-hidden", screen !== "setup");
    els.game.classList.toggle("pictionary-hidden", screen !== "game");
    els.over.classList.toggle("pictionary-hidden", screen !== "over");
  }

  function showPhase(next) {
    phase = next;
    els.prep.classList.toggle("pictionary-hidden", next !== "prep");
    els.draw.classList.toggle("pictionary-hidden", next !== "draw");
    els.resolve.classList.toggle("pictionary-hidden", next !== "resolve");
    els.turnResult.classList.toggle("pictionary-hidden", next !== "turnResult");
  }

  function renderPlayerFields() {
    const count = clampPlayerCount();
    els.playerCount.value = count;
    els.playerFields.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "pictionary-player-row";
      row.innerHTML =
        '<label for="pictionary-player-' + i + '">Player ' + (i + 1) +
        '</label><input type="text" id="pictionary-player-' + i +
        '" placeholder="Player ' + (i + 1) + '" maxlength="24" />';
      els.playerFields.appendChild(row);
    }
  }

  function renderScoreboard(drawingIndex) {
    els.scoreboard.innerHTML = players
      .map((p, i) => {
        const cls = i === drawingIndex ? " pictionary-score-chip--drawing" : "";
        return (
          '<div class="pictionary-score-chip' + cls + '">' +
          '<span>' + escapeHtml(p.name) + "</span>" +
          '<span class="pictionary-score-num">' + p.score + "</span></div>"
        );
      })
      .join("");
  }

  function updateHeader() {
    const drawer = getDrawer();
    const n = players.length;
    els.roundLabel.textContent =
      "Round " + round + " of " + totalRounds +
      " · Turn " + (turnInRound + 1) + " of " + n;
    els.drawerLabel.textContent = drawer.name + " is drawing";
    renderScoreboard(getDrawerIndex());
  }

  function buildMaskedWord() {
    const parts = [];
    for (let i = 0; i < secretWord.length; i++) {
      const ch = secretWord[i];
      if (ch === " ") {
        parts.push(" ");
      } else if (revealedIndices.has(i)) {
        parts.push(ch.toUpperCase());
      } else {
        parts.push("_");
      }
    }
    return parts.join("  ");
  }

  function piePath(cx, cy, r, fraction) {
    if (fraction <= 0) return "";
    if (fraction >= 1) {
      return "M " + cx + " " + cy + " m -" + r + ",0 a " + r + "," + r + " 0 1,1 " + (r * 2) + ",0 a " + r + "," + r + " 0 1,1 -" + (r * 2) + ",0";
    }
    const angle = fraction * 2 * Math.PI;
    const x = cx + r * Math.sin(angle);
    const y = cy - r * Math.cos(angle);
    const large = fraction > 0.5 ? 1 : 0;
    return "M " + cx + " " + cy + " L " + cx + " " + (cy - r) + " A " + r + " " + r + " 0 " + large + " 1 " + x + " " + y + " Z";
  }

  function updateTimerDisplay() {
    const elapsed = ROUND_SECONDS - secondsLeft;
    const fraction = elapsed / ROUND_SECONDS;
    els.timerElapsed.setAttribute("d", piePath(50, 50, 42, fraction));
    els.timerBg.classList.toggle("urgent", secondsLeft <= 20 && secondsLeft > 0);
  }

  function clearTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function startTimer() {
    clearTimer();
    secondsLeft = ROUND_SECONDS;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      secondsLeft -= 1;
      updateTimerDisplay();
      if (secondsLeft <= 0) {
        clearTimer();
        endTurnNoGuess();
      }
    }, 1000);
  }

  function getHintDisplay() {
    if (hintsUsed === 0) return "No hints yet";
    return buildMaskedWord();
  }

  function updateHintUI() {
    els.hintCount.textContent = hintsUsed + "/" + MAX_HINTS;
    els.hintDisplay.textContent = getHintDisplay();
    els.hintBtn.disabled = hintsUsed >= MAX_HINTS;
  }

  function giveHint() {
    if (hintsUsed >= MAX_HINTS) return;
    hintsUsed += 1;
    if (hintsUsed > 1) {
      const unrevealed = [];
      for (let i = 0; i < secretWord.length; i++) {
        if (secretWord[i] !== " " && !revealedIndices.has(i)) unrevealed.push(i);
      }
      if (unrevealed.length > 0) {
        const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        revealedIndices.add(pick);
      }
    }
    updateHintUI();
  }

  function drawerPoints() {
    return Math.max(0, BASE_POINTS - hintsUsed);
  }

  function guesserPoints() {
    return BASE_POINTS;
  }

  function clearCanvas() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  function setupCanvas() {
    els.canvas.width = CANVAS_W;
    els.canvas.height = CANVAS_H;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    clearCanvas();
  }

  function canvasPos(e) {
    const rect = els.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function floodFill(startX, startY, fillHex) {
    const x = Math.floor(startX);
    const y = Math.floor(startY);
    const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const data = img.data;
    const w = CANVAS_W;
    const h = CANVAS_H;
    const startIdx = (y * w + x) * 4;
    const sr = data[startIdx];
    const sg = data[startIdx + 1];
    const sb = data[startIdx + 2];
    const fill = hexToRgb(fillHex);
    if (sr === fill.r && sg === fill.g && sb === fill.b) return;

    const stack = [[x, y]];
    const match = (idx) => data[idx] === sr && data[idx + 1] === sg && data[idx + 2] === sb;

    while (stack.length) {
      const [cx, cy] = stack.pop();
      let left = cx;
      while (left >= 0 && match((cy * w + left) * 4)) left--;
      left++;
      let right = cx;
      while (right < w && match((cy * w + right) * 4)) right++;
      right--;

      for (let px = left; px <= right; px++) {
        const idx = (cy * w + px) * 4;
        data[idx] = fill.r;
        data[idx + 1] = fill.g;
        data[idx + 2] = fill.b;
        data[idx + 3] = 255;
      }

      for (const ny of [cy - 1, cy + 1]) {
        if (ny < 0 || ny >= h) continue;
        let inRun = false;
        for (let px = left; px <= right; px++) {
          const idx = (ny * w + px) * 4;
          if (match(idx)) {
            if (!inRun) {
              stack.push([px, ny]);
              inRun = true;
            }
          } else {
            inRun = false;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function startStroke(x, y) {
    drawing = true;
    lastX = x;
    lastY = y;
    if (tool === "bucket") {
      floodFill(x, y, color);
      drawing = false;
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = parseInt(els.brushSize.value, 10);
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function moveStroke(x, y) {
    if (!drawing || tool === "bucket") return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = parseInt(els.brushSize.value, 10);
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
    ctx.stroke();
    lastX = x;
    lastY = y;
  }

  function endStroke() {
    drawing = false;
    ctx.globalCompositeOperation = "source-over";
  }

  function bindCanvas() {
    els.canvas.addEventListener("mousedown", (e) => {
      const p = canvasPos(e);
      startStroke(p.x, p.y);
    });
    els.canvas.addEventListener("mousemove", (e) => {
      const p = canvasPos(e);
      moveStroke(p.x, p.y);
    });
    window.addEventListener("mouseup", endStroke);

    els.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const p = canvasPos(e);
      startStroke(p.x, p.y);
    }, { passive: false });
    els.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const p = canvasPos(e);
      moveStroke(p.x, p.y);
    }, { passive: false });
    els.canvas.addEventListener("touchend", endStroke);
  }

  function renderPalette() {
    els.palette.innerHTML = COLORS.map((c, i) =>
      '<button type="button" class="pictionary-swatch' + (i === 0 ? " active" : "") +
      '" data-color="' + c.hex + '" style="background:' + c.hex +
      '" title="' + c.name + '" aria-label="' + c.name + '"></button>'
    ).join("");

    els.palette.querySelectorAll(".pictionary-swatch").forEach((btn) => {
      btn.addEventListener("click", () => {
        color = btn.dataset.color;
        els.palette.querySelectorAll(".pictionary-swatch").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (tool === "eraser") setTool("brush");
      });
    });
  }

  function setTool(next) {
    tool = next;
    document.querySelectorAll(".pictionary-tool").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === next);
    });
    els.canvas.style.cursor = next === "bucket" ? "cell" : "crosshair";
  }

  function beginGame() {
    const count = clampPlayerCount();
    totalRounds = clampRoundCount();
    els.roundCount.value = totalRounds;
    players = [];
    for (let i = 0; i < count; i++) {
      const input = document.getElementById("pictionary-player-" + i);
      const name = (input && input.value.trim()) || "Player " + (i + 1);
      players.push({ name, score: 0 });
    }
    round = 1;
    turnInRound = 0;
    showScreen("game");
    startPrepPhase();
  }

  function startPrepPhase() {
    clearTimer();
    secretWord = "";
    hintsUsed = 0;
    revealedIndices = new Set();
    els.secretWord.value = "";
    updateHeader();
    els.prepStatus.textContent = getDrawer().name + ", enter your word, then start drawing.";
    showPhase("prep");
  }

  function startDrawPhase() {
    secretWord = stripTrailingDots(els.secretWord.value);
    if (!secretWord) {
      els.prepStatus.textContent = "Enter a word before starting.";
      return;
    }
    hintsUsed = 0;
    revealedIndices = new Set();
    updateHintUI();
    setupCanvas();
    showPhase("draw");
    startTimer();
  }

  function openResolve() {
    if (phase !== "draw") return;
    clearTimer();
    const drawer = getDrawer();
    const guessers = players.filter((_, i) => i !== getDrawerIndex());
    els.resolveStatus.textContent = "The word was: " + secretWord;
    els.guesserList.innerHTML = guessers
      .map((p, i) => {
        const idx = players.indexOf(p);
        return (
          '<button type="button" class="pictionary-guesser-btn" data-index="' + idx + '">' +
          escapeHtml(p.name) + " guessed it</button>"
        );
      })
      .join("");
    els.guesserList.querySelectorAll(".pictionary-guesser-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        awardGuess(parseInt(btn.dataset.index, 10));
      });
    });
    showPhase("resolve");
  }

  function awardGuess(guesserIndex) {
    const drawerPts = drawerPoints();
    const guesserPts = guesserPoints();
    const drawer = getDrawer();
    const guesser = players[guesserIndex];
    drawer.score += drawerPts;
    guesser.score += guesserPts;
    let ptsMsg =
      "<strong>" + escapeHtml(guesser.name) + "</strong> earns <strong>" + guesserPts + "</strong> points. " +
      "<strong>" + escapeHtml(drawer.name) + "</strong> earns <strong>" + drawerPts + "</strong> points";
    if (hintsUsed > 0) {
      ptsMsg += " (" + hintsUsed + " hint" + (hintsUsed > 1 ? "s" : "") + " used).";
    } else {
      ptsMsg += ".";
    }
    showTurnResult(
      "<p><strong>" + escapeHtml(guesser.name) + "</strong> guessed correctly!</p>" +
      "<p>The word was <strong>" + escapeHtml(secretWord) + "</strong>.</p>" +
      "<p>" + ptsMsg + "</p>"
    );
  }

  function endTurnNoGuess() {
    showTurnResult(
      "<p>Time's up — nobody guessed correctly.</p>" +
      "<p>The word was <strong>" + escapeHtml(secretWord) + "</strong>.</p>" +
      "<p><strong>" + escapeHtml(getDrawer().name) + "</strong> earns 0 points this turn.</p>"
    );
  }

  function skipTurn() {
    if (phase !== "draw" && phase !== "resolve") return;
    clearTimer();
    showTurnResult(
      "<p>Round skipped.</p>" +
      "<p>The word was <strong>" + escapeHtml(secretWord) + "</strong>.</p>" +
      "<p>No points awarded.</p>"
    );
  }

  function showTurnResult(html) {
    renderScoreboard(getDrawerIndex());
    els.turnResultText.innerHTML = html;
    showPhase("turnResult");
  }

  function nextTurn() {
    turnInRound += 1;
    if (turnInRound >= players.length) {
      turnInRound = 0;
      round += 1;
    }
    if (round > totalRounds) {
      endGame();
      return;
    }
    startPrepPhase();
  }

  function endGame() {
    const sorted = players.slice().sort((a, b) => b.score - a.score);
    const max = sorted[0].score;
    const winners = sorted.filter((p) => p.score === max);
    let html = "";
    sorted.forEach((p) => {
      html +=
        '<div class="pictionary-final-row"><span>' + escapeHtml(p.name) +
        "</span><span>" + p.score + " pts</span></div>";
    });
    if (winners.length === 1) {
      html = "<p><strong>" + escapeHtml(winners[0].name) + "</strong> wins!</p>" + html;
    } else {
      html = "<p>It's a tie!</p>" + html;
    }
    els.finalScores.innerHTML = html;
    showScreen("over");
  }

  function playAgain() {
    clearTimer();
    players = [];
    round = 1;
    turnInRound = 0;
    renderPlayerFields();
    showScreen("setup");
  }

  document.querySelectorAll(".pictionary-tool").forEach((btn) => {
    btn.addEventListener("click", () => setTool(btn.dataset.tool));
  });

  els.hintBtn.addEventListener("click", giveHint);
  els.beginBtn.addEventListener("click", beginGame);
  els.startDrawBtn.addEventListener("click", startDrawPhase);
  els.clearCanvasBtn.addEventListener("click", clearCanvas);
  els.solvedBtn.addEventListener("click", openResolve);
  els.skipBtn.addEventListener("click", () => {
    if (phase === "draw") skipTurn();
  });
  els.resolveSkip.addEventListener("click", skipTurn);
  els.nextTurnBtn.addEventListener("click", nextTurn);
  els.playAgainBtn.addEventListener("click", playAgain);

  document.addEventListener("keydown", (e) => {
    if ((e.key === "s" || e.key === "S") && phase === "draw") {
      e.preventDefault();
      openResolve();
    }
  });

  els.playerCount.addEventListener("change", renderPlayerFields);
  els.playerCount.addEventListener("input", renderPlayerFields);

  renderPalette();
  bindCanvas();
  renderPlayerFields();
})();
