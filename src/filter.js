import { isObject, map} from "lodash";

var filters = {};

function filter(name) {
    return filters[name]
}

function register(name, factory) {
    
    if (isObject(name)) {
        return map(name, function(factory, name) {  // inteligente isto
            return register(name, factory);
        })
    } else {
        var filter = factory();
        filters[name] = filter;
        return filter;
    }
}

export {filter, register}