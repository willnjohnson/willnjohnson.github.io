---
title: Speculative Dynamically Scheduled Pipeline Simulator
layout: page
permalink: /apps/dynamsched
stylesheet: dynamsched
---

<p><a href="/apps/">← Back to Apps</a></p>

<div id="dysc-root" class="dysc">
  <p>Download <a href="/resources/test_cases_dyn.tar.gz">test cases</a> containing various config.txt and trace.dat files. Traces use RISC-V-style instructions; loads and stores carry their data memory address after a colon, e.g. <code>lw x3,4(x3):0</code>.</p>
  <p>For a review of different hazards, see <a href="/apps/dependency">Dependency Analyzer</a>.</p>
  <div class="dysc-panel dysc-panel--top">
    <h2>Configuration</h2>
    <div class="dysc-controls">
      <label>config.txt
        <input id="config-file" type="file" accept="text/plain,.config,.txt">
      </label>
      <label>trace.dat
        <input id="trace-file" type="file" accept="text/plain,.dat,.txt">
      </label>
      <label class="dysc-speed">Play Speed (ms)
        <input id="speed" type="number" value="500" min="50" step="50">
      </label>
    </div>
    <div id="config-summary" class="dysc-config-summary"></div>
  </div>

  <div class="dysc-dashboard-grid">

    <div class="dysc-column-left">
      <div class="dysc-panel dysc-panel--visualizer">
        <h2>Tomasulo Datapath</h2>
        <div class="dysc-current">
          <span id="current-cycle" class="dysc-current-cycle"></span>
          <div class="dysc-badges">
            <span id="badge-issue" class="dysc-badge">Issue: -</span>
            <span id="badge-exec" class="dysc-badge">Exec: -</span>
            <span id="badge-mem" class="dysc-badge">Mem: -</span>
            <span id="badge-cdb" class="dysc-badge">CDB: -</span>
            <span id="badge-commit" class="dysc-badge">Commit: -</span>
          </div>
        </div>

        <div class="dysc-diagram-wrap">
          <svg id="dysc-diagram" class="dysc-diagram" viewBox="0 0 900 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Issue wires -->
            <path id="wire-iq-rob" class="wire" d="M 220 50 L 640 50"></path>
            <path id="wire-iq-effaddr" class="wire" d="M 110 80 L 110 190"></path>
            <path id="wire-iq-fpadd" class="wire" d="M 140 80 L 340 190"></path>
            <path id="wire-iq-fpmul" class="wire" d="M 170 80 L 550 190"></path>
            <path id="wire-iq-int" class="wire" d="M 200 80 L 755 190"></path>
            <!-- Memory wires -->
            <path id="wire-effaddr-mem" class="wire" d="M 110 250 L 110 290"></path>
            <path id="wire-mem-cdb" class="wire" d="M 110 345 L 110 390"></path>
            <!-- CDB wires -->
            <path id="wire-fpadd-cdb" class="wire" d="M 340 250 L 340 390"></path>
            <path id="wire-fpmul-cdb" class="wire" d="M 550 250 L 550 390"></path>
            <path id="wire-int-cdb" class="wire" d="M 755 250 L 755 390"></path>
            <path id="wire-cdb-rob" class="wire" d="M 850 390 L 850 80"></path>
            <!-- Commit wires -->
            <path id="wire-rob-reg" class="wire" d="M 860 60 C 895 160, 895 420, 860 495"></path>
            <path id="wire-rob-mem" class="wire" d="M 640 68 C 320 120, 60 150, 75 290"></path>

            <g id="box-iq" class="box"><rect x="40" y="20" width="180" height="60" rx="10"></rect><text x="130" y="52">Instr. Queue</text></g>
            <g id="box-rob" class="box"><rect x="640" y="20" width="220" height="60" rx="10"></rect><text x="750" y="52">Reorder Buffer</text></g>
            <g id="box-rs-effaddr" class="box"><rect x="40" y="190" width="180" height="60" rx="10"></rect><text x="130" y="222">Eff Addr RS</text></g>
            <g id="box-rs-fpadd" class="box"><rect x="250" y="190" width="180" height="60" rx="10"></rect><text x="340" y="222">FP Add RS</text></g>
            <g id="box-rs-fpmul" class="box"><rect x="460" y="190" width="180" height="60" rx="10"></rect><text x="550" y="222">FP Mul RS</text></g>
            <g id="box-rs-int" class="box"><rect x="670" y="190" width="170" height="60" rx="10"></rect><text x="755" y="222">Int RS</text></g>
            <g id="box-mem" class="box"><rect x="40" y="290" width="140" height="55" rx="10"></rect><text x="110" y="320" class="small">Data Memory</text></g>
            <g id="box-cdb" class="box"><rect x="40" y="390" width="820" height="36" rx="8"></rect><text x="450" y="410" class="small">Common Data Bus (CDB)</text></g>
            <g id="box-reg" class="box"><rect x="640" y="470" width="220" height="60" rx="10"></rect><text x="750" y="502">Registers</text></g>
          </svg>
        </div>
      </div>
    </div>

    <div class="dysc-column-right">
      <div class="dysc-tabs-nav" role="tablist">
        <div class="dysc-nav-row">
          <button class="dysc-tab-btn active" data-tab="tab-rs" role="tab">Reserv. Stations</button>
          <button class="dysc-tab-btn" data-tab="tab-rob" role="tab">Reorder Buffer</button>
          <button class="dysc-tab-btn" data-tab="tab-reg" role="tab">Reg. Status</button>
        </div>
        <div class="dysc-nav-row">
          <button class="dysc-tab-btn" data-tab="tab-pipe" role="tab">Pipeline Table</button>
          <button class="dysc-tab-btn" data-tab="tab-delays" role="tab">Delays</button>
        </div>
      </div>

      <div class="dysc-tabs-content">
        <div id="tab-rs" class="dysc-tab-panel active" role="tabpanel">
          <h3>Reservation Stations</h3>
          <div id="rs-contents" class="dysc-table-wrap"></div>
        </div>
        <div id="tab-rob" class="dysc-tab-panel" role="tabpanel">
          <h3>Reorder Buffer</h3>
          <div id="rob-contents" class="dysc-table-wrap"></div>
        </div>
        <div id="tab-reg" class="dysc-tab-panel" role="tabpanel">
          <h3>Register Status</h3>
          <div id="reg-contents" class="dysc-table-wrap"></div>
        </div>
        <div id="tab-pipe" class="dysc-tab-panel" role="tabpanel">
          <h3>Pipeline Simulation</h3>
          <div id="pipe-contents" class="dysc-table-wrap"></div>
        </div>
        <div id="tab-delays" class="dysc-tab-panel" role="tabpanel">
          <h3>Delays</h3>
          <div id="delay-contents" class="dysc-table-wrap"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="dysc-panel dysc-panel--notes">
    <h3>What's happening</h3>
    <ul id="step-notes" class="dysc-notes"></ul>
  </div>

  <div class="dysc-panel dysc-panel--output">
    <h3>Output</h3>
    <pre id="output" class="dysc-output"></pre>
  </div>

  <div class="dysc-floating-actions">
    <button class="btn" id="start-btn" disabled>Reset (R)</button>
    <button class="btn" id="step-btn" disabled>Step (S)</button>
    <button class="btn btn--success" id="play-btn" disabled>Play (P)</button>
    <button class="btn btn--danger" id="stop-btn" disabled>Stop (X)</button>
  </div>

  <p style="text-align: center;">
    Created for UTK COSC530 Computer Organization.
  </p>

</div>

<script src="{{ '/scripts/js/dynamsched.js' | relative_url }}"></script>
