---
title: Cache Locality Simulator
layout: page
permalink: /apps/cache-locality
stylesheet: cache-locality
---

<p><a href="/apps/">← Back to Apps</a></p>

<div id="cls-root" class="cls">
  <p>Visualize cache locality (hits, compulsory misses, capacity misses, and conflict misses).</p>
  <div class="cls-panel cls-panel--top">
    <h2>Configuration</h2>

    <!-- Kernel Operation -->
    <div class="cls-cfg-section">
      <div class="cls-cfg-label">Operation</div>
      <div class="cls-kernel-row" id="cls-kernel-row"></div>
    </div>

    <!-- Cache -->
    <div class="cls-cfg-section">
      <div class="cls-cfg-label">Cache</div>
      <div class="cls-cache-grid">
        <label>Cache size (KB)
          <input id="cls-cache-kb" type="number" value="1" min="1" max="8192">
        </label>
        <label>Block size (bytes)
          <input id="cls-block-bytes" type="number" value="32" min="4" max="512">
        </label>
        <label>Associativity
          <select id="cls-assoc">
            <option value="fa">Fully associative</option>
            <option value="dm">Direct-mapped</option>
            <option value="sa" selected>N-way set-associative</option>
          </select>
        </label>
        <label id="cls-ways-field">Ways (N)
          <input id="cls-ways" type="number" value="16" min="2" max="64">
        </label>
        <label>Data type
          <select id="cls-dtype">
            <option value="1">Byte — 1 byte</option>
            <option value="2">Short / Char — 2 bytes</option>
            <option value="4" selected>Int / Float — 4 bytes</option>
            <option value="8">Long / Double — 8 bytes</option>
          </select>
        </label>
        <label>Replacement policy
          <select id="cls-policy">
            <option value="lru" selected>LRU — least recently used</option>
            <option value="fifo">FIFO — first in, first out</option>
          </select>
        </label>
        <label class="cls-speed">Play Speed (ms)
          <input id="cls-speed" type="number" value="10" min="10" max="2000" step="10">
        </label>
      </div>
    </div>

    <!-- Loop dimensions -->
    <div class="cls-cfg-section">
      <div class="cls-cfg-label">Loop Dimensions</div>
      <div class="cls-dhdr">
        <span>var</span>
        <span>bound</span>
        <span>stride</span>
        <span>loop order</span>
        <span>index note</span>
        <span></span>
      </div>
      <div id="cls-dlist"></div>
      <button class="cls-addbtn" id="cls-addbtn">+ Add Dimension (max 6)</button>
    </div>

    <!-- Config summary line -->
    <div id="cls-config-summary" class="cls-config-summary"></div>
  </div>

  <div class="cls-panel cls-panel--code">
    <h2>Code Preview</h2>
    <div class="cls-code" id="cls-codewrap"></div>
  </div>

  <div class="cls-progress-wrap">
    <div class="cls-progress-bar">
      <div class="cls-progress-fill" id="cls-progress-fill"></div>
    </div>
    <span class="cls-progress-lbl" id="cls-progress-lbl">0 / 0</span>
  </div>

  <div id="cls-warn" class="cls-warn" style="display:none"></div>

  <div class="cls-panel">
    <h2>Miss Breakdown</h2>
    <div id="cls-bar-chart"></div>
  </div>

  <div class="cls-panel">
    <h2>Cache State <span id="cls-cache-desc" style="font-size:.8rem;font-weight:400;color:var(--text-tertiary)"></span></h2>
    <div style="overflow-x:auto">
      <table class="cls-cache-table" id="cls-cache-table"></table>
    </div>
  </div>

  <div class="cls-panel cls-panel--output">
    <h2>Access Log</h2>
    <pre id="cls-output" class="cls-output"></pre>
  </div>

  <div class="cls-floating-actions">
    <button class="btn"              id="cls-btn-reset">Reset (R)</button>
    <button class="btn"              id="cls-btn-step"  disabled>Step (S)</button>
    <button class="btn btn--success" id="cls-btn-play"  disabled>Play (P)</button>
    <button class="btn btn--danger"  id="cls-btn-stop"  disabled>Stop (X)</button>
  </div>

  <p style="text-align:center;margin-top:1rem">
    Created for UTK COSC530 Computer Organization.
  </p>

</div>

<script src="{{ '/scripts/js/cache-locality.js' | relative_url }}"></script>