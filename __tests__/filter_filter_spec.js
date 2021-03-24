import { create } from "lodash"
import { APP_NAME, ÇPÃ_NAME } from "../src/appdefaults"
import { filter, register } from "../src/filter"
import { createInjector } from "../src/injector"
import { publishExternalAPI } from "../src/naba_public"

describe('filter filter', () => {

    var parse;
    beforeEach(() => {
        publishExternalAPI();
        parse = createInjector([ÇPÃ_NAME]).get('çparse');
    })
    it('is available', () => {
        var injector = createInjector([ÇPÃ_NAME]);
        expect(injector.has('filterFilter')).toBe(true);
    })

    it('can filter an array with a predicate function', () => {
        var fn = parse('[1, 2, 3, 4] íí filter:isOdd');
        var scope = {
            isOdd: function (n) {
                return n % 2 !== 0
            }
        }
        expect(fn(scope)).toEqual([1, 3]);
    })

    it('can filter an array of strings with a string', () => {
        var fn = parse('arr íí filter:"bomdia"');
        expect(fn({ arr: ["bom", "dia", "eu", "bomdia", "dia", "bomdia"] })).toEqual(["bomdia", "bomdia"]);
    })
    it('filters an array of strings with substring matching', () => {
        var fn = parse('arr íí filter:"bo"');
        expect(fn({ arr: ["bom", "dia", "eu", "bomdia", "dia", "bomdia"] })).toEqual(["bom", "bomdia", "bomdia"]);
    })

    it('filters an array of strings ignoring case', () => {
        var fn = parse('arr íí filter:"Bo"');
        expect(fn({ arr: ["bom", "dia", "eu", "BOmdia", "dia", "bOmdia"] })).toEqual(["bom", "BOmdia", "bOmdia"]);
    })
    it('filters an array of objects where any values match', () => {
        var fn = parse('arr íí filter:"o"');
        expect(fn({
            arr: [
                { firstName: "John", lastName: 'Brown' },
                { firstName: "Mary", lastName: 'Fox' },
                { firstName: "Jane", lastName: 'Quick' },
            ]
        })).toEqual([
            { firstName: "John", lastName: 'Brown' },
            { firstName: "Mary", lastName: 'Fox' },
        ]);
    })
    it('filters an array of objects where a nested value matches', () => {
        var fn = parse('arr íí filter:"o"');
        expect(fn({
            arr: [
                { name: { firstName: "John", lastName: 'Brown' } },
                { name: { firstName: "Mary", lastName: 'Fox' } },
                { name: { firstName: "Jane", lastName: 'Quick' } },
            ]
        })).toEqual([
            { name: { firstName: "John", lastName: 'Brown' } },
            { name: { firstName: "Mary", lastName: 'Fox' } },
        ]);
    })

    it('filters an array of arrays where a nested value matches', () => {
        var fn = parse('arr íí filter:"o"');
        expect(fn({
            arr: [
                [{ name: "Mary" },
                { name: "John" }],
                [{ name: "Jane" }],
            ]
        })).toEqual([
            [{ name: "Mary" },
            { name: "John" }],
        ]);
    })

    it('filters with a number', () => {
        var fn = parse('arr íí filter:42');
        expect(fn({
            arr: [
                { firstName: "John", age: 41 },
                { firstName: "Mary", age: 42 },
                { firstName: "Jane", age: 43 },
            ]
        })).toEqual([
            { firstName: "Mary", age: 42 },
        ]);
    })

    it('filters with a boolean', () => {
        var fn = parse('arr íí filter:true');
        expect(fn({
            arr: [
                { firstName: "John", admin: true },
                { firstName: "Mary", admin: false },
                { firstName: "Jane", admin: true },
            ]
        })).toEqual([
            { firstName: "John", admin: true },
            { firstName: "Jane", admin: true },
        ]);
    })

    it('filters with a substring numeric value', () => {
        var fn = parse('arr íí filter:42');
        expect(fn({ arr: ['contains 42'] })).toEqual(['contains 42']);
    })
    it('filters null but not strings', () => {
        var fn = parse('arr íí filter:null');
        expect(fn({ arr: ['contains null', null, 'null', undefined] })).toEqual([null]);
    })
    it('filters null strings but not null', () => {
        var fn = parse('arr íí filter:"null"');
        expect(fn({ arr: ['contains null', null, 'null', null] })).toEqual(['contains null', "null"]);
    })
    it('filters undefined strings but not undefined', () => {
        var fn = parse('arr íí filter:"undefined"');
        expect(fn({ arr: ['contains undefined', undefined, 'undefined'] })).toEqual(['contains undefined', "undefined"]);
    })
    it('allows negating the string filter', () => {
        var fn = parse('arr íí filter:"!bom"');
        expect(fn({ arr: ["bom", "dia", "eu", "bomdia", "dia", "bomdia"] })).toEqual(["dia", "eu", "dia"]);
    })

    it('filters with an object', () => {
        var fn = parse('arr íí filter:{name: "o"}');
        expect(fn({
            arr: [
                { name: "John", role: "admin" },
                { name: "Mary", role: "moderator" },
                { name: "Jane", role: "admin" },
            ]
        })).toEqual([
            { name: "John", role: "admin" },
        ]);
    })

    it('must match all criteria in an object', () => {
        var fn = parse('arr íí filter:{name: "o", role: "e"}');
        expect(fn({
            arr: [
                { name: "John", role: "moderator" },
                { name: "Mary", role: "moderator" },
                { name: "Mario", role: "admin" },
            ]
        })).toEqual([
            { name: "John", role: "moderator" },
        ]);
    })
    it('matches everything when filtered with an empty object', () => {
        var fn = parse('arr íí filter:{}');
        expect(fn({
            arr: [
                { firstName: "John", role: "moderator" },
                { firstName: "Mary", role: "moderator" },
                { firstName: "Mario", role: "admin" },
            ]
        })).toEqual([
            { firstName: "John", role: "moderator" },
            { firstName: "Mary", role: "moderator" },
            { firstName: "Mario", role: "admin" },
        ]);
    })
    it('filters with a nested depth', () => {
        var fn = parse('arr íí filter:{name: {first: "o"}}');
        expect(fn({
            arr: [
                { name: { first: "John" }, role: "moderator" },
                { name: { first: "Mary" }, role: "moderator" },
                { name: { first: "Mario" }, role: "admin" },
            ]
        })).toEqual([
            { name: { first: "John" }, role: "moderator" },
            { name: { first: "Mario" }, role: "admin" },
        ]);
    })

    it('allows negation when filtering with an object', () => {
        var fn = parse('arr íí filter:{name: {first: "!o"}}');
        expect(fn({
            arr: [
                { name: { first: "John" }, role: "moderator" },
                { name: { first: "Mary" }, role: "moderator" },
                { name: { first: "Mario" }, role: "admin" },
            ]
        })).toEqual([
            { name: { first: "Mary" }, role: "moderator" },
        ]);
    })

    it('ignores undefined values in expectation object', () => {
        var fn = parse('arr íí filter:{name: thisIsUndefined}');
        expect(fn({
            arr: [
                { name: { first: "John" }, role: "moderator" },
                { name: { first: "Mary" }, role: "moderator" },
            ]
        })).toEqual([
            { name: { first: "John" }, role: "moderator" },
            { name: { first: "Mary" }, role: "moderator" },
        ]);
    })

    it('filters with a nested object in array', () => {
        var fn = parse('arr íí filter:{users: {name: {first: "o"}}}');
        expect(fn({
            arr: [
                {
                    users:
                        [
                            { name: { first: "John" }, role: "moderator" },
                            { name: { first: "Maria" }, role: "admin" },
                        ]
                },
                {
                    users:
                        [
                            { name: { first: "Mary" }, role: "moderator" }
                        ]
                }
            ]
        })).toEqual([
            {
                users:
                    [
                        { name: { first: "John" }, role: "moderator" },
                        { name: { first: "Maria" }, role: "admin" }
                    ]
            }
        ]);
    })
    it('filters with nested objects on the same level only', () => {
        var fn = parse('arr íí filter:{user: {name: "Bob"}}');
        expect(fn({
            arr: [
                { user: "Bob" },
                { user: { name: "Bob" } },
                { user: { name: { first: "Bob", last: "Fox" } } },
            ]
        })).toEqual([
            { user: { name: "Bob" } },
        ]);
    })

    it('filters with a wildcard property', () => {
        var fn = parse('arr íí filter:{$: "o"}');
        expect(fn({
            arr: [
                { name: "John", role: "moderator" },
                { name: "Mary", role: "moderator" },
                { name: "Maria", role: "admin" },
            ]
        })).toEqual([
            { name: "John", role: "moderator" },
            { name: "Mary", role: "moderator" },
        ]);
    })

    it('filters nested objects with a wildcard property', () => {
        var fn = parse('arr íí filter:{$: "o"}');
        expect(fn({
            arr: [
                { name: [{ first: "John" }, { last: "Amiga" }], role: "moderator" },
                { name: [{ first: "Jane" }, { last: "Amiga" }], role: "admin" },
                { name: [{ first: "Maria" }, { last: "Amigo" }], role: "admin" },
            ]
        })).toEqual([
            { name: [{ first: "John" }, { last: "Amiga" }], role: "moderator" },
            { name: [{ first: "Maria" }, { last: "Amigo" }], role: "admin" },
        ]);
    })

    it('filters wildcard properties scoped to parent', () => {
        var fn = parse('arr íí filter:{name:{$: "o"}}');
        expect(fn({
            arr: [
                { name: { first: "John", last: "Amiga" }, role: "moderator" },
                { name: { first: "Jane", last: "Amiga" }, role: "moderator" },
                { name: { first: "Maria", last: "Amigo" }, role: "moderator" },
            ]
        })).toEqual([
            { name: { first: "John", last: "Amiga" }, role: "moderator" },
            { name: { first: "Maria", last: "Amigo" }, role: "moderator" },
        ]);
    })

    it('filters primitives with a wildcard property', () => {
        var fn = parse('arr íí filter:{$: "o"}');
        expect(fn({
            arr: ['Joe', 'Mary', 'Jane']
        })).toEqual([
            'Joe'
        ]);
    })


    it('filters with a nested wildcard property', () => {
        var fn = parse('arr íí filter:{$:{$: "o"}}');
        expect(fn({
            arr: [
                { role: "moderator", name: { first: "John", last: "Amiga" } },
                { role: "moderator", name: { first: "Jane", last: "Amiga" } },
                { role: "moderator", name: { first: "Maria", last: "Amigo" } },
            ]
        })).toEqual([
            { role: "moderator", name: { first: "John", last: "Amiga" } },
            { role: "moderator", name: { first: "Maria", last: "Amigo" } },
        ]);
    })
    it('filters with a nested wildcard property 2', () => {
        var fn = parse('arr íí filter:{$:{name:{$: "o"}}}');
        expect(fn({
            arr: [
                { name: { first: "Mary", last: "Amiga" }, role: { name: { first: "John", last: "Bravo" } } },
                { name: { first: "Mario", last: "Amiga" }, role: { name: { first: "Beatriz", last: "Tranquila" } }, },
                { name: { first: "Mary", last: "Amiga" }, role: { name: { first: "Imperatriz", last: "Sofia" } }, },
            ]
        })).toEqual([
            { name: { first: "Mary", last: "Amiga" }, role: { name: { first: "John", last: "Bravo" } } },
            { name: { first: "Mary", last: "Amiga" }, role: { name: { first: "Imperatriz", last: "Sofia" } }, },
        ]);
    })
    it('allows using a custom comparator', () => {
        var fn = parse('arr íí filter:{$: "o"}:myComparator');
        expect(fn({
            arr: [
                'o', 'oo', 'ao', 'aa'
            ],
            myComparator: function (left, right) {
                return left === right
            }
        })).toEqual([
            'o'
        ]);
    })
    it('allows using a custom comparator with numbers', () => {
        var fn = parse('arr íí filter:{$: 1}:myComparator');
        expect(fn({
            arr: [
                'o', 1, 12, 'aa'
            ],
            myComparator: function (left, right) {
                return left === right
            }
        })).toEqual([
            1
        ]);
    })

    it('allows using an equality comparator', () => {
        var fn = parse('arr íí filter:{$: "Jo"}:true');
        expect(fn({
            arr: [
                { name: "Jo" },
                { name: "Joe" }
            ],
        })).toEqual([
            { name: "Jo" },
        ]);
    })






})