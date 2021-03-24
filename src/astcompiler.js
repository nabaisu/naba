import AST from "./ast";
import { isString, isNull, map, bind, forEach, initial, last, isEmpty } from 'lodash'
import { js as beautify } from 'js-beautify' // this is mostly to be able to get the returning function pretty
import { filter } from './filter'

var CALL = Function.prototype.call;
var APPLY = Function.prototype.apply;
var BIND = Function.prototype.bind;
function ensureSafeMemberName(expr) {
    if (expr === 'constructor' || expr === '__proto__' ||
        expr === '__defineGetter__' || expr === '__defineSetter__' ||
        expr === '__lookupGetter__' || expr === '__lookupSetter__') {
        throw 'Attempting to access a disallowed field in Naba expressions!'
    }
}

function ensureSafeObject(obj) {
    if (obj) {
        if (obj.window === obj) {
            throw 'Referencing window in Naba expressions is disallowed!'
        } else if (obj.children &&
            (obj.nodeName ||
                (obj.prop && obj.attr && obj.find))) {
            throw 'Referencing DOM nodes in Naba expressions is disallowed!'
        } else if (obj.constructor === obj) {
            throw 'Referencing Function in Naba expressions is disallowed!'
        } else if (obj === Object) {
            throw 'Referencing Object in Naba expressions is disallowed!'
        }
    }
    return obj
}

function ensureSafeFunction(obj) {
    if (obj) {
        if (obj.constructor === obj) {
            throw 'Referencing Function in Naba expressions is disallowed!'
        } else if (obj === CALL || obj === APPLY || obj === BIND) {
            throw 'Referencing call, apply or bind in Naba expressions is disallowed!'
        }
    }
}

function ifDefined(expr, defaultValue) {
    return (typeof expr === 'undefined') ? defaultValue : expr;
}

function isLiteral(ast) {
    return ast.body.length === 0 ||
        ast.body.length === 1 && (
            ast.body[0].type === AST.Literal ||
            ast.body[0].type === AST.ArrayExpression ||
            ast.body[0].type === AST.ObjectExpression
        )
}

function assignableAST(ast){
    if (ast.body.length === 1 && isAssignable(ast.body[0])) {
        return {
            type: AST.AssignmentExpression,
            left: ast.body[0],
            right: {type: AST.NABValueParameter}
        }
    }
}

function isAssignable(ast){
    return ast.type === AST.Identifier || ast.type === AST.MemberExpression;
}


function markConstantAndWatchExpressions(ast, çfilter) {
    var allConstants;
    var argsToWatch;
    switch (ast.type) {
        case AST.Program:
            allConstants = true;
            forEach(ast.body, function (expr) {
                markConstantAndWatchExpressions(expr, çfilter);
                allConstants = allConstants && expr.constant;
            })
            ast.constant = allConstants;
            break;
        case AST.Literal:
            ast.constant = true;
            ast.toWatch = [];
            break;

        case AST.ArrayExpression:
            allConstants = true;
            argsToWatch = [];
            forEach(ast.elements, function (element) {
                markConstantAndWatchExpressions(element, çfilter);
                allConstants = allConstants && element.constant;
                if (!element.constant) {
                    argsToWatch.push.apply(argsToWatch, element.toWatch);
                }
            })
            ast.constant = allConstants;
            ast.toWatch = argsToWatch;
            break;
        case AST.ObjectExpression:
            console.log(ast);
            allConstants = true;
            argsToWatch = [];
            forEach(ast.properties, function (property) {
                markConstantAndWatchExpressions(property.value, çfilter);
                allConstants = allConstants && property.value.constant;
                if (!property.value.constant) {
                    argsToWatch.push.apply(argsToWatch, property.value.toWatch);
                }
            })
            ast.constant = allConstants;
            ast.toWatch = argsToWatch;
            break;
        case AST.MemberExpression:
            console.log(ast);
            markConstantAndWatchExpressions(ast.object, çfilter);
            if (ast.computed) {
                markConstantAndWatchExpressions(ast.property, çfilter);
            }
            ast.toWatch = [ast];
            ast.constant = ast.object.constant && (!ast.computed || ast.property.constant);
            break;
        case AST.ThisExpression:
        case AST.LocalsExpression:
            ast.toWatch = [];
            ast.constant = false;
            break;
        case AST.Identifier:
            ast.toWatch = [ast];
            ast.constant = false;
            break;
        case AST.AssignmentExpression:
        case AST.LogicalExpression:
            markConstantAndWatchExpressions(ast.left, çfilter)
            markConstantAndWatchExpressions(ast.right, çfilter)
            ast.constant = ast.left.constant && ast.right.constant;
            ast.toWatch = [ast];
            break;
        case AST.BinaryExpression:
            markConstantAndWatchExpressions(ast.left, çfilter)
            markConstantAndWatchExpressions(ast.right, çfilter)
            ast.constant = ast.left.constant && ast.right.constant;
            ast.toWatch = ast.left.toWatch.concat(ast.right.toWatch);
            break;
        case AST.ConditionalExpression:
            markConstantAndWatchExpressions(ast.test, çfilter)
            markConstantAndWatchExpressions(ast.consequent, çfilter)
            markConstantAndWatchExpressions(ast.alternate, çfilter)
            ast.constant = ast.test.constant && ast.consequent.constant && ast.alternate.constant;
            ast.toWatch = [ast];
            break;
        case AST.UnaryExpression:
            markConstantAndWatchExpressions(ast.argument, çfilter)
            ast.constant = ast.argument.constant;
            ast.toWatch = ast.argument.toWatch;
            break;
        case AST.CallExpression:
            var stateless = ast.filter && !çfilter(ast.callee.name).çstateful;
            allConstants = stateless ? true : false;
            argsToWatch = [];
            forEach(ast.arguments, function (arg) {
                markConstantAndWatchExpressions(arg, çfilter);
                allConstants = allConstants && arg.constant;
                if (!arg.constant) {
                    argsToWatch.push.apply(argsToWatch, arg.toWatch);
                }
            })
            ast.constant = allConstants;
            ast.toWatch = stateless ? argsToWatch : [ast];
            break;
    }
}

function getInputs(ast) {
    if (ast.length !== 1) {
        return;
    }
    var candidate = ast[0].toWatch;
    if (candidate.length !== 1 || candidate[0] !== ast[0]) {
        return candidate;
    }
}

export default class ASTCompiler {
    constructor(astBuilder, çfilter) {
        this.astBuilder = astBuilder;
        this.çfilter = çfilter;
        ASTCompiler.stringEscapeRegex = /[^ a-zA-Z0-9]/g;
        ASTCompiler.scopeId = 's';
        ASTCompiler.localsId = 'l';
        ASTCompiler.variablesId = 'v';
    }

    // from: {type: AST.Number, value: 42}
    // to:   function(){ return 42; }
    compile(text) {
        var ast = this.astBuilder.ast(text);
        var extra = '';
        markConstantAndWatchExpressions(ast, this.çfilter);
        console.log('result of ast:', ast);

        this.state = {
            fn: {
                body: [],
                vars: [],
            },
            assign: {
                body: [],
                vars: [],
            },
            nextId: 0,
            filters: {},
            inputs: []
        };
        this.stage = 'inputs';
        forEach(getInputs(ast.body), bind(function (input, idx) {
            var inputKey = 'fn' + idx;
            this.state[inputKey] = { body: [], vars: [] };
            this.state.computing = inputKey;
            this.state[inputKey].body.push(`return ${this.recurse(input)};`);
            this.state.inputs.push(inputKey);
        }, this));
        this.stage = 'assign';
        var assignable = assignableAST(ast);
        if (assignable) {
            this.state.computing = 'assign';
            this.state.assign.body.push(this.recurse(assignable));
            console.log('this.state.assign.body',this.state.assign.body);
            extra = `fn.assign = function(${ASTCompiler.scopeId},${ASTCompiler.variablesId},${ASTCompiler.localsId}){${
                (this.state.assign.vars.length ?
                    `var ${this.state.assign.vars.join(',')};` 
                    : '') + 
                    this.state.assign.body.join('')
            }};`;
            console.log('extra (assign):\n', beautify(extra.toString(), { indent_size: 2, space_in_empty_paren: true }));
        }

        this.stage = 'main';
        this.state.computing = 'fn';
        this.recurse(ast);
        var fnString = `${this.filterPrefix()} var fn=function(
            ${ASTCompiler.scopeId},${ASTCompiler.localsId}){
                ${(this.state.fn.vars.length ?
                `var ${this.state.fn.vars.join(',')};` :
                '') 
                + this.state.fn.body.join('')}
            };${this.watchFns() + extra} return fn;`;
        var fn = new Function(
            'ensureSafeMemberName',
            'ensureSafeObject',
            'ensureSafeFunction',
            'ifDefined',
            'filter',
            fnString)(
                ensureSafeMemberName,
                ensureSafeObject,
                ensureSafeFunction,
                ifDefined,
                this.çfilter
            )
        // for pretty print resulting fn
        var prettyFn = beautify(fn.toString(), { indent_size: 2, space_in_empty_paren: true });
        console.log(prettyFn);
        // isto é esquisito, já que ele mete propriedades na função que depois vai dar para trás
        fn.literal = isLiteral(ast);
        fn.constant = ast.constant;
        return fn;

    }

    recurse(ast, context, createOnTheFly) {
        var intoId;
        //console.log('inside recurse:', ast);
        switch (ast.type) {
            case AST.Program:
                forEach(initial(ast.body), bind(function (stmt) {
                    this.state[this.state.computing].body.push(this.recurse(stmt), ';');
                }, this));
                this.state[this.state.computing].body.push(`return ${this.recurse(last(ast.body))} ;`);
                break;
            case AST.Literal:
                return this.escape(ast.value)
            case AST.ArrayExpression:
                var elements = map(ast.elements, bind(function (element) {
                    return this.recurse(element);
                }, this));
                return `[${elements.join(',')}]`
            case AST.ObjectExpression:
                var properties = map(ast.properties, bind(function (property) {
                    console.log(property);
                    var key = property.key.type === AST.Identifier ?
                        property.key.name :
                        this.escape(property.key.value);
                    var value = this.recurse(property.value);
                    return `${key}:${value}`
                    //return this.recurse(property);
                }, this))
                return `{${properties.join(',')}}`
            case AST.Identifier:
                ensureSafeMemberName(ast.name);
                intoId = this.nextId();
                var localsCheck;
                if (this.stage === 'inputs') {
                    localsCheck = 'false';
                } else {
                    localsCheck = this.getHasOwnProperty(ASTCompiler.localsId, ast.name);
                }
                this.if_(localsCheck,
                    this.assign(intoId, this.nonComputedMember(ASTCompiler.localsId, ast.name)))
                if (createOnTheFly) {
                    this.if_(`${this.not(localsCheck)} && ${ASTCompiler.scopeId} && ${this.not(this.getHasOwnProperty(ASTCompiler.scopeId, ast.name))}`,
                        this.assign(this.nonComputedMember(ASTCompiler.scopeId, ast.name), '{}'));
                }
                this.if_(`${this.not(localsCheck)} && ${ASTCompiler.scopeId}`,
                    this.assign(intoId, this.nonComputedMember(ASTCompiler.scopeId, ast.name)));
                if (context) {
                    context.context = `${localsCheck}?${ASTCompiler.localsId}:${ASTCompiler.scopeId}`
                    context.name = ast.name;
                    context.computed = false;
                }
                this.addEnsureSafeObject(intoId);
                return intoId;
            case AST.ThisExpression:
                return ASTCompiler.scopeId;
            case AST.MemberExpression:
                intoId = this.nextId();
                var left = this.recurse(ast.object, undefined, createOnTheFly);
                if (context) {
                    context.context = left;
                }
                if (ast.computed) {
                    var right = this.recurse(ast.property);
                    this.addEnsureSafeMemberName(right);
                    if (createOnTheFly) {
                        this.if_(this.not(this.computedMember(left, right)),
                            this.assign(this.computedMember(left, right), '{}'));
                    }
                    this.if_(left,
                        this.assign(intoId,
                            `ensureSafeObject(${this.computedMember(left, right)})`
                        ))
                    if (context) {
                        context.name = right;
                        context.computed = true;
                    }
                } else {
                    ensureSafeMemberName(ast.property.name);
                    if (createOnTheFly) {
                        this.if_(this.not(this.nonComputedMember(left, ast.property.name)),
                            this.assign(this.nonComputedMember(left, ast.property.name), '{}'));
                    }
                    this.if_(left,
                        this.assign(intoId,
                            `ensureSafeObject(${this.nonComputedMember(left, ast.property.name)})`
                        ))
                    if (context) {
                        context.name = ast.property.name;
                        context.computed = false;
                    }
                }
                return intoId;
            case AST.LocalsExpression:
                return ASTCompiler.localsId;
            case AST.AssignmentExpression:
                var leftContext = {};
                var left = this.recurse(ast.left, leftContext, true);
                var leftExpr;
                if (leftContext.computed) {
                    leftExpr = this.computedMember(leftContext.context, leftContext.name);
                } else {
                    leftExpr = this.nonComputedMember(leftContext.context, leftContext.name);
                }
                return this.assign(leftExpr, `ensureSafeObject(${this.recurse(ast.right)})`);
            case AST.CallExpression:
                var callContext, callee, args;
                if (ast.filter) {
                    callee = this.filter(ast.callee.name);
                    args = map(ast.arguments, bind(function (arg) {
                        return this.recurse(arg);
                    }, this));
                    return `${callee}(${args})`;
                } else {
                    callContext = {};
                    callee = this.recurse(ast.callee, callContext);
                    args = map(ast.arguments, bind(function (arg) {
                        return `ensureSafeObject(${this.recurse(arg)})`;
                    }, this));
                    if (callContext.name) {
                        this.addEnsureSafeObject(callContext.context);
                        if (callContext.computed) {
                            callee = this.computedMember(callContext.context, callContext.name);
                        } else {
                            callee = this.nonComputedMember(callContext.context, callContext.name);
                        }
                    }
                    this.addEnsureSafeFunction(callee);
                    return `${callee} &&ensureSafeObject(${callee}(${args.join(',')}))`; // this means call the callee if the callee exists, so don't call the callee if the callee don't exist
                }
                break;
            case AST.UnaryExpression:
                return `${ast.operator}(${this.ifDefined(this.recurse(ast.argument), 0)})`
            case AST.BinaryExpression:
                if (ast.operator === '+' || ast.operator === '-') {
                    return `(${this.ifDefined(this.recurse(ast.left), 0)} ${ast.operator} ${this.ifDefined(this.recurse(ast.right), 0)})`
                } else {
                    return `(${this.recurse(ast.left)} ${ast.operator} ${this.recurse(ast.right)})`
                }
            case AST.LogicalExpression:
                intoId = this.nextId();
                this.state[this.state.computing].body.push(this.assign(intoId, this.recurse(ast.left)))
                this.if_(ast.operator === '&&' ? intoId : this.not(intoId),
                    this.assign(intoId, this.recurse(ast.right)))
                return intoId;
            case AST.ConditionalExpression:
                intoId = this.nextId();
                var testId = this.nextId();
                this.state[this.state.computing].body.push(this.assign(testId, this.recurse(ast.test)));
                this.if_(testId,
                    this.assign(intoId, this.recurse(ast.consequent)));
                this.if_(this.not(testId),
                    this.assign(intoId, this.recurse(ast.alternate)));
                return intoId
            case AST.NABValueParameter:
                    return ASTCompiler.variablesId;
            default:
                throw 'error when choosing the type on the ast compiler';
        }

    }

    escape(value) {
        if (isString(value)) {
            return `\'${value.replace(ASTCompiler.stringEscapeRegex, this.stringEscapeFn)}\'`;
        } else if (isNull(value)) {
            return 'null';
        } else {
            return value;
        }
    }

    stringEscapeFn(c) {
        return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
    }

    nonComputedMember(left, right) {
        return `(${left}).${right}`; //? 
    }

    computedMember(left, right) {
        return `(${left})[${right}]`;
    }

    if_(test, consequent) {
        this.state[this.state.computing].body.push('if(', test, '){', consequent, '}');
    }

    assign(id, value) {
        return `${id}=${value};`
    }

    call(left, value) {
        return `(${left}).${value}()`
    }

    nextId(skip) {
        var id = `${ASTCompiler.variablesId}${(this.state.nextId++)}`;
        if (!skip) {
            this.state[this.state.computing].vars.push(id);
        }
        return id;
    }

    not(e) {
        return `!(${e})`
    }

    getHasOwnProperty(object, property) {
        return `${object} &&(${this.escape(property)} in ${object})`
    }

    addEnsureSafeMemberName(expr) {
        this.state[this.state.computing].body.push(`ensureSafeMemberName(${expr});`);
    }
    addEnsureSafeObject(context) {
        this.state[this.state.computing].body.push(`ensureSafeObject(${context});`)
    }
    addEnsureSafeFunction(callee) {
        this.state[this.state.computing].body.push(`ensureSafeFunction(${callee});`)
    }

    ifDefined(expr, valueIfUndefined) {
        return `ifDefined(${expr}, ${this.escape(valueIfUndefined)})`
    }

    filter(name) {
        if (!this.state.filters.hasOwnProperty(name)) {
            this.state.filters[name] = this.nextId(true);
        }
        return this.state.filters[name];
    }

    filterPrefix() {
        if (isEmpty(this.state.filters)) {
            return '';
        } else {
            var parts = map(this.state.filters, bind(function (varName, filterName) {
                return `${varName} = filter(${this.escape(filterName)})`;
            }, this)); // it's binded because otherwise the escape would not be accessible (this inside a function !!)
            return `var ${parts.join(',')};`;
        }
    }

    watchFns() {
        var result = [];
        forEach(this.state.inputs, bind(function (inputName) {
            result.push('var ', inputName, `=function(${ASTCompiler.scopeId}){`, (this.state[inputName].vars.length ?
                `var ${this.state[inputName].vars.join(',')};` : ''),
                this.state[inputName].body.join(''),
                '};');
        }, this));
        if (result.length) {
            result.push(`fn.inputs = [${this.state.inputs.join(',')}];`);
        }
        console.log('watchFns:\n', beautify(result.join('').toString(), { indent_size: 2, space_in_empty_paren: true }));
        return result.join('');
    }

}