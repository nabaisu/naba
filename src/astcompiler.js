import AST from "./ast";
import { isString, isNull, map, bind } from 'lodash'
import { js as beautify } from 'js-beautify' // this is mostly to be able to get the returning function pretty

export default class ASTCompiler {
    constructor(astBuilder) {
        this.astBuilder = astBuilder;

        ASTCompiler.stringEscapeRegex = /[^ a-zA-Z0-9]/g;
    }

    // from: {type: AST.Number, value: 42}
    // to:   function(){ return 42; }
    compile(text) {
        var ast = this.astBuilder.ast(text);
        console.log('result of ast:', ast);

        this.state = { body: [], nextId: 0, vars: [] };
        this.recurse(ast);
        console.log('state.body:', this.state.body);
        var fn = new Function('s', 'l', (this.state.vars.length ?
            `var ${this.state.vars.join(',')};` :
            ''
        ) + this.state.body.join(''));
        // for pretty print resulting fn
        var prettyFn = beautify(fn.toString(), { indent_size: 2, space_in_empty_paren: true });
        console.log(prettyFn);
        return fn;
    }

    recurse(ast) {
        var intoId;
        //console.log('inside recurse:', ast);
        switch (ast.type) {
            case AST.Program:
                this.state.body.push(`return ${this.recurse(ast.body)} ;`);
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
                intoId = this.nextId();
                this.if_(this.getHasOwnProperty('l', ast.name),
                    this.assign(intoId, this.nonComputedMember('l', ast.name)))
                this.if_(`${this.not(this.getHasOwnProperty('l', ast.name))} && s`,
                    this.assign(intoId, this.nonComputedMember('s', ast.name)));
                return intoId;
            case AST.ThisExpression:
                return 's';
            case AST.MemberExpression:
                intoId = this.nextId();
                var left = this.recurse(ast.object);
                this.if_(left,
                    this.assign(intoId, this.nonComputedMember(left, ast.property.name)))
                return intoId;
            case AST.LocalsExpression:
                return 'l';
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

    if_(test, consequent) {
        this.state.body.push('if(', test, '){', consequent, '}');
    }

    assign(id, value) {
        return `${id}=${value};`
    }

    nextId() {
        var id = `v${(this.state.nextId++)}`;
        this.state.vars.push(id);
        return id;
    }

    not(e) {
        return `!(${e})`
    }

    getHasOwnProperty(object, property) {
        return `${object} &&(${this.escape(property)} in ${object})`
    }
}