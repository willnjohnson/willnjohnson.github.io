(function () {
  let cyTab1, cyTab2;

  function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
        
        if (tab.dataset.target === 'tab-regex-to-dfa' && cyTab1) {
          cyTab1.resize();
          cyTab1.fit(50);
        } else if (tab.dataset.target === 'tab-dfa-to-regex' && cyTab2) {
          cyTab2.resize();
          cyTab2.fit(50);
        }
      });
    });
  }

  // --- Shared Cytoscape Graph Rendering ---
  function createGraph(containerId, elements, startStateId, phantomId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    // Hard reset the DOM to prevent Cytoscape diffing issues on fresh data
    container.innerHTML = '';

    const cyInstance = cytoscape({
      container: container,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#ffffff',
            'border-width': 2,
            'border-color': '#111111',
            'width': '45px',
            'height': '45px',
            'label': 'data(id)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-family': 'New Computer Modern Math, serif',
            'font-size': '16px'
          }
        },
        {
          selector: 'node[type="start"]',
          style: {
            'border-color': '#007bff',
            'border-width': 3
          }
        },
        {
          selector: 'node[type="phantom"]',
          style: {
            'width': '1px',
            'height': '1px',
            'opacity': 0,
            'events': 'no',
            'label': ''
          }
        },
        {
          selector: 'node[type="final"]',
          style: {
            'border-style': 'double',
            'border-width': 5,
            'border-color': '#111111'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.25,
            'line-color': '#111111',
            'target-arrow-color': '#111111',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '11px',
            'font-family': 'Fira Code, Monaco, monospace',
            'text-wrap': 'wrap',
            'text-background-opacity': 1,
            'text-background-color': '#ffffff',
            'text-background-padding': '3px',
            'text-background-shape': 'round-rectangle',
            'control-point-step-size': 40
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 60,
        rankSep: 100
      }
    });

    cyInstance.on('position', 'node#' + startStateId, function (evt) {
      const pos = evt.target.position();
      const phantomNode = cyInstance.$('#' + phantomId);
      if (phantomNode.length > 0) {
        phantomNode.position({ x: pos.x - 70, y: pos.y });
      }
    });

    cyInstance.ready(() => {
      const startNode = cyInstance.$('#' + startStateId);
      if (startNode.length > 0) startNode.emit('position');
      cyInstance.fit(50);
    });

    return cyInstance;
  }

  function renderTransitionTable(states, alphabet, delta) {
    const container = document.getElementById('dfa-transition-table');
    let html = '<table><thead><tr><th></th>';
    alphabet.forEach(symbol => { html += `<th>${symbol}</th>`; });
    html += '</tr></thead><tbody>';

    states.forEach(state => {
      html += `<tr><td>${state}</td>`;
      alphabet.forEach(symbol => {
        const targets = delta.filter(d => d.src === state && d.symbol === symbol).map(d => d.target);
        html += `<td>${targets.length > 0 ? targets.join(', ') : ''}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ==========================================
  // TAB 1: Regex to DFA
  // ==========================================
  function handleRegexToDFA() {
    const regex = document.getElementById('regex-input').value.trim();
    const sigmaInput = document.getElementById('regex-sigma-input').value;
    const alphabet = sigmaInput.split(',').map(s => s.trim()).filter(s => s);

    let resultData;
    try {
      resultData = computeDFALogic(regex, alphabet);
    } catch (err) {
      // Surface parse/build errors in the UI instead of throwing and leaving stale state on screen
      document.getElementById('dfa-formal-def').innerHTML =
        `<span style="color:#dc3545;font-weight:bold;">Error: ${err.message}</span>`;
      document.getElementById('regex-simplification').innerHTML = '';
      document.getElementById('dfa-transition-table').innerHTML = '';
      if (cyTab1) { cyTab1.destroy(); cyTab1 = null; }
      const container = document.getElementById('dfa-cy');
      if (container) container.innerHTML = '';
      return;
    }

    document.getElementById('dfa-formal-def').innerHTML = 
      `<strong>N</strong> = (Q, &Sigma;, &delta;, q<sub>0</sub>, F)<br><br>
       <strong>&Sigma;</strong> = { ${alphabet.join(', ')} }<br>
       <strong>F</strong> = { ${resultData.finalStates.join(', ')} }<br><br>
       <strong>Q</strong> = { ${resultData.states.join(', ')} }<br>
       <strong>q<sub>0</sub></strong> = ${resultData.startState}`;

    document.getElementById('regex-simplification').innerHTML = resultData.simplificationSteps.join('<br><br>');
    renderTransitionTable(resultData.states, alphabet, resultData.transitions);

    const elements = [];
    const phantomId = 'phantom_start_tab1';
    elements.push({ data: { id: phantomId, type: 'phantom' } });
    
    resultData.states.forEach(state => {
      let type = 'standard';
      if (state === resultData.startState) type = 'start';
      if (resultData.finalStates.includes(state)) type = 'final';
      elements.push({ data: { id: state, type: type } });
    });

    elements.push({ data: { source: phantomId, target: resultData.startState, label: '' } });

    const edgeMap = {};
    resultData.transitions.forEach(t => {
      const key = t.src + '->' + t.target;
      if (!edgeMap[key]) edgeMap[key] = [];
      edgeMap[key].push(t.symbol);
    });

    Object.keys(edgeMap).forEach(key => {
      const parts = key.split('->');
      elements.push({ data: { source: parts[0], target: parts[1], label: edgeMap[key].join('\n') } });
    });

    if (cyTab1) { cyTab1.destroy(); }
    cyTab1 = createGraph('dfa-cy', elements, resultData.startState, phantomId);
  }

  // ==========================================================================
  // REGEX -> DFA ALGORITHM
  // Pipeline: tokenize -> recursive-descent parse -> Thompson's Construction
  //           (regex AST -> epsilon-NFA) -> Subset Construction (NFA -> DFA)
  //           -> Moore-style minimization -> relabel states q0..qn
  //
  // Grammar (note: per this app's convention, '+' is UNION, not Kleene-plus):
  //   Expr   := Term ('+' Term)*
  //   Term   := Factor* (juxtaposition = concatenation)
  //   Factor := Base '*'*
  //   Base   := SYMBOL | EPSILON | '(' Expr ')'
  // ==========================================================================
  function tokenizeRegex(regex, alphabet) {
    // Longest-match-first so multi-character alphabet symbols (e.g. "ab") tokenize correctly
    const sortedAlphabet = [...alphabet].sort((a, b) => b.length - a.length);
    const tokens = [];
    let i = 0;
    while (i < regex.length) {
      const ch = regex[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '(' || ch === ')' || ch === '+' || ch === '*') {
        tokens.push({ type: ch, value: ch });
        i++;
        continue;
      }
      let matched = null;
      for (const sym of sortedAlphabet) {
        if (sym.length > 0 && regex.startsWith(sym, i)) { matched = sym; break; }
      }
      if (matched) {
        tokens.push({ type: 'SYMBOL', value: matched });
        i += matched.length;
        continue;
      }
      if (ch === '\u03b5' || ch === '@') { // epsilon, written as 'ε' (or '@' as an ASCII fallback)
        tokens.push({ type: 'EPSILON', value: 'ε' });
        i++;
        continue;
      }
      throw new Error(`Unexpected character '${ch}' at position ${i}. Make sure every symbol used is listed in the alphabet (&Sigma;).`);
    }
    return tokens;
  }

  function parseRegex(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = (type) => {
      const t = tokens[pos];
      if (!t || (type && t.type !== type)) {
        throw new Error(`Parse error: expected '${type}' but found ${t ? `'${t.value}'` : 'end of input'}.`);
      }
      pos++;
      return t;
    };

    function parseExpr() {
      let node = parseTerm();
      while (peek() && peek().type === '+') {
        consume('+');
        node = { type: 'union', left: node, right: parseTerm() };
      }
      return node;
    }

    function parseTerm() {
      let node = null;
      while (peek() && (peek().type === 'SYMBOL' || peek().type === 'EPSILON' || peek().type === '(')) {
        const factor = parseFactor();
        node = node ? { type: 'concat', left: node, right: factor } : factor;
      }
      if (!node) {
        const found = peek() ? `'${peek().value}'` : 'end of input';
        throw new Error(`Expected a symbol, '(', or epsilon here, but found ${found}. Use the epsilon character (&epsilon;) to denote the empty string explicitly, e.g. "0+&epsilon;".`);
      }
      return node;
    }

    function parseFactor() {
      let node = parseBase();
      while (peek() && peek().type === '*') {
        consume('*');
        node = { type: 'star', child: node };
      }
      return node;
    }

    function parseBase() {
      const t = peek();
      if (!t) throw new Error('Unexpected end of regular expression.');
      if (t.type === 'SYMBOL') { consume('SYMBOL'); return { type: 'symbol', value: t.value }; }
      if (t.type === 'EPSILON') { consume('EPSILON'); return { type: 'epsilon' }; }
      if (t.type === '(') {
        consume('(');
        const inner = parseExpr();
        consume(')');
        return inner;
      }
      throw new Error(`Unexpected token '${t.value}' in regular expression.`);
    }

    if (tokens.length === 0) {
      return { type: 'epsilon' }; // a fully blank input means the language { ε }
    }

    const ast = parseExpr();
    if (pos !== tokens.length) {
      throw new Error(`Unexpected trailing input near '${tokens[pos].value}'.`);
    }
    return ast;
  }

  function astToString(node) {
    switch (node.type) {
      case 'symbol': return node.value;
      case 'epsilon': return '&epsilon;';
      case 'concat': return astToString(node.left) + astToString(node.right);
      case 'union': return `(${astToString(node.left)} &cup; ${astToString(node.right)})`;
      case 'star': return `(${astToString(node.child)})*`;
      default: return '?';
    }
  }

  function buildNFA(ast) {
    // Thompson's construction: regex AST -> epsilon-NFA
    let counter = 0;
    const newState = () => counter++;
    const transitions = [];
    const addEdge = (src, symbol, dst) => transitions.push({ src, symbol, dst }); // symbol === null means epsilon

    function build(node) {
      switch (node.type) {
        case 'symbol': {
          const s = newState(), e = newState();
          addEdge(s, node.value, e);
          return { start: s, end: e };
        }
        case 'epsilon': {
          const s = newState(), e = newState();
          addEdge(s, null, e);
          return { start: s, end: e };
        }
        case 'concat': {
          const a = build(node.left), b = build(node.right);
          addEdge(a.end, null, b.start);
          return { start: a.start, end: b.end };
        }
        case 'union': {
          const a = build(node.left), b = build(node.right);
          const s = newState(), e = newState();
          addEdge(s, null, a.start); addEdge(s, null, b.start);
          addEdge(a.end, null, e); addEdge(b.end, null, e);
          return { start: s, end: e };
        }
        case 'star': {
          const a = build(node.child);
          const s = newState(), e = newState();
          addEdge(s, null, a.start);
          addEdge(a.end, null, e);
          addEdge(s, null, e);
          addEdge(a.end, null, a.start);
          return { start: s, end: e };
        }
        default:
          throw new Error('Unknown AST node type: ' + node.type);
      }
    }

    const { start, end } = build(ast);
    return { start, accept: end, numStates: counter, transitions };
  }

  function epsilonClosure(seedStates, nfaTransitions) {
    // NFA -> DFA
    const stack = [...seedStates];
    const closure = new Set(seedStates);
    while (stack.length) {
      const s = stack.pop();
      nfaTransitions.forEach(t => {
        if (t.src === s && t.symbol === null && !closure.has(t.dst)) {
          closure.add(t.dst);
          stack.push(t.dst);
        }
      });
    }
    return closure;
  }

  function move(states, symbol, nfaTransitions) {
    const result = new Set();
    nfaTransitions.forEach(t => {
      if (states.has(t.src) && t.symbol === symbol) result.add(t.dst);
    });
    return result;
  }

  const setKey = (set) => [...set].sort((a, b) => a - b).join(',');

  function subsetConstruction(nfa, alphabet) {
    const startSet = epsilonClosure([nfa.start], nfa.transitions);
    const startKey = setKey(startSet);

    const dfaStates = new Map(); // key (sorted NFA-state-id list) -> { id, nfaSet }
    dfaStates.set(startKey, { id: 0, nfaSet: startSet });
    const queue = [startSet];
    let nextId = 1;

    const dfaTransitions = []; // { srcKey, symbol, dstKey }

    while (queue.length) {
      const current = queue.shift();
      const currentKey = setKey(current);

      alphabet.forEach(symbol => {
        const moved = move(current, symbol, nfa.transitions);
        if (moved.size === 0) return; // no transition for this symbol => implicit dead state, omit
        const closure = epsilonClosure(moved, nfa.transitions);
        const key = setKey(closure);
        if (!dfaStates.has(key)) {
          dfaStates.set(key, { id: nextId++, nfaSet: closure });
          queue.push(closure);
        }
        dfaTransitions.push({ srcKey: currentKey, symbol, dstKey: key });
      });
    }

    const acceptingKeys = new Set();
    dfaStates.forEach((val, key) => { if (val.nfaSet.has(nfa.accept)) acceptingKeys.add(key); });

    return { dfaStates, dfaTransitions, startKey, acceptingKeys };
  }

  function buildCompleteDFA(dfaStates, dfaTransitions, alphabet) {
    // Adds temporary explicit trap state so every (state, symbol) pair is defined,
    // runs partition refinement, then strips trap state back out so the displayed
    // DFA stays in existing "blank = no transition" style.
    const TRAP = '__TRAP__';
    const allKeys = [...dfaStates.keys(), TRAP];
    const transMap = {};
    allKeys.forEach(k => { transMap[k] = {}; });
    dfaTransitions.forEach(t => { transMap[t.srcKey][t.symbol] = t.dstKey; });
    allKeys.forEach(k => {
      alphabet.forEach(sym => { if (!(sym in transMap[k])) transMap[k][sym] = TRAP; });
    });
    return { allKeys, transMap, TRAP };
  }

  function minimizeDFA(dfaStates, dfaTransitions, startKey, acceptingKeys, alphabet) {
    const { allKeys, transMap, TRAP } = buildCompleteDFA(dfaStates, dfaTransitions, alphabet);

    let partition = [
      allKeys.filter(k => acceptingKeys.has(k)),
      allKeys.filter(k => !acceptingKeys.has(k))
    ].filter(p => p.length > 0);

    const blockIndexOf = (key, part) => part.findIndex(block => block.includes(key));

    let changed = true;
    while (changed) {
      changed = false;
      const newPartition = [];
      partition.forEach(block => {
        const groups = new Map();
        block.forEach(key => {
          const sig = alphabet.map(sym => blockIndexOf(transMap[key][sym], partition)).join(',');
          if (!groups.has(sig)) groups.set(sig, []);
          groups.get(sig).push(key);
        });
        if (groups.size > 1) changed = true;
        groups.forEach(g => newPartition.push(g));
      });
      partition = newPartition;
    }

    const blockOf = {};
    partition.forEach((block, idx) => block.forEach(key => { blockOf[key] = idx; }));
    const trapBlock = blockOf[TRAP];

    const minStates = partition.map((_, idx) => idx).filter(idx => idx !== trapBlock);
    const minStart = blockOf[startKey];
    const minAccepting = partition
      .map((block, idx) => idx)
      .filter(idx => idx !== trapBlock && partition[idx].some(k => acceptingKeys.has(k)));

    const minTransitions = [];
    partition.forEach((block, idx) => {
      if (idx === trapBlock) return;
      const repKey = block[0];
      alphabet.forEach(sym => {
        const destBlock = blockOf[transMap[repKey][sym]];
        if (destBlock !== trapBlock) minTransitions.push({ src: idx, symbol: sym, target: destBlock });
      });
    });

    return {
      minStates, minStart, minAccepting, minTransitions,
      originalCount: dfaStates.size,
      minimizedCount: minStates.length
    };
  }

  function relabelStates(states, start, accepting, transitions) {
    // Use BFS to relabel states
    if (!states.includes(start)) {
      // Degenerate case: start state turned out equivalent to the dead state
      return { states: ['q0'], startState: 'q0', finalStates: [], transitions: [] };
    }

    const adjacency = {};
    states.forEach(s => { adjacency[s] = []; });
    transitions.forEach(t => adjacency[t.src].push(t.target));

    const order = [start];
    const visited = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      [...adjacency[cur]].sort((a, b) => a - b).forEach(n => {
        if (!visited.has(n)) { visited.add(n); order.push(n); queue.push(n); }
      });
    }
    states.forEach(s => { if (!visited.has(s)) order.push(s); }); // safety net for any stray unreachable id

    const labelMap = {};
    order.forEach((s, idx) => { labelMap[s] = 'q' + idx; });

    return {
      states: order.map(s => labelMap[s]),
      startState: labelMap[start],
      finalStates: accepting.map(s => labelMap[s]),
      transitions: transitions.map(t => ({ src: labelMap[t.src], symbol: t.symbol, target: labelMap[t.target] }))
    };
  }

  function computeDFALogic(regex, alphabet) {
    const steps = [];
    steps.push(`<strong>1. Input:</strong> Regular Expression = <code>${regex}</code><br><strong>&Sigma;</strong> = { ${alphabet.join(', ')} }`);

    const tokens = tokenizeRegex(regex, alphabet);
    const ast = parseRegex(tokens);
    steps.push(`<strong>2. Parse:</strong> ${astToString(ast)}`);

    const nfa = buildNFA(ast);
    steps.push(`<strong>3. Thompson's Construction:</strong> built an &epsilon;-NFA with ${nfa.numStates} states.`);

    const { dfaStates, dfaTransitions, startKey, acceptingKeys } = subsetConstruction(nfa, alphabet);
    steps.push(`<strong>4. Subset Construction:</strong> determinized into a DFA with ${dfaStates.size} reachable state(s).`);

    const min = minimizeDFA(dfaStates, dfaTransitions, startKey, acceptingKeys, alphabet);
    steps.push(min.minimizedCount < min.originalCount
      ? `<strong>5. Minimization:</strong> merged equivalent states, reducing ${min.originalCount} state(s) down to ${min.minimizedCount}.`
      : `<strong>5. Minimization:</strong> the DFA was already minimal (${min.minimizedCount} state(s)).`);

    const relabeled = relabelStates(min.minStates, min.minStart, min.minAccepting, min.minTransitions);

    return {
      states: relabeled.states,
      startState: relabeled.startState,
      finalStates: relabeled.finalStates,
      simplificationSteps: steps,
      transitions: relabeled.transitions
    };
  }

  function buildDynamicInputTable() {
    // DFA to Regex
    const states = document.getElementById('dfa-states-input').value.split(',').map(s => s.trim()).filter(Boolean);
    const alphabet = document.getElementById('dfa-sigma-input').value.split(',').map(s => s.trim()).filter(Boolean);
    const container = document.getElementById('dfa-dynamic-table');

    let html = '<table><thead><tr><th></th>';
    alphabet.forEach(sym => { html += `<th>${sym}</th>`; });
    html += '</tr></thead><tbody>';

    states.forEach(state => {
      html += `<tr><td><strong>${state}</strong></td>`;
      alphabet.forEach(sym => {
        html += `<td><select data-src="${state}" data-sym="${sym}">`;
        html += `<option value="">--</option>`;
        states.forEach(s => { html += `<option value="${s}">${s}</option>`; });
        html += `</select></td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function handleDFAToRegex() {
    const states = document.getElementById('dfa-states-input').value.split(',').map(s => s.trim()).filter(Boolean);
    const q0 = document.getElementById('dfa-start-input').value.trim();
    const finalStates = document.getElementById('dfa-final-input').value.split(',').map(s => s.trim()).filter(Boolean);
    
    const stepsContainer = document.getElementById('state-elim-steps');
    const finalOutput = document.getElementById('final-regex-output');
    const canvasContainer = document.getElementById('dfa-to-regex-canvas-container');

    // Reset UI
    stepsContainer.innerHTML = '';
    finalOutput.innerHTML = '';
    if (cyTab2) { cyTab2.destroy(); cyTab2 = null; }
    canvasContainer.style.display = 'block';

    // Validation 1: Check for Final States
    if (finalStates.length === 0) {
      stepsContainer.innerHTML = '<span style="color: #dc3545; font-weight: bold;">Error: No final states defined. The accepted language is empty (&empty;).</span>';
      finalOutput.innerHTML = '&empty;';
      canvasContainer.style.display = 'none';
      return;
    }

    const transitions = [];
    const selects = document.querySelectorAll('#dfa-dynamic-table select');
    selects.forEach(sel => {
      const target = sel.value;
      if (target) {
        transitions.push({
          src: sel.getAttribute('data-src'),
          symbol: sel.getAttribute('data-sym'),
          target: target
        });
      }
    });

    // Validation 2: BFS for Unreachable States
    const visited = new Set([q0]);
    const queue = [q0];
    while (queue.length > 0) {
      const current = queue.shift();
      transitions.filter(t => t.src === current).forEach(t => {
        if (!visited.has(t.target)) {
          visited.add(t.target);
          queue.push(t.target);
        }
      });
    }
    const unreachable = states.filter(s => !visited.has(s));
    if (unreachable.length > 0) {
      stepsContainer.innerHTML = `<span style="color: #dc3545; font-weight: bold;">Error: The following states are unreachable from the start state: ${unreachable.join(', ')}. Please update your transition matrix or remove them from Q.</span>`;
      finalOutput.innerHTML = 'Invalid DFA';
      canvasContainer.style.display = 'none';
      return;
    }

    // Run Algebraic State Elimination Solver
    const result = computeStateEliminationRegex(states, q0, finalStates, transitions);

    stepsContainer.innerHTML = result.steps.join('<br><br>');
    finalOutput.innerHTML = result.finalRegex;

    // Build Graph Elements
    const elements = [];
    const phantomId = 'phantom_start_tab2';
    elements.push({ data: { id: phantomId, type: 'phantom' } });

    states.forEach(state => {
      let type = 'standard';
      if (state === q0) type = 'start';
      if (finalStates.includes(state)) type = 'final';
      elements.push({ data: { id: state, type: type } });
    });

    elements.push({ data: { source: phantomId, target: q0, label: '' } });

    const edgeMap = {};
    transitions.forEach(t => {
      const key = t.src + '->' + t.target;
      if (!edgeMap[key]) edgeMap[key] = [];
      edgeMap[key].push(t.symbol);
    });

    Object.keys(edgeMap).forEach(key => {
      const parts = key.split('->');
      elements.push({ data: { source: parts[0], target: parts[1], label: edgeMap[key].join('\n') } });
    });

    cyTab2 = createGraph('dfa-to-regex-cy', elements, q0, phantomId);
  }

  function computeStateEliminationRegex(states, q0, finalStates, transitions) {
    // State elimination using GNFA algorithm
    // - Add synthetic start/accept state
    // - Repeatedly remove one original state at a time
    // - Fold it into regex on surrounding edges
    //
    // Remove state's own self-loop via Arden's Theorem (R = R_loop*R_rest)
    let gnfa = {};
    const START = 'q_GNFA_START';
    const ACCEPT = 'q_GNFA_ACCEPT';
    const allStates = [START, ACCEPT, ...states];

    const startLabel = 'q<sub>start</sub>';
    const acceptLabel = 'q<sub>accept</sub>';
    const display = (s) => (s === START ? startLabel : (s === ACCEPT ? acceptLabel : s));

    allStates.forEach(s => gnfa[s] = {});

    allStates.forEach(i => {
      allStates.forEach(j => { gnfa[i][j] = '&empty;'; });
    });

    transitions.forEach(t => {
      if (gnfa[t.src][t.target] === '&empty;') {
        gnfa[t.src][t.target] = t.symbol;
      } else {
        gnfa[t.src][t.target] += '+' + t.symbol;
      }
    });

    gnfa[START][q0] = '&epsilon;';
    finalStates.forEach(f => { gnfa[f][ACCEPT] = '&epsilon;'; });

    let steps = [];
    let stepNum = 1;
    steps.push(
      `<strong>${stepNum++}. Initialize the GNFA:</strong> Add a new start state ${startLabel} with an ` +
      `&epsilon;-transition to ${display(q0)}, and a new accept state ${acceptLabel} with an ` +
      `&epsilon;-transition in from each final state (${finalStates.map(display).join(', ')}).`
    );

    const formatOr = (a, b) => {
      if (a === '&empty;') return b;
      if (b === '&empty;') return a;
      if (a === b) return a;
      return `${a}+${b}`;
    };

    const formatConcat = (a, b) => {
      if (a === '&empty;' || b === '&empty;') return '&empty;';
      if (a === '&epsilon;') return b;
      if (b === '&epsilon;') return a;
      const wrapA = a.includes('+') ? `(${a})` : a;
      const wrapB = b.includes('+') ? `(${b})` : b;
      return `${wrapA}${wrapB}`;
    };

    const formatStar = (a) => {
      if (a === '&empty;' || a === '&epsilon;') return '&epsilon;';
      if (a.length === 1) return `${a}*`;
      return `(${a})*`;
    };

    states.forEach(q_elim => {
      steps.push(
        `<strong>${stepNum++}. Eliminate ${display(q_elim)}:</strong> for every remaining pair ` +
        `(q<sub>in</sub>, q<sub>out</sub>) with a path through ${display(q_elim)}, fold it in with ` +
        `R = R<sub>in</sub>(R<sub>loop</sub>)*R<sub>out</sub> (Arden's Theorem applied to ${display(q_elim)}'s self-loop):`
      );
      let pathAdded = false;
      const pathLines = [];

      allStates.forEach(q_in => {
        if (q_in === q_elim || q_in === ACCEPT) return;

        allStates.forEach(q_out => {
          if (q_out === q_elim || q_out === START) return;

          const r_in_elim = gnfa[q_in][q_elim];
          const r_elim_elim = gnfa[q_elim][q_elim];
          const r_elim_out = gnfa[q_elim][q_out];
          const r_in_out = gnfa[q_in][q_out];

          if (r_in_elim !== '&empty;' && r_elim_out !== '&empty;') {
             const loop = formatStar(r_elim_elim);
             const path = formatConcat(formatConcat(r_in_elim, loop), r_elim_out);
             const new_regex = formatOr(r_in_out, path);
             gnfa[q_in][q_out] = new_regex;

             const substitution =
               `R<sub>in</sub>=${r_in_elim}, R<sub>loop</sub>=${r_elim_elim}, R<sub>out</sub>=${r_elim_out} ` +
               `&nbsp;&rArr;&nbsp; R<sub>in</sub>(R<sub>loop</sub>)*R<sub>out</sub> = ${path}`;
             const union = r_in_out === '&empty;'
               ? ''
               : ` &nbsp;&nbsp;(combined with existing path: ${r_in_out} &cup; ${path} = <strong>${new_regex}</strong>)`;

             pathLines.push(
               `&nbsp;&nbsp;&bull; <strong>${display(q_in)} &rarr; ${display(q_out)}</strong>: ${substitution}${union}`
             );
             pathAdded = true;
          }
        });
      });

      steps.push(pathAdded
        ? pathLines.join('<br>')
        : `&nbsp;&nbsp;&bull; ${display(q_elim)} had no in/out paths to carry forward.`);

      allStates.forEach(s => {
        gnfa[s][q_elim] = '&empty;';
        gnfa[q_elim][s] = '&empty;';
      });
    });

    const finalRegex = gnfa[START][ACCEPT];
    return {
      steps: steps,
      finalRegex: finalRegex === '&empty;' ? '&empty; (Empty Language)' : finalRegex
    };
  }

  document.getElementById('generate-dfa-btn').addEventListener('click', handleRegexToDFA);
  document.getElementById('generate-regex-btn').addEventListener('click', handleDFAToRegex);
  document.getElementById('update-table-btn').addEventListener('click', buildDynamicInputTable);
  
  const fitBtn1 = document.getElementById('dfa-fit-btn');
  if (fitBtn1) fitBtn1.addEventListener('click', () => { if (cyTab1) cyTab1.fit(50); });

  const fitBtn2 = document.getElementById('dfa-to-regex-fit-btn');
  if (fitBtn2) fitBtn2.addEventListener('click', () => { if (cyTab2) cyTab2.fit(50); });

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    handleRegexToDFA(); 
    buildDynamicInputTable(); 
  });

})();