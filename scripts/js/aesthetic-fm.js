(function () {
  "use strict";

  const els = {
    setup: document.getElementById("aesthetic-setup"),
    editor: document.getElementById("aesthetic-editor"),
    gifUpload: document.getElementById("aesthetic-gif-upload"),
    audioUpload: document.getElementById("aesthetic-audio-upload"),
    beginBtn: document.getElementById("aesthetic-begin"),
    previewBox: document.getElementById("aesthetic-preview-box"),
    bgLayer: document.getElementById("aesthetic-bg-layer"),
    gifCanvas: document.getElementById("aesthetic-gif-canvas"),
    waveform: document.getElementById("aesthetic-waveform"),
    playPauseBtn: document.getElementById("aesthetic-play-pause"),
    timeCurrent: document.getElementById("aesthetic-time-current"),
    timeTotal: document.getElementById("aesthetic-time-total"),
    scrubber: document.getElementById("aesthetic-scrubber"),
    gifSpeed: document.getElementById("aesthetic-gif-speed"),
    gifStartFrame: document.getElementById("aesthetic-gif-start-frame"),
    gifStartFrameWrap: document.getElementById("aesthetic-gif-start-frame-wrap"),
    bgMode: document.getElementById("aesthetic-bg-mode"),
    colorPickerWrap: document.getElementById("aesthetic-color-picker-wrap"),
    bgColor: document.getElementById("aesthetic-bg-color"),
    effects: document.getElementById("aesthetic-effects"),
    effectsCanvas: document.getElementById("aesthetic-effects-canvas"),
    animation: document.getElementById("aesthetic-animation"),
    visType: document.getElementById("aesthetic-vis-type"),
    visTheme: document.getElementById("aesthetic-vis-theme"),
    visStroke: document.getElementById("aesthetic-vis-stroke"),
    valGifSpeed: document.getElementById("val-gif-speed"),
    valVisStroke: document.getElementById("val-vis-stroke"),
    presetBtns: document.querySelectorAll(".preset-btn"),
    resetBtns: document.querySelectorAll(".reset-btn"),
    speed: document.getElementById("aesthetic-speed"),
    pitch: document.getElementById("aesthetic-pitch"),
    bass: document.getElementById("aesthetic-bass"),
    reverb: document.getElementById("aesthetic-reverb"),
    lowpass: document.getElementById("aesthetic-lowpass"),
    bitcrush: document.getElementById("aesthetic-bitcrush"),
    fadeIn: document.getElementById("aesthetic-fade-in"),
    fadeOut: document.getElementById("aesthetic-fade-out"),
    valSpeed: document.getElementById("val-speed"),
    valPitch: document.getElementById("val-pitch"),
    valBass: document.getElementById("val-bass"),
    valReverb: document.getElementById("val-reverb"),
    valLowpass: document.getElementById("val-lowpass"),
    valBitcrush: document.getElementById("val-bitcrush"),
    tabBtns: document.querySelectorAll(".aesthetic-tab-btn"),
    tabPanels: document.querySelectorAll(".aesthetic-tab-panel"),
  };

  const S = {
    audioBuffer: null,
    audioCtx: null,
    sourceNode: null,
    gainNode: null,
    bassNode: null,
    lowpassNode: null,
    dryGain: null,
    wetGain: null,
    reverbNode: null,
    bitcrushNode: null,
    analyser: null,
    workletReady: false,
    gifOffscreen: null,
    gifOffCtx: null,
    isPlaying: false,
    speedRatio: 1.0,
    playOffset: 0,
    playStartTime: 0,
    duration: 0,
    intentionalStop: false,
    gifFrames: [],
    gifFrameIndex: 0,
    gifAccumMs: 0,
    gifLastRaf: 0,
    gifAnimId: null,
    gifCtx: null,
    bgCtx: null,
    visAnimId: null,
    isScrubbing: false,
    particles: [],
    currentEffectType: null,
    effectsCtx: null,
    radialAngle: 0,
    beatData: null,
    bassEMA: null,
    bassEnvelope: null,
    lastBeatTime: 0,
    beatPulse: 0,
    swayPhase: 0,
    animApplied: false,
  };

  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, "0")}`;
  }

  function currentTime() {
    if (!S.audioCtx || !S.isPlaying) return S.playOffset;
    const elapsed = (S.audioCtx.currentTime - S.playStartTime) * S.speedRatio;
    return Math.min(S.playOffset + elapsed, S.duration);
  }

  function createImpulse(ctx, dur, decay) {
    const n = ctx.sampleRate * dur;
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }

  function checkUploads() {
    els.beginBtn.disabled = !(els.gifUpload.files[0] && els.audioUpload.files[0]);
  }
  els.gifUpload.addEventListener("change", checkUploads);
  els.audioUpload.addEventListener("change", checkUploads);
  els.beginBtn.addEventListener("click", async () => {
    els.beginBtn.disabled = true;
    els.beginBtn.textContent = "Loading…";
    try {
      const gifBuf = await els.gifUpload.files[0].arrayBuffer();
      const parsed = AestheticGifParser.parseGif(gifBuf);
      S.gifFrames = parsed.frames;

      const maxFr = Math.max(0, parsed.frames.length - 1);
      els.gifStartFrame.max = maxFr;
      els.gifStartFrame.value = 0;
      els.gifStartFrameWrap.querySelector(".val-gif-start").textContent = "0";
      els.gifStartFrameWrap.querySelector(".max-gif-frames").textContent = `/ ${maxFr}`;

      S.gifCtx = els.gifCanvas.getContext("2d");
      els.gifCanvas.width = 1280;
      els.gifCanvas.height = 720;
      S.gifWidth = parsed.width;
      S.gifHeight = parsed.height;

      S.bgCtx = els.bgLayer.getContext("2d");
      els.bgLayer.width = 1280;
      els.bgLayer.height = 720;

      const audioBuf = await els.audioUpload.files[0].arrayBuffer();
      S.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      S.audioBuffer = await S.audioCtx.decodeAudioData(audioBuf);
      S.duration = S.audioBuffer.duration;

      els.scrubber.max = S.duration;
      els.scrubber.step = 0.01;
      els.timeTotal.textContent = fmt(S.duration);

      await buildAudioGraph();
      drawGifFrame(0);
      updateBackground();

      els.setup.classList.add("aesthetic-hidden");
      els.editor.classList.remove("aesthetic-hidden");
    } catch (err) {
      console.error(err);
      alert("Failed to load: " + err.message);
      els.beginBtn.disabled = false;
      els.beginBtn.textContent = "Enter Studio";
    }
  });

  async function buildAudioGraph() {
    const ctx = S.audioCtx;

    if (!S.workletReady) {
      const workletSrc = `
class BitcrushProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name:"bits", defaultValue:16, minValue:1, maxValue:16, automationRate:"k-rate" }];
  }
  process(inputs, outputs, params) {
    const inp = inputs[0], out = outputs[0], step = Math.pow(0.5, params.bits[0]);
    for (let ch = 0; ch < out.length; ch++) {
      const ic = inp[ch], oc = out[ch];
      if (!ic) { oc.fill(0); continue; }
      for (let i = 0; i < oc.length; i++) oc[i] = step * Math.round(ic[i] / step);
    }
    return true;
  }
}
registerProcessor("aesthetic-bitcrush", BitcrushProcessor);
`;
      const blob = new Blob([workletSrc], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      S.workletReady = true;
    }

    S.bassNode = ctx.createBiquadFilter();
    S.bassNode.type = "lowshelf";
    S.bassNode.frequency.value = 200;

    S.lowpassNode = ctx.createBiquadFilter();
    S.lowpassNode.type = "lowpass";

    S.bitcrushNode = new AudioWorkletNode(ctx, "aesthetic-bitcrush");

    S.reverbNode = ctx.createConvolver();
    S.reverbNode.buffer = createImpulse(ctx, 3, 2);
    S.dryGain = ctx.createGain();
    S.wetGain = ctx.createGain();
    S.gainNode = ctx.createGain();
    S.analyser = ctx.createAnalyser();
    S.analyser.fftSize = 256;

    S.bassNode.connect(S.lowpassNode);
    S.lowpassNode.connect(S.bitcrushNode);
    S.bitcrushNode.connect(S.dryGain);
    S.bitcrushNode.connect(S.reverbNode);
    S.reverbNode.connect(S.wetGain);
    S.dryGain.connect(S.gainNode);
    S.wetGain.connect(S.gainNode);
    S.gainNode.connect(S.analyser);
    S.analyser.connect(ctx.destination);

    applyAudioSettings();
  }

  function createSource() {
    if (S.sourceNode) {
      S.sourceNode.onended = null;
      try { S.sourceNode.disconnect(); } catch (_) { }
    }
    const src = S.audioCtx.createBufferSource();
    src.buffer = S.audioBuffer;
    const sr = Math.max(0.1, Math.min(parseFloat(els.speed.value) / 100, 4.0));
    src.playbackRate.value = sr;
    src.detune.value = parseFloat(els.pitch.value);
    src.connect(S.bassNode);
    src.onended = onNaturalEnd;
    S.speedRatio = sr;
    S.sourceNode = src;
    return src;
  }

  function applyAudioSettingsToLiveSource() {
    if (!S.sourceNode) return;
    const sr = Math.max(0.1, Math.min(parseFloat(els.speed.value) / 100, 4.0));
    S.playOffset = currentTime();
    S.playStartTime = S.audioCtx.currentTime;
    S.speedRatio = sr;
    S.sourceNode.playbackRate.value = sr;
    S.sourceNode.detune.value = parseFloat(els.pitch.value);
  }

  els.playPauseBtn.addEventListener("click", async () => {
    if (!S.audioCtx) return;
    if (S.isPlaying) {
      pause();
    } else {
      await S.audioCtx.resume();
      play(S.playOffset);
    }
  });

  function play(offsetSec) {
    const offset = Math.max(0, Math.min(offsetSec, S.duration - 0.01));
    const src = createSource();
    const ctx = S.audioCtx;

    S.playOffset = offset;
    S.playStartTime = ctx.currentTime;
    S.intentionalStop = false;
    src.start(0, offset);

    const fadeInSec = (parseInt(els.fadeIn.value, 10) || 0) / 1000;
    S.gainNode.gain.cancelScheduledValues(ctx.currentTime);
    if (fadeInSec > 0 && offset < fadeInSec) {
      S.gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      S.gainNode.gain.exponentialRampToValueAtTime(1.0, ctx.currentTime + fadeInSec);
    } else {
      S.gainNode.gain.setValueAtTime(1.0, ctx.currentTime);
    }

    S.isPlaying = true;
    els.playPauseBtn.textContent = "⏸";
    startGifLoop();
    drawViz();
  }

  function pause() {
    S.intentionalStop = true;
    S.playOffset = currentTime();
    try { S.sourceNode.stop(); } catch (_) { }
    S.audioCtx.suspend();
    S.gainNode.gain.cancelScheduledValues(S.audioCtx.currentTime);
    S.gainNode.gain.setValueAtTime(1.0, S.audioCtx.currentTime);
    cancelAnimationFrame(S.visAnimId);
    cancelAnimationFrame(S.gifAnimId);
    S.isPlaying = false;
    els.playPauseBtn.textContent = "▶";
  }

  function resetReverbTail() {
    // ConvolverNode buffers its own reverb tail internally; stopping the
    // source doesn't clear it, so a seek would otherwise let the old tail
    // ring into the audio at the new position. Swap in a fresh convolver.
    if (!S.audioCtx || !S.reverbNode) return;
    try { S.bitcrushNode.disconnect(S.reverbNode); } catch (_) { }
    try { S.reverbNode.disconnect(S.wetGain); } catch (_) { }
    const fresh = S.audioCtx.createConvolver();
    fresh.buffer = S.reverbNode.buffer;
    S.reverbNode = fresh;
    S.bitcrushNode.connect(S.reverbNode);
    S.reverbNode.connect(S.wetGain);
  }

  function stopForSeek(nextOffset) {
    S.intentionalStop = true;
    try { S.sourceNode.stop(); } catch (_) { }
    S.gainNode.gain.cancelScheduledValues(S.audioCtx.currentTime);
    S.gainNode.gain.setValueAtTime(1.0, S.audioCtx.currentTime);
    cancelAnimationFrame(S.visAnimId);
    cancelAnimationFrame(S.gifAnimId);
    S.isPlaying = false;
    resetReverbTail();
  }

  function onNaturalEnd() {
    if (S.intentionalStop) return;
    S.intentionalStop = true;
    S.gainNode.gain.cancelScheduledValues(S.audioCtx.currentTime);
    S.gainNode.gain.setValueAtTime(1.0, S.audioCtx.currentTime);
    S.audioCtx.suspend();
    cancelAnimationFrame(S.visAnimId);
    cancelAnimationFrame(S.gifAnimId);
    S.isPlaying = false;
    S.playOffset = 0;
    els.playPauseBtn.textContent = "▶";
    els.scrubber.value = 0;
    els.timeCurrent.textContent = fmt(0);
  }

  els.scrubber.addEventListener("mousedown", () => { S.isScrubbing = true; });
  els.scrubber.addEventListener("touchstart", () => { S.isScrubbing = true; }, { passive: true });

  els.scrubber.addEventListener("input", () => {
    els.timeCurrent.textContent = fmt(parseFloat(els.scrubber.value));
  });

  els.scrubber.addEventListener("change", () => {
    const seekTo = parseFloat(els.scrubber.value);
    S.isScrubbing = false;
    if (S.isPlaying) {
      stopForSeek(seekTo);
      play(seekTo);
    } else {
      S.playOffset = seekTo;
      els.timeCurrent.textContent = fmt(seekTo);
    }
  });

  els.scrubber.addEventListener("mouseup", () => { S.isScrubbing = false; });
  els.scrubber.addEventListener("touchend", () => { S.isScrubbing = false; });

  function tickScrubber() {
    if (S.isScrubbing) return;
    const t = currentTime();
    els.scrubber.value = t;
    els.timeCurrent.textContent = fmt(t);

    const fadeOutSec = (parseInt(els.fadeOut.value, 10) || 0) / 1000;
    if (fadeOutSec > 0 && S.duration > 0) {
      const remaining = S.duration - t;
      if (remaining > 0 && remaining <= fadeOutSec + 0.05 && S.gainNode.gain.value > 0.01) {
        const ctx = S.audioCtx;
        S.gainNode.gain.cancelScheduledValues(ctx.currentTime);
        S.gainNode.gain.setValueAtTime(S.gainNode.gain.value, ctx.currentTime);
        S.gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + remaining);
      }
    }
  }

  function applyAudioSettings() {
    if (!S.audioCtx) return;
    applyAudioSettingsToLiveSource();
    S.bassNode.gain.value = parseFloat(els.bass.value);
    S.lowpassNode.frequency.value = parseFloat(els.lowpass.value);
    const mix = parseInt(els.reverb.value, 10) / 100;
    S.wetGain.gain.value = mix;
    S.dryGain.gain.value = 1 - mix;
    const bits = parseInt(els.bitcrush.value, 10);
    S.bitcrushNode.parameters.get("bits").setValueAtTime(bits, S.audioCtx.currentTime);
  }

  function updateLabels() {
    els.valGifSpeed.textContent = els.gifSpeed.value;
    els.valVisStroke.textContent = els.visStroke.value;
    els.valSpeed.textContent = els.speed.value;
    els.valPitch.textContent = (+els.pitch.value > 0 ? "+" : "") + els.pitch.value;
    els.valBass.textContent = els.bass.value;
    els.valReverb.textContent = els.reverb.value;
    els.valLowpass.textContent = parseFloat(els.lowpass.value) >= 20000 ? "Off" : els.lowpass.value;
    els.valBitcrush.textContent = els.bitcrush.value;
    applyAudioSettings();
  }

  els.presetBtns.forEach(btn => btn.addEventListener("click", e => {
    els.presetBtns.forEach(b => b.classList.toggle("active", b === e.currentTarget));
    const pt = e.currentTarget.dataset.preset;
    const set = (obj) => Object.entries(obj).forEach(([k, v]) => { if (els[k]) els[k].value = v; });
    if (pt === "vaporwave") set({ speed: 75, pitch: -30, bass: 5, reverb: 40, lowpass: 3000, bitcrush: 16 });
    else if (pt === "nightcore") set({ speed: 135, pitch: 30, bass: 8, reverb: 0, lowpass: 20000, bitcrush: 16 });
    else if (pt === "lofi") set({ speed: 90, pitch: -20, bass: 6, reverb: 30, lowpass: 5000, bitcrush: 10 });
    else set({ speed: 100, pitch: 0, bass: 0, reverb: 0, lowpass: 20000, bitcrush: 16 });
    updateLabels();
  }));

  els.resetBtns.forEach(btn => btn.addEventListener("click", e => {
    const t = e.currentTarget.closest(".reset-btn");
    if (!t) return;
    document.getElementById(t.dataset.target).value = t.dataset.default;
    els.presetBtns.forEach(b => b.classList.remove("active"));
    updateLabels();
  }));

  ["speed", "pitch", "bass", "reverb", "lowpass", "bitcrush"].forEach(id => {
    els[id].addEventListener("input", () => {
      els.presetBtns.forEach(b => b.classList.remove("active"));
      updateLabels();
    });
  });
  ["gifSpeed", "visType", "visTheme", "visStroke"].forEach(id => {
    els[id].addEventListener("input", updateLabels);
  });

  function drawBackdropFrame() {
    if (!S.bgCtx || !S._scratchCanvas || !S._scratchCanvas.width) return;
    const cw = els.bgLayer.width;
    const ch = els.bgLayer.height;
    const sw = S._scratchCanvas.width;
    const sh = S._scratchCanvas.height;
    const scale = Math.max(cw / sw, ch / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    S.bgCtx.clearRect(0, 0, cw, ch);
    S.bgCtx.drawImage(S._scratchCanvas, dx, dy, dw, dh);
  }

  function updateBackground() {
    const mode = els.bgMode.value;
    els.colorPickerWrap.classList.toggle("aesthetic-hidden", mode !== "color");
    if (mode === "blur") {
      els.bgLayer.style.backgroundColor = "transparent";
      drawBackdropFrame();
    } else if (mode === "color") {
      if (S.bgCtx) S.bgCtx.clearRect(0, 0, els.bgLayer.width, els.bgLayer.height);
      els.bgLayer.style.backgroundColor = els.bgColor.value;
    } else {
      // "black" and "fit" both just show a flat backdrop behind/around the gif
      if (S.bgCtx) S.bgCtx.clearRect(0, 0, els.bgLayer.width, els.bgLayer.height);
      els.bgLayer.style.backgroundColor = "#000";
    }
  }
  els.bgMode.addEventListener("change", updateBackground);
  els.bgColor.addEventListener("input", updateBackground);

  function drawGifFrame(index) {
    if (!S.gifFrames.length || !S.gifCtx) return;
    const frame = S.gifFrames[index % S.gifFrames.length];

    if (!S._scratchCanvas) {
      S._scratchCanvas = document.createElement("canvas");
      S._scratchCtx = S._scratchCanvas.getContext("2d");
    }
    if (S._scratchCanvas.width !== S.gifWidth || S._scratchCanvas.height !== S.gifHeight) {
      S._scratchCanvas.width = S.gifWidth;
      S._scratchCanvas.height = S.gifHeight;
    }
    S._scratchCtx.putImageData(
      new ImageData(new Uint8ClampedArray(frame.imageData), S.gifWidth, S.gifHeight), 0, 0
    );

    const dw = els.gifCanvas.width;
    const dh = els.gifCanvas.height;
    // "Fit" crops to fill the frame (like CSS background-size:cover); every
    // other mode letterboxes to keep the whole gif visible.
    const scale = els.bgMode.value === "fit"
      ? Math.max(dw / S.gifWidth, dh / S.gifHeight)
      : Math.min(dw / S.gifWidth, dh / S.gifHeight);
    const bw = Math.round(S.gifWidth * scale);
    const bh = Math.round(S.gifHeight * scale);
    const bx = Math.round((dw - bw) / 2);
    const by = Math.round((dh - bh) / 2);

    S.gifCtx.clearRect(0, 0, dw, dh);
    S.gifCtx.drawImage(S._scratchCanvas, bx, by, bw, bh);
  }

  function startGifLoop() {
    cancelAnimationFrame(S.gifAnimId);
    const startI = Math.min(parseInt(els.gifStartFrame.value, 10) || 0, S.gifFrames.length - 1);
    S.gifFrameIndex = startI;
    S.gifAccumMs = 0;
    S.gifLastRaf = performance.now();
    drawGifFrame(startI);
    if (els.bgMode.value === "blur") drawBackdropFrame();
    gifLoop(performance.now());
  }

  function gifLoop(now) {
    if (!S.isPlaying) return;
    S.gifAnimId = requestAnimationFrame(gifLoop);

    const delta = now - S.gifLastRaf;
    S.gifLastRaf = now;
    stepParticles();
    stepAnimation(now, delta);

    if (!S.gifFrames.length) return;

    const speedMul = parseFloat(els.gifSpeed.value) / 100;
    S.gifAccumMs += delta * speedMul;

    let advanced = false;
    while (S.gifAccumMs >= S.gifFrames[S.gifFrameIndex].delay) {
      S.gifAccumMs -= S.gifFrames[S.gifFrameIndex].delay;
      S.gifFrameIndex = (S.gifFrameIndex + 1) % S.gifFrames.length;
      advanced = true;
    }
    if (advanced) {
      drawGifFrame(S.gifFrameIndex);
      if (els.bgMode.value === "blur") drawBackdropFrame();
    }
  }

  els.gifStartFrame.addEventListener("input", () => {
    const v = parseInt(els.gifStartFrame.value, 10);
    els.gifStartFrameWrap.querySelector(".val-gif-start").textContent = v;
    S.gifFrameIndex = Math.min(v, S.gifFrames.length - 1);
    S.gifAccumMs = 0;
    drawGifFrame(S.gifFrameIndex);
  });

  function resizeEffectsCanvas() {
    const rect = els.previewBox.getBoundingClientRect();
    const tw = Math.round(rect.width);
    const th = Math.round(rect.height);
    if (tw > 0 && th > 0 && (els.effectsCanvas.width !== tw || els.effectsCanvas.height !== th)) {
      els.effectsCanvas.width = tw;
      els.effectsCanvas.height = th;
    }
  }

  function spawnParticle(type, w, h, randomY) {
    const x = Math.random() * w;
    const y = randomY ? Math.random() * h : -10;
    switch (type) {
      case "ash":
        return { x, y, vx: (Math.random() - 0.5) * 0.3, vy: 0.3 + Math.random() * 0.5, r: 1 + Math.random() * 2, alpha: 0.25 + Math.random() * 0.35, drift: Math.random() * Math.PI * 2 };
      case "snow":
        return { x, y, vx: (Math.random() - 0.5) * 0.4, vy: 0.5 + Math.random() * 1.0, r: 1.5 + Math.random() * 2.5, alpha: 0.5 + Math.random() * 0.5, drift: Math.random() * Math.PI * 2 };
      case "rain":
        return { x, y: randomY ? Math.random() * h : -20, vx: -0.5, vy: 8 + Math.random() * 6, len: 10 + Math.random() * 10, alpha: 0.25 + Math.random() * 0.3 };
      case "firefly":
        return { x, y, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, r: 1.5 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2, speed: 0.02 + Math.random() * 0.03 };
      case "glitter":
        return { x, y, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: 0.5 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2, speed: 0.05 + Math.random() * 0.08 };
      default:
        return null;
    }
  }

  const EFFECT_COUNTS = { ash: 40, snow: 60, rain: 90, firefly: 25, glitter: 60 };

  function initParticles(type) {
    const w = els.effectsCanvas.width, h = els.effectsCanvas.height;
    const count = EFFECT_COUNTS[type] || 0;
    S.particles = [];
    for (let i = 0; i < count; i++) S.particles.push(spawnParticle(type, w, h, true));
  }

  function stepParticles() {
    resizeEffectsCanvas();
    if (!S.effectsCtx) S.effectsCtx = els.effectsCanvas.getContext("2d");
    const ctx = S.effectsCtx;
    const w = els.effectsCanvas.width, h = els.effectsCanvas.height;
    const type = els.effects.value;

    if (type === "none") {
      ctx.clearRect(0, 0, w, h);
      S.particles = [];
      S.currentEffectType = type;
      return;
    }
    if (type !== S.currentEffectType || !S.particles.length) {
      initParticles(type);
      S.currentEffectType = type;
    }

    ctx.clearRect(0, 0, w, h);

    S.particles.forEach(p => {
      if (type === "ash") {
        p.drift += 0.01;
        p.x += p.vx + Math.sin(p.drift) * 0.3;
        p.y += p.vy;
        if (p.y > h + 5 || p.x < -5 || p.x > w + 5) Object.assign(p, spawnParticle("ash", w, h, false));
        ctx.beginPath();
        ctx.fillStyle = `rgba(150,150,150,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

      } else if (type === "snow") {
        p.drift += 0.02;
        p.x += p.vx + Math.sin(p.drift) * 0.5;
        p.y += p.vy;
        if (p.y > h + 5 || p.x < -5 || p.x > w + 5) Object.assign(p, spawnParticle("snow", w, h, false));
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

      } else if (type === "rain") {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > h + 20) Object.assign(p, spawnParticle("rain", w, h, false));
        ctx.strokeStyle = `rgba(180,210,255,${p.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 2, p.y + p.len);
        ctx.stroke();

      } else if (type === "firefly") {
        p.phase += p.speed;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(p.phase));
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(210,255,120,0.9)";
        ctx.fillStyle = `rgba(220,255,150,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else if (type === "glitter") {
        p.phase += p.speed;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.x = Math.random() * w;
        if (p.y < 0 || p.y > h) p.y = Math.random() * h;
        const a = Math.max(0, Math.sin(p.phase));
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(255,255,255,${a})`;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  els.effects.addEventListener("input", () => {
    S.currentEffectType = null;
    if (els.effects.value === "none" && S.effectsCtx) {
      S.effectsCtx.clearRect(0, 0, els.effectsCanvas.width, els.effectsCanvas.height);
      S.particles = [];
    }
  });

  // Beat-reactive animations read S.beatPulse (0..1), a blend of two
  // signals so they stay visibly alive even on mellow, non-percussive
  // vaporwave/lofi material that rarely has sharp transients:
  //  - bassEnvelope: a fast-following smoothed bass level, so the
  //    animation continuously "breathes" with the music's loudness.
  //  - a spike detector on top of that, for an extra kick on real beats
  //    (with a short cooldown so it doesn't retrigger every frame).
  function updateBeatPulse(now) {
    if (!S.analyser) return;
    const bufLen = S.analyser.frequencyBinCount;
    if (!S.beatData || S.beatData.length !== bufLen) S.beatData = new Uint8Array(bufLen);
    S.analyser.getByteFrequencyData(S.beatData);

    const bassBins = Math.max(1, Math.floor(bufLen * 0.12));
    let sum = 0;
    for (let i = 0; i < bassBins; i++) sum += S.beatData[i];
    const bass = (sum / bassBins) / 255;

    if (S.bassEnvelope == null) S.bassEnvelope = bass;
    S.bassEnvelope += (bass - S.bassEnvelope) * 0.35;

    if (S.bassEMA == null) S.bassEMA = bass;
    const isBeat = bass > S.bassEMA * 1.10 && bass > 0.12 && (now - S.lastBeatTime) > 140;
    S.bassEMA = S.bassEMA * 0.9 + bass * 0.1;

    if (isBeat) S.lastBeatTime = now;
    const kick = isBeat ? 1.0 : S.beatPulse * 0.88;
    S.beatPulse = Math.max(kick, S.bassEnvelope * 0.85);
  }

  function resetAnimation() {
    if (S.animApplied) {
      els.gifCanvas.style.transform = "";
      els.gifCanvas.style.filter = "";
      S.animApplied = false;
    }
    S.beatPulse = 0;
  }

  function stepAnimation(now, delta) {
    const type = els.animation.value;
    if (type === "none") {
      resetAnimation();
      return;
    }
    S.animApplied = true;

    if (type === "bounce" || type === "glitch") updateBeatPulse(now);

    let transform = "";
    let filter = "";

    if (type === "bounce") {
      transform = `scale(${(1 + S.beatPulse * 0.28).toFixed(4)})`;

    } else if (type === "sway") {
      S.swayPhase += delta * 0.0015;
      transform = `rotate(${(Math.sin(S.swayPhase) * 3).toFixed(2)}deg)`;

    } else if (type === "glitch") {
      const mag = S.beatPulse;
      if (mag > 0.12) {
        const dx = (Math.random() - 0.5) * 8 * mag;
        const skew = (Math.random() - 0.5) * 2.5 * mag;
        transform = `translateX(${dx.toFixed(2)}px) skewX(${skew.toFixed(2)}deg)`;
      }
      if (mag > 0.35) {
        filter = `hue-rotate(${Math.round(Math.random() * 24 - 12)}deg) saturate(${(1 + mag * 0.4).toFixed(2)})`;
      }
    }

    els.gifCanvas.style.transform = transform;
    els.gifCanvas.style.filter = filter;
  }

  els.animation.addEventListener("input", () => {
    if (els.animation.value === "none") resetAnimation();
  });

  const VIS_THEMES = {
    dusk:      { glow: "#8a2be2", linear: [["#4a00e0", 0], ["#1a1a1a", 1]], radial: [["#4a00e0", 0], ["#1a1a1a", 1]] },
    dawn:      { glow: "#f3904f", linear: [["#f3904f", 0], ["#3b4371", 1]], radial: [["#f3904f", 0], ["#3b4371", 1]] },
    snow:      { glow: "#ffffff", linear: [["#e0eafc", 0], ["#cfdef3", 1]], radial: [["#e0eafc", 0], ["#cfdef3", 1]] },
    night:     { glow: "#2c5364", linear: [["#0f2027", 0], ["#203a43", 1]], radial: [["#0f2027", 0], ["#203a43", 1]] },
    rainbow:   { glow: "#ffffff", linear: [["red", 0], ["orange", .2], ["yellow", .4], ["green", .6], ["blue", .8], ["violet", 1]], radial: [["red", 0], ["orange", .2], ["yellow", .4], ["green", .6], ["blue", .8], ["violet", 1]] },
    forest:    { glow: "#38ef7d", linear: [["#11998e", 0], ["#38ef7d", 1]], radial: [["#11998e", 0], ["#38ef7d", 1]] },
    glass:     { glow: "#ffffff", linear: [["rgba(255,255,255,0.5)", 0], ["rgba(255,255,255,0.8)", 1]], radial: [["rgba(255,255,255,0.9)", 0], ["rgba(255,255,255,0.3)", 1]] },
    cyberpunk: { glow: "#ff00c8", linear: [["#ff00c8", 0], ["#00fff9", 1]], radial: [["#ff00c8", 0], ["#00fff9", 1]] },
    fire:      { glow: "#ff512f", linear: [["#7f0000", 0], ["#ff512f", .5], ["#ffd200", 1]], radial: [["#ffd200", 0], ["#ff512f", .5], ["#7f0000", 1]] },
    ocean:     { glow: "#39cccc", linear: [["#001f3f", 0], ["#0074d9", .5], ["#7fdbff", 1]], radial: [["#7fdbff", 0], ["#0074d9", .5], ["#001f3f", 1]] },
    gold:      { glow: "#ffd700", linear: [["#1a1a1a", 0], ["#ffd700", 1]], radial: [["#ffd700", 0], ["#1a1a1a", 1]] },
    mono:      { glow: "#ffffff", linear: [["#ffffff", 0], ["#888888", 1]], radial: [["#ffffff", 0], ["#888888", 1]] },
    pastel:    { glow: "#ffafbd", linear: [["#ffafbd", 0], ["#c9ffbf", 1]], radial: [["#ffafbd", 0], ["#c9ffbf", 1]] },
    acid:      { glow: "#39ff14", linear: [["#0d0d0d", 0], ["#39ff14", 1]], radial: [["#39ff14", 0], ["#0d0d0d", 1]] },
  };
  const DEFAULT_THEME = { glow: "#ff00ff", linear: [["#ff00ff", 0], ["#00ffff", 1]], radial: [["#ff00ff", 0], ["#00ffff", 1]] };

  function themeOf(theme) {
    return VIS_THEMES[theme] || DEFAULT_THEME;
  }

  function gradientStyle(ctx, w, h, theme) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    themeOf(theme).linear.forEach(([c, p]) => g.addColorStop(p, c));
    return g;
  }

  function radialGradientStyle(ctx, cx, cy, radius, theme) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    themeOf(theme).radial.forEach(([c, p]) => g.addColorStop(p, c));
    return g;
  }

  // Averages `data` (bufLen entries) down into `bands` proportional buckets,
  // using a log-scale bin mapping rather than a linear one. Raw FFT bins
  // are linear in Hz, but real audio energy is concentrated in the first
  // handful of bins (bass/mid) — a linear bar->bin mapping leaves most bars
  // representing near-silent treble, so they never reach the far edge of
  // the player (or, for the radial visualizer, most spokes never extend at
  // all, leaving the circle looking incomplete). Log mapping gives bass/mid
  // most of the width/circle, like a real spectrum analyzer.
  function sampleBands(data, bufLen, bands) {
    const out = new Array(bands);
    const binAt = (t) => Math.pow(bufLen, t) - 1; // t in [0,1] -> bin in [0, bufLen-1]
    for (let i = 0; i < bands; i++) {
      const start = Math.max(0, Math.min(bufLen - 1, Math.floor(binAt(i / bands))));
      const end = i === bands - 1
        ? bufLen
        : Math.max(start + 1, Math.min(bufLen, Math.floor(binAt((i + 1) / bands))));
      let sum = 0;
      for (let j = start; j < end; j++) sum += data[j];
      out[i] = sum / (end - start);
    }
    return out;
  }

  function drawViz() {
    if (!S.isPlaying) return;
    tickScrubber();
    S.visAnimId = requestAnimationFrame(drawViz);

    const type = els.visType.value;
    const canvas = els.waveform;
    const ctx = canvas.getContext("2d");
    const rect = els.previewBox.getBoundingClientRect();
    const tw = Math.round(rect.width);
    const th = Math.round(rect.height);
    if (tw > 0 && th > 0 && (canvas.width !== tw || canvas.height !== th)) {
      canvas.width = tw;
      canvas.height = th;
    }
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);
    if (type === "none") return;

    const sw = parseInt(els.visStroke.value, 10);
    const theme = els.visTheme.value;
    const glow = themeOf(theme).glow;
    const bufLen = S.analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);

    if (type === "waveform") {
      S.analyser.getByteTimeDomainData(data);
      const sliceW = w / (bufLen - 1);
      const stripTop = h * 0.70;
      const stripH = h * 0.30;
      const pts = [];
      for (let i = 0; i < bufLen; i++) {
        const y = stripTop + (data[i] / 128.0) * stripH / 2;
        pts.push([i * sliceW, y]);
      }

      ctx.save();
      const grad = gradientStyle(ctx, w, h, theme);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // smoothed line via quadratic curves through midpoints
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i][0] + pts[i + 1][0]) / 2;
        const yc = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);

      ctx.shadowBlur = sw * 2.5;
      ctx.shadowColor = glow;
      ctx.strokeStyle = grad;
      ctx.lineWidth = sw;
      ctx.stroke();

      // soft filled area beneath the line for depth
      ctx.shadowBlur = 0;
      ctx.lineTo(w, stripTop + stripH);
      ctx.lineTo(0, stripTop + stripH);
      ctx.closePath();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

    } else if (type === "eq") {
      S.analyser.getByteFrequencyData(data);
      ctx.save();
      ctx.fillStyle = gradientStyle(ctx, w, h, theme);
      ctx.shadowBlur = sw * 1.5;
      ctx.shadowColor = glow;

      // Pick a bar count from the stroke size, then size bars (not the gap)
      // to exactly fill the canvas width, so bands always span edge-to-edge
      // instead of leaving leftover space bunched on one side.
      const gap = sw;
      const bars = Math.max(1, Math.round(w / (sw * 2)));
      const barW = Math.max(1, (w - (bars - 1) * gap) / bars);
      const radius = Math.min(barW / 2, 5);
      const bands = sampleBands(data, bufLen, bars);

      for (let i = 0; i < bars; i++) {
        const barH = (bands[i] / 255) * h * 0.40;
        if (barH <= 0) continue;
        const x = i * (barW + gap);
        const y = h - barH;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [radius, radius, 0, 0]);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barW, barH);
        }
      }
      ctx.restore();

    } else if (type === "mirror") {
      S.analyser.getByteFrequencyData(data);
      ctx.save();
      ctx.fillStyle = gradientStyle(ctx, w, h, theme);
      ctx.shadowBlur = sw * 1.5;
      ctx.shadowColor = glow;

      const gap = sw;
      const bars = Math.max(1, Math.round(w / (sw * 2)));
      const barW = Math.max(1, (w - (bars - 1) * gap) / bars);
      const radius = Math.min(barW / 2, 6);
      const bands = sampleBands(data, bufLen, bars);
      const cy = h / 2;

      for (let i = 0; i < bars; i++) {
        const barH = (bands[i] / 255) * h * 0.38;
        if (barH <= 0) continue;
        const x = i * (barW + gap);
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, cy - barH, barW, barH * 2, radius);
          ctx.fill();
        } else {
          ctx.fillRect(x, cy - barH, barW, barH * 2);
        }
      }
      ctx.restore();

    } else if (type === "radial") {
      S.analyser.getByteFrequencyData(data);

      const cx = w / 2, cy = h / 2;
      const side = Math.min(w, h);
      const innerR = side * 0.18;
      const maxLen = side * 0.30;
      const bars = Math.max(12, Math.min(180, Math.round(side / (sw * 1.5))));
      const bands = sampleBands(data, bufLen, bars);

      S.radialAngle = (S.radialAngle || 0) + 0.0025;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(S.radialAngle);
      ctx.lineCap = "round";
      ctx.strokeStyle = radialGradientStyle(ctx, 0, 0, innerR + maxLen, theme);
      ctx.lineWidth = Math.max(1, sw * 0.8);
      ctx.shadowBlur = sw * 1.5;
      ctx.shadowColor = glow;

      for (let i = 0; i < bars; i++) {
        const amp = bands[i] / 255;
        const len = maxLen * amp;
        if (len <= 0) continue;
        const angle = (i / bars) * Math.PI * 2;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(cos * innerR, sin * innerR);
        ctx.lineTo(cos * (innerR + len), sin * (innerR + len));
        ctx.stroke();
      }
      ctx.restore();

    } else if (type === "spectrum") {
      S.analyser.getByteFrequencyData(data);

      const bars = Math.max(32, Math.min(256, Math.round(w / 4)));
      const bands = sampleBands(data, bufLen, bars);
      const baseline = h;
      const maxH = h * 0.65;
      const pts = bands.map((v, i) => [(i / (bars - 1)) * w, baseline - (v / 255) * maxH]);

      ctx.save();
      const grad = gradientStyle(ctx, w, h, theme);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i][0] + pts[i + 1][0]) / 2;
        const yc = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);

      ctx.shadowBlur = sw * 2;
      ctx.shadowColor = glow;
      ctx.strokeStyle = grad;
      ctx.lineWidth = sw;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.lineTo(w, baseline);
      ctx.lineTo(0, baseline);
      ctx.closePath();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

    } else if (type === "pulse") {
      S.analyser.getByteFrequencyData(data);
      const bassBins = Math.max(1, Math.floor(bufLen * 0.12));
      let bassSum = 0;
      for (let i = 0; i < bassBins; i++) bassSum += data[i];
      const bass = (bassSum / bassBins) / 255;

      const cx = w / 2, cy = h / 2;
      const side = Math.min(w, h);
      const baseR = side * 0.22;
      const r = baseR + bass * side * 0.16;

      ctx.save();
      ctx.strokeStyle = radialGradientStyle(ctx, cx, cy, r * 1.4, theme);
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = sw * 2;
      ctx.shadowBlur = sw * 3;
      ctx.shadowColor = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r + sw * 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.lineWidth = sw;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

    } else if (type === "circular") {
      S.analyser.getByteTimeDomainData(data);

      const cx = w / 2;
      const cy = h / 2;
      const side = Math.min(w, h);
      const radius = side * 0.38;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowBlur = sw * 2;
      ctx.shadowColor = glow;
      ctx.strokeStyle = radialGradientStyle(ctx, cx, cy, radius * 1.6, theme);
      ctx.lineWidth = sw;
      ctx.beginPath();
      for (let i = 0; i <= bufLen; i++) {
        const idx = i % bufLen;
        const amp = (data[idx] / 128.0) - 1.0;
        const r = radius + amp * radius * 0.55;
        const angle = (idx / bufLen) * Math.PI * 2 - Math.PI / 2;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  els.tabBtns.forEach(btn => btn.addEventListener("click", () => {
    const target = btn.dataset.panel;
    els.tabBtns.forEach(b => b.classList.toggle("active", b === btn));
    els.tabPanels.forEach(p => p.classList.toggle("active", p.id === target));
  }));

})();