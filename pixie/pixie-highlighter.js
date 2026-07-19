/* ============================================================
   PIXIE SYNTAX HIGHLIGHTER
   Renders Pixie source as HTML spans colored per Monokai Soda
   (Dark). Pure regex/token-scan — independent of the compiler's
   Lexer so editor highlighting never breaks if the grammar
   changes mid-edit (e.g. unterminated string while typing).
============================================================ */

const PIXIE_KEYWORDS = new Set([
    'GRID', 'VAR', 'UPDATE', 'IF', 'FOR_EACH', 'FOR', 'IN', 'FROM', 'TO',
    'DOWNTO', 'END', 'AT', 'BTN', 'BTN_RELEASED', 'ANY', 'UP', 'DOWN',
    'LEFT', 'RIGHT', 'SPACE'
]);

const PIXIE_COMMANDS = new Set([
    'COLOR', 'BOX', 'CIRCLE', 'LINE', 'CLEAR', 'FONT_SIZE', 'TEXT',
    'TEXT_CENTER', 'ARR_PUSH', 'ARR_UNSHIFT', 'ARR_POP'
]);

const PIXIE_BUILTINS = new Set([
    'ARRAY', 'POINT', 'NEW_ARRAY', 'LEN', 'RANDOM', 'MAX', 'MIN',
    'ABS', 'FLOOR', 'CEIL'
]);

function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/* Tokenize single line of Pixie source into {text, cls} chunks. cls maps to CSS classes defined alongside the Monokai Soda palette. */
function highlightLine(line) {
    const out = [];
    let i = 0;
    const n = line.length;

    while (i < n) {
        const ch = line[i];

        // Comments run to end of line
        if (ch === '/' && line[i + 1] === '/') {
            out.push({ text: line.slice(i), cls: 'tok-comment' });
            break;
        }

        // Whitespace
        if (/\s/.test(ch)) {
            let j = i;
            while (j < n && /\s/.test(line[j])) j++;
            out.push({ text: line.slice(i, j), cls: '' });
            i = j;
            continue;
        }

        // String literals
        if (ch === '"') {
            let j = i + 1;
            while (j < n && line[j] !== '"') j++;
            if (j < n) j++; // include closing quote
            out.push({ text: line.slice(i, j), cls: 'tok-string' });
            i = j;
            continue;
        }

        // Numbers
        if (/[0-9]/.test(ch)) {
            let j = i;
            while (j < n && /[0-9.]/.test(line[j])) j++;
            out.push({ text: line.slice(i, j), cls: 'tok-number' });
            i = j;
            continue;
        }

        // Identifiers / keywords / commands / builtins
        if (/[a-zA-Z_]/.test(ch)) {
            let j = i;
            while (j < n && /[a-zA-Z0-9_]/.test(line[j])) j++;
            const word = line.slice(i, j);
            const upper = word.toUpperCase();

            let cls = 'tok-identifier';
            if (PIXIE_KEYWORDS.has(upper))      cls = 'tok-keyword';
            else if (PIXIE_COMMANDS.has(upper)) cls = 'tok-command';
            else if (PIXIE_BUILTINS.has(upper)) cls = 'tok-builtin';

            out.push({ text: word, cls });
            i = j;
            continue;
        }

        // Operators
        if ('=<>!+-*/'.includes(ch)) {
            let j = i + 1;
            if ('=<>!'.includes(ch) && line[j] === '=') j++;
            out.push({ text: line.slice(i, j), cls: 'tok-operator' });
            i = j;
            continue;
        }

        // Punctuation
        if ('():[].'.includes(ch)) {
            out.push({ text: ch, cls: 'tok-punct' });
            i++;
            continue;
        }

        // Anything else, passthrough
        out.push({ text: ch, cls: '' });
        i++;
    }

    return out;
}

/* Convert full Pixie source into highlighted HTML, one <div> per line so line heights stay perfectly aligned with a synced textarea. */
function highlightPixie(source) {
    const lines = source.split('\n');
    return lines.map(line => {
        if (line.length === 0) return '<div class="hl-line">&nbsp;</div>';
        const chunks = highlightLine(line);
        const html = chunks.map(c => {
            const safe = escapeHtml(c.text);
            return c.cls ? `<span class="${c.cls}">${safe}</span>` : safe;
        }).join('');
        return `<div class="hl-line">${html}</div>`;
    }).join('');
}
