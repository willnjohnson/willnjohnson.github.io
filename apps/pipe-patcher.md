---
title: Pipe Patcher ৻( •̀ ᗜ •́ ৻)
layout: page
permalink: /apps/pipe-patcher
stylesheet: pipe-patcher
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="pipe-patcher" id="pipe-patcher-app">
  <p>
    Patch the pipes! Place the highlighted piece on an open cell to extend your network from source to drain. Note: Pieces that never connect drag your score down, so discard the ones that don't fit instead of dumping them as dead weight.
  </p>

  <div class="pp-tabs">
    <button type="button" class="pp-tab active" data-tab="play">Play</button>
    <button type="button" class="pp-tab" data-tab="editor">Level Editor</button>
  </div>

  <div class="pp-tab-content active" id="pp-pane-play">
    <div id="pp-play-select">
      <div class="pp-panel">
        <div class="pp-select-header">
          <h2>Campaign</h2>
          <div class="pp-campaign-score">
            Score: <strong id="pp-campaign-score">0</strong>
            <button type="button" id="pp-campaign-reset" class="pp-link-btn">reset</button>
          </div>
        </div>
        <div class="pp-level-grid" id="pp-default-levels"></div>
      </div>

      <div class="pp-panel">
        <div class="pp-select-header">
          <h2>My Levels</h2>
          <div class="pp-header-actions">
            <span class="pp-campaign-score">Score: <strong id="pp-custom-score">0</strong></span>
            <button type="button" id="pp-campaign-delete" class="pp-link-btn">Delete Campaign</button>
            <button type="button" id="pp-custom-reset" class="pp-link-btn">reset progress</button>
            <button type="button" id="pp-import-btn" class="pp-link-btn">Import JSON</button>
          </div>
        </div>
        <div class="pp-field-row">
          <select id="pp-campaign-select"></select>
        </div>
        <div class="pp-level-grid" id="pp-custom-levels"></div>
        <p class="pp-empty-note" id="pp-custom-empty">No custom campaigns yet. Build one in the Level Editor, or import a JSON file.</p>
      </div>
    </div>

    <div id="pp-play-game" class="pp-hidden">
      <div class="pp-game-header">
        <button type="button" class="pp-link-btn" id="pp-game-back">← Levels</button>
        <h2 id="pp-game-title"></h2>
        <div class="pp-game-stats">
          <span>Discards left: <strong id="pp-discards">0</strong></span>
          <span id="pp-live-stats"></span>
          <button type="button" class="pp-link-btn" id="pp-discard-btn">Discard Piece</button>
          <button type="button" class="pp-link-btn" id="pp-restart-btn">Restart</button>
        </div>
      </div>

      <div class="pp-board-wrap">
        <div class="pp-board" id="pp-board"></div>
      </div>

      <div class="pp-queue-row">
        <div class="pp-queue" id="pp-queue"></div>
      </div>

      <div class="pp-result pp-hidden" id="pp-result">
        <div class="pp-result-box">
          <h3 id="pp-result-title"></h3>
          <p id="pp-result-text"></p>
          <div class="pp-result-actions" id="pp-result-actions"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="pp-tab-content" id="pp-pane-editor">
    <div class="pp-editor-layout">
      <div class="pp-panel pp-editor-board-panel">
        <div class="pp-field-row">
          <label>
            Campaign name
            <input type="text" id="pp-ed-campaign-name" />
          </label>
        </div>
        <label class="pp-checkbox-row">
          <input type="checkbox" id="pp-ed-campaign-progression" />
          Progression-only! Lock each level in this campaign until the previous one is completed
        </label>

        <div class="pp-field-row">
          <label>
            Level in this campaign
            <select id="pp-ed-level-select"></select>
          </label>
          <button type="button" id="pp-ed-add-level" class="pp-link-btn">+ Add Level</button>
          <button type="button" id="pp-ed-remove-level" class="pp-link-btn">Remove Level</button>
        </div>

        <div class="pp-field-row">
          <label>
            Level name
            <input type="text" id="pp-ed-name" />
          </label>
        </div>

        <div class="pp-field-row">
          <label class="pp-field-narrow">
            Rows
            <input type="number" id="pp-ed-rows" min="3" max="20" value="5" />
          </label>
          <label class="pp-field-narrow">
            Cols
            <input type="number" id="pp-ed-cols" min="3" max="20" value="5" />
          </label>
          <button type="button" id="pp-ed-resize" class="pp-link-btn">Resize Grid</button>
        </div>

        <p class="pp-hint">Pick a tool, then click cells to paint them. With the <strong>Empty</strong> tool selected, targeting an outer wall shapes it into a source or drain for you instead of clearing it (max 2), one source and one drain. Corner walls can't become a source/drain or be cleared at all; they stay walls. No pipe shape can replace an outer wall directly; place one back to <strong>Wall</strong> to remove a source/drain.</p>

        <div class="pp-tool-palette" id="pp-ed-palette"></div>

        <div class="pp-board-wrap">
          <div class="pp-board pp-board--editor" id="pp-ed-grid"></div>
        </div>
        <p class="pp-terminal-status" id="pp-ed-terminal-status"></p>

        <div class="pp-field-row pp-editor-actions">
          <button type="button" id="pp-ed-new" class="pp-link-btn">New Campaign</button>
          <button type="button" id="pp-ed-import" class="pp-link-btn">Import JSON</button>
          <select id="pp-ed-load-select"></select>
        </div>
        <div class="pp-field-row pp-editor-actions">
          <button type="button" class="btn" id="pp-ed-save">Save Campaign</button>
          <button type="button" id="pp-ed-delete" class="pp-link-btn">Delete Campaign</button>
          <button type="button" id="pp-ed-test" class="pp-link-btn">Test Play</button>
          <button type="button" id="pp-ed-export" class="pp-link-btn">Export Campaign JSON</button>
        </div>
        <textarea id="pp-ed-json-out" class="pp-json-out pp-hidden" readonly rows="8"></textarea>
      </div>

      <div class="pp-panel pp-editor-side-panel">
        <h2>Piece Weights</h2>
        <p class="pp-hint">How often each piece can be drawn into the queue. 0 = never drawn.</p>
        <div class="pp-weight-list" id="pp-ed-weights"></div>

        <h2>Discards</h2>
        <label class="pp-field-narrow">
          Total discards
          <input type="number" id="pp-ed-discards" min="0" value="5" />
        </label>

        <h2>Starting Pipes</h2>
        <p class="pp-hint">Pieces guaranteed to appear first, in this order, before random draws take over.</p>
        <div class="pp-field-row">
          <select id="pp-ed-start-select"></select>
          <button type="button" id="pp-ed-start-add" class="pp-link-btn">Add</button>
        </div>
        <div class="pp-chip-list" id="pp-ed-start-list"></div>
      </div>
    </div>
  </div>

  <div class="pp-modal pp-hidden" id="pp-import-modal">
    <div class="pp-modal-box">
      <h2>Import Campaign JSON</h2>
      <p class="pp-hint">Paste a campaign (<code>{ "campaign_name", "progression_only", "levels": {...} }</code>) — a single level or a bare array of levels also works and becomes its own campaign. Or choose a file below.</p>
      <input type="file" id="pp-import-file" accept="application/json,.json" />
      <textarea id="pp-import-text" rows="10" placeholder='{"campaign_name": "My Campaign", "progression_only": false, "levels": {"1": {"mapName": "My Level", "map": ["OOOOO", "O   O", "─   ─", "O   O", "OOOOO"], "pipes": {"|": 1, "─": 2}, "totalDiscards": 5}}}'></textarea>
      <div class="pp-import-errors" id="pp-import-errors"></div>
      <div class="pp-modal-actions">
        <button type="button" class="btn" id="pp-import-submit">Import</button>
        <button type="button" id="pp-import-cancel" class="pp-link-btn">Cancel</button>
      </div>
    </div>
  </div>
</div>

<script src="{{ '/scripts/js/pipe-patcher-data.js' | relative_url }}"></script>
<script src="{{ '/scripts/js/pipe-patcher.js' | relative_url }}"></script>
