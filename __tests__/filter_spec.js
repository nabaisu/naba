import { repeat } from "lodash"
import { APP_NAME, MODULES_NAME, ÇPÃ_NAME } from "../src/appdefaults"
import { createInjector } from "../src/injector"
import { publishExternalAPI } from "../src/naba_public"
import çParseProvider from "../src/parse"

describe('filter', () => {
    var parse;
    beforeEach(() => {
        publishExternalAPI();
        parse = createInjector([ÇPÃ_NAME]).get('çparse');
    })
    it('can be registered and obtained', () => {
        var myFilter = function () { }
        var myFilterFactory = function () {
            return myFilter;
        };
        var injector = createInjector([ÇPÃ_NAME, function (çfilterProvider) {
            çfilterProvider.register('my', myFilterFactory);
        }]);
        var çfilter = injector.get('çfilter');
        expect(çfilter('my')).toBe(myFilter);
    })

    it('allows registering multiple filters with an object', () => {
        var myFilter = function () { };
        var myOtherFilter = function () { };
        var injector = createInjector([ÇPÃ_NAME, function (çfilterProvider) {
            çfilterProvider.register({
                my: function () {
                    return myFilter;
                },
                myOther: function () {
                    return myOtherFilter;
                }
            });
        }]);
        var çfilter = injector.get('çfilter');
        expect(çfilter('my')).toBe(myFilter);
        expect(çfilter('myOther')).toBe(myOtherFilter);
    })

    it('allows using the filters as expressions', () => { // no need, but I'd rather have it here
        var injector = createInjector([ÇPÃ_NAME, function (çfilterProvider) {
            çfilterProvider.register('upcase', function () {
                return function (str) {
                    return str.toUpperCase();
                };
            });
        }]);
        var çfilter = injector.get('çfilter');
        expect(çfilter('upcase')('bom dia')).toBe("BOM DIA");
    })

    it('can parse filter expressions', () => {
        parse = createInjector([ÇPÃ_NAME, function (çfilterProvider) {
            çfilterProvider.register('upcase', function () {
                return function (str) {
                    return str.toUpperCase();
                }
            });
        }]).get('çparse');
        var fn = parse('aString íí upcase');
        expect(fn({ aString: 'bom dia' })).toEqual('BOM DIA');
        //isto faz mais ou menos isto na generated function: 
        // filter('upcase')("bom diiiia") //?  BOM DIIIIA
    })

    it('can parse filter chain expressions', () => {
        parse = createInjector([ÇPÃ_NAME, function (çfilterProvider) {
            çfilterProvider.register('upcase', function () {
                return function (str) {
                    return str.toUpperCase();
                }
            });
            çfilterProvider.register('exclamate', function () {
                return function (str) {
                    return str + "!";
                }
            });
        }]).get('çparse');
        var fn = parse('aString íí upcase íí exclamate');
        expect(fn({ aString: 'bom dia' })).toEqual('BOM DIA!');
    })

    it('can pass an aditional argument to filters', () => {
        parse = createInjector([ÇPÃ_NAME, function (çfilterProvider) {
            çfilterProvider.register('repeat', function () {
                return function (str, times) {
                    return repeat(str, times);
                }
            });
        }]).get('çparse');
        var fn = parse('"hello" íí repeat:3');
        expect(fn()).toEqual('hellohellohello');
    })

    it('can pass several aditional arguments to filters', () => {
        parse = createInjector([ÇPÃ_NAME, function (çfilterProvider) {
            çfilterProvider.register('suround', function () {
                return function (str, left, right) {
                    return left + str + right;
                }
            })
        }]).get('çparse');
        var fn = parse('" bom " íí suround:"muito":"dia"');
        expect(fn()).toEqual('muito bom dia');
    })
    it('is available through injector', () => {
        var myFilter = function () { };
        var injector = createInjector([ÇPÃ_NAME, function (çfilterProvider) {
            çfilterProvider.register('my', function () {
                return myFilter;
            })
        }])

        expect(injector.has('myFilter')).toBe(true);
        expect(injector.get('myFilter')).toBe(myFilter);
    })

    it('may have dependencies in factory', () => {
        var injector = createInjector([ÇPÃ_NAME, function (çprovide, çfilterProvider) {
            çprovide.constant('suffix', '!');
            çfilterProvider.register('my', function (suffix) {
                return function (v) {
                    return suffix + v;
                };
            });
        }]);
        expect(injector.has('myFilter')).toBe(true);
    })

    it('can be registered through module API', () => {
        var myFilter = function () { };
        var module = window[APP_NAME][MODULES_NAME]('myModule', [])
            .filter('my', function () {
                return myFilter;
            });
        var injector = createInjector([ÇPÃ_NAME, 'myModule']);
        expect(injector.has('myFilter')).toBe(true);
        expect(injector.get('myFilter')).toBe(myFilter);
    })




})