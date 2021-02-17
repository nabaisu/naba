import { filter, forEach, isFunction, isObject, isString, some } from "lodash";

function filterFilter() {
    return function (arr, filterFn) {
        var predicateFn;
        if (isFunction(filterFn)) {
            predicateFn = filterFn;            
        } else if (isString(filterFn)) {
            predicateFn = createPredicateFn(filterFn);
        } else {
            return arr;
        }

        return filter(arr, predicateFn);
    }
};

function createPredicateFn(expression){ 
    function comparator(actual, expected) {
        actual = actual.toLowerCase();
        expected = expected.toLowerCase();
        return actual.indexOf(expected) !== -1; 
    }
    return function predicateFn(item){
        return deepCompare(item, expression, comparator);
    }
}

function deepCompare(actual, expected, comparator){
    if (isObject(actual)) {
        return some(actual, function(value){
            return deepCompare(value, expected, comparator);
        })
    } else {
        return comparator(actual, expected);
    }
}

export { filterFilter };