---
title: MAC Attack Visualizer
layout: page
permalink: /apps/macattack
stylesheet: macattack
---

<p class="macattack-back"><a href="/apps/">← Back to Apps</a></p>

<div class="macattack">
  <p>This interactive visualizer demonstrates a length extension vulnerability on a <strong>SHA-1</strong> Message Authentication Code (MAC) where a Keyed-Hash construction <code>MAC = SHA-1(Secret ∥ Message)</code> is improperly implemented.</p>
  <section class="macattack-sidebar" aria-label="Attack configuration controls">
    <div class="macattack-control-grid">
      <div class="macattack-column-block">
        <label for="macattack-key-display">Secret Key (S) owned by the TA and Dr. Ruoti</label>
        <div class="macattack-input-group">
          <input type="password" id="macattack-key-display" value="SecretTAKey128b!" readonly />
          <button type="button" id="macattack-toggle-key" aria-label="Toggle key visibility"><i class="fa-solid fa-eye"></i></button>
        </div>
        <p class="macattack-footnote">Note: You do not know this secret key (S). You only need to know (or guess) its bit-length (l<sub>k</sub> = 128 bits) to correctly calculate the forged length offset.</p>
      </div>

      <div class="macattack-column-block">
        <label for="macattack-m1-input">TA's Original Message (m<sub>1</sub>)</label>
        <textarea id="macattack-m1-input" readonly>No one has completed Project #3 so give them all a 0.</textarea>
        
        <label for="macattack-m2-input" style="margin-top: 1rem;">Your Malicious Extension (m<sub>2</sub>)</label>
        <input type="text" id="macattack-m2-input" value="P.S. Except for William Johnson, go ahead and give him the full points." spellcheck="false" />
      </div>
    </div>
    <div style="text-align: right; margin-top: 1.5rem;">
      <button type="button" class="btn" id="macattack-execute-btn">Simulate Attack</button>
    </div>
  </section>

  <div class="macattack-pipeline macattack-hidden" id="macattack-pipeline-container">
    
    <div class="macattack-step-card">
      <div class="macattack-step-header">
        <h3>Step 1: TA Generates MAC<sub>1</sub></h3>
      </div>
      <div class="step-content">
        <p>The TA appends their secret key S to m<sub>1</sub> and generates a standard SHA-1 hash. They attach this digest to the message as an authenticating signature.</p>
        <div class="data-block">
          <strong>Original Data Stream Processed by TA (S ∥ m<sub>1</sub> ∥ p<sub>1</sub>):</strong>
          <div class="hex-dump text-wrap-dump" id="step1-stream">-</div>
        </div>
        <p><strong>ATTACKER INTERCEPTION:</strong> The TA sends m<sub>1</sub> and MAC<sub>1</sub> to Dr. Ruoti, but you intercept the packet.</p>
        <div class="interception-alert text-wrap-dump">
          <strong>Intercepted Message (m<sub>1</sub>):</strong> <code id="step1-m1-display">-</code><br/>
          <strong>Intercepted Digest (MAC<sub>1</sub>):</strong> <code id="step1-mac1">-</code>
        </div>
      </div>
    </div>

    <div class="macattack-step-card">
      <div class="macattack-step-header">
        <h3>Step 2: You Extract Intermediate State Vectors</h3>
      </div>
      <div class="step-content">
        <p>SHA-1 uses a Merkle-Damgård construction. MAC<sub>1</sub> is simply the internal state of the hash engine. By breaking it into 5 distinct 32-bit registers, you can initialize your own malicious instance of SHA-1 to resume the hash from where the TA left off.</p>
        
        <div class="iv-table-container">
          <table class="iv-table">
            <thead>
              <tr><th>H<sub>0</sub></th><th>H<sub>1</sub></th><th>H<sub>2</sub></th><th>H<sub>3</sub></th><th>H<sub>4</sub></th></tr>
            </thead>
            <tbody>
              <tr>
                <td id="iv-h0">-</td><td id="iv-h1">-</td><td id="iv-h2">-</td><td id="iv-h3">-</td><td id="iv-h4">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="macattack-step-card">
      <div class="macattack-step-header">
        <h3>Step 3: You Forge the New Request</h3>
      </div>
      <div class="step-content">
        <p>You compute the new MAC<sub>2</sub> by resuming the SHA-1 engine from the extracted state. You then construct the malicious packet to send to Dr. Ruoti.</p>
        <div class="data-block">
          <strong>Your Malicious Computation (Internal):</strong>
          <div class="hex-dump text-wrap-dump" id="step3-payload">-</div>
        </div>
        <p>Packet Sent to Dr. Ruoti:</p>
        <div class="result-box malicious text-wrap-dump">
          <strong>Forged Message (m&apos;):</strong> <code id="step3-mprime-display">-</code><br/>
          <strong>Forged Digest (MAC<sub>2</sub>):</strong> <code id="step3-mac2">-</code>
        </div>
      </div>
    </div>

    <div class="macattack-step-card">
      <div class="macattack-step-header">
        <h3>Step 4: Dr. Ruoti Authenticates the Forgery</h3>
      </div>
      <div class="step-content">
        <p>Dr. Ruoti receives the forged packet. He validates it by computing <code>SHA-1(S ∥ m')</code>. Because the construction is length-extendable, he cannot distinguish your forgery from a legitimate message.</p>
        <div class="verification-ui" id="verification-status">
          <div class="text-wrap-dump">
            <strong>Dr. Ruoti's SHA-1(S ∥ m'):</strong> <code id="step4-bobmac">-</code><br/>
          </div>
        </div>
      </div>
    </div>
  </div>

  <p style="text-align: center;">
    Created for UTK COSC483/583 Applied Cryptography.
  </p>

</div>

<script src="{{ '/scripts/js/macattack.js' | relative_url }}"></script>