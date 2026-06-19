---
title: RegExp & DFA Converter
layout: page
permalink: /apps/regexp-dfa
stylesheet: regexp-dfa
---

<p><a href="/apps/">← Back to Apps</a></p>

<p>Convert Regular Expressions to Deterministic Finite Automata (DFA) and vice versa. Includes step-by-step simplification and state diagram rendering.</p>

<div class="regexdfa">
  <div class="regexdfa-tabs">
    <button class="tab-btn active" data-target="tab-regex-to-dfa">RegExp to DFA</button>
    <button class="tab-btn" data-target="tab-dfa-to-regex">DFA to RegExp</button>
  </div>

  <div id="tab-regex-to-dfa" class="tab-content active">
    <section class="regexdfa-sidebar" aria-label="Regex to DFA controls">
      <div class="regexdfa-control-grid">
        <div class="regexdfa-column-block">
          <label for="regex-input">Regular Expression</label>
          <input type="text" id="regex-input" value="01 + (0+11)*" spellcheck="false" />
          <p class="regexdfa-footnote">Use <code>ε</code> for Empty String, <code>+</code> for Union, <code>*</code> for Kleene Star, and adjacent characters for concatenation.</p>
        </div>

        <div class="regexdfa-column-block">
          <label for="regex-sigma-input">&Sigma; (Alphabet)</label>
          <input type="text" id="regex-sigma-input" value="0, 1" spellcheck="false" />
          <button type="button" class="btn" id="generate-dfa-btn">Generate DFA</button>
        </div>
      </div>
    </section>

    <div class="regexdfa-results-grid">
      <div class="regexdfa-math-panel">
        <h3>Formal Definition</h3>
        <div id="dfa-formal-def" class="math-output">N/A</div>
        
        <h3>Simplification Steps</h3>
        <div id="regex-simplification" class="math-output">N/A</div>

        <h3>Transition Table</h3>
        <div id="dfa-transition-table" class="table-container"></div>
      </div>

      <div class="regexdfa-canvas-container" id="dfa-canvas-container">
        <div id="dfa-cy" class="regexdfa-cy" role="img" aria-label="DFA state diagram"></div>
        <button type="button" class="regexdfa-fit-btn" id="dfa-fit-btn" aria-label="Fit diagram"><i class="fa-solid fa-expand"></i></button>
      </div>
    </div>
  </div>

  <div id="tab-dfa-to-regex" class="tab-content">
    <section class="regexdfa-sidebar" aria-label="DFA to Regex controls">
      <div class="regexdfa-control-grid">
        <div class="regexdfa-column-block">
          <label for="dfa-states-input">Q (States)</label>
          <input type="text" id="dfa-states-input" value="q0, q1, q2" spellcheck="false" />
          
          <label for="dfa-sigma-input">&Sigma; (Alphabet)</label>
          <input type="text" id="dfa-sigma-input" value="0, 1" spellcheck="false" />
        </div>

        <div class="regexdfa-column-block">
          <label for="dfa-start-input">q<sub>0</sub> (Start State)</label>
          <input type="text" id="dfa-start-input" value="q0" spellcheck="false" />

          <label for="dfa-final-input">F (Final States)</label>
          <input type="text" id="dfa-final-input" value="q2" spellcheck="false" />
        </div>
      </div>
      
      <button type="button" class="btn btn-outline" id="update-table-btn" style="margin-bottom: 1.25rem;">Update Transition Table</button>

      <div class="matrix-input-section">
        <label>Transition Table</label>
        <p class="regexdfa-footnote">Select the target state for each input. Leave blank for no transition.</p>
        
        <div id="dfa-dynamic-table" class="table-container dynamic-input-table"></div>
        
        <button type="button" class="btn" id="generate-regex-btn" style="margin-top: 1.25rem;">Convert RegExp to DFA</button>
      </div>
    </section>

    <div class="regexdfa-canvas-container stacked-canvas" id="dfa-to-regex-canvas-container">
      <div id="dfa-to-regex-cy" class="regexdfa-cy" role="img" aria-label="Input DFA state diagram"></div>
      <button type="button" class="regexdfa-fit-btn" id="dfa-to-regex-fit-btn" aria-label="Fit diagram"><i class="fa-solid fa-expand"></i></button>
    </div>

    <div class="regexdfa-math-panel results-panel-full">
      <h3>State Elimination Steps</h3>
      <div id="state-elim-steps" class="math-output state-elim-output">N/A</div>
      
      <h3>Final Regular Expression</h3>
      <div id="final-regex-output" class="math-output final-regex">N/A</div>
    </div>

  </div>

  <p style="text-align: center; margin-top: 2rem;">
    Created for UTK COSC312 Algorithm Analysis and Automata and COSC580 Foundations for students to use.
  </p>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.26.0/cytoscape.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js"></script>
<script src="{{ '/scripts/js/regexp-dfa.js' | relative_url }}"></script>