import { forEach, isArray, isFunction, isString, last, map } from "lodash";
import { APP_NAME, MODULES_NAME } from "./appdefaults";

function createInjector(modulesToLoad, strictMode) {
    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
    var STRIP_COMMENTS = /(\/\/.*$)|(\/\*.*?\*\/)/mg;

    var cache = {};
    var providerCache = {};
    var instanceCache = {};
    var loadedModules = {};
    var strictDI = (strictMode === true)

    var çprovide = {
        constant: function (key, value) {
            if (key === 'hasOwnProperty') throw 'The constant hasOwnProperty is not allowed to register'
            instanceCache[key] = value;
        },
        provider: function (key, provider) {
            providerCache[key + 'Provider'] =  provider;
        }

    };
    forEach(modulesToLoad, function loadModules(moduleName) {
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
        return fn.apply(self, args);
    }

    function annotate(fn) {
        if (isArray(fn)) {
            return fn.slice(0, fn.length - 1);
        } else if (fn.çinject) {
            return fn.çinject
        } else if (!fn.length) {
            return [];
        } else {
            if (strictDI) throw 'fn is not using explicit annotation and cannot be invoked in strict mode'
            var source = fn.toString().replace(STRIP_COMMENTS, '');
            var argDeclaration = source.match(FN_ARGS); //?
            return map(argDeclaration[1].split(','), arg => {
                return arg.match(FN_ARG)[2]; //?
            })
        }
    }

    function instantiate(Type, locals) {
        var unwrappedType = isArray(Type) ? last(Type) : Type;
        var instance = Object.create(unwrappedType.prototype);
        invoke(Type, instance, locals);
        return instance;
    }

    function getService(name) { // this will only run the invoke function when the value is requested
        if (instanceCache.hasOwnProperty(name)) {
            return instanceCache[name];
        } else if (providerCache.hasOwnProperty(name + 'Provider')) {
            var provider = providerCache[name + 'Provider'];
            var instance = instanceCache[name] = invoke(provider.çget) // interessante, já que isto agora está a ser guardado na outra cache também
            return instance;
        }
    }

    return {
        has(key) { // this will not run the invoke
            return instanceCache.hasOwnProperty(key) ||
                providerCache.hasOwnProperty(key + 'Provider');
        },
        get: getService, // this will run the invoke if there is a provider
        invoke: invoke,
        annotate: annotate,
        instantiate: instantiate
    }
}

export { createInjector }