import { filter, isBoolean, isFunction, isNull, isArray, isNumber, isObject, startsWith, isString, isUndefined, some, every, toPlainObject, isEqual } from "lodash";

function filterFilter() {
    return function (arr, filterFn, comparator) {
        console.log(comparator);
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
            predicateFn = createPredicateFn(filterFn, comparator);
        } else {
            return arr;
        }
        return filter(arr, predicateFn);
    }
};

function createPredicateFn(expression, comparator) {
    var shouldMatchPrimitives = isObject(expression) && ('$' in expression)
    if (comparator === true) {
        comparator = isEqual;
    }    else if (!isFunction(comparator)) {
        comparator = function (actual, expected) {
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
    }
    return function predicateFn(item) {
        if (shouldMatchPrimitives && !isObject(item)) {
            return deepCompare(item, expression.$, comparator);
        }
        return deepCompare(item, expression, comparator, true);
    }
}

function deepCompare(actual, expected, comparator, matchAnyProperty, inWildcard) {
    if (isString(expected) && startsWith(expected, '!')) {
        return !deepCompare(actual, expected.substring(1), comparator, matchAnyProperty); // inteligente para xuxu
    }
    if (isArray(actual)) {
        return some(actual, function (actualItem) {
            return deepCompare(actualItem, expected, comparator, matchAnyProperty)
        })
    }
    if (isObject(actual)) {
        if (isObject(expected) && !inWildcard) {
            return every(toPlainObject(expected), // this has to do with inheritance
                function (expectedVal, expectedKey) {
                    if (isUndefined(expectedVal)) {
                        return true;
                    }
                    var isWildCard = (expectedKey === "$")
                    var actualVal = isWildCard ? actual : actual[expectedKey];
                    return deepCompare(actualVal, expectedVal, comparator, isWildCard, isWildCard);
                })
        } else if (matchAnyProperty) {
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