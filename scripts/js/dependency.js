// A simplified scheduler with hazard tracking
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // Instruction formats
  //
  // category  -> which configurable latency applies (fpmul/fpadd/fpdiv/int/branch)
  // format    -> which operand template to render / read
  //   rtype:   dest, src1, src2      (all registers, types fixed by op)
  //   itype:   dest, src1, #imm      (registers + immediate)
  //   load:    dest, #offset, base   (base is always an R register)
  //   store:   val, #offset, base    (no destination register)
  //   branch:  src1, src2, label     (no destination register)
  const OPS = {
    'L.D':   { category: 'int',    format: 'load',   destType: 'F', baseType: 'R' },
    'S.D':   { category: 'int',    format: 'store',  valType: 'F',  baseType: 'R' },
    'LW':    { category: 'int',    format: 'load',   destType: 'R', baseType: 'R' },
    'SW':    { category: 'int',    format: 'store',  valType: 'R',  baseType: 'R' },
    'ADD.D': { category: 'fpadd',  format: 'rtype',  destType: 'F', srcTypes: ['F', 'F'] },
    'SUB.D': { category: 'fpadd',  format: 'rtype',  destType: 'F', srcTypes: ['F', 'F'] },
    'MUL.D': { category: 'fpmul',  format: 'rtype',  destType: 'F', srcTypes: ['F', 'F'] },
    'DIV.D': { category: 'fpdiv',  format: 'rtype',  destType: 'F', srcTypes: ['F', 'F'] },
    'ADD':   { category: 'int',    format: 'rtype',  destType: 'R', srcTypes: ['R', 'R'] },
    'SUB':   { category: 'int',    format: 'rtype',  destType: 'R', srcTypes: ['R', 'R'] },
    'ADDI':  { category: 'int',    format: 'itype',  destType: 'R', srcTypes: ['R'] },
    'BEQ':   { category: 'branch', format: 'branch', srcTypes: ['R', 'R'] },
    'BNE':   { category: 'branch', format: 'branch', srcTypes: ['R', 'R'] },
  };

  const LATENCY_INPUT_IDS = {
    fpmul: 'dep-lat-fpmul',
    fpadd: 'dep-lat-fpadd',
    fpdiv: 'dep-lat-fpdiv',
    int: 'dep-lat-int',
    branch: 'dep-lat-branch',
  };

  // Row state: one entry per instruction row in the builder table
  let rows = [];
  let nextRowId = 1;

  function defaultFieldsFor(op) {
    const meta = OPS[op];
    const fields = { dest: 0, src1: 0, src2: 0, offset: 0, base: 1, val: 0, label: 'L1' };
    return fields;
  }

  function makeRow(op, fields) {
    return { id: nextRowId++, op, fields: Object.assign(defaultFieldsFor(op), fields || {}) };
  }

  // Operand template rendering (per row, based on its op's format)
  function operandsHTML(row) {
    const meta = OPS[row.op];
    const f = row.fields;
    const regSpan = (role, type, value) =>
      `<span class="dep-operand">${type}<input type="number" class="dep-reg" data-role="${role}" min="0" max="31" value="${value}"></span>`;
    const immSpan = (role, value) =>
      `<span class="dep-operand">#<input type="number" class="dep-imm" data-role="${role}" value="${value}"></span>`;
    const labelSpan = (role, value) =>
      `<span class="dep-operand"><input type="text" class="dep-label-input" data-role="${role}" value="${value}"></span>`;

    if (meta.format === 'rtype') {
      return [
        regSpan('dest', meta.destType, f.dest),
        regSpan('src1', meta.srcTypes[0], f.src1),
        regSpan('src2', meta.srcTypes[1], f.src2),
      ].join('<span class="dep-paren">,</span> ');
    }
    if (meta.format === 'itype') {
      return [
        regSpan('dest', meta.destType, f.dest),
        regSpan('src1', meta.srcTypes[0], f.src1),
        immSpan('offset', f.offset),
      ].join('<span class="dep-paren">,</span> ');
    }
    if (meta.format === 'load') {
      return `${regSpan('dest', meta.destType, f.dest)}<span class="dep-paren">,</span> ` +
        `${immSpan('offset', f.offset)}<span class="dep-paren">(</span>${regSpan('base', meta.baseType, f.base)}<span class="dep-paren">)</span>`;
    }
    if (meta.format === 'store') {
      return `${regSpan('val', meta.valType, f.val)}<span class="dep-paren">,</span> ` +
        `${immSpan('offset', f.offset)}<span class="dep-paren">(</span>${regSpan('base', meta.baseType, f.base)}<span class="dep-paren">)</span>`;
    }
    if (meta.format === 'branch') {
      return [
        regSpan('src1', meta.srcTypes[0], f.src1),
        regSpan('src2', meta.srcTypes[1], f.src2),
        labelSpan('label', f.label),
      ].join('<span class="dep-paren">,</span> ');
    }
    return '';
  }

  function opSelectHTML(selected) {
    const groups = [
      ['Floating Point', ['L.D', 'S.D', 'ADD.D', 'SUB.D', 'MUL.D', 'DIV.D']],
      ['Integer', ['LW', 'SW', 'ADD', 'SUB', 'ADDI']],
      ['Branch', ['BEQ', 'BNE']],
    ];
    let html = '<select class="dep-op">';
    for (const [label, ops] of groups) {
      html += `<optgroup label="${label}">`;
      for (const op of ops) {
        html += `<option value="${op}"${op === selected ? ' selected' : ''}>${op}</option>`;
      }
      html += '</optgroup>';
    }
    html += '</select>';
    return html;
  }

  function renderRows() {
    const body = $('dep-instr-body');
    body.innerHTML = '';
    rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.rowId = row.id;
      tr.innerHTML =
        `<td>${idx + 1}</td>` +
        `<td>${opSelectHTML(row.op)}</td>` +
        `<td class="dep-operands">${operandsHTML(row)}</td>` +
        `<td><button type="button" class="dep-row-remove" title="Remove instruction">×</button></td>`;
      body.appendChild(tr);
    });
  }

  function readRowFromDOM(tr) {
    const id = Number(tr.dataset.rowId);
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    tr.querySelectorAll('[data-role]').forEach((el) => {
      const role = el.dataset.role;
      row.fields[role] = el.type === 'number' ? Number(el.value) || 0 : el.value;
    });
  }

  function syncAllRowsFromDOM() {
    $('dep-instr-body').querySelectorAll('tr').forEach(readRowFromDOM);
  }

  // Register helpers
  function regKey(type, num) {
    return `${type}${num}`;
  }

  function getSourceRegs(row) {
    const meta = OPS[row.op];
    const f = row.fields;
    if (meta.format === 'rtype') return [regKey(meta.srcTypes[0], f.src1), regKey(meta.srcTypes[1], f.src2)];
    if (meta.format === 'itype') return [regKey(meta.srcTypes[0], f.src1)];
    if (meta.format === 'load') return [regKey(meta.baseType, f.base)];
    if (meta.format === 'store') return [regKey(meta.valType, f.val), regKey(meta.baseType, f.base)];
    if (meta.format === 'branch') return [regKey(meta.srcTypes[0], f.src1), regKey(meta.srcTypes[1], f.src2)];
    return [];
  }

  function getDestReg(row) {
    const meta = OPS[row.op];
    if (meta.format === 'rtype' || meta.format === 'itype' || meta.format === 'load') {
      return regKey(meta.destType, row.fields.dest);
    }
    return null;
  }

  function formatInstr(row) {
    const meta = OPS[row.op];
    const f = row.fields;
    if (meta.format === 'rtype') return `${row.op} ${meta.destType}${f.dest}, ${meta.srcTypes[0]}${f.src1}, ${meta.srcTypes[1]}${f.src2}`;
    if (meta.format === 'itype') return `${row.op} ${meta.destType}${f.dest}, ${meta.srcTypes[0]}${f.src1}, #${f.offset}`;
    if (meta.format === 'load') return `${row.op} ${meta.destType}${f.dest}, ${f.offset}(${meta.baseType}${f.base})`;
    if (meta.format === 'store') return `${row.op} ${meta.valType}${f.val}, ${f.offset}(${meta.baseType}${f.base})`;
    if (meta.format === 'branch') return `${row.op} ${meta.srcTypes[0]}${f.src1}, ${meta.srcTypes[1]}${f.src2}, ${f.label}`;
    return row.op;
  }

  // Simulation
  //
  // Tomasulo-style dynamic scheduling:
  //  - issue in order, one per cycle, but stalled after a branch until it resolves
  //  - execute begins the cycle after operands are ready and issue has happened
  //  - result broadcasts on the single CDB the cycle after execution ends;
  //    if two results want the same CDB cycle, whichever actually finishes
  //    first wins the bus and the other is pushed back (structural hazard)
  //  - RAW/WAR/WAW are tracked per-register in program order
  //
  // A subtlety: which instruction "wins" a contested CDB cycle depends on
  // real completion order, not program order (a later-issued, dependency-free
  // instruction can easily finish before an earlier-issued one still waiting
  // on an operand). But a consumer's earliest start also depends on its
  // producer's *actual* (post-arbitration) CDB cycle. So timing and
  // arbitration are solved together via fixed-point iteration: recompute
  // issue/execute times from the current CDB estimates, then re-run global
  // CDB arbitration in true completion order, and repeat until nothing
  // changes. Delays only ever push times later, so this always converges.
  function simulate(instrRows, latencies) {
    const n = instrRows.length;
    const srcRegsList = instrRows.map(getSourceRegs);
    const destRegs = instrRows.map(getDestReg);

    // Static register-renaming relationships: which earlier instruction (if
    // any) is the nearest preceding writer of each register. This only
    // depends on program order and register names, never on cycle timing.
    const producerOf = instrRows.map(() => []);
    const hazards = { structural: [], control: [], raw: [], war: [], waw: [] };
    {
      const state = {}; // reg -> { producer: idx|null, readers: [idx,...] }
      const getState = (r) => (state[r] || (state[r] = { producer: null, readers: [] }));
      for (let i = 0; i < n; i++) {
        for (const r of srcRegsList[i]) {
          const st = getState(r);
          if (st.producer !== null) {
            producerOf[i].push(st.producer);
            hazards.raw.push({ consumer: i, producer: st.producer, reg: r });
          }
          st.readers.push(i);
        }
        const d = destRegs[i];
        if (d) {
          const st = getState(d);
          if (st.producer !== null) hazards.waw.push({ writer: i, priorWriter: st.producer, reg: d });
          for (const reader of st.readers) {
            if (reader !== i) hazards.war.push({ writer: i, reader, reg: d });
          }
          st.producer = i;
          st.readers = [];
        }
      }
    }

    let cdb = new Array(n).fill(1);
    let issue = new Array(n);
    let execStart = new Array(n);
    let execEnd = new Array(n);

    for (let iter = 0; iter < n + 5; iter++) {
      issue = new Array(n);
      execStart = new Array(n);
      execEnd = new Array(n);
      const cdbTentative = new Array(n).fill(null);

      for (let i = 0; i < n; i++) {
        const meta = OPS[instrRows[i].op];

        issue[i] = i === 0 ? 1 : issue[i - 1] + 1;
        if (i > 0 && OPS[instrRows[i - 1].op].category === 'branch') {
          issue[i] = Math.max(issue[i], execEnd[i - 1] + 1);
        }

        let ready = 1;
        for (const p of producerOf[i]) ready = Math.max(ready, cdb[p] + 1);

        execStart[i] = Math.max(issue[i] + 1, ready);
        execEnd[i] = execStart[i] + latencies[meta.category] - 1;
        cdbTentative[i] = destRegs[i] ? execEnd[i] + 1 : null;
      }

      // Global CDB arbitration in true completion order (ties broken by
      // program order), not issue order.
      const order = [...Array(n).keys()]
        .filter((i) => destRegs[i] !== null)
        .sort((a, b) => (cdbTentative[a] - cdbTentative[b]) || (a - b));
      const newCdb = new Array(n).fill(null);
      let nextFree = 1;
      for (const i of order) {
        const actual = Math.max(cdbTentative[i], nextFree);
        newCdb[i] = actual;
        nextFree = actual + 1;
      }

      let changed = false;
      for (let i = 0; i < n; i++) if (newCdb[i] !== cdb[i]) changed = true;
      cdb = newCdb;
      if (!changed) break;
    }

    // Build per-row notes and remaining hazard details now that timing is final.
    const rowNotes = new Array(n).fill(null).map(() => []);
    for (const h of hazards.raw) {
      h.availableAt = cdb[h.producer];
      rowNotes[h.consumer].push(`RAW on ${h.reg} (from instr ${h.producer + 1}, ready after cycle ${cdb[h.producer]})`);
    }
    for (let i = 0; i < n; i++) {
      if (destRegs[i] === null) continue;
      const tentative = execEnd[i] + 1;
      if (cdb[i] > tentative) {
        hazards.structural.push({ instr: i, from: tentative, to: cdb[i] });
        rowNotes[i].push(`Structural: CDB busy, delayed from cycle ${tentative} to ${cdb[i]}`);
      }
    }
    for (let i = 0; i < n; i++) {
      if (OPS[instrRows[i].op].category === 'branch') {
        hazards.control.push({ instr: i, resolvedAt: execEnd[i] });
      }
      if (i > 0 && OPS[instrRows[i - 1].op].category === 'branch' && issue[i] > issue[i - 1] + 1) {
        rowNotes[i].push(`Control: waited for instr ${i} to resolve`);
      }
    }

    return { issue, execStart, execEnd, cdb, rowNotes, hazards };
  }

  // Rendering results
  function cycleRange(start, end) {
    return start === end ? `${start}` : `${start}-${end}`;
  }

  function commentFor(i, rowNotes) {
    const notes = rowNotes[i];
    if (notes.length === 0) return i === 0 ? 'First instruction' : 'No dependencies';
    return notes.join('; ');
  }

  function renderResults(instrRows, sim) {
    const table = $('dep-results-table');
    let html = '<thead><tr><th>#</th><th>Instruction</th><th>Issues at</th><th>Executes</th><th>Writes to CDB</th><th>Comment</th></tr></thead><tbody>';
    instrRows.forEach((row, i) => {
      html += '<tr>' +
        `<td>${i + 1}</td>` +
        `<td class="dep-instr-text">${formatInstr(row)}</td>` +
        `<td>${sim.issue[i]}</td>` +
        `<td>${cycleRange(sim.execStart[i], sim.execEnd[i])}</td>` +
        `<td>${sim.cdb[i] !== null ? sim.cdb[i] : '--'}</td>` +
        `<td class="dep-comment">${commentFor(i, sim.rowNotes)}</td>` +
        '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;

    renderHazardSummary(instrRows, sim.hazards);
    $('dep-results-panel').style.display = '';
  }

  function renderHazardSummary(instrRows, hazards) {
    const label = (i) => `#${i + 1} ${instrRows[i].op}`;

    const groups = [
      {
        title: 'Structural Hazards (CDB)',
        tag: 'structural',
        items: hazards.structural.map((h) => `${label(h.instr)} - CDB busy at cycle ${h.from}, delayed to cycle ${h.to}`),
        empty: 'None - every result found a free CDB cycle.',
      },
      {
        title: 'Control Hazards (branches)',
        tag: 'control',
        items: hazards.control.map((h) => `${label(h.instr)} - resolves at cycle ${h.resolvedAt}; next instruction couldn't issue before cycle ${h.resolvedAt + 1}`),
        empty: 'None - no branches in this sequence.',
      },
      {
        title: 'Data Hazards - RAW (true dependency)',
        tag: 'raw',
        items: hazards.raw.map((h) => `${label(h.consumer)} reads ${h.reg}, produced by ${label(h.producer)} (available at cycle ${h.availableAt})`),
        empty: 'None detected.',
      },
      {
        title: 'Data Hazards - WAR (anti-dependency)',
        tag: 'war',
        items: hazards.war.map((h) => `${label(h.writer)} writes ${h.reg}, which ${label(h.reader)} read earlier - resolved by renaming, costs no cycles`),
        empty: 'None detected.',
      },
      {
        title: 'Data Hazards - WAW (output dependency)',
        tag: 'waw',
        items: hazards.waw.map((h) => `${label(h.writer)} writes ${h.reg}, overwriting ${label(h.priorWriter)}'s result - resolved by renaming, costs no cycles`),
        empty: 'None detected.',
      },
    ];

    let html = '';
    for (const g of groups) {
      html += `<div class="dep-hazard-group"><h4><span class="dep-tag dep-tag--${g.tag}">${g.tag.toUpperCase()}</span>${g.title}</h4>`;
      if (g.items.length === 0) {
        html += `<p class="dep-empty">${g.empty}</p>`;
      } else {
        html += `<ul>${g.items.map((t) => `<li>${t}</li>`).join('')}</ul>`;
      }
      html += '</div>';
    }
    $('dep-hazard-summary').innerHTML = html;
  }

  function readLatencies() {
    const latencies = {};
    for (const [cat, id] of Object.entries(LATENCY_INPUT_IDS)) {
      latencies[cat] = Math.max(1, Number($(id).value) || 1);
    }
    return latencies;
  }

  // Wiring
  function insertRow() {
    syncAllRowsFromDOM();
    rows.push(makeRow('ADD.D'));
    renderRows();
  }

  function removeRow(id) {
    syncAllRowsFromDOM();
    rows = rows.filter((r) => r.id !== id);
    renderRows();
  }

  function clearAll() {
    rows = [];
    renderRows();
    $('dep-results-panel').style.display = 'none';
  }

  function analyze() {
    syncAllRowsFromDOM();
    if (rows.length === 0) return;
    const latencies = readLatencies();
    const sim = simulate(rows, latencies);
    renderResults(rows, sim);
  }

  function loadDefaultExample() {
    rows = [
      makeRow('L.D',   { dest: 6, base: 1, offset: 0 }),
      makeRow('SUB.D', { dest: 0, src1: 2, src2: 6 }),
      makeRow('ADD.D', { dest: 6, src1: 0, src2: 8 }),
      makeRow('SUB.D', { dest: 8, src1: 10, src2: 14 }),
      makeRow('MUL.D', { dest: 6, src1: 10, src2: 8 }),
      makeRow('S.D',   { val: 6, base: 1, offset: 0 }),
    ];
    renderRows();
  }

  function init() {
    loadDefaultExample();

    $('dep-insert-btn').addEventListener('click', insertRow);
    $('dep-analyze-btn').addEventListener('click', analyze);
    $('dep-clear-btn').addEventListener('click', clearAll);

    $('dep-instr-body').addEventListener('click', (e) => {
      const btn = e.target.closest('.dep-row-remove');
      if (!btn) return;
      const tr = btn.closest('tr');
      removeRow(Number(tr.dataset.rowId));
    });

    $('dep-instr-body').addEventListener('change', (e) => {
      const select = e.target.closest('select.dep-op');
      if (!select) return;
      syncAllRowsFromDOM();
      const tr = select.closest('tr');
      const id = Number(tr.dataset.rowId);
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      row.op = select.value;
      row.fields = defaultFieldsFor(row.op);
      renderRows();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
