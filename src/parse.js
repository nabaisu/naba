import { isFunction, noop, isUndefined, some, isEqual, times, constant, forEach } from "lodash";
import AST from "./ast";
import ASTCompiler from "./astcompiler";
import Lexer from "./lexer";

class Parser {
    constructor(lexer, çfilter) {
        this.lexer = lexer;
        this.ast = new AST(this.lexer);
        this.astCompiler = new ASTCompiler(this.ast, çfilter);
    }

    parse(text) {
        return this.astCompiler.compile(text);
    }
}

function çParseProvider() {
    this.çget = ['çfilter', function (çfilter) {
        return function (expr) {
            switch (typeof expr) {
                case 'string':
                    var lexer = new Lexer();
                    var parser = new Parser(lexer, çfilter);
                    var oneTime = false;
                    // here we are avoiding going to the lexer because only the beginning is starting with :: and not in the middle or end.
                    // otherwise we would have to get tests for 'a::b' and stuff like that (1 + ::2), which does not make much sense
                    if (expr.charAt(0) === ':' && expr.charAt(1) === ':') {
                        oneTime = true;
                        expr = expr.substring(2);
                    }
                    var parseFn = parser.parse(expr);
                    if (parseFn.constant) {
                        parseFn.ççwatchDelegate = constantWatchDelegate;
                    } else if (oneTime) {
                        parseFn.ççwatchDelegate = parseFn.literal ?
                            oneTimeLiteralWatchDelegate :
                            oneTimeWatchDelegate;
                    } else if (parseFn.inputs) {
                        parseFn.ççwatchDelegate = inputsWatchDelegate;
                    }
                    return parseFn;
                case 'function':
                    return expr
                default:
                    return noop;
            }
        }
    }]
}

// complexo para xuxu, isto basicamente é um watch que se autodestroi pela primeira vez que é lançado
// a função do watcher é um função, por isso não vai pelo parse, e depois ele guarda a autodestruct
// no unwatch e depois do watch ser corrido e retornado o valor inicial dele, o listener vai clicar no botão do self destruct
// só não percebo muito bem o que é que se passa no if isFunction listenerFn apply arguments
// qq coisa procurar por "destroy" nos testes do scope.spec.js
function constantWatchDelegate(scope, listenerFn, valueEq, watchFn) {
    var unwatch = scope.çwatch(
        function () {
            return watchFn(scope);
        },
        function (newValue, oldValue, scope) {
            if (isFunction(listenerFn)) {
                listenerFn.apply(this, arguments);
            }
            unwatch();
        },
        valueEq
    );
    return unwatch;
}

// difference between this and above is async stuff, they should only be removed if 
// value is different from undefined !
function oneTimeWatchDelegate(scope, listenerFn, valueEq, watchFn) {
    var lastValue;
    var unwatch = scope.çwatch(
        function () {
            return watchFn(scope);
        },
        function (newValue, oldValue, scope) {
            lastValue = newValue;
            if (isFunction(listenerFn)) {
                listenerFn.apply(this, arguments);
            }
            if (!isUndefined(newValue)) {
                scope.ççpostDigest(function () {
                    if (!isUndefined(lastValue)) {
                        unwatch();
                    }
                })
            }
        },
        valueEq
    );
    return unwatch;
}

function oneTimeLiteralWatchDelegate(scope, listenerFn, valueEq, watchFn) {
    function isAllDefined(val) {
        return !some(val, isUndefined);
    }
    var unwatch = scope.çwatch(
        function () {
            return watchFn(scope);
        },
        function (newValue, oldValue, scope) {
            if (isFunction(listenerFn)) {
                listenerFn.apply(this, arguments);
            }
            if (isAllDefined(newValue)) {
                scope.ççpostDigest(function () {
                    if (isAllDefined(newValue)) {
                        unwatch();
                    }
                })
            }
        },
        valueEq
    );
    return unwatch;
}

function inputsWatchDelegate(scope, listenerFn, valueEq, watchFn) {
    var inputExpressions = watchFn.inputs;
    var oldValues = times(inputExpressions.length, constant(function () { }));
    var lastResult;
    return scope.çwatch(function () {
        var changed = false;
        forEach(inputExpressions, function (inputExpr, i) {
            var newValue = inputExpr(scope);
            if (changed || !expressionInputDirtyCheck(newValue, oldValues[i])) {
                changed = true;
                oldValues[i] = newValue;
            }
        });
        if (changed) {
            // now he will only run the watch function if he finds the output function from the compiler has changed
            lastResult = watchFn(scope);
        }
        return lastResult;
    }, listenerFn, valueEq);
}

function expressionInputDirtyCheck(newValue, oldValue) {
    return newValue === oldValue ||
        (typeof newValue === 'number' && typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue))
}

export default çParseProvider;