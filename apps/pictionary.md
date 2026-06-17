---
layout: page
title: Pictionary
stylesheet: pictionary
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="pictionary" id="pictionary-app">
  <div id="pictionary-setup">
    <div class="pictionary-panel">
      <h2>How to Play</h2>
      <ul class="pictionary-rules">
        <li>3–8 players. Choose <strong>2–8 rounds</strong> — each round, every player draws once before moving on.</li>
        <li>Generate a word on another device (e.g. <a href="https://randomwordgenerator.com/" target="_blank" rel="noopener">randomwordgenerator.com</a>), then the drawer enters it here. Pad with trailing <strong>.</strong> to hide length.</li>
        <li>Draw on the canvas while others guess. Press <strong>S</strong> (or <strong>Solved</strong>) when someone gets it, then pick who guessed correctly.</li>
        <li><strong>120-second</strong> timer per turn (no clock shown). Up to <strong>5 hints</strong> — first shows spaced underscores, the rest reveal letters. Each hint costs the drawer 1 point.</li>
        <li>Correct guess: guesser earns <strong>10 points</strong>; drawer earns <strong>10 − hints used</strong>. No correct guess: drawer earns 0 for the turn.</li>
      </ul>
    </div>

    <div class="pictionary-panel">
      <h2>Game Setup</h2>
      <label for="pictionary-player-count">Number of players (3–8)</label>
      <input type="number" id="pictionary-player-count" min="3" max="8" value="4" />
      <label for="pictionary-round-count">Number of rounds (2–8)</label>
      <input type="number" id="pictionary-round-count" min="2" max="8" value="4" />
      <div class="pictionary-players" id="pictionary-player-fields"></div>
      <div class="pictionary-actions">
        <button type="button" class="btn" id="pictionary-begin">Begin Game</button>
      </div>
    </div>
  </div>

  <div id="pictionary-game" class="pictionary-hidden">
    <div class="pictionary-header">
      <span id="pictionary-round-label">Round 1 of 8</span>
      <span id="pictionary-drawer-label">Player 1 is drawing</span>
    </div>

    <div class="pictionary-scoreboard" id="pictionary-scoreboard"></div>

    <div id="pictionary-prep" class="pictionary-panel">
      <h2>Enter Word</h2>
      <p class="pictionary-status" id="pictionary-prep-status"></p>
      <label for="pictionary-secret-word">Drawer's secret word</label>
      <input
        type="password"
        id="pictionary-secret-word"
        autocomplete="new-password"
        autocapitalize="off"
        spellcheck="false"
        placeholder="word.........."
      />
      <p class="pictionary-footnote">
        Get a word from <a href="https://randomwordgenerator.com/" target="_blank" rel="noopener">randomwordgenerator.com</a> on another device.
        Pad with dots to mask length — e.g. <code>apple..........</code>
      </p>
      <div class="pictionary-actions">
        <button type="button" class="btn" id="pictionary-start-draw">Start Drawing</button>
      </div>
    </div>

    <div id="pictionary-draw" class="pictionary-hidden">
      <div class="pictionary-draw-layout">
        <div class="pictionary-canvas-column">
          <div class="pictionary-canvas-wrap">
            <canvas id="pictionary-canvas" width="640" height="420"></canvas>
          </div>
          <div class="pictionary-canvas-actions">
            <button type="button" class="btn" id="pictionary-clear-canvas">Clear Canvas</button>
            <button type="button" class="btn" id="pictionary-solved-btn">Solved (S)</button>
            <button type="button" class="btn" id="pictionary-skip-btn">Skip Round</button>
          </div>
        </div>

        <div class="pictionary-sidebar">
          <div class="pictionary-timer-wrap">
            <svg class="pictionary-timer" viewBox="0 0 100 100" aria-label="Drawing timer">
              <circle class="pictionary-timer-bg" cx="50" cy="50" r="42" />
              <path class="pictionary-timer-elapsed" id="pictionary-timer-elapsed" />
            </svg>
          </div>

          <div class="pictionary-hints">
            <h3>Hints <span id="pictionary-hint-count">0/5</span></h3>
            <div class="pictionary-hint-display" id="pictionary-hint-display">No hints yet</div>
            <button type="button" class="btn pictionary-hint-btn" id="pictionary-hint-btn">Give Hint</button>
            <br/><br/>
            <p class="pictionary-footnote">Each hint costs the drawer 1 point. Guessers always earn 10.</p>
          </div>

          <div class="pictionary-tools">
            <h3>Tools</h3>
            <div class="pictionary-tool-row">
              <button type="button" class="pictionary-tool active" data-tool="brush" title="Brush"><i class="fa-solid fa-paintbrush"></i></button>
              <button type="button" class="pictionary-tool" data-tool="eraser" title="Eraser"><i class="fa-solid fa-eraser"></i></button>
              <button type="button" class="pictionary-tool" data-tool="bucket" title="Paint bucket"><i class="fa-solid fa-fill-drip"></i></button>
            </div>
            <div class="pictionary-palette" id="pictionary-palette"></div>
            <label class="pictionary-brush-size-label" for="pictionary-brush-size">Brush size</label>
            <input type="range" id="pictionary-brush-size" min="2" max="24" value="6" />
          </div>
          <br/>
        </div>
      </div>
    </div>

    <div id="pictionary-resolve" class="pictionary-hidden">
      <div class="pictionary-panel pictionary-modal">
        <h2 id="pictionary-resolve-title">Who guessed it?</h2>
        <p class="pictionary-status" id="pictionary-resolve-status"></p>
        <div class="pictionary-guesser-list" id="pictionary-guesser-list"></div>
        <div class="pictionary-actions">
          <button type="button" class="btn" id="pictionary-resolve-skip">Nobody / Skip</button>
        </div>
      </div>
    </div>

    <div id="pictionary-turn-result" class="pictionary-hidden">
      <div class="pictionary-panel">
        <div class="pictionary-result-box" id="pictionary-turn-result-text"></div>
        <div class="pictionary-actions">
          <button type="button" class="btn" id="pictionary-next-turn">Next Turn</button>
        </div>
      </div>
    </div>
  </div>

  <div id="pictionary-over" class="pictionary-hidden">
    <div class="pictionary-panel" style="text-align: center;">
      <h2>Game Over</h2>
      <div id="pictionary-final-scores"></div>
      <div class="pictionary-actions">
        <button type="button" class="btn" id="pictionary-play-again">Play Again</button>
      </div>
    </div>
  </div>
</div>

<script src="{{ '/scripts/js/pictionary.js' | relative_url }}"></script>
