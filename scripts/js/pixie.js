/* ============================================================
   PIXIE EDITOR — site page orchestration layer
   Wires the /apps/pixie page to the compiler, highlighter, and
   runtime that live under /pixie/. The compiler and highlighter
   are loaded as page scripts; the runtime source is fetched once
   and inlined into each sandboxed preview iframe at compile time.
============================================================ */

(function () {
'use strict';

let runtimeSource = null;

async function loadRuntime() {
    const res = await fetch('/pixie/pixie-runtime.js');
    if (!res.ok) throw new Error(`pixie-runtime.js responded ${res.status}`);
    runtimeSource = await res.text();
}

// Game sources (loaded from .pixie files on demand, cached)
const gameCache = {};
const GAME_FILES = {
    snake:  '/pixie/games/snake.pixie',
    tetris: '/pixie/games/tetris.pixie',
};

async function loadGame(name) {
    if (gameCache[name]) return gameCache[name];
    const res = await fetch(GAME_FILES[name]);
    if (!res.ok) throw new Error(`${GAME_FILES[name]} responded ${res.status}`);
    const src = await res.text();
    gameCache[name] = src;
    return src;
}

/* DOM refs */
const editor      = document.getElementById('pixie-code');
const highlightEl = document.getElementById('pixie-highlight');
const preview     = document.getElementById('pixie-preview');
const gameSelect  = document.getElementById('pixie-game-select');
const runBtn      = document.getElementById('pixie-run-btn');
const gutter      = document.getElementById('pixie-gutter');
const statusMsg   = document.getElementById('pixie-status-msg');
const cursorPos   = document.getElementById('pixie-cursor-pos');
const statusbar   = document.getElementById('pixie-statusbar');

/* Line-number gutter sync */
function updateGutter() {
    const lineCount = editor.value.split('\n').length;
    let text = '';
    for (let i = 1; i <= lineCount; i++) text += i + '\n';
    gutter.textContent = text;
    gutter.scrollTop = editor.scrollTop;
}

/* Syntax highlight repaint */
function updateHighlight() {
    highlightEl.innerHTML = highlightPixie(editor.value);
    highlightEl.scrollTop  = editor.scrollTop;
    highlightEl.scrollLeft = editor.scrollLeft;
}

editor.addEventListener('scroll', () => {
    gutter.scrollTop       = editor.scrollTop;
    highlightEl.scrollTop  = editor.scrollTop;
    highlightEl.scrollLeft = editor.scrollLeft;
});
editor.addEventListener('input', () => {
    updateGutter();
    updateHighlight();
});

/* Cursor position */
editor.addEventListener('keyup',   updateCursor);
editor.addEventListener('mouseup', updateCursor);
function updateCursor() {
    const before = editor.value.slice(0, editor.selectionStart);
    const lines  = before.split('\n');
    const ln     = lines.length;
    const col    = lines[ln - 1].length + 1;
    cursorPos.textContent = `Ln ${ln}, Col ${col}`;
}

/* Tab key support */
editor.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const s = editor.selectionStart;
        editor.value = editor.value.slice(0, s) + '    ' + editor.value.slice(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = s + 4;
        updateGutter();
        updateHighlight();
    }
});

/* Compile & preview
   Typing only updates highlighting/gutter — it never recompiles or
   reruns the preview. The preview is frozen until Run is pressed. */
function buildAndPreview() {
    if (!runtimeSource) return;

    statusbar.classList.remove('error');
    statusMsg.textContent = 'Compiling…';

    try {
        const generated = pixieCompile(editor.value);

        const boilerplate = `
if (typeof _setup === 'function') _setup();
(function _loop() {
    _pollInput();
    if (typeof _update === 'function') _update();
    requestAnimationFrame(_loop);
})();
`;

        const html = `<!DOCTYPE html>
<html>
<head>
<style>
body { margin:0; overflow:hidden; background:#111;
       display:flex; justify-content:center; align-items:flex-start; height:100vh; }
/* The runtime sets inline margin:auto on the canvas, which re-centers
   it vertically in flex — override so the game sits at the top. */
canvas { margin: 0 auto !important; }
</style>
</head>
<body>
<script>
${runtimeSource}
<\/script>
<script>
${generated}
${boilerplate}
<\/script>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        preview.src = URL.createObjectURL(blob);
        preview.addEventListener('load', () => preview.focus(), { once: true });

        statusMsg.textContent = 'OK — running.';
    } catch (e) {
        statusMsg.textContent = '⚠ ' + e.message;
        statusbar.classList.add('error');
    }
}

runBtn.addEventListener('click', buildAndPreview);

/* Game switching
   Loads the chosen game's source into the editor so it can be
   read or edited, but does NOT auto-run it — press Run to play. */
gameSelect.addEventListener('change', async (e) => {
    try {
        const src = await loadGame(e.target.value);
        editor.value = src;
        updateGutter();
        updateHighlight();
        statusMsg.textContent = 'Loaded. Press Run to play.';
        statusbar.classList.remove('error');
    } catch (err) {
        statusMsg.textContent = '⚠ Failed to load ' + e.target.value + ': ' + err.message;
        statusbar.classList.add('error');
        console.error('Game switch failed:', err);
    }
});

/* Bootstrap
   Loads Snake's source as a starting point and runs it once so the
   page doesn't greet visitors with a blank pane. */
(async () => {
    try {
        await loadRuntime();
        editor.value = await loadGame('snake');
        updateGutter();
        updateHighlight();
        buildAndPreview();
    } catch (err) {
        statusMsg.textContent = '⚠ Failed to load Pixie files: ' + (err && err.message || err);
        statusbar.classList.add('error');
        console.error('Pixie editor startup failed:', err);
    }
})();

})();
