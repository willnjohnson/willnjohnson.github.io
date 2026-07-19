---
title: DRAM Access Simulator
layout: page
permalink: /apps/dram
stylesheet: dram
---

<p><a href="/apps/">← Back to Apps</a></p>

<div id="dra-root" class="dra">
  <p>Model DRAM command timing (PRE / RAS / CAS) under an open-row or closed-row policy, across multiple banks. Set the timing parameters from a spec sheet, describe an access sequence (e.g. a row-buffer miss followed by four row hits), and step through the resulting command schedule.</p>

  <div class="dra-panel dra-panel--top">
    <h2>Timing Parameters <span class="dra-hint">(defaults: DDR3-1333)</span></h2>
    <div class="dra-timing-grid">
      <label>t<sub>CK</sub> — clock cycle (ns)
        <input id="dra-tck" type="number" value="1.5" min="0.1" step="0.1">
      </label>
      <label>t<sub>RP</sub> — precharge (cycles)
        <input id="dra-trp" type="number" value="9" min="1" step="1">
      </label>
      <label>t<sub>RCD</sub> — activate (cycles)
        <input id="dra-trcd" type="number" value="9" min="1" step="1">
      </label>
      <label>CL — CAS read latency (cycles)
        <input id="dra-cl" type="number" value="9" min="1" step="1">
      </label>
      <label>WL — CAS write latency (cycles)
        <input id="dra-wl" type="number" value="7" min="1" step="1">
      </label>
      <label>BL — burst length (columns)
        <input id="dra-bl" type="number" value="8" min="2" step="2">
      </label>
      <label>t<sub>WTR</sub> — write to read (cycles)
        <input id="dra-twtr" type="number" value="5" min="0" step="1">
      </label>
      <label>t<sub>WR</sub> — write recovery (cycles)
        <input id="dra-twr" type="number" value="10" min="0" step="1">
      </label>
      <label>t<sub>RRD</sub> — activate to activate (cycles)
        <input id="dra-trrd" type="number" value="4" min="0" step="1">
      </label>
      <label>t<sub>FAW</sub> — four activate window (cycles)
        <input id="dra-tfaw" type="number" value="20" min="1" step="1">
      </label>
      <label>t<sub>RFC</sub> — refresh to activate (nsec)
        <input id="dra-trfc" type="number" value="160" min="1" step="1">
      </label>
      <label>t<sub>REFI</sub> — refresh interval (&micro;sec)
        <input id="dra-trefi" type="number" value="7.8" min="0.1" step="0.1">
      </label>
    </div>
    <div class="dra-timing-footer">
      <span id="dra-transfer-note" class="dra-transfer-note"></span>
      <button class="dra-resetbtn" id="dra-reset-defaults">Reset to DDR3-1333 defaults</button>
    </div>
    <p class="dra-fineprint">t<sub>WTR</sub>, t<sub>WR</sub>, t<sub>RFC</sub> and t<sub>REFI</sub> are shown for reference and are not injected into the command schedule below (no periodic refresh is modeled; write recovery is approximated by waiting a full CL/WL before precharge).</p>
  </div>

  <div class="dra-dashboard-grid">
    <div class="dra-column-left">
      <div class="dra-panel">
        <h2>Policy &amp; Topology</h2>
        <div class="dra-policy-grid">
          <label>Row buffer policy
            <select id="dra-policy">
              <option value="open" selected>Open row — keep row open until a miss forces precharge</option>
              <option value="closed">Closed row — auto-precharge after every access</option>
            </select>
          </label>
          <label>Number of banks
            <select id="dra-numbanks">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4" selected>4</option>
              <option value="8">8</option>
            </select>
          </label>
          <label>Repeat sequence
            <input id="dra-repeat" type="number" value="3" min="1" max="12" step="1">
          </label>
          <label class="dra-speed">Play speed (ms)
            <input id="dra-speed" type="number" value="400" min="50" step="50">
          </label>
        </div>
      </div>

      <div class="dra-panel">
        <h2>Quick Latency Calculator</h2>
        <div class="dra-calc-grid">
          <div class="dra-calc-box">
            <h3>Open row policy</h3>
            <div id="dra-calc-open" class="dra-calc-lines"></div>
          </div>
          <div class="dra-calc-box">
            <h3>Closed row policy</h3>
            <div id="dra-calc-closed" class="dra-calc-lines"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="dra-column-right">
      <div class="dra-panel">
        <h2>Results</h2>
        <div id="dra-results" class="dra-results"></div>
      </div>

      <div class="dra-panel">
        <h2>Access Sequence</h2>
        <div class="dra-presets">
          <label for="dra-preset-select" class="dra-presets-lbl">Preset</label>
          <select id="dra-preset-select">
            <option value="" selected disabled>Choose a preset&hellip;</option>
            <option value="miss-repeat">Row miss, repeated</option>
            <option value="miss-hit">Miss + 1 hit, repeated</option>
            <option value="miss-4hit">Miss + 4 hits, repeated</option>
            <option value="threads-1bank">4 threads, 1 bank</option>
            <option value="threads-4bank">4 threads, 4 banks</option>
            <option value="closed-repeat">Closed row, repeated</option>
          </select>
        </div>
        <div class="dra-seq-hdr">
          <span>op</span><span>bank</span><span>row buffer</span><span></span>
        </div>
        <div id="dra-seqlist"></div>
        <button class="dra-addbtn" id="dra-addstep">+ Add Step</button>
      </div>
    </div>
  </div>

  <div class="dra-panel dra-panel--timeline">
    <h2>Command Timeline</h2>
    <div class="dra-legend">
      <span><i class="dra-swatch dra-swatch--pre"></i>PRE</span>
      <span><i class="dra-swatch dra-swatch--ras"></i>RAS / ACT</span>
      <span><i class="dra-swatch dra-swatch--casr"></i>CAS (read + transfer)</span>
      <span><i class="dra-swatch dra-swatch--casw"></i>CAS (write + transfer)</span>
      <span><i class="dra-swatch dra-swatch--auto"></i>Auto-precharge (closed row, overlapped)</span>
    </div>
    <div class="dra-timeline-wrap" id="dra-timeline-wrap">
      <div id="dra-ruler" class="dra-ruler"></div>
      <div id="dra-tracks" class="dra-tracks"></div>
    </div>
  </div>

  <div class="dra-panel dra-panel--notes">
    <h3>What's happening</h3>
    <ul id="dra-notes" class="dra-notes"></ul>
  </div>

  <div class="dra-panel dra-panel--output">
    <h3>Command Log</h3>
    <pre id="dra-output" class="dra-output"></pre>
  </div>

  <div class="dra-floating-actions">
    <button class="btn" id="dra-btn-reset">Reset (R)</button>
    <button class="btn" id="dra-btn-step" disabled>Step (S)</button>
    <button class="btn btn--success" id="dra-btn-play" disabled>Play (P)</button>
    <button class="btn btn--danger" id="dra-btn-stop" disabled>Stop (X)</button>
  </div>

  <p style="text-align: center;">
    Created for UTK COSC530 Computer Organization.
  </p>

</div>

<script src="{{ '/scripts/js/dram.js' | relative_url }}"></script>
