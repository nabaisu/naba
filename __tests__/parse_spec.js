import parse from '../src/parse'
import { constant, identity } from 'lodash'
import { register } from '../src/filter'

describe('parse', () => {

    describe('Numbers', () => {
        it('can parse an integer', () => {
            var fn = parse('42');
            expect(fn).toBeDefined();
            expect(fn()).toBe(42);
        })


        it('can parse a floating point number', () => {
            var fn = parse('4.2');
            expect(fn()).toBe(4.2);
        })
        it('can parse a floating point number first zero is missing', () => {
            var fn = parse('.42');
            expect(fn()).toBe(0.42);
        })

        it('can parse a scientific notation number', () => {
            var fn = parse('42e3');
            expect(fn()).toBe(42000);
        })

        it('can parse a scientific notation number without the first zero', () => {
            var fn = parse('.42e2');
            expect(fn()).toBe(42);
        })

        it('can parse a scientific notation number to negative exponents', () => {
            var fn = parse('4200e-2');
            expect(fn()).toBe(42);
        })

        it('can parse a scientific notation number to positive exponents', () => {
            var fn = parse('.42e+2');
            expect(fn()).toBe(42);
        })

        it('can parse a scientific notation number to Capital E', () => {
            var fn = parse('.42E+2');
            expect(fn()).toBe(42);
        })

        it('will not parse invalid scientific notation', () => {
            expect(function () { parse('42e-2e2'); }).toThrow();
            expect(function () { parse('42e-'); }).toThrow();
            expect(function () { parse('42e-a'); }).toThrow();
        })
    })

    describe('Strings', () => {
        it('is able to parse strings in single quotes', () => {
            var fn = parse("'42'");
            expect(fn()).toEqual('42');
        })
        it('is able to parse strings in double quotes', () => {
            var fn = parse('"42"');
            expect(fn()).toEqual('42');
        })
        it('will not parse a string with mismatching quotes', () => {
            expect(function () { parse('"42\'') }).toThrow();
        })
        it('is able to parse a string with single quotes inside', () => {
            var fn = parse("'a\\\'b'");
            expect(fn()).toEqual('a\'b');
        })
        it('is able to parse a string with double quotes inside', () => {
            var fn = parse('"a\\\"b"');
            expect(fn()).toEqual("a\"b");
        })
        it('is able to parse a non escape inside', () => { // this test is for code coverage
            var fn = parse('"a\\ab"');
            expect(fn()).toEqual("aab");
        })
        it('will parse a string with unicode escapes', () => {
            var fn = parse('"\\u00A0"');
            expect(fn()).toEqual('\u00A0');
        })
        it('will not parse a strint with invalid unicode escapes', () => {
            expect(function () { parse("'\\u00T0'") }).toThrow();
        })
    })

    describe('Identifiers', () => {
        it('will parse null', () => {
            var fn = parse('null');
            expect(fn()).toEqual(null);
        })
        it('will parse true', () => {
            var fn = parse('true');
            expect(fn()).toEqual(true);
        })
        it('will parse false', () => {
            var fn = parse('false');
            expect(fn()).toEqual(false);
        })
    })

    describe('Whitespaces', () => {
        it('ignores whitespaces', () => {
            var fn = parse(' \n \t 42\v\r \u00A0 ');
            expect(fn()).toEqual(42);
        })
    })

    describe('Arrays', () => {
        it('will parse an empty array', () => {
            var fn = parse('[]');
            expect(fn()).toEqual([]);
        })
        it('will parse a non-empty array', () => {
            var fn = parse('[1, "two", [3], true]');
            expect(fn()).toEqual([1, "two", [3], true]);
        })
        it('will parse an array with a trailing comma', () => {
            var fn = parse('[1,2,3,]');
            expect(fn()).toEqual([1, 2, 3]);
        })
    })

    describe('Objects', () => {
        it('will parse an empty object', () => {
            var fn = parse('{}');
            expect(fn()).toEqual({});
        })
        it('will parse a non-empty object', () => {
            var fn = parse('{ "a key": 1, \'another-key\': 2}');
            expect(fn()).toEqual({ 'a key': 1, 'another-key': 2 });
        })
        it('will parse an object with identifier keys', () => {
            var fn = parse('{a: 1, b: [2, 3], c: {d: 4}}');
            expect(fn()).toEqual({ a: 1, b: [2, 3], c: { d: 4 } });
        })
    })

    describe('Scopes', () => {
        it('looks up an attribute from the scope', () => {
            var fn = parse('aKey');
            expect(fn({ aKey: 42 })).toBe(42);
            expect(fn({})).toBeUndefined();
        })
        it('returns undefined when looking up attribute from undefined', () => {
            var fn = parse('otherKey');
            expect(fn()).toBeUndefined();
        })
        it('will parse this', () => {
            var fn = parse('this');
            var scope = {};
            expect(fn(scope)).toBe(scope);
            expect(fn()).toBeUndefined();
        })
        it('looks up a 2-part identifier path from the scope', () => {
            var fn = parse('aKey.answer');
            expect(fn({ aKey: { answer: 42 } })).toBe(42);
            expect(fn({ aKey: {} })).toBeUndefined();
            expect(fn({})).toBeUndefined();
        })
        it('looks up a member from an object', () => {
            var fn = parse('{aKey: 42}.aKey');
            expect(fn()).toBe(42);
        })
        it('looks up a 4-part identifier path from the scope', () => {
            var fn = parse('aKey.answer.to.world');
            expect(fn({ aKey: { answer: { to: { world: 42 } } } })).toBe(42);
            expect(fn({ aKey: { answer: { to: {} } } })).toBeUndefined();
            expect(fn({ aKey: {} })).toBeUndefined();
            expect(fn({})).toBeUndefined();
        })

        it('uses locals instead of scope when there is a matching key', () => {
            var fn = parse('aKey');
            var scope = { aKey: 43 };
            var locals = { aKey: 42 };
            expect(fn(scope, locals)).toBe(42)
        })
        it('falls back to scope if not found on locals if there is a matching key', () => {
            var fn = parse('aKey');
            var scope = { aKey: 42 };
            var locals = { otherKey: 43 };
            expect(fn(scope, locals)).toBe(42)
        })

        it('uses locals instead of scope when the first part matches', () => {
            var fn = parse('aKey.anotherKey');
            var scope = { aKey: { anotherKey: 42 } };
            var locals = { aKey: {} };
            expect(fn(scope, locals)).toBeUndefined();
        })

        it('will parse çlocals', () => {
            var fn = parse('çlocals');
            var scope = {};
            var locals = {};
            expect(fn(scope, locals)).toBe(locals);
            expect(fn(scope)).toBeUndefined();

            fn = parse('çlocals.aKey');
            scope = { aKey: 43 };
            locals = { aKey: 42 };
            expect(fn(scope, locals)).toBe(42)
        })
        it('parses a simple computed property access', () => {
            var fn = parse('aKey["a property"]');
            expect(fn({ aKey: { "a property": 42 } })).toBe(42);
        })
        it('parses a computed numeric array access', () => {
            var fn = parse('anArray[0]');
            expect(fn({ anArray: [1, 2, 3] })).toBe(1);
        })
        it('parses a computed access with another key as property', () => {
            var fn = parse('lock[key]');
            // bem pensado na realidade...
            expect(fn({ key: 'theKey', lock: { theKey: 42 } })).toBe(42);
        })
        it('parses computed access with another access as property', () => {
            var fn = parse('lock[keys["aKey"]]');
            expect(fn({ keys: { aKey: 'theKey' }, lock: { theKey: 42 } })).toBe(42);
        })
    })

    describe('Functions', () => {
        it('parses a function call', () => {
            var fn = parse('aFn()');
            var scope = {
                aFn: function () {
                    return 42
                }
            }
            expect(fn(scope)).toBe(42);
        })
        it('parses a function call with a single number argument', () => {
            var fn = parse('aFn(42)');
            expect(fn({ aFn: function (n) { return n } })).toBe(42);
        })
        it('parses a function call with a single identifier argument', () => {
            var fn = parse('aFn(n)');
            expect(fn({ n: 42, aFn: function (x) { return x } })).toBe(42);
        })
        it('parses a function call with a single function call argument', () => {
            var fn = parse('aFn(n())');
            expect(fn({ n: constant(42), aFn: function (x) { return x } })).toBe(42);
        })
        it('parses a function call with multiple arguments', () => {
            var fn = parse('aFn(37, something, n())');
            expect(fn({ something: 3, n: constant(2), aFn: function (first, second, third) { return first + second + third } })).toBe(42);
        })

        it('calls methods accessed as computed properties', () => {
            var fn = parse('anObject["aFn"]()');
            var scope = {
                anObject: {
                    aMember: 42,
                    aFn: function () {
                        return this.aMember;
                    }
                }
            }
            expect(fn(scope)).toBe(42);
        })

        it('calls methods accessed as non-computed properties', () => {
            var fn = parse('anObject.aFn()');
            var scope = {
                anObject: {
                    aMember: 42,
                    aFn: function () {
                        return this.aMember;
                    }
                }
            }
            expect(fn(scope)).toBe(42);
        })

        it('binds bare functions to the scope', () => {
            var fn = parse('aFn()');
            var scope = {
                aFn: function () {
                    return this;
                }
            }
            expect(fn(scope)).toBe(scope);
        })
        it('binds bare function to the locals if exist', () => {
            var fn = parse('aFn()');
            var scope = {}
            var locals = {
                aFn: function () {
                    return this;
                }
            }
            expect(fn(scope, locals)).toBe(locals);
        })
    })

    describe('Assigning Values', () => {
        it('parses a simple attribute assignment', () => {
            var fn = parse('anAttribute = 42');
            var scope = {}
            fn(scope);
            expect(scope.anAttribute).toBe(42)
        })
        it('parses an attribute assignment with a function call', () => {
            var fn = parse('a = aFn()');
            var scope = { aFn: constant(42) }
            fn(scope);
            expect(scope.a).toBe(42)
        })
        it('can assign a computed object property', () => {
            var fn = parse('ola["bomdia"] = 42');
            var scope = { ola: {} }
            fn(scope);
            expect(scope.ola.bomdia).toBe(42);
        })
        it('can assign a non-computed object property', () => {
            var fn = parse('ola.bomdia = 42');
            var scope = { ola: {} }
            fn(scope);
            expect(scope.ola.bomdia).toBe(42);
        })
        it('can assign a nested object property', () => {
            var fn = parse('anArray[0].anAttribute = 42');
            var scope = { anArray: [{}] };
            fn(scope);
            expect(scope.anArray[0].anAttribute).toBe(42);
        })
        it('creates the objects in the assignment path that do not exist', () => {
            var fn = parse('a["b"].c = 42');
            var scope = {};
            fn(scope);
            expect(scope.a.b.c).toBe(42);
        })
    })

    describe('Security', () => {
        it('does not allow calling the function constructor', () => {
            expect(function () {
                var fn = parse('aFn.constructor("return window;")()');
                fn({ aFn: function () { } })
            }
            ).toThrow()
        })
        it('does not allow accessing __proto__', () => {
            expect(function () {
                var fn = parse('obj.__proto__');
                fn({ obj: {} })
            }
            ).toThrow()
        })
        it('does not allow calling __defineGetter__', () => {
            expect(function () {
                var fn = parse('obj.__defineGetter__("evil", fn)');
                fn({ obj: {}, fn: function () { } })
            }
            ).toThrow()
        })
        it('does not allow calling __defineSetter__', () => {
            expect(function () {
                var fn = parse('obj.__defineSetter__("evil", fn)');
                fn({ obj: {}, fn: function () { } })
            }
            ).toThrow()
        })
        it('does not allow calling __lookupGetter__', () => {
            expect(function () {
                var fn = parse('obj.__lookupGetter__("evil")');
                fn({ obj: {} })
            }
            ).toThrow()
        })
        it('does not allow calling __lookupSetter__', () => {
            expect(function () {
                var fn = parse('obj.__lookupSetter__("evil")');
                fn({ obj: {} })
            }
            ).toThrow()
        })
        it('does not allow accessing window as computed property', () => {
            var fn = parse('anObject["wnd"]');
            expect(function () {
                fn({ anObject: { wnd: window } })
            }).toThrow()
        })
        it('does not allow accessing window as non-computed property', () => {
            var fn = parse('anObject.wnd');
            expect(function () {
                fn({ anObject: { wnd: window } })
            }).toThrow()
        })
        it('does not allow passing window as function argument', () => {
            var fn = parse('aFn(wnd)');
            expect(function () {
                fn({
                    wnd: window,
                    aFn: function (something) { return something }
                })
            }).toThrow()
        })
        it('does not allow calling methods on window', () => {
            var fn = parse('wnd.scrollTo(0)');
            expect(function () {
                fn({
                    wnd: window
                })
            }).toThrow()
        })
        it('does not allow functions to return window', () => {
            var fn = parse('getWnd()');
            expect(function () {
                fn({
                    getWnd: constant(window)
                })
            }).toThrow()
        })
        it('does not allow assigning window', () => {
            var fn = parse('wnd = anObject');
            expect(function () {
                fn({
                    anObject: window
                })
            }).toThrow()
        })
        it('does not allow referencing window', () => {
            var fn = parse('wnd');
            expect(function () {
                fn({
                    wnd: window
                })
            }).toThrow()
        })
        it('does not allow calling function on DOM elements', () => {
            var fn = parse('el.setAttribute("evil", "true")');
            expect(function () {
                fn({
                    el: document.documentElement
                })
            }).toThrow()
        })
        it('does not allow calling the aliased function constructor', () => {
            var fn = parse('fnConstructor("return window;")');
            expect(function () {
                fn({
                    fnConstructor: (function () { }).constructor
                })
            }).toThrow()
        })
        it('does not allow calling functions on Object', () => {
            var fn = parse('obj.create({})');
            expect(function () {
                fn({
                    obj: Object
                })
            }).toThrow()
        })
        it('does not allow calling call', () => {
            var fn = parse('fun.call(obj)');
            expect(function () {
                fn({
                    fun: function () { }, obj: {}
                })
            }).toThrow()
        })
        it('does not allow calling apply', () => {
            var fn = parse('fun.apply(obj)');
            expect(function () {
                fn({
                    fun: function () { }, obj: {}
                })
            }).toThrow()
        })
    })

    describe('Operators', () => {
        it('parses a unary +', () => {
            expect(parse('+42')()).toBe(42);
            expect(parse('+a')({ a: 42 })).toBe(42);
        })
        it('replaces undefined with zero for unary +', () => {
            expect(parse('+a')({})).toBe(0);
        })
        it('parses a unary !', () => {
            expect(parse('!true')()).toBe(false);
            expect(parse('!42')()).toBe(false);
            expect(parse('!a')({ a: false })).toBe(true);
            expect(parse('!!a')({ a: false })).toBe(false);
        })

        it('parses a unary -', () => {
            expect(parse('-42')()).toBe(-42);
            expect(parse('-a')({ a: -42 })).toBe(42);
            expect(parse('--a')({ a: -42 })).toBe(-42);
            expect(parse('-a')({}) === 0).toBe(true); // due to 0 and -0
        })

        it('parses a ! in a string', () => {
            expect(parse('"!"')()).toBe('!');
        })

        it('parses a multiplication', () => {
            expect(parse('21 * 2')()).toBe(42);
        })
        it('parses a division', () => {
            expect(parse('84 / 2')()).toBe(42);
        })
        it('parses a remainder', () => {
            expect(parse('-85 % -43')()).toBe(-42);
        })
        it('parses several multiplicatives', () => {
            expect(parse('36 * 2 % 5')()).toBe(2);
        })
        it('parses an addition', () => {
            expect(parse('20 + 22')()).toBe(42);
        })
        it('parses a subtraction', () => {
            expect(parse('45 - 3')()).toBe(42);
        })
        it('parses multiplicatives on a higher precedence than additives', () => {
            expect(parse('2 + 3 * 5')()).toBe(17);
            expect(parse('2 + 3 * 2 + 3')()).toBe(11);
        })
        it('substitutes undefined with zero in addition', () => {
            expect(parse('a + 22')()).toBe(22);
            expect(parse('42 + a')()).toBe(42);
        })
        it('substitutes undefined with zero in subtraction', () => {
            expect(parse('a - 22')()).toBe(-22);
            expect(parse('42 - a')()).toBe(42);
        })
        it('parses relational operators', () => {
            expect(parse('1 < 2')()).toBe(true);
            expect(parse('1 > 2')()).toBe(false);
            expect(parse('1 >= 2')()).toBe(false);
            expect(parse('1 <= 2')()).toBe(true);
            expect(parse('1 >= 1')()).toBe(true);
            expect(parse('1 <= 1')()).toBe(true);
            expect(parse('1 < 1')()).toBe(false);
            expect(parse('1 > 1')()).toBe(false);
        })
        it('parses equality operators', () => {
            expect(parse('42 == 42')()).toBe(true);
            expect(parse('42 == "42"')()).toBe(true);
            expect(parse('42 != "42"')()).toBe(false);
            expect(parse('42 === 42')()).toBe(true);
            expect(parse('42 === "42"')()).toBe(false);
            expect(parse('42 !== 42')()).toBe(false);
        })
        it('parses relations on a higher precedence than equality', () => {
            expect(parse('2 == "2" > 2 === "2"')()).toBe(false);
            // 2 == "2" > 2 === "2"
            // 2 == false === "2"
            // false === "2"
            // false
        })

        it('parses additives on a higher precedence than relations', () => {
            expect(parse('42 < 2 + 42')()).toBe(true);
        })

        it('parses logical AND', () => {
            expect(parse('true && true')()).toBe(true);
            expect(parse('true && false')()).toBe(false);
            expect(parse('false && false')()).toBe(false);
        })
        it('parses logical OR', () => {
            expect(parse('true || true')()).toBe(true);
            expect(parse('true || false')()).toBe(true);
            expect(parse('false || false')()).toBe(false);
        })
        it('parses multiple ANDs', () => {
            expect(parse('true && true && true')()).toBe(true);
            expect(parse('true && true && false')()).toBe(false);
        })
        it('parses multiple ORs', () => {
            expect(parse('true || true || true')()).toBe(true);
            expect(parse('true || false || false')()).toBe(true);
            expect(parse('false || true || true')()).toBe(true);
            expect(parse('false || false || false')()).toBe(false);
        })

        it('short-circuits AND', () => {
            var invoked;
            var scope = { fn: function () { invoked = true } }
            parse('false && fn()')(scope);
            expect(invoked).toBeUndefined();
        })

        it('short-circuits OR', () => {
            var invoked;
            var scope = { fn: function () { invoked = true } }
            parse('true || fn()')(scope);
            expect(invoked).toBeUndefined();
        })

        it('parses AND with a higher precedence than OR', () => {
            expect(parse('false || true && false')()).toBe(false);
        })

        it('parses OR with a lower precedence than equality', () => {
            expect(parse('1 === 2 || 2 === 2')()).toBeTruthy();
        })

        it('parses the ternary expression', () => {
            expect(parse('a === 42 ? true : false')({ a: 42 })).toBe(true);
            expect(parse('a === 42 ? true : false')({ a: 43 })).toBe(false);
        })
        it('parses OR with a higher precedence than ternary', () => {
            expect(parse('0 || 1 ? 0 || 2 : 0 || 3')()).toBe(2);
        })

        it('parses nested ternaries', () => {
            expect(parse('a === 42 ? b === 42 ? "a and b" : "a" : c === 42 ? "c" : "none"')({
                a: 44,
                b: 43,
                c: 42
            })).toBe('c');
        })

        it('parses parentheses altering precedence order', () => {
            expect(parse('21 * (3-1)')()).toBe(42);
            expect(parse('false && (true || true)')()).toBe(false);
            expect(parse('-((a % 2) === 0 ? 1 : 2)')({ a: 42 })).toBe(-1);
        })
        it('parses several statements', () => {
            var scope = {};
            parse('a = 1; b = 2; c = 3')(scope)
            expect(scope).toEqual({
                a: 1,
                b: 2,
                c: 3
            });
        })

        it('returns the value of the last return', () => {
            expect(parse('a = 1; b = 2; a + b')({})).toBe(3);
        })
    })

    describe('Integration with Scopes', () => {
        it('returns the function itself when given one', () => {
            var fn = function () { }
            expect(parse(fn)).toBe(fn);
        })

        it('marks integers literal', () => {
            var fn = parse('42');
            expect(fn.literal).toBe(true);
        })
        it('marks strings literal', () => {
            var fn = parse('"naba"');
            expect(fn.literal).toBe(true);
        })
        it('marks booleans literal', () => {
            var fn = parse('true');
            expect(fn.literal).toBe(true);
        })
        it('marks arrays literal', () => {
            var fn = parse('[1, 2, aVariable]');
            expect(fn.literal).toBe(true);
        })
        it('marks objects literal', () => {
            var fn = parse('{a: 1, b: aVariable}');
            expect(fn.literal).toBe(true);
        })
        it('marks unary expressions non-literal', () => {
            var fn = parse('!false');
            expect(fn.literal).toBe(false);
        })
        it('marks binary expressions non-literal', () => {
            var fn = parse('1 + 2');
            expect(fn.literal).toBe(false);
        })
        it('marks integer constant', () => {
            var fn = parse('42');
            expect(fn.constant).toBe(true);
        })
        it('marks strings constant', () => {
            var fn = parse('"naba"');
            expect(fn.constant).toBe(true);
        })
        it('marks booleans constant', () => {
            var fn = parse('false');
            expect(fn.constant).toBe(true);
        })
        it('marks identifiers non-constant', () => {
            var fn = parse('a');
            expect(fn.constant).toBe(false);
        })
        it('marks arrays constant when elements are constant', () => {
            expect(parse('[1, true, "bom dia"]').constant).toBe(true);
            expect(parse('[1, [true, ["bom dia"]]]').constant).toBe(true);
            expect(parse('[1, true, a]').constant).toBe(false);
            expect(parse('[1, [true, [a]]]').constant).toBe(false);
        })
        it('marks objects constant when elements are constant', () => {
            expect(parse('{a: 1, b: true, c: "bom dia"}').constant).toBe(true);
            expect(parse('{a: 1, b: { c: "bom dia"}}').constant).toBe(true);
            expect(parse('{a: 1, b: true, c: a}').constant).toBe(false);
            expect(parse('{a: 1, b: { c: a}}').constant).toBe(false);
        })

        it('marks this and çlocals as a non-constant', () => {
            expect(parse('this').constant).toBe(false);
            expect(parse('çlocals').constant).toBe(false);
        })

        it('marks non-computed lookup constant when object is constant', () => {
            expect(parse('{a: 1}.a').constant).toBe(true);
            expect(parse('obj.a').constant).toBe(false);
        })

        it('marks computed lookup constant when object and key are constant', () => {
            expect(parse('{a: 1}["a"]').constant).toBe(true);
            expect(parse('obj["a"]').constant).toBe(false);
            expect(parse('{a: 1}[something]').constant).toBe(false);
            expect(parse('obj[a]').constant).toBe(false);
        })

        it('marks function calls non-constant', () => {
            expect(parse('aFn()').constant).toBe(false);
        })

        it('marks filters constant if arguments are', () => {
            register('aFilter', function () {
                return function () {
                    return identity;
                }
            });
            expect(parse('[1,2,3] íí aFilter').constant).toBe(true);
            expect(parse('[1,2,a] íí aFilter').constant).toBe(false);
            expect(parse('[1,2,3] íí aFilter:42').constant).toBe(true);
            expect(parse('[1,2,3] íí aFilter:a').constant).toBe(false);
        })

        it('marks assignment constant when both sides are', () => {
            expect(parse('1 = 2').constant).toBe(true);
            expect(parse('a = true').constant).toBe(false);
            expect(parse('a = 1').constant).toBe(false);
            expect(parse('a = b').constant).toBe(false);
        })
        it('marks unary constant if no identifier', () => {
            expect(parse('!a').constant).toBe(false);
            expect(parse('+1').constant).toBe(true);
            expect(parse('!1').constant).toBe(true);
        })
        it('marks binary constant when both sides are', () => {
            expect(parse('1 + 2').constant).toBe(true);
            expect(parse('1 + 2').literal).toBe(false);
            expect(parse('1 + true').constant).toBe(true);
            expect(parse('1 + "true"').constant).toBe(true);
            expect(parse('1 + a').constant).toBe(false);
        })
        it('marks logical constant when both sides are', () => {
            expect(parse('true && false').constant).toBe(true);
            expect(parse('true && false').literal).toBe(false);
            expect(parse('a && true').constant).toBe(false);
            expect(parse('a && false').constant).toBe(false);
            expect(parse('b && a').constant).toBe(false);
        })
        it('marks ternary constant when all arguments are', () => {
            expect(parse('true ? 1 : 2').constant).toBe(true);
            expect(parse('true ? 1 : 2').literal).toBe(false);
            expect(parse('a ? 1 : 2').constant).toBe(false);
            expect(parse('true ? a : 2').constant).toBe(false);
            expect(parse('"naba" ? a : 2').constant).toBe(false);
            expect(parse('a ? b : c').constant).toBe(false);
        })


    })
})