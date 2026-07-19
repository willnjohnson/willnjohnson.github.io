(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const OP_LABEL  = { read: 'Read', write: 'Write' };
  const CAS_TYPE  = (op) => (op === 'write' ? 'casw' : 'casr');
  const CMD_LABEL = { pre: 'PRE', ras: 'RAS', casr: 'CAS-R', casw: 'CAS-W' };

  const DEFAULTS = {
    tck: 1.5, trp: 9, trcd: 9, cl: 9, wl: 7, bl: 8,
    twtr: 5, twr: 10, trrd: 4, tfaw: 20, trfc: 160, trefi: 7.8,
  };

  const PRESETS = {
    'miss-repeat': {
      policy: 'open', numBanks: 1, repeat: 3,
      sequence: [{ op: 'read', bank: 0, hit: false }],
    },
    'miss-hit': {
      policy: 'open', numBanks: 1, repeat: 3,
      sequence: [{ op: 'read', bank: 0, hit: false }, { op: 'read', bank: 0, hit: true }],
    },
    'miss-4hit': {
      policy: 'open', numBanks: 1, repeat: 2,
      sequence: [
        { op: 'read', bank: 0, hit: false },
        { op: 'read', bank: 0, hit: true },
        { op: 'read', bank: 0, hit: true },
        { op: 'read', bank: 0, hit: true },
        { op: 'read', bank: 0, hit: true },
      ],
    },
    'threads-1bank': {
      policy: 'open', numBanks: 1, repeat: 2,
      sequence: [
        { op: 'read', bank: 0, hit: false },
        { op: 'read', bank: 0, hit: false },
        { op: 'read', bank: 0, hit: false },
        { op: 'read', bank: 0, hit: false },
      ],
    },
    'threads-4bank': {
      policy: 'open', numBanks: 4, repeat: 2,
      sequence: [
        { op: 'read', bank: 0, hit: false },
        { op: 'read', bank: 1, hit: false },
        { op: 'read', bank: 2, hit: false },
        { op: 'read', bank: 3, hit: false },
      ],
    },
    'closed-repeat': {
      policy: 'closed', numBanks: 1, repeat: 3,
      sequence: [{ op: 'read', bank: 0, hit: false }],
    },
  };

  const state = {
    policy: 'open',
    numBanks: 4,
    repeat: 3,
    sequence: [
      { op: 'read', bank: 0, hit: false },
      { op: 'read', bank: 1, hit: false },
      { op: 'read', bank: 2, hit: false },
      { op: 'read', bank: 3, hit: false },
    ],
    commands: [],
    transfer: 4,
    revealed: 0,
    logLines: [],
    playing: false,
    interval: null,
  };

  function getParams() {
    return {
      tck:   parseFloat($('dra-tck').value)   || DEFAULTS.tck,
      trp:   parseInt($('dra-trp').value, 10)   || DEFAULTS.trp,
      trcd:  parseInt($('dra-trcd').value, 10)  || DEFAULTS.trcd,
      cl:    parseInt($('dra-cl').value, 10)    || DEFAULTS.cl,
      wl:    parseInt($('dra-wl').value, 10)    || DEFAULTS.wl,
      bl:    parseInt($('dra-bl').value, 10)    || DEFAULTS.bl,
      twtr:  parseFloat($('dra-twtr').value)  || DEFAULTS.twtr,
      twr:   parseFloat($('dra-twr').value)   || DEFAULTS.twr,
      trrd:  parseInt($('dra-trrd').value, 10)  || DEFAULTS.trrd,
      tfaw:  parseInt($('dra-tfaw').value, 10)  || DEFAULTS.tfaw,
      trfc:  parseFloat($('dra-trfc').value)  || DEFAULTS.trfc,
      trefi: parseFloat($('dra-trefi').value) || DEFAULTS.trefi,
    };
  }

  function transferCycles(bl) {
    return Math.max(1, Math.ceil(bl / 2));
  }

  // Scheduler
  function buildSchedule(p, policy, numBanks, sequence, repeat) {
    const transfer = transferCycles(p.bl);
    const banks = Array.from({ length: numBanks }, () => ({
      preReadyAt: 0,
      rasReadyAt: 0,
      casReadyAt: 0,
    }));
    let lastRasStart = -Infinity;
    const rasHistory = [];
    let lastCasBusStart = -Infinity;
    const commands = [];
    const iterStart = [];
    const iterLatencyEnd = []; // max(readyForNextPre) + transfer per iteration

    function satisfyFAW(t) {
      if (rasHistory.length < 4) return t;
      const fourthBack = rasHistory[rasHistory.length - 4];
      return Math.max(t, fourthBack + p.tfaw);
    }

    for (let iter = 0; iter < repeat; iter++) {
      let iterMaxReady = -Infinity;
      let iterFirstTime = Infinity;

      sequence.forEach((step, stepIdx) => {
        const bank   = Math.min(step.bank, numBanks - 1);
        const b      = banks[bank];
        const casLat = step.op === 'write' ? p.wl : p.cl;
        const casT   = CAS_TYPE(step.op);

        if (policy === 'closed') {
          let rasStart = Math.max(b.rasReadyAt, lastRasStart + p.trrd);
          rasStart = satisfyFAW(rasStart);
          lastRasStart = rasStart;
          rasHistory.push(rasStart);
          commands.push({ type: 'ras', bank, time: rasStart, dur: p.trcd, iter, stepIdx, op: step.op });
          iterFirstTime = Math.min(iterFirstTime, rasStart);

          const casStart = Math.max(rasStart + p.trcd, lastCasBusStart + transfer);
          lastCasBusStart = casStart;
          commands.push({ type: casT, bank, time: casStart, dur: transfer, iter, stepIdx, op: step.op });
          commands.push({ type: 'pre', bank, time: casStart, dur: p.trp, iter, stepIdx, op: step.op, auto: true });

          b.rasReadyAt = rasStart + p.trcd + casLat;
          iterMaxReady = Math.max(iterMaxReady, rasStart + p.trcd + casLat);
        } else if (step.hit) {
          const casStart = Math.max(b.casReadyAt, lastCasBusStart + transfer);
          lastCasBusStart = casStart;
          commands.push({ type: casT, bank, time: casStart, dur: transfer, iter, stepIdx, op: step.op });
          iterFirstTime = Math.min(iterFirstTime, casStart);

          b.casReadyAt   = casStart + transfer;
          b.preReadyAt   = casStart + casLat;
          iterMaxReady   = Math.max(iterMaxReady, casStart + casLat);
        } else {
          const preStart = b.preReadyAt;
          commands.push({ type: 'pre', bank, time: preStart, dur: p.trp, iter, stepIdx, op: step.op });
          iterFirstTime = Math.min(iterFirstTime, preStart);

          let rasStart = Math.max(preStart + p.trp, lastRasStart + p.trrd);
          rasStart = satisfyFAW(rasStart);
          lastRasStart = rasStart;
          rasHistory.push(rasStart);
          commands.push({ type: 'ras', bank, time: rasStart, dur: p.trcd, iter, stepIdx, op: step.op });

          const casStart = Math.max(rasStart + p.trcd, lastCasBusStart + transfer);
          lastCasBusStart = casStart;
          commands.push({ type: casT, bank, time: casStart, dur: transfer, iter, stepIdx, op: step.op });

          b.casReadyAt = casStart + transfer;
          b.preReadyAt = casStart + casLat;
          iterMaxReady = Math.max(iterMaxReady, casStart + casLat);
        }
      });

      iterStart.push(iterFirstTime);
      iterLatencyEnd.push(iterMaxReady + transfer);
    }

    commands.sort((a, b) => a.time - b.time || a.bank - b.bank || (a.type === 'pre' ? -1 : 1));
    return { commands, transfer, iterStart, iterLatencyEnd };
  }

  // Rendering: timing footer / calculator
  function renderTimingFooter(p) {
    const transfer = transferCycles(p.bl);
    $('dra-transfer-note').textContent =
      `Transfer time = ceil(BL / 2) = ceil(${p.bl} / 2) = ${transfer} cycles (DDR transfers 2 columns/cycle)`;
    return transfer;
  }

  function calcRow(label, parts, unit) {
    const val = parts.reduce((a, b) => a + b, 0);
    return `<div class="dra-calc-row"><span>${label}</span>` +
      `<span class="dra-calc-formula">${parts.join(' + ')} = <span class="dra-calc-val">${val}</span> ${unit}</span></div>`;
  }

  function renderCalc(p, transfer) {
    const open = [
      calcRow('Read, row miss',  [p.trp, p.trcd, p.cl, transfer], 'cycles'),
      calcRow('Read, row hit',   [p.cl, transfer], 'cycles'),
      calcRow('Write, row miss', [p.trp, p.trcd, p.wl, transfer], 'cycles'),
      calcRow('Write, row hit',  [p.wl, transfer], 'cycles'),
    ].join('');
    $('dra-calc-open').innerHTML = open;

    const closed = [
      calcRow('Read',  [p.trcd, p.cl, transfer], 'cycles'),
      calcRow('Write', [p.trcd, p.wl, transfer], 'cycles'),
    ].join('') + '<div class="dra-calc-row"><span class="dra-calc-formula" style="font-style:italic">t' +
      '<sub>RP</sub> overlaps the CAS + transfer window above (auto-precharge), so it does not add to the total.</span></div>';
    $('dra-calc-closed').innerHTML = closed;
  }

  // Rendering: sequence builder
  function bankOptions(selected, numBanks) {
    let out = '';
    for (let i = 0; i < numBanks; i++) {
      out += `<option value="${i}"${i === selected ? ' selected' : ''}>${i}</option>`;
    }
    return out;
  }

  function renderSeqList() {
    const el = $('dra-seqlist');
    const closed = state.policy === 'closed';
    el.innerHTML = state.sequence.map((s, i) => `
      <div class="dra-seqrow">
        <select data-idx="${i}" data-field="op">
          <option value="read"${s.op === 'read' ? ' selected' : ''}>Read</option>
          <option value="write"${s.op === 'write' ? ' selected' : ''}>Write</option>
        </select>
        <select data-idx="${i}" data-field="bank">${bankOptions(s.bank, state.numBanks)}</select>
        <select data-idx="${i}" data-field="hit"${closed ? ' disabled' : ''}>
          <option value="miss"${!s.hit ? ' selected' : ''}>Row miss</option>
          <option value="hit"${s.hit ? ' selected' : ''}>Row hit</option>
        </select>
        <button class="dra-delbtn" data-deldx="${i}" title="Remove step"${state.sequence.length <= 1 ? ' disabled' : ''}>&times;</button>
      </div>
    `).join('');
  }

  // Rendering: results
  function renderResults(sched, p) {
    const el = $('dra-results');
    const latency0 = sched.iterLatencyEnd[0];
    const n = sched.iterStart.length;
    let period = null;
    if (n >= 2) period = sched.iterStart[n - 1] - sched.iterStart[n - 2];
    const totalCycles = sched.commands.reduce((m, c) => Math.max(m, c.time + c.dur), 0);
    const blocksPerIter = state.sequence.length;
    let bw = null;
    if (period) bw = (blocksPerIter * 64) / (period * p.tck); // bytes/ns == GB/s

    const tiles = [
      { label: 'Latency (1st pass)', val: `${latency0} cy`, sub: `${blocksPerIter} block${blocksPerIter > 1 ? 's' : ''} through the sequence once` },
      { label: 'Steady-state period', val: period ? `${period} cy` : 'n/a', sub: period ? 'cycles between successive passes' : 'set repeat &ge; 2' },
      { label: 'Effective bandwidth', val: bw ? `${bw.toFixed(2)} GB/s` : 'n/a', sub: `${blocksPerIter} &times; 64 B per period` },
      { label: 'Total simulated', val: `${totalCycles} cy`, sub: `${sched.commands.length} commands, ${state.repeat} pass(es)` },
    ];
    el.innerHTML = tiles.map(t => `
      <div class="dra-result-tile">
        <div class="dra-rt-label">${t.label}</div>
        <div class="dra-rt-val">${t.val}</div>
        <div class="dra-rt-sub">${t.sub}</div>
      </div>
    `).join('');
  }

  // Rendering: timeline
  function renderTimeline() {
    const cmds = state.commands;
    const totalCycles = cmds.reduce((m, c) => Math.max(m, c.time + c.dur), 1);
    const pxPerCycle = Math.max(3, Math.min(16, Math.floor(1400 / totalCycles)));
    const width = totalCycles * pxPerCycle;

    // Ruler
    const step = Math.max(1, Math.round(totalCycles / 24 / 5) * 5) || 1;
    let ruler = '';
    for (let c = 0; c <= totalCycles; c += step) {
      ruler += `<div class="dra-ruler-tick" style="left:${c * pxPerCycle}px">${c}</div>`;
    }
    const rulerEl = $('dra-ruler');
    rulerEl.style.minWidth = width + 'px';
    rulerEl.innerHTML = ruler;

    // Tracks (one per bank)
    const tracksEl = $('dra-tracks');
    tracksEl.style.minWidth = width + 'px';
    let html = '';
    for (let b = 0; b < state.numBanks; b++) {
      html += `<div class="dra-track" style="width:${width}px"><span class="dra-track-lbl">bank ${b}</span>`;
      cmds.forEach((c, i) => {
        if (c.bank !== b) return;
        const revealedCls = i < state.revealed ? 'revealed' : '';
        const currentCls   = i === state.revealed - 1 ? 'current' : '';
        const autoCls      = c.auto ? 'dra-cmd--auto' : '';
        const label        = c.auto ? '' : CMD_LABEL[c.type];
        html += `<div class="dra-cmd dra-cmd--${c.type} ${autoCls} ${revealedCls} ${currentCls}" ` +
          `style="left:${c.time * pxPerCycle}px;width:${Math.max(6, c.dur * pxPerCycle - 1)}px" ` +
          `title="${c.auto ? 'Auto-precharge (overlapped)' : CMD_LABEL[c.type]} @ ${c.time} (bank ${c.bank}, iter ${c.iter + 1})">` +
          `${c.dur * pxPerCycle > 26 ? label : ''}</div>`;
      });
      html += `</div>`;
    }
    tracksEl.innerHTML = html;

    scrollCurrentIntoView(cmds, pxPerCycle);
  }

  function scrollCurrentIntoView(cmds, pxPerCycle) {
    const wrap = $('dra-timeline-wrap');
    if (!wrap) return;
    if (state.revealed <= 0) { wrap.scrollLeft = 0; return; }
    const c = cmds[state.revealed - 1];
    if (!c) return;

    const left  = c.time * pxPerCycle;
    const right = left + Math.max(6, c.dur * pxPerCycle - 1);
    const viewLeft  = wrap.scrollLeft;
    const viewRight = viewLeft + wrap.clientWidth;
    const pad = 40;

    if (right > viewRight - pad) {
      wrap.scrollTo({ left: right - wrap.clientWidth + pad, behavior: 'smooth' });
    } else if (left < viewLeft + pad) {
      wrap.scrollTo({ left: Math.max(0, left - pad), behavior: 'smooth' });
    }
  }

  // Command log / notes
  function describeCmd(c) {
    const tag = `[Pass ${c.iter + 1}, Step ${c.stepIdx + 1}]`;
    if (c.type === 'pre') {
      return c.auto
        ? `${tag} Auto-precharge (bank ${c.bank}) overlapped with the CAS at cycle ${c.time}`
        : `${tag} Start PRE at cycle ${c.time} (bank ${c.bank})`;
    }
    if (c.type === 'ras') return `${tag} Start RAS/ACT at cycle ${c.time} (bank ${c.bank})`;
    const label = c.op === 'write' ? 'CAS (write)' : 'CAS (read)';
    return `${tag} Start ${label} at cycle ${c.time} (bank ${c.bank}); transfer completes at cycle ${c.time + c.dur}`;
  }

  function appendLog(c) {
    state.logLines.push(describeCmd(c));
    const el = $('dra-output');
    el.textContent = state.logLines.join('\n');
    el.scrollTop = el.scrollHeight;
  }

  function renderNotes(c) {
    const el = $('dra-notes');
    if (!c) { el.innerHTML = '<li>Press Step or Play to walk through the command schedule.</li>'; return; }
    el.innerHTML = `<li>${describeCmd(c)}</li>`;
  }

  // Core rebuild / controls
  function rebuild() {
    stopPlay();
    const p = getParams();
    const transfer = renderTimingFooter(p);
    renderCalc(p, transfer);

    const sched = buildSchedule(p, state.policy, state.numBanks, state.sequence, state.repeat);
    state.commands = sched.commands;
    state.transfer = transfer;
    state.revealed = 0;
    state.logLines = [];

    renderResults(sched, p);
    renderTimeline();
    renderNotes(null);
    $('dra-output').textContent = '';
    refreshButtons();
  }

  function refreshButtons() {
    const hasCmds = state.commands.length > 0;
    const atEnd = state.revealed >= state.commands.length;
    $('dra-btn-step').disabled = !hasCmds || atEnd || state.playing;
    $('dra-btn-play').disabled = !hasCmds || atEnd || state.playing;
    $('dra-btn-stop').disabled = !state.playing;
    $('dra-btn-play').textContent = state.playing ? 'Pause (P)' : 'Play (P)';
  }

  function stepOnce() {
    if (state.revealed >= state.commands.length) return;
    const c = state.commands[state.revealed];
    state.revealed++;
    appendLog(c);
    renderNotes(c);
    renderTimeline();
    refreshButtons();
  }

  function startPlay() {
    if (state.playing || state.revealed >= state.commands.length) return;
    let delay = parseInt($('dra-speed').value, 10);
    if (isNaN(delay) || delay < 50) delay = 400;
    state.playing = true;
    state.interval = setInterval(() => {
      if (state.revealed >= state.commands.length) { stopPlay(); return; }
      stepOnce();
    }, delay);
    refreshButtons();
  }

  function stopPlay() {
    if (!state.playing) return;
    state.playing = false;
    if (state.interval) { clearInterval(state.interval); state.interval = null; }
    refreshButtons();
  }

  // Presets & sequence editing
  function applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    state.policy   = preset.policy;
    state.numBanks = preset.numBanks;
    state.repeat   = preset.repeat;
    state.sequence = preset.sequence.map(s => ({ ...s }));

    $('dra-policy').value   = state.policy;
    $('dra-numbanks').value = String(state.numBanks);
    $('dra-repeat').value   = String(state.repeat);

    renderSeqList();
    rebuild();
  }

  function clampBanks() {
    state.sequence.forEach(s => { if (s.bank >= state.numBanks) s.bank = state.numBanks - 1; });
  }

  function handleKeyDown(e) {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
    const key = e.key.toLowerCase();
    if      (key === 'r')                             { e.preventDefault(); rebuild(); }
    else if (key === 's' && !$('dra-btn-step').disabled) { e.preventDefault(); stopPlay(); stepOnce(); }
    else if (key === 'p' && !$('dra-btn-play').disabled) { e.preventDefault(); startPlay(); }
    else if (key === 'x' && !$('dra-btn-stop').disabled) { e.preventDefault(); stopPlay(); }
  }

  function attach() {
    // Timing parameter inputs
    ['dra-tck', 'dra-trp', 'dra-trcd', 'dra-cl', 'dra-wl', 'dra-bl',
     'dra-twtr', 'dra-twr', 'dra-trrd', 'dra-tfaw', 'dra-trfc', 'dra-trefi']
      .forEach(id => $(id).addEventListener('input', rebuild));

    $('dra-reset-defaults').addEventListener('click', () => {
      Object.entries(DEFAULTS).forEach(([k, v]) => {
        const el = $('dra-' + k);
        if (el) el.value = v;
      });
      rebuild();
    });

    // Policy / topology
    $('dra-policy').addEventListener('change', () => {
      state.policy = $('dra-policy').value;
      renderSeqList();
      rebuild();
    });
    $('dra-numbanks').addEventListener('change', () => {
      state.numBanks = parseInt($('dra-numbanks').value, 10);
      clampBanks();
      renderSeqList();
      rebuild();
    });
    $('dra-repeat').addEventListener('input', () => {
      state.repeat = Math.max(1, parseInt($('dra-repeat').value, 10) || 1);
      rebuild();
    });
    $('dra-speed').addEventListener('input', () => {});

    // Presets
    $('dra-preset-select').addEventListener('change', () => {
      applyPreset($('dra-preset-select').value);
    });

    // Sequence list edits
    $('dra-seqlist').addEventListener('change', e => {
      const el = e.target;
      const i = parseInt(el.dataset.idx, 10);
      const field = el.dataset.field;
      if (isNaN(i) || !field) return;
      if (field === 'op')   state.sequence[i].op   = el.value;
      if (field === 'bank') state.sequence[i].bank = parseInt(el.value, 10);
      if (field === 'hit')  state.sequence[i].hit  = el.value === 'hit';
      rebuild();
    });
    $('dra-seqlist').addEventListener('click', e => {
      const btn = e.target.closest('[data-deldx]');
      if (!btn || state.sequence.length <= 1) return;
      state.sequence.splice(parseInt(btn.dataset.deldx, 10), 1);
      renderSeqList();
      rebuild();
    });

    $('dra-addstep').addEventListener('click', () => {
      state.sequence.push({ op: 'read', bank: 0, hit: true });
      renderSeqList();
      rebuild();
    });

    // Floating actions
    $('dra-btn-reset').addEventListener('click', rebuild);
    $('dra-btn-step').addEventListener('click', () => { stopPlay(); stepOnce(); });
    $('dra-btn-play').addEventListener('click', () => { state.playing ? stopPlay() : startPlay(); });
    $('dra-btn-stop').addEventListener('click', stopPlay);

    window.addEventListener('keydown', handleKeyDown);

    // Initial render
    $('dra-policy').value   = state.policy;
    $('dra-numbanks').value = String(state.numBanks);
    $('dra-repeat').value   = String(state.repeat);
    renderSeqList();
    rebuild();
  }

  document.addEventListener('DOMContentLoaded', attach);
})();
