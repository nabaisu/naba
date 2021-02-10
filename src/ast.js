import { property } from "lodash";

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
        return { type: AST.Program, body: this.primary() }
    }

    primary() {
        var primary;
        if (this.expect('[')) {
            primary = this.arrayDeclaration();
        } else if (this.expect('{')) {
            primary = this.object();
        } else if (AST.constants.hasOwnProperty(this.tokens[0].text)) {
            primary = AST.constants[this.consume().text];
        } else if (this.peek().identifier){
            primary = this.identifier();
        }else{
            primary = this.constant();
        }
        while (this.expect('.')) {
            primary = {
                type: AST.MemberExpression,
                object: primary,
                property: this.identifier()
            }
        }

        return primary
    }

    expect(e) {
        var token = this.peek(e);
        if (token) {
            return this.tokens.shift();
        }
    }

    peek(e) {
        if (this.tokens.length > 0) {
            var text = this.tokens[0].text;
            if (text === e || !e) {
                return this.tokens[0];
            }
        }
    }

    arrayDeclaration() {
        var elements = []
        if (!this.peek(']')) {
            do {
                if (this.peek(']')) {
                    break;
                }
                elements.push(this.primary())
            } while (this.expect(","))
        }
        console.log(elements);
        this.consume(']');
        return { type: AST.ArrayExpression, elements: elements }
    }

    object(){
        var properties = [];
        if (!this.peek('}')) {
            do {
                var property = {type: AST.Property};
                if (this.peek().identifier) {
                    property.key = this.identifier();
                } else {
                    property.key = this.constant();
                }
                this.consume(':');
                property.value = this.primary();   
                properties.push(property);             
            } while (this.expect(","))
        }

        this.consume('}');
        return { type: AST.ObjectExpression, properties: properties }
    }

    constant() {
        return { type: AST.Literal, value: this.consume().value }
    }

    identifier(){
        return { type: AST.Identifier, name: this.consume().text }
    }

    consume(e) {
        var token = this.expect(e);
        if (!token) {
            throw `Unexpected. Expecting: ${e}`
        }
        return token;
    }
}