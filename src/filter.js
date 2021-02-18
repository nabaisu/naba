import { isObject, map} from "lodash";
import {filterFilter} from './filter_filter'
//import {filterFilter} from './myfilter'

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

register('filter', filterFilter);

export {filter, register}