(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  function logClear() {
    const p = $('cls-output');
    if (p) p.textContent = '';
  }

  // Kernels: label, expression, array names, access types, code body generator
  const KERNELS = {
    copy: {
      label: 'COPY',
      expr:  'y[i] = x[i]',
      arrays: ['x', 'y'],
      accesses: [
        { arr: 0, rw: 'r' },
        { arr: 1, rw: 'w' },
      ],
      needsScalar: false,
      needsSum:    false,
      codeBody: (ind, v) =>
        `${ind}<span class="nv">y</span>[${v}] = <span class="nv">x</span>[${v}];`,
    },
    scal: {
      label: 'SCAL',
      expr:  'x[i] = A * x[i]',
      arrays: ['x'],
      accesses: [
        { arr: 0, rw: 'rw' },
      ],
      needsScalar: true,
      needsSum:    false,
      codeBody: (ind, v) =>
        `${ind}<span class="nv">x</span>[${v}] = <span class="nv">A</span> * <span class="nv">x</span>[${v}];`,
    },
    dot: {
      label: 'DOT',
      expr:  'sum += x[i] * y[i]',
      arrays: ['x', 'y'],
      accesses: [
        { arr: 0, rw: 'r' },
        { arr: 1, rw: 'r' },
      ],
      needsScalar: false,
      needsSum:    true,
      codeBody: (ind, v) =>
        `${ind}<span class="nv">sum</span> += <span class="nv">x</span>[${v}] * <span class="nv">y</span>[${v}];`,
    },
    axpy: {
      label: 'AXPY',
      expr:  'y[i] = A*x[i] + y[i]',
      arrays: ['x', 'y'],
      accesses: [
        { arr: 0, rw: 'r'  },
        { arr: 1, rw: 'rw' },
      ],
      needsScalar: true,
      needsSum:    false,
      codeBody: (ind, v) =>
        `${ind}<span class="nv">y</span>[${v}] = <span class="nv">A</span> * <span class="nv">x</span>[${v}] + <span class="nv">y</span>[${v}];`,
    },
  };

  const KERNEL_ORDER = ['copy', 'scal', 'dot', 'axpy'];
  const DIM_VARS     = ['j', 'i', 'k', 'l', 'm', 'n'];

  // Simulator state
  const state = {
    kernel: 'axpy',
    dims: [
      { v: 'j', bound: 32, stride: 1, order: 0 },
      { v: 'i', bound: 8,  stride: 1, order: 1 },
    ],
    codeLines:     [],
    accessLineIdx: -1,

    // Simulation
    steps:    [],     // pre-built access sequence
    pos:      0,      // current step index
    cache:    null,   // { sets[][], tick, firstSeen }
    setHeat:  null,   // Int32Array[numSets]
    stats:    { miss: 0, hit: 0, comp: 0, cap: 0, conf: 0 },
    logLines: [],     // all rendered access-log lines (oldest first)

    // Playback
    playing:  false,
    interval: null,
  };

  // Cache parameter helpers
  function getCacheP() {
    const cacheBytes = (parseInt($('cls-cache-kb').value,    10) || 1)  * 1024;
    const blockB     =  parseInt($('cls-block-bytes').value, 10) || 32;
    const elemB      =  parseInt($('cls-dtype').value,       10) || 4;
    const assoc      = $('cls-assoc').value;
    const waysN      =  parseInt($('cls-ways').value,        10) || 16;
    const numBlocks  = Math.floor(cacheBytes / blockB);
    const numSets =
      assoc === 'fa' ? 1 :
      assoc === 'dm' ? numBlocks :
      Math.max(1, Math.floor(numBlocks / waysN));
    const ways =
      assoc === 'fa' ? numBlocks :
      assoc === 'dm' ? 1 :
      waysN;
    const elemsPerBlock = Math.max(1, Math.floor(blockB / elemB));
    return { cacheBytes, blockB, elemB, assoc, ways, numSets, elemsPerBlock, numBlocks };
  }

  // Dimension helpers
  function sortedDims() {
    return [...state.dims].sort((a, b) => a.order - b.order);
  }

  function dimIterCount(d) {
    return Math.ceil(d.bound / d.stride);
  }

  // Step builder
  function buildSteps() {
    const kd        = KERNELS[state.kernel];
    const sd        = sortedDims();
    const origOrder = state.dims.map(d => d.v);
    const sdToOrig  = sd.map(sdi => origOrder.indexOf(sdi.v));
    const dimSizes  = state.dims.map(d => d.bound);
    const totalElems = dimSizes.reduce((a, b) => a * b, 1);

    // Row-major strides for each original dimension
    const rowStrides = new Array(state.dims.length);
    let rs = 1;
    for (let i = state.dims.length - 1; i >= 0; i--) {
      rowStrides[i] = rs;
      rs *= dimSizes[i];
    }

    const totalIters = sd.reduce((a, d) => a * dimIterCount(d), 1);
    if (totalIters * kd.accesses.length > 50000) return null;

    const steps      = [];
    const origCoords = new Array(state.dims.length).fill(0);

    function iterate(sdIdx) {
      if (sdIdx === sd.length) {
        let baseFlat = 0;
        for (let d = 0; d < state.dims.length; d++) baseFlat += origCoords[d] * rowStrides[d];
        steps.push({
          coords: [...origCoords],
          accesses: kd.accesses.map(ac => ({
            flatIdx: ac.arr * totalElems + baseFlat,
            arrIdx:  ac.arr,
            rw:      ac.rw,
          })),
        });
        return;
      }
      const d  = sd[sdIdx];
      const oi = sdToOrig[sdIdx];
      for (let v = 0; v < d.bound; v += d.stride) {
        origCoords[oi] = v;
        iterate(sdIdx + 1);
      }
    }

    iterate(0);
    return steps;
  }

  // Cache simulation
  function initCacheState(p) {
    return {
      sets: Array.from({ length: p.numSets }, () =>
        Array.from({ length: p.ways }, () => null)
      ),
      tick:      0,
      firstSeen: new Set(),
    };
  }

  function accessCache(flatIdx, arrIdx, rw, p) {
    const cs = state.cache;
    const { elemsPerBlock, numSets, ways, assoc } = p;
    const blk = Math.floor(flatIdx / elemsPerBlock);
    const si  = blk % numSets;
    cs.tick++;

    const set  = cs.sets[si];
    const slot = set.findIndex(s => s && s.blk === blk);

    // Hit
    if (slot !== -1) {
      if ($('cls-policy').value === 'lru') set[slot].age = cs.tick;
      return { type: 'hit', blk, si, slot, rw, evicted: null };
    }

    // Miss — record first-ever touch
    const isFirst = !cs.firstSeen.has(blk);
    if (isFirst) cs.firstSeen.add(blk);

    // Find victim slot: empty first, then LRU/FIFO oldest
    const emptySlot = set.findIndex(s => s === null);
    let vs;
    if (emptySlot !== -1) {
      vs = emptySlot;
    } else {
      let best = 0, bestAge = Infinity;
      set.forEach((s, idx) => { if (s && s.age < bestAge) { bestAge = s.age; best = idx; } });
      vs = best;
    }

    const evicted = set[vs] ? { ...set[vs] } : null;
    set[vs] = { blk, arr: arrIdx, age: cs.tick };
    state.setHeat[si]++;

    // Classify miss type
    let missType = isFirst ? 'comp' : 'cap';
    // Conflict: non-FA cache, evicted block hashed to same set
    if (!isFirst && assoc !== 'fa' && evicted && evicted.blk % numSets === si) {
      missType = 'conf';
    }

    return { type: 'miss', missType, blk, si, slot: vs, rw, evicted, isFirst };
  }

  // Single simulation step
  function step() {
    if (state.pos >= state.steps.length) return null;
    const entry = state.steps[state.pos];
    const p     = getCacheP();
    const results = entry.accesses.map(ac => {
      const r = accessCache(ac.flatIdx, ac.arrIdx, ac.rw, p);
      if (r.type === 'hit') {
        state.stats.hit++;
      } else {
        state.stats.miss++;
        if      (r.missType === 'comp') state.stats.comp++;
        else if (r.missType === 'cap')  state.stats.cap++;
        else                            state.stats.conf++;
      }
      return r;
    });
    state.pos++;
    appendLogLines(state.pos, entry, results);
    return results;
  }

  function resetSimulation() {
    stopPlay();
    logClear();

    const p = getCacheP();
    state.steps    = buildSteps() || [];
    state.pos      = 0;
    state.cache    = initCacheState(p);
    state.setHeat  = new Int32Array(p.numSets);
    state.stats    = { miss: 0, hit: 0, comp: 0, cap: 0, conf: 0 };
    state.logLines = [];

    const wb = $('cls-warn');
    if (wb) {
      if (state.steps.length === 0) {
        const kd    = KERNELS[state.kernel];
        const sd    = sortedDims();
        const total = sd.reduce((a, d) => a * dimIterCount(d), 1) * kd.accesses.length;
        if (total > 50000) {
          wb.textContent = `Too many accesses (${total.toLocaleString()}) for step mode — reduce bounds or increase stride.`;
          wb.style.display = '';
        } else {
          wb.style.display = 'none';
        }
      } else {
        wb.style.display = 'none';
      }
    }

    refreshUI(null);
  }

  function startPlay() {
    if (state.playing || state.pos >= state.steps.length) return;
    let delay = parseInt($('cls-speed').value, 10);
    if (isNaN(delay) || delay < 10) delay = 10;
    state.playing  = true;
    state.interval = setInterval(playTick, delay);
    refreshUI(null);
  }

  function stopPlay() {
    if (!state.playing) return;
    state.playing = false;
    if (state.interval) { clearInterval(state.interval); state.interval = null; }
    refreshUI(null);
  }

  function playTick() {
    if (state.pos >= state.steps.length || !state.playing) { stopPlay(); return; }
    const results = step();
    refreshUI(results);
  }

  // Code preview builder
  function buildCodeLines() {
    const kd      = KERNELS[state.kernel];
    const sd      = sortedDims();
    const typeMap = { 1: 'char', 2: 'short', 4: 'int', 8: 'long' };
    const tn      = typeMap[$('cls-dtype').value] || 'int';
    const sizeStr = state.dims.map(d => `[${d.bound}]`).join('');
    const lines   = [];

    // Array declarations
    kd.arrays.forEach(a =>
      lines.push({
        text: `<span class="kt">${tn}</span> <span class="nv">${a}</span>${sizeStr};`,
        type: 'decl',
      })
    );

    // Scalar / accumulator declarations
    if (kd.needsScalar)
      lines.push({
        text: `<span class="kt">${tn}</span> <span class="nv">A</span> = <span class="mi">2</span>;`,
        type: 'decl',
      });
    if (kd.needsSum)
      lines.push({
        text: `<span class="kt">${tn}</span> <span class="nv">sum</span> = <span class="mi">0</span>;`,
        type: 'decl',
      });

    // For-loop headers (outermost → innermost)
    sd.forEach((d, depth) => {
      const ind = '  '.repeat(depth);
      const inc = d.stride === 1
        ? `<span class="nv">${d.v}</span>++`
        : `<span class="nv">${d.v}</span> += <span class="mi">${d.stride}</span>`;
      lines.push({
        text: `${ind}<span class="kd">for</span> (<span class="kt">int</span> <span class="nv">${d.v}</span> = <span class="mi">0</span>; <span class="nv">${d.v}</span> &lt; <span class="mi">${d.bound}</span>; ${inc}) {`,
        type: 'for',
      });
    });

    // Inner-loop body
    const ind2    = '  '.repeat(sd.length);
    const allVars = state.dims.map(d => `<span class="nv">${d.v}</span>`).join('][');
    lines.push({ text: kd.codeBody(ind2, allVars), type: 'access' });
    state.accessLineIdx = lines.length - 1;

    // Closing braces
    sd.slice().reverse().forEach((_, di) =>
      lines.push({ text: `${'  '.repeat(sd.length - 1 - di)}}`, type: 'close' })
    );

    state.codeLines = lines;
  }

  // Access log
  function appendLogLines(idx, entry, results) {
    const kd        = KERNELS[state.kernel];
    const coordStr  = entry.coords.map((c, ci) => `${state.dims[ci].v}=${c}`).join(', ');

    results.forEach((r, ri) => {
      const ac      = kd.accesses[ri];
      const arrName = kd.arrays[ac.arr];
      const rwStr   = ac.rw === 'r' ? 'R' : ac.rw === 'w' ? 'W' : 'RW';
      const rwCls   = ac.rw === 'r' ? 'll-rw-r' : ac.rw === 'w' ? 'll-rw-w' : 'll-rw-rw';

      let typeLabel, typeCls;
      if      (r.type === 'hit')           { typeLabel = 'HIT';        typeCls = 'll-type--hit';  }
      else if (r.missType === 'comp')      { typeLabel = 'COMPULSORY'; typeCls = 'll-type--comp'; }
      else if (r.missType === 'conf')      { typeLabel = 'CONFLICT';   typeCls = 'll-type--conf'; }
      else                                 { typeLabel = 'CAPACITY';   typeCls = 'll-type--cap';  }

      const evStr = r.evicted ? `  evicts blk ${r.evicted.blk}` : '';
      state.logLines.push({ idx, rwStr, rwCls, arrName, blk: r.blk, si: r.si, typeCls, typeLabel, coordStr, evStr });
    });
  }

  function renderKernels() {
    const el = $('cls-kernel-row');
    if (!el) return;
    el.innerHTML = KERNEL_ORDER.map(k => {
      const kd     = KERNELS[k];
      const badges = kd.accesses.map(a => {
        const cls   = a.rw === 'r' ? 'io-r' : a.rw === 'w' ? 'io-w' : 'io-rw';
        const label = a.rw === 'r' ? 'read' : a.rw === 'w' ? 'write' : 'read+write';
        return `<span class="${cls}">${label} ${kd.arrays[a.arr]}[]</span>`;
      }).join('');
      return `<button class="cls-kbtn${k === state.kernel ? ' active' : ''}" data-kernel="${k}">
        <span class="kn">${kd.label}</span>
        <span class="ke">${kd.expr}</span>
        <span class="ki">${badges}</span>
      </button>`;
    }).join('');
  }

  function renderDims() {
    const el = $('cls-dlist');
    if (!el) return;
    const n  = state.dims.length;
    const kd = KERNELS[state.kernel];
    el.innerHTML = state.dims.map((d, i) => {
      const opts = Array.from({ length: n }, (_, oi) => {
        const lbl = oi === 0 ? 'outermost' : oi === n - 1 ? 'innermost' : `middle ${oi}`;
        return `<option value="${oi}"${d.order === oi ? ' selected' : ''}>${lbl}</option>`;
      }).join('');
      const note = kd.arrays.map(an =>
        `${an}[${state.dims.map((dd, di) => di === i ? `<b>${dd.v}</b>` : dd.v).join('][')}]`
      ).join(', ');
      return `<div class="cls-drow">
        <input value="${d.v}" maxlength="3" data-dim="${i}" data-field="v">
        <input type="number" value="${d.bound}"  min="1" max="512" data-dim="${i}" data-field="bound">
        <input type="number" value="${d.stride}" min="1" max="32"  data-dim="${i}" data-field="stride">
        <select data-dim="${i}" data-field="order">${opts}</select>
        <span class="dn">${note}</span>
        <button class="cls-delbtn" data-deldim="${i}" title="Remove dimension">×</button>
      </div>`;
    }).join('');

    const addBtn = $('cls-addbtn');
    if (addBtn) addBtn.disabled = state.dims.length >= 6;
  }

  function renderCodePreview(hiLine, hiType) {
    const el = $('cls-codewrap');
    if (!el) return;
    // Wrap in .highlight so syntax-light/dark.scss token rules apply
    el.innerHTML = '<div class="highlight">'
      + state.codeLines.map((l, i) => {
          let cls = 'cls-cl';
          if (i === hiLine) {
            cls += hiType === 'hit' ? ' hl-hit' : hiType === 'miss' ? ' hl-miss' : ' hl-active';
          }
          return `<span class="${cls}">${l.text}</span>`;
        }).join('')
      + '</div>';
  }

  function renderConfigSummary() {
    const el = $('cls-config-summary');
    if (!el) return;
    const p         = getCacheP();
    const kd        = KERNELS[state.kernel];
    const assocName = { fa: 'Fully associative', dm: 'Direct-mapped', sa: `${p.ways}-way set-associative` }[p.assoc];
    el.textContent  =
      `${kd.label}  ·  ${p.cacheBytes / 1024} KB cache  ·  ${p.blockB} B blocks  ·  `
      + `${assocName}  ·  ${p.elemsPerBlock} elem/block  ·  `
      + `${p.numSets} set${p.numSets > 1 ? 's' : ''} × ${p.ways} way${p.ways > 1 ? 's' : ''}`;
  }

  function renderProgress() {
    const tot  = state.steps.length;
    const cur  = state.pos;
    const pct  = tot === 0 ? 0 : Math.round(cur / tot * 100);
    const fill = $('cls-progress-fill');
    const lbl  = $('cls-progress-lbl');
    if (fill) fill.style.width = pct + '%';
    if (lbl)  lbl.textContent  = `${cur.toLocaleString()} / ${tot.toLocaleString()}`;
  }

  function renderCacheTable(p, hiSi, flashType) {
    const el = $('cls-cache-table');
    if (!el) return;
    const { numSets, ways } = p;
    const show = Math.min(numSets, 32);
    const kd   = KERNELS[state.kernel];

    let html = '<thead><tr><th class="set-lbl">set</th>';
    for (let w = 0; w < ways; w++) html += `<th>way ${w}</th>`;
    html += '</tr></thead><tbody>';

    for (let si = 0; si < show; si++) {
      const isHi = si === hiSi;
      html += `<tr${isHi ? ' class="active-row"' : ''}>`;
      html += `<td class="set-lbl">${si}</td>`;

      for (let w = 0; w < ways; w++) {
        const slot     = state.cache.sets[si][w];
        const flashCls = isHi ? (flashType === 'hit' ? ' fl-hit' : ' fl-miss') : '';
        if (slot) {
          const an  = kd.arrays[slot.arr] || `a${slot.arr}`;
          const ac  = kd.accesses.find(a => a.arr === slot.arr);
          const rwB = ac
            ? `<span style="font-size:.65rem;opacity:.65;margin-left:2px">${ac.rw === 'rw' ? '±' : ac.rw === 'w' ? 'W' : 'R'}</span>`
            : '';
          html += `<td><span class="cblock cblock--${slot.arr % 8}${flashCls}">${an}[${slot.blk}]${rwB}</span></td>`;
        } else {
          html += `<td><span class="cblock cblock--empty${flashCls}">—</span></td>`;
        }
      }
      html += '</tr>';
    }

    if (numSets > 32) {
      html += `<tr><td colspan="${ways + 1}" style="font-size:.7rem;color:var(--text-tertiary);padding:4px 6px">… +${numSets - 32} more sets not shown</td></tr>`;
    }
    html += '</tbody>';
    el.innerHTML = html;

    const desc = $('cls-cache-desc');
    if (desc) {
      desc.textContent =
        `— ${p.numSets} set${p.numSets > 1 ? 's' : ''} × ${p.ways} way${p.ways > 1 ? 's' : ''} · ${p.elemsPerBlock} elem/block`;
    }
  }

  function renderBars() {
    const el = $('cls-bar-chart');
    if (!el) return;
    const s   = state.stats;
    const tot = s.miss + s.hit;
    const bars = [
      { lbl: 'Total misses', val: s.miss, max: tot    || 1, col: '#dc2626' },
      { lbl: 'Hits',         val: s.hit,  max: tot    || 1, col: '#2563eb' },
      { lbl: 'Compulsory',   val: s.comp, max: s.miss || 1, col: '#15803d' },
      { lbl: 'Capacity',     val: s.cap,  max: s.miss || 1, col: '#d97706' },
      { lbl: 'Conflict',     val: s.conf, max: s.miss || 1, col: '#7c3aed' },
    ];
    el.innerHTML = bars.map(b => {
      const w = Math.round(b.val / b.max * 100);
      return `<div class="cls-bar-row">
        <span class="cls-bar-lbl">${b.lbl}</span>
        <div class="cls-bar-track">
          <div class="cls-bar-fill" style="width:${w}%;background:${b.col}"></div>
        </div>
        <span class="cls-bar-count">${b.val}</span>
      </div>`;
    }).join('');
  }

  function renderLog() {
    const el = $('cls-output');
    if (!el) return;
    el.innerHTML = state.logLines.map(l => {
      const evPart = l.evStr
        ? `  <span class="ll-evict">${l.evStr}</span>`
        : '';
      return `<span class="log-line">`
        + `<span class="ll-idx">${String(l.idx).padStart(5, ' ')}</span>  `
        + `<span class="${l.rwCls}">${l.rwStr.padEnd(2, ' ')}</span>  `
        + `<span class="ll-arr">${l.arrName}</span>  `
        + `blk ${String(l.blk).padStart(5, ' ')}  `
        + `<span class="ll-set">set ${String(l.si).padStart(3, ' ')}</span>  `
        + `<span class="ll-type ${l.typeCls}">${l.typeLabel.padEnd(10, ' ')}</span>  `
        + `[${l.coordStr}]`
        + evPart
        + `\n</span>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function refreshUI(lastResults) {
    const p = getCacheP();

    let hiLine = -1, hiType = '';
    if (lastResults) {
      hiLine = state.accessLineIdx;
      hiType = lastResults.some(r => r.type === 'miss') ? 'miss' : 'hit';
    }

    renderCodePreview(hiLine, hiType);
    renderConfigSummary();
    renderProgress();
    renderCacheTable(p, lastResults ? lastResults[lastResults.length - 1].si : -1, hiType);
    renderBars();
    renderLog();

    // Button states
    const hasSteps = state.steps.length > 0;
    const atEnd    = state.pos >= state.steps.length;

    $('cls-btn-reset').disabled         = false;
    $('cls-btn-step').disabled          = !hasSteps || atEnd || state.playing;
    $('cls-btn-play').disabled          = !hasSteps || atEnd || state.playing;
    $('cls-btn-stop').disabled          = !state.playing;
    $('cls-btn-play').textContent       = state.playing ? 'Pause (P)' : 'Play (P)';
  }

  function onConfigChange() {
    buildCodeLines();
    renderDims();
    resetSimulation();
  }

  function handleKeyDown(e) {
    if (document.activeElement.tagName === 'INPUT'
      || document.activeElement.tagName === 'SELECT') return;
    const key = e.key.toLowerCase();
    if      (key === 'r')                              { e.preventDefault(); resetSimulation(); }
    else if (key === 's' && !$('cls-btn-step').disabled) {
      e.preventDefault();
      stopPlay();
      const results = step();
      refreshUI(results);
    }
    else if (key === 'p' && !$('cls-btn-play').disabled) { e.preventDefault(); startPlay(); }
    else if (key === 'x' && !$('cls-btn-stop').disabled) { e.preventDefault(); stopPlay();  }
  }

  function attach() {
    // Kernel buttons
    $('cls-kernel-row').addEventListener('click', e => {
      const btn = e.target.closest('[data-kernel]');
      if (!btn) return;
      state.kernel = btn.dataset.kernel;
      renderKernels();
      onConfigChange();
    });

    // Dimension list — inputs, selects, delete buttons (event delegation)
    $('cls-dlist').addEventListener('input', e => {
      const el    = e.target;
      const i     = parseInt(el.dataset.dim, 10);
      const field = el.dataset.field;
      if (isNaN(i) || !field) return;
      if      (field === 'v')      state.dims[i].v      = el.value;
      else if (field === 'bound')  state.dims[i].bound  = parseInt(el.value, 10) || 1;
      else if (field === 'stride') state.dims[i].stride = parseInt(el.value, 10) || 1;
      else if (field === 'order')  state.dims[i].order  = parseInt(el.value, 10);
      onConfigChange();
    });

    $('cls-dlist').addEventListener('click', e => {
      const btn = e.target.closest('[data-deldim]');
      if (!btn || state.dims.length <= 1) return;
      state.dims.splice(parseInt(btn.dataset.deldim, 10), 1);
      onConfigChange();
    });

    // Add dimension
    $('cls-addbtn').addEventListener('click', () => {
      if (state.dims.length >= 6) return;
      const used = new Set(state.dims.map(d => d.v));
      const next = DIM_VARS.find(v => !used.has(v)) || 'x';
      state.dims.push({ v: next, bound: 4, stride: 1, order: state.dims.length });
      onConfigChange();
    });

    // Cache config — fire onConfigChange on every change event
    ['cls-cache-kb', 'cls-block-bytes', 'cls-dtype', 'cls-assoc', 'cls-ways', 'cls-policy']
      .forEach(id => {
        const el = $(id);
        if (el) el.addEventListener('change', onConfigChange);
      });

    // Show/hide N-ways field
    $('cls-assoc').addEventListener('change', () => {
      const wf = $('cls-ways-field');
      if (wf) wf.style.display = $('cls-assoc').value === 'sa' ? '' : 'none';
    });

    // Floating action buttons
    $('cls-btn-reset').addEventListener('click', resetSimulation);
    $('cls-btn-step').addEventListener('click', () => {
      stopPlay();
      const results = step();
      refreshUI(results);
    });
    $('cls-btn-play').addEventListener('click', () => {
      if (state.playing) stopPlay(); else startPlay();
    });
    $('cls-btn-stop').addEventListener('click', stopPlay);

    // Keyboard
    window.addEventListener('keydown', handleKeyDown);

    // Initial render
    buildCodeLines();
    renderKernels();
    renderDims();
    resetSimulation();
  }

  document.addEventListener('DOMContentLoaded', attach);
})();