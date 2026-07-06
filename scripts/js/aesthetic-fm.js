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
    visAnimId: null,
    isScrubbing: false,
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

      const audioBuf = await els.audioUpload.files[0].arrayBuffer();
      S.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      S.audioBuffer = await S.audioCtx.decodeAudioData(audioBuf);
      S.duration = S.audioBuffer.duration;

      els.scrubber.max = S.duration;
      els.scrubber.step = 0.01;
      els.timeTotal.textContent = fmt(S.duration);

      await buildAudioGraph();
      updateBackground();
      drawGifFrame(0);

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

  function stopForSeek(nextOffset) {
    S.intentionalStop = true;
    try { S.sourceNode.stop(); } catch (_) { }
    S.gainNode.gain.cancelScheduledValues(S.audioCtx.currentTime);
    S.gainNode.gain.setValueAtTime(1.0, S.audioCtx.currentTime);
    cancelAnimationFrame(S.visAnimId);
    cancelAnimationFrame(S.gifAnimId);
    S.isPlaying = false;
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

  function updateBackground() {
    const mode = els.bgMode.value;
    els.colorPickerWrap.classList.toggle("aesthetic-hidden", mode !== "color");
    if (mode === "blur") {
      if (S._scratchCanvas && S._scratchCanvas.width > 0) {
        const tmp = document.createElement("canvas");
        tmp.width = els.gifCanvas.width;
        tmp.height = els.gifCanvas.height;
        tmp.getContext("2d").drawImage(S._scratchCanvas, 0, 0, tmp.width, tmp.height);
        els.bgLayer.style.backgroundImage = `url(${tmp.toDataURL()})`;
      } else {
        els.bgLayer.style.backgroundImage = `url(${els.gifCanvas.toDataURL()})`;
      }
      els.bgLayer.style.backgroundColor = "transparent";
    } else if (mode === "color") {
      els.bgLayer.style.backgroundImage = "none";
      els.bgLayer.style.backgroundColor = els.bgColor.value;
    } else {
      els.bgLayer.style.backgroundImage = "none";
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
    const scale = Math.min(dw / S.gifWidth, dh / S.gifHeight);
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
    gifLoop(performance.now());
  }

  function gifLoop(now) {
    if (!S.isPlaying) return;
    S.gifAnimId = requestAnimationFrame(gifLoop);
    if (!S.gifFrames.length) return;

    const delta = now - S.gifLastRaf;
    S.gifLastRaf = now;
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
      if (els.bgMode.value === "blur") updateBackground();
    }
  }

  els.gifStartFrame.addEventListener("input", () => {
    const v = parseInt(els.gifStartFrame.value, 10);
    els.gifStartFrameWrap.querySelector(".val-gif-start").textContent = v;
    S.gifFrameIndex = Math.min(v, S.gifFrames.length - 1);
    S.gifAccumMs = 0;
    drawGifFrame(S.gifFrameIndex);
  });

  function gradientStyle(ctx, w, h, theme) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    const stops = {
      dusk: [["#4a00e0", 0], ["#1a1a1a", 1]],
      dawn: [["#f3904f", 0], ["#3b4371", 1]],
      snow: [["#e0eafc", 0], ["#cfdef3", 1]],
      night: [["#0f2027", 0], ["#203a43", 1]],
      forest: [["#11998e", 0], ["#38ef7d", 1]],
      glass: [["rgba(255,255,255,0.5)", 0], ["rgba(255,255,255,0.8)", 1]],
      rainbow: [["red", 0], ["orange", .2], ["yellow", .4], ["green", .6], ["blue", .8], ["violet", 1]],
    };
    const s = stops[theme] || [["#ff00ff", 0], ["#00ffff", 1]];
    s.forEach(([c, p]) => g.addColorStop(p, c));
    return g;
  }

  function radialGradientStyle(ctx, cx, cy, radius, theme) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const stops = {
      dusk: [["#4a00e0", 0], ["#1a1a1a", 1]],
      dawn: [["#f3904f", 0], ["#3b4371", 1]],
      snow: [["#e0eafc", 0], ["#cfdef3", 1]],
      night: [["#0f2027", 0], ["#203a43", 1]],
      forest: [["#11998e", 0], ["#38ef7d", 1]],
      glass: [["rgba(255,255,255,0.9)", 0], ["rgba(255,255,255,0.3)", 1]],
      rainbow: [["red", 0], ["orange", .2], ["yellow", .4], ["green", .6], ["blue", .8], ["violet", 1]],
    };
    const s = stops[theme] || [["#ff00ff", 0], ["#00ffff", 1]];
    s.forEach(([c, p]) => g.addColorStop(p, c));
    return g;
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
    const bufLen = S.analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);

    if (type === "waveform") {
      S.analyser.getByteTimeDomainData(data);
      ctx.strokeStyle = gradientStyle(ctx, w, h, theme);
      ctx.lineWidth = sw;
      ctx.beginPath();
      const sliceW = w / bufLen;
      const stripTop = h * 0.70;
      const stripH = h * 0.30;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const y = stripTop + (data[i] / 128.0) * stripH / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.lineTo(w, stripTop + stripH / 2);
      ctx.stroke();

    } else if (type === "eq") {
      S.analyser.getByteFrequencyData(data);
      ctx.fillStyle = gradientStyle(ctx, w, h, theme);
      const bars = Math.max(1, Math.floor(w / (sw * 2)));
      const step = Math.max(1, Math.floor(bufLen / bars));
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += data[i * step + j] || 0;
        const barH = (sum / step / 255) * h * 0.40;
        ctx.fillRect(i * sw * 2, h - barH, sw, barH);
      }

    } else if (type === "circular") {
      S.analyser.getByteTimeDomainData(data);

      const cx = w / 2;
      const cy = h / 2;
      const side = Math.min(w, h);
      const radius = side * 0.38;

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
    }
  }

  els.tabBtns.forEach(btn => btn.addEventListener("click", () => {
    const target = btn.dataset.panel;
    els.tabBtns.forEach(b => b.classList.toggle("active", b === btn));
    els.tabPanels.forEach(p => p.classList.toggle("active", p.id === target));
  }));

})();