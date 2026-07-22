---
title: Ambience
layout: page
permalink: /apps/ambience
stylesheet: ambience
---

<p><a href="/apps/">← Back to Apps</a></p>

<div id="amb-root" class="amb">
  <p>A small noise generator for focus. Everything is synthesized live in the browser with the Web Audio API (no actual audio files involved).</p>
  <div class="amb-panel amb-panel--master">
    <div class="amb-master-row">
      <button type="button" id="amb-play-btn" class="btn btn--success">▶ Play</button>
      <label class="amb-master-label">Master Volume
        <input type="range" id="amb-master" min="0" max="100" value="80">
      </label>
      <span class="amb-pct" id="amb-master-pct">80%</span>
    </div>
    <div class="amb-presets">
      <span class="amb-presets-label">Presets:</span>
      <button type="button" class="amb-preset-btn" data-preset="rainy">Rainy Night</button>
      <button type="button" class="amb-preset-btn" data-preset="cozy">Cozy Fire</button>
      <button type="button" class="amb-preset-btn" data-preset="focus">Deep Focus</button>
      <button type="button" class="amb-preset-btn" data-preset="countryside">Countryside</button>
      <button type="button" class="amb-preset-btn" data-preset="commute">Commute</button>
      <button type="button" class="amb-preset-btn" data-preset="meditation">Meditation</button>
      <button type="button" class="amb-preset-btn" data-preset="lofistudy">Lofi Study</button>
      <button type="button" class="amb-preset-btn" data-preset="enchanted">Enchanted</button>
      <button type="button" class="amb-preset-btn amb-preset-btn--clear" data-preset="clear">Clear</button>
    </div>
  </div>

  <div class="amb-grid" id="amb-grid">

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-wave-square"></i><span>White Noise</span><span class="amb-pct" id="amb-pct-white">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-white" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-water"></i><span>Brown Noise</span><span class="amb-pct" id="amb-pct-brown">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-brown" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-cloud-rain"></i><span>Rain</span><span class="amb-pct" id="amb-pct-rain">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-rain" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-train"></i><span>Train</span><span class="amb-pct" id="amb-pct-train">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-train" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-keyboard"></i><span>Typing</span><span class="amb-pct" id="amb-pct-typing">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-typing" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-fire"></i><span>Fireplace</span><span class="amb-pct" id="amb-pct-fireplace">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-fireplace" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-wind"></i><span>Wind</span><span class="amb-pct" id="amb-pct-wind">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-wind" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-bolt"></i><span>Thunder</span><span class="amb-pct" id="amb-pct-thunder">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-thunder" min="0" max="100" value="0">
      <div class="amb-subrow">
        <label class="amb-sublabel" for="amb-freq-thunder">Frequency</label>
        <input type="range" class="amb-slider amb-slider--freq" id="amb-freq-thunder" min="0" max="100" value="50">
        <span class="amb-pct" id="amb-freqpct-thunder">50%</span>
      </div>
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-dove"></i><span>Birds</span><span class="amb-pct" id="amb-pct-birds">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-birds" min="0" max="100" value="0">
      <div class="amb-subrow">
        <label class="amb-sublabel" for="amb-freq-birds">Frequency</label>
        <input type="range" class="amb-slider amb-slider--freq" id="amb-freq-birds" min="0" max="100" value="50">
        <span class="amb-pct" id="amb-freqpct-birds">50%</span>
      </div>
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-moon"></i><span>Ethereal</span><span class="amb-pct" id="amb-pct-ethereal">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-ethereal" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-brain"></i><span>Binaural Beats</span><span class="amb-pct" id="amb-pct-binaural">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-binaural" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-record-vinyl"></i><span>Lofi Drums</span><span class="amb-pct" id="amb-pct-lofi">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-lofi" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-bell"></i><span>Wind Chimes</span><span class="amb-pct" id="amb-pct-chimes">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-chimes" min="0" max="100" value="0">
    </div>

    <div class="amb-card">
      <div class="amb-card-head"><i class="fa-solid fa-bug"></i><span>Crickets</span><span class="amb-pct" id="amb-pct-crickets">0%</span></div>
      <input type="range" class="amb-slider" id="amb-slider-crickets" min="0" max="100" value="0">
    </div>
  </div>
</div>

<script src="{{ '/scripts/js/ambience.js' | relative_url }}"></script>
