---
title: Pixie Compiler
layout: page
permalink: /apps/pixie
stylesheet: pixie
---

<p><a href="/apps/">← Back to Apps</a></p>

<div id="pixie-root" class="pixie">
  <p>Pixie is a tiny game-scripting language that compiles to JavaScript in your browser. Pick a game, poke at the source, then press <strong>Run</strong> to play it. Want to learn the language? Read the <a href="/guides/pixie/m01.00.01/">Pixie guide</a>.</p>

  <div class="pixie-grid">

    <div class="pixie-panel pixie-panel--editor">
      <div class="pixie-toolbar">
        <h2>Editor</h2>
        <div class="pixie-toolbar-actions">
          <select id="pixie-game-select" aria-label="Choose a game">
            <option value="snake">snake.pixie</option>
            <option value="tetris">tetris.pixie</option>
          </select>
          <button id="pixie-run-btn" class="btn">▶ Run</button>
        </div>
      </div>

      <div class="pixie-editor-body">
        <div id="pixie-gutter" class="pixie-gutter" aria-hidden="true"></div>
        <div class="pixie-code-wrap">
          <pre id="pixie-highlight" class="pixie-highlight" aria-hidden="true"></pre>
          <textarea id="pixie-code" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" aria-label="Pixie source code"></textarea>
        </div>
      </div>

      <div id="pixie-statusbar" class="pixie-statusbar">
        <span id="pixie-status-msg">Loading…</span>
        <span id="pixie-cursor-pos">Ln 1, Col 1</span>
      </div>
    </div>

    <div class="pixie-panel pixie-panel--preview">
      <div class="pixie-toolbar">
        <h2>Game</h2>
      </div>
      <div class="pixie-preview-body">
        <iframe id="pixie-preview" sandbox="allow-scripts" title="Pixie game preview"></iframe>
      </div>
    </div>

  </div>
</div>

<script src="{{ '/pixie/pixie-compiler.js' | relative_url }}"></script>
<script src="{{ '/pixie/pixie-highlighter.js' | relative_url }}"></script>
<script src="{{ '/scripts/js/pixie.js' | relative_url }}"></script>
