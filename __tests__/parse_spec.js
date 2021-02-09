import parse from '../src/parse'

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





})