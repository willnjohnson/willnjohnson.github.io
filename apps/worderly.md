---
layout: page
title: Worderly
stylesheet: worderly
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="worderly" id="worderly-app">
  <div id="worderly-setup">
    <div class="worderly-panel">
      <h2>How to Play</h2>
      <ul class="worderly-rules">
        <li>A category is shown. Press <strong>Start</strong> for a 3, 2, 1 countdown, then two letters appear. During a round, the same button becomes <strong>Next Round</strong> to skip ahead.</li>
        <li>Say a word in that category containing both letters "in Worderly fashion" — for example, category <em>Animal</em> with <em>E</em> and <em>Z</em>, you could say <strong>ZEBRA</strong>.</li>
        <li>Use <strong>+</strong> or <strong>−</strong> next to a player name to adjust their score at any time — the host decides whether an answer counts, even as the timer runs out. Scores cannot go below zero.</li>
        <li>First player to <strong>10 points</strong> wins.</li>
        <li>If no word is found within <strong>10 seconds</strong>, a new category appears.</li>
      </ul>
    </div>

    <div class="worderly-panel">
      <h2>Players</h2>
      <label for="worderly-player-count">Number of players (2–6)</label>
      <input type="number" id="worderly-player-count" min="2" max="6" value="2" />

      <div class="worderly-players" id="worderly-player-fields"></div>

      <div class="worderly-actions">
        <button type="button" class="btn" id="worderly-begin">Begin Game</button>
      </div>
    </div>
  </div>

  <div id="worderly-game" class="worderly-hidden">
    <div class="worderly-scoreboard" id="worderly-scoreboard"></div>

    <div class="worderly-panel">
      <p class="worderly-category" id="worderly-category">Animal</p>

      <div class="worderly-countdown worderly-hidden" id="worderly-countdown"></div>

      <div class="worderly-letters worderly-hidden" id="worderly-letters"></div>

      <div class="worderly-timer worderly-hidden" id="worderly-timer"></div>

      <p class="worderly-status" id="worderly-status"></p>

      <div class="worderly-actions">
        <button type="button" class="btn" id="worderly-round-btn">Start</button>
      </div>
    </div>
  </div>

  <div id="worderly-over" class="worderly-hidden">
    <div class="worderly-panel" style="text-align: center;">
      <h2>Game Over</h2>
      <p id="worderly-winner" style="font-size: 1.25rem; color: var(--text-primary);"></p>
      <div class="worderly-actions">
        <button type="button" class="btn" id="worderly-play-again">Play Again</button>
      </div>
    </div>
  </div>
</div>

<script src="{{ '/scripts/js/worderly.js' | relative_url }}"></script>
