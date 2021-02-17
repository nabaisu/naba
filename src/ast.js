export default class AST {
    constructor(lexer) {
        this.lexer = lexer;
        AST.Literal = 'Literal';
        AST.Program = 'Program';
        AST.ArrayExpression = 'ArrayExpression';
        AST.ObjectExpression = 'ObjectExpression';
        AST.MemberExpression = 'MemberExpression';
        AST.Property = 'Property';
        AST.Identifier = 'Identifier';
        AST.ThisExpression = 'ThisExpression';
        AST.LocalsExpression = 'LocalsExpression';
        AST.CallExpression = 'CallExpression';
        AST.AssignmentExpression = 'AssignmentExpression';
        AST.UnaryExpression = 'UnaryExpression';
        AST.BinaryExpression = 'BinaryExpression';
        AST.LogicalExpression = 'LogicalExpression';
        AST.ConditionalExpression = 'ConditionalExpression';
        AST.constants = {
            'null': { type: AST.Literal, value: null },
            'true': { type: AST.Literal, value: true },
            'false': { type: AST.Literal, value: false },
            'this': { type: AST.ThisExpression },
            'çlocals': { type: AST.LocalsExpression }
        };
    }

    // from: {value: 42, text: '42'}
    // to:   {type: AST.Program, body: {type: AST.Literal, value: 42}}
    ast(text) {
        this.tokens = this.lexer.lex(text);
        console.log('result of lexer:', this.tokens);
        return this.program();

    }
    program() {
        var body = [];
        while (true) {
            if (this.tokens.length) {
                body.push(this.filter());
            }
            if (!this.expect(';')) {
                return { type: AST.Program, body: body }
            }
        }

    }

    filter() {
        var left = this.assignment();
        while (this.expect('íí')) { // it will consume always 2 as the callee will be one identifier (consumes the one on the right)
            var args = [left]
            left = {
                type: AST.CallExpression,
                callee: this.identifier(),
                arguments: args,
                filter: true
            }
            while (this.expect(':')) {
                args.push(this.assignment());
            }
        }
        return left
    }

    assignment() {
        var left = this.ternary();
        if (this.expect('=')) {
            var right = this.ternary();
            return { type: AST.AssignmentExpression, left: left, right: right }
        }
        return left
    }


    ternary() {
        var test = this.logicalOR();
        if (this.expect('?')) {
            var consequent = this.assignment();
            if (this.consume(':')) {
                var alternate = this.assignment();
                return {
                    type: AST.ConditionalExpression,
                    test: test,
                    consequent: consequent,
                    alternate: alternate
                }
            }
        }
        return test;
    }

    logicalOR() {
        var left = this.logicalAND();
        var token;
        while ((token = this.expect('||'))) {
            left = {
                type: AST.LogicalExpression,
                left: left,
                operator: token.text,
                right: this.logicalAND()
            }
        }
        return left;
    }

    logicalAND() {
        var left = this.equality();
        var token;
        while ((token = this.expect('&&'))) {
            left = {
                type: AST.LogicalExpression,
                left: left,
                operator: token.text,
                right: this.equality()
            }
        }
        return left;
    }

    equality() {
        var left = this.relational();
        var token;
        while ((token = this.expect('==', '!=', '===', '!=='))) {
            left = {
                type: AST.BinaryExpression,
                left: left,
                operator: token.text,
                right: this.relational()
            }
        }
        return left;
    }

    relational() {
        var left = this.additive();
        var token;
        while ((token = this.expect('<', '<=', '>', '>='))) {
            left = {
                type: AST.BinaryExpression,
                left: left,
                operator: token.text,
                right: this.additive()
            }
        }
        return left;
    }

    additive() {
        var left = this.multiplicative();
        var token;
        while ((token = this.expect('+')) || (token = this.expect('-'))) {
            left = {
                type: AST.BinaryExpression,
                left: left,
                operator: token.text,
                right: this.multiplicative()
            }
        }
        return left;
    }

    multiplicative() {
        var left = this.unary();
        var token;
        while ((token = this.expect('*', '/', '%'))) {
            left = {
                type: AST.BinaryExpression,
                left: left,
                operator: token.text,
                right: this.unary()
            }
        }
        return left;
    }

    unary() {
        var token;
        if ((token = this.expect('+', '!', '-', '*'))) {
            return {
                type: AST.UnaryExpression,
                operator: token.text,
                argument: this.unary()
            }
        } else {
            return this.primary()
        }
    }

    primary() {
        var primary;
        if (this.expect('(')) {
            primary = this.filter();
            this.consume(')');
        } else if (this.expect('[')) {
            primary = this.arrayDeclaration();
        } else if (this.expect('{')) {
            primary = this.object();
        } else if (AST.constants.hasOwnProperty(this.tokens[0].text)) {
            primary = AST.constants[this.consume().text];
        } else if (this.peek().identifier) {
            primary = this.identifier();
        } else {
            primary = this.constant();
        }
        var next;
        while ((next = this.expect('.', '[', '('))) {
            if (next.text === '[') {
                primary = {
                    type: AST.MemberExpression,
                    object: primary,
                    property: this.primary(),
                    computed: true
                }
                this.consume(']');
            } else if (next.text === '.') {
                primary = {
                    type: AST.MemberExpression,
                    object: primary,
                    property: this.identifier(),
                    computed: false
                }
            } else if (next.text === '(') {
                primary = {
                    type: AST.CallExpression,
                    callee: primary,
                    arguments: this.parseArguments()
                }
                this.consume(')');

            }

        }

        return primary
    }

    expect(e1, e2, e3, e4) {
        var token = this.peek(e1, e2, e3, e4);
        if (token) {
            return this.tokens.shift();
        }
    }

    peek(e1, e2, e3, e4) {
        if (this.tokens.length > 0) {
            var text = this.tokens[0].text;
            if (text === e1 || text === e2 || text === e3 || text === e4 ||
                (!e1 && !e2 && !e3 && !e4)) {
                return this.tokens[0];
            }
        }
    }

    arrayDeclaration() {
        var elements = []
        if (!this.peek(']')) {
            do {
                if (this.peek(']')) {
                    break;
                }
                elements.push(this.assignment())
            } while (this.expect(","))
        }
        console.log(elements);
        this.consume(']');
        return { type: AST.ArrayExpression, elements: elements }
    }

    object() {
        var properties = [];
        if (!this.peek('}')) {
            do {
                var property = { type: AST.Property };
                if (this.peek().identifier) {
                    property.key = this.identifier();
                } else {
                    property.key = this.constant();
                }
                this.consume(':');
                property.value = this.assignment();
                properties.push(property);
            } while (this.expect(","))
        }

        this.consume('}');
        return { type: AST.ObjectExpression, properties: properties }
    }

    constant() {
        return { type: AST.Literal, value: this.consume().value }
    }

    identifier() {
        return { type: AST.Identifier, name: this.consume().text }
    }

    consume(e) {
        var token = this.expect(e);
        if (!token) {
            throw `Unexpected. Expecting: ${e}`
        }
        return token;
    }

    parseArguments() {
        var args = []
        if (!this.peek(')')) {
            do {
                args.push(this.assignment())
            } while (this.expect(","))
        }
        return args
    }
}