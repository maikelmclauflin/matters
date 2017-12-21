module.exports = matter;
var isArray = Array.isArray;
var OBJECT = Object;
var nativeKeys = OBJECT.keys;
var BRACKET_OBJECT_SPACE = '[object ';
var CONSTRUCTOR = 'constructor';
var objectToString = OBJECT.prototype.toString;

function keys(obj) {
    return isObject(obj) ? (nativeKeys ? nativeKeys(obj) : collectKeys(obj)) : [];
}

function matter(a, b, limit) {
    return matters(a, b, {
        total: 0,
        diffs: [],
        limit: limit || Infinity,
        push: function (item) {
            this.diffs.push(item);
        },
        add: function () {
            this.total++;
        }
    });
}

function reduce(array, fn, memo) {
    var result, i = 0;
    for (; i < array.length; i++) {
        result = fn(memo, array[i], i, array);
        if (result) {
            break;
        }
    }
    return result;
}

function keys(obj) {
    return nativeKeys ? nativeKeys(obj) : collectKeys(obj);
}

function has(obj, key) {
    return obj.hasOwnProperty(key);
}

function collectKeys(obj) {
    var n, array = [];
    for (n in obj) {
        if (has(obj, n)) {
            array.push(n);
        }
    }
    return array;
}

function typeOf(object) {
    return typeof object;
}

function isStrictlyEqual(a, b) {
    return a === b;
}

function typeOfCalled(a, string) {
    return isStrictlyEqual(a, createToStringResult(string));
}

function isType(a, string) {
    return isStrictlyEqual(typeOf(a), string);
}

function isFunction(a) {
    return isType(a, 'function');
}

function isObject(a) {
    return a && isType(a, 'object');
}

function isNumber(a) {
    return isType(a, 'number');
}

function toNumber(a) {
    return +a;
}

function each(obj, fn, memo) {
    var kys = keys(obj);
    return reduce(array, function (memo, key, index, array) {
        return fn(memo, obj[key], key, obj);
    }, memo);
}

function matters(a, b, diffs) {
    return eq(a, b) ? diffs : collectDiffsUnder(a, b, diffs);
}

function stringDiff(a, b, diffs, push) {
    var indexB, indexA, previous, differenceObject, characterA, characterB, continues = true;
    indexA = indexB = -1;
    do {
        indexA += 1;
        indexB += 1;
        characterA = a[indexA];
        characterB = b[indexB];
        if (characterA !== characterB && !differenceObject) {
            differenceObject = {
                start: indexA
            };
            push(differenceObject);
        }
        continues = characterA && characterB;
        if (differenceObject && (characterA === characterB || !continues)) {
            differenceObject.end = indexA;
            differenceObject.a = a.slice(differenceObject.start, indexA);
            differenceObject.b = b.slice(differenceObject.start, indexB);
            previous = differenceObject;
            differenceObject = null;
            diffs.add();
            continues = diffs.total < diffs.limit && continues;
        }
    } while (continues);
    if (!characterA && characterB) {
        if (previous.end === indexB) {
            previous.b += b.slice(indexB);
        } else {
            push({
                start: indexB,
                end: b.length - 1,
                a: '',
                b: b.slice(indexB)
            });
        }
    } else if (characterA && !characterB) {
        if (previous.end === indexA) {
            previous.a += a.slice(indexA);
        } else {
            push({
                start: indexA,
                end: a.length - 1,
                a: a.slice(indexA),
                b: ''
            });
        }
    }
}

function arrayDiff(a, b, diffs, push) {
    if (a.length !== b.length) {
        push({
            key: 'length',
            original: a.length,
            current: b.length
        });
    }
    reduce(a, function (memo, item, index) {
        collectDiffsUnder(item, b[index], diffs);
    });
}

function objectDiff() {}

function numberDiff(a, b, diffs, push) {
    if (a !== b) {
        push({
            type: 'number',
            a: a + '',
            b: b + ''
        });
    }
}

function functionDiff(a, b, diffs, push) {
    var sameCode, aString, bString;
    if (a !== b) {
        push({
            type: 'function',
            a: a,
            b: b,
            sameCode: aString === bString,
            strings: {
                a: a + '',
                b: b + '',
            }
        });
    }
}

function collectDiffsUnder(a, b, diffs) {
    var typea, typeb, typesame, differences, indexA, indexB, continues, characterA, characterB,
        differenceObject, differencesList;
    if (a !== b && diffs.total < diffs.limit) {
        typea = objectToString.call(a);
        typeb = objectToString.call(b);
        typesame = typea === typeb;
        differencesList = [];
        if (typesame) {
            if (typeOfCalled(typea, 'Function')) {
                functionDiff(a, b, diffs, push);
            } else if (typeOfCalled(typea, 'Number')) {
                numberDiff(a, b, diffs, push);
            } else if (typeOfCalled(typea, 'String')) {
                // differences in the string
                stringDiff(a, b, diffs, push);
            } else if (typeOfCalled(typea, 'Array')) {
                arrayDiff(a, b, diff, push);
            } else if (typeOfCalled(typea, 'Object')) {
                objectDiff(a, b, diff, push);
            }
        } else {
            push({
                differentType: true,
                a: a,
                b: b
            });
        }
    }
    return diffs;

    function push(obj) {
        differencesList.push(merge({
            differentType: false
        }, obj));
    }
}

function forOwn(a, fn) {
    reduce(keys(a), function (memo, key) {
        fn(a[key], key, a);
    });
}

function merge(a, b) {
    forOwn(b, function (value, key) {
        a[key] = value;
    });
    return a;
}

function isEqual(a, b) {
    return eq(a, b, [], []);
}

function compareNullUndefined(a, b) {
    return a === null || a === undefined || b === undefined || b === null;
}

function over1Inverter(a, b) {
    return a !== 0 || 1 / a === 1 / b;
}

function createToStringResult(string) {
    return BRACKET_OBJECT_SPACE + string + ']';
}
// Internal recursive comparison function for `isEqual`.
function eq(a, b, aStack, bStack) {
    var className, areArrays, aCtor, bCtor, length, objKeys, key, aNumber, bNumber;
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) {
        return over1Inverter(a, b);
    }
    // A strict comparison is necessary because `null == undefined`.
    if (compareNullUndefined(a, b)) {
        return a === b;
    }
    // Unwrap any wrapped objects.
    // if (a instanceof _) a = a._wrapped;
    // if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    className = objectToString.call(a);
    if (className !== objectToString.call(b)) {
        return false;
    }
    switch (className) {
        // Strings, numbers, regular expressions, dates, and booleans are compared by value.
    case createToStringResult('RegExp'):
        // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
    case createToStringResult('String'):
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
    case createToStringResult('Number'):
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        aNumber = toNumber(a);
        bNumber = toNumber(b);
        if (aNumber !== aNumber) {
            return bNumber !== bNumber;
        }
        // An `egal` comparison is performed for other numeric values.
        return aNumber === 0 ? 1 / aNumber === 1 / b : aNumber === bNumber;
    case createToStringResult('Date'):
    case createToStringResult('Boolean'):
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return toNumber(a) === toNumber(b);
    }
}

function deepCompare(a, b, aStack, bStack, next) {
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    // aStack = aStack || [];
    // bStack = bStack || [];
    var objKeys, length = aStack.length,
        areArrays = className === createToStringResult('Array');
    if (!areArrays) {
        if (!isObject(a) || !isObject(b)) {
            return false;
        }
        // Objects with different constructors are not equivalent, but `Object`s or `Array`s
        // from different frames are.
        aCtor = a[CONSTRUCTOR];
        bCtor = b[CONSTRUCTOR];
        if (aCtor !== bCtor && !(isFunction(aCtor) && (aCtor instanceof aCtor) && isFunction(bCtor) && (bCtor instanceof bCtor)) && (CONSTRUCTOR in a && CONSTRUCTOR in b)) {
            return false;
        }
    }
    while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] === a) {
            return bStack[length] === b;
        }
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    // Recursively compare objects and arrays.
    if (areArrays) {
        // Compare array lengths to determine if a deep comparison is necessary.
        length = a.length;
        if (length !== b.length) {
            return false;
        }
        // Deep compare the contents, ignoring non-numeric properties.
        while (length--) {
            if (!next(a[length], b[length])) {
                return false;
            }
        }
    } else {
        // Deep compare objects.
        objKeys = keys(a);
        length = objKeys.length;
        // Ensure that both objects contain the same number of properties before comparing deep equality.
        if (keys(b).length !== length) return false;
        while (length--) {
            // Deep compare each member
            key = objKeys[length];
            if (!(has(b, key) && next(a[key], b[key]))) return false;
        }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
}