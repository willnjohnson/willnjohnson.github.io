---
title: Memory Hierarchy Simulator
layout: page
permalink: /apps/memhier/
stylesheet: memhier
---

<div id="memh-root" class="memh">

  <div class="memh-panel memh-panel--top">
    <h2>Configuration</h2>
    <div class="memh-controls">
      <label>trace.config
        <input id="config-file" type="file" accept="text/plain,.config,.txt">
      </label>
      <label>trace.dat
        <input id="trace-file" type="file" accept="text/plain,.dat,.txt">
      </label>
      <label class="memh-speed">Speed (ms)
        <input id="speed" type="number" value="500" min="50" step="50">
      </label>
    </div>
    <div id="config-summary" class="memh-config-summary"></div>
  </div>

  <div class="memh-dashboard-grid">
    
    <div class="memh-column-left">
      <div class="memh-panel memh-panel--visualizer">
        <h2>Memory Layout</h2>
        <div class="memh-current">
          <span id="current-access" class="memh-current-access"></span>
          <div class="memh-badges">
            <span id="badge-tlb" class="memh-badge">TLB: -</span>
            <span id="badge-pt" class="memh-badge">Page table: -</span>
            <span id="badge-dc" class="memh-badge">D-Cache: -</span>
            <span id="badge-l2" class="memh-badge">L2: -</span>
          </div>
        </div>

        <div class="memh-diagram-wrap">
          <svg id="memh-diagram" class="memh-diagram" viewBox="0 0 900 540" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path id="wire-cpu-tlb" class="wire" d="M 410 70 L 190 120"></path>
            <path id="wire-cpu-pt" class="wire" d="M 490 70 L 710 120"></path>
            <path id="wire-tlb-pt" class="wire" d="M 270 150 L 630 150"></path>
            <path id="wire-pt-disk" class="wire" d="M 790 150 L 830 150"></path>
            <path id="wire-tlb-dc" class="wire" d="M 190 180 L 410 230"></path>
            <path id="wire-pt-dc" class="wire" d="M 710 180 L 490 230"></path>
            <path id="wire-dc-l2" class="wire" d="M 450 290 L 450 340"></path>
            <path id="wire-l2-mem" class="wire" d="M 450 400 L 450 450"></path>
            <path id="wire-dc-mem" class="wire" d="M 530 260 C 660 260, 660 480, 550 480"></path>

            <g id="box-cpu" class="box"><rect x="370" y="10" width="160" height="60" rx="10"></rect><text x="450" y="45">CPU</text></g>
            <g id="box-tlb" class="box"><rect x="110" y="120" width="160" height="60" rx="10"></rect><text x="190" y="155">TLB</text></g>
            <g id="box-pagetable" class="box"><rect x="630" y="120" width="160" height="60" rx="10"></rect><text x="710" y="155">Page Table</text></g>
            <g id="box-disk" class="box box--small"><rect x="830" y="130" width="60" height="40" rx="8"></rect><text x="860" y="155" class="small">Disk</text></g>
            <g id="box-dcache" class="box"><rect x="370" y="230" width="160" height="60" rx="10"></rect><text x="450" y="265">D-Cache</text></g>
            <g id="box-l2" class="box"><rect x="370" y="340" width="160" height="60" rx="10"></rect><text x="450" y="375">L2 Cache</text></g>
            <g id="box-memory" class="box"><rect x="350" y="450" width="200" height="60" rx="10"></rect><text x="450" y="485">Main Memory</text></g>
          </svg>
        </div>
      </div>
    </div>

    <div class="memh-column-right">
      <div class="memh-tabs-nav" role="tablist">
        <div class="memh-nav-row">
          <button class="memh-tab-btn active" data-tab="tab-breakdown" role="tab">Addr. Breakdown</button>
          <button class="memh-tab-btn" data-tab="tab-tlb" role="tab">TLB</button>
          <button class="memh-tab-btn" data-tab="tab-pt" role="tab">Page Table</button>
          <button class="memh-tab-btn" data-tab="tab-dc" role="tab">D-Cache</button>
        </div>
        <div class="memh-nav-row">
          <button class="memh-tab-btn" data-tab="tab-l2" role="tab">L2 Cache</button>
          <button class="memh-tab-btn" data-tab="tab-mem" role="tab">Main Memory</button>
          <button class="memh-tab-btn" data-tab="tab-stats" role="tab">Sim. Statistics</button>
        </div>
      </div>

      <div class="memh-tabs-content">
        <div id="tab-breakdown" class="memh-tab-panel active" role="tabpanel">
          <h3>Address Breakdown</h3>
          <div id="breakdown" class="memh-breakdown"></div>
        </div>
        <div id="tab-tlb" class="memh-tab-panel" role="tabpanel">
          <h3>TLB Translation Matrix</h3>
          <div id="tlb-contents" class="memh-table-wrap"></div>
        </div>
        <div id="tab-pt" class="memh-tab-panel" role="tabpanel">
          <h3>Page Table Mappings</h3>
          <div id="pt-contents" class="memh-table-wrap"></div>
        </div>
        <div id="tab-dc" class="memh-tab-panel" role="tabpanel">
          <h3>D-Cache Line State</h3>
          <div id="dc-contents" class="memh-table-wrap"></div>
        </div>
        <div id="tab-l2" class="memh-tab-panel" role="tabpanel">
          <h3>L2 Cache Secondary Matrix</h3>
          <div id="l2-contents" class="memh-table-wrap"></div>
        </div>
        <div id="tab-mem" class="memh-tab-panel" role="tabpanel">
          <h3>Physical Page Memory Array</h3>
          <div id="mem-contents" class="memh-table-wrap"></div>
        </div>
        <div id="tab-stats" class="memh-tab-panel" role="tabpanel">
          <h3>Simulation Metrics</h3>
          <div id="stats" class="memh-table-wrap"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="memh-panel memh-panel--notes">
    <h3>What's happening</h3>
    <ul id="step-notes" class="memh-notes"></ul>
  </div>

  <div class="memh-panel memh-panel--log">
    <h3>System Trace Log</h3>
    <pre id="log" class="memh-log"></pre>
  </div>

  <div class="memh-floating-actions">
    <button class="btn" id="start-btn" disabled>Reset (R)</button>
    <button class="btn" id="step-btn" disabled>Step (S)</button>
    <button class="btn btn--success" id="play-btn" disabled>Play (P)</button>
    <button class="btn btn--danger" id="stop-btn" disabled>Stop (X)</button>
  </div>

  <p style="text-align: center;">
    Created for UTK COSC530 Computer Organization. 
    <a href="/guides/memhier/m01.00.01/">Guide here</a> for those who are lost.
  </p>

</div>

<script src="{{ '/scripts/js/memhier.js' | relative_url }}"></script>