(function () {
  function getElement(id) {
    return document.getElementById(id);
  }

  function nestedFunc(f, x, n) {
    let res = x;
    for (let i = 0; i < n; i += 1) {
      res = `${f}(${res})`;
    }
    return res;
  }

  function getChurchStr(n, f, x) {
    return `λ${f}${x}.${nestedFunc(f, x, n)}`;
  }

  function clampNumber(value) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return 0;
    return Math.min(9, Math.max(0, parsed));
  }

  function updateUI() {
    const operation = getElement('lambda-calculus-operation');
    const containerB = getElement('lambda-calculus-container-b');

    if (!operation || !containerB) return;

    containerB.style.display = operation.value === 'succ' ? 'none' : 'block';
  }

  function renderStep(output, index, step) {
    const block = document.createElement('div');
    block.className = 'lambda-calculus-step-block';
    block.innerHTML = `
      <div class="lambda-calculus-step-math"><span class="lambda-calculus-step-num">Step ${index + 1}:</span>${step.expr}</div>
      <div class="lambda-calculus-step-desc">${step.info}</div>
    `;
    output.appendChild(block);
  }

  function buildSuccSteps(a) {
    const churchA = getChurchStr(a, 'a', 'b');
    const resultNum = a + 1;
    const churchResult = getChurchStr(resultNum, 'f', 'x');

    return [
      {
        expr: `{λρfx.f(ρ(f,x))}(${churchA})`,
        info: `Initialize the Successor operator template <span class="lambda-calculus-emphasis">λρfx.f(ρ(f,x))</span>, providing the Church representation of <span class="lambda-calculus-emphasis">${a}</span> as input.`
      },
      {
        expr: `λfx.f((${churchA})(f,x))`,
        info: `Substitute our structural Church numeral argument into the first bound parameter variable <span class="lambda-calculus-emphasis">ρ</span>.`
      },
      {
        expr: `λfx.f({${getChurchStr(a, 'f', 'x')}})`,
        info: `Evaluate inner expression context <span class="lambda-calculus-emphasis">(${churchA})(f,x)</span> by alpha-converting terms 'a' and 'b' cleanly down to 'f' and 'x' variables to protect functional parameters against capture.`
      },
      {
        expr: `${churchResult} <span class="lambda-calculus-abbr">→</span> ${resultNum}`,
        info: `The leading functional block evaluates completely, rendering one additional application. This results in exactly <span class="lambda-calculus-emphasis">${resultNum}</span> nested terms, which denotes Church numeral value <span class="lambda-calculus-emphasis">${resultNum}</span>.`
      }
    ];
  }

  function buildAddSteps(a, b) {
    const churchA = getChurchStr(a, 'a', 'b');
    const churchB = getChurchStr(b, 'c', 'd');
    const resultNum = a + b;
    const innerAdded = nestedFunc('f', nestedFunc('f', 'x', b), a);

    return [
      {
        expr: `{λρσfx.ρ(f,σ(f,x))}(${churchA}, ${churchB})`,
        info: `Initialize the addition operator structure <span class="lambda-calculus-emphasis">λρσfx.ρ(f,σ(f,x))</span>, supplying representations for <span class="lambda-calculus-emphasis">${a}</span> and <span class="lambda-calculus-emphasis">${b}</span>.`
      },
      {
        expr: `λfx.${churchA}(f,{${churchB}}(f,x))`,
        info: `Perform reduction over bounding points by mapping the first numeral expression directly onto <span class="lambda-calculus-emphasis">ρ</span> and the second numeral onto <span class="lambda-calculus-emphasis">σ</span>.`
      },
      {
        expr: `λfx.{${getChurchStr(a, 'a', 'b')}}(f,${nestedFunc('f', 'x', b)})`,
        info: `Unroll the targeted sub-block <span class="lambda-calculus-emphasis">{${churchB}}(f,x)</span> by exchanging local tracking markers 'c' and 'd' for active execution nodes 'f' and 'x', producing <span class="lambda-calculus-emphasis">${b}</span> applications.`
      },
      {
        expr: `λfx.${innerAdded} <span class="lambda-calculus-abbr">→</span> ${resultNum}`,
        info: `Resolve out remaining outer structural expressions by mapping functional pointer 'f' into variable parameter 'a', and binding the newly assembled inner block context directly over placeholder token 'b'. The chain yields a unified total sequence of <span class="lambda-calculus-emphasis">${resultNum}</span> operations, shorthand for <span class="lambda-calculus-emphasis">${resultNum}</span>.`
      }
    ];
  }

  function buildMulSteps(a, b) {
    const churchA = getChurchStr(a, 'a', 'b');
    const churchB = getChurchStr(b, 'c', 'd');
    const resultNum = a * b;
    const outerSubstitutedBody = `λb.λd.${nestedFunc('x', 'd', b)}({λd.${nestedFunc('x', 'd', b)}}(b))`;
    const step5Body = `λb.{λd.${nestedFunc('x', 'd', b)}}(${nestedFunc('x', 'b', b)})`;
    const finalBody = nestedFunc('x', 'b', resultNum);

    return [
      {
        expr: `{λρσx.ρ(σ(x))}(${churchA}, ${churchB})`,
        info: `Load the system multiplication abstraction template defined as <span class="lambda-calculus-emphasis">λρσx.ρ(σ(x))</span>, pairing parameters against the input expressions.`
      },
      {
        expr: `λx.${churchA}({${churchB}}(x))`,
        info: `Substitute the respective inputs directly across internal bindings, binding target placeholder <span class="lambda-calculus-emphasis">ρ</span> with the value of element 1, and target <span class="lambda-calculus-emphasis">σ</span> with element 2.`
      },
      {
        expr: `λx.{${getChurchStr(a, 'a', 'b')}}(λd.${nestedFunc('x', 'd', b)})`,
        info: `Expand out intermediate internal application bounds <span class="lambda-calculus-emphasis">{${churchB}}(x)</span> by linking running coordinate tracking variable 'x' directly onto variable slot 'c', outputting a scoped framework managing <span class="lambda-calculus-emphasis">${b}</span> functional steps.`
      },
      {
        expr: `λx.${outerSubstitutedBody}`,
        info: `Map this newly evaluated intermediate block structural abstraction directly back over the principal parameter placeholder variable 'a' nested inside the initial formula.`
      },
      {
        expr: `λx.${step5Body}`,
        info: `Reduce terms systematically down the stack by substituting the structural variable parameter component 'b' in place of tracking variable 'd' throughout the internal formula scope.`
      },
      {
        expr: `λxb.${finalBody} <span class="lambda-calculus-abbr">→</span> ${resultNum}`,
        info: `Evaluate out trailing substitutions to compound execution depths. The loops scale and square cleanly, leaving exactly <span class="lambda-calculus-emphasis">${resultNum}</span> stacked evaluations of parameter 'x' driving down to baseline variable terminal point 'b', completing conversion to notation <span class="lambda-calculus-emphasis">${resultNum}</span>.`
      }
    ];
  }

  function buildPowSteps(a, b) {
    const churchA = getChurchStr(a, 'a', 'b');
    const churchB = getChurchStr(b, 'c', 'd');
    const resultNum = Math.pow(a, b);
    
    const step2Expr = `λx.(${churchB})(${churchA})(x)`;
    
    const finalBody = nestedFunc('x', 'b', resultNum);

    return [
      {
        expr: `{λρσx.σ(ρ)(x)}(${churchA}, ${churchB})`,
        info: `Load the exponentiation abstraction template defined as <span class="lambda-calculus-emphasis">λρσx.σ(ρ)(x)</span>, where <span class="lambda-calculus-emphasis">ρ</span> is the base and <span class="lambda-calculus-emphasis">σ</span> is the exponent.`
      },
      {
        expr: `λx.({${churchB}}({${churchA}}))(x)`,
        info: `Substitute the base expression into <span class="lambda-calculus-emphasis">ρ</span> and the exponent expression into <span class="lambda-calculus-emphasis">σ</span>.`
      },
      {
        expr: `λx.({${getChurchStr(b, `(${churchA})`, 'x')}})`,
        info: `Evaluate the exponent layer. Church numeral <span class="lambda-calculus-emphasis">${b}</span> applies its argument (the base <span class="lambda-calculus-emphasis">${a}</span>) to itself <span class="lambda-calculus-emphasis">${b}</span> times.`
      },
      {
        expr: `λxb.${finalBody} <span class="lambda-calculus-abbr">→</span> ${resultNum}`,
        info: `Completely unroll the exponential combinations. The base functional nesting multiplies exponentially across the dimensions, resolving perfectly down to <span class="lambda-calculus-emphasis">${resultNum}</span> total applications of 'x' onto terminal point 'b'.`
      }
    ];
  }

  function calculateTrace() {
    const operation = getElement('lambda-calculus-operation');
    const valA = getElement('lambda-calculus-val-a');
    const valB = getElement('lambda-calculus-val-b');
    const output = getElement('lambda-calculus-steps-output');
    const card = getElement('lambda-calculus-result-card');
    const title = getElement('lambda-calculus-trace-title');

    if (!operation || !valA || !valB || !output || !card || !title) return;

    const a = clampNumber(valA.value);
    const b = clampNumber(valB.value);
    let steps = [];

    output.innerHTML = '';
    card.classList.add('is-visible');

    if (operation.value === 'succ') {
      title.textContent = `Derivation Trace: succ(${a})`;
      steps = buildSuccSteps(a);
    } else if (operation.value === 'add') {
      title.textContent = `Derivation Trace: ${a} + ${b}`;
      steps = buildAddSteps(a, b);
    } else if (operation.value === 'mul') {
      title.textContent = `Derivation Trace: ${a} * ${b}`;
      steps = buildMulSteps(a, b);
    } else {
      title.textContent = `Derivation Trace: ${a} ^ ${b}`;
      steps = buildPowSteps(a, b);
    }

    steps.forEach(function (step, index) {
      renderStep(output, index, step);
    });
  }

  function init() {
    const operation = getElement('lambda-calculus-operation');
    const button = getElement('lambda-calculus-generate-btn');

    if (operation) operation.addEventListener('change', updateUI);
    if (button) button.addEventListener('click', calculateTrace);

    updateUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
