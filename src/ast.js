export default class AST {
    constructor(lexer){
        this.lexer = lexer;
        AST.Literal = 'Literal';
        AST.Program = 'Program';
        AST.constants = {
            'null': {type: AST.Literal, value: null},
            'true': {type: AST.Literal, value: true},
            'false': {type: AST.Literal, value: false}
        };
    }
    
    // from: {value: 42, text: '42'}
    // to:   {type: AST.Program, body: {type: AST.Literal, value: 42}}
    ast(text){
        this.tokens = this.lexer.lex(text);
        console.log('result of lexer:',this.tokens);
        return this.program();

    }
    program(){
        return {type: AST.Program, body: this.primary()}
    }

    primary(){
        if (AST.constants.hasOwnProperty(this.tokens[0].text)) {
            return AST.constants[this.tokens[0].text];
        } else {
            return this.constant();
        }

    }

    constant(){
        return {type: AST.Literal, value: this.tokens[0].value}
    }
}