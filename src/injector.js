import { compact, constant, create, forEach, isArray, isFunction, isString, isUndefined, last, map } from "lodash";
import { APP_NAME, MODULES_NAME } from "./appdefaults";
import { HashMap } from './hash_map';

function createInjector(modulesToLoad, strictMode) {
    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
    var STRIP_COMMENTS = /(\/\/.*$)|(\/\*.*?\*\/)/mg;
    var INSTANTIATING = {};

    var providerCache = {};
    var providerInjector = providerCache.çinjector = createInternalInjector(providerCache, function () {
        throw `Unkown Provider: ${path.join(' <- ')}`
    });

    var instanceCache = {};
    var instanceInjector = instanceCache.çinjector = createInternalInjector(instanceCache, function (name) {
        var provider = providerInjector.get(name + 'Provider');
        return instanceInjector.invoke(provider.çget, provider);
    });

    var loadedModules = new HashMap();
    var path = []; // isto é esperto para xuxu porque nos dá para ver qual é a dependencia que está em loop
    var strictDI = (strictMode === true)

    providerCache.çprovide = {
        constant: function (key, value) {
            if (key === 'hasOwnProperty') throw 'The constant hasOwnProperty is not allowed to register'
            providerCache[key] = value;
            instanceCache[key] = value;
        },
        provider: function (key, provider) {
            if (isFunction(provider)) {
                provider = providerInjector.instantiate(provider);
            }
            providerCache[key + 'Provider'] = provider;
        },
        factory: function (key, factoryFn, enforce) { // this will create a provider and assign the çget function to it, so it will run
            this.provider(key, {
                çget: enforce === false ? factoryFn : enforceReturnValue(factoryFn)
            });
        },
        value: function (key, value) {
            this.factory(key, constant(value), false); // the enforce = false is to not return anything, just assign it
        },
        service: function (key, Constructor) {
            this.factory(key, function () {
                return instanceInjector.instantiate(Constructor);
            })
        },
        decorator: function (serviceName, decoratorFn) {
            var provider = providerInjector.get(serviceName + 'Provider');
            var originalçget = provider.çget;
            provider.çget = function () {
                var instance = instanceInjector.invoke(originalçget, provider);
                instanceInjector.invoke(decoratorFn, null, { çdelegate: instance }); // este çdelegate passa por cima do outro
                return instance;
            }
        },
    };

    function enforceReturnValue(factoryFn) {
        return function () {
            var value = instanceInjector.invoke(factoryFn); // this will run and return us the value of the factory fn
            if (isUndefined(value)) {
                throw 'factory must return a value'
            }
            return value
        }
    }

    function annotate(fn) { // this will return the dependencies found in a given function or array
        if (isArray(fn)) {
            return fn.slice(0, fn.length - 1);
        } else if (fn.çinject) {
            return fn.çinject
        } else if (!fn.length) {
            return [];
        } else {
            if (strictDI) throw 'fn is not using explicit annotation and cannot be invoked in strict mode'
            var source = fn.toString().replace(STRIP_COMMENTS, '');
            var argDeclaration = source.match(FN_ARGS);
            return map(argDeclaration[1].split(','), arg => {
                return arg.match(FN_ARG)[2];
            })
        }
    }

    function createInternalInjector(cache, factoryFn) {
        function getService(name) { // this will only run the invoke function when the value is requested
            if (cache.hasOwnProperty(name)) {
                if (cache[name] === INSTANTIATING) { // isto significa que o instantiating vai ter o mesmo pointer.
                    throw new Error(`Circular dependency found: ${name} <- ${path.join(' <- ')}`);
                }
                return cache[name];
            } else {
                path.unshift(name);
                cache[name] = INSTANTIATING;
                try {
                    return (cache[name] = factoryFn(name));
                } finally {
                    path.shift();
                    if (cache[name] === INSTANTIATING) {
                        delete cache[name];
                    }
                }
            }
        }

        function invoke(fn, self, locals) {
            var args = map(annotate(fn), function (token) {
                if (isString(token)) {
                    return (locals && locals.hasOwnProperty(token)) ?
                        locals[token] :
                        getService(token);
                } else {
                    throw `Incorrect injection token! Expected a string, got: ${token}`
                }
            });

            if (isArray(fn)) {
                fn = last(fn);
            }
            return fn.apply(self, args); // this will run a function with an object attached
            // the args will be parsed by the function and inserted into the dependency
        }

        function instantiate(Type, locals) { // this will run the above functions with a prototype
            var instance = Object.create((isArray(Type) ? last(Type) : Type).prototype);
            invoke(Type, instance, locals);
            return instance;
        }

        return {
            has(name) { // this will not run the invoke
                return cache.hasOwnProperty(name) ||
                    providerCache.hasOwnProperty(name + 'Provider');
            },
            get: getService, // this will run the invoke if there is a provider (an obj with a çget)
            invoke: invoke,
            annotate: annotate,
            instantiate: instantiate,
        }

    }

    function runInvokeQueue(queue) {
        forEach(queue, function (invokeArgs) {
            var service = providerInjector.get(invokeArgs[0]);
            var method = invokeArgs[1];
            var args = invokeArgs[2];
            service[method].apply(service, args);
        })
    }

    var runBlocks = [];
    forEach(modulesToLoad, function loadModules(module) { // this will load the modules
        if (!loadedModules.get(module)) {
            loadedModules.put(module, true);
            if (isString(module)) {
                var module = window[APP_NAME][MODULES_NAME](module)
                // here should go the requires
                forEach(module.requires, loadModules); // inteligente para xuxu!!! chama a função acima e assim, fica recursivo
                runInvokeQueue(module._invokeQueue);
                runInvokeQueue(module._configBlocks);
                runBlocks = runBlocks.concat(module._runBlocks);
            } else if (isFunction(module) || isArray(module)) { // this is because the way invoke was built, to expect either a function or an array
                runBlocks.push(providerInjector.invoke(module));
            }
        }
    });

    forEach(compact(runBlocks), function (runBlock) {
        instanceInjector.invoke(runBlock);
    });

    return instanceInjector;
}

export { createInjector }