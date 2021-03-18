import { APP_NAME, MODULES_NAME } from "./appdefaults";

function setupModuleLoader(window) {
    var modules = {}

    var ensure = function (obj, name, factory) {
        return obj[name] || (obj[name] = factory()) // if he already exists, just let it be, otherwise just assign empty value
    };
    var naba = ensure(window, APP_NAME, Object); // lindo, a factory é o método Object... Object() === new Object()

    var createModule = function (name, requires, modules, configFn) {
        if (name === 'hasOwnProperty') throw 'hasOwnProperty is not a valid module name'
        var invokeQueue = [];
        var configBlocks = [];

        var invokeLater = function (service, method, arrayMethod, queue) {
            return function(){
                queue = queue || invokeQueue;
                queue[arrayMethod || 'push']([service, method, arguments]); // inteligente para xuxu este gajo
                return moduleInstance;
            }
        }
    
        var moduleInstance = {
            name: name,
            requires: requires, 
            constant: invokeLater('çprovide','constant', 'unshift'),
            provider: invokeLater('çprovide','provider'),
            factory: invokeLater('çprovide','factory'),
            value: invokeLater('çprovide','value'),
            service: invokeLater('çprovide','service'),
            config: invokeLater('çinjector','invoke', 'push', configBlocks),
            run: function(fn){
                moduleInstance._runBlocks.push(fn);
                return moduleInstance;
            },
            _invokeQueue: invokeQueue,
            _configBlocks: configBlocks,
            _runBlocks: [],
        };

        if (configFn) {
            moduleInstance.config(configFn);
        }

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
        return function (name, requires, configFn) {
            if (requires) {
                return createModule(name, requires, modules, configFn);
            } else {
                return getModule(name, modules);
            }
        };
    });
}




export { setupModuleLoader }