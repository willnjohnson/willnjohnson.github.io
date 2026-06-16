---
title: CFG to PDA Converter
layout: page
permalink: /apps/cfg-to-pda
stylesheet: cfg-to-pda
---

<p class="cfgpda-back"><a href="/apps/">← Back to Apps</a></p>
<p>Takes in rules from a Context-Free Grammar and displays a Pushdown Automata as a state diagram.</p>
<div class="cfgpda">
  <section class="cfgpda-sidebar" aria-label="CFG to PDA controls">
    <div class="cfgpda-control-grid">
      <div class="cfgpda-column-block">
        <label for="cfgpda-cfg-input">Context-Free Grammar (CFG)</label>
        <textarea id="cfgpda-cfg-input" spellcheck="false">E->E+T|T
T->T*F|F
F->(E)|a</textarea>
        <p class="cfgpda-footnote">Use one production per line. Enter <code>_</code> for ε in grammar productions, for example <code>S-&gt;AB|_</code>.</p>
      </div>

      <div class="cfgpda-column-block">
        <label for="cfgpda-sigma-input">&Sigma; (Terminals)</label>
        <input type="text" id="cfgpda-sigma-input" value="a,+,*,(,)" spellcheck="false" />
        <button type="button" class="btn" id="cfgpda-generate-btn">Generate State Diagram</button>
      </div>
    </div>
  </section>

  <div class="cfgpda-canvas-container" id="cfgpda-canvas-container">
    <div id="cfgpda-cy" class="cfgpda-cy" role="img" aria-label="PDA state diagram"></div>
    <button type="button" class="cfgpda-fit-btn" id="cfgpda-fit-btn" aria-label="Fit diagram"><i class="fa-solid fa-expand"></i></button>
  </div>

  <p style="text-align: center;">
    Created for UTK COSC312 Algorithm Analysis and Automata for students to use.
  </p>

</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.26.0/cytoscape.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js"></script>
<script src="{{ '/scripts/js/cfg-to-pda.js' | relative_url }}"></script>
