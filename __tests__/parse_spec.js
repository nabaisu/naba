import parse from '../src/parse'
import { constant } from 'lodash'

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
    })
})