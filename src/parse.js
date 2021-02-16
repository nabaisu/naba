import AST from "./ast";
import ASTCompiler from "./astcompiler";
import Lexer from "./lexer";

class Parser {
    constructor(lexer){
        this.lexer = lexer;
        this.ast = new AST(this.lexer);
        this.astCompiler = new ASTCompiler(this.ast)
    }

    parse(text){
        return this.astCompiler.compile(text);
    }
}

function parse(expr) {
    var lexer = new Lexer();
    var parser = new Parser(lexer);
    return parser.parse(expr);
}

export default parse;