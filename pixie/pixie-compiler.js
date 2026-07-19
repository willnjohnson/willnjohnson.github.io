/* ============================================================
   PIXIE COMPILER  (Lexer → Parser → Code Generator)
   Translates Pixie source code into executable JavaScript.
============================================================ */

/* PHASE 1: LEXER */
class Lexer {
    constructor(input) {
        this.input  = input;
        this.pos    = 0;
        this.tokens = [];
    }

    tokenize() {
        while (this.pos < this.input.length) {
            const char = this.input[this.pos];

            // Whitespace (not newlines)
            if (/[ \t\r]/.test(char))  { this.pos++; continue; }

            // Newlines are significant statement terminators
            if (char === '\n') { this.tokens.push({ type: 'NEWLINE' }); this.pos++; continue; }

            // Line comments
            if (this.input.startsWith('//', this.pos)) {
                while (this.pos < this.input.length && this.input[this.pos] !== '\n') this.pos++;
                continue;
            }

            // Identifiers / keywords
            if (/[a-zA-Z_]/.test(char)) {
                let val = '';
                while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos]))
                    val += this.input[this.pos++];
                this.tokens.push({ type: 'ID', value: val });
                continue;
            }

            // Numbers (integer or float)
            if (/[0-9]/.test(char)) {
                let val = '';
                while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos]))
                    val += this.input[this.pos++];
                this.tokens.push({ type: 'NUM', value: parseFloat(val) });
                continue;
            }

            // String literals
            if (char === '"') {
                let val = ''; this.pos++;
                while (this.pos < this.input.length && this.input[this.pos] !== '"')
                    val += this.input[this.pos++];
                this.pos++;
                this.tokens.push({ type: 'STR', value: val });
                continue;
            }

            // Operators (may be two-char)
            if ('=<>!+-*/'.includes(char)) {
                const next = this.input[this.pos + 1];
                if ('=<>!'.includes(char) && next === '=') {
                    this.tokens.push({ type: 'OP', value: char + '=' }); this.pos += 2; continue;
                }
                this.tokens.push({ type: 'OP', value: char }); this.pos++; continue;
            }

            // Punctuation
            if ('():[].'.includes(char)) {
                this.tokens.push({ type: 'PUNCT', value: char }); this.pos++; continue;
            }

            this.pos++; // Skip unrecognised characters
        }

        this.tokens.push({ type: 'EOF' });
        return this.tokens;
    }
}

/* PHASE 2: PARSER */
class Parser {
    constructor(tokens) { this.tokens = tokens; this.pos = 0; }

    peek()                    { return this.tokens[this.pos]; }
    consume()                 { return this.tokens[this.pos++]; }
    match(type, value)        {
        const t = this.peek();
        if (t.type === type && (value === undefined || t.value === value)) return this.consume();
        return null;
    }
    expect(type, value)       {
        const t = this.match(type, value);
        if (!t) throw new Error(
            `Syntax Error: Expected ${value || type} but got "${this.peek().value || this.peek().type}"`
        );
        return t;
    }
    skipNewlines()            { while (this.match('NEWLINE')); }

    /* Top-level */
    parse() {
        const ast = { type: 'Program', body: [] };
        while (this.peek().type !== 'EOF') {
            this.skipNewlines();
            if (this.peek().type === 'EOF') break;
            ast.body.push(this.parseStatement());
        }
        return ast;
    }

    parseStatement() {
        const t = this.peek();

        if (t.type === 'ID') {
            switch (t.value) {
                case 'GRID': {
                    this.consume();
                    return { type: 'Grid', w: this.parseExpr(), h: this.parseExpr() };
                }
                case 'VAR': {
                    this.consume();
                    const id = this.expect('ID').value;
                    this.expect('OP', '=');
                    return { type: 'Var', id, init: this.parseExpr() };
                }
                case 'UPDATE': {
                    this.consume(); this.expect('PUNCT', ':');
                    return { type: 'Update', body: this.parseBlock() };
                }
                case 'IF': {
                    this.consume();
                    const cond = this.parseExpr();
                    this.expect('PUNCT', ':');
                    return { type: 'If', cond, body: this.parseBlock() };
                }
                case 'FOR_EACH': {
                    this.consume();
                    const iter = this.expect('ID').value;
                    this.expect('ID', 'IN');
                    const arr  = this.parseExpr();
                    this.expect('PUNCT', ':');
                    return { type: 'ForEach', iter, array: arr, body: this.parseBlock() };
                }
                case 'FOR': {
                    this.consume();
                    const fid    = this.expect('ID').value;
                    this.expect('ID', 'FROM');
                    const start  = this.parseExpr();
                    const dirTok = this.consume();
                    if (dirTok.type !== 'ID' || (dirTok.value !== 'TO' && dirTok.value !== 'DOWNTO'))
                        throw new Error(`Expected TO or DOWNTO, got "${dirTok.value || dirTok.type}"`);
                    const end = this.parseExpr();
                    this.expect('PUNCT', ':');
                    return { type: 'For', id: fid, start, end, dir: dirTok.value, body: this.parseBlock() };
                }
                case 'COLOR': case 'BOX': case 'CIRCLE': case 'LINE':
                case 'CLEAR': case 'FONT_SIZE': case 'ARR_PUSH':
                case 'ARR_UNSHIFT': case 'ARR_POP': {
                    const cmd   = this.consume().value;
                    const cargs = [];
                    while (this.peek().type !== 'NEWLINE' && this.peek().type !== 'EOF')
                        cargs.push(this.parseExpr());
                    return { type: 'Command', name: cmd, args: cargs };
                }
                case 'TEXT': {
                    this.consume();
                    const textExpr = this.parseExpr();
                    this.expect('ID', 'AT');
                    const tx = this.parseExpr();
                    const ty = this.parseExpr();
                    return { type: 'Command', name: 'TEXT', args: [textExpr, tx, ty] };
                }
                case 'TEXT_CENTER': {
                    this.consume();
                    const textExpr = this.parseExpr();
                    this.expect('ID', 'AT');
                    const cx = this.parseExpr();
                    const cy = this.parseExpr();
                    return { type: 'Command', name: 'TEXT_CENTER', args: [textExpr, cx, cy] };
                }
            }
        }

        // Assignment or expression statement
        const left = this.parseExpr();
        if (this.match('OP', '=')) return { type: 'Assign', left, right: this.parseExpr() };
        return { type: 'ExprStmt', expr: left };
    }

    parseBlock() {
        const body = [];
        while (this.peek().type !== 'EOF') {
            this.skipNewlines();
            if (this.match('ID', 'END')) break;
            body.push(this.parseStatement());
        }
        return body;
    }

    /* Expression parsing (Pratt / precedence climbing) */
    parseExpr() { return this.parseBinary(0); }

    parseBinary(prec) {
        const PREC = { '==': 1, '!=': 1, '<': 2, '>': 2, '<=': 2, '>=': 2, '+': 3, '-': 3, '*': 4, '/': 4 };
        let left = this.parsePrimary();
        while (this.peek().type === 'OP' && PREC[this.peek().value] >= prec) {
            const op    = this.consume().value;
            const right = this.parseBinary(PREC[op] + 1);
            left = { type: 'Binary', op, left, right };
        }
        return left;
    }

    parsePrimary() {
        if (this.match('OP', '-')) return { type: 'Unary', op: '-', arg: this.parsePrimary() };

        const t = this.consume();
        if (t.type === 'NUM' || t.type === 'STR') return { type: 'Literal', value: t.value };

        if (t.type === 'ID') {
            let node = { type: 'Identifier', name: t.value };

            // Special single-keyword builtins
            if (node.name === 'BTN')
                return { type: 'Call', callee: 'BTN', args: [{ type: 'Literal', value: this.expect('ID').value }] };
            if (node.name === 'BTN_RELEASED')
                return { type: 'Call', callee: 'BTN_RELEASED', args: [{ type: 'Literal', value: this.expect('ID').value }] };
            if (node.name === 'ARRAY')
                return { type: 'ArrayInit' };

            // POINT(x y) — space-separated to avoid conflict with unary minus
            if (node.name === 'POINT' && this.match('PUNCT', '(')) {
                const args = [];
                while (!this.match('PUNCT', ')')) {
                    const neg = this.match('OP', '-');
                    const arg = this.parsePrimary();
                    args.push(neg ? { type: 'Unary', op: '-', arg } : arg);
                }
                return { type: 'Call', callee: 'POINT', args };
            }

            // Standard comma-separated function calls
            if (this.match('PUNCT', '(')) {
                const args = [];
                while (!this.match('PUNCT', ')')) {
                    if (this.match('PUNCT', ',')) continue;
                    args.push(this.parseExpr());
                }
                node = { type: 'Call', callee: node.name, args };
            }

            // Array indexing / property access chains
            while (true) {
                if (this.match('PUNCT', '[')) {
                    const idx = this.parseExpr();
                    this.expect('PUNCT', ']');
                    node = { type: 'Member', object: node, property: idx, computed: true };
                } else if (this.match('PUNCT', '.')) {
                    const prop = this.expect('ID').value;
                    node = { type: 'Member', object: node, property: { type: 'Identifier', name: prop }, computed: false };
                } else {
                    break;
                }
            }
            return node;
        }

        if (t.type === 'PUNCT' && t.value === '(') {
            const expr = this.parseExpr();
            this.expect('PUNCT', ')');
            return expr;
        }

        throw new Error(`Unexpected token: ${t.type} "${t.value}"`);
    }
}

/* PHASE 3: CODE GENERATOR */
class Generator {
    static genBlock(nodes) {
        return nodes.map(n => {
            const code = Generator.generate(n);
            return code.endsWith('}') ? code : code + ';';
        }).join('\n');
    }

    static generate(node) {
        switch (node.type) {
            case 'Program':  return Generator.genBlock(node.body);
            case 'Grid':     return `_initGrid(${Generator.generate(node.w)}, ${Generator.generate(node.h)})`;
            case 'Var':      return `let ${node.id} = ${Generator.generate(node.init)}`;
            case 'Update':   return `function _update() {\n${Generator.genBlock(node.body)}\n}`;
            case 'If':       return `if (${Generator.generate(node.cond)}) {\n${Generator.genBlock(node.body)}\n}`;
            case 'ForEach': {
                const arr = Generator.generate(node.array);
                return `for (let _i = 0; _i < ${arr}.length; _i++) {\nlet ${node.iter} = ${arr}[_i];\n${Generator.genBlock(node.body)}\n}`;
            }
            case 'For': {
                const op  = node.dir === 'TO' ? '<=' : '>=';
                const inc = node.dir === 'TO' ? '++'  : '--';
                return `for (let ${node.id} = ${Generator.generate(node.start)}; ${node.id} ${op} ${Generator.generate(node.end)}; ${node.id}${inc}) {\n${Generator.genBlock(node.body)}\n}`;
            }
            case 'Command': {
                switch (node.name) {
                    case 'COLOR':       return `color(${node.args.map(Generator.generate).join(', ')})`;
                    case 'BOX':         return `box(${node.args.map(Generator.generate).join(', ')})`;
                    case 'CIRCLE':      return `circle(${node.args.map(Generator.generate).join(', ')})`;
                    case 'LINE':        return `line(${node.args.map(Generator.generate).join(', ')})`;
                    case 'CLEAR':       return `clear()`;
                    case 'FONT_SIZE':   return `ctx.font = ${Generator.generate(node.args[0])} + "px monospace"`;
                    case 'TEXT':        return `drawText(${node.args.map(Generator.generate).join(', ')})`;
                    case 'TEXT_CENTER': return `drawTextCentered(${node.args.map(Generator.generate).join(', ')})`;
                    case 'ARR_PUSH':    return `${Generator.generate(node.args[0])}.push(${Generator.generate(node.args[1])})`;
                    case 'ARR_UNSHIFT': return `${Generator.generate(node.args[0])}.unshift(${Generator.generate(node.args[1])})`;
                    case 'ARR_POP':     return `${Generator.generate(node.args[0])}.pop()`;
                }
                return '';
            }
            case 'Assign':   return `${Generator.generate(node.left)} = ${Generator.generate(node.right)}`;
            case 'ExprStmt': return Generator.generate(node.expr);
            case 'Binary':   return `(${Generator.generate(node.left)} ${node.op} ${Generator.generate(node.right)})`;
            case 'Unary':    return `${node.op}${Generator.generate(node.arg)}`;
            case 'Identifier': return node.name;
            case 'Literal':  return typeof node.value === 'string' ? `"${node.value}"` : String(node.value);
            case 'ArrayInit': return `[]`;
            case 'Call': {
                switch (node.callee) {
                    case 'BTN':          return `btn(${Generator.generate(node.args[0])})`;
                    case 'BTN_RELEASED': return `btnReleased(${Generator.generate(node.args[0])})`;
                    case 'NEW_ARRAY': return `new Array(${Generator.generate(node.args[0])}).fill(0)`;
                    case 'POINT':     return `{x: ${Generator.generate(node.args[0])}, y: ${Generator.generate(node.args[1])}}`;
                    case 'LEN':       return `${Generator.generate(node.args[0])}.length`;
                    case 'RANDOM':    return `random(${Generator.generate(node.args[0])})`;
                    case 'MAX':       return `Math.max(${node.args.map(Generator.generate).join(', ')})`;
                    case 'MIN':       return `Math.min(${node.args.map(Generator.generate).join(', ')})`;
                    case 'ABS':       return `Math.abs(${Generator.generate(node.args[0])})`;
                    case 'FLOOR':     return `Math.floor(${Generator.generate(node.args[0])})`;
                    case 'CEIL':      return `Math.ceil(${Generator.generate(node.args[0])})`;
                }
                return `${node.callee}(${node.args.map(Generator.generate).join(', ')})`;
            }
            case 'Member': {
                const obj = Generator.generate(node.object);
                return node.computed
                    ? `${obj}[${Generator.generate(node.property)}]`
                    : `${obj}.${node.property.name}`;
            }
        }
        return '';
    }
}

/* PUBLIC COMPILE FUNCTION */
function pixieCompile(source) {
    const tokens  = new Lexer(source).tokenize();
    const ast     = new Parser(tokens).parse();
    return Generator.generate(ast);
}
