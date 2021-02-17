import { filter, isBoolean, isFunction, isNull, isArray, isNumber, isObject, startsWith, isString, isUndefined, some, every, toPlainObject } from "lodash";

function filterFilter() {
    return function (arr, filterFn) {
        var predicateFn;
        if (isFunction(filterFn)) {
            predicateFn = filterFn;
        } else if (
            isString(filterFn) ||
            isNumber(filterFn) ||
            isBoolean(filterFn) ||
            isNull(filterFn) ||
            isObject(filterFn)
        ) {
            predicateFn = createPredicateFn(filterFn);
        } else {
            return arr;
        }
        return filter(arr, predicateFn);
    }
};

function createPredicateFn(expression) {
    function comparator(actual, expected) {
        if (isUndefined(actual)) {
            return false;
        }
        if (isNull(actual) || isNull(expected)) {
            return actual === expected;
        }
        actual = ('' + actual).toLowerCase();
        expected = ('' + expected).toLowerCase();
        return actual.indexOf(expected) !== -1;
    }
    return function predicateFn(item) {
        return deepCompare(item, expression, comparator, true);
    }
}

function deepCompare(actual, expected, comparator, matchAnyProperty) {
    if (isString(expected) && startsWith(expected, '!')) {
        return !deepCompare(actual, expected.substring(1), comparator, matchAnyProperty); // inteligente para xuxu
    }
    if (isArray(actual)) {
        return some(actual, function (actualItem) {
            return deepCompare(actualItem, expected, comparator, matchAnyProperty)
        })
    }
    if (isObject(actual)) {
        if (isObject(expected)) {
            return every(toPlainObject(expected), // this has to do with inheritance
                function (expectedVal, expectedKey) {
                    if (isUndefined(expectedVal)) {
                        return true;
                    }
                    return deepCompare(actual[expectedKey], expectedVal, comparator);
                })
        } else if (matchAnyProperty){
            return some(actual, function (value) {
                return deepCompare(value, expected, comparator, matchAnyProperty);
            })
        } else {
            return comparator(actual, expected);
        }
    } else {
        return comparator(actual, expected);
    }
}

export { filterFilter };