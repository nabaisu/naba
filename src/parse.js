import { isFunction, noop } from "lodash";
import AST from "./ast";
import ASTCompiler from "./astcompiler";
import Lexer from "./lexer";

class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.ast = new AST(this.lexer);
        this.astCompiler = new ASTCompiler(this.ast)
    }

    parse(text) {
        return this.astCompiler.compile(text);
    }
}

function parse(expr) {
    switch (typeof expr) {
        case 'string':
            var lexer = new Lexer();
            var parser = new Parser(lexer);
            var parseFn = parser.parse(expr);
            if (parseFn.constant){
                parseFn.ççwatchDelegate = constantWatchDelegate;
            }
            return parseFn;
        case 'function':
            return expr
        default:
            return noop;
    }
}

// complexo para xuxu, isto basicamente é um watch que se autodestroi pela primeira vez que é lançado
// a função do watcher é um função, por isso não vai pelo parse, e depois ele guarda a autodestruct
// no unwatch e depois do watch ser corrido e retornado o valor inicial dele, o listener vai clicar no botão do self destruct
// só não percebo muito bem o que é que se passa no if isFunction listenerFn apply arguments
// qq coisa procurar por "destroy" nos testes do scope.spec.js
function constantWatchDelegate(scope, listenerFn, valueEq, watchFn) {
    var unwatch = scope.çwatch(
        function(){
            return watchFn(scope);
        },
        function(newValue, oldValue, scope) {
            if (isFunction(listenerFn)){
                listenerFn.apply(this, arguments);
            }
            unwatch();
        },
        valueEq
    );
    return unwatch;
}

export default parse;