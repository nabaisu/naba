import { createInjector } from "../src/injector";
import { setupModuleLoader } from "../src/loader";
import { APP_NAME, MODULES_NAME } from "../src/appdefaults";
import { constant } from "lodash";

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

    describe('Annotate', () => {
        it('returns the çinjector annotation of a function when it has one', () => {
            var injector = createInjector([]);

            var fn = function () { }
            fn.çinject = ['a', 'b'];
            expect(injector.annotate(fn)).toEqual(['a', 'b']);
        })

        it('returns the array-style annotations of a function', () => {
            var injector = createInjector([]);

            var fn = ['a', 'b', function () { }]
            expect(injector.annotate(fn)).toEqual(['a', 'b']);
        })

        it('returns an empty array for a non-annotated 0-arg function', () => {
            var injector = createInjector([]);

            var fn = function () { }
            expect(injector.annotate(fn)).toEqual([]);
        })

        it('returns annotations parsed from function args when not annotated', () => {
            var injector = createInjector([]);

            var fn = function (a, b) { }
            expect(injector.annotate(fn)).toEqual(['a', 'b']);
        })

        it('strips commented arguments lists when parsing', () => {
            var injector = createInjector([]);

            var fn = function (a, /* b, */ c) { }
            expect(injector.annotate(fn)).toEqual(['a', 'c']);
        })
        it('strips several commented arguments lists when parsing', () => {
            var injector = createInjector([]);

            var fn = function (a, /* b, */ c /*, d */) { }
            expect(injector.annotate(fn)).toEqual(['a', 'c']);
        })

        it('strips // commented arguments lists when parsing', () => {
            var injector = createInjector([]);

            var fn = function (a, // b,
                c
            ) { }
            expect(injector.annotate(fn)).toEqual(['a', 'c']);
        })

        it('strips surrounding underscores from argument names when parsing', () => {
            var injector = createInjector([]);

            var fn = function (a, _b_, _c, d_, an_argument) { }
            expect(injector.annotate(fn)).toEqual(['a', 'b', '_c', 'd_', 'an_argument']);
        })

        it('throws when using a non-annotated fn in strict mode', () => {
            var injector = createInjector([], true);

            var fn = function (a, b, c) { }
            expect(() => {
                injector.annotate(fn)
            }).toThrow();
        })

        it('invokes an array-annotated function with dependency injection', () => {
            var module = window[APP_NAME][MODULES_NAME]('myModule', [])
            module.constant('a', 20);
            module.constant('b', 22);
            var injector = createInjector(['myModule']);

            var fn = ['a', 'b', function (aa, bb) { return aa + bb }]
            expect(injector.invoke(fn)).toEqual(42);
        })

        it('invokes a non-annotated function with dependency injection', () => {
            var module = window[APP_NAME][MODULES_NAME]('myModule', [])
            module.constant('a', 20);
            module.constant('b', 22);
            var injector = createInjector(['myModule']);

            var fn = function (a, b) { return a + b };
            expect(injector.invoke(fn)).toEqual(42);
        })

        it('instantiates an annotated constructor function', () => {
            var module = window[APP_NAME][MODULES_NAME]('myModule', [])
            module.constant('a', 20);
            module.constant('b', 22);
            var injector = createInjector(['myModule']);

            function Type(one, two) {
                this.result = one + two;
            }
            Type.çinject = ['a', 'b'];

            var instance = injector.instantiate(Type);
            expect(instance.result).toBe(42);
        })

        it('instantiates an array annotation constructor function', () => {
            var module = window[APP_NAME][MODULES_NAME]('myModule', [])
            module.constant('a', 20);
            module.constant('b', 22);
            var injector = createInjector(['myModule']);

            function Type(one, two) {
                this.result = one + two;
            }

            var instance = injector.instantiate(['a', 'b', Type]);
            expect(instance.result).toBe(42);
        })

        it('institiates a non-annotated constructor function', () => {
            var module = window[APP_NAME][MODULES_NAME]('myModule', [])
            module.constant('a', 20);
            module.constant('b', 22);
            var injector = createInjector(['myModule']);

            function Type(a, b) {
                this.result = a + b;
            }

            var instance = injector.instantiate(Type);
            expect(instance.result).toBe(42);
        })

        it('uses the prototype of the constructor when instantiating', () => {
            function BaseType() { }
            BaseType.prototype.getValue = constant(42);

            function Type() { this.v = this.getValue(); }
            Type.prototype = BaseType.prototype;

            window[APP_NAME][MODULES_NAME]('myModule', [])
            var injector = createInjector(['myModule']);

            var instance = injector.instantiate(Type);
            expect(instance.v).toBe(42);
        })

        it('supports locals when instantiating', () => {
            var module = window[APP_NAME][MODULES_NAME]('myModule', [])
            module.constant('a', 20);
            module.constant('b', 22);
            var injector = createInjector(['myModule']);

            var objToUse = { b: 5 }
            function Type(a, b) {
                this.result = a + b;
            }

            var instance = injector.instantiate(Type, objToUse);
            expect(instance.result).toBe(25);
        })


        describe('Providers', () => {
            it('allows registering a provider and uses its çget', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', {
                    çget: function () {
                        return 42;
                    }
                });
                var injector = createInjector(['myModule']);

                expect(injector.has('a')).toBe(true);
                expect(injector.get('a')).toBe(42);
            })

            it('injects the çget method of a provider', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.constant('a', 39)
                module.provider('b', {
                    çget: function (a) {
                        return a + 3;
                    }
                });
                var injector = createInjector(['myModule']);

                expect(injector.get('b')).toBe(42);
            })

            it('injects the çget of a provider lazily', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('b', {
                    çget: function (a) {
                        return a + 3;
                    }
                });

                module.provider('a', { çget: constant(39) });

                var injector = createInjector(['myModule']);

                expect(injector.get('b')).toBe(42);
            })

            it('instantiates a dependency only once', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('b', { çget: function () { return {}; } });

                var injector = createInjector(['myModule']);

                expect(injector.get('b')).toBe(injector.get('b'));
            })

            it('notifies the user about a circular dependency', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', { çget: function (b) { } });
                module.provider('b', { çget: function (c) { } });
                module.provider('c', { çget: function (a) { } });

                var injector = createInjector(['myModule']);

                expect(function () {
                    injector.get('b')
                }).toThrow('Circular dependency found: b <- a <- c <- b');
            })

            it('cleans up the circular marker when instantiating fails', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', { çget: function () { throw 'Failing Instantiating!' } });

                var injector = createInjector(['myModule']);

                expect(function () {
                    injector.get('a')
                }).toThrow('Failing Instantiating!');
                expect(function () {
                    injector.get('a')
                }).toThrow('Failing Instantiating!');
            })

            it('instantiates a provider if given as a constructor function', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', function AProvider() {
                    this.çget = function () { return 42; }
                });

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(42);
            })

            it('injects the given provider constructor function', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.constant('b', 2);
                module.provider('a', function AProvider(b) {
                    this.çget = function () { return b + 40; }
                });

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(42);
            })

            it('injects other provider with to a provider constructor function', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', function AProvider() {
                    var value = 1;
                    this.setValue = function (v) { value = v; };
                    this.çget = function () { return value; }
                });
                module.provider('b', function BProvider(aProvider) {
                    aProvider.setValue(2);
                    this.çget = function () { }
                });

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(2);
            })

            it('does not inject an instance to a provider constructor function', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', function AProvider() {
                    this.çget = function () { return 1; }
                });
                module.provider('b', function BProvider(a) {
                    this.çget = function () { return a }
                });

                expect(function () {
                    createInjector(['myModule'])
                }).toThrow()
            })

            it('does not inject providers to a çget method', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', function AProvider() {
                    this.çget = function () { return 1; }
                });
                module.provider('b', function BProvider(aProvider) {
                    this.çget = function (aProvider) { return aProvider.çget() }
                });

                var injector = createInjector(['myModule']);

                expect(function () {
                    injector.get('b');
                }).toThrow()
            })

            it('does not inject a provider to invoke', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', function AProvider() {
                    this.çget = function () { return 1; }
                });

                var injector = createInjector(['myModule']);

                expect(function () {
                    injector.invoke(function (aProvider) { });
                }).toThrow()
            })

            it('does not give access to providers through get', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', function AProvider() {
                    this.çget = function () { return 1; }
                });

                var injector = createInjector(['myModule']);

                expect(function () {
                    injector.get('aProvider');
                }).toThrow()
            })

            it('registers constants first to make them available to providers', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.provider('a', function AProvider(c) {
                    this.çget = function () { return c; }
                });
                module.constant('c', 42);
                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(42);
            })

        })

        describe('High Level Dependency', () => {
            it('allows injecting the instance injector to çget', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.constant('a', 42)
                module.provider('b', function BProvider() {
                    this.çget = function (çinjector) {
                        return çinjector.get('a');
                    }
                });
                var injector = createInjector(['myModule']);

                expect(injector.get('b')).toBe(42);
            });

            it('allows injecting the provider injector to çget', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.provider('a', function AProvider() {
                    this.value = 42;
                    this.çget = function () { return this.value; }
                })
                module.provider('b', function BProvider(çinjector) {
                    var aProvider = çinjector.get('aProvider'); // because the provider is the "a", plus the word "Provider"
                    this.çget = function () {
                        return aProvider.value;
                    }
                });
                var injector = createInjector(['myModule']);

                expect(injector.get('b')).toBe(42);
            });

            it('allows injecting the çprovide service to providers', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.provider('a', function AProvider(çprovide) {
                    çprovide.constant('b', 40)
                    this.çget = function (b) { return 2 + b; }
                })

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(42);
            });

            it('does not allows injecting the çprovide service to çget', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.provider('a', function AProvider() {
                    this.çget = function (çprovide) { }
                })

                var injector = createInjector(['myModule']);

                expect(function () {
                    injector.get('a')
                }).toThrow();
            });

            it('runs config blocks when the injector is created', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                var hasRun = false;
                module.config(function () {
                    hasRun = true;
                })

                var injector = createInjector(['myModule']);

                expect(hasRun).toBe(true);
            });

            it('injects config blocks with provider injector', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.config(function (çprovide) {
                    çprovide.constant('a', 42)
                })

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(42);
            });
            it('allows registering config blocks before providers', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.config(function (bProvider) { })
                module.provider('b', function () {
                    this.çget = constant(42)
                })

                var injector = createInjector(['myModule']);

                expect(injector.get('b')).toBe(42);
            });

            it('runs a config block added during module registration', () => {
                window[APP_NAME][MODULES_NAME]('myModule', [], function (çprovide) {
                    çprovide.constant('a', 42);
                })

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(42);
            });

            it('runs run blocks when the injector is created', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                var hasRun = false;
                module.run(function () {
                    hasRun = true;
                })

                createInjector(['myModule']);

                expect(hasRun).toBe(true);
            });

            it('injects run blocks with the instance injector', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.provider('a', { çget: constant(42) })
                var gotA;
                module.run(function (a) {
                    gotA = a;
                })

                createInjector(['myModule']);

                expect(gotA).toBe(42);
            });

            it('configures all modules before running any run blocks', () => {
                var module1 = window[APP_NAME][MODULES_NAME]('myModule', [])

                module1.provider('a', { çget: constant(4) })
                var result;
                module1.run(function (a, b) {
                    result = a + b;
                })

                var module2 = window[APP_NAME][MODULES_NAME]('myOtherModule', [])
                module2.provider('b', { çget: constant(38) })

                createInjector(['myModule', 'myOtherModule']);

                expect(result).toBe(42);
            });

            it('runs a function module dependency as a config block', () => {
                var functionModule = function (çprovide) {
                    çprovide.constant('a', 42);
                }

                window[APP_NAME][MODULES_NAME]('myModule', [functionModule])

                var injector = createInjector(['myModule']);

                expect(injector.get("a")).toBe(42);
            });

            it('runs a function module with array injection as a config block', () => {
                var functionModule = ['çprovide', function (çprovide) {
                    çprovide.constant('a', 42);
                }]

                window[APP_NAME][MODULES_NAME]('myModule', [functionModule])

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(42);
            });

            it('supports returning a run block from a function module', () => {
                var result;
                var functionModule = function (çprovide) {
                    çprovide.constant('a', 42);
                    return function (a) {
                        result = a;
                    }
                };

                window[APP_NAME][MODULES_NAME]('myModule', [functionModule])

                createInjector(['myModule']);

                expect(result).toBe(42);
            });

            it('only loads function modules once', () => {
                var loadedTimes = 0;
                var functionModule = function () {
                    loadedTimes++;
                };

                window[APP_NAME][MODULES_NAME]('myModule', [functionModule, functionModule])

                createInjector(['myModule']);

                expect(loadedTimes).toBe(1);
            }); // this is because of the hash map, it checks by name, as an object,
            // so we need a data structure that stores by key-value, a hash map

            it('allows registering a factory', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])
                module.factory('a', function () { return 42; });

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(42);
            });
            it('injects a factory function with instances', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.factory('a', function () { return 40; });
                module.factory('b', function (a) { return a + 2; });

                var injector = createInjector(['myModule']);

                expect(injector.get('b')).toBe(42);
            });
            it('only calls a factory function once', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.factory('a', function () { return {}; });

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(injector.get('a'));
            });
            it('forces a factory to return a value', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.factory('a', function () { });
                module.factory('b', function () { return null; });

                var injector = createInjector(['myModule']);

                expect(function () {
                    injector.get('a')
                }).toThrow();
                expect(injector.get('b')).toBeNull();
            });

            it('allows registering a value', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.value('a', 42);

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBe(42);
            });
            it('does not make values available to config blocks', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.value('a', 42);
                module.config(function (a) { });

                expect(function () {
                    createInjector(['myModule']);
                }).toThrow();
            });

            it('allows an undefined value', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.value('a', undefined);

                var injector = createInjector(['myModule']);

                expect(injector.get('a')).toBeUndefined();
            });
            it('allows registering a service', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.service('aService', function MyService() {
                    this.getValue = function () { return 42; };
                });

                var injector = createInjector(['myModule']);

                expect(injector.get('aService').getValue()).toBe(42);
            });

            it('injects service constructors with instances', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.value('theValue', 42);
                module.service('aService', function MyService(theValue) {
                    this.getValue = function () { return theValue; };
                });

                var injector = createInjector(['myModule']);

                expect(injector.get('aService').getValue()).toBe(42);
            });
            it('only instantiates the service once', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.service('aService', function MyService() { });

                var injector = createInjector(['myModule']);

                expect(injector.get('aService')).toBe(injector.get('aService'));
            });
            it('allows changing an instance using a decorator', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.factory('aValue', function () { return { aKey: 42 }; });
                module.decorator('aValue', function(çdelegate){
                    çdelegate.decoratedKey = 43;
                })
                var injector = createInjector(['myModule']);

                expect(injector.get('aValue').aKey).toBe(42);
                expect(injector.get('aValue').decoratedKey).toBe(43);
            });

            it('allows multiple decorators per service', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.factory('aValue', function () { return { }; });
                module.decorator('aValue', function(çdelegate){
                    çdelegate.decoratedKey = 43;
                })
                module.decorator('aValue', function(çdelegate){
                    çdelegate.amigo = 44;
                })
                var injector = createInjector(['myModule']);

                expect(injector.get('aValue').decoratedKey).toBe(43);
                expect(injector.get('aValue').amigo).toBe(44);
            });

            it('uses dependency injection with decorators', () => {
                var module = window[APP_NAME][MODULES_NAME]('myModule', [])

                module.factory('aValue', function () { return { }; });
                module.constant('a', 42);
                module.decorator('aValue', function(a, çdelegate){
                    çdelegate.decoratedKey = a;
                })

                var injector = createInjector(['myModule']);

                expect(injector.get('aValue').decoratedKey).toBe(42);
            });






        });

    });
});