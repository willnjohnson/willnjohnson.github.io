---
title: Lambda Calculus Evaluator
layout: page
permalink: /apps/lambda-calculus
stylesheet: lambda-calculus
---

<p><a href="/apps/">← Back to Apps</a></p>

<div class="lambda-calculus" id="lambda-calculus-app">
  <p>Walks through successor, addition, and multiplication over Church numerals with a step-by-step derivation trace.</p>
  <section class="lambda-calculus-sidebar" aria-label="Lambda calculus controls">
    <div class="lambda-calculus-control-grid">
      <div class="lambda-calculus-column-block">
        <label for="lambda-calculus-operation">Mathematical Operation</label>
        <select id="lambda-calculus-operation">
          <option value="succ">succ(a) — Finding the successor of a</option>
          <option value="add" selected>a + b — Finding addition of two values</option>
          <option value="mul">a * b — Finding multiplication of two values</option>
          <option value="pow">a ^ b — Finding exponentiation of two values</option>
        </select>
      </div>

      <div class="lambda-calculus-column-block-actions">
        <div class="lambda-calculus-input-row">
          <div>
            <label for="lambda-calculus-val-a" id="lambda-calculus-label-a">Value A</label>
            <input type="number" id="lambda-calculus-val-a" min="0" max="9" value="2" />
          </div>
          <div id="lambda-calculus-container-b">
            <label for="lambda-calculus-val-b">Value B</label>
            <input type="number" id="lambda-calculus-val-b" min="0" max="9" value="3" />
          </div>
        </div>

        <div class="lambda-calculus-actions">
          <button type="button" class="btn" id="lambda-calculus-generate-btn">Generate Derivation</button>
        </div>
      </div>
    </div>
  </section>

  <div class="lambda-calculus-workspace">
    <div class="lambda-calculus-card" id="lambda-calculus-result-card">
      <div class="lambda-calculus-card-header" id="lambda-calculus-trace-title">Derivation Trace</div>
      <div id="lambda-calculus-steps-output"></div>
    </div>
  </div>

  <p style="text-align: center;">
    Created for UTK COSC312 Algorithm Analysis and Automata.
  </p>

</div>

<script src="{{ '/scripts/js/lambda-calculus.js' | relative_url }}"></script>
