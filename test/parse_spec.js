'use strict'

var parse = require('../src/parse');

describe('parse', function(){
    it('can parse an integer', function(){
        var fn = parse("42");
        //console.log(fn.toString());
        expect(fn).toBeDefined();
        expect(fn()).toBe(42);
    })

    it('can parse a floating point number', function(){
        var fn = parse('42.011')
        //console.log(fn.toString());
        expect(fn).toBeDefined();
        expect(fn()).toBe(42.011)
    })

    it('can parse a floating point starting with the dot', function(){
        var fn = parse('.042')
        expect(fn()).toBe(0.042)
    })

    it('can parse a number in scientifc notation', function(){
        var fn = parse('42e3')
        expect(fn()).toBe(42000)
    })

    it('can parse scientifc notation with a float coefficient', function(){
        var fn = parse('.42e2')
        expect(fn()).toBe(42)
    })

    it('can parse scientifc notation with negative quotient', function(){
        var fn = parse('42000e-3')
        expect(fn()).toBe(42)
    })

    it('can parse scientifc notation with positive sign', function(){
        var fn = parse('.42e+2')
        expect(fn()).toBe(42)
    })

    it('can parse upper case scientific notation', function(){
        var fn = parse('.42E2');
        expect(fn()).toBe(42);
    })

    it('will not parse invalid scientific notation', function(){
        expect(function() { parse('42e-'); }).toThrow();
        expect(function() { parse('42e-a'); }).toThrow();
    })

    it('can parse single quoted strings',function(){
        var fn = parse("'me'");
        //console.log(fn.toString());
        expect(fn()).toBe("me");
    })

    it('can parse double quoted strings',function(){
        var fn = parse('"ola"');
        //console.log(fn.toString());
        expect(fn()).toBe("ola");
    })

    it('will not parse a string with mismatching quotes', function(){
        expect(function(){parse('"abc\'')}).toThrow();
    })

    it('can parse a string with a single quotes inside', function(){
        var fn = parse("'ola\\\'amigo'");
        //console.log(fn.toString());
        expect(fn()).toEqual("ola\'amigo");
    })

    it('can parse a string with double quotes inside', function(){
        var fn = parse('"ola\\\"amigo"');
        //console.log(fn.toString());
        expect(fn()).toEqual("ola\"amigo");
    })

    it('will parse a string with unicode escapes', function(){
        var fn = parse('"\\u00A0"')
        expect(fn()).toEqual('\u00A0');
    })
    
    it('will not parse a string with invalid unicode escapes', function(){
        expect(function(){ parse('"\\u090T0"')}).toThrow();
    })
    
    it('will parse null', function(){
        var fn = parse('null')
        expect(fn()).toBe(null);
    })

    it('will parse true', function(){
        var fn = parse('true')
        expect(fn()).toBe(true);
    })

    it('will parse false', function(){
        var fn = parse('false')
        expect(fn()).toBe(false);
    })

    it('ignores whitespaces', function(){
        var fn = parse(' \n42 ')
        expect(fn()).toEqual(42);
    })

    it('parses an empty array', function(){
        var fn = parse('[]')
        expect(fn()).toEqual([]);
    })

    it('will parse a non-empty array', function(){
        var fn = parse('[1, "two", [3], true]')
        expect(fn()).toEqual([1, "two", [3], true]);        
    })

    it('will parse an array with trailing comma', function(){
        var fn = parse('[1,2,3,]')
        expect(fn()).toEqual([1,2,3])
    })

    it('will parse an empty object', function(){
        var fn = parse('{}')
        expect(fn()).toEqual({})
    })

    it('will parse a non-empty object', function(){
        var fn = parse('{"a key": 1, \'another-key\': 2}')
        expect(fn()).toEqual({'a key': 1, 'another-key': 2})
    })

})