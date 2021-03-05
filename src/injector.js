import { create, forEach, isArray, isFunction, isString, last, map } from "lodash";
import { APP_NAME, MODULES_NAME } from "./appdefaults";

function createInjector(modulesToLoad, strictMode) {
    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
    var STRIP_COMMENTS = /(\/\/.*$)|(\/\*.*?\*\/)/mg;
    var INSTANTIATING = {};
    
    var providerCache = {};
    var providerInjector = createInternalInjector(providerCache, function () {
        throw `Unkown Provider: ${path.join(' <- ')}` 
    });
    
    var instanceCache = {};
    var instanceInjector = createInternalInjector(instanceCache, function(name){
        var provider = providerInjector.get(name + 'Provider');
        return instanceInjector.invoke(provider.çget, provider);
    })
    
    var loadedModules = {};
    var path = []; // isto é esperto para xuxu porque nos dá para ver qual é a dependencia que está em loop
    var strictDI = (strictMode === true)

    var çprovide = {
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
        }

    };

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
            instantiate: instantiate
        }
    
    }

    forEach(modulesToLoad, function loadModules(moduleName) { // this will load the modules
        if (!loadedModules.hasOwnProperty(moduleName)) {
            loadedModules[moduleName] = true;
            var module = window[APP_NAME][MODULES_NAME](moduleName)
            // here should go the requires
            forEach(module.requires, loadModules); // inteligente para xuxu!!! chama a função acima e assim, fica recursivo
            forEach(module._invokeQueue, function (invokeArgs) {
                var method = invokeArgs[0];
                var args = invokeArgs[1];
                çprovide[method].apply(çprovide, args); // apply because args is an array
            })
        }
    })

    return instanceInjector;
}

export { createInjector }