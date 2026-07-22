---
title: Emoji Tower Defense
layout: page
permalink: /apps/emojitd
stylesheet: emojitd
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="emojitd" id="emojitd-app">
  <p>
    Defend the base from 24 waves of invaders! Build Huts 🛖 on the grass, upgrade them into elemental fortresses or ranged specialists, and hold the line against snails, skeletons, zombies, and six emoji bosses, ending with a Dragon 🐉.
  </p>

  <!-- Start screen -->
  <div id="etd-start-screen">
    <div class="etd-panel etd-start-panel">
      <h2>How to play</h2>
      <ul class="etd-rules">
        <li><span class="etd-tile-swatch etd-tile-swatch--grass"></span> Grass tiles are buildable. <span class="etd-tile-swatch etd-tile-swatch--path"></span> The path is where enemies walk, so you can't build there. 🌳 Trees block a few grass tiles too.</li>
        <li>🛖 Hut is your only starting building. Select a placed tower to upgrade it into a 🏛️ Temple (then 🏯 Fortress / 🌋 Volcano Fortress / 🏔️ Snowy Fortress) or straight into a 🏹 Arch Tower / 🗼 Watchtower.</li>
        <li>🔥 Fire burns over time, ⚡ lightning hits multiple enemies, ❄️ ice slows them down, and 🏹 arrows strike from very long range.</li>
        <li>👻 Ghosts are invisible to everything except a 🗼 Watchtower's detection range. Bosses each bring their own trick, so good luck!</li>
      </ul>
      <p class="etd-hint">Best wave reached: <strong id="etd-start-best">0</strong> / 24</p>
      <button type="button" class="btn" id="etd-start-btn">Start Game</button>
    </div>
  </div>

  <!-- Game screen -->
  <div id="etd-game-screen" class="etd-hidden">
    <div class="etd-hud">
      <div class="etd-hud-stats">
        <span>💰 <strong id="etd-gold">0</strong></span>
        <span>❤️ <strong id="etd-lives">0</strong></span>
        <span>🌊 Wave <strong id="etd-wave-label">0 / 24</strong></span>
      </div>
      <div class="etd-hud-actions">
        <button type="button" class="etd-link-btn" id="etd-speed-btn">1x Speed</button>
        <button type="button" class="etd-link-btn" id="etd-pause-btn">Pause</button>
        <label class="etd-checkbox-row">
          <input type="checkbox" id="etd-auto-toggle" />
          Auto-start waves
        </label>
        <button type="button" class="etd-link-btn" id="etd-menu-btn">Menu</button>
      </div>
    </div>

    <div class="etd-build-palette" id="etd-build-palette"></div>

    <div class="etd-play-row">
      <div class="etd-board-col">
        <div class="etd-board-wrap">
          <div class="etd-board" id="etd-board"></div>
          <div class="etd-overlay" id="etd-overlay"></div>
        </div>
      </div>

      <div class="etd-side-col">
        <button type="button" class="btn etd-wave-btn" id="etd-wave-btn">Start Wave 1</button>
        <h3 class="etd-side-heading">Battle Log</h3>
        <div class="etd-log" id="etd-log"></div>
      </div>
    </div>

    <!-- Tower info / upgrade panel: floats next to whichever tower is selected -->
    <div class="etd-tower-panel etd-hidden" id="etd-tower-panel">
      <button type="button" class="etd-tp-close" id="etd-tp-close">✕</button>
      <div class="etd-tp-header">
        <span class="etd-tp-emoji" id="etd-tp-emoji"></span>
        <span class="etd-tp-name" id="etd-tp-name"></span>
      </div>
      <p class="etd-tp-desc" id="etd-tp-desc"></p>
      <p class="etd-tp-stats" id="etd-tp-stats"></p>
      <div class="etd-tp-upgrades" id="etd-tp-upgrades"></div>
      <button type="button" class="etd-link-btn etd-tp-sell" id="etd-tp-sell">Sell</button>
    </div>
  </div>

  <!-- Win / lose modal -->
  <div class="etd-modal etd-hidden" id="etd-modal">
    <div class="etd-modal-box">
      <h2 id="etd-modal-title"></h2>
      <p id="etd-modal-text"></p>
      <div class="etd-modal-actions">
        <button type="button" class="btn" id="etd-modal-restart">Play Again</button>
        <button type="button" class="etd-link-btn" id="etd-modal-menu">Back to Menu</button>
      </div>
    </div>
  </div>
</div>

<script src="{{ '/scripts/js/emojitd-data.js' | relative_url }}"></script>
<script src="{{ '/scripts/js/emojitd.js' | relative_url }}"></script>
