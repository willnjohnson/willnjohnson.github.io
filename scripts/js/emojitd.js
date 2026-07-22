(function () {
  "use strict";

  const D = window.EMOJITD_DATA;
  const BEST_KEY = "emojitd-best-wave";

  // Projectiles render as colored circles
  const ATTACK_EMOJI = { fire: "🔴", ice: "⚪", lightning: "🟡", bow: "🟤", melee: null };

  const $ = (id) => document.getElementById(id);

  let map = null;
  let waypointDist = null; // cumulative distance at each waypoint
  let totalPathLen = 0;

  // Mutable game state, reset on every (re)start.
  let G = null;

  function freshState() {
    return {
      gold: D.START_GOLD,
      lives: D.START_LIVES,
      wave: 0,
      wavesCleared: 0,
      waveActive: false,
      pendingSpawns: [],
      spawnCountdown: 0,
      enemies: [],
      towers: [],
      uidCounter: 1,
      selectedBuild: null,
      selectedTowerUid: null,
      speed: 1,
      paused: false,
      running: false,
      over: false,
      autoNext: false,
      autoCountdown: 0,
      lastFrame: 0,
      cells: {}, // "r,c" -> cell div
    };
  }

  // Path math
  function buildPathDistances() {
    const wps = map.waypoints;
    waypointDist = [0];
    let total = 0;
    for (let i = 0; i < wps.length - 1; i++) {
      const a = wps[i], b = wps[i + 1];
      total += Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
      waypointDist.push(total);
    }
    totalPathLen = total;
  }

  function positionAtDistance(dist) {
    const wps = map.waypoints;
    if (dist <= 0) return { r: wps[0].r, c: wps[0].c };
    if (dist >= totalPathLen) return { r: wps[wps.length - 1].r, c: wps[wps.length - 1].c };
    let i = 0;
    while (i < waypointDist.length - 1 && waypointDist[i + 1] < dist) i++;
    const a = wps[i], b = wps[i + 1];
    const segLen = waypointDist[i + 1] - waypointDist[i];
    const t = segLen > 0 ? (dist - waypointDist[i]) / segLen : 0;
    return { r: a.r + (b.r - a.r) * t, c: a.c + (b.c - a.c) * t };
  }

  function dist2d(pa, pb) {
    const dr = pa.r - pb.r, dc = pa.c - pb.c;
    return Math.sqrt(dr * dr + dc * dc);
  }

  function getCellPx() {
    const raw = getComputedStyle($("etd-board")).getPropertyValue("--etd-cell");
    const v = parseFloat(raw);
    return v > 0 ? v : 40;
  }

  // Board setup
  function buildBoard() {
    const boardEl = $("etd-board");
    boardEl.innerHTML = "";
    boardEl.style.setProperty("--etd-rows", map.rows);
    boardEl.style.setProperty("--etd-cols", map.cols);
    G.cells = {};

    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        const key = r + "," + c;
        const cell = document.createElement("div");
        cell.className = "etd-cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        if (map.pathTiles.has(key)) {
          cell.classList.add("etd-cell--path");
        } else if (map.treeTiles.has(key)) {
          cell.classList.add("etd-cell--grass", "etd-cell--tree");
          cell.textContent = "🌳";
        } else {
          cell.classList.add("etd-cell--grass", "etd-cell--buildable");
        }
        if (key === map.spawnKey) cell.classList.add("etd-cell--spawn");
        if (key === map.baseKey) cell.classList.add("etd-cell--base");
        cell.addEventListener("click", () => onCellClick(r, c, cell));
        boardEl.appendChild(cell);
        G.cells[key] = cell;
      }
    }
  }

  function cellIsBuildable(r, c) {
    const key = r + "," + c;
    if (map.pathTiles.has(key) || map.treeTiles.has(key)) return false;
    return !G.towers.some((t) => t.r === r && t.c === c);
  }

  // Towers
  function onCellClick(r, c, cellEl) {
    if (!G.running || G.over) return;
    const existing = G.towers.find((t) => t.r === r && t.c === c);

    if (G.selectedBuild) {
      if (existing) return;
      if (!cellIsBuildable(r, c)) return;
      const data = D.TOWERS[G.selectedBuild];
      if (G.gold < data.cost) {
        log("Not enough gold for " + data.name + ".");
        return;
      }
      G.gold -= data.cost;
      const tower = {
        uid: G.uidCounter++,
        r, c,
        kind: data.id,
        invested: data.cost,
        cooldownRemaining: 0,
        silencedRemaining: 0,
      };
      G.towers.push(tower);
      cellEl.classList.remove("etd-cell--buildable");
      renderTowerInCell(tower, cellEl);
      cancelBuildMode();
      updateHud();
      selectTower(tower.uid);
      return;
    }

    if (existing) {
      selectTower(existing.uid);
    } else {
      deselectTower();
    }
  }

  function renderTowerInCell(tower, cellEl) {
    cellEl.querySelectorAll(".etd-tower-sprite").forEach((n) => n.remove());
    const span = document.createElement("span");
    span.className = "etd-tower-sprite";
    span.textContent = D.TOWERS[tower.kind].emoji;
    cellEl.appendChild(span);
  }

  function cancelBuildMode() {
    G.selectedBuild = null;
    document.querySelectorAll(".etd-build-btn").forEach((b) => b.classList.remove("active"));
    clearRangePreview();
  }

  function startBuildMode(kindId) {
    if (G.selectedBuild === kindId) {
      cancelBuildMode();
      return;
    }
    deselectTower();
    G.selectedBuild = kindId;
    document.querySelectorAll(".etd-build-btn").forEach((b) => b.classList.toggle("active", b.dataset.kind === kindId));
  }

  function clearRangePreview() {
    document.querySelectorAll(".etd-cell--in-range").forEach((c) => c.classList.remove("etd-cell--in-range"));
  }

  function showRangePreview(r, c, range) {
    clearRangePreview();
    for (let rr = 0; rr < map.rows; rr++) {
      for (let cc = 0; cc < map.cols; cc++) {
        if (dist2d({ r: r + 0.5, c: c + 0.5 }, { r: rr + 0.5, c: cc + 0.5 }) <= range) {
          G.cells[rr + "," + cc].classList.add("etd-cell--in-range");
        }
      }
    }
  }

  function clearSelectedCellHighlight() {
    document.querySelectorAll(".etd-cell--selected").forEach((c) => c.classList.remove("etd-cell--selected"));
  }

  function selectTower(uid) {
    cancelBuildMode();
    G.selectedTowerUid = uid;
    const tower = G.towers.find((t) => t.uid === uid);
    if (!tower) return;
    const data = D.TOWERS[tower.kind];
    showRangePreview(tower.r, tower.c, data.range);
    clearSelectedCellHighlight();
    G.cells[tower.r + "," + tower.c].classList.add("etd-cell--selected");
    renderTowerPanel(tower, data);
    positionTowerPanel(tower.r, tower.c);
  }

  function deselectTower() {
    G.selectedTowerUid = null;
    clearRangePreview();
    clearSelectedCellHighlight();
    $("etd-tower-panel").classList.add("etd-hidden");
  }

  // Floats the tower panel next to the selected tower's cell instead of a fixed
  // spot on the page, so it's always right where the player is looking.
  function positionTowerPanel(r, c) {
    const panel = $("etd-tower-panel");
    const cellRect = G.cells[r + "," + c].getBoundingClientRect();
    const margin = 14;
    const panelW = panel.offsetWidth;
    const panelH = panel.offsetHeight;

    let left = cellRect.right + margin;
    if (left + panelW + margin > window.innerWidth) {
      left = cellRect.left - panelW - margin;
    }
    if (left < margin) {
      left = Math.max(margin, Math.min(window.innerWidth - panelW - margin, cellRect.left));
    }

    let top = cellRect.top - panelH / 4;
    top = Math.max(margin, Math.min(window.innerHeight - panelH - margin, top));

    panel.style.left = left + "px";
    panel.style.top = top + "px";
  }

  function renderTowerPanel(tower, data) {
    const panel = $("etd-tower-panel");
    panel.classList.remove("etd-hidden");
    $("etd-tp-emoji").textContent = data.emoji;
    $("etd-tp-name").textContent = data.name;
    $("etd-tp-desc").textContent = data.desc;
    $("etd-tp-stats").innerHTML =
      "Range: " + data.range.toFixed(1) + " &middot; Damage: " + data.damage + " &middot; Speed: " + (1000 / data.cooldown).toFixed(2) + "/s";

    const upgradesEl = $("etd-tp-upgrades");
    upgradesEl.innerHTML = "";
    data.upgrades.forEach((upId) => {
      const upData = D.TOWERS[upId];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "etd-link-btn etd-upgrade-btn";
      btn.textContent = upData.emoji + " Upgrade to " + upData.name + " (" + upData.cost + "g)";
      btn.disabled = G.gold < upData.cost;
      btn.addEventListener("click", () => upgradeTower(tower.uid, upId));
      upgradesEl.appendChild(btn);
    });

    const refund = Math.round(tower.invested * 0.6);
    const sellBtn = $("etd-tp-sell");
    sellBtn.textContent = "Sell for " + refund + "g";
    sellBtn.onclick = () => sellTower(tower.uid);
  }

  function upgradeTower(uid, upId) {
    const tower = G.towers.find((t) => t.uid === uid);
    if (!tower) return;
    const upData = D.TOWERS[upId];
    if (G.gold < upData.cost) return;
    G.gold -= upData.cost;
    tower.invested += upData.cost;
    tower.kind = upId;
    tower.cooldownRemaining = 0;
    const cellEl = G.cells[tower.r + "," + tower.c];
    renderTowerInCell(tower, cellEl);
    updateHud();
    selectTower(uid);
  }

  function sellTower(uid) {
    const tower = G.towers.find((t) => t.uid === uid);
    if (!tower) return;
    const refund = Math.round(tower.invested * 0.6);
    G.gold += refund;
    G.towers = G.towers.filter((t) => t.uid !== uid);
    const cellEl = G.cells[tower.r + "," + tower.c];
    cellEl.querySelectorAll(".etd-tower-sprite").forEach((n) => n.remove());
    cellEl.classList.add("etd-cell--buildable");
    deselectTower();
    updateHud();
  }

  // Enemies
  function mergedEnemyData(baseId, isBoss) {
    const base = isBoss ? D.BOSSES[baseId] : D.ENEMIES[baseId];
    const scale = D.scaleForWave(base, G.wave);
    return Object.assign({}, base, { hp: scale.hp, leak: scale.leak });
  }

  function spawnEnemy(typeId, isBoss) {
    const data = mergedEnemyData(typeId, isBoss);
    const overlay = $("etd-overlay");
    const el = document.createElement("div");
    el.className = "etd-enemy" + (isBoss ? " etd-enemy--boss" : "");
    el.innerHTML =
      '<div class="etd-hpbar"><div class="etd-hpbar-fill"></div></div><span class="etd-enemy-emoji">' + data.emoji + "</span>";
    overlay.appendChild(el);

    const enemy = {
      uid: G.uidCounter++,
      kind: typeId,
      isBoss: !!isBoss,
      data,
      hp: data.hp,
      maxHp: data.hp,
      dist: 0,
      slowRemaining: 0,
      slowFactor: 1,
      burns: [],
      regenAccum: 0,
      teleportRemaining: data.teleportEvery || 0,
      silenceRemaining: data.silenceEvery || 0,
      el,
      hpFillEl: el.querySelector(".etd-hpbar-fill"),
    };
    G.enemies.push(enemy);
    positionEnemyEl(enemy);
    return enemy;
  }

  function positionEnemyEl(enemy) {
    const px = getCellPx();
    const pos = positionAtDistance(enemy.dist);
    enemy.el.style.left = (pos.c + 0.5) * px + "px";
    enemy.el.style.top = (pos.r + 0.5) * px + "px";
    enemy._pos = pos;
  }

  function isRevealed(enemy) {
    if (!enemy.data.stealth) return true;
    return G.towers.some((t) => t.kind === "watchtower" && dist2d({ r: t.r + 0.5, c: t.c + 0.5 }, enemy._pos) <= D.TOWERS.watchtower.range);
  }

  function killEnemy(enemy) {
    enemy.dead = true;
    G.gold += enemy.data.bounty;
    spawnFloatText(enemy._pos, "+" + enemy.data.bounty + "g", "etd-float--gold");
    if (enemy.isBoss) log(enemy.data.emoji + " " + enemy.data.name + " has been defeated!");
    enemy.el.remove();
    updateHud();
  }

  function leakEnemy(enemy) {
    enemy.dead = true;
    G.lives = Math.max(0, G.lives - enemy.data.leak);
    enemy.el.remove();
    updateHud();
    if (G.lives <= 0) endGame(false);
  }

  function applyBurn(enemy, towerData) {
    if (enemy.data.fireImmune) return;
    if (enemy.burns.length < towerData.burnMaxStacks) {
      enemy.burns.push({ dps: towerData.burnDps, remaining: towerData.burnDuration });
    } else {
      enemy.burns.forEach((b) => (b.remaining = towerData.burnDuration));
    }
  }

  function applySlow(enemy, multiplier, duration) {
    const resist = enemy.data.slowResist || 0;
    const effective = 1 - (1 - multiplier) * (1 - resist);
    enemy.slowFactor = effective;
    enemy.slowRemaining = duration;
  }

  function applyHit(tower, enemy, dmg) {
    if (enemy.dead) return;
    if (enemy.data.dodge && Math.random() < enemy.data.dodge) {
      spawnFloatText(enemy._pos, "MISS", "etd-float--miss");
      return;
    }
    enemy.hp -= dmg;
    spawnFloatText(enemy._pos, "-" + dmg, "etd-float--dmg");
    if (enemy.hp <= 0) killEnemy(enemy);
  }

  // Visual fx
  function spawnFloatText(pos, text, cls) {
    const px = getCellPx();
    const el = document.createElement("div");
    el.className = "etd-float " + cls;
    el.textContent = text;
    el.style.left = (pos.c + 0.5) * px + "px";
    el.style.top = (pos.r + 0.5) * px + "px";
    $("etd-overlay").appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  function spawnProjectile(fromPos, toPos, emoji) {
    if (!emoji) return;
    const px = getCellPx();
    const el = document.createElement("span");
    el.className = "etd-projectile";
    el.textContent = emoji;
    el.style.left = (fromPos.c + 0.5) * px + "px";
    el.style.top = (fromPos.r + 0.5) * px + "px";
    $("etd-overlay").appendChild(el);
    requestAnimationFrame(() => {
      el.style.left = (toPos.c + 0.5) * px + "px";
      el.style.top = (toPos.r + 0.5) * px + "px";
    });
    setTimeout(() => el.remove(), 260);
  }

  // Tower firing
  function findTargets(tower) {
    const data = D.TOWERS[tower.kind];
    const towerPos = { r: tower.r + 0.5, c: tower.c + 0.5 };
    return G.enemies
      .filter((e) => !e.dead && dist2d(towerPos, e._pos) <= data.range && isRevealed(e))
      .sort((a, b) => b.dist - a.dist);
  }

  function fireTower(tower) {
    if (tower.silencedRemaining > 0) return;
    const data = D.TOWERS[tower.kind];
    const candidates = findTargets(tower);
    if (candidates.length === 0) return;
    const primary = candidates[0];
    const towerPos = { r: tower.r + 0.5, c: tower.c + 0.5 };
    const emoji = ATTACK_EMOJI[data.attackType];

    if (data.attackType === "lightning" && data.aoeTargets) {
      const hits = G.enemies.filter((e) => !e.dead && isRevealed(e) && dist2d(primary._pos, e._pos) <= data.aoeRadius).slice(0, data.aoeTargets);
      hits.forEach((e) => {
        spawnProjectile(towerPos, e._pos, emoji);
        applyHit(tower, e, data.damage);
      });
    } else if (data.attackType === "lightning" && data.chainTargets) {
      candidates.slice(0, data.chainTargets).forEach((e) => {
        spawnProjectile(towerPos, e._pos, emoji);
        applyHit(tower, e, data.damage);
      });
    } else if (data.attackType === "fire") {
      spawnProjectile(towerPos, primary._pos, emoji);
      applyHit(tower, primary, data.damage);
      applyBurn(primary, data);
    } else if (data.attackType === "ice") {
      spawnProjectile(towerPos, primary._pos, emoji);
      applyHit(tower, primary, data.damage);
      G.enemies
        .filter((e) => !e.dead && dist2d(primary._pos, e._pos) <= data.aoeSlowRadius)
        .forEach((e) => applySlow(e, data.slowMultiplier, data.slowDuration));
    } else {
      spawnProjectile(towerPos, primary._pos, emoji);
      applyHit(tower, primary, data.damage);
    }
    tower.cooldownRemaining = data.cooldown;
  }

  // Wave management
  function flattenWave(waveDef) {
    const items = [];
    waveDef.groups.forEach((g) => {
      const gap = g.type === "wolf" ? 150 : g.interval;
      for (let i = 0; i < g.count; i++) items.push({ type: g.type, gap: i === 0 ? 400 : gap, isBoss: false });
    });
    if (waveDef.boss) items.push({ type: waveDef.boss, gap: 1600, isBoss: true });
    return items;
  }

  function startWave() {
    if (G.waveActive || G.over) return;
    G.wave += 1;
    const waveDef = D.buildWaveList()[G.wave - 1];
    G.pendingSpawns = flattenWave(waveDef);
    G.spawnCountdown = G.pendingSpawns.length ? G.pendingSpawns[0].gap : 0;
    G.waveActive = true;
    G.autoCountdown = 0;
    const label = waveDef.boss ? " Boss: " + D.BOSSES[waveDef.boss].emoji + " " + D.BOSSES[waveDef.boss].name + "!" : "";
    log("Wave " + G.wave + " incoming." + label);
    updateHud();
  }

  function onWaveClear() {
    G.waveActive = false;
    const bonus = 20 + G.wave * 4;
    G.gold += bonus;
    G.wavesCleared = G.wave;
    saveBestWave(G.wavesCleared);
    log("Wave " + G.wave + " cleared! +" + bonus + "g");
    updateHud();
    if (G.wave >= D.WAVE_COUNT) {
      endGame(true);
      return;
    }
    if (G.autoNext) {
      G.autoCountdown = 3500;
    }
  }

  // Main loop
  function tick(now) {
    if (!G.running) return;
    requestAnimationFrame(tick);
    const rawDt = G.lastFrame ? Math.min(now - G.lastFrame, 100) : 16;
    G.lastFrame = now;
    if (G.paused || G.over) return;
    const dtMs = rawDt * G.speed;
    const dt = dtMs / 1000;

    // Spawning
    if (G.pendingSpawns.length) {
      G.spawnCountdown -= dtMs;
      if (G.spawnCountdown <= 0) {
        const next = G.pendingSpawns.shift();
        spawnEnemy(next.type, next.isBoss);
        if (G.pendingSpawns.length) G.spawnCountdown = G.pendingSpawns[0].gap;
      }
    }

    // Enemies
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (e.dead) {
        G.enemies.splice(i, 1);
        continue;
      }
      if (e.burns.length) {
        for (let bi = e.burns.length - 1; bi >= 0; bi--) {
          const b = e.burns[bi];
          e.hp -= b.dps * dt;
          b.remaining -= dtMs;
          if (b.remaining <= 0) e.burns.splice(bi, 1);
        }
        if (e.hp <= 0) {
          killEnemy(e);
          G.enemies.splice(i, 1);
          continue;
        }
      }
      if (e.data.regen) {
        e.regenAccum += dtMs;
        if (e.regenAccum >= 1000) {
          e.regenAccum -= 1000;
          e.hp = Math.min(e.maxHp, e.hp + e.data.regen);
        }
      }
      if (e.slowRemaining > 0) {
        e.slowRemaining -= dtMs;
        if (e.slowRemaining <= 0) e.slowFactor = 1;
      }
      if (e.data.teleportEvery) {
        e.teleportRemaining -= dtMs;
        if (e.teleportRemaining <= 0) {
          e.teleportRemaining = e.data.teleportEvery;
          e.dist = Math.min(totalPathLen, e.dist + e.data.teleportDistance);
          spawnFloatText(e._pos, "teleport!", "etd-float--misc");
        }
      }
      if (e.data.silenceEvery) {
        e.silenceRemaining -= dtMs;
        if (e.silenceRemaining <= 0) {
          e.silenceRemaining = e.data.silenceEvery;
          const near = G.towers
            .filter((t) => dist2d({ r: t.r + 0.5, c: t.c + 0.5 }, e._pos) <= e.data.silenceRange)
            .sort((a, b) => dist2d({ r: a.r, c: a.c }, e._pos) - dist2d({ r: b.r, c: b.c }, e._pos))[0];
          if (near) {
            near.silencedRemaining = e.data.silenceDuration;
            const cellEl = G.cells[near.r + "," + near.c];
            spawnFloatText({ r: near.r + 0.5, c: near.c + 0.5 }, "silenced!", "etd-float--misc");
            cellEl.classList.add("etd-cell--silenced");
          }
        }
      }

      const speedFactor = e.slowRemaining > 0 ? e.slowFactor : 1;
      e.dist += e.data.speed * speedFactor * dt;
      if (e.dist >= totalPathLen) {
        leakEnemy(e);
        G.enemies.splice(i, 1);
        continue;
      }
      positionEnemyEl(e);
      e.hpFillEl.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + "%";
      e.el.classList.toggle("etd-enemy--stealth-hidden", e.data.stealth && !isRevealed(e));
    }

    // Towers
    G.towers.forEach((t) => {
      if (t.silencedRemaining > 0) {
        t.silencedRemaining -= dtMs;
        if (t.silencedRemaining <= 0) {
          const cellEl = G.cells[t.r + "," + t.c];
          cellEl.classList.remove("etd-cell--silenced");
        }
        return;
      }
      t.cooldownRemaining -= dtMs;
      if (t.cooldownRemaining <= 0) fireTower(t);
    });

    // Wave completion / auto-start
    if (G.waveActive && G.pendingSpawns.length === 0 && G.enemies.length === 0) {
      onWaveClear();
    } else if (!G.waveActive && G.autoCountdown > 0) {
      G.autoCountdown -= dtMs;
      if (G.autoCountdown <= 0) startWave();
    }

    updateWaveBtn();
  }

  // HUD
  function updateHud() {
    $("etd-gold").textContent = G.gold;
    $("etd-lives").textContent = G.lives;
    $("etd-wave-label").textContent = (G.wave || 0) + " / " + D.WAVE_COUNT;
    document.querySelectorAll(".etd-build-btn").forEach((btn) => {
      const cost = parseInt(btn.dataset.cost, 10);
      btn.disabled = G.gold < cost;
    });
    if (G.selectedTowerUid != null) {
      const tower = G.towers.find((t) => t.uid === G.selectedTowerUid);
      if (tower) renderTowerPanel(tower, D.TOWERS[tower.kind]);
    }
  }

  function updateWaveBtn() {
    const btn = $("etd-wave-btn");
    if (G.waveActive) {
      btn.disabled = true;
      btn.textContent = "Wave " + G.wave + " in progress…";
    } else if (G.autoCountdown > 0) {
      btn.disabled = true;
      btn.textContent = "Next wave in " + Math.ceil(G.autoCountdown / 1000) + "s";
    } else {
      btn.disabled = false;
      btn.textContent = G.wave >= D.WAVE_COUNT ? "Victory!" : "Start Wave " + (G.wave + 1);
    }
  }

  function log(msg) {
    const feed = $("etd-log");
    const line = document.createElement("div");
    line.className = "etd-log-line";
    line.textContent = msg;
    feed.prepend(line);
    while (feed.children.length > 6) feed.removeChild(feed.lastChild);
  }

  // Best score
  function loadBestWave() {
    try {
      return parseInt(window.localStorage.getItem(BEST_KEY), 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBestWave(wave) {
    try {
      if (wave > loadBestWave()) window.localStorage.setItem(BEST_KEY, String(wave));
    } catch (e) {
      /* ignore */
    }
  }

  // Game lifecycle
  function endGame(won) {
    G.over = true;
    G.running = false;
    saveBestWave(won ? D.WAVE_COUNT : G.wavesCleared);
    const modal = $("etd-modal");
    modal.classList.remove("etd-hidden");
    $("etd-modal-title").textContent = won ? "Victory!" : "Defeated";
    $("etd-modal-text").textContent = won
      ? "You held the line for all " + D.WAVE_COUNT + " waves and slew the Dragon. The realm is safe!"
      : "Your base fell on wave " + G.wave + ". Best wave cleared: " + Math.max(G.wavesCleared, loadBestWave()) + ".";
  }

  function buildPalette() {
    const palette = $("etd-build-palette");
    palette.innerHTML = "";
    D.TOWER_BUILD_ORDER.forEach((kindId) => {
      const data = D.TOWERS[kindId];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "etd-build-btn";
      btn.dataset.kind = kindId;
      btn.dataset.cost = data.cost;
      btn.innerHTML = data.emoji + " " + data.name + " <span>" + data.cost + "g</span>";
      btn.addEventListener("click", () => startBuildMode(kindId));
      palette.appendChild(btn);
    });
  }

  function startGame() {
    G = freshState();
    map = D.buildMap();
    buildPathDistances();
    $("etd-start-screen").classList.add("etd-hidden");
    $("etd-game-screen").classList.remove("etd-hidden");
    $("etd-modal").classList.add("etd-hidden");
    $("etd-log").innerHTML = "";
    buildPalette();
    buildBoard();
    deselectTower();
    updateHud();
    updateWaveBtn();
    $("etd-speed-btn").textContent = "1x Speed";
    $("etd-pause-btn").textContent = "Pause";
    $("etd-auto-toggle").checked = false;
    log("Defend the base! Place Huts on the grass to begin.");
    G.running = true;
    requestAnimationFrame(tick);
  }

  function backToStart() {
    G.running = false;
    $("etd-game-screen").classList.add("etd-hidden");
    $("etd-modal").classList.add("etd-hidden");
    $("etd-start-screen").classList.remove("etd-hidden");
    $("etd-start-best").textContent = loadBestWave();
  }

  function wireStaticControls() {
    $("etd-start-btn").addEventListener("click", startGame);
    $("etd-modal-restart").addEventListener("click", startGame);
    $("etd-modal-menu").addEventListener("click", backToStart);
    $("etd-wave-btn").addEventListener("click", startWave);
    $("etd-tp-close").addEventListener("click", deselectTower);
    $("etd-menu-btn").addEventListener("click", () => {
      if (window.confirm("Abandon this run and return to the menu?")) backToStart();
    });

    $("etd-speed-btn").addEventListener("click", () => {
      G.speed = G.speed === 1 ? 2 : 1;
      $("etd-speed-btn").textContent = G.speed + "x Speed";
    });

    $("etd-pause-btn").addEventListener("click", () => {
      G.paused = !G.paused;
      $("etd-pause-btn").textContent = G.paused ? "Resume" : "Pause";
    });

    $("etd-auto-toggle").addEventListener("change", (ev) => {
      G.autoNext = ev.target.checked;
    });

    // Capture phase: runs before an in-panel click (e.g. an upgrade button) can
    // rebuild the panel's contents and detach its own click target from the DOM,
    // which would otherwise make the panel look "outside" of itself by the time
    // a bubble-phase listener saw it.
    document.addEventListener(
      "click",
      (ev) => {
        if (!G || G.selectedTowerUid == null) return;
        if ($("etd-tower-panel").contains(ev.target)) return;
        if ($("etd-board").contains(ev.target)) return;
        deselectTower();
      },
      true
    );

    $("etd-start-best").textContent = loadBestWave();
  }

  document.addEventListener("DOMContentLoaded", wireStaticControls);
})();
