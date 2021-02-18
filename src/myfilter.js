import { filter, forEach, isString, isFunction, isObject, isNull, isUndefined, startsWith, isEmpty, isArray } from "lodash"

function filterFilter() {
    return function (arr, filterFn, comparator) {
        if (comparator === true) {
            compare = function (actual, expected) {
                return (actual === expected)
            }
        } else if (isFunction(comparator)) {
            compare = comparator
        }
        var newArr = [];
        switch (typeof filterFn) {
            case 'string':
            case 'number':
            case 'boolean':
            case 'object':
                forEach(arr, function (eachEl, index) {
                    if (isObject(eachEl) || (isObject(filterFn))) {
                        if (findMatching(eachEl, filterFn)) newArr.push(eachEl)
                    } else {
                        if (compare(eachEl, filterFn)) newArr.push(eachEl);
                    }
                })
                break;
            case "function":
                forEach(arr, function (eachEl, index) {
                    if (filterFn(eachEl)) newArr.push(eachEl)
                })
                break;
            default:
                break;
        }
        return newArr;
    }

    function compareObjects(actual, expected) {
        var totalToCheck = Object.keys(expected).length
        var checked = 0;
        for (var key in expected) {
            if (!expected[key]) { return true } // if it's undefined, return everything
            if (actual[key] || isArray(actual)) {
                if (isObject(expected[key])) {
                    if (isArray(actual)) {
                        for (var actKey in actual) {
                            return compareObjects(actual[actKey], expected)
                        }
                    }
                    return compareObjects(actual[key], expected[key])
                }
            }

            if (key === "$") {
                if (isObject(actual)) {
                    for (var actK in actual) {
                        if (isObject(actual[actK])) {
                            if (findMatching(actual[actK], expected[key])) checked++
                        } else {
                            // skip because it does not have a following one
                            if (isObject(expected[key])) {
                                continue;                                
                            }
                            if (findMatching(actual, expected[key])) return true
                        }
                    }
                } else {
                    if (findMatching(actual, expected[key])) return true
                }
            } else {
                if (compare(actual[key], expected[key])) checked++
            }

            if (checked === totalToCheck) {
                return true
            }
        }
        return false
    }

    function findMatching(object, str) {
        if (isObject(str)) {
            if (isEmpty(str)) return true
            return compareObjects(object, str)
        }

        // if they are not objects
        if (!isObject(object) && !isObject(str)) return compare(object, str)

        // if they are objects
        for (var key in object) {
            if (isArray(object)) {
                if (findMatching(object[key], str)) return true
            } else {
                if (isObject(object[key])) {
                    return findMatching(object[key], str)
                }
                if (compare(object[key], str)) return true

            }
        }
    }
}

function compare(actual, expected) {
    var negateCompare = false
    if (isNull(expected)) return (actual === expected)
    if (isNull(actual) || isUndefined(actual)) return false
    actual = ('' + actual).toLowerCase();
    if (startsWith(expected, '!')) {
        expected = expected.substring(1)
        negateCompare = true;
    }
    expected = ('' + expected).toLowerCase();
    return (negateCompare) ? !actual.includes(expected) : actual.includes(expected);
}

export { filterFilter }