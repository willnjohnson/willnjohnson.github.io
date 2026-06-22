---
title: Imposter
layout: page
permalink: /apps/imposter
stylesheet: imposter
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="imposter" id="imposter-app">
  <div id="imposter-setup">
    <div class="imposter-panel">
      <h2>How to Play</h2>
      <ul class="imposter-rules">
        <li>A true word and a phony word are secretly chosen each round.</li>
        <li>Pass the device. Everyone receives the true word, except for one random <strong>Imposter</strong> who gets the phony word.</li>
        <li>After all words are revealed, players take turns describing their word. The Imposter must give their own description <strong>(or blend in by making up a description on what they think the true word is)</strong></li>
        <li>Vote on who the Imposter is. Anyone who guesses correctly gets a point. The Imposter cannot score.</li>
      </ul>
    </div>

    <div class="imposter-panel">
      <h2>Game Setup</h2>
      <label for="imposter-player-count">Number of players (3–12)</label>
      <input type="number" id="imposter-player-count" min="3" max="12" value="4" />

      <label for="imposter-round-count">Number of rounds</label>
      <input type="number" id="imposter-round-count" min="1" max="20" value="5" />

      <div class="imposter-players" id="imposter-player-fields"></div>

      <div class="imposter-actions">
        <button type="button" class="btn" id="imposter-begin">Begin Game</button>
      </div>
    </div>
  </div>

  <div class="imposter-scoreboard imposter-hidden" id="imposter-scoreboard" style="margin-bottom: 1.25rem;"></div>

  <div id="imposter-pass-screen" class="imposter-hidden">
    <div class="imposter-panel" style="text-align: center;">
      <h2 id="imposter-pass-name">Player 1</h2>
      <p class="imposter-status">Ensure no one else is looking at the screen!</p>
      <div class="imposter-actions">
        <button type="button" class="btn" id="imposter-reveal-btn">Reveal Word</button>
      </div>
    </div>
  </div>

  <div id="imposter-reveal-screen" class="imposter-hidden">
    <div class="imposter-panel" style="text-align: center;">
      <h2>Your Word</h2>
      <div class="imposter-word-display" id="imposter-word"></div>
      <p class="imposter-status">Memorize your word, then hide it for the next player.</p>
      <div class="imposter-actions">
        <button type="button" class="btn" id="imposter-next-player-btn">Next</button>
      </div>
    </div>
  </div>

  <div id="imposter-discuss-screen" class="imposter-hidden">
    <div class="imposter-panel" style="text-align: center;">
      <h2>Discussion Time!</h2>
      <p class="imposter-rules">
        Everyone has seen their word. Take turns describing your word with one descriptor/association. 
        Once everyone has spoken, vote on who you think the Imposter is!
      </p>
      <div class="imposter-actions" style="margin-top: 1.5rem;">
        <button type="button" class="btn" id="imposter-reveal-imposter-btn">Reveal Imposter</button>
      </div>
    </div>
  </div>

  <div id="imposter-score-screen" class="imposter-hidden">
    <div class="imposter-panel">
      <h2 style="text-align: center; color: var(--accent-color);">The Imposter was <span id="imposter-reveal-name"></span>!</h2>
      <p style="text-align: center; margin-bottom: 1.5rem;">
        True Word: <strong id="imposter-true-word"></strong><br>
        Phony Word: <strong id="imposter-phony-word"></strong>
      </p>
      
      <h3>Who guessed correctly?</h3>
      <p class="imposter-status">Select the players who successfully voted for the Imposter. (The Imposter cannot score).</p>
      <div class="imposter-players" id="imposter-voting-fields" style="margin-bottom: 1.5rem;"></div>

      <div class="imposter-actions">
        <button type="button" class="btn" id="imposter-update-score-btn">Update Scores & Next Round</button>
      </div>
    </div>
  </div>

  <div id="imposter-over" class="imposter-hidden">
    <div class="imposter-panel" style="text-align: center;">
      <h2>Game Over</h2>
      <div class="imposter-scoreboard" id="imposter-final-scoreboard" style="margin: 1.5rem 0;"></div>
      <p id="imposter-winner" style="font-size: 1.25rem; color: var(--text-primary); font-weight: bold; margin-top: 1rem;"></p>
      <div class="imposter-actions">
        <button type="button" class="btn" id="imposter-play-again">Play Again</button>
      </div>
    </div>
  </div>
</div>

<script src="{{ '/scripts/js/imposter.js' | relative_url }}"></script>