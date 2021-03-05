import { APP_NAME, MODULES_NAME } from "./appdefaults";

function setupModuleLoader(window) {
    var modules = {}

    var ensure = function (obj, name, factory) {
        return obj[name] || (obj[name] = factory()) // if he already exists, just let it be, otherwise just assign empty value
    };
    var naba = ensure(window, APP_NAME, Object); // lindo, a factory é o método Object... Object() === new Object()

    var createModule = function (name, requires, modules) {
        if (name === 'hasOwnProperty') throw 'hasOwnProperty is not a valid module name'
        var invokeQueue = [];

        var invokeLater = function (method, arrayMethod) {
            return function(){
                invokeQueue[arrayMethod || 'push']([method, arguments]); // inteligente para xuxu este gajo
                return moduleInstance;
            }
        }
    
        var moduleInstance = {
            name: name,
            requires: requires, 
            constant: invokeLater('constant', 'unshift'),
            provider: invokeLater('provider'),
            _invokeQueue: invokeQueue
        };
        modules[name] = moduleInstance;
        return moduleInstance;
    }

    var getModule = function(name, modules) {
        if (modules.hasOwnProperty(name)){
            return modules[name]
        } else {
            throw `Module ${name} is not available or does not exist`
        }
    }
    var module = ensure(naba, MODULES_NAME, function () {
        return function (name, requires) {
            if (requires) {
                return createModule(name, requires, modules);
            } else {
                return getModule(name, modules);
            }
        };
    });
}




export { setupModuleLoader }