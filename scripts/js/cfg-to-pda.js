(function () {
  let cy;
  let overlayFrame;

  function setStatus(message, isError) {
    const status = document.getElementById('cfgpda-status');
    if (!status) return;

    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(isError));
  }

  function fitDiagram() {
    if (cy) {
      cy.animate({
        fit: { padding: 50 },
        duration: 250,
        easing: 'ease-out'
      });
    }
  }

  function buildPDA() {
    const canvasParent = document.getElementById('cfgpda-canvas-container');
    const container = document.getElementById('cfgpda-cy');

    if (!canvasParent || !container) return;

    document.querySelectorAll('.cfgpda-node-overlay-label').forEach(function (el) {
      el.remove();
    });

    if (cy) {
      cy.destroy();
      cy = null;
      window.__cfgpdaUpdateOverlay = null;
    }

    if (!window.cytoscape) {
      setStatus('Cytoscape could not be loaded. Check your connection and reload the page.', true);
      return;
    }

    const cfgText = document.getElementById('cfgpda-cfg-input').value;
    const sigmaText = document.getElementById('cfgpda-sigma-input').value;

    const terminals = sigmaText.split(',')
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0 && s !== '_'; });

    const lines = cfgText.split('\n');
    const rules = [];
    let startVariable = null;

    lines.forEach(function (line) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const cleanLine = trimmed.replace(/\s+/g, '');
      if (!cleanLine.includes('->')) return;

      const parts = cleanLine.split('->');
      if (parts.length < 2) return;

      const lhs = parts[0];
      const rhsPart = parts.slice(1).join('->');
      if (!lhs) return;

      if (!startVariable) {
        startVariable = lhs[0];
      }

      rhsPart.split('|').forEach(function (rhs) {
        if (rhs.length > 0) {
          rules.push({ lhs: lhs, rhs: rhs });
        }
      });
    });

    if (!startVariable) {
      setStatus('Could not detect a valid start variable.', true);
      return;
    }

    const elements = [];
    let stateCounter = 1;

    const centerX = container.clientWidth ? container.clientWidth / 2 : 400;
    const centerY = container.clientHeight ? container.clientHeight / 2 : 300;

    elements.push({
      data: { id: 'q_entry_phantom', type: 'phantom' },
      position: { x: centerX, y: centerY - 280 }
    });

    elements.push({
      data: { id: 'q_start', htmlLabel: 'q<sub>start</sub>', type: 'start' },
      position: { x: centerX, y: centerY - 220 }
    });
    elements.push({
      data: { id: 'q_loop', htmlLabel: 'q<sub>loop</sub>', type: 'loop' },
      position: { x: centerX, y: centerY }
    });
    elements.push({
      data: { id: 'q_accept', htmlLabel: 'q<sub>accept</sub>', type: 'accept' },
      position: { x: centerX, y: centerY + 220 }
    });

    elements.push({
      data: { source: 'q_entry_phantom', target: 'q_start', label: '' }
    });

    const loopTransitions = [];
    const standardEdgeMap = {};

    function addTransition(source, target, rawLabel) {
      const cleanLabel = rawLabel.replace(/\s+/g, '').replace(/_/g, 'ε');
      if (source === 'q_loop' && target === 'q_loop') {
        loopTransitions.push(cleanLabel);
      } else {
        const key = source + '->' + target;
        if (!standardEdgeMap[key]) {
          standardEdgeMap[key] = [];
        }
        standardEdgeMap[key].push(cleanLabel);
      }
    }

    addTransition('q_start', 'q_loop', '__$');
    addTransition('q_start', 'q_loop', '__' + startVariable);
    addTransition('q_loop', 'q_accept', '_$_');

    terminals.forEach(function (t) {
      addTransition('q_loop', 'q_loop', t + t + '_');
    });

    const multiCharRules = rules.filter(function (rule) {
      return rule.rhs !== '_' && rule.rhs.length > 1;
    });

    const leftNodesGroup = [];
    const rightNodesGroup = [];

    multiCharRules.forEach(function (rule, idx) {
      const lhs = rule.lhs;
      const rhs = rule.rhs;
      let currentSrc = 'q_loop';
      const targetSide = idx % 2 === 0 ? 'left' : 'right';

      for (let i = rhs.length - 1; i >= 0; i--) {
        let nextDest;
        let edgeLabel;

        if (i === rhs.length - 1) {
          nextDest = 'q_int_' + stateCounter++;
          elements.push({
            data: { id: nextDest, htmlLabel: '', type: 'intermediate', side: targetSide }
          });
          (targetSide === 'left' ? leftNodesGroup : rightNodesGroup).push(nextDest);
          edgeLabel = '_' + lhs + rhs[i];
        } else if (i === 0) {
          nextDest = 'q_loop';
          edgeLabel = '__' + rhs[i];
        } else {
          nextDest = 'q_int_' + stateCounter++;
          elements.push({
            data: { id: nextDest, htmlLabel: '', type: 'intermediate', side: targetSide }
          });
          (targetSide === 'left' ? leftNodesGroup : rightNodesGroup).push(nextDest);
          edgeLabel = '__' + rhs[i];
        }

        addTransition(currentSrc, nextDest, edgeLabel);
        currentSrc = nextDest;
      }
    });

    rules.forEach(function (rule) {
      if (rule.rhs === '_') {
        addTransition('q_loop', 'q_loop', '_' + rule.lhs + '_');
      } else if (rule.rhs.length === 1) {
        addTransition('q_loop', 'q_loop', '_' + rule.lhs + rule.rhs);
      }
    });

    Object.keys(standardEdgeMap).forEach(function (key) {
      const parts = key.split('->');
      elements.push({
        data: {
          source: parts[0],
          target: parts[1],
          label: standardEdgeMap[key].join('\n')
        }
      });
    });

    const rulesPerLoop = 3;
    for (let i = 0; i < loopTransitions.length; i += rulesPerLoop) {
      const group = loopTransitions.slice(i, i + rulesPerLoop);
      const loopIndex = Math.floor(i / rulesPerLoop);
      const directionalAngles = ['-45deg', '45deg', '-135deg', '135deg'];
      const targetAngle = directionalAngles[loopIndex % directionalAngles.length];

      elements.push({
        data: {
          source: 'q_loop',
          target: 'q_loop',
          label: group.join('\n')
        },
        style: {
          'loop-direction': targetAngle,
          'control-point-step-size': 110 + (Math.floor(loopIndex / directionalAngles.length) * 35),
          'loop-sweep': '32deg'
        }
      });
    }

    cy = cytoscape({
      container: container,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#ffffff',
            'border-width': 1.5,
            'border-color': '#111111',
            'width': '50px',
            'height': '50px',
            'content': ''
          }
        },
        {
          selector: 'node[type="phantom"]',
          style: {
            'width': '1px',
            'height': '1px',
            'opacity': 0,
            'events': 'no'
          }
        },
        {
          selector: 'node[type="intermediate"]',
          style: {
            'width': '12px',
            'height': '12px',
            'border-color': '#4b5563',
            'background-color': '#4b5563'
          }
        },
        {
          selector: 'node[type="accept"]',
          style: {
            'border-style': 'double',
            'border-width': 4.5,
            'background-color': '#ffffff',
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
            'arrow-scale': 1.1,
            'curve-style': 'bezier',
            'control-point-step-size': 40,
            'label': 'data(label)',
            'text-wrap': 'wrap',
            'font-size': '11px',
            'font-family': 'Fira Code, Monaco, monospace',
            'color': '#111111',
            'text-background-opacity': 1,
            'text-background-color': '#ffffff',
            'text-background-padding': '3px',
            'text-background-shape': 'round-rectangle',
            'edge-distances': 'node-position'
          }
        }
      ],
      layout: { name: 'preset' }
    });

    const canUseDagre = typeof cy.nodes().makeLayout === 'function';

    if (leftNodesGroup.length > 0 && canUseDagre) {
      cy.nodes().filter(function (node) {
        return leftNodesGroup.includes(node.id());
      }).makeLayout({
        name: 'dagre',
        rankDir: 'RL',
        nodeSep: 30,
        rankSep: 60,
        boundingBox: { x1: centerX - 360, y1: centerY - 130, x2: centerX - 60, y2: centerY + 130 }
      }).run();
    }

    if (rightNodesGroup.length > 0 && canUseDagre) {
      cy.nodes().filter(function (node) {
        return rightNodesGroup.includes(node.id());
      }).makeLayout({
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 30,
        rankSep: 60,
        boundingBox: { x1: centerX + 60, y1: centerY - 130, x2: centerX + 360, y2: centerY + 130 }
      }).run();
    }

    cy.ready(function () {
      cy.fit(50);
    });

    cy.on('drag', 'node#q_start', function (evt) {
      const pos = evt.target.position();
      const phantomNode = cy.nodes('#q_entry_phantom');
      if (phantomNode.length > 0) {
        phantomNode.position({
          x: pos.x,
          y: pos.y - 60
        });
      }
    });

    function updateHTMLOverlayPositions() {
      if (!cy) return;

      cancelAnimationFrame(overlayFrame);
      overlayFrame = requestAnimationFrame(function () {
        cy.nodes().forEach(function (node) {
          const htmlText = node.data('htmlLabel');
          if (!htmlText) return;

          let labelEl = document.getElementById('overlay-' + node.id());
          if (!labelEl) {
            labelEl = document.createElement('div');
            labelEl.id = 'overlay-' + node.id();
            labelEl.className = 'cfgpda-node-overlay-label';
            labelEl.innerHTML = htmlText;
            canvasParent.appendChild(labelEl);
          }

          const renderedPos = node.renderedPosition();
          labelEl.style.left = renderedPos.x + 'px';
          labelEl.style.top = renderedPos.y + 'px';
        });
      });
    }

    updateHTMLOverlayPositions();
    window.__cfgpdaUpdateOverlay = updateHTMLOverlayPositions;
    cy.on('render pan zoom drag', updateHTMLOverlayPositions);
  }

  document.getElementById('cfgpda-generate-btn').addEventListener('click', buildPDA);
  document.getElementById('cfgpda-fit-btn').addEventListener('click', fitDiagram);

  window.addEventListener('resize', function () {
    if (cy) {
      cy.resize();
      const update = window.__cfgpdaUpdateOverlay;
      if (update) update();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildPDA);
  } else {
    buildPDA();
  }
})();
