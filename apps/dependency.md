---
title: Dependency Analyzer
layout: page
permalink: /apps/dependency
stylesheet: dependency
---

<div id="dep-root" class="dep">
  <p>This dependency analyzer serves as a review of the types of hazards encountered during dynamic scheduling.</p>
  <div class="dep-panel dep-panel--intro">
    <ul class="dep-legend">
      <h2>Types of Hazards:</h2>
      <li><strong>Structural</strong> - two instructions want the same hardware resource in the same cycle. The only shared resource modeled here is the CDB, which can broadcast one result per cycle.</li>
      <li><strong>Control</strong> - a branch hasn't resolved yet, so the instructions after it can't safely issue.</li>
      <li><strong>Data (RAW)</strong> - read-after-write, a true dependency: an instruction needs a value a prior instruction hasn't produced yet.</li>
      <li><strong>Data (WAR)</strong> - write-after-read, an anti-dependency: an instruction would overwrite a register an earlier instruction still needed to read. Resolved by reservation-station tag renaming, so it costs no cycles - it's reported for awareness only.</li>
      <li><strong>Data (WAW)</strong> - write-after-write, an output dependency: two instructions target the same register, so only the one that issued last should ever be the one that updates the register file. Also resolved by renaming, reported for awareness only.</li>
    </ul>
  </div>

  <div class="dep-panel dep-panel--config">
    <h3>Functional Unit Latencies (cycles)</h3>
    <div class="dep-config-grid">
      <label>FP Multiply
        <input type="number" id="dep-lat-fpmul" min="1" value="6">
      </label>
      <label>FP Add / Sub
        <input type="number" id="dep-lat-fpadd" min="1" value="4">
      </label>
      <label>FP Divide
        <input type="number" id="dep-lat-fpdiv" min="1" value="12">
      </label>
      <label>Integer (ALU / Load / Store)
        <input type="number" id="dep-lat-int" min="1" value="1">
      </label>
      <label>Branch
        <input type="number" id="dep-lat-branch" min="1" value="1">
      </label>
    </div>
    <p class="dep-note">Assumes enough reservation stations that issue never stalls for lack of one, and that each functional unit accepts a new instruction every cycle. The CDB is the only structural resource modeled. Branches are assumed unresolved until they execute (no prediction), so instructions after a branch stall at issue until it resolves. Registers are named <code>F#</code> for the floating-point file and <code>R#</code> for the integer/general-purpose file (used, e.g., for base addresses in loads and stores).</p>
  </div>

  <div class="dep-panel dep-panel--program">
    <h3>Instruction Sequence</h3>
    <div class="dep-table-wrap">
      <table class="dep-table dep-instr-table">
        <thead>
          <tr><th>#</th><th>Op</th><th>Operands</th><th></th></tr>
        </thead>
        <tbody id="dep-instr-body"></tbody>
      </table>
    </div>
    <button class="dep-addbtn" id="dep-insert-btn">+ Insert Instruction</button>
    <div class="dep-actions">
      <button class="btn btn--success" id="dep-analyze-btn">Analyze</button>
      <button class="btn btn--danger" id="dep-clear-btn">Clear All</button>
    </div>
  </div>

  <div class="dep-panel dep-panel--results" id="dep-results-panel" style="display:none;">
    <h3>Scheduling Result</h3>
    <div class="dep-table-wrap">
      <table class="dep-table" id="dep-results-table"></table>
    </div>
    <div id="dep-hazard-summary" class="dep-hazard-summary"></div>
  </div>

  <p style="text-align: center;">
    Created for UTK COSC530 Computer Organization.
  </p>

</div>

<script src="{{ '/scripts/js/dependency.js' | relative_url }}"></script>
