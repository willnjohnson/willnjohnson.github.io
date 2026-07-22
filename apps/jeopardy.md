---
title: Jeopardy!
layout: page
permalink: /apps/jeopardy
stylesheet: jeopardy
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="jeopardy" id="jeopardy-app">
  <p>
    A classroom-ready Jeopardy! board. Play the default Computer Science trivia game, or build your own in the Game Builder and export it as JSON to share or reuse. Team-based scoring, optional Daily Doubles, and a Final Jeopardy wagering round included.
  </p>

  <div class="jp-tabs">
    <button type="button" class="jp-tab active" data-tab="play">Play</button>
    <button type="button" class="jp-tab" data-tab="editor">Game Builder</button>
  </div>

  <div class="jp-tab-content active" id="jp-pane-play">

    <!-- Screen 1: choose a game -->
    <div id="jp-select">
      <div class="jp-panel">
        <h2>Default Game</h2>
        <div class="jp-game-grid" id="jp-default-game"></div>
      </div>

      <div class="jp-panel">
        <div class="jp-select-header">
          <h2>My Games</h2>
          <button type="button" id="jp-import-btn" class="jp-link-btn">Import JSON</button>
        </div>
        <div class="jp-game-grid" id="jp-custom-games"></div>
        <p class="jp-empty-note" id="jp-custom-empty">No custom games yet. Build one in the Game Builder, or import a JSON file.</p>
      </div>
    </div>

    <!-- Screen 2: team setup -->
    <div id="jp-setup" class="jp-hidden">
      <div class="jp-panel">
        <button type="button" class="jp-link-btn" id="jp-setup-back">← Games</button>
        <h2 id="jp-setup-title"></h2>

        <div class="jp-field-row">
          <label class="jp-field-label">Number of teams</label>
          <div class="jp-team-count" id="jp-team-count"></div>
        </div>

        <div class="jp-field-row" id="jp-team-names"></div>

        <label class="jp-checkbox-row">
          <input type="checkbox" id="jp-setup-dd" />
          Enable Daily Doubles
        </label>

        <button type="button" class="btn" id="jp-setup-start">Start Game</button>
      </div>
    </div>

    <!-- Screen 3: board -->
    <div id="jp-board-screen" class="jp-hidden">
      <div class="jp-scoreboard" id="jp-scoreboard"></div>

      <div class="jp-board-wrap">
        <div class="jp-board" id="jp-board"></div>
      </div>

      <div class="jp-board-actions">
        <button type="button" id="jp-quit-btn" class="jp-link-btn">Abandon Game</button>
        <button type="button" id="jp-goto-final-btn" class="btn jp-hidden">Continue to Final Jeopardy →</button>
      </div>
    </div>

    <!-- Screen 4: final jeopardy -->
    <div id="jp-final-screen" class="jp-hidden">
      <div class="jp-panel jp-final-panel">
        <h2>Final Jeopardy!</h2>
        <p class="jp-final-category" id="jp-final-category"></p>

        <div id="jp-final-wager-phase">
          <p class="jp-hint">Each team wagers before the clue is revealed. A team may wager anywhere from 0 up to its current score.</p>
          <div id="jp-final-wager-list"></div>
          <button type="button" class="btn" id="jp-final-lock-wagers">Lock In Wagers</button>
        </div>

        <div id="jp-final-question-phase" class="jp-hidden">
          <p class="jp-final-clue" id="jp-final-question"></p>
          <button type="button" class="btn" id="jp-final-reveal-answer">Reveal Answer</button>
        </div>

        <div id="jp-final-answer-phase" class="jp-hidden">
          <p class="jp-final-clue" id="jp-final-answer"></p>
          <div id="jp-final-grade-list"></div>
          <button type="button" class="btn" id="jp-final-show-results">Show Final Results</button>
        </div>
      </div>
    </div>

    <!-- Screen 5: results -->
    <div id="jp-results-screen" class="jp-hidden">
      <div class="jp-panel">
        <h2>Final Standings</h2>
        <div id="jp-results-list"></div>
        <div class="jp-result-actions">
          <button type="button" class="btn" id="jp-results-replay">Play Again</button>
          <button type="button" id="jp-results-back" class="jp-link-btn">Back to Games</button>
        </div>
      </div>
    </div>

    <!-- Clue modal -->
    <div class="jp-modal jp-hidden" id="jp-clue-modal">
      <div class="jp-modal-box jp-clue-box">
        <p class="jp-clue-meta" id="jp-clue-meta"></p>

        <div id="jp-clue-wager-phase" class="jp-hidden">
          <p class="jp-clue-daily-double">Daily Double!</p>
          <p id="jp-clue-wager-team"></p>
          <label class="jp-field-narrow jp-wager-field">
            Wager (<span id="jp-clue-wager-range"></span>)
            <input type="number" id="jp-clue-wager-input" min="0" value="0" />
          </label>
          <div class="jp-modal-actions">
            <button type="button" class="btn" id="jp-clue-wager-submit">Submit Wager</button>
          </div>
        </div>

        <div id="jp-clue-question-phase" class="jp-hidden">
          <p class="jp-clue-text" id="jp-clue-question"></p>
          <div class="jp-modal-actions">
            <button type="button" class="btn" id="jp-clue-reveal">Reveal Answer</button>
          </div>
        </div>

        <div id="jp-clue-answer-phase" class="jp-hidden">
          <p class="jp-clue-text" id="jp-clue-answer-text"></p>
          <div class="jp-clue-teams" id="jp-clue-team-buttons"></div>
          <div class="jp-modal-actions">
            <button type="button" id="jp-clue-close" class="jp-link-btn">No one got it — Close Clue</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="jp-tab-content" id="jp-pane-editor">
    <div class="jp-editor-layout">
      <div class="jp-panel jp-editor-main-panel">
        <div class="jp-field-row">
          <label>
            Game name
            <input type="text" id="jp-ed-game-name" />
          </label>
        </div>
        <label class="jp-checkbox-row">
          <input type="checkbox" id="jp-ed-dd-enabled" />
          Daily Doubles are enabled by default for this game (host can still toggle at setup)
        </label>

        <div class="jp-field-row">
          <label>
            Category
            <select id="jp-ed-cat-select"></select>
          </label>
          <button type="button" id="jp-ed-add-cat" class="jp-link-btn">+ Add Category</button>
          <button type="button" id="jp-ed-remove-cat" class="jp-link-btn">Remove Category</button>
        </div>

        <div class="jp-field-row">
          <label>
            Category name
            <input type="text" id="jp-ed-cat-name" />
          </label>
        </div>

        <div class="jp-clue-editor-list" id="jp-ed-clues"></div>

        <h2>Final Jeopardy</h2>
        <div class="jp-field-row">
          <label>
            Category
            <input type="text" id="jp-ed-fj-category" />
          </label>
        </div>
        <div class="jp-field-row">
          <label>
            Clue (shown to teams)
            <textarea id="jp-ed-fj-question" rows="2"></textarea>
          </label>
        </div>
        <div class="jp-field-row">
          <label>
            Expected response
            <input type="text" id="jp-ed-fj-answer" />
          </label>
        </div>

        <div class="jp-field-row jp-editor-actions">
          <button type="button" id="jp-ed-new" class="jp-link-btn">New Game</button>
          <button type="button" id="jp-ed-import" class="jp-link-btn">Import JSON</button>
          <select id="jp-ed-load-select"></select>
        </div>
        <div class="jp-field-row jp-editor-actions">
          <button type="button" class="btn" id="jp-ed-save">Save Game</button>
          <button type="button" id="jp-ed-delete" class="jp-link-btn">Delete Game</button>
          <button type="button" id="jp-ed-test" class="jp-link-btn">Test Play</button>
          <button type="button" id="jp-ed-export" class="jp-link-btn">Export Game JSON</button>
        </div>
        <textarea id="jp-ed-json-out" class="jp-json-out jp-hidden" readonly rows="8"></textarea>
      </div>
    </div>
  </div>

  <div class="jp-modal jp-hidden" id="jp-import-modal">
    <div class="jp-modal-box">
      <h2>Import Game JSON</h2>
      <p class="jp-hint">Paste a game (<code>{ "game_name", "daily_doubles_enabled", "categories": [...], "final_jeopardy": {...} }</code>). Or choose a file below.</p>
      <input type="file" id="jp-import-file" accept="application/json,.json" />
      <textarea id="jp-import-text" rows="10" placeholder='{"game_name": "My Game", "daily_doubles_enabled": true, "categories": [...], "final_jeopardy": {"category": "...", "question": "...", "answer": "..."}}'></textarea>
      <div class="jp-import-errors" id="jp-import-errors"></div>
      <div class="jp-modal-actions">
        <button type="button" class="btn" id="jp-import-submit">Import</button>
        <button type="button" id="jp-import-cancel" class="jp-link-btn">Cancel</button>
      </div>
    </div>
  </div>
  <br/>
</div>

<script src="{{ '/scripts/js/jeopardy-data.js' | relative_url }}"></script>
<script src="{{ '/scripts/js/jeopardy.js' | relative_url }}"></script>
