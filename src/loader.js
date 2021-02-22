
function setupModuleLoader(window) {
    var APP_NAME = "naba"
    var MODULES_NAME = "module"

    var ensure = function (obj, name, factory) {
        return obj[name] || (obj[name] = factory()) // if he already exists, just let it be, otherwise just assign empty value
    };
    var naba = ensure(window, APP_NAME, Object); // lindo, a factory é o método Object... Object() === new Object()

    var createModule = function (name, requires) {
        var moduleInstance = {
            name: name,
            requires: requires
        };
        return moduleInstance;
    }
    var module = ensure(naba, MODULES_NAME, function () {
        return function (name, requires) {
            return createModule(name, requires);
        };
    });

}




export { setupModuleLoader }