---
title: Branch Predictor Visualizer
layout: page
permalink: /apps/branch-predictor
stylesheet: branch-predictor
---

<p><a href="/apps/">← Back to Apps</a></p>

<div id="bp-root" class="bp">
  <p>Visualize branch prediction via state machines.</p>
  <div class="bp-panel bp-panel--top">
    <h3>Architecture & Logic</h3>
    <div class="bp-control-grid">
      
      <div class="bp-column-block">
        <label for="bp-code-input">Simulation Code (JavaScript)</label>
        <textarea id="bp-code-input" spellcheck="false">
let count = 0;

for (let n = 2; n <= 100; n++) {
    let isPrime = true;

    for (let d = 2; d * d <= n; d++) {
        if (n % d === 0) {
            isPrime = false;
            break;
        }
    }

    if (isPrime) {
        count++;
    }
}
        </textarea>

        <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.15rem; margin-bottom: 0.5rem;">
          <label style="margin-bottom: 0;">Inversion Rule (e.g. == resolves to a BNE instruction under Assembly)</label>
          <div style="display: flex; gap: 15px; align-items: center; color: var(--text-primary);">
            <label style="display: inline-flex; align-items: center; gap: 6px; margin: 0; text-transform: none; font-weight: 500; font-size: 0.85rem; cursor: pointer; color: var(--text-primary);">
              <input type="checkbox" id="bp-invert-if" checked style="width: auto; margin: 0; cursor: pointer;"> If Statements
            </label>
            <label style="display: inline-flex; align-items: center; gap: 6px; margin: 0; text-transform: none; font-weight: 500; font-size: 0.85rem; cursor: pointer; color: var(--text-primary);">
              <input type="checkbox" id="bp-invert-loop" style="width: auto; margin: 0; cursor: pointer;"> For Loops
            </label>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <label for="bp-play-speed" style="display: block; margin-bottom: 0.25rem;">Play Speed (ms)</label>
          <input type="number" id="bp-play-speed" class="bp-select" style="margin: 0; padding: 4px; width: 70px;" value="10" min="1" max="10000">
        </div>

        <button class="btn" id="bp-btn-load" style="align-self: flex-start;">Reload</button>
      </div>

      <div class="bp-column-block">
        <label for="bp-architecture">Predictor Architecture</label>
        <select id="bp-architecture" class="bp-select" style="margin-bottom: 0.5rem;">
          <option value="1bit">1-Bit Saturating Counter</option>
          <option value="2bit" selected>2-Bit Saturating Counter</option>
          <option value="mn_correlating">Correlating (m, n) Predictor</option>
          <option value="gshare">GShare Predictor</option>
        </select>

        <div style="display: flex; gap: 10px; margin-bottom: 0.75rem;">
          <label>m: <input type="number" id="bp-m-bits" class="bp-select" style="margin: 0; padding: 4px; width: 60px;" value="0" min="0" max="8"></label>
          <label>n: <input type="number" id="bp-n-bits" class="bp-select" style="margin: 0; padding: 4px; width: 60px;" value="2" min="1" max="2"></label>
        </div>

        <div id="bp-branch-options"></div>

        <div class="metrics-panel">
          <label style="margin-top: 0.5rem;">Predictor State</label>
          <div id="bp-state-display" style="margin-top: 0.25rem;"></div>
        </div>
      </div>

    </div>
  </div>

  <div class="bp-canvas-container" id="bp-canvas-container">
    <div id="bp-cy" class="bp-cy"></div>
    <button type="button" class="bp-fit-btn" id="bp-fit-btn" title="Fit Diagram">
      <i class="fa-solid fa-expand"></i>
    </button>
  </div>

  <div class="bp-floating-actions">
    <button class="btn" id="bp-btn-reset">Reset (R)</button>
    <button class="btn" id="bp-btn-step">Step (S)</button>
    <button class="btn btn--success" id="bp-btn-play">Play (P)</button>
    <button class="btn btn--danger" id="bp-btn-stop" disabled>Stop (X)</button>
  </div>

  <p style="text-align:center;margin-top:1rem">
    Created for UTK COSC530 Computer Organization.
  </p>

</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/acorn/8.10.0/acorn.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.26.0/cytoscape.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js"></script>
<script src="{{ '/scripts/js/branch-predictor.js' | relative_url }}"></script>