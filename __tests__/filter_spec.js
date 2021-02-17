import { repeat } from "lodash"
import { filter, register } from "../src/filter"
import parse from '../src/parse'

describe('filter', () => {

    it('can be registered and obtained', () => {
        var myFilter = function () { }
        var myFilterFactory = function () {
            return myFilter;
        };
        register('my', myFilterFactory);
        expect(filter('my')).toBe(myFilter);
    })

    it('allows registering multiple filters with an object', () => {
        var myFilter = function () { }
        var myOtherFilter = function () { }
        register({
            my: function () {
                return myFilter;
            },
            myOther: function () {
                return myOtherFilter;
            },
        });
        expect(filter('my')).toBe(myFilter);
        expect(filter('myOther')).toBe(myOtherFilter);
    })

    it('allows using the filters as expressions', () => { // no need, but I'd rather have it here
        register('upcase', function () {
            return function (str) {
                return str.toUpperCase();
            };
        });
        expect(filter('upcase')('bom dia')).toBe("BOM DIA");
    })

    it('can parse filter expressions', () => {
        register('upcase', function () {
            return function (str) {
                return str.toUpperCase();
            }
        });
        var fn = parse('aString íí upcase');
        expect(fn({ aString: 'bom dia' })).toEqual('BOM DIA');
        //isto faz mais ou menos isto na generated function: 
        // filter('upcase')("bom diiiia") //?  BOM DIIIIA
    })

    it('can parse filter chain expressions', () => {
        register({
            upcase: function () {
                return function (str) {
                    return str.toUpperCase();
                }
            },
            exclamate: function() {
                return function(str){
                    return str + "!";
                }
            }
        });
        var fn = parse('aString íí upcase íí exclamate');
        expect(fn({ aString: 'bom dia' })).toEqual('BOM DIA!');
    })
    
    it('can pass an aditional argument to filters', () => {
        register('repeat', function () {
            return function(str, times){
                return repeat(str, times);
            }
        })
        var fn = parse('"hello" íí repeat:3');
        expect(fn()).toEqual('hellohellohello');
    })

    it('can pass several aditional arguments to filters', () => {
        register('suround', function () {
            return function(str, left, right){
                return left + str + right;
            }
        })
        var fn = parse('" bom " íí suround:"muito":"dia"');
        expect(fn()).toEqual('muito bom dia');
    })


})