import { createInjector } from "../src/injector";
import { setupModuleLoader } from "../src/loader";
import { APP_NAME, MODULES_NAME } from "../src/appdefaults";

describe('Injector', () => {
    beforeEach(() => {
        delete window[APP_NAME];
        setupModuleLoader(window);
    })
    it('can be created', () => {
        var injector = createInjector([])
        expect(injector).toBeDefined();
    })

    it('has a constant that has been registered to a module', () => {
        var module = window[APP_NAME][MODULES_NAME]('something', [])
        module.constant('aConstant', 42);
        var injector = createInjector(['something'])
        expect(injector.has('aConstant')).toBe(true);
    })

    it('has a constant that has been registered to a module', () => {
        window[APP_NAME][MODULES_NAME]('something', [])
        var injector = createInjector(['something'])
        expect(injector.has('someConstant')).toBe(false);
    })
    it('should not be able to register a property called hasOwnProperty', () => {
        var module = window[APP_NAME][MODULES_NAME]('something', [])
        module.constant('hasOwnProperty', 42)
        expect(function () {
            createInjector(['something']);
        }).toThrow();
    })
    it('can return a registered constant', () => {
        var module = window[APP_NAME][MODULES_NAME]('something', [])
        module.constant('aConstant', 42);
        var injector = createInjector(['something'])
        expect(injector.get('aConstant')).toBe(42);
    })

    it('loads multiple modules', () => {
        var modA = window[APP_NAME][MODULES_NAME]('a', [])
        var modB = window[APP_NAME][MODULES_NAME]('b', [])
        modA.constant('aConstant', 42);
        modB.constant('bConstant', 43);
        var injector = createInjector(['a', 'b'])
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('bConstant')).toBe(true);
    })

    it('loads the required modules of a module', () => {
        var modA = window[APP_NAME][MODULES_NAME]('a', [])
        var modB = window[APP_NAME][MODULES_NAME]('b', ['a'])
        modA.constant('aConstant', 42);
        modB.constant('bConstant', 43);
        var injector = createInjector(['b'])
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('bConstant')).toBe(true);
    })

    it('loads the transitively required modules of a module', () => {
        var mod1 = window[APP_NAME][MODULES_NAME]('a', [])
        var mod2 = window[APP_NAME][MODULES_NAME]('b', ['a'])
        var mod3 = window[APP_NAME][MODULES_NAME]('c', ['b'])
        mod1.constant('aConstant', 42);
        mod2.constant('bConstant', 43);
        mod3.constant('cConstant', 44);
        var injector = createInjector(['c'])
        expect(injector.has('aConstant')).toBe(true);
        expect(injector.has('bConstant')).toBe(true);
        expect(injector.has('cConstant')).toBe(true);
    })

    it('loads each module only once', () => {
        window[APP_NAME][MODULES_NAME]('a', ['b'])
        window[APP_NAME][MODULES_NAME]('b', ['a'])
        createInjector(['a']);
        // interessante não ter o expect quando há stack overflow
    })

    it('invokes an annotated function with dependency injection', () => {
        var module = window[APP_NAME][MODULES_NAME]('a', [])
        module.constant('aConstant', 20);
        module.constant('bConstant', 22);
        var injector = createInjector(['a']);

        var fn = function (one, two) {
            return one + two
        };

        fn.çinject = ['aConstant', 'bConstant'];

        expect(injector.invoke(fn)).toBe(42);
    })

    it('does not accept non-strings as injection tokens', () => {
        var module = window[APP_NAME][MODULES_NAME]('a', [])
        module.constant('aConstant', 40);
        var injector = createInjector(['a']);

        var fn = function (one, two) {
            return one + two
        };

        fn.çinject = ['aConstant', 2];

        expect(
            function () {
                injector.invoke(fn)
            }
        ).toThrow();
    })

    it('invokes a function with the given this context', () => {
        var module = window[APP_NAME][MODULES_NAME]('a', [])
        module.constant('aConstant', 40);
        var injector = createInjector(['a']);

        var thisToUse = { two: 2 }
        var fn = function (one) {
            return this.two + one;
        };

        fn.çinject = ['aConstant'];
        expect(injector.invoke(fn, thisToUse)).toBe(42);
    })

    it('overrides dependencies with locals when invoking', () => {
        var module = window[APP_NAME][MODULES_NAME]('a', [])
        module.constant('aConstant', 40);
        module.constant('two', 40);
        var injector = createInjector(['a']);

        var overrideObj = {
            two: 2
        }
        var fn = function (one, two) {
            return one + two;
        };

        fn.çinject = ['aConstant', 'two'];
        expect(injector.invoke(fn, null, overrideObj)).toBe(42);
    })





})