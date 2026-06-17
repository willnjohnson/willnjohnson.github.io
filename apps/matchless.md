---
layout: page
title: Matchless!
stylesheet: matchless
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="matchless" id="matchless-app">
  <div id="matchless-setup">
    <div class="matchless-panel">
      <h2>How to Play</h2>
      <ul class="matchless-rules">
        <li><strong>Player 1 is the host.</strong> You need at least 3 players (1 host + 2 contestants), up to 12 total.</li>
        <li>A category is shown — animals, planets, countries, and more.</li>
        <li>The host enters a word in that category. Add trailing <strong>.</strong> characters to disguise the length — e.g. <code>cat..........</code> (dots are not counted as part of the word).</li>
        <li>Each remaining player comes up with their own word in that category and enters it.</li>
        <li>If a player's word <strong>matches the host's word</strong>, that player is eliminated. Matching ignores case and non-letters.</li>
        <li>Play round after round until only one player is left standing — they win!</li>
      </ul>
    </div>

    <div class="matchless-panel">
      <h2>Players</h2>
      <label for="matchless-player-count">Number of players (3–12)</label>
      <input type="number" id="matchless-player-count" min="3" max="12" value="3" />

      <div class="matchless-players" id="matchless-player-fields"></div>

      <div class="matchless-actions">
        <button type="button" class="btn" id="matchless-begin">Begin Game</button>
      </div>
    </div>
  </div>

  <div id="matchless-game" class="matchless-hidden">
    <div class="matchless-roster" id="matchless-roster"></div>

    <div class="matchless-panel">
      <p class="matchless-category" id="matchless-category">Animals</p>
      <p class="matchless-status" id="matchless-status"></p>

      <div id="matchless-round-form">
        <div class="matchless-host-field">
          <label for="matchless-host-word">Host's secret word</label>
          <input
            type="password"
            id="matchless-host-word"
            autocomplete="new-password"
            autocapitalize="off"
            spellcheck="false"
            placeholder="secret word.........."
          />
          <p class="matchless-footnote">
            Tip: add trailing dots to hide your word length — e.g. <code>cat..........</code>. Dots are ignored when checking the word.
          </p>
        </div>

        <div class="matchless-player-words" id="matchless-player-words"></div>

        <div class="matchless-actions">
          <button type="button" class="btn" id="matchless-reveal">Reveal &amp; Check</button>
        </div>
      </div>

      <div id="matchless-round-result" class="matchless-hidden">
        <div class="matchless-result-box" id="matchless-result-text"></div>
        <div class="matchless-actions">
          <button type="button" class="btn" id="matchless-next-round">Next Round</button>
          <button type="button" class="btn matchless-hidden" id="matchless-finish">Finish Game</button>
        </div>
      </div>
    </div>
  </div>

  <div id="matchless-over" class="matchless-hidden">
    <div class="matchless-panel" style="text-align: center;">
      <h2>Game Over</h2>
      <p id="matchless-winner" class="matchless-winner-text"></p>
      <div class="matchless-actions">
        <button type="button" class="btn" id="matchless-play-again">Play Again</button>
      </div>
    </div>
  </div>
</div>

<script src="{{ '/scripts/js/matchless.js' | relative_url }}"></script>
