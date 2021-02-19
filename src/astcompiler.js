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

function markConstantExpressions(ast) {
    var allConstants;
    console.log(ast);
    switch (ast.type) {
        case AST.Program:
            allConstants = true;
            forEach(ast.body, function (expr) {
                markConstantExpressions(expr);
                allConstants = allConstants && expr.constant;
            })
            ast.constant = allConstants;
            break;
        case AST.Literal:
            ast.constant = true;
            break;

        case AST.ArrayExpression:
            allConstants = true;
            forEach(ast.elements, function (element) {
                markConstantExpressions(element);
                allConstants = allConstants && element.constant;
            })
            ast.constant = allConstants
            break;
        case AST.ObjectExpression:
            console.log(ast);
            allConstants = true;
            forEach(ast.properties, function (property) {
                markConstantExpressions(property.value);
                allConstants = allConstants && property.value.constant;
            })
            ast.constant = allConstants
            break;
        case AST.MemberExpression:
            console.log(ast);
            markConstantExpressions(ast.object);
            if (ast.computed) {
                markConstantExpressions(ast.property);
            }
            ast.constant = ast.object.constant && (!ast.computed || ast.property.constant);
            break;
        case AST.ThisExpression:
        case AST.LocalsExpression:
        case AST.Identifier:
            ast.constant = false;
            break;
        case AST.AssignmentExpression:
        case AST.BinaryExpression:
        case AST.LogicalExpression:
            markConstantExpressions(ast.left)
            markConstantExpressions(ast.right)
            ast.constant = ast.left.constant && ast.right.constant;
            break;
        case AST.ConditionalExpression:
            markConstantExpressions(ast.test)
            markConstantExpressions(ast.consequent)
            markConstantExpressions(ast.alternate)
            ast.constant = ast.test.constant && ast.consequent.constant && ast.alternate.constant;
            break;
        case AST.UnaryExpression:
            markConstantExpressions(ast.argument)
            ast.constant = ast.argument.constant;
            break;
        case AST.CallExpression:
            allConstants = Boolean(ast.filter);
            forEach(ast.arguments, function (arg) {
                markConstantExpressions(arg);
                allConstants = allConstants && arg.constant;
            })
            ast.constant = allConstants;
            break;
    }
}

export default class ASTCompiler {
    constructor(astBuilder) {
        this.astBuilder = astBuilder;

        ASTCompiler.stringEscapeRegex = /[^ a-zA-Z0-9]/g;
        ASTCompiler.scopeId = 's';
        ASTCompiler.localsId = 'l';
        ASTCompiler.variablesId = 'v';
    }

    // from: {type: AST.Number, value: 42}
    // to:   function(){ return 42; }
    compile(text) {
        var ast = this.astBuilder.ast(text);
        markConstantExpressions(ast);
        console.log('result of ast:', ast);

        this.state = {
            body: [],
            nextId: 0,
            vars: [],
            filters: {}
        };
        this.recurse(ast);
        var fnString = `${this.filterPrefix()} var fn=function(${ASTCompiler.scopeId},${ASTCompiler.localsId}){${(this.state.vars.length ?
            `var ${this.state.vars.join(',')};` :
            '') + this.state.body.join('')
            }}; return fn;`;
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
                filter
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
                    this.state.body.push(this.recurse(stmt), ';');
                }, this));
                this.state.body.push(`return ${this.recurse(last(ast.body))} ;`);
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
                this.if_(this.getHasOwnProperty(ASTCompiler.localsId, ast.name),
                    this.assign(intoId, this.nonComputedMember(ASTCompiler.localsId, ast.name)))
                if (createOnTheFly) {
                    this.if_(`${this.not(this.getHasOwnProperty(ASTCompiler.localsId, ast.name))} && ${ASTCompiler.scopeId} && ${this.not(this.getHasOwnProperty(ASTCompiler.scopeId, ast.name))}`,
                        this.assign(this.nonComputedMember(ASTCompiler.scopeId, ast.name), '{}'));
                }
                this.if_(`${this.not(this.getHasOwnProperty(ASTCompiler.localsId, ast.name))} && ${ASTCompiler.scopeId}`,
                    this.assign(intoId, this.nonComputedMember(ASTCompiler.scopeId, ast.name)));
                if (context) {
                    context.context = `${this.getHasOwnProperty(ASTCompiler.localsId, ast.name)}?${ASTCompiler.localsId}:${ASTCompiler.scopeId}`
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
                        this.if_(this.not(this.nonComputedMember(left, right)),
                            this.assign(this.nonComputedMember(left, right), '{}'));
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
                this.state.body.push(this.assign(intoId, this.recurse(ast.left)))
                this.if_(ast.operator === '&&' ? intoId : this.not(intoId),
                    this.assign(intoId, this.recurse(ast.right)))
                return intoId;
            case AST.ConditionalExpression:
                intoId = this.nextId();
                var testId = this.nextId();
                this.state.body.push(this.assign(testId, this.recurse(ast.test)));
                this.if_(testId,
                    this.assign(intoId, this.recurse(ast.consequent)));
                this.if_(this.not(testId),
                    this.assign(intoId, this.recurse(ast.alternate)));
                return intoId
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
        return `(${left}).${right}`;
    }

    computedMember(left, right) {
        return `(${left})[${right}]`;
    }

    if_(test, consequent) {
        this.state.body.push('if(', test, '){', consequent, '}');
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
            this.state.vars.push(id);
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
        this.state.body.push(`ensureSafeMemberName(${expr});`);
    }
    addEnsureSafeObject(context) {
        this.state.body.push(`ensureSafeObject(${context});`)
    }
    addEnsureSafeFunction(callee) {
        this.state.body.push(`ensureSafeFunction(${callee});`)
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
}