import { forEach, isString, map } from "lodash";
import { APP_NAME, MODULES_NAME } from "./appdefaults";

function createInjector(modulesToLoad) {
    var cache = {};
    var loadedModules = {};

    var çprovide = {
        constant: function (key, value) {
            if (key === 'hasOwnProperty') throw 'The constant hasOwnProperty is not allowed to register'
            cache[key] = value;
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

    function invoke(fn) {
        var args = map(fn.çinject, function (token) {
            if (isString(token)) {
                return cache[token];
            } else {
                throw `Incorrect injection token! Expected a string, got: ${token}`
            }
        });
        return fn.apply(null, args);
    }

    return {
        has(key) {
            return cache.hasOwnProperty(key);
        },
        get(value) {
            return cache[value];
        },
        invoke: invoke
    }
}

export { createInjector }