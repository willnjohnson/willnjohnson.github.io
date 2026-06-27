---
title: Alchemy!
layout: page
permalink: /apps/alchemy
stylesheet: alchemy
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="alchemy">
  <p>
  Select two emojis (same or different) on the board or within your recipe book to combine them. Discover and unlock new recipes!
  </p>
  <div class="alchemy-canvas-container" id="alchemy-canvas-container">
    <div id="alchemy-cy" class="alchemy-cy" role="img" aria-label="Alchemy board workspace"></div>
    
    <div id="alchemy-toast" class="alchemy-toast" aria-live="polite"></div>

    <button type="button" id="alchemy-fit-btn" aria-label="Fit diagram" title="Fit Layout View"><i class="fa-solid fa-expand"></i></button>
  </div>

  <aside class="alchemy-card" aria-label="Discovery Recipe Book">
    <div class="alchemy-tabs-container">
      <div class="alchemy-tabs">
        <button type="button" class="alchemy-tab active" data-tab="unlocked">Unlocked (<span id="count-unlocked">5</span>)</button>
        <button type="button" class="alchemy-tab" data-tab="locked">Locked (<span id="count-locked">0</span>)</button>
      </div>
      <button type="button" id="alchemy-reset-btn" class="alchemy-reset-text" title="Reset game layout progression">Reset Progress</button>
    </div>

    <div class="alchemy-tab-content active" id="pane-unlocked">
      <div class="alchemy-grid" id="grid-unlocked"></div>
    </div>

    <div class="alchemy-tab-content" id="pane-locked">
      <div class="alchemy-grid" id="grid-locked"></div>
    </div>
  </aside>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.26.0/cytoscape.min.js"></script>
<script src="{{ '/scripts/js/alchemy.js' | relative_url }}"></script>