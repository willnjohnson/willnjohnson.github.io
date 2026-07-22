(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'ambience-mix';

  const LAYER_IDS = [
    'white', 'brown', 'rain', 'train', 'typing', 'fireplace', 'wind', 'thunder', 'birds',
    'ethereal', 'binaural', 'lofi', 'chimes', 'crickets',
  ];

  const PRESETS = {
    rainy: { rain: 70, thunder: 25, wind: 20 },
    cozy: { fireplace: 70, wind: 15 },
    focus: { brown: 55 },
    countryside: { birds: 55, wind: 20 },
    commute: { train: 60, white: 10 },
    meditation: { binaural: 50, ethereal: 25 },
    lofistudy: { lofi: 60, wind: 10 },
    enchanted: { ethereal: 45, chimes: 35, crickets: 20 },
    clear: {},
  };

  const FREQ_IDS = ['thunder', 'birds'];

  let ctx = null;
  let master = null;
  let playing = false;
  const levels = {}; // id -> 0-100
  const freqLevels = {}; // id -> 0-100, for layers with a Frequency slider (50 = default pace)
  const active = {}; // id -> { gainNode, stop() }

  function randRange(a, b) {
    return a + Math.random() * (b - a);
  }

  // Frequency sliders scale the interval between random events: 50 is the
  // designed default pace, 0 is 4x slower (rarer), 100 is 4x faster.
  function freqMultiplier(id) {
    const level = freqLevels[id] != null ? freqLevels[id] : 50;
    return Math.pow(4, (50 - level) / 50);
  }

  // Noise buffers
  function whiteBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function brownBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buf;
  }

  function loopingSource(buffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  function oneShotSource(buffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = false;
    return src;
  }

  function panner() {
    return ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  }

  // Layer builders. Each takes the layer's own GainNode (already wired
  // to the master bus) and returns { stop() }. Continuous beds are a
  // looping noise buffer through filters; textured layers add randomly
  // timed one-shot bursts (droplets, pops, clacks, clicks, chirps,
  // strikes) scheduled with setTimeout against ctx.currentTime.
  function buildWhite(gainNode) {
    const src = loopingSource(whiteBuffer(2));
    src.connect(gainNode);
    src.start();
    return { stop: () => src.stop() };
  }

  function buildBrown(gainNode) {
    const src = loopingSource(brownBuffer(4));
    src.connect(gainNode);
    src.start();
    return { stop: () => src.stop() };
  }

  function buildRain(gainNode) {
    const bed = loopingSource(whiteBuffer(3));
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const bedGain = ctx.createGain(); bedGain.gain.value = 0.45;
    bed.connect(hp); hp.connect(lp); lp.connect(bedGain); bedGain.connect(gainNode);
    bed.start();

    let stopped = false;
    let timer = null;
    (function drop() {
      if (stopped) return;
      const dur = randRange(0.02, 0.05);
      const src = oneShotSource(whiteBuffer(dur));
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = randRange(2000, 5000); f.Q.value = 1;
      const g = ctx.createGain();
      const p = panner();
      src.connect(f); f.connect(g);
      if (p) { p.pan.value = randRange(-0.8, 0.8); g.connect(p); p.connect(gainNode); } else g.connect(gainNode);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(randRange(0.15, 0.4), now + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.start(now); src.stop(now + dur + 0.02);
      timer = setTimeout(drop, randRange(15, 60));
    })();

    return { stop: () => { stopped = true; clearTimeout(timer); bed.stop(); } };
  }

  function buildWind(gainNode) {
    const src = loopingSource(brownBuffer(4));
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
    src.connect(lp); lp.connect(gainNode);

    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 350;
    lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
    lfo.start(); src.start();

    return { stop: () => { src.stop(); lfo.stop(); } };
  }

  function buildThunder(gainNode) {
    let stopped = false;
    let timer = null;
    (function strike() {
      if (stopped) return;
      const dur = randRange(1.5, 3.5);
      const src = oneShotSource(brownBuffer(dur));
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = randRange(150, 400);
      const g = ctx.createGain();
      src.connect(lp); lp.connect(g); g.connect(gainNode);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(1, now + randRange(0.05, 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.start(now); src.stop(now + dur + 0.05);
      timer = setTimeout(strike, randRange(5000, 14000) * freqMultiplier('thunder'));
    })();

    return { stop: () => { stopped = true; clearTimeout(timer); } };
  }

  function buildFireplace(gainNode) {
    const bed = loopingSource(brownBuffer(4));
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 350;
    const bedGain = ctx.createGain(); bedGain.gain.value = 0.55;
    bed.connect(lp); lp.connect(bedGain); bedGain.connect(gainNode);
    bed.start();

    let stopped = false;
    let timer = null;
    (function pop() {
      if (stopped) return;
      const dur = randRange(0.03, 0.09);
      const src = oneShotSource(whiteBuffer(dur));
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = randRange(1500, 3500);
      const g = ctx.createGain();
      src.connect(f); f.connect(g); g.connect(gainNode);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(randRange(0.3, 0.7), now + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.start(now); src.stop(now + dur + 0.02);
      timer = setTimeout(pop, randRange(150, 600));
    })();

    return { stop: () => { stopped = true; clearTimeout(timer); bed.stop(); } };
  }

  function buildTrain(gainNode) {
    const bed = loopingSource(brownBuffer(4));
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 280;
    const bedGain = ctx.createGain(); bedGain.gain.value = 0.65;
    bed.connect(lp); lp.connect(bedGain); bedGain.connect(gainNode);
    bed.start();

    let stopped = false;
    let timer = null;
    (function clack() {
      if (stopped) return;
      [0, 0.09].forEach((delay) => {
        const dur = 0.05;
        const src = oneShotSource(whiteBuffer(dur));
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = randRange(300, 600); f.Q.value = 2;
        const g = ctx.createGain();
        src.connect(f); f.connect(g); g.connect(gainNode);
        const now = ctx.currentTime + delay;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.8, now + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.start(now); src.stop(now + dur + 0.02);
      });
      timer = setTimeout(clack, 650);
    })();

    return { stop: () => { stopped = true; clearTimeout(timer); bed.stop(); } };
  }

  function buildTyping(gainNode) {
    let stopped = false;
    let timer = null;
    (function click() {
      if (stopped) return;
      const dur = randRange(0.008, 0.02);
      const src = oneShotSource(whiteBuffer(dur));
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = randRange(2500, 4500);
      const g = ctx.createGain();
      src.connect(f); f.connect(g); g.connect(gainNode);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(randRange(0.4, 0.8), now + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.start(now); src.stop(now + dur + 0.01);
      const gap = Math.random() < 0.15 ? randRange(200, 500) : randRange(40, 140);
      timer = setTimeout(click, gap);
    })();

    return { stop: () => { stopped = true; clearTimeout(timer); } };
  }

  function buildBirds(gainNode) {
    let stopped = false;
    let timer = null;
    (function chirp() {
      if (stopped) return;
      const notes = Math.random() < 0.35 ? 2 : 1;
      for (let n = 0; n < notes; n++) {
        const start = ctx.currentTime + n * 0.12;
        const dur = randRange(0.08, 0.16);
        const osc = ctx.createOscillator(); osc.type = 'sine';
        const base = randRange(1800, 3200);
        osc.frequency.setValueAtTime(base, start);
        osc.frequency.exponentialRampToValueAtTime(base * randRange(0.6, 0.85), start + dur);
        const g = ctx.createGain();
        const p = panner();
        osc.connect(g);
        if (p) { p.pan.value = randRange(-0.9, 0.9); g.connect(p); p.connect(gainNode); } else g.connect(gainNode);
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(randRange(0.2, 0.4), start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.start(start); osc.stop(start + dur + 0.02);
      }
      timer = setTimeout(chirp, randRange(300, 1200) * freqMultiplier('birds'));
    })();

    return { stop: () => { stopped = true; clearTimeout(timer); } };
  }

  // Slowly shifting ambient pad: a few detuned, individually-vibratoed
  // oscillators through a wandering lowpass filter, plus a soft high tremolo
  // shimmer on top.
  function buildEthereal(gainNode) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 500;
    lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
    lfo.start();
    lp.connect(gainNode);

    const freqs = [110, 164.81, 220, 277.18]; // A2, E3, A3, C#4 (open, ambiguous chord)
    const stopFns = [];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      const vib = ctx.createOscillator(); vib.frequency.value = randRange(0.1, 0.3);
      const vibGain = ctx.createGain(); vibGain.gain.value = randRange(1.5, 3.5);
      vib.connect(vibGain); vibGain.connect(osc.frequency);
      const voiceGain = ctx.createGain(); voiceGain.gain.value = 0.22;
      const p = panner();
      osc.connect(voiceGain);
      if (p) { p.pan.value = randRange(-0.6, 0.6); voiceGain.connect(p); p.connect(lp); } else voiceGain.connect(lp);
      osc.start(); vib.start();
      stopFns.push(() => { osc.stop(); vib.stop(); });
    });

    const shimmer = ctx.createOscillator(); shimmer.type = 'sine'; shimmer.frequency.value = 1760;
    const shimmerGain = ctx.createGain(); shimmerGain.gain.value = 0.06;
    const shimmerLfo = ctx.createOscillator(); shimmerLfo.frequency.value = 0.13;
    const shimmerLfoGain = ctx.createGain(); shimmerLfoGain.gain.value = 0.04;
    shimmerLfo.connect(shimmerLfoGain); shimmerLfoGain.connect(shimmerGain.gain);
    shimmer.connect(shimmerGain); shimmerGain.connect(gainNode);
    shimmer.start(); shimmerLfo.start();

    return {
      stop: () => {
        stopFns.forEach((fn) => fn());
        lfo.stop();
        shimmer.stop(); shimmerLfo.stop();
      },
    };
  }

  // Two pure tones, hard-panned left/right, a few Hz apart. The "beat" is
  // perceived inside the brain from the difference between the ears, so
  // this only does anything useful over headphones.
  function buildBinaural(gainNode) {
    const carrier = 200;
    const beat = 8; // alpha-range difference tone
    const left = ctx.createOscillator(); left.type = 'sine'; left.frequency.value = carrier - beat / 2;
    const right = ctx.createOscillator(); right.type = 'sine'; right.frequency.value = carrier + beat / 2;
    const g = ctx.createGain(); g.gain.value = 0.6;
    const panL = panner();
    const panR = panner();
    if (panL && panR) {
      panL.pan.value = -1; panR.pan.value = 1;
      left.connect(panL); panL.connect(g);
      right.connect(panR); panR.connect(g);
    } else {
      left.connect(g); right.connect(g);
    }
    g.connect(gainNode);
    left.start(); right.start();
    return { stop: () => { left.stop(); right.stop(); } };
  }

  // 80 BPM loop: synthesized kick/snare/hat on a 16-step
  // grid, with a little timing jitter and a soft vinyl-crackle bed for a
  // lofi feel instead of a rigid drum machine.
  function buildLofi(gainNode) {
    const bpm = 80;
    const stepDur = 60 / bpm / 4; // one 16th note, in seconds
    const pattern = {
      kick: [0, 6, 10],
      snare: [4, 12],
      hat: [0, 2, 4, 6, 8, 10, 12, 14],
    };

    function playKick(t) {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(g); g.connect(gainNode);
      osc.start(t); osc.stop(t + 0.3);
    }

    function playSnare(t) {
      const src = oneShotSource(whiteBuffer(0.2));
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.7;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.5, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      src.connect(bp); bp.connect(ng); ng.connect(gainNode);
      src.start(t); src.stop(t + 0.2);

      const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 180;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.35, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(og); og.connect(gainNode);
      osc.start(t); osc.stop(t + 0.12);
    }

    function playHat(t, accent) {
      const dur = 0.05;
      const src = oneShotSource(whiteBuffer(dur));
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(accent ? 0.25 : 0.14, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(hp); hp.connect(g); g.connect(gainNode);
      src.start(t); src.stop(t + dur + 0.01);
    }

    const crackleBed = loopingSource(whiteBuffer(3));
    const crackleHp = ctx.createBiquadFilter(); crackleHp.type = 'highpass'; crackleHp.frequency.value = 3000;
    const crackleGain = ctx.createGain(); crackleGain.gain.value = 0.02;
    crackleBed.connect(crackleHp); crackleHp.connect(crackleGain); crackleGain.connect(gainNode);
    crackleBed.start();

    let stopped = false;
    let timer = null;
    let step = 0;
    (function tick() {
      if (stopped) return;
      const t = ctx.currentTime + 0.02 + randRange(-0.01, 0.01); // slight humanize
      if (pattern.kick.includes(step)) playKick(t);
      if (pattern.snare.includes(step)) playSnare(t);
      if (pattern.hat.includes(step)) playHat(t, step % 4 === 0);
      step = (step + 1) % 16;
      timer = setTimeout(tick, stepDur * 1000);
    })();

    return { stop: () => { stopped = true; clearTimeout(timer); crackleBed.stop(); } };
  }

  // Pentatonic bell tones rung in small clusters.
  function buildChimes(gainNode) {
    const scale = [783.99, 880, 987.77, 1174.66, 1318.51]; // G5 A5 B5 D6 E6

    function ring(freq, t, dur) {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const overtone = ctx.createOscillator(); overtone.type = 'sine'; overtone.frequency.value = freq * 2.4;
      const g = ctx.createGain();
      const g2 = ctx.createGain();
      const p = panner();
      osc.connect(g); overtone.connect(g2);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      g2.gain.setValueAtTime(0.001, t);
      g2.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0003, t + dur * 0.6);
      if (p) { p.pan.value = randRange(-0.7, 0.7); g.connect(p); g2.connect(p); p.connect(gainNode); } else { g.connect(gainNode); g2.connect(gainNode); }
      osc.start(t); osc.stop(t + dur + 0.05);
      overtone.start(t); overtone.stop(t + dur * 0.6 + 0.05);
    }

    let stopped = false;
    let timer = null;
    (function gust() {
      if (stopped) return;
      const notes = Math.floor(randRange(1, 4));
      for (let n = 0; n < notes; n++) {
        const t = ctx.currentTime + n * randRange(0.08, 0.2);
        const freq = scale[Math.floor(Math.random() * scale.length)];
        ring(freq, t, randRange(1.5, 3));
      }
      timer = setTimeout(gust, randRange(2000, 7000));
    })();

    return { stop: () => { stopped = true; clearTimeout(timer); } };
  }

  // Overlapping "voices" at slightly different pitches, each firing
  // short pulse trains (stridulation) at its own pace.
  function buildCrickets(gainNode) {
    let stopped = false;
    const timers = [];

    function voice(basePitch, offset) {
      (function chirpTrain() {
        if (stopped) return;
        const pulses = Math.floor(randRange(3, 7));
        for (let i = 0; i < pulses; i++) {
          const t = ctx.currentTime + offset + i * 0.03;
          const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = basePitch + randRange(-40, 40);
          const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = basePitch; bp.Q.value = 8;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.15, t + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
          osc.connect(bp); bp.connect(g); g.connect(gainNode);
          osc.start(t); osc.stop(t + 0.03);
        }
        const timer = setTimeout(chirpTrain, randRange(600, 1800));
        timers.push(timer);
      })();
    }

    voice(4200, 0);
    voice(3800, 0.4);
    voice(4600, 0.8);

    return { stop: () => { stopped = true; timers.forEach(clearTimeout); } };
  }

  const BUILDERS = {
    white: buildWhite,
    brown: buildBrown,
    rain: buildRain,
    train: buildTrain,
    typing: buildTyping,
    fireplace: buildFireplace,
    wind: buildWind,
    thunder: buildThunder,
    birds: buildBirds,
    ethereal: buildEthereal,
    binaural: buildBinaural,
    lofi: buildLofi,
    chimes: buildChimes,
    crickets: buildCrickets,
  };

  // Playback control
  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = Number($('amb-master').value) / 100;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function gainNodeFor(id) {
    if (active[id]) return active[id].gainNode;
    const g = ctx.createGain();
    g.gain.value = (levels[id] || 0) / 100;
    g.connect(master);
    const inst = BUILDERS[id](g);
    active[id] = Object.assign({ gainNode: g }, inst);
    return g;
  }

  function playAll() {
    ensureContext();
    playing = true;
    updatePlayButton();
    LAYER_IDS.forEach((id) => {
      if (levels[id] > 0) gainNodeFor(id);
    });
  }

  function pauseAll() {
    playing = false;
    updatePlayButton();
    Object.keys(active).forEach((id) => {
      try { active[id].stop(); } catch (e) { /* already stopped */ }
      delete active[id];
    });
    if (ctx) ctx.suspend();
  }

  function updatePlayButton() {
    const btn = $('amb-play-btn');
    btn.textContent = playing ? '⏸ Pause' : '▶ Play';
  }

  function setLevel(id, value) {
    levels[id] = value;
    $(`amb-pct-${id}`).textContent = `${value}%`;
    saveState();
    if (!playing) return;
    if (active[id]) {
      active[id].gainNode.gain.setTargetAtTime(value / 100, ctx.currentTime, 0.05);
    } else if (value > 0) {
      gainNodeFor(id);
    }
  }

  function setMaster(value) {
    $('amb-master-pct').textContent = `${value}%`;
    saveState();
    if (master) master.gain.setTargetAtTime(value / 100, ctx.currentTime, 0.05);
  }

  function setFreq(id, value) {
    freqLevels[id] = value;
    $(`amb-freqpct-${id}`).textContent = `${value}%`;
    saveState();
  }

  function applyPreset(name) {
    const preset = PRESETS[name] || {};
    LAYER_IDS.forEach((id) => {
      const value = preset[id] || 0;
      $(`amb-slider-${id}`).value = value;
      setLevel(id, value);
    });
  }

  // Persistence
  function saveState() {
    try {
      const state = { master: Number($('amb-master').value) };
      LAYER_IDS.forEach((id) => { state[id] = levels[id] || 0; });
      FREQ_IDS.forEach((id) => { state[`freq_${id}`] = freqLevels[id] != null ? freqLevels[id] : 50; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (typeof state.master === 'number') {
        $('amb-master').value = state.master;
        $('amb-master-pct').textContent = `${state.master}%`;
      }
      LAYER_IDS.forEach((id) => {
        if (typeof state[id] === 'number') {
          $(`amb-slider-${id}`).value = state[id];
          levels[id] = state[id];
          $(`amb-pct-${id}`).textContent = `${state[id]}%`;
        }
      });
      FREQ_IDS.forEach((id) => {
        const key = `freq_${id}`;
        if (typeof state[key] === 'number') {
          $(`amb-freq-${id}`).value = state[key];
          freqLevels[id] = state[key];
          $(`amb-freqpct-${id}`).textContent = `${state[key]}%`;
        }
      });
    } catch (e) { /* storage unavailable or corrupt */ }
  }

  // Wiring
  function init() {
    LAYER_IDS.forEach((id) => { levels[id] = Number($(`amb-slider-${id}`).value) || 0; });
    FREQ_IDS.forEach((id) => { freqLevels[id] = Number($(`amb-freq-${id}`).value) || 50; });
    loadState();

    LAYER_IDS.forEach((id) => {
      $(`amb-slider-${id}`).addEventListener('input', (e) => setLevel(id, Number(e.target.value)));
    });
    FREQ_IDS.forEach((id) => {
      $(`amb-freq-${id}`).addEventListener('input', (e) => setFreq(id, Number(e.target.value)));
    });
    $('amb-master').addEventListener('input', (e) => setMaster(Number(e.target.value)));
    $('amb-play-btn').addEventListener('click', () => (playing ? pauseAll() : playAll()));

    document.querySelectorAll('.amb-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
