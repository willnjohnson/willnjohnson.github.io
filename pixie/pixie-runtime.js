/* ============================================================
   PIXIE RUNTIME
   Canvas setup, input handling, and drawing primitives.
   Injected into the iframe sandbox at game execution time.
============================================================ */

let canvas, ctx;
let GRID_W = 64, GRID_H = 64;

let keys             = {};
let keysPressed      = {};
let keysReleased     = {};
let _pendingPressed  = {};
let _pendingReleased = {};

function _initGrid(w, h) {
    GRID_W = w; GRID_H = h;
    canvas = document.createElement('canvas');
    ctx    = canvas.getContext('2d');
    canvas.width  = w;
    canvas.height = h;
    canvas.style.width          = '100vmin';
    canvas.style.height         = '100vmin';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.display        = 'block';
    canvas.style.margin         = 'auto';
    ctx.imageSmoothingEnabled   = false;
    document.body.style.margin  = '0';
    document.body.appendChild(canvas);

    window.addEventListener('keydown', e => {
        const k = e.key.toUpperCase();
        if (!keys[k]) _pendingPressed[k] = true;
        keys[k] = true;
        e.preventDefault();
    });
    window.addEventListener('keyup', e => {
        const k = e.key.toUpperCase();
        keys[k]            = false;
        _pendingReleased[k] = true;
    });
}

// Called once per frame by the game loop, BEFORE _update(). Moves
// whatever accumulated in the pending buffers since the last frame
// into the live maps _update() reads, then clears pending so the
// next accumulation window starts fresh. This is the only place
// keysPressed/keysReleased are ever written after init.
function _pollInput() {
    keysPressed      = _pendingPressed;
    keysReleased     = _pendingReleased;
    _pendingPressed  = {};
    _pendingReleased = {};
}

/* Drawing */
function clear()              { ctx.clearRect(0, 0, GRID_W, GRID_H); }
function color(r, g, b, a)   {
    a = (a !== undefined) ? a : 1;
    const c = `rgba(${r},${g},${b},${a})`;
    ctx.fillStyle   = c;
    ctx.strokeStyle = c;
}
function box(x, y, w, h)     { ctx.fillRect(x, y, w, h); }
function circle(x, y, r)     { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function line(x1, y1, x2, y2){ ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function drawText(txt, x, y) { ctx.textBaseline = 'top'; ctx.fillText(String(txt), x, y); }
function drawTextCentered(txt, cx, y) {
    ctx.textBaseline = 'top';
    const s = String(txt);
    const w = ctx.measureText(s).width;
    ctx.fillText(s, cx - w / 2, y);
}

/* Input
   BTN      = fires on keydown (one-shot)
   BTN_UP   = fires on keyrelease (one-shot) — use for lateral move & rotate
   BTN_HELD = true while key is physically held down
*/
function btn(k) {
    if (k === 'ANY')   return Object.values(keysPressed).some(Boolean);
    if (k === 'UP')    return !!keysPressed['ARROWUP']    || !!keysPressed['W'];
    if (k === 'DOWN')  return !!keysPressed['ARROWDOWN']  || !!keysPressed['S'];
    if (k === 'LEFT')  return !!keysPressed['ARROWLEFT']  || !!keysPressed['A'];
    if (k === 'RIGHT') return !!keysPressed['ARROWRIGHT'] || !!keysPressed['D'];
    if (k === 'SPACE') return !!keysPressed[' '];
    return !!keysPressed[k];
}

function btnReleased(k) {
    if (k === 'ANY')   return Object.values(keysReleased).some(Boolean);
    if (k === 'UP')    return !!keysReleased['ARROWUP']    || !!keysReleased['W'];
    if (k === 'DOWN')  return !!keysReleased['ARROWDOWN']  || !!keysReleased['S'];
    if (k === 'LEFT')  return !!keysReleased['ARROWLEFT']  || !!keysReleased['A'];
    if (k === 'RIGHT') return !!keysReleased['ARROWRIGHT'] || !!keysReleased['D'];
    if (k === 'SPACE') return !!keysReleased[' '];
    return !!keysReleased[k];
}

/* Math helpers */
function random(max) { return Math.floor(Math.random() * max); }