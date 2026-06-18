(function () {
  let cy = null;
  let selectedNodeId = null;
  let overlayFrame = null;

  const ELEMENTS = {
    // Tier 0: Quintessence
    water: { emoji: '💧', name: 'Water' },
    fire: { emoji: '🔥', name: 'Fire' },
    air: { emoji: '💨', name: 'Air' },
    earth: { emoji: '🌱', name: 'Earth' },
    light: { emoji: '✨', name: 'Light' },

    // Tier 1: Primary Nature
    sea: { emoji: '🌊', name: 'Sea' },
    plant: { emoji: '🌿', name: 'Plant' },
    energy: { emoji: '⚡', name: 'Energy' },
    dust: { emoji: '🍃', name: 'Dust' },
    sand: { emoji: '🏖️', name: 'Sand' },
    lava: { emoji: '🌋', name: 'Lava' },
    stone: { emoji: '🪨', name: 'Stone' },
    sun: { emoji: '☀️', name: 'Sun' },
    swamp: { emoji: '🐊', name: 'Swamp' },

    // Tier 2: Materials & Environment
    clay: { emoji: '⚱️', name: 'Clay' },
    coal: { emoji: '🪵', name: 'Coal' },
    metal: { emoji: '🪙', name: 'Metal' },
    desert: { emoji: '🏜️', name: 'Desert' },
    glass: { emoji: '🪟', name: 'Glass' },
    crystal: { emoji: '💎', name: 'Crystal' },
    electricity: { emoji: '🔌', name: 'Electricity' },
    steam: { emoji: '♨️', name: 'Steam' },
    pressure: { emoji: '💥', name: 'Pressure' },
    diamond: { emoji: '💍', name: 'Diamond' },

    // Tier 3: Organic Life
    life: { emoji: '🧬', name: 'Life' },
    lizard: { emoji: '🦎', name: 'Lizard' },
    wings: { emoji: '🪶', name: 'Wings' },
    bird: { emoji: '🦅', name: 'Bird' },
    fish: { emoji: '🐟', name: 'Fish' },
    beast: { emoji: '🐺', name: 'Beast' },
    tree: { emoji: '🌳', name: 'Tree' },
    corpse: { emoji: '💀', name: 'Corpse' },

    // Tier 4: Humanity & Tools
    human: { emoji: '🧑', name: 'Human' },
    tool: { emoji: '🔨', name: 'Tool' },
    engineer: { emoji: '🤠', name: 'Engineer' },
    farmer: { emoji: '👨‍🌾', name: 'Farmer' },
    wheat: { emoji: '🌾', name: 'Wheat' },
    bread: { emoji: '🍞', name: 'Bread' },
    house: { emoji: '🏠', name: 'House' },
    city: { emoji: '🏙️', name: 'City' },

    // Tier 5: Tech & Modern Marvels
    wire: { emoji: '〰️', name: 'Wire' },
    battery: { emoji: '🔋', name: 'Battery' },
    computer: { emoji: '💻', name: 'Computer' },
    robot: { emoji: '🤖', name: 'Robot' },
    cyborg: { emoji: '🦿', name: 'Cyborg' },
    rocket: { emoji: '🚀', name: 'Rocket' },
    space: { emoji: '🌌', name: 'Space' },
    alien: { emoji: '👽', name: 'Alien' },
    laser: { emoji: '🚨', name: 'Laser' },

    // Tier 6: Arcane & Mythos
    magic: { emoji: '🎩', name: 'Magic Hat' },
    sword: { emoji: '🗡️', name: 'Sword' },
    dinosaur: { emoji: '🦖', name: 'Dinosaur' },
    dragon: { emoji: '🐉', name: 'Dragon' },
    phoenix: { emoji: '🐦‍🔥', name: 'Phoenix' },
    ghost: { emoji: '👻', name: 'Ghost' },
    zombie: { emoji: '🧟', name: 'Zombie' },
    wizard: { emoji: '🧙', name: 'Wizard' },
    glass_ball: { emoji: '🔮', name: 'Glass Ball' },
    god: { emoji: '🪬', name: 'God' },

    // Tier 7: Time & Space Expansion
    time: { emoji: '⏳', name: 'Time' },
    clock: { emoji: '⏰', name: 'Clock' },
    steampunk: { emoji: '⚙️', name: 'Steampunk' },
    futuristic: { emoji: '🛸', name: 'UFO' },
    infinity: { emoji: '♾️', name: 'Infinity' },

    // End-Game Legendary
    philosophers_stone: { emoji: '🔴', name: "Philosopher's Stone" },
    elixir: { emoji: '🧪', name: 'Elixir of Life' },
    singularity: { emoji: '🕳️', name: 'Singularity' },
    simulation: { emoji: '🕶️', name: 'The Simulation' }
  };

  const RECIPES = [
    { ingredients: ['water', 'water'],               result: 'sea' },
    { ingredients: ['water', 'earth'],               result: 'plant' },
    { ingredients: ['fire', 'air'],                  result: 'energy' },
    { ingredients: ['air', 'earth'],                 result: 'dust' },
    { ingredients: ['fire', 'earth'],                result: 'lava' },
    { ingredients: ['water', 'lava'],                result: 'stone' },
    { ingredients: ['fire', 'light'],                result: 'sun' },
    { ingredients: ['water', 'plant'],               result: 'swamp' },
    { ingredients: ['earth', 'stone'],               result: 'coal' },
    { ingredients: ['fire', 'coal'],                 result: 'metal' },
    { ingredients: ['air', 'stone'],                 result: 'sand' },
    { ingredients: ['fire', 'sand'],                 result: 'glass' },
    { ingredients: ['light', 'glass'],               result: 'crystal' },
    { ingredients: ['energy', 'metal'],              result: 'electricity' },
    { ingredients: ['water', 'fire'],                result: 'steam' },
    { ingredients: ['earth', 'earth'],               result: 'pressure' },
    { ingredients: ['coal', 'pressure'],             result: 'diamond' },
    { ingredients: ['earth', 'sun'],                 result: 'desert' },
    { ingredients: ['swamp', 'energy'],              result: 'life' },
    { ingredients: ['swamp', 'life'],                result: 'lizard' },
    { ingredients: ['air', 'life'],                  result: 'wings' },
    { ingredients: ['lizard', 'wings'],              result: 'bird' },
    { ingredients: ['sea', 'life'],                  result: 'fish' },
    { ingredients: ['earth', 'life'],                result: 'beast' },
    { ingredients: ['plant', 'time'],                result: 'tree' },
    { ingredients: ['life', 'clay'],                 result: 'human' },
    { ingredients: ['water', 'dust'],                result: 'clay' },
    { ingredients: ['earth', 'dust'],                result: 'clay' },
    { ingredients: ['human', 'stone'],               result: 'tool' },
    { ingredients: ['human', 'electricity'],         result: 'engineer' },
    { ingredients: ['human', 'plant'],               result: 'farmer' },
    { ingredients: ['farmer', 'plant'],              result: 'wheat' },
    { ingredients: ['fire', 'wheat'],                result: 'bread' },
    { ingredients: ['tool', 'stone'],                result: 'house' },
    { ingredients: ['house', 'house'],               result: 'city' },
    { ingredients: ['metal', 'electricity'],         result: 'wire' },
    { ingredients: ['wire', 'coal'],                 result: 'battery' },
    { ingredients: ['electricity', 'crystal'],       result: 'computer' },
    { ingredients: ['metal', 'computer'],            result: 'robot' },
    { ingredients: ['human', 'robot'],               result: 'cyborg' },
    { ingredients: ['metal', 'steam'],               result: 'steampunk' },
    { ingredients: ['tool', 'energy'],               result: 'laser' },
    { ingredients: ['metal', 'laser'],               result: 'rocket' },
    { ingredients: ['air', 'sun'],                   result: 'space' },
    { ingredients: ['space', 'life'],                result: 'alien' },
    { ingredients: ['alien', 'computer'],            result: 'futuristic' },
    { ingredients: ['light', 'energy'],              result: 'magic' },
    { ingredients: ['tool', 'metal'],                result: 'sword' },
    { ingredients: ['earth', 'lizard'],              result: 'dinosaur' },
    { ingredients: ['dinosaur', 'wings'],            result: 'dragon' },
    { ingredients: ['lizard', 'magic'],              result: 'dragon' },
    { ingredients: ['lava', 'life'],                 result: 'dragon' },
    { ingredients: ['fire', 'bird'],                 result: 'phoenix' },
    { ingredients: ['human', 'magic'],               result: 'wizard' },
    { ingredients: ['magic', 'glass'],               result: 'glass_ball' },
    { ingredients: ['fire', 'human'],                result: 'corpse' },
    { ingredients: ['corpse', 'life'],               result: 'zombie' },
    { ingredients: ['corpse', 'light'],              result: 'ghost' },
    { ingredients: ['sand', 'glass'],                result: 'time' },
    { ingredients: ['tool', 'time'],                 result: 'clock' },
    { ingredients: ['wizard', 'time'],               result: 'god' },
    { ingredients: ['space', 'time'],                result: 'infinity' },
    { ingredients: ['wizard', 'stone'],              result: 'philosophers_stone' },
    { ingredients: ['philosophers_stone', 'water'],  result: 'elixir' },
    { ingredients: ['human', 'elixir'],              result: 'god' },
    { ingredients: ['pressure', 'space'],            result: 'singularity' },
    { ingredients: ['computer', 'infinity'],         result: 'simulation' }
  ];

  const BASE_ELEMENTS = ['water', 'fire', 'air', 'earth', 'light'];
  let unlockedElements = new Set([...BASE_ELEMENTS]);

  function saveGraph() {
    if (!cy) return;
    try {
      localStorage.setItem('alchemy_graph', JSON.stringify(cy.json()));
    } catch (e) {
      console.error("Graph save failed:", e);
    }
  }

  function loadGraph() {
    try {
      const saved = localStorage.getItem('alchemy_graph');
      if (!saved) return false;

      const state = JSON.parse(saved);
      if (!state) return false;

      cy.json(state);
      return true;
    } catch (e) {
      console.error("Graph load failed:", e);
      return false;
    }
  }

  function saveProgress() {
    try {
      const dataArray = Array.from(unlockedElements);
      localStorage.setItem('alchemy_game_progress', JSON.stringify(dataArray));
    } catch (e) {
      console.error("Could not write save progress to localStorage:", e);
    }
  }

  function loadProgress() {
    try {
      const saved = localStorage.getItem('alchemy_game_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          unlockedElements = new Set(parsed);
        }
      }
    } catch (e) {
      console.error("Could not parse load progress from localStorage:", e);
    }
  }

  function resetGame() {
    if (confirm("Are you sure you want to reset your alchemy progress? All discovered items will be lost.")) {
      localStorage.removeItem('alchemy_game_progress');
      localStorage.removeItem('alchemy_graph');
      
      unlockedElements = new Set([...BASE_ELEMENTS]);
      
      if (cy) {
        cy.elements().remove();
        const container = document.getElementById('alchemy-cy');
        const rect = container.getBoundingClientRect();
        const cx = rect.width / 2 || 400;
        const cyPos = rect.height / 2 || 210;
        
        unlockedElements.forEach(function (key) {
          spawnNodeOnBoard(key, cx, cyPos, true);
        });
        cy.fit(45);
      }
      
      renderBooklets();
      showToast('Game progress has been reset.', 'fail');
    }
  }

  function showToast(msg, type) {
    const toast = document.getElementById('alchemy-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'alchemy-toast' + (type ? ' is-' + type : '');
    toast.style.display = 'block';
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(function () { toast.style.display = 'none'; }, 3500);
  }

  function renderBooklets() {
    const gridUnlocked = document.getElementById('grid-unlocked');
    const gridLocked = document.getElementById('grid-locked');
    if (!gridUnlocked || !gridLocked) return;

    gridUnlocked.innerHTML = '';
    gridLocked.innerHTML = '';

    let lockCount = 0;
    let unlockCount = 0;

    Object.keys(ELEMENTS).forEach(function (key) {
      const item = ELEMENTS[key];
      const card = document.createElement('div');
      
      if (unlockedElements.has(key)) {
        unlockCount++;
        card.className = 'alchemy-item' + (selectedNodeId === key ? ' is-selected' : '');
        card.innerHTML = '<span class="item-emoji">' + item.emoji + '</span><span class="item-name">' + item.name + '</span>';
        card.addEventListener('click', function () { handleSelection(key); });
        gridUnlocked.appendChild(card);
      } else {
        lockCount++;
        card.className = 'alchemy-item is-locked';
        card.innerHTML = '<span class="item-emoji">❓</span><span class="item-name">Unknown</span>';
        gridLocked.appendChild(card);
      }
    });

    document.getElementById('count-unlocked').textContent = unlockCount;
    document.getElementById('count-locked').textContent = lockCount;
  }

  function initCytoscape() {
    const container = document.getElementById('alchemy-cy');
    if (!container) return;

    cy = cytoscape({
      container: container,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'width': '52px',
            'height': '52px',
            'background-color': '#ffffff',
            'border-width': 2,
            'border-color': '#475569',
            'shape': 'ellipse'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#3b82f6',
            'border-width': 4,
            'background-color': '#eff6ff'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.1
          }
        },
        {
          selector: 'edge.double-line',
          style: {
            'line-style': 'double',
            'width': 6,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b'
          }
        }
      ],
      layout: { name: 'preset' }
    });

    cy.on('tap', 'node', function (evt) {
      handleSelection(evt.target.id());
    });

    cy.on('tap', function (evt) {
      if (evt.target === cy) {
        clearActiveSelection();
      }
    });

    cy.on('render pan zoom drag', updateHTMLOverlayPositions);
    
    cy.on('free', 'node', saveGraph);

    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2 || 400;
    const cyPos = rect.height / 2 || 210;
    
    const graphLoaded = loadGraph();

    if (!graphLoaded) {
      unlockedElements.forEach(function (key) {
        spawnNodeOnBoard(key, cx, cyPos, true);
      });
      cy.fit(45);
    } else {
      updateHTMLOverlayPositions();
    }
  }

  function handleSelection(targetId) {
    if (!cy) return;
    const targetNode = cy.getElementById(targetId);
    if (targetNode.length === 0) return;

    if (!selectedNodeId) {
      selectedNodeId = targetId;
      targetNode.select();
      renderBooklets();
    } else {
      const firstNode = cy.getElementById(selectedNodeId);
      evaluateCraftCombination(selectedNodeId, targetId, firstNode.position(), targetNode.position());
      
      setTimeout(function () {
        clearActiveSelection();
      }, 0);
    }
  }

  function clearActiveSelection() {
    if (cy) {
      cy.$(':selected').unselect(); 
    }
    selectedNodeId = null;
    renderBooklets();
  }

  function spawnNodeOnBoard(elementKey, cx, cyPos, isInitial) {
    if (!cy || !ELEMENTS[elementKey]) return;

    let pos;
    if (isInitial) {
      const baseKeys = ['water', 'fire', 'air', 'earth', 'light'];
      const idx = baseKeys.indexOf(elementKey);
      const angle = (idx / baseKeys.length) * 2 * Math.PI;
      const radius = 110;
      pos = { x: cx + radius * Math.cos(angle), y: cyPos + radius * Math.sin(angle) };
    } else {
      pos = { x: cx, y: cyPos };
    }

    cy.add({
      group: 'nodes',
      data: { id: elementKey },
      position: pos
    });

    updateHTMLOverlayPositions();
  }

  function evaluateCraftCombination(id1, id2, pos1, pos2) {
    const match = RECIPES.find(function (r) {
      return (r.ingredients[0] === id1 && r.ingredients[1] === id2) ||
             (r.ingredients[0] === id2 && r.ingredients[1] === id1);
    });

    if (match) {
      const resultKey = match.result;
      const resultItem = ELEMENTS[resultKey];
      const isSelfCombo = (id1 === id2);

      let targetX = (pos1.x + pos2.x) / 2;
      let targetY = (pos1.y + pos2.y) / 2 + 100;
      if (isSelfCombo) {
        targetX = pos1.x;
        targetY = pos1.y + 120;
      }

      const newlyUnlocked = !unlockedElements.has(resultKey);
      
      if (newlyUnlocked) {
        unlockedElements.add(resultKey);
        saveProgress();
        spawnNodeOnBoard(resultKey, targetX, targetY, false);
        renderBooklets();
        showToast('Discovered: ' + resultItem.name + '! (' + resultItem.emoji + ')', 'success');
      } else {
        if (cy.getElementById(resultKey).length === 0) {
          spawnNodeOnBoard(resultKey, targetX, targetY, false);
        }
        showToast('Crafted: ' + resultItem.name + ' ' + resultItem.emoji);
      }

      if (isSelfCombo) {
        const edgeId = 'edge_' + id1 + '_self_' + resultKey;
        if (cy.getElementById(edgeId).length === 0) {
          cy.add({
            group: 'edges',
            data: { id: edgeId, source: id1, target: resultKey },
            classes: 'double-line'
          });
        }
      } else {
        const edgeId1 = 'edge_' + id1 + '_' + resultKey;
        const edgeId2 = 'edge_' + id2 + '_' + resultKey;
        
        if (cy.getElementById(edgeId1).length === 0) {
          cy.add({ group: 'edges', data: { id: edgeId1, source: id1, target: resultKey } });
        }
        if (cy.getElementById(edgeId2).length === 0) {
          cy.add({ group: 'edges', data: { id: edgeId2, source: id2, target: resultKey } });
        }
      }
    } else {
      showToast('Nothing happened combining ' + ELEMENTS[id1].name + ' + ' + ELEMENTS[id2].name + '.', 'fail');
    }

    updateHTMLOverlayPositions();
    saveGraph();
  }

  function updateHTMLOverlayPositions() {
    if (!cy) return;

    cancelAnimationFrame(overlayFrame);
    overlayFrame = requestAnimationFrame(function () {
      const canvasParent = document.getElementById('alchemy-canvas-container');
      if (!canvasParent) return;

      const validIds = new Set();

      cy.nodes().forEach(function (node) {
        const id = node.id();
        const item = ELEMENTS[id];
        if (!item) return;

        validIds.add('overlay-' + id);
        let labelEl = document.getElementById('overlay-' + id);
        
        if (!labelEl) {
          labelEl = document.createElement('div');
          labelEl.id = 'overlay-' + id;
          labelEl.className = 'alchemy-node-overlay-label';
          labelEl.innerHTML = '<span class="node-emoji">' + item.emoji + '</span><span class="node-name">' + item.name + '</span>';
          canvasParent.appendChild(labelEl);
        }

        const rPos = node.renderedPosition();
        labelEl.style.left = rPos.x + 'px';
        labelEl.style.top = rPos.y + 'px';
      });

      document.querySelectorAll('.alchemy-node-overlay-label').forEach(function (el) {
        if (!validIds.has(el.id)) el.remove();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadProgress();
    initCytoscape();
    renderBooklets();

    document.querySelectorAll('.alchemy-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.alchemy-tab, .alchemy-tab-content').forEach(function (el) {
          el.classList.remove('active');
        });
        btn.classList.add('active');
        document.getElementById('pane-' + btn.dataset.tab).classList.add('active');
      });
    });

    document.getElementById('alchemy-fit-btn').addEventListener('click', function () {
      if (cy) cy.animate({ fit: { padding: 50 }, duration: 250, easing: 'ease-out' });
    });

    const resetBtn = document.getElementById('alchemy-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetGame);
    }

    window.addEventListener('resize', function () {
      if (cy) {
        cy.resize();
        updateHTMLOverlayPositions();
      }
    });
  });
})();