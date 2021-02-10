import parse from '../src/parse'
import {constant} from 'lodash'

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
            expect(fn({ something: 3,n: constant(2), aFn: function (first, second, third) { return first + second + third } })).toBe(42);
        })


    })
})