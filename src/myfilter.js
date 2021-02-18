import { filter, forEach, isString, isFunction, isObject, isNull, isUndefined, startsWith } from "lodash"

function filterFilter() {
    return function (arr, filterFn) {
        var newArr = [];
        console.log(typeof filterFn);
        switch (typeof filterFn) {
            case 'string':
            case 'number':
            case 'boolean':
            case 'object':
                forEach(arr, function (eachEl, index) {
                    if (isObject(eachEl)) {
                        if (findMatching(eachEl, filterFn)) {
                            newArr.push(eachEl)
                        }
                    } else if (isNull(filterFn)) {
                        if (eachEl === filterFn){
                            newArr.push(eachEl);
                        }
                    } else {
                        if (startsWith(filterFn, "!")) {
                            if (!compare(eachEl, filterFn.substring(1))) {
                                newArr.push(eachEl);
                            }
                        } else {
                            if (compare(eachEl, filterFn)) {
                                newArr.push(eachEl);
                            }
                        }
                    }
                })
                break;
            case "function":
                forEach(arr, function (eachEl, index) {
                    if (filterFn(eachEl)) {
                        newArr.push(eachEl)
                    }
                })
                break;
            default:
                break;
        }
        return newArr;
    }

    function deepCompare(actual, expected, toCompare) {

    }

    function findMatching(object, str) {
        for (var key in object) {
            if (isObject(object[key])) {
                return findMatching(object[key], str)
            }
            if (compare(object[key], str)) {
                return true
            }
        }
        return false
    }
}

function compare(actual, expected) {
    if (isNull(actual) || isUndefined(actual)) return false
    var ac = ('' + actual).toLowerCase();
    var ex = ('' + expected).toLowerCase();
    return ac.includes(ex);
}

export { filterFilter }