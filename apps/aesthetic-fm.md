---
title: 【 ᴀ ᴇ ꜱ ᴛ ʜ ᴇ ᴛ ɪ ᴄ . ꜰ ᴍ 】 ၊၊||၊|။|||||။၊|။
layout: page
permalink: /apps/aesthetic-fm
stylesheet: aesthetic-fm
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="aesthetic" id="aesthetic-app">
  <p>Create your own custom vaporwave, nightcore, or lo-fi with a looped GIF.</p>
  <div id="aesthetic-setup">
    <div class="aesthetic-panel">
      <h2>Upload Media</h2>
      <p>Select your visuals and audio to begin.</p>

      <label for="aesthetic-gif-upload">Visuals (.GIF)</label>
      <input type="file" id="aesthetic-gif-upload" accept="image/gif" />

      <label for="aesthetic-audio-upload">Audio (.MP3, .WAV, .OGG)</label>
      <input type="file" id="aesthetic-audio-upload" accept="audio/mp3,audio/wav,audio/ogg" />

      <div class="aesthetic-actions">
        <button type="button" class="btn" id="aesthetic-begin" disabled>Begin</button>
      </div>
    </div>
  </div>

  <div id="aesthetic-editor" class="aesthetic-hidden">

    <div class="aesthetic-studio-row">

      <div class="aesthetic-preview-wrap">
        <div class="aesthetic-preview-container" id="aesthetic-preview-box">
          <canvas class="aesthetic-bg-layer"      id="aesthetic-bg-layer"></canvas>
          <canvas class="aesthetic-gif-canvas"    id="aesthetic-gif-canvas"></canvas>
          <canvas class="aesthetic-effects-canvas" id="aesthetic-effects-canvas"></canvas>
          <canvas class="aesthetic-waveform"      id="aesthetic-waveform"></canvas>
        </div>

        <div class="aesthetic-player-controls">
          <button id="aesthetic-play-pause" class="aesthetic-play-btn">▶</button>
          <span   id="aesthetic-time-current">0:00</span>
          <input  type="range" id="aesthetic-scrubber" min="0" max="100" step="0.01" value="0" />
          <span   id="aesthetic-time-total">0:00</span>
        </div>
      </div>

      <aside class="aesthetic-sidebar">

        <div class="aesthetic-sidebar-tabs">
          <button class="aesthetic-tab-btn active" data-panel="tab-visuals">Visuals</button>
          <button class="aesthetic-tab-btn"        data-panel="tab-audio">Audio</button>
        </div>

        <div class="aesthetic-tab-panel active" id="tab-visuals">

          <label for="aesthetic-gif-speed">GIF Speed (<span id="val-gif-speed">100</span>%)</label>
          <div class="aesthetic-slider-group">
            <input type="range" id="aesthetic-gif-speed" min="10" max="300" step="1" value="100" />
            <button class="reset-btn" data-target="aesthetic-gif-speed" data-default="100" title="Reset">⟲</button>
          </div>

          <div id="aesthetic-gif-start-frame-wrap" class="aesthetic-gif-start-wrap">
            <label for="aesthetic-gif-start-frame">
              Start Frame (<span class="val-gif-start">0</span><span class="max-gif-frames"> / 0</span>)
            </label>
            <input type="range" id="aesthetic-gif-start-frame" min="0" max="0" step="1" value="0" />
          </div>

          <label for="aesthetic-bg-mode">Backdrop</label>
          <select id="aesthetic-bg-mode">
            <option value="blur">Blurred GIF</option>
            <option value="fit">Fit GIF (Crop to Fill)</option>
            <option value="color">Solid Colour</option>
            <option value="black">Classic Black</option>
          </select>
          <div id="aesthetic-color-picker-wrap" class="aesthetic-hidden">
            <input type="color" id="aesthetic-bg-color" value="#ff00ff" style="margin-top:0.5rem;" />
          </div>

          <label for="aesthetic-effects">Effects</label>
          <select id="aesthetic-effects">
            <option value="none">None</option>
            <option value="ash">Ash</option>
            <option value="snow">Snow</option>
            <option value="rain">Rain</option>
            <option value="firefly">Firefly</option>
            <option value="glitter">Glitter</option>
          </select>

          <label for="aesthetic-animation">Animations</label>
          <select id="aesthetic-animation">
            <option value="none">None</option>
            <option value="bounce">Bounce — Beat Zoom</option>
            <option value="sway">Sway — Gentle Rock</option>
            <option value="glitch">Glitch — Beat Distort</option>
          </select>

          <hr class="aesthetic-divider" />

          <label for="aesthetic-vis-type">Visualizer</label>
          <select id="aesthetic-vis-type">
            <option value="none">None</option>
            <option value="waveform">Waveform (Line)</option>
            <option value="circular">Circular Waveform</option>
            <option value="eq">Equalizer (Bands)</option>
            <option value="mirror">Mirrored Bars</option>
            <option value="radial">Radial Spectrum</option>
            <option value="spectrum">Spectrum Area</option>
            <option value="pulse">Pulse Ring</option>
          </select>

          <label for="aesthetic-vis-theme">Theme</label>
          <select id="aesthetic-vis-theme">
            <option value="dusk">Dusk — Purple → Black</option>
            <option value="dawn">Dawn — Orange → Blue</option>
            <option value="snow">Snow — White → Light Blue</option>
            <option value="night">Night — Blue → Black</option>
            <option value="rainbow">Rainbow</option>
            <option value="forest">Forest — Greens</option>
            <option value="glass">Glass — 50% White</option>
            <option value="cyberpunk">Cyberpunk — Pink → Cyan</option>
            <option value="fire">Fire — Red → Orange → Gold</option>
            <option value="ocean">Ocean — Navy → Teal → Aqua</option>
            <option value="gold">Gold — Black → Gold</option>
            <option value="mono">Mono — White → Grey</option>
            <option value="pastel">Pastel — Pink → Mint</option>
            <option value="acid">Acid — Black → Neon Green</option>
          </select>

          <label for="aesthetic-vis-stroke">Stroke / Band (<span id="val-vis-stroke">2</span>px)</label>
          <div class="aesthetic-slider-group">
            <input type="range" id="aesthetic-vis-stroke" min="1" max="20" step="1" value="2" />
            <button class="reset-btn" data-target="aesthetic-vis-stroke" data-default="2" title="Reset">⟲</button>
          </div>
        </div>

        <div class="aesthetic-tab-panel" id="tab-audio">

          <div class="aesthetic-presets">
            <button type="button" class="aesthetic-score-btn preset-btn active" data-preset="normal">Normal</button>
            <button type="button" class="aesthetic-score-btn preset-btn" data-preset="vaporwave">Vaporwave</button>
            <button type="button" class="aesthetic-score-btn preset-btn" data-preset="nightcore">Nightcore</button>
            <button type="button" class="aesthetic-score-btn preset-btn" data-preset="lofi">Lo-Fi</button>
          </div>

          <label for="aesthetic-speed">Speed (<span id="val-speed">100</span>%)</label>
          <div class="aesthetic-slider-group">
            <input type="range" id="aesthetic-speed" min="50" max="200" step="1" value="100" />
            <button class="reset-btn" data-target="aesthetic-speed" data-default="100" title="Reset">⟲</button>
          </div>

          <label for="aesthetic-pitch">Pitch (<span id="val-pitch">0</span> cents)</label>
          <div class="aesthetic-slider-group">
            <input type="range" id="aesthetic-pitch" min="-200" max="200" step="1" value="0" />
            <button class="reset-btn" data-target="aesthetic-pitch" data-default="0" title="Reset">⟲</button>
          </div>

          <label for="aesthetic-bass">Bass Boost (<span id="val-bass">0</span> dB)</label>
          <div class="aesthetic-slider-group">
            <input type="range" id="aesthetic-bass" min="0" max="20" step="1" value="0" />
            <button class="reset-btn" data-target="aesthetic-bass" data-default="0" title="Reset">⟲</button>
          </div>

          <label for="aesthetic-reverb">Reverb (<span id="val-reverb">0</span>%)</label>
          <div class="aesthetic-slider-group">
            <input type="range" id="aesthetic-reverb" min="0" max="100" step="5" value="0" />
            <button class="reset-btn" data-target="aesthetic-reverb" data-default="0" title="Reset">⟲</button>
          </div>

          <label for="aesthetic-lowpass">Low-Pass (<span id="val-lowpass">Off</span> Hz)</label>
          <div class="aesthetic-slider-group">
            <input type="range" id="aesthetic-lowpass" min="200" max="20000" step="100" value="20000" />
            <button class="reset-btn" data-target="aesthetic-lowpass" data-default="20000" title="Reset">⟲</button>
          </div>

          <label for="aesthetic-bitcrush">Bitcrush (<span id="val-bitcrush">16</span>-bit)</label>
          <div class="aesthetic-slider-group">
            <input type="range" id="aesthetic-bitcrush" min="1" max="16" step="1" value="16" />
            <button class="reset-btn" data-target="aesthetic-bitcrush" data-default="16" title="Reset">⟲</button>
          </div>

          <label>Fade (ms)</label>
          <div class="aesthetic-fade-row">
            <input type="number" id="aesthetic-fade-in"  placeholder="Fade In"  min="0" value="0" />
            <input type="number" id="aesthetic-fade-out" placeholder="Fade Out" min="0" value="0" />
          </div>
        </div>

      </aside>
    </div>

</div>

<script src="{{ '/scripts/js/aesthetic-gif-parser.js' | relative_url }}"></script>
<script src="{{ '/scripts/js/aesthetic-fm.js'         | relative_url }}"></script>