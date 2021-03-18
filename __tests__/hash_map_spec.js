import { constant } from "lodash";
import { hashKey, HashMap } from "../src/hash_map";

describe('Hash', () => {
    describe('hashKey', () => {
        it('is undefined:undefined for undefined', () => {
            expect(hashKey(undefined)).toEqual('undefined:undefined');
        })
        it('is object:null for null', () => {
            expect(hashKey(null)).toEqual('object:null');
        })
        it('is boolean:true or false for booleans', () => {
            expect(hashKey(true)).toEqual('boolean:true');
            expect(hashKey(false)).toEqual('boolean:false');
        })
        it('is number:num for numbers', () => {
            expect(hashKey(42)).toEqual('number:42');
            expect(hashKey(24)).toEqual('number:24');
        })
        it('is string:value for numbers', () => {
            expect(hashKey("42")).toEqual('string:42');
            expect(hashKey("bom dia")).toEqual('string:bom dia');
        })
        it('is object:[unique id] for objects', () => {
            expect(hashKey({})).toMatch(/^object:\S+$/);
        })
        it('is stable when replicating the same object many times', () => {
            var obj = {};
            expect(hashKey(obj)).toEqual(hashKey(obj));
        })
        it('does not change when object value changes', () => {
            var obj = { a: 42 };
            var hash1 = hashKey(obj);
            obj.a = 43;
            var hash2 = hashKey(obj);
            expect(hash1).toEqual(hash2);
        })
        it('is not the same for different objects even with the same solution', () => {
            var obj1 = { a: 42 };
            var obj2 = { a: 42 };
            expect(hashKey(obj1)).not.toEqual(hashKey(obj2));
        })
        it('is function:[unique id] for functions', () => {
            var fn = function (a) { return a; };
            expect(hashKey(fn)).toMatch(/^function:\S+$/);
        })
        it('is the same key when asked for the same function many times', () => {
            var fn = function () { };
            expect(hashKey(fn)).toEqual(hashKey(fn));
        })
        it('is not the same for different identical functions', () => {
            var fn1 = function () { return 42; };
            var fn2 = function () { return 42; };
            expect(hashKey(fn1)).not.toEqual(hashKey(fn2));
        })
        it('stores the hash key in the ççhashkey attribute', () => {
            var obj = { a: 42 };
            var hash = hashKey(obj);
            expect(obj.ççhashkey).toEqual(hash.match(/^object:(\S+)$/)[1]);
        })
        it('uses preassigned ççhashKey', () => {
            expect(hashKey({ ççhashkey: 42 })).toEqual('object:42');
        })

        it('supports a function ççhashKey', () => {
            var obj = { ççhashkey: constant(42) };
            expect(hashKey(obj)).toEqual('object:42');
        })
        it('calls the function ççhashKey as a method with the correct this', () => {
            var obj = {
                ççhashkey: function () {
                    return this.a
                }, a: 42
            };
            expect(hashKey(obj)).toEqual('object:42');
        })

        describe('hashMap', () => {
            var map;
            beforeEach(() => {
                map = new HashMap();
            });
            it('supports put and get of primitives', () => {
                map.put(42, 'fourty two');
                expect(map.get(42)).toEqual('fourty two');
            })
            it('supports put and get objects with hashKey semantics', () => {
                var obj = {};
                map.put(obj, 'my value');
                expect(map.get(obj)).toEqual('my value');
                expect(map.get({})).toBeUndefined();
            })
            it('supports remove', () => {
                map.put(42, 'fourty two');
                map.remove(42);
                expect(map.get(42)).toBeUndefined();
            })
            it('returns value from remove', () => {
                map.put(42, 'fourty two');
                var removed = map.remove(42);
                expect(removed).toEqual('fourty two');
            })

        })

    })
})