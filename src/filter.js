import { bind, isObject, map } from "lodash";
import { filterFilter } from './filter_filter'
//import {filterFilter} from './myfilter'

function çFilterProvider(çprovide) {

    var filters = {};

    this.register = function (name, factory) {
        if (isObject(name)) {
            return map(name, bind(function (factory, name) {  // inteligente isto
                return this.register(name, factory);
            }, this));
        } else {
            return çprovide.factory(name + 'Filter', factory);
        }
    };

    this.çget = ['çinjector', function (çinjector) {
        return function filter(name) {
            return çinjector.get(name + 'Filter');
        };
    }];

    this.register('filter', filterFilter);
}
çFilterProvider.çinject = ['çprovide']

export { çFilterProvider }